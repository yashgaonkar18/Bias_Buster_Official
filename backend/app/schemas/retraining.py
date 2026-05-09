from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class RetrainingRequest(BaseModel):
    upload_id: int
    target_column: str
    sensitive_columns: List[str]
    strategy: str = Field(..., description="Method used: 'reweighting' or 'smote'")
    train_additional_models: bool = Field(True, description="Whether to train benchmark models")
    random_seed: int = Field(42, description="Random seed for splits")
    test_size: float = Field(0.2, description="Test split size")

class FairnessStability(BaseModel):
    stable: bool
    observation: str

class RetrainingResponse(BaseModel):
    status: str
    retraining_id: str
    strategy_used: str
    original_model_metrics: Dict[str, Any]
    mitigated_model_metrics: Dict[str, Any]
    retrained_model_metrics: Dict[str, Any]
    fairness_stability: FairnessStability
    model_version: str
    training_metadata: Dict[str, Any]
    summary: str
