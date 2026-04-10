def _extract_fairness_metrics(baseline_metrics: dict) -> dict:
    if not isinstance(baseline_metrics, dict):
        raise ValueError("baseline_metrics must be a dictionary")

    fairness = baseline_metrics.get("fairness")
    if isinstance(fairness, dict):
        return fairness

    wrapped = baseline_metrics.get("baseline_metrics")
    if isinstance(wrapped, dict) and isinstance(wrapped.get("fairness"), dict):
        return wrapped["fairness"]

    raise ValueError(
        "Missing fairness metrics. Expected key 'fairness' or 'baseline_metrics.fairness'."
    )


def recommend_strategy(
    baseline_metrics: dict,
    dataset_shape: dict = None,
    model_type: str = None
):
    """
    Recommend a bias mitigation strategy based on baseline fairness metrics, dataset shape, and model type.

    Input:
        baseline_metrics: Dict with 'fairness' and 'performance' nested dicts.
        dataset_shape: Optional dict with 'rows' and 'columns'.
        model_type: Optional string identifying the model classifier.
    """

    fairness = _extract_fairness_metrics(baseline_metrics)

    dpd = abs(fairness.get("dpd", 0))
    eod = abs(fairness.get("eod", 0))
    dir_ratio = fairness.get("dir", 1.0)
    
    dir_violation = abs(1.0 - dir_ratio)

    violations = {
        "dpd": dpd > 0.10,
        "eod": eod > 0.10,
        "dir": dir_ratio < 0.80 or dir_ratio > 1.25,
    }

    has_violations = any(violations.values())
    explanations = []
    
    rows = dataset_shape.get("rows", 0) if dataset_shape else 0
    is_tree_based = model_type and any(t in model_type for t in ["Forest", "Boost", "Tree"])

    # Strategy Pros/Cons Knowledge Base
    strategy_details = {
        "smote": {
            "pros": ["Directly addresses severe representation imbalances (DIR).", "Works well for smaller datasets (< 50k rows)."],
            "cons": ["May generate noisy samples if boundaries are overlapping.", "Performance intensive on very large datasets."]
        },
        "reweighting": {
            "pros": ["Computationally efficient; modifies importance without adding rows.", "Ideal for large datasets and correcting DPD statistically."],
            "cons": ["Can cause model instability if weights become extreme.", "Might not perfectly correct disparate impact if representation is extremely low."]
        },
        "threshold": {
            "pros": ["Model agonistic post-processing.", "Excellent at explicitly bounding EOD without retraining the whole model."],
            "cons": ["Requires access to target labels and sensitive features during prediction.", "Only tunes probability thresholds, doesn't fix underlying data relationships."]
        }
    }

    if not has_violations:
        return {
            "recommended_strategy": "none",
            "confidence_score": 100,
            "violations": violations,
            "explanation": "No significant fairness violations detected. Mitigation may not be necessary.",
            "alternatives": [],
            "pros": [],
            "cons": [],
            "note": "Applying intervention will affect model accuracy, so human review is recommended."
        }

    # Build explanation of violations
    if violations["dir"]:
        explanations.append("Disparate Impact Ratio is outside the 0.8-1.25 fair range, indicating a representation imbalance.")
    if violations["eod"]:
        explanations.append("Equal Opportunity Difference is high, suggesting unequal true positive rates.")
    if violations["dpd"]:
        explanations.append("Demographic Parity Difference is high, indicating unequal selection rates.")
        
    # Heuristics Base Scores
    score_smote = (dir_violation * 1.5) + (dpd * 0.5)
    score_reweight = (dpd * 1.2) + (eod * 0.8) + (dir_violation * 0.5)
    score_threshold = (eod * 1.5) + (dpd * 0.5)

    # Contextual Modifiers based on Dataset Shape
    if rows > 0:
        if rows > 50000:
            # SMOTE penalization for very large datasets
            score_smote *= 0.7 
            # Reweighting boost for large datasets
            score_reweight *= 1.2 
        elif rows < 5000:
            # SMOTE is great for small datasets lacking representation
            score_smote *= 1.3 

    # Contextual Modifiers based on Model Type
    if is_tree_based:
        # Reweighting sometimes struggles with deep trees if sample_weight is not supported well, 
        # though sklearn trees support it. We'll give a slight edge to SMOTE & Post-processing
        score_smote *= 1.1
        score_threshold *= 1.1
    else:
        # For linear models, reweighting works exceptionally well
        score_reweight *= 1.1

    strategy_scores = {
        "smote": score_smote,
        "reweighting": score_reweight,
        "threshold": score_threshold
    }
    
    # Rank by descending score
    ranked_strategies = sorted(strategy_scores.items(), key=lambda x: x[1], reverse=True)
    
    recommended = ranked_strategies[0][0]
    alternatives = [strat for strat, score in ranked_strategies[1:]]

    # Calculate Confidence Score (relative dominance of top choice)
    top_score = ranked_strategies[0][1]
    second_score = ranked_strategies[1][1]
    total_score = sum(score for _, score in ranked_strategies)
    
    if total_score > 0:
        # Give a confidence percent: base 50% + remaining based on margin of victory
        margin = (top_score - second_score) / total_score
        confidence = min(99, int(50 + (margin * 100)))
    else:
        confidence = 50

    return {
        "recommended_strategy": recommended,
        "confidence_score": confidence,
        "violations": violations,
        "explanation": " ".join(explanations),
        "alternatives": alternatives,
        "pros": strategy_details[recommended]["pros"],
        "cons": strategy_details[recommended]["cons"],
        "note": (
            "Mitigation strategies have been dynamically ranked based on violation severity, dataset size, and model type. "
            "Applying intervention will likely alter model accuracy, so human review is recommended."
        ),
    }
