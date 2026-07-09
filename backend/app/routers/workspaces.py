from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.db import get_session
from app.models.workspace import Workspace, DashboardExperiment
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceOut,
    DashboardExperimentCreate,
    DashboardExperimentUpdate,
    DashboardExperimentOut,
)

router = APIRouter(tags=["Workspaces & Dashboard Experiments"])

# Workspaces CRUD
@router.get("/api/workspaces", response_model=List[WorkspaceOut])
async def get_workspaces(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Workspace).order_by(Workspace.id.asc()))
    return result.scalars().all()

@router.post("/api/workspaces", response_model=WorkspaceOut)
async def create_workspace(payload: WorkspaceCreate, session: AsyncSession = Depends(get_session)):
    # Check limit of 3 workspaces for this user
    count_result = await session.execute(select(Workspace))
    workspaces = count_result.scalars().all()
    if len(workspaces) >= 3:
        raise HTTPException(status_code=400, detail="Workspace limit reached")

    new_ws = Workspace(name=payload.name, is_favorite=False)
    session.add(new_ws)
    await session.commit()
    await session.refresh(new_ws)
    return new_ws

@router.patch("/api/workspaces/{workspace_id}", response_model=WorkspaceOut)
async def update_workspace(workspace_id: int, payload: WorkspaceUpdate, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Workspace).where(Workspace.id == workspace_id))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    if payload.name is not None:
        ws.name = payload.name
    if payload.is_favorite is not None:
        ws.is_favorite = payload.is_favorite
        
    await session.commit()
    await session.refresh(ws)
    return ws

@router.delete("/api/workspaces/{workspace_id}")
async def delete_workspace(workspace_id: int, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Workspace).where(Workspace.id == workspace_id))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    await session.delete(ws)
    await session.commit()
    return {"status": "success"}

# Dashboard Experiments CRUD
@router.get("/api/experiments", response_model=List[DashboardExperimentOut])
async def get_dashboard_experiments(
    workspace_id: int = Query(..., description="Workspace ID to filter by"),
    search: Optional[str] = Query(None, description="Search text to filter experiment name"),
    session: AsyncSession = Depends(get_session)
):
    query = select(DashboardExperiment).where(DashboardExperiment.workspace_id == workspace_id)
    if search:
        query = query.where(DashboardExperiment.name.ilike(f"%{search}%"))
    query = query.order_by(DashboardExperiment.id.asc())
    
    result = await session.execute(query)
    return result.scalars().all()

@router.post("/api/experiments", response_model=DashboardExperimentOut)
async def create_dashboard_experiment(payload: DashboardExperimentCreate, session: AsyncSession = Depends(get_session)):
    # Verify workspace exists and belongs to user
    ws_result = await session.execute(select(Workspace).where(Workspace.id == payload.workspace_id))
    ws = ws_result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    new_exp = DashboardExperiment(name=payload.name, workspace_id=payload.workspace_id)
    session.add(new_exp)
    await session.commit()
    await session.refresh(new_exp)
    return new_exp

@router.patch("/api/experiments/{experiment_id}", response_model=DashboardExperimentOut)
async def update_dashboard_experiment(experiment_id: int, payload: DashboardExperimentUpdate, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(DashboardExperiment).where(DashboardExperiment.id == experiment_id))
    exp = result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
        
    exp.name = payload.name
    await session.commit()
    await session.refresh(exp)
    return exp

@router.delete("/api/experiments/{experiment_id}")
async def delete_dashboard_experiment(experiment_id: int, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(DashboardExperiment).where(DashboardExperiment.id == experiment_id))
    exp = result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
        
    await session.delete(exp)
    await session.commit()
    return {"status": "success"}
