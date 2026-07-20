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
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.models import UploadRecord, OptimizationRun
from app.models.bias_audit import BiasAuditRecord
from app.models.bias_mitigation import BiasMitigationRun
from app.models.experiment import FairnessExperimentReport
from app.models.mitigation_ranking import MitigationRanking
from sqlalchemy import delete as sql_delete

router = APIRouter(tags=["Workspaces & Dashboard Experiments"])

# Workspaces CRUD
@router.get("/api/workspaces", response_model=List[WorkspaceOut])
async def get_workspaces(session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    result = await session.execute(
        select(Workspace)
        .where(Workspace.user_id == current_user.id)
        .order_by(Workspace.id.asc())
    )
    return result.scalars().all()

@router.post("/api/workspaces", response_model=WorkspaceOut)
async def create_workspace(payload: WorkspaceCreate, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    # Check limit of 3 workspaces for this user
    count_result = await session.execute(select(Workspace).where(Workspace.user_id == current_user.id))
    workspaces = count_result.scalars().all()
    if len(workspaces) >= 3:
        raise HTTPException(status_code=400, detail="Workspace limit reached")

    new_ws = Workspace(name=payload.name, is_favorite=False, user_id=current_user.id)
    session.add(new_ws)
    await session.commit()
    await session.refresh(new_ws)
    return new_ws

@router.patch("/api/workspaces/{workspace_id}", response_model=WorkspaceOut)
async def update_workspace(workspace_id: int, payload: WorkspaceUpdate, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    result = await session.execute(select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == current_user.id))
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
async def delete_workspace(workspace_id: int, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    result = await session.execute(select(Workspace).where(Workspace.id == workspace_id, Workspace.user_id == current_user.id))
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
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(DashboardExperiment)
        .join(Workspace, DashboardExperiment.workspace_id == Workspace.id)
        .where(DashboardExperiment.workspace_id == workspace_id, Workspace.user_id == current_user.id)
    )
    if search:
        query = query.where(DashboardExperiment.name.ilike(f"%{search}%"))
    query = query.order_by(DashboardExperiment.id.asc())
    
    result = await session.execute(query)
    return result.scalars().all()

@router.post("/api/experiments", response_model=DashboardExperimentOut)
async def create_dashboard_experiment(payload: DashboardExperimentCreate, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    # Verify workspace exists and belongs to user
    ws_result = await session.execute(select(Workspace).where(Workspace.id == payload.workspace_id, Workspace.user_id == current_user.id))
    ws = ws_result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    new_exp = DashboardExperiment(name=payload.name, workspace_id=payload.workspace_id, user_id=current_user.id)
    session.add(new_exp)
    await session.commit()
    await session.refresh(new_exp)
    return new_exp

@router.patch("/api/experiments/{experiment_id}", response_model=DashboardExperimentOut)
async def update_dashboard_experiment(experiment_id: int, payload: DashboardExperimentUpdate, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    result = await session.execute(
        select(DashboardExperiment)
        .where(DashboardExperiment.id == experiment_id, DashboardExperiment.user_id == current_user.id)
    )
    exp = result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
        
    exp.name = payload.name
    await session.commit()
    await session.refresh(exp)
    return exp

@router.delete("/api/experiments/{experiment_id}")
async def delete_dashboard_experiment(experiment_id: int, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    result = await session.execute(
        select(DashboardExperiment)
        .where(DashboardExperiment.id == experiment_id, DashboardExperiment.user_id == current_user.id)
    )
    exp = result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    # Fetch all uploads for this experiment
    uploads_result = await session.execute(
        select(UploadRecord).where(UploadRecord.experiment_id == experiment_id)
    )
    uploads = uploads_result.scalars().all()
    upload_ids = [u.id for u in uploads]

    if upload_ids:
        # Delete in FK-dependency order: leaf tables first
        await session.execute(sql_delete(MitigationRanking).where(MitigationRanking.upload_id.in_(upload_ids)))
        await session.execute(sql_delete(BiasMitigationRun).where(BiasMitigationRun.upload_id.in_(upload_ids)))
        await session.execute(sql_delete(BiasAuditRecord).where(BiasAuditRecord.upload_id.in_(upload_ids)))
        await session.execute(sql_delete(FairnessExperimentReport).where(FairnessExperimentReport.upload_id.in_(upload_ids)))
        await session.execute(sql_delete(UploadRecord).where(UploadRecord.id.in_(upload_ids)))

    await session.delete(exp)
    await session.commit()
    return {"status": "success"}

@router.get("/api/experiments/{experiment_id}/state")
async def get_experiment_state(experiment_id: int, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    # 1. Fetch Experiment
    exp_result = await session.execute(
        select(DashboardExperiment)
        .where(DashboardExperiment.id == experiment_id, DashboardExperiment.user_id == current_user.id)
    )
    exp = exp_result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    state = {
        "experiment": {
            "id": exp.id,
            "name": exp.name,
            "workspace_id": exp.workspace_id
        },
        "upload": None,
        "bias_detection": {"completed": False, "result": None},
        "mitigation_runs": [],
        "reports": [],
        "optimization": {"completed": False, "results": []},
        "artifacts": []
    }

    # 2. Fetch latest UploadRecord for this experiment
    upload_result = await session.execute(
        select(UploadRecord)
        .where(UploadRecord.experiment_id == exp.id, UploadRecord.user_id == current_user.id)
        .order_by(UploadRecord.created_at.desc())
    )
    upload = upload_result.scalars().first()

    if not upload:
        return state

    state["upload"] = {
        "id": upload.id,
        "dataset_filename": upload.dataset_filename,
        "original_dataset_filename": upload.original_dataset_filename,
        "model_filename": upload.model_filename,
        "original_model_filename": upload.original_model_filename,
        "dataset_rows": upload.dataset_rows,
        "dataset_columns": upload.dataset_columns,
        "dataset_columns_list": upload.dataset_columns_list,
        "model_type": upload.model_type,
        "created_at": upload.created_at.isoformat() if upload.created_at else None
    }

    # Populate artifacts: dataset + baseline model
    dataset_name = upload.original_dataset_filename or upload.dataset_filename
    model_name = upload.original_model_filename or upload.model_filename
    if dataset_name:
        state["artifacts"].append({"type": "dataset", "name": dataset_name})
    if model_name:
        state["artifacts"].append({"type": "baseline_model", "name": model_name})

    # 3. Fetch BiasAuditRecord
    bias_result = await session.execute(
        select(BiasAuditRecord)
        .where(BiasAuditRecord.upload_id == upload.id, BiasAuditRecord.user_id == current_user.id)
        .order_by(BiasAuditRecord.created_at.desc())
    )
    bias = bias_result.scalars().first()
    if bias:
        state["bias_detection"]["completed"] = True
        state["bias_detection"]["result"] = bias.audit_result

    # 4. Fetch MitigationRuns
    mitigation_result = await session.execute(
        select(BiasMitigationRun)
        .where(BiasMitigationRun.upload_id == upload.id, BiasMitigationRun.user_id == current_user.id)
        .order_by(BiasMitigationRun.created_at.desc())
    )
    mitigations = mitigation_result.scalars().all()
    
    import os
    for m in mitigations:
        state["mitigation_runs"].append({
            "id": m.id,
            "strategy_used": m.strategy_used,
            "config": m.config,
            "artifact_model_path": m.artifact_model_path,
            "artifact_dataset_path": m.artifact_dataset_path,
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "model_file_exists": os.path.exists(m.artifact_model_path) if m.artifact_model_path else False
        })
        if m.artifact_model_path and os.path.exists(m.artifact_model_path):
            artifact_name = os.path.basename(m.artifact_model_path)
            state["artifacts"].append({
                "type": "mitigated_model",
                "name": artifact_name,
                "mitigation_id": m.id,
                "strategy": m.strategy_used
            })

    # 5. Fetch Reports
    reports_result = await session.execute(
        select(FairnessExperimentReport)
        .where(FairnessExperimentReport.upload_id == upload.id, FairnessExperimentReport.user_id == current_user.id)
        .order_by(FairnessExperimentReport.created_at.desc())
    )
    reports = reports_result.scalars().all()
    for r in reports:
        state["reports"].append({
            "report_id": r.report_id,
            "title": r.title,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "pdf_download_url": f"/api/report/download/{r.report_id}",
            "json_download_url": f"/api/report/download-json/{r.report_id}"
        })
        state["artifacts"].append({
            "type": "report",
            "name": r.title or f"report_{r.report_id[:8]}.pdf",
            "report_id": r.report_id,
            "pdf_download_url": f"/api/report/download/{r.report_id}"
        })
        
    # 6. Fetch OptimizationRuns
    opt_result = await session.execute(
        select(OptimizationRun)
        .where(OptimizationRun.upload_id == upload.id, OptimizationRun.user_id == current_user.id)
        .order_by(OptimizationRun.created_at.desc())
    )
    opts = opt_result.scalars().all()
    if opts:
        state["optimization"]["completed"] = True
        for o in opts:
            state["optimization"]["results"].append({
                "id": o.id,
                "optimization_id": o.optimization_id,
                "optimization_method": o.optimization_method,
                "metrics_before": o.metrics_before,
                "metrics_after": o.metrics_after,
                "improvements": o.improvements,
                "status": o.status
            })
            if o.artifact_path and os.path.exists(o.artifact_path):
                artifact_name = os.path.basename(o.artifact_path)
                state["artifacts"].append({
                    "type": "optimized_model",
                    "name": artifact_name,
                    "optimization_id": o.optimization_id,
                    "method": o.optimization_method
                })

    return state
