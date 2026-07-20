import re
import pandas as pd
from typing import Any, List

def normalize_string(s: str) -> str:
    """
    Normalizes a column name to a standard format to facilitate matching:
    - Strips leading/trailing spaces
    - Replaces colons and dashes with underscores
    - Replaces multiple spaces with a single space
    - Replaces spaces with underscores
    - Replaces multiple underscores with a single underscore
    - Converts to lowercase
    """
    if not isinstance(s, str):
        return s
    
    s = s.strip()
    s = s.replace(':', '_').replace('-', '_')
    s = re.sub(r'\s+', ' ', s)
    s = s.replace(' ', '_')
    s = re.sub(r'_+', '_', s)
    
    return s.lower()

def get_expected_features(model: Any) -> List[str]:
    """Try to extract expected feature names from the model or its pipeline."""
    # Check directly on the model
    if hasattr(model, 'feature_names_in_'):
        return list(model.feature_names_in_)
    
    # Check if it's a wrapper/pipeline and try to extract from the first step
    if hasattr(model, 'steps') and len(model.steps) > 0:
        first_step = model.steps[0][1]
        if hasattr(first_step, 'feature_names_in_'):
            return list(first_step.feature_names_in_)
            
    # Check wrapped estimator 
    if hasattr(model, 'estimator_') and hasattr(model.estimator_, 'feature_names_in_'):
        return list(model.estimator_.feature_names_in_)
        
    return []

def normalize_dataframe_columns(df: pd.DataFrame, model: Any = None) -> pd.DataFrame:
    """
    Normalizes DataFrame columns to match the trained model's expected feature names
    to prevent prediction errors due to simple formatting differences
    (e.g., 'Checking account' vs 'Checking_account').
    """
    expected_features = get_expected_features(model)
    
    if not expected_features:
        # If the model doesn't expose feature_names_in_, just return the dataframe as-is
        # so we don't accidentally rename things that shouldn't be renamed.
        return df
        
    # Create a mapping of normalized expected features back to the original expected feature
    expected_map = {normalize_string(feat): feat for feat in expected_features}
    
    new_columns = []
    for col in df.columns:
        if not isinstance(col, str):
            new_columns.append(col)
            continue
            
        norm_col = normalize_string(col)
        
        # If the normalized column matches an expected feature, use the expected feature exactly
        if norm_col in expected_map:
            new_columns.append(expected_map[norm_col])
        else:
            # Keep original for features not expected by the model
            new_columns.append(col)
            
    df.columns = new_columns
    
    missing = set(expected_features) - set(df.columns)
    if missing:
        raise ValueError(
            f"The following required columns are missing from the dataset: {missing}"
        )
            
    return df
