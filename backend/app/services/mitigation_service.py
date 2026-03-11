from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bias import BiasReport
from app.models.mitigation import MitigationReport
from app.models.models import UploadRecord

from app.utils.dataset_loader import load_dataset
from app.utils.model_loader import load_model
from app.utils.smote import apply_smote
from app.services.bias_service import run_bias_detection_from_objects
from app.utils.target_encoder import encode_target_column


async def run_smote_mitigation(report_id: int, session: AsyncSession):

    # 1️⃣ Get bias report
    bias_report = await session.get(BiasReport, report_id)
    if not bias_report:
        raise ValueError("Bias report not found")

    # 2️⃣ Get upload record
    upload = await session.get(UploadRecord, bias_report.upload_id)
    if not upload:
        raise ValueError("Upload record not found")

    # 3️⃣ Load dataset & model
    df = load_dataset(upload.dataset_filename)
    model = load_model(upload.model_filename)

    print("TARGET INFO:", bias_report.target_info)
    print("SENSITIVE INFO:", bias_report.sensitive_attributes)
    

    # ⚠️ TEMPORARY SAFE ACCESS
    target_column = bias_report.target_info["target_column"]

    df, _ = encode_target_column(df, target_column)
    
    sensitive_columns = list(bias_report.sensitive_audit.keys())

    # 4️⃣ Apply SMOTE
    new_model, rows_before, rows_after = apply_smote(
        df, target_column, model
    )

    # 5️⃣ Re-run detection
    after_metrics = await run_bias_detection_from_objects(
        df=df,
        model=new_model,
        target_column=target_column,
        sensitive_columns=sensitive_columns,
    )

    before_metrics = bias_report.sensitive_audit

    improvement_score = (
        bias_report.bias_severity_score
        - after_metrics["bias_severity_score"]
    )

    mitigation = MitigationReport(
        bias_report_id=report_id,
        method_used="SMOTE",
        rows_before=rows_before,
        rows_after=rows_after,
        before_metrics=before_metrics,
        after_metrics=after_metrics,
        improvement_score=improvement_score,
    )

    session.add(mitigation)
    await session.commit()
    await session.refresh(mitigation)

    return {
        "status": "mitigation_success",
        "mitigation_id": mitigation.id,
        "rows_before": rows_before,
        "rows_after": rows_after,
        "improvement_score": improvement_score,
        "before": before_metrics,
        "after": after_metrics,
    }
    print("TARGET INFO:", bias_report.target_info)
    print("SENSITIVE INFO:", bias_report.sensitive_attributes)

    # 1️⃣ Get original bias report
    bias_report = await session.get(BiasReport, report_id)
    if not bias_report:
        raise ValueError("Bias report not found")

    # 2️⃣ Get upload record
    upload = await session.get(UploadRecord, bias_report.upload_id)

    df = load_dataset(upload.dataset_filename)
    model = load_model(upload.model_filename)

    target_column = bias_report.target_info["target_column"]
    sensitive_columns = bias_report.sensitive_attributes["selected_columns"]

    # 3️⃣ Apply SMOTE
    new_model, rows_before, rows_after = apply_smote(
        df, target_column, model
    )

    # 4️⃣ Re-run bias detection
    after_metrics = await run_bias_detection_from_objects(
        df=df,
        model=new_model,
        target_column=target_column,
        sensitive_columns=sensitive_columns,
    )

    before_metrics = bias_report.sensitive_audit

    # 5️⃣ Improvement score
    improvement_score = (
        bias_report.bias_severity_score
        - after_metrics["bias_severity_score"]
    )

    # 6️⃣ Save mitigation report
    mitigation = MitigationReport(
        bias_report_id=report_id,
        method_used="SMOTE",
        rows_before=rows_before,
        rows_after=rows_after,
        before_metrics=before_metrics,
        after_metrics=after_metrics,
        improvement_score=improvement_score,
    )

    session.add(mitigation)
    await session.commit()
    await session.refresh(mitigation)

    return {
        "status": "mitigation_success",
        "mitigation_id": mitigation.id,
        "rows_before": rows_before,
        "rows_after": rows_after,
        "improvement_score": improvement_score,
        "before": before_metrics,
        "after": after_metrics,
    }