from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from dataclasses import asdict

from app.db import get_session
from app.schemas.retraining import RetrainingRequest, RetrainingResponse
from app.services.retraining_service import execute_retraining_pipeline

router = APIRouter(prefix="/api/retraining", tags=["Retraining"])

@router.post("/run", response_model=RetrainingResponse)
async def run_retraining_pipeline(
    payload: RetrainingRequest,
    session: AsyncSession = Depends(get_session)
):
    try:
        result = await execute_retraining_pipeline(payload, session)
        resp = asdict(result)
        resp["status"] = "success"
        return resp
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {e}")
