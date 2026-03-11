from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_session
from app.schemas.bias import BiasDetectRequest
from app.services.bias_service import run_bias_detection
from app.models.bias import BiasReport
from fastapi import HTTPException

router = APIRouter(prefix="/api/bias", tags=["Bias Detection"])


@router.post("/detect")
async def detect_bias(
    payload: BiasDetectRequest,
    session: AsyncSession = Depends(get_session),
):
    try:
        result = await run_bias_detection(payload, session)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bias detection failed: {e}")




@router.get("/report/{report_id}")
async def get_bias_report(
    report_id: int,
    session: AsyncSession = Depends(get_session),
):
    report = await session.get(BiasReport, report_id)

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return {
        "id": report.id,
        "upload_id": report.upload_id,
        "bias_present": report.bias_present,
        "bias_driver": report.bias_driver,
        "bias_severity_score": report.bias_severity_score,
        "dataset_health": report.dataset_health,
        "target_info": report.target_info,
        "sensitive_attributes": report.sensitive_attributes,
        "sensitive_audit": report.sensitive_audit,
        "warnings": report.warnings,
        "created_at": report.created_at,
    }