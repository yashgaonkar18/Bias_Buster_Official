from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_session
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.experiment import ExperimentCreate, ExperimentUpdate, ExperimentResponse
from app.repositories.experiment_repository import ExperimentRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.services.experiment_service import ExperimentService

router = APIRouter(prefix="/api/experiments", tags=["Experiments"])

def get_experiment_service(session: AsyncSession = Depends(get_session)) -> ExperimentService:
    exp_repo = ExperimentRepository(session)
    ws_repo = WorkspaceRepository(session)
    return ExperimentService(exp_repo, ws_repo)

@router.post("", response_model=ExperimentResponse)
async def create_experiment(
    data: ExperimentCreate,
    user: User = Depends(get_current_user),
    service: ExperimentService = Depends(get_experiment_service)
):
    return await service.create_experiment(user.id, data)

@router.get("", response_model=List[ExperimentResponse])
async def get_experiments(
    search: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    service: ExperimentService = Depends(get_experiment_service)
):
    return await service.get_experiments(user.id, search)

@router.patch("/{experiment_id}", response_model=ExperimentResponse)
async def update_experiment(
    experiment_id: int,
    data: ExperimentUpdate,
    user: User = Depends(get_current_user),
    service: ExperimentService = Depends(get_experiment_service)
):
    return await service.update_experiment(user.id, experiment_id, data)

@router.delete("/{experiment_id}")
async def delete_experiment(
    experiment_id: int,
    user: User = Depends(get_current_user),
    service: ExperimentService = Depends(get_experiment_service)
):
    return await service.delete_experiment(user.id, experiment_id)
