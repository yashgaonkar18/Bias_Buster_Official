from typing import List
from fastapi import HTTPException
from app.models.workspace import Workspace
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate
from app.repositories.workspace_repository import WorkspaceRepository

class WorkspaceService:
    def __init__(self, workspace_repo: WorkspaceRepository):
        self.workspace_repo = workspace_repo

    async def create_workspace(self, user_id: int, data: WorkspaceCreate) -> Workspace:
        count = await self.workspace_repo.count_for_user(user_id)
        if count >= 3:
            raise HTTPException(status_code=400, detail="Workspace limit reached.")
        
        workspace = Workspace(
            user_id=user_id,
            name=data.name,
            is_favorite=data.is_favorite
        )
        return await self.workspace_repo.add(workspace)

    async def get_workspaces(self, user_id: int) -> List[Workspace]:
        return await self.workspace_repo.get_all_for_user(user_id)

    async def update_workspace(self, user_id: int, workspace_id: int, data: WorkspaceUpdate) -> Workspace:
        workspace = await self.workspace_repo.get_by_id_for_user(workspace_id, user_id)
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        if data.name is not None:
            workspace.name = data.name
        if data.is_favorite is not None:
            workspace.is_favorite = data.is_favorite
            
        await self.workspace_repo.commit()
        await self.workspace_repo.refresh(workspace)
        return workspace

    async def delete_workspace(self, user_id: int, workspace_id: int) -> dict:
        workspace = await self.workspace_repo.get_by_id_for_user(workspace_id, user_id)
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        workspace.is_deleted = True
        await self.workspace_repo.commit()
        return {"message": "Workspace deleted successfully"}
