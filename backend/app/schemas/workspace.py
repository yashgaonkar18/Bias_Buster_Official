from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class WorkspaceBase(BaseModel):
    name: str = Field(..., max_length=255)
    is_favorite: Optional[bool] = False

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    is_favorite: Optional[bool] = None

class WorkspaceResponse(WorkspaceBase):
    id: int
    user_id: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
