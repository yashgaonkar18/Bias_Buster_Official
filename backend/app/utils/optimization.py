import optuna
from app.utils.preprocessing import preprocess_dataset
from app.utils.prediction import standardize_columns, get_expected_features, predict_labels
from app.utils.fairness_metrics import evaluate_baseline, calculate_severity
from app.utils.smote import apply_smote
from app.utils.threshold import apply_threshold_optimizer
from sklearn.base import clone
from sklearn.pipeline import Pipeline
import logging

optuna.logging.set_verbosity(optuna.logging.WARNING)

def run_optuna_optimization(strategy: str, df, model, target_column: str, sensitive_col: str, n_trials: int = 15):
    """
    Run an Optuna study to find the best hyperparameters for the selected mitigation strategy.
    Optimizes for a balance of high accuracy and low bias severity.
    """
    
    # Preprocess once outside the objective if possible, but for SMOTE we need fresh starts
    X_base, y_base, sensitive_base = preprocess_dataset(df, target_column, sensitive_col)
    raw_X_base = df.drop(columns=[target_column])
    
    expected = get_expected_features(model)
    if expected is not None:
        X_base = standardize_columns(X_base, expected)
        raw_X_base = standardize_columns(raw_X_base, expected)

    def objective(trial):
        # 1. Parameter Suggestion
        strategy_config = {}
        if strategy == "smote":
            # k_neighbors must be int between 1 and 10
            strategy_config["k_neighbors"] = trial.suggest_int("k_neighbors", 1, 10)
        elif strategy == "threshold":
            strategy_config["constraints"] = trial.suggest_categorical("constraints", ["demographic_parity", "equalized_odds"])
            strategy_config["grid_size"] = trial.suggest_int("grid_size", 50, 400, step=50)
        elif strategy == "reweighting":
            # Just a placeholder if we want to tune weight clipping in the future
            strategy_config["clip_weights"] = trial.suggest_categorical("clip_weights", [True, False])

        # 2. Apply Mitigation
        X_current = X_base.copy()
        y_current = y_base.copy()
        sensitive_current = sensitive_base.copy()
        raw_X = raw_X_base.copy()
        
        mitigated_model = model

        try:
            if strategy == "smote":
                mitigated_model, X_balanced, y_balanced, sensitive_balanced = apply_smote(
                    X_current, y_current, sensitive_current, mitigated_model, 
                    k_neighbors_override=strategy_config["k_neighbors"]
                )
                X_current = X_balanced
                y_current = y_balanced
                sensitive_current = sensitive_balanced
                raw_X = X_current.copy()

            elif strategy == "reweighting":
                from app.utils.reweighting import compute_sample_weights
                weights = compute_sample_weights(y_current, sensitive_current)
                
                if strategy_config["clip_weights"]:
                    weights = weights.clip(upper=weights.quantile(0.95))
                    
                mitigated_model = clone(mitigated_model)
                if isinstance(mitigated_model, Pipeline):
                    mitigated_model.fit(X_current, y_current, model__sample_weight=weights)
                elif type(mitigated_model).__name__ == "ThresholdOptimizer":
                    mitigated_model.prefit = False
                    mitigated_model.fit(X_current, y_current, sample_weight=weights, sensitive_features=sensitive_current)
                else:
                    mitigated_model.fit(X_current, y_current, sample_weight=weights)

            elif strategy == "threshold":
                mitigated_model = apply_threshold_optimizer(
                    mitigated_model, X_current, y_current, sensitive_current, 
                    grid_size=strategy_config["grid_size"],
                    constraints=strategy_config["constraints"]
                )
        except Exception as e:
            # If the configuration utterly fails (e.g., k_neighbors too large), return a terrible score
            return -100.0

        # 3. Predict and evaluate
        try:
            if type(mitigated_model).__name__ == "ThresholdOptimizer":
                y_pred = mitigated_model.predict(X_current, sensitive_features=sensitive_current)
            else:
                y_pred = predict_labels(mitigated_model, X=X_current, raw_X=raw_X, sensitive_features=sensitive_current)
        except Exception:
            y_pred = mitigated_model.predict(X_current)
            
        metrics = evaluate_baseline(y_current, y_pred, sensitive_current)
        
        # 4. Compute Fitness: We want to MAXIMIZE accuracy and MINIMIZE severity
        accuracy = metrics.get("performance", {}).get("accuracy", 0)
        severity = metrics.get("bias_severity_score", 0)
        
        # Custom objective: scale severity down (0 to 10 scale) so it matches accuracy (0 to 1) 
        # Actually severity is usually 0 to 1 as calculated by `calculate_severity` internally but evaluate_baseline scales to severity_score?
        # Let's use the raw dpd, eod
        dpd = abs(metrics.get("fairness", {}).get("dpd", 0))
        eod = abs(metrics.get("fairness", {}).get("eod", 0))
        
        fitness = accuracy - (dpd + eod)
        
        # Save metrics as user attributes for extraction later
        trial.set_user_attr("accuracy", accuracy)
        trial.set_user_attr("dpd", dpd)
        trial.set_user_attr("eod", eod)
        trial.set_user_attr("severity_score", severity)

        return fitness

    study = optuna.create_study(direction="maximize")
    study.optimize(objective, n_trials=n_trials)
    
    best_trial = study.best_trial
    
    return {
        "best_params": best_trial.params,
        "best_fitness": best_trial.value,
        "metrics": {
            "accuracy": best_trial.user_attrs.get("accuracy"),
            "dpd": best_trial.user_attrs.get("dpd"),
            "eod": best_trial.user_attrs.get("eod"),
            "severity_score": best_trial.user_attrs.get("severity_score"),
        }
    }
