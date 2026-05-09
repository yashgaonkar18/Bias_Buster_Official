from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_session

from app.schemas.optimization import OptimizationRequest, OptimizationResponse
from app.services.optimization_service import run_model_optimization

router = APIRouter(prefix="/api/optimization", tags=["Optimization"])

@router.post("/run", response_model=OptimizationResponse)
async def optimize_model(
    payload: OptimizationRequest,
    session: AsyncSession = Depends(get_session)
):
    try:
        return await run_model_optimization(payload, session)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
