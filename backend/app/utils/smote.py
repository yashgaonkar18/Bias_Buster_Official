from imblearn.over_sampling import SMOTE
from sklearn.base import clone
import pandas as pd


def apply_smote(X, y, sensitive, model, k_neighbors_override=None):

    # Combine everything into one DataFrame
    df = pd.DataFrame(X)
    df["target"] = y
    df["sensitive"] = sensitive

    # Create compound target for fairness-aware SMOTE (Target + Sensitive Group)
    compound_target = df["target"].astype(str) + "_" + df["sensitive"].astype(str)
    
    # Calculate appropriate neighbors to avoid crashing on tiny subgroups
    min_samples = compound_target.value_counts().min()
    
    if k_neighbors_override is not None:
        k_neighbors = min(k_neighbors_override, max(1, min_samples - 1))
    else:
        k_neighbors = min(5, max(1, min_samples - 1))

    try:
        smote = SMOTE(random_state=42, k_neighbors=k_neighbors)
        X_resampled, compound_resampled = smote.fit_resample(df.drop(columns=["target", "sensitive"]), compound_target)
        
        y_resampled = compound_resampled.str.split("_", n=1).str[0].astype(int)
        
        # We can perfectly reconstruct the sensitive series aligned with generated data!
        sensitive_resampled = compound_resampled.str.split("_", n=1).str[1]
        
    except Exception:
        # Fallback to standard SMOTE on pure target if subgroups are too small or SMOTE fails
        smote = SMOTE(random_state=42)
        X_resampled, y_resampled = smote.fit_resample(df.drop(columns=["target", "sensitive"]), df["target"])
        
        sensitive_resampled = pd.Series(
            list(sensitive) + list(sensitive.sample(len(X_resampled) - len(X), replace=True))
        )

    # 🔥 Now rebuild dataframe properly
    df_resampled = pd.DataFrame(X_resampled, columns=X.columns)
    df_resampled["target"] = y_resampled
    
    # Ensure indices align
    sensitive_resampled.index = df_resampled.index

    # -----------------------------
    # Train model
    # -----------------------------
    new_model = clone(model)
    if type(new_model).__name__ == "ThresholdOptimizer":
        new_model.prefit = False
        new_model.fit(X_resampled, y_resampled, sensitive_features=sensitive_resampled)
    else:
        new_model.fit(X_resampled, y_resampled)

    return new_model, X_resampled, y_resampled, sensitive_resampled