import time
import optuna
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, ParameterGrid, KFold
from sklearn.base import clone
from sklearn.metrics import accuracy_score

from app.utils.fairness_metrics import evaluate_baseline

PARAM_GRIDS = {
    "RandomForestClassifier": {
        "n_estimators": [50, 100, 200],
        "max_depth": [None, 10, 20],
        "min_samples_split": [2, 5]
    },
    "LogisticRegression": {
        "C": [0.1, 1.0, 10.0],
        "max_iter": [1000]
    },
    "XGBClassifier": {
        "n_estimators": [50, 100, 200],
        "max_depth": [3, 5, 7],
        "learning_rate": [0.01, 0.1, 0.2]
    },
    "LGBMClassifier": {
        "n_estimators": [50, 100, 200],
        "max_depth": [-1, 10, 20],
        "learning_rate": [0.01, 0.1, 0.2]
    },
    "DecisionTreeClassifier": {
        "max_depth": [None, 10, 20],
        "min_samples_split": [2, 5, 10]
    },
    "SVC": {
        "C": [0.1, 1.0, 10.0],
        "kernel": ["linear", "rbf"]
    }
}

OPTUNA_PARAMS = {
    "RandomForestClassifier": {
        "n_estimators": ("int", 50, 300),
        "max_depth": ("int", 5, 30),
        "min_samples_split": ("int", 2, 10)
    },
    "LogisticRegression": {
        "C": ("loguniform", 1e-3, 1e2),
        "max_iter": ("categorical", [1000])
    },
    "XGBClassifier": {
        "n_estimators": ("int", 50, 300),
        "max_depth": ("int", 3, 10),
        "learning_rate": ("loguniform", 1e-3, 1.0)
    },
    "LGBMClassifier": {
        "n_estimators": ("int", 50, 300),
        "max_depth": ("int", 3, 20),
        "learning_rate": ("loguniform", 1e-3, 1.0)
    },
    "DecisionTreeClassifier": {
        "max_depth": ("int", 3, 30),
        "min_samples_split": ("int", 2, 20)
    },
    "SVC": {
        "C": ("loguniform", 1e-3, 1e2),
        "kernel": ("categorical", ["linear", "rbf"])
    }
}

def get_model_class_name(model) -> str:
    from sklearn.pipeline import Pipeline
    if isinstance(model, Pipeline):
        # Assume the last step is the actual classifier
        return model.steps[-1][1].__class__.__name__
    return model.__class__.__name__

def get_param_grid(model_class_name: str) -> dict:
    return PARAM_GRIDS.get(model_class_name, {})

def get_optuna_params(model_class_name: str) -> dict:
    return OPTUNA_PARAMS.get(model_class_name, {})

class FairnessAwareOptimizer:
    def __init__(self, model, X, y, sensitive_features, test_size=0.3, random_state=42, accuracy_weight=0.5, fairness_weight=0.5):
        self.base_model = model
        self.X = X
        self.y = y
        self.sensitive_features = sensitive_features
        self.test_size = test_size
        self.random_state = random_state
        self.accuracy_weight = accuracy_weight
        self.fairness_weight = fairness_weight

        # Split data here to ensure same validation set for all trials
        # Extract sensitive feature name - assuming first one is main for optimization evaluation
        self.main_sensitive_col = self.sensitive_features.columns[0]
        
        # We need a proper split that keeps X, y, and sensitive aligned
        idx = np.arange(len(self.y))
        self.idx_train, self.idx_val = train_test_split(idx, test_size=self.test_size, random_state=self.random_state)
        
    def _evaluate_params(self, params):
        model = clone(self.base_model)
        
        # Apply params properly - handle Pipeline if necessary
        from sklearn.pipeline import Pipeline
        if isinstance(model, Pipeline):
            # Prefix params with step name
            step_name = model.steps[-1][0]
            prefixed_params = {f"{step_name}__{k}": v for k, v in params.items()}
            model.set_params(**prefixed_params)
        else:
            model.set_params(**params)

        # Train on train set
        X_train = self.X.iloc[self.idx_train]
        y_train = self.y[self.idx_train]
        
        # Validation set
        X_val = self.X.iloc[self.idx_val]
        y_val = self.y[self.idx_val]
        sensitive_val = self.sensitive_features.iloc[self.idx_val][self.main_sensitive_col]
        
        try:
            model.fit(X_train, y_train)
            
            from app.utils.prediction import get_expected_features, standardize_columns
            # Try to get raw_X for predict_labels if model expects it, else standard predict
            try:
                from app.utils.prediction import predict_labels
                # Re-create raw_X equivalent if needed, but for simplicity:
                y_pred = predict_labels(model, X=X_val, raw_X=X_val, sensitive_features=sensitive_val)
            except Exception:
                y_pred = model.predict(X_val)

            metrics = evaluate_baseline(y_val, y_pred, sensitive_val)
            
            # Extract scores
            accuracy = accuracy_score(y_val, y_pred)
            dpd = abs(metrics.get("fairness", {}).get("dpd", 0))
            eod = abs(metrics.get("fairness", {}).get("eod", 0))
            
            # Compute a normalized fairness score (higher is better, 1.0 means no bias)
            # Both DPD and EOD ideally 0
            fairness_penalty = (dpd + eod) / 2.0
            fairness_score = max(0.0, 1.0 - fairness_penalty)
            
            combined_score = (accuracy * self.accuracy_weight) + (fairness_score * self.fairness_weight)
            
            return {
                "accuracy": float(accuracy),
                "dpd": float(dpd),
                "eod": float(eod),
                "fairness_score": float(fairness_score),
                "combined_score": float(combined_score),
            }
        except Exception as e:
            print(f"Trial failed with params {params}: {e}")
            return {
                "accuracy": 0.0,
                "dpd": 1.0,
                "eod": 1.0,
                "fairness_score": 0.0,
                "combined_score": 0.0,
            }

    def optimize_with_gridsearch(self, param_grid, cv=3):
        # We simulate GridSearch over our custom evaluation function
        # cv parameter is mostly ignored here as we use a single train/val split for speed, 
        # but could be implemented as real CV.
        grid = ParameterGrid(param_grid)
        
        results = []
        best_score = -1.0
        best_params = {}
        best_metrics = {}
        
        for params in grid:
            metrics = self._evaluate_params(params)
            trial_result = {"params": params, **metrics}
            results.append(trial_result)
            
            if metrics["combined_score"] > best_score:
                best_score = metrics["combined_score"]
                best_params = params
                best_metrics = metrics
                
        # Sort results by combined score
        results.sort(key=lambda x: x["combined_score"], reverse=True)
        
        return {
            "best_params": best_params,
            "best_score": best_score,
            **best_metrics,
            "optimization_method": "gridsearch",
            "trials_run": len(results),
            "comparison": results
        }

    def optimize_with_optuna(self, param_distributions, n_trials=20, timeout=None):
        optuna.logging.set_verbosity(optuna.logging.WARNING)
        
        results = []
        
        def objective(trial):
            params = {}
            for name, config in param_distributions.items():
                ptype = config[0]
                if ptype == "int":
                    params[name] = trial.suggest_int(name, config[1], config[2])
                elif ptype == "float":
                    params[name] = trial.suggest_float(name, config[1], config[2])
                elif ptype == "loguniform":
                    params[name] = trial.suggest_float(name, config[1], config[2], log=True)
                elif ptype == "categorical":
                    params[name] = trial.suggest_categorical(name, config[1])
            
            metrics = self._evaluate_params(params)
            
            trial.set_user_attr("accuracy", metrics["accuracy"])
            trial.set_user_attr("dpd", metrics["dpd"])
            trial.set_user_attr("eod", metrics["eod"])
            trial.set_user_attr("fairness_score", metrics["fairness_score"])
            trial.set_user_attr("params", params)
            
            results.append({"params": params, **metrics})
            
            return metrics["combined_score"]

        study = optuna.create_study(direction="maximize")
        study.optimize(objective, n_trials=n_trials, timeout=timeout)
        
        best_trial = study.best_trial
        
        # Sort results by combined score
        results.sort(key=lambda x: x["combined_score"], reverse=True)
        
        return {
            "best_params": best_trial.user_attrs.get("params", {}),
            "best_score": best_trial.value,
            "accuracy": best_trial.user_attrs.get("accuracy", 0.0),
            "dpd": best_trial.user_attrs.get("dpd", 0.0),
            "eod": best_trial.user_attrs.get("eod", 0.0),
            "fairness_score": best_trial.user_attrs.get("fairness_score", 0.0),
            "combined_score": best_trial.value,
            "optimization_method": "optuna",
            "trials_run": len(study.trials),
            "comparison": results
        }
