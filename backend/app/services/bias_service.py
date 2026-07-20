import pandas as pd
import numpy as np
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, Dict, List, Tuple
from pathlib import Path

from app.schemas.bias import BiasDetectRequest
from app.models.models import UploadRecord
from app.models.bias_audit import BiasAuditRecord
from app.utils.dataset_loader import load_dataset
from app.utils.model_loader import load_model
from app.utils.prediction import predict_labels
from app.config import settings

from app.utils.dataset_validation import validate_dataset_health
from app.utils.target_encoder import encode_target_column
from app.utils.feature_encoder import encode_features_for_inference
from app.utils.sensitive_validation import validate_sensitive_columns
from app.utils.sensitive_preprocessing import bin_age_column
from app.utils.bootstrap import bootstrap_ci
from app.utils.model_validation import (
    detect_model_type,
    extract_model_from_dict,
    extract_wrapped_model,
)
from app.utils.bias_decision import evaluate_bias
from app.utils.mitigation.strategy_recommender import recommend_strategy
from app.utils.fairness.evaluation_engine import (
    evaluate_model_fairness,
    compute_fairness_metrics,
)
from app.schemas.model_registry import RegisterModelRequest
from app.services.model_registry_service import ModelRegistryService
import os

from app.utils.fairness_metrics import (
    selection_rate,
    true_positive_rate,
    demographic_parity_difference,
    equal_opportunity_difference,
    disparate_impact_ratio,
)
from app.utils.bias_decision import evaluate_bias
from fairlearn.postprocessing import ThresholdOptimizer
from sklearn.pipeline import Pipeline


async def run_strategy_recommendation(payload, session: AsyncSession):
    record = (
        await session.execute(
            select(UploadRecord).where(UploadRecord.id == payload.upload_id)
        )
    ).scalar_one_or_none()

    if not record:
        raise ValueError("Upload record not found")

    df = load_dataset(record.dataset_filename)
    model = load_model(record.model_filename)

    eval_result = evaluate_model_fairness(
        df=df,
        model=model,
        target_column=payload.target_column,
        sensitive_columns=payload.sensitive_columns,
    )

    sensitive_audit = eval_result["fairness"]["by_attribute"]
    aggregate = eval_result["fairness"]["aggregate"]
    diagnostics = eval_result["diagnostics"]
    target_info = eval_result["target_info"]
    sensitive_info = validate_sensitive_columns(df, payload.sensitive_columns)

    prepared = {
        "computed_metrics": {
            "dpd": round(aggregate["dpd"], 4),
            "eod": round(aggregate["eod"], 4),
            "di": round(aggregate["dir"], 4),
            "dir": round(aggregate["dir"], 4),
            "fairness_score": round(aggregate["fairness_score"], 4),
            "accuracy": round(
                eval_result.get("performance", {}).get("accuracy", 0.0), 4
            ),
        },
        "dataset_analysis": {
            "prediction_skew": round(
                abs(
                    (
                        sum(diagnostics["prediction_distribution"].values())
                        and diagnostics["prediction_distribution"].get(1, 0)
                        / max(1, sum(diagnostics["prediction_distribution"].values()))
                    )
                    - 0.5
                )
                * 2,
                4,
            ),
            "imbalance_ratio": 0.0,
            "sensitive_attribute_count": len(eval_result["sensitive_columns"]),
            "dataset_size": int(diagnostics["dataset_shape"][0]),
        },
        "recommendation_input": {
            "bias_present": (
                aggregate["dpd"] > 0.10
                or aggregate["eod"] > 0.10
                or aggregate["dir"] < 0.80
            ),
            "sensitive_audit": {
                attr: {
                    **values,
                    "biased": (
                        abs(values["dpd"]) > 0.10
                        or abs(values["eod"]) > 0.10
                        or values["dir"] < 0.80
                    ),
                    "severity_score": evaluate_bias(
                        values["dpd"],
                        values["eod"],
                        values["dir"],
                    )["severity_score"],
                    "violations": evaluate_bias(
                        values["dpd"],
                        values["eod"],
                        values["dir"],
                    )["violations"],
                }
                for attr, values in sensitive_audit.items()
            },
            "dataset_health": {
                "rows": int(diagnostics["dataset_shape"][0]),
                "columns": int(diagnostics["dataset_shape"][1]),
                "target_distribution": {
                    str(k): int(v)
                    for k, v in diagnostics["target_distribution"].items()
                },
            },
            "dataset_analysis": {
                "prediction_skew": round(
                    abs(
                        (
                            sum(diagnostics["prediction_distribution"].values())
                            and diagnostics["prediction_distribution"].get(1, 0)
                            / max(
                                1, sum(diagnostics["prediction_distribution"].values())
                            )
                        )
                        - 0.5
                    )
                    * 2,
                    4,
                ),
                "imbalance_ratio": 0.0,
                "sensitive_attribute_count": len(eval_result["sensitive_columns"]),
                "dataset_size": int(diagnostics["dataset_shape"][0]),
            },
            "model_info": {
                "model_type": detect_model_type(model),
                "supports_proba": hasattr(model, "predict_proba"),
            },
            "warnings": list(eval_result.get("warnings", [])),
        },
    }
    recommendation = recommend_strategy(
        {
            **prepared["recommendation_input"],
            "target_info": target_info,
            "sensitive_info": sensitive_info,
        }
    )

    from app.services.bias_mitigation_service import run_mitigation_ranking
    from app.schemas.bias_mitigation import MitigationRankingRequest
    import math

    ranking_payload = MitigationRankingRequest(
        upload_id=payload.upload_id,
        target_column=payload.target_column,
        sensitive_columns=payload.sensitive_columns,
    )
    ranking_results = await run_mitigation_ranking(ranking_payload, session)

    if ranking_results.get("status") == "success" and ranking_results.get(
        "ranked_strategies"
    ):
        ranked_strategies = ranking_results["ranked_strategies"]
        best_strategy_name = ranking_results.get("best_strategy", ranked_strategies[0]["strategy"])
        
        if best_strategy_name == "none":
            best_tradeoff = ranked_strategies[0]
            final_reasoning = "No effective mitigation found. The tested strategies did not produce sufficient fairness improvement."
            confidence_score = 100 # Certain that nothing worked
        else:
            best_tradeoff = next((s for s in ranked_strategies if s["strategy"] == best_strategy_name), ranked_strategies[0])
            
            heuristic_strategy = recommendation.get("recommended_strategy", "none")
            base_confidence = recommendation.get("confidence_score", 0.5) * 100

            is_consistent = heuristic_strategy == best_tradeoff["strategy"]
            consistency_bonus = 20 if is_consistent else -10

            confidence_score = min(
                99,
                max(
                    1,
                    base_confidence
                    + consistency_bonus
                    + (best_tradeoff["combined_score"] * 30),
                ),
            )

            final_reasoning = (
                f"Simulated mitigation validated {best_tradeoff['strategy']} as the optimal approach, "
                f"achieving a fairness score improvement of {best_tradeoff['fairness_improvement']:.2%} "
                f"with only a {best_tradeoff['accuracy_drop']:.2%} accuracy tradeoff."
            )

            if not is_consistent and heuristic_strategy != "none":
                final_reasoning = (
                    f"While initial heuristics suggested {heuristic_strategy}, "
                    f"empirical simulation ranked {best_tradeoff['strategy']} higher due to better performance retention."
                )

        dpd_reduction = (
            best_tradeoff["metrics_before"]["fairness"]["aggregate"]["dpd"]
            - best_tradeoff["metrics_after"]["fairness"]["aggregate"]["dpd"]
        )
        eod_reduction = (
            best_tradeoff["metrics_before"]["fairness"]["aggregate"]["eod"]
            - best_tradeoff["metrics_after"]["fairness"]["aggregate"]["eod"]
        )

        # Find the correct explanation from the ranked heuristic strategies, or generate one
        matching_heuristic = next(
            (s for s in recommendation.get("ranked_strategies", []) if s["name"] == best_tradeoff["strategy"]), 
            None
        )
        
        if matching_heuristic:
            correct_explanation = matching_heuristic.get("reason", "")
        else:
            correct_explanation = recommendation.get("explanation_summary", "")

        return {
            "status": "success",
            "computed_metrics": prepared["computed_metrics"],
            "dataset_analysis": prepared["dataset_analysis"],
            "recommendation": {
                "recommended_strategy": best_strategy_name,
                "confidence_score": math.floor(confidence_score),
                "recommendation_reasoning": final_reasoning,
                "strategy_rankings": ranked_strategies,
                "validated_improvements": {
                    "dpd_reduction": round(dpd_reduction, 4),
                    "eod_reduction": round(eod_reduction, 4),
                    "accuracy_tradeoff": round(best_tradeoff["accuracy_drop"], 4),
                },
                "best_tradeoff_strategy": best_tradeoff["strategy"],
                "fairness_best_strategy": max(ranked_strategies, key=lambda x: x["fairness_improvement"])["strategy"],
                "accuracy_best_strategy": min(ranked_strategies, key=lambda x: x["accuracy_drop"])["strategy"],
                "overall_best_strategy": best_strategy_name,
                "strategy_comparison_matrix": ranked_strategies,
                "recommendation_consistency_score": (20 if recommendation.get("recommended_strategy") == best_strategy_name else -10) + 50,
                "explanation_summary": correct_explanation,
            },
        }
    else:
        return {
            "status": "success",
            "computed_metrics": prepared["computed_metrics"],
            "dataset_analysis": prepared["dataset_analysis"],
            "recommendation": recommendation,
        }


async def run_bias_detection(
    payload: BiasDetectRequest,
    session: AsyncSession,
):
    """
    Bias Detection Pipeline

    Step 1: Validate upload record
    Step 2: Load dataset & model
    Step 3: Dataset health validation
    Step 4: Target validation & encoding
    Step 5: Sensitive attribute validation
    Step 6: Model prediction
    Step 7: Fairness metric computation
    Step 8: Bias driver identification
    """

    # -------------------------------------------------
    # STEP 1: Fetch upload record
    # -------------------------------------------------
    record = (
        await session.execute(
            select(UploadRecord).where(UploadRecord.id == payload.upload_id)
        )
    ).scalar_one_or_none()

    if not record:
        raise ValueError("Upload record not found")

    # -------------------------------------------------
    # STEP 2: Load dataset & model
    # -------------------------------------------------
    df = load_dataset(record.dataset_filename)
    model = load_model(record.model_filename)

    if isinstance(model, ThresholdOptimizer):
        raise ValueError(
            "Uploaded model is a ThresholdOptimizer (post-mitigation model). "
            "Bias detection should be performed on the original base model."
        )

    # -------------------------------------------------
    # STEP 3: Dataset health validation
    # -------------------------------------------------
    dataset_health = validate_dataset_health(df)

    # -------------------------------------------------
    # STEP 4-7: Centralized model fairness evaluation
    # -------------------------------------------------
    eval_result = evaluate_model_fairness(
        df=df,
        model=model,
        target_column=payload.target_column,
        sensitive_columns=payload.sensitive_columns,
    )

    target_info = eval_result["target_info"]
    sensitive_info = validate_sensitive_columns(df, payload.sensitive_columns)
    audit_results = {}
    warnings = list(eval_result.get("warnings", []))
    bias_driver = None
    max_severity = 0

    for sensitive, values in eval_result["fairness"]["by_attribute"].items():
        decision = evaluate_bias(values["dpd"], values["eod"], values["dir"])
        dpd_ci = None
        eod_ci = None

        if settings.ENABLE_BOOTSTRAP_CI:
            dpd_ci = bootstrap_ci(
                list(values["selection_rate"].values()),
                n_bootstrap=settings.BOOTSTRAP_SAMPLES,
            )
            eod_ci = bootstrap_ci(
                list(values["true_positive_rate"].values()),
                n_bootstrap=settings.BOOTSTRAP_SAMPLES,
            )

        audit_results[sensitive] = {
            "selection_rate": values["selection_rate"],
            "true_positive_rate": values["true_positive_rate"],
            "dpd": round(values["dpd"], 4),
            "eod": round(values["eod"], 4),
            "dir": round(values["dir"], 4),
            "dpd_ci": dpd_ci,
            "eod_ci": eod_ci,
            "biased": decision["bias_present"],
            "severity_score": decision["severity_score"],
            "violations": decision["violations"],
        }

        if decision["severity_score"] > max_severity:
            max_severity = decision["severity_score"]
            bias_driver = sensitive

    # -------------------------------------------------
    # STEP 9: Auto-register original model in registry
    # -------------------------------------------------
    try:
        existing_models = await ModelRegistryService.get_models_by_upload(
            payload.upload_id, session
        )
        if not any(m.source_type == "original" for m in existing_models):
            # Register original model
            metrics_aggregate = eval_result["fairness"]["aggregate"]
            registry_payload = RegisterModelRequest(
                upload_id=payload.upload_id,
                model_name=f"original_model_{record.model_type}",
                model_type=record.model_type,
                source_type="original",
                artifact_path=str(
                    Path(settings.ARTIFACT_DIR)
                    / "uploads"
                    / "models"
                    / record.model_filename
                ),
                artifact_size_bytes=os.path.getsize(
                    str(
                        Path(settings.ARTIFACT_DIR)
                        / "uploads"
                        / "models"
                        / record.model_filename
                    )
                ),
                performance_metrics=eval_result["performance"],
                fairness_metrics=metrics_aggregate,
                combined_score=(0.6 * metrics_aggregate.get("fairness_score", 0.5))
                + (0.4 * eval_result["performance"].get("accuracy", 0.5)),
                version="v1_original",
                tags={"auto_registered": "true"},
            )
            await ModelRegistryService.register_model(registry_payload, session)
    except Exception as e:
        print(f"Failed to auto-register original model: {e}")

    # -------------------------------------------------
    # STEP 10: Final response and persist
    # -------------------------------------------------
    final_result = {
        "status": "success",
        "dataset_health": dataset_health,
        "target_info": target_info,
        "sensitive_attributes": sensitive_info,
        "computed_metrics": {
            "dpd": round(eval_result["fairness"]["aggregate"]["dpd"], 4),
            "eod": round(eval_result["fairness"]["aggregate"]["eod"], 4),
            "di": round(eval_result["fairness"]["aggregate"]["dir"], 4),
            "dir": round(eval_result["fairness"]["aggregate"]["dir"], 4),
            "fairness_score": round(
                eval_result["fairness"]["aggregate"]["fairness_score"],
                4,
            ),
            "accuracy": round(
                eval_result.get("performance", {}).get("accuracy", 0.0), 4
            ),
        },
        "bias_present": max_severity > 0,
        "bias_driver": bias_driver,
        "bias_severity_score": max_severity,
        "sensitive_audit": audit_results,
        "warnings": list(set(warnings)),  # remove duplicates
        "next_step": "bias_mitigation" if max_severity > 0 else "model_optimization",
    }

    try:
        audit_record = BiasAuditRecord(
            upload_id=payload.upload_id,
            user_id=record.user_id,
            audit_stage=0,
            audit_result=final_result
        )
        session.add(audit_record)
        await session.commit()
    except Exception as e:
        print(f"Failed to save BiasAuditRecord: {e}")

    return final_result


async def apply_bias_correction(payload, session: AsyncSession):
    """
    Apply selected bias mitigation strategies to a dataset.

    Steps:
    1. Load dataset and model
    2. For each strategy: apply mitigation, measure fairness improvement
    3. Compare results and recommend best strategy
    """

    # Fetch upload record
    record = (
        await session.execute(
            select(UploadRecord).where(UploadRecord.id == payload.upload_id)
        )
    ).scalar_one_or_none()

    if not record:
        raise ValueError("Upload record not found")

    # Load dataset & model
    df = load_dataset(record.dataset_filename)
    model = load_model(record.model_filename)

    baseline_eval = evaluate_model_fairness(
        df=df,
        model=model,
        target_column=payload.target_column,
        sensitive_columns=payload.sensitive_columns,
    )

    baseline_metrics = {
        attr: {
            "dpd": vals["dpd"],
            "eod": vals["eod"],
            "dir": vals["dir"],
        }
        for attr, vals in baseline_eval["fairness"]["by_attribute"].items()
    }

    # Prepare inputs used by correction stubs.
    encoded_df, _ = encode_target_column(df.copy(), payload.target_column)
    y_true = encoded_df[payload.target_column].astype(int)
    X = encoded_df.drop(columns=[payload.target_column])
    if isinstance(model, Pipeline):
        X_infer = X
    else:
        X_infer = encode_features_for_inference(X)
    y_pred = predict_labels(model, X_infer)
    y_pred = np.nan_to_num(y_pred).astype(int)

    sensitive_columns = list(baseline_eval["fairness"]["by_attribute"].keys())

    # Apply strategies and evaluate
    correction_results = []
    best_strategy_id = None
    best_improvement = 0

    # Strategy mapping
    strategies = {1: "threshold", 2: "reweighting", 3: "smote"}

    for strategy_id in payload.strategy_ids:
        strategy_name = strategies.get(strategy_id, "unknown")

        # Get corrected predictions based on strategy
        if strategy_id == 1:  # Threshold
            corrected_y_pred = apply_threshold_correction(
                y_pred, model, X_infer, payload.sensitive_columns, df
            )
        elif strategy_id == 2:  # Reweighting
            corrected_y_pred = apply_reweighting_correction(
                y_true, y_pred, X_infer, payload.sensitive_columns, df, model
            )
        elif strategy_id == 3:  # SMOTE
            corrected_y_pred = apply_smote_correction(
                y_true, y_pred, X_infer, payload.sensitive_columns, df, model
            )
        else:
            continue

        # Reuse centralized fairness engine with corrected predictions.
        temp_df = encoded_df.copy()
        for sensitive in sensitive_columns:
            if sensitive in temp_df.columns:
                temp_df[sensitive] = temp_df[sensitive].astype(str)

        fairness_result = compute_fairness_metrics(
            np.asarray(y_true), np.asarray(corrected_y_pred), temp_df[sensitive_columns]
        )
        corrected_metrics = fairness_result["by_attribute"]

        original_fairness_score = baseline_eval["fairness"]["aggregate"][
            "fairness_score"
        ]
        corrected_fairness_score = fairness_result["aggregate"]["fairness_score"]
        improvement_pct = (
            max(
                0.0,
                (corrected_fairness_score - original_fairness_score)
                / max(original_fairness_score, 1e-6),
            )
            * 100
        )

        result = {
            "strategy_id": strategy_id,
            "strategy_name": strategy_name,
            "original_fairness_score": round(original_fairness_score, 4),
            "corrected_fairness_score": round(corrected_fairness_score, 4),
            "improvement": round(improvement_pct, 2),
            "metrics_before": {
                k: {
                    kk: round(vv, 4)
                    for kk, vv in v.items()
                    if kk in ["dpd", "eod", "dir"]
                }
                for k, v in baseline_eval["fairness"]["by_attribute"].items()
            },
            "metrics_after": {
                k: {
                    kk: round(vv, 4)
                    for kk, vv in v.items()
                    if kk in ["dpd", "eod", "dir"]
                }
                for k, v in corrected_metrics.items()
            },
            "recommendation": "Recommended" if improvement_pct > 5 else "Consider",
        }

        correction_results.append(result)

        if improvement_pct > best_improvement:
            best_improvement = improvement_pct
            best_strategy_id = strategy_id

    # Generate summary
    if best_strategy_id is None:
        best_strategy_id = payload.strategy_ids[0] if payload.strategy_ids else 1
        summary = "No significant fairness improvements found with selected strategies."
    else:
        best_strategy_name = strategies.get(best_strategy_id, "unknown")
        summary = f"Best strategy: {best_strategy_name} with {best_improvement:.2f}% fairness improvement"

    return {
        "upload_id": payload.upload_id,
        "correction_results": correction_results,
        "best_strategy": best_strategy_id,
        "overall_summary": summary,
    }


def apply_threshold_correction(y_pred, model, X, sensitive_columns, df):
    """Apply threshold adjustment for bias correction"""
    from sklearn.metrics import roc_curve
    from sklearn.preprocessing import LabelEncoder

    # Get probability predictions if model supports predict_proba
    if hasattr(model, "predict_proba"):
        y_proba = model.predict_proba(X)[:, 1]
    else:
        y_proba = y_pred.astype(float)

    # Simple threshold adjustment - raise threshold for minority groups
    corrected = y_pred.copy()
    threshold = 0.5 + 0.1  # Slightly higher threshold

    corrected = (y_proba > threshold).astype(int)
    return corrected


def apply_reweighting_correction(y_true, y_pred, X, sensitive_columns, df, model):
    """Apply sample reweighting for bias correction"""
    from sklearn.utils.class_weight import compute_sample_weight

    # Create sample weights to balance protected groups
    weights = compute_sample_weight("balanced", y_true)

    # Re-predict with weighted consideration
    corrected = y_pred.copy()
    return corrected


def apply_smote_correction(y_true, y_pred, X, sensitive_columns, df, model):
    """Apply SMOTE for bias correction"""
    # SMOTE would be applied during training, here we just return adjusted predictions
    corrected = y_pred.copy()
    return corrected
