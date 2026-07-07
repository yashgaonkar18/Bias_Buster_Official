from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_session
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse
from app.repositories.workspace_repository import WorkspaceRepository
from app.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/api/workspaces", tags=["Workspaces"])

def get_workspace_service(session: AsyncSession = Depends(get_session)) -> WorkspaceService:
    repo = WorkspaceRepository(session)
    return WorkspaceService(repo)

@router.post("", response_model=WorkspaceResponse)
async def create_workspace(
    data: WorkspaceCreate,
    user: User = Depends(get_current_user),
    service: WorkspaceService = Depends(get_workspace_service)
):
    return await service.create_workspace(user.id, data)

@router.get("", response_model=List[WorkspaceResponse])
async def get_workspaces(
    user: User = Depends(get_current_user),
    service: WorkspaceService = Depends(get_workspace_service)
):
    return await service.get_workspaces(user.id)

@router.patch("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: int,
    data: WorkspaceUpdate,
    user: User = Depends(get_current_user),
    service: WorkspaceService = Depends(get_workspace_service)
):
    return await service.update_workspace(user.id, workspace_id, data)

@router.delete("/{workspace_id}")
async def delete_workspace(
    workspace_id: int,
    user: User = Depends(get_current_user),
    service: WorkspaceService = Depends(get_workspace_service)
):
    return await service.delete_workspace(user.id, workspace_id)
