"""Fairness experiment report endpoints."""

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models.experiment import FairnessExperimentReport
from app.schemas.report import ReportGenerateRequest, ReportGenerateResponse
from app.services.report_service import generate_fairness_experiment_report

router = APIRouter(prefix="/api/report", tags=["Fairness Reports"])


@router.post("/generate", response_model=ReportGenerateResponse)
async def generate_report(
    payload: ReportGenerateRequest,
    session: AsyncSession = Depends(get_session),
) -> ReportGenerateResponse:
    try:
        return await generate_fairness_experiment_report(payload, session)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except Exception as error:
        raise HTTPException(
            status_code=500, detail=f"Report generation failed: {error}"
        )


@router.get("/download/{report_id}")
async def download_report(
    report_id: str,
    session: AsyncSession = Depends(get_session),
):
    record = (
        await session.execute(
            select(FairnessExperimentReport).where(
                FairnessExperimentReport.report_id == report_id
            )
        )
    ).scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="Report not found")

    pdf_path = Path(record.pdf_path)
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="Report file not found on server")

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"{report_id}.pdf",
    )


@router.get("/download-json/{report_id}")
async def download_report_json(
    report_id: str,
    session: AsyncSession = Depends(get_session),
):
    record = (
        await session.execute(
            select(FairnessExperimentReport).where(
                FairnessExperimentReport.report_id == report_id
            )
        )
    ).scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="Report not found")

    json_path = Path(record.json_path)
    if not json_path.exists():
        raise HTTPException(status_code=404, detail="Report metadata not found")

    return FileResponse(
        path=json_path,
        media_type="application/json",
        filename=f"{report_id}.json",
    )
