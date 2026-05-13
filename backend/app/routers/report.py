from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Any, Dict
import uuid
import json
import os
from pathlib import Path
from datetime import datetime

from app.db import get_session
from app.models.models import UploadRecord
from app.services.model_registry_service import ModelRegistryService
from app.config import settings

router = APIRouter(prefix="/api/report", tags=["Reports"])

@router.post("/generate")
async def generate_report(
    payload: Dict[str, Any],
    session: AsyncSession = Depends(get_session)
):
    upload_id = payload.get("upload_id")
    if not upload_id:
        raise HTTPException(status_code=400, detail="upload_id is required")

    # Fetch comparison data to include in report
    comparison = await ModelRegistryService.compare_models(upload_id, session)
    if not comparison:
        raise HTTPException(status_code=404, detail="No models found for report generation")

    # Generate a unique report ID
    report_id = str(uuid.uuid4())
    
    # Create report structure matching frontend expectations
    models_data = [
        {
            "model_id": m.model_id,
            "model_name": m.model_name,
            "source_type": m.source_type,
            "accuracy": m.accuracy,
            "fairness_score": m.fairness_score,
            "combined_score": m.combined_score,
            "dpd": m.dpd,
            "eod": m.eod,
            "dir": m.dir
        } for m in comparison.models
    ]

    report_payload = {
        "comparison_models": models_data,
        "chart_data": {
            "labels": [m.model_name for m in comparison.models],
            "datasets": [
                {
                    "label": "Accuracy",
                    "data": [m.accuracy for m in comparison.models]
                },
                {
                    "label": "Fairness Score",
                    "data": [m.fairness_score for m in comparison.models]
                }
            ],
            "scatter": [
                {
                    "x": m.accuracy,
                    "y": m.fairness_score,
                    "source_type": m.source_type,
                    "name": m.model_name
                } for m in comparison.models
            ]
        }
    }

    report_data = {
        "report_id": report_id,
        "upload_id": upload_id,
        "title": f"Fairness Audit Report: {upload_id}",
        "summary": comparison.summary,
        "report_payload": report_payload,
        "pdf_download_url": f"/api/report/download/{report_id}",
        "created_at": datetime.utcnow().isoformat()
    }

    # Save report to artifacts
    report_dir = Path(settings.ARTIFACT_DIR) / "reports"
    report_dir.mkdir(parents=True, exist_ok=True)
    
    report_path = report_dir / f"report_{report_id}.json"
    with open(report_path, "w") as f:
        json.dump(report_data, f, indent=4)

    return report_data

@router.get("/download/{report_id}")
async def download_report(report_id: str):
    report_path = Path(settings.ARTIFACT_DIR) / "reports" / f"report_{report_id}.json"
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(
        path=report_path,
        filename=f"bias_buster_report_{report_id[:8]}.json",
        media_type="application/json"
    )
