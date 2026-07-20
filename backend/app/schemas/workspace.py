from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class WorkspaceBase(BaseModel):
    name: str

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    is_favorite: Optional[bool] = None

class WorkspaceOut(WorkspaceBase):
    id: int
    is_favorite: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DashboardExperimentBase(BaseModel):
    name: str

class DashboardExperimentCreate(DashboardExperimentBase):
    workspace_id: int

class DashboardExperimentUpdate(BaseModel):
    name: str

class DashboardExperimentOut(DashboardExperimentBase):
    id: int
    workspace_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
