from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_session
import os
from app.services.mitigation_service import run_mitigation, get_mitigation_recommendation, run_optimization, run_auto_experiment

router = APIRouter(prefix="/api/mitigation", tags=["Mitigation"])

from typing import List, Dict, Optional
from pydantic import BaseModel

class IterativeMitigationRequest(BaseModel):
    sensitive_attributes: List[str]
    bias_scores: Dict[str, float]
    strategy_config: Optional[Dict] = None

@router.post("/recommend/{report_id}")
async def recommend_mitigation_strategy(report_id: int, session: AsyncSession = Depends(get_session)):
    try:
        return await get_mitigation_recommendation(report_id, session)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {e}")

@router.post("/auto-experiment/{report_id}")
async def auto_experiment_mitigation(
    report_id: int, 
    request: Optional[IterativeMitigationRequest] = None, 
    session: AsyncSession = Depends(get_session)
):
    try:
        is_iterative = request is not None and len(request.sensitive_attributes) > 0
        return await run_auto_experiment(report_id, session, is_iterative, request)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auto Experiment failed: {e}")

@router.post("/optimize/{strategy}/{report_id}")
async def optimize_mitigation_strategy(
    strategy: str,
    report_id: int,
    session: AsyncSession = Depends(get_session)
):
    valid_strategies = ["smote", "reweighting", "threshold"]
    if strategy not in valid_strategies:
        raise HTTPException(status_code=400, detail=f"Invalid strategy. Must be one of {valid_strategies}")
        
    try:
        return await run_optimization(report_id, strategy, session)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {e}")

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
        strategy_config = request.strategy_config if request else {}
        if request and request.sensitive_attributes:
            from app.services.mitigation_service import run_iterative_mitigation
            return await run_iterative_mitigation(report_id, strategy, session, request, strategy_config=strategy_config)
        else:
            return await run_mitigation(report_id, strategy, session, strategy_config=strategy_config)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mitigation failed: {e}")


@router.get("/export/dataset/{mitigation_id}")
async def export_dataset(mitigation_id: int, session: AsyncSession = Depends(get_session)):
    from app.models.mitigation import MitigationReport
    mitigation = await session.get(MitigationReport, mitigation_id)
    if not mitigation or not mitigation.mitigated_dataset_filename:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    if not os.path.exists(mitigation.mitigated_dataset_filename):
        raise HTTPException(status_code=404, detail="File missing from disk")
        
    return FileResponse(
        mitigation.mitigated_dataset_filename, 
        media_type="text/csv", 
        filename=f"debiased_dataset_{mitigation_id}.csv"
    )


@router.get("/export/model/{mitigation_id}")
async def export_model(mitigation_id: int, session: AsyncSession = Depends(get_session)):
    from app.models.mitigation import MitigationReport
    mitigation = await session.get(MitigationReport, mitigation_id)
    if not mitigation or not mitigation.mitigated_model_filename:
        raise HTTPException(status_code=404, detail="Model not found")
        
    if not os.path.exists(mitigation.mitigated_model_filename):
        raise HTTPException(status_code=404, detail="File missing from disk")
        
    return FileResponse(
        mitigation.mitigated_model_filename, 
        media_type="application/octet-stream", 
        filename=f"debiased_model_{mitigation_id}.pkl"
    )