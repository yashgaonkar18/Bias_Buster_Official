from typing import List, Optional
from fastapi import HTTPException
from app.models.experiment import Experiment
from app.schemas.experiment import ExperimentCreate, ExperimentUpdate
from app.repositories.experiment_repository import ExperimentRepository
from app.repositories.workspace_repository import WorkspaceRepository

class ExperimentService:
    def __init__(self, experiment_repo: ExperimentRepository, workspace_repo: WorkspaceRepository):
        self.experiment_repo = experiment_repo
        self.workspace_repo = workspace_repo

    async def create_experiment(self, user_id: int, data: ExperimentCreate) -> Experiment:
        workspace = await self.workspace_repo.get_by_id_for_user(data.workspace_id, user_id)
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
            
        experiment = Experiment(
            workspace_id=data.workspace_id,
            name=data.name,
            dataset_name=data.dataset_name
        )
        return await self.experiment_repo.add(experiment)

    async def get_experiments(self, user_id: int, search: Optional[str] = None) -> List[Experiment]:
        return await self.experiment_repo.get_all_for_user(user_id, search)

    async def update_experiment(self, user_id: int, experiment_id: int, data: ExperimentUpdate) -> Experiment:
        experiment = await self.experiment_repo.get_by_id_for_user(experiment_id, user_id)
        if not experiment:
            raise HTTPException(status_code=404, detail="Experiment not found")
        
        if data.name is not None:
            experiment.name = data.name
        if data.dataset_name is not None:
            experiment.dataset_name = data.dataset_name
            
        await self.experiment_repo.commit()
        await self.experiment_repo.refresh(experiment)
        return experiment

    async def delete_experiment(self, user_id: int, experiment_id: int) -> dict:
        experiment = await self.experiment_repo.get_by_id_for_user(experiment_id, user_id)
        if not experiment:
            raise HTTPException(status_code=404, detail="Experiment not found")
        
        await self.experiment_repo.delete(experiment)
        return {"message": "Experiment deleted successfully"}
