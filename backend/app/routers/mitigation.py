from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_session
from app.services.mitigation_service import run_mitigation, get_mitigation_recommendation

router = APIRouter(prefix="/api/mitigation", tags=["Mitigation"])

from typing import List, Dict, Optional
from pydantic import BaseModel

class IterativeMitigationRequest(BaseModel):
    sensitive_attributes: List[str]
    bias_ranking: List[str]
    bias_scores: Dict[str, float]

@router.post("/recommend/{report_id}")
async def recommend_mitigation_strategy(report_id: int, session: AsyncSession = Depends(get_session)):
    try:
        return await get_mitigation_recommendation(report_id, session)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {e}")

@router.post("/apply/{strategy}/{report_id}")
async def apply_mitigation_strategy(
    strategy: str, 
    report_id: int, 
    request: Optional[IterativeMitigationRequest] = None,
    session: AsyncSession = Depends(get_session)
):
    valid_strategies = ["smote", "reweighting", "threshold"]
    if strategy not in valid_strategies:
        raise HTTPException(status_code=400, detail=f"Invalid strategy. Must be one of {valid_strategies}")
        
    try:
        if request and request.sensitive_attributes:
            from app.services.mitigation_service import run_iterative_mitigation
            return await run_iterative_mitigation(report_id, strategy, session, request)
        else:
            return await run_mitigation(report_id, strategy, session)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mitigation failed: {e}")