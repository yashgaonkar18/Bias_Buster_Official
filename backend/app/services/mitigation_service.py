from sqlalchemy.ext.asyncio import AsyncSession
from app.models.bias import BiasReport
from app.models.mitigation import MitigationReport
from app.models.models import UploadRecord
from app.utils.dataset_loader import load_dataset
from app.utils.model_loader import load_model
from app.services.bias_service import run_bias_detection_from_objects
from app.utils.target_encoder import encode_target_column
from app.utils.recommender import recommend_strategy

from app.utils.smote import apply_smote
from app.utils.reweighting import compute_sample_weights
from app.utils.threshold import apply_threshold_optimizer
from sklearn.base import clone
import pandas as pd
from fairlearn.postprocessing import ThresholdOptimizer
from sklearn.pipeline import Pipeline


async def get_mitigation_recommendation(report_id: int, session: AsyncSession):
    bias_report = await session.get(BiasReport, report_id)
    if not bias_report:
        raise ValueError("Bias report not found")
        
    upload = await session.get(UploadRecord, bias_report.upload_id)
    if not upload:
        raise ValueError("Upload record not found")

    bias_driver = bias_report.bias_driver
    # Extract fairness metrics specifically for the main bias driver
    fairness_metrics = bias_report.sensitive_audit.get(bias_driver, {}) if bias_driver else {}

    metrics = {
        "fairness": fairness_metrics,
        "performance": {"accuracy": 0} # Real performance can be injected here if stored
    }
    
    dataset_shape = {
        "rows": upload.dataset_rows or 0,
        "columns": upload.dataset_columns or 0
    }
    
    recommendation = recommend_strategy(metrics, dataset_shape, upload.model_type)
    return recommendation

async def run_optimization(report_id: int, strategy: str, session: AsyncSession):
    bias_report = await session.get(BiasReport, report_id)
    if not bias_report:
        raise ValueError("Bias report not found")

    upload = await session.get(UploadRecord, bias_report.upload_id)
    if not upload:
        raise ValueError("Upload record not found")

    df = load_dataset(upload.dataset_filename)
    model = load_model(upload.model_filename)

    target_column = bias_report.target_info["target_column"]
    if bias_report.sensitive_attributes and "selected_columns" in bias_report.sensitive_attributes:
        sensitive_col = bias_report.sensitive_attributes["selected_columns"][0]
    else:
        sensitive_col = list(bias_report.sensitive_audit.keys())[0]

    from app.utils.optimization import run_optuna_optimization
    result = run_optuna_optimization(strategy, df, model, target_column, sensitive_col)
    
    return {
        "status": "optimization_success",
        "strategy": strategy,
        "optimization_result": result
    }

async def run_auto_experiment(report_id: int, session: AsyncSession, is_iterative: bool = False, request=None):
    strategies = ["smote", "reweighting", "threshold"]
    results = []

    for strategy in strategies:
        try:
            if is_iterative and request:
                res = await run_iterative_mitigation(report_id, strategy, session, request)
            else:
                res = await run_mitigation(report_id, strategy, session)
            
            acc_diff = res["after"]["performance"]["accuracy"] - res["before"]["performance"]["accuracy"]
            
            # Simple fitness score: heavily weight bias improvement, slightly penalize accuracy drops
            # Assuming severity score ranges typically from 0 to 2
            fitness = res["improvement_score"] * 10 + (acc_diff * 5)
            res["leaderboard_score"] = fitness
            results.append(res)
        except Exception as e:
            print(f"Strategy {strategy} failed during auto_experiment: {e}")
            pass

    # Sort descending by leaderboard_score
    results.sort(key=lambda x: x["leaderboard_score"], reverse=True)
    
    return {
        "status": "auto_experiment_success",
        "leaderboard": results
    }

async def run_mitigation(report_id: int, strategy: str, session: AsyncSession, strategy_config: dict = None):
    if strategy_config is None:
        strategy_config = {}

    bias_report = await session.get(BiasReport, report_id)
    if not bias_report:
        raise ValueError("Bias report not found")

    upload = await session.get(UploadRecord, bias_report.upload_id)
    if not upload:
        raise ValueError("Upload record not found")

    df = load_dataset(upload.dataset_filename)
    model = load_model(upload.model_filename)

    target_column = bias_report.target_info["target_column"]
    
    if bias_report.sensitive_attributes and "selected_columns" in bias_report.sensitive_attributes:
        sensitive_col = bias_report.sensitive_attributes["selected_columns"][0]
    else:
        sensitive_col = list(bias_report.sensitive_audit.keys())[0]

    raw_X = df.drop(columns=[target_column])

    from app.utils.preprocessing import preprocess_dataset
    X, y, sensitive = preprocess_dataset(
        df,
        target_column,
        sensitive_col,
    )

    from app.utils.prediction import standardize_columns, get_expected_features, predict_labels
    expected = get_expected_features(model)
    if expected is not None:
        X = standardize_columns(X, expected)
        raw_X = standardize_columns(raw_X, expected)

    X_original = X.copy()
    y_original = y.copy()
    sensitive_original = sensitive.copy()

    try:
        y_pred_base = predict_labels(model, X=X_original, raw_X=raw_X, sensitive_features=sensitive_original)
    except Exception as e:
        raise ValueError(str(e))

    from app.utils.fairness_metrics import evaluate_baseline
    baseline_metrics = evaluate_baseline(
        y_original,
        y_pred_base,
        sensitive_original
    )

    rows_before = None
    rows_after = None

    if strategy == "smote":
        k_neighbors_override = strategy_config.get("k_neighbors", None)
        mitigated_model, X_balanced, y_balanced, sensitive_balanced = apply_smote(
            X, y, sensitive, model, k_neighbors_override=k_neighbors_override
        )

        rows_before = len(X)
        rows_after = len(X_balanced)

        if type(mitigated_model).__name__ == "ThresholdOptimizer":
            y_pred_after = mitigated_model.predict(X_balanced, sensitive_features=sensitive_balanced)
        else:
            y_pred_after = mitigated_model.predict(X_balanced)

        after_metrics = evaluate_baseline(
            y_balanced,
            y_pred_after,
            sensitive_balanced
        )

    elif strategy == "reweighting":
        weights = compute_sample_weights(y, sensitive)
        mitigated_model = clone(model)

        if isinstance(mitigated_model, Pipeline):
            mitigated_model.fit(X, y, model__sample_weight=weights)
        elif type(mitigated_model).__name__ == "ThresholdOptimizer":
            mitigated_model.prefit = False
            mitigated_model.fit(X, y, sample_weight=weights, sensitive_features=sensitive)
        else:
            mitigated_model.fit(X, y, sample_weight=weights)

        if type(mitigated_model).__name__ == "ThresholdOptimizer":
            y_pred_after = mitigated_model.predict(X, sensitive_features=sensitive)
        else:
            y_pred_after = mitigated_model.predict(X)

        after_metrics = evaluate_baseline(
            y,
            y_pred_after,
            sensitive
        )

    elif strategy == "threshold":
        mitigated_model = apply_threshold_optimizer(
            model,
            X,
            y,
            sensitive,
            grid_size=strategy_config.get("grid_size", 200),
            constraints=strategy_config.get("constraints", "equalized_odds")
        )

        y_pred_after = mitigated_model.predict(
            X,
            sensitive_features=sensitive,
        )

        after_metrics = evaluate_baseline(
            y,
            y_pred_after,
            sensitive
        )
    else:
        raise ValueError("Unknown strategy")

    improvement_score = (
        baseline_metrics.get("bias_severity_score", 0)
        - after_metrics.get("bias_severity_score", 0)
    )
    
    from app.utils.comparison import compare_metrics
    comparison = compare_metrics(baseline_metrics, after_metrics)

    mitigation = MitigationReport(
        bias_report_id=report_id,
        method_used=strategy.upper(),
        rows_before=rows_before,
        rows_after=rows_after,
        before_metrics=baseline_metrics,
        after_metrics=after_metrics,
        improvement_score=improvement_score,
    )

    session.add(mitigation)
    await session.commit()
    await session.refresh(mitigation)

    return {
        "status": "mitigation_success",
        "mitigation_id": mitigation.id,
        "strategy": strategy,
        "rows_before": rows_before,
        "rows_after": rows_after,
        "improvement_score": improvement_score,
        "before": baseline_metrics,
        "after": after_metrics,
        "comparison": comparison,
    }

async def run_iterative_mitigation(report_id: int, strategy: str, session: AsyncSession, request=None, strategy_config: dict = None):
    if strategy_config is None:
        strategy_config = {}
        
    bias_report = await session.get(BiasReport, report_id)
    if not bias_report:
        raise ValueError("Bias report not found")

    upload = await session.get(UploadRecord, bias_report.upload_id)
    if not upload:
        raise ValueError("Upload record not found")

    from app.utils.dataset_loader import load_dataset
    from app.utils.model_loader import load_model
    from app.utils.preprocessing import preprocess_dataset
    from app.utils.prediction import standardize_columns, get_expected_features, predict_labels
    from app.utils.fairness_metrics import evaluate_baseline, calculate_severity

    df = load_dataset(upload.dataset_filename)
    model = load_model(upload.model_filename)

    target_column = bias_report.target_info["target_column"]
    
    bias_ranking = []
    if request and hasattr(request, "bias_ranking") and request.bias_ranking and request.bias_ranking[0] and request.bias_ranking[0] != "string":
        bias_ranking = request.bias_ranking
    else:
        # Fallback: Auto-generate ranking from bias_report audit if payload is empty/default
        audit = bias_report.sensitive_audit or {}
        # Use severity_score or bias_severity_score
        bias_ranking = sorted(
            audit.keys(), 
            key=lambda k: audit[k].get("severity_score", audit[k].get("bias_severity_score", 0)), 
            reverse=True
        )

    valid_ranking = [attr for attr in bias_ranking if attr in df.columns]
    
    if not valid_ranking:
        raise ValueError(f"None of the sensitive attributes {bias_ranking} exist in the dataset.")
        
    first_attr = valid_ranking[0]

    X_original, y_original, _ = preprocess_dataset(df, target_column, first_attr)
    raw_X = df.drop(columns=[target_column])
    
    expected = get_expected_features(model)
    if expected is not None:
        X_original = standardize_columns(X_original, expected)
        raw_X = standardize_columns(raw_X, expected)

    X_current = X_original.copy()
    y_current = y_original.copy()
    mitigated_model = model

    BIAS_SEVERITY_THRESHOLD = 1.0
    mitigation_log = []

    for attr in valid_ranking:
        if attr not in X_current.columns:
            continue
            
        sensitive_series = X_current[attr]

        # 1. Predict with current model
        try:
            if type(mitigated_model).__name__ == "ThresholdOptimizer":
                y_pred = mitigated_model.predict(X_current, sensitive_features=sensitive_series)
            else:
                y_pred = predict_labels(mitigated_model, X=X_current, raw_X=raw_X, sensitive_features=sensitive_series)
        except Exception:
            y_pred = mitigated_model.predict(X_current)

        # 2. Evaluate current bias severity
        metrics = evaluate_baseline(y_current, y_pred, sensitive_series)
        dpd = metrics.get("fairness", {}).get("dpd", 0)
        eod = metrics.get("fairness", {}).get("eod", 0)
        res_dir = metrics.get("fairness", {}).get("dir", 0)
        severity = calculate_severity(dpd, eod, res_dir)

        if severity < BIAS_SEVERITY_THRESHOLD:
            mitigation_log.append({
                "attribute": attr,
                "applied": False,
                "reason": f"low bias (severity={severity})"
            })
            continue

        before_metrics = metrics

        # 3. Apply Mitigation
        if strategy == "smote":
            from app.utils.smote import apply_smote
            k_neighbors_override = strategy_config.get("k_neighbors", None)
            mitigated_model, X_balanced, y_balanced, sensitive_balanced = apply_smote(
                X_current, y_current, sensitive_series, mitigated_model, k_neighbors_override=k_neighbors_override
            )
            X_current = X_balanced
            y_current = y_balanced
            raw_X = X_current.copy()

        elif strategy == "reweighting":
            from app.utils.reweighting import compute_sample_weights
            weights = compute_sample_weights(y_current, sensitive_series)
            mitigated_model = clone(mitigated_model)

            if isinstance(mitigated_model, Pipeline):
                mitigated_model.fit(X_current, y_current, model__sample_weight=weights)
            elif type(mitigated_model).__name__ == "ThresholdOptimizer":
                mitigated_model.prefit = False
                mitigated_model.fit(X_current, y_current, sample_weight=weights, sensitive_features=sensitive_series)
            else:
                mitigated_model.fit(X_current, y_current, sample_weight=weights)

        elif strategy == "threshold":
            from app.utils.threshold import apply_threshold_optimizer
            mitigated_model = apply_threshold_optimizer(
                mitigated_model, X_current, y_current, sensitive_series, 
                grid_size=strategy_config.get("grid_size", 200),
                constraints=strategy_config.get("constraints", "equalized_odds")
            )

        # 4. Predict and evaluate AFTER mitigation
        try:
            if type(mitigated_model).__name__ == "ThresholdOptimizer":
                y_pred_after = mitigated_model.predict(X_current, sensitive_features=sensitive_series)
            else:
                y_pred_after = predict_labels(mitigated_model, X=X_current, raw_X=raw_X, sensitive_features=sensitive_series)
        except Exception:
            y_pred_after = mitigated_model.predict(X_current)

        after_metrics = evaluate_baseline(y_current, y_pred_after, sensitive_series)

        mitigation_log.append({
            "attribute": attr,
            "applied": True,
            "before": before_metrics,
            "after": after_metrics
        })

    # Overall system metrics check
    global_attr = valid_ranking[0]
    try:
        y_pred_base_global = predict_labels(model, X=X_original, raw_X=df.drop(columns=[target_column]), sensitive_features=X_original[global_attr])
    except Exception:
        y_pred_base_global = model.predict(X_original)
        
    baseline_metrics = evaluate_baseline(y_original, y_pred_base_global, X_original[global_attr])

    try:
        if type(mitigated_model).__name__ == "ThresholdOptimizer":
            y_pred_after_global = mitigated_model.predict(X_current, sensitive_features=X_current[global_attr])
        else:
            y_pred_after_global = predict_labels(mitigated_model, X=X_current, raw_X=raw_X, sensitive_features=X_current[global_attr])
    except Exception:
        y_pred_after_global = mitigated_model.predict(X_current)

    final_metrics = evaluate_baseline(y_current, y_pred_after_global, X_current[global_attr])

    improvement_score = (
        calculate_severity(baseline_metrics["fairness"]["dpd"], baseline_metrics["fairness"]["eod"], baseline_metrics["fairness"]["dir"])
        - calculate_severity(final_metrics["fairness"]["dpd"], final_metrics["fairness"]["eod"], final_metrics["fairness"]["dir"])
    )

    from app.utils.comparison import compare_metrics
    comparison = compare_metrics(baseline_metrics, final_metrics)

    mitigation = MitigationReport(
        bias_report_id=report_id,
        method_used=strategy.upper() + "_ITERATIVE",
        rows_before=len(X_original),
        rows_after=len(X_current),
        before_metrics=baseline_metrics,
        after_metrics=final_metrics,
        improvement_score=improvement_score,
    )
    session.add(mitigation)
    await session.commit()
    await session.refresh(mitigation)

    return {
        "status": "mitigation_success",
        "mitigation_id": mitigation.id,
        "strategy": strategy,
        "is_iterative": True,
        "mitigation_log": mitigation_log,
        "rows_before": len(X_original),
        "rows_after": len(X_current),
        "improvement_score": improvement_score,
        "before": baseline_metrics,
        "after": final_metrics,
        "comparison": comparison,
    }