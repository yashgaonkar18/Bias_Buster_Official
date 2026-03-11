import pandas as pd
import numpy as np
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.bias import BiasDetectRequest
from app.models.models import UploadRecord
from app.models.bias import BiasReport

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


async def run_bias_detection(
    payload: BiasDetectRequest,
    session: AsyncSession,
):

    # ----------------------------------------
    # 1️⃣ Fetch upload record
    # ----------------------------------------
    record = (
        await session.execute(
            select(UploadRecord).where(UploadRecord.id == payload.upload_id)
        )
    ).scalar_one_or_none()

    if not record:
        raise ValueError("Upload record not found")

    # ----------------------------------------
    # 2️⃣ Load dataset & model
    # ----------------------------------------
    df = load_dataset(record.dataset_filename)
    model = load_model(record.model_filename)

    if isinstance(model, ThresholdOptimizer):
        raise ValueError("ThresholdOptimizer model not allowed for detection")

    # ----------------------------------------
    # 3️⃣ Dataset health
    # ----------------------------------------
    dataset_health = validate_dataset_health(df)

    # ----------------------------------------
    # 4️⃣ Target encoding
    # ----------------------------------------
    df, encoder_info = encode_target_column(df, payload.target_column)

# 🔥 CONTROL WHAT YOU STORE
    target_info = { 
    "target_column": payload.target_column,
    "encoder_info": encoder_info
}

    # ----------------------------------------
    # 5️⃣ Sensitive validation
    # ----------------------------------------
    sensitive_info = validate_sensitive_columns(df, payload.sensitive_columns)

    for col in payload.sensitive_columns:
        if col.lower() == "age":
            df = bin_age_column(df, col)
            payload.sensitive_columns = [
                c if c != col else col + "_group"
                for c in payload.sensitive_columns
            ]
            break

    for col in payload.sensitive_columns:
        df[col] = df[col].astype(str)

    # ----------------------------------------
    # 6️⃣ Prediction
    # ----------------------------------------
    y_true = df[payload.target_column].astype(int)
    X = df.drop(columns=[payload.target_column])

    if isinstance(model, Pipeline):
        X_infer = X
    else:
        X_infer = encode_features_for_inference(X)

    y_pred = predict_labels(model, X_infer)
    y_pred = np.nan_to_num(y_pred).astype(int)

    # ----------------------------------------
    # 7️⃣ Initialize tracking variables
    # ----------------------------------------
    audit_results = {}
    warnings = []
    bias_driver = None
    max_severity = 0
    total_rows = len(df)

    # Prediction skew warning
    positive_rate = y_pred.mean()

    if (
        positive_rate < (1 - settings.PREDICTION_SKEW_THRESHOLD)
        or positive_rate > settings.PREDICTION_SKEW_THRESHOLD
    ):
        warnings.append(
            "Model predictions are highly skewed towards a single class."
        )

    # ----------------------------------------
    # 8️⃣ Fairness computation
    # ----------------------------------------
    for sensitive in payload.sensitive_columns:

        group_rates = {}
        group_tprs = {}

        group_counts = df[sensitive].value_counts(dropna=False).to_dict()

        for group, count in group_counts.items():

            if count < settings.MIN_GROUP_SIZE:
                warnings.append(
                    f"Low sample size for group '{group}' in '{sensitive}'"
                )

            proportion = count / total_rows
            if proportion < settings.MIN_GROUP_PROPORTION:
                warnings.append(
                    f"Group '{group}' underrepresented in '{sensitive}'"
                )

            mask = df[sensitive] == group
            y_g = y_true[mask]
            y_p = y_pred[mask]

            if len(y_g) == 0:
                continue

            group_rates[str(group)] = selection_rate(y_p)
            group_tprs[str(group)] = true_positive_rate(y_g, y_p)

        dpd = demographic_parity_difference(group_rates)
        eod = equal_opportunity_difference(group_tprs)
        dir_ratio = disparate_impact_ratio(group_rates)

        decision = evaluate_bias(dpd, eod, dir_ratio)

        audit_results[sensitive] = {
            "selection_rate": group_rates,
            "true_positive_rate": group_tprs,
            "dpd": round(dpd, 4),
            "eod": round(eod, 4),
            "dir": round(dir_ratio, 4),
            "biased": decision["bias_present"],
            "severity_score": decision["severity_score"],
            "violations": decision["violations"],
        }

        if decision["severity_score"] > max_severity:
            max_severity = decision["severity_score"]
            bias_driver = sensitive

    # ----------------------------------------
    # 9️⃣ Save to Database
    # ----------------------------------------
    try:
        report = BiasReport(
            upload_id=record.id,
            bias_present=max_severity > 0,
            bias_driver=bias_driver,
            bias_severity_score=max_severity,
            dataset_health=dataset_health,
            target_info=target_info,
            sensitive_attributes=sensitive_info,
            sensitive_audit=audit_results,
            warnings=list(set(warnings)),
        )

        session.add(report)
        await session.commit()
        await session.refresh(report)

    except Exception:
        await session.rollback()
        raise

    # ----------------------------------------
    # 🔟 Return response
    # ----------------------------------------
    return {
        "status": "success",
        "report_id": report.id,
        "dataset_health": dataset_health,
        "target_info": target_info,
        "sensitive_attributes": sensitive_info,
        "bias_present": max_severity > 0,
        "bias_driver": bias_driver,
        "bias_severity_score": max_severity,
        "sensitive_audit": audit_results,
        "warnings": list(set(warnings)),
        "next_step": "bias_mitigation" if max_severity > 0 else "model_optimization",
    }
    
    
async def run_bias_detection_from_objects(
    df,
    model,
    target_column: str,
    sensitive_columns: list,
):



    df = df.copy()

    # ----------------------------------------
    # 1️⃣ Prepare Data
    # ----------------------------------------
    y_true = df[target_column].astype(int)
    X = df.drop(columns=[target_column])

    if isinstance(model, Pipeline):
        X_infer = X
    else:
        X_infer = encode_features_for_inference(X)

    y_pred = model.predict(X_infer)
    y_pred = np.nan_to_num(y_pred).astype(int)

    # ----------------------------------------
    # 2️⃣ Initialize tracking
    # ----------------------------------------
    audit_results = {}
    bias_driver = None
    max_severity = 0
    total_rows = len(df)

    # ----------------------------------------
    # 3️⃣ Fairness computation
    # ----------------------------------------
    for sensitive in sensitive_columns:

        group_rates = {}
        group_tprs = {}

        df[sensitive] = df[sensitive].astype(str)
        group_counts = df[sensitive].value_counts(dropna=False).to_dict()

        for group, count in group_counts.items():

            mask = df[sensitive] == group
            y_g = y_true[mask]
            y_p = y_pred[mask]

            if len(y_g) == 0:
                continue

            group_rates[str(group)] = selection_rate(y_p)
            group_tprs[str(group)] = true_positive_rate(y_g, y_p)

        dpd = demographic_parity_difference(group_rates)
        eod = equal_opportunity_difference(group_tprs)
        dir_ratio = disparate_impact_ratio(group_rates)

        decision = evaluate_bias(dpd, eod, dir_ratio)

        audit_results[sensitive] = {
            "selection_rate": group_rates,
            "true_positive_rate": group_tprs,
            "dpd": round(dpd, 4),
            "eod": round(eod, 4),
            "dir": round(dir_ratio, 4),
            "biased": decision["bias_present"],
            "severity_score": decision["severity_score"],
            "violations": decision["violations"],
        }

        if decision["severity_score"] > max_severity:
            max_severity = decision["severity_score"]
            bias_driver = sensitive

    # ----------------------------------------
    # 4️⃣ Return structured result
    # ----------------------------------------
    return {
        "bias_present": max_severity > 0,
        "bias_driver": bias_driver,
        "bias_severity_score": max_severity,
        "sensitive_audit": audit_results,
    }