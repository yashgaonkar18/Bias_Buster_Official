from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.workspace import Workspace
from app.repositories.base import BaseRepository

class WorkspaceRepository(BaseRepository[Workspace]):
    async def get_by_id_for_user(self, workspace_id: int, user_id: int) -> Optional[Workspace]:
        result = await self.session.execute(
            select(Workspace).where(
                Workspace.id == workspace_id,
                Workspace.user_id == user_id,
                Workspace.is_deleted == False
            )
        )
        return result.scalars().first()

    async def get_all_for_user(self, user_id: int) -> List[Workspace]:
        result = await self.session.execute(
            select(Workspace).where(
                Workspace.user_id == user_id,
                Workspace.is_deleted == False
            ).order_by(Workspace.created_at.desc())
        )
        return list(result.scalars().all())

    async def count_for_user(self, user_id: int) -> int:
        result = await self.session.execute(
            select(func.count(Workspace.id)).where(
                Workspace.user_id == user_id,
                Workspace.is_deleted == False
            )
        )
        return result.scalar() or 0
