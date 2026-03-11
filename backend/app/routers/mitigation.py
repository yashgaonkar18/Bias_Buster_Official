from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_session
from app.services.mitigation_service import run_smote_mitigation

router = APIRouter(prefix="/api/mitigation", tags=["Mitigation"])


@router.post("/smote/{report_id}")
async def smote_mitigation(report_id: int, session: AsyncSession = Depends(get_session)):
    try:
        return await run_smote_mitigation(report_id, session)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mitigation failed: {e}")