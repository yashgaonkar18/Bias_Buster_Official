import os
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_session
from app.models.bias_mitigation import BiasMitigationRun
from app.schemas.bias_mitigation import BiasMitigationRequest, MitigationRankingRequest
from app.services.bias_mitigation_service import (
    run_bias_mitigation,
    run_mitigation_ranking,
    validate_mitigation_strategy,
)
from app.utils.artifact_naming import cleanup_download_filename

router = APIRouter(prefix="/api/bias", tags=["Bias Mitigation"])


async def _get_latest_mitigation_record(
    upload_id: int,
    strategy: str | None,
    mitigation_id: int | None,
    session: AsyncSession,
) -> BiasMitigationRun:
    stmt = select(BiasMitigationRun).where(BiasMitigationRun.upload_id == upload_id)
    if mitigation_id is not None:
        stmt = stmt.where(BiasMitigationRun.id == mitigation_id)
    elif strategy:
        stmt = stmt.where(BiasMitigationRun.strategy_used == strategy)

    result = await session.execute(
        stmt.order_by(BiasMitigationRun.created_at.desc()).limit(1)
    )
    record = result.scalars().first()

    if not record:
        raise HTTPException(status_code=404, detail="Mitigation record not found")

    return record


@router.post("/mitigate")
async def mitigate_bias(
    payload: BiasMitigationRequest,
    session: AsyncSession = Depends(get_session),
):
    """
    Execute fully pipeline-aware bias mitigation.

    Workflow:
    1. Load dataset and model from upload_id
    2. Validate strategy_name
    3. If confirm_recommendation=False, return confirmation_required status
    4. Compute baseline fairness metrics internally
    5. Apply mitigation strategy
    6. Compute mitigated metrics
    7. Return comprehensive mitigation report with tradeoff analysis

    Required fields:
    - upload_id: ID of uploaded dataset/model
    - target_column: Column to predict (target)
    - sensitive_columns: List of protected attributes
    - strategy_name: One of ['threshold', 'reweighting', 'smote']
    - confirm_recommendation: Boolean confirmation flag

    Optional fields:
    - strategy_config: Dict with strategy-specific parameters
    """

    # Validate strategy
    try:
        validate_mitigation_strategy(payload.strategy_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Handle confirmation logic
    if not payload.confirm_recommendation:
        return {
            "status": "confirmation_required",
            "message": "Human-in-the-loop confirmation is required to execute mitigation.",
            "strategy_name": payload.strategy_name,
            "upload_id": payload.upload_id,
        }

    try:
        return await run_bias_mitigation(payload, session)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mitigation failed: {str(e)}")


@router.post("/mitigation/rank")
async def rank_mitigations(
    payload: MitigationRankingRequest,
    session: AsyncSession = Depends(get_session),
):
    try:
        return await run_mitigation_ranking(payload, session)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mitigation ranking failed: {e}")


@router.get("/mitigate/download-model/{upload_id}")
async def download_mitigated_model(
    upload_id: int,
    strategy: str | None = Query(default=None),
    mitigation_id: int | None = Query(default=None),
    format: str = Query(default="joblib", pattern="^(pkl|joblib)$"),
    session: AsyncSession = Depends(get_session),
):
    record = await _get_latest_mitigation_record(
        upload_id, strategy, mitigation_id, session
    )

    if not record.artifact_model_path or not os.path.exists(record.artifact_model_path):
        raise HTTPException(status_code=404, detail="Mitigated model file not found")

    base_name = os.path.splitext(os.path.basename(record.artifact_model_path))[0]
    if format == "pkl":
        filename = cleanup_download_filename(f"{base_name}.pkl")
    else:
        filename = cleanup_download_filename(f"{base_name}.joblib")

    return FileResponse(
        path=record.artifact_model_path,
        media_type="application/octet-stream",
        filename=filename,
    )


@router.get("/mitigate/download-dataset/{upload_id}")
async def download_mitigated_dataset(
    upload_id: int,
    strategy: str | None = Query(default=None),
    mitigation_id: int | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
):
    record = await _get_latest_mitigation_record(
        upload_id, strategy, mitigation_id, session
    )

    if not record.artifact_dataset_path or not os.path.exists(
        record.artifact_dataset_path
    ):
        raise HTTPException(status_code=404, detail="Mitigated dataset not found")

    return FileResponse(
        path=record.artifact_dataset_path,
        media_type="text/csv",
        filename=cleanup_download_filename(
            os.path.basename(record.artifact_dataset_path)
        ),
    )
