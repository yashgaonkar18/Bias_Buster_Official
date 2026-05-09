from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class OptimizationRequest(BaseModel):
    upload_id: int
    target_column: str
    sensitive_columns: List[str]
    method: str = Field(description="Method to use: 'gridsearch' or 'optuna'")
    cv_folds: int = Field(3, description="Number of cross-validation folds for gridsearch")
    n_trials: int = Field(20, description="Number of trials for optuna")
    timeout: Optional[int] = Field(None, description="Timeout in seconds for optuna")
    accuracy_weight: float = Field(0.5, description="Weight for accuracy (0 to 1)")
    fairness_weight: float = Field(0.5, description="Weight for fairness (0 to 1)")

class OptimizationResponse(BaseModel):
    status: str
    best_params: Dict[str, Any]
    best_score: float
    accuracy: float
    fairness_score: float
    combined_score: float
    dpd: Optional[float] = None
    eod: Optional[float] = None
    optimization_method: str
    trials_run: int
    comparison: List[Dict[str, Any]]
    accuracy_weight: float
    fairness_weight: float
    message: str
