from typing import List, Optional
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.experiment import Experiment
from app.models.workspace import Workspace
from app.repositories.base import BaseRepository

class ExperimentRepository(BaseRepository[Experiment]):
    async def get_by_id_for_user(self, experiment_id: int, user_id: int) -> Optional[Experiment]:
        result = await self.session.execute(
            select(Experiment)
            .join(Workspace)
            .where(
                Experiment.id == experiment_id,
                Workspace.user_id == user_id,
                Workspace.is_deleted == False
            )
        )
        return result.scalars().first()

    async def get_all_for_user(self, user_id: int, search: Optional[str] = None) -> List[Experiment]:
        query = select(Experiment).join(Workspace).where(
            Workspace.user_id == user_id,
            Workspace.is_deleted == False
        )
        
        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                or_(
                    Experiment.name.ilike(search_pattern),
                    Experiment.dataset_name.ilike(search_pattern)
                )
            )
            
        query = query.order_by(Experiment.created_at.desc())
        
        result = await self.session.execute(query)
        return list(result.scalars().all())
