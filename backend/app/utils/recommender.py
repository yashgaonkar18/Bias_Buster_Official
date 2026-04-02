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


def recommend_strategy(baseline_metrics: dict):
    """
    Recommend a bias mitigation strategy based on baseline fairness metrics.

    Input:
        baseline_metrics = {
            "performance": {...},
            "fairness": {
                "dpd": float,
                "eod": float,
                "dir": float
            }
        }
    """

    fairness = _extract_fairness_metrics(baseline_metrics)

    dpd = abs(fairness.get("dpd", 0))
    eod = abs(fairness.get("eod", 0))
    dir_ratio = fairness.get("dir", 1.0)
    
    dir_violation = abs(1.0 - dir_ratio)

    violations = {
        "dpd": dpd > 0.10,
        "eod": eod > 0.10,
        "dir": dir_ratio < 0.80,
    }

    has_violations = any(violations.values())
    
    explanations = []

    if not has_violations:
        recommended = "none"
        alternatives = []
        explanations.append("No significant fairness violations detected. Mitigation may not be necessary.")
    else:
        # Build explanation of violations
        if violations["dir"]:
            explanations.append("Disparate Impact Ratio is below 0.8, indicating representation imbalance.")
        if violations["eod"]:
            explanations.append("Equal Opportunity Difference is high, suggesting unequal true positive rates.")
        if violations["dpd"]:
            explanations.append("Demographic Parity Difference is high, indicating unequal selection rates.")
            
        # Score mitigation strategies dynamically based on severity of each violation type
        # smote is great for resolving extreme structural representation (DIR)
        # reweighting handles statistical DPD disparities well alongside EOD/DIR
        # threshold pushes up EOD but is sensitive to prediction bounds
        strategy_scores = {
            "smote": (dir_violation * 1.5) + (dpd * 0.5),
            "reweighting": (dpd * 1.2) + (eod * 0.8) + (dir_violation * 0.5),
            "threshold": (eod * 1.5) + (dpd * 0.5)
        }
        
        # Rank by descending score
        ranked_strategies = sorted(strategy_scores.items(), key=lambda x: x[1], reverse=True)
        
        recommended = ranked_strategies[0][0]
        alternatives = [strat for strat, score in ranked_strategies[1:]]

    return {
        "recommended_strategy": recommended,
        "violations": violations,
        "explanation": " ".join(explanations),
        "alternatives": alternatives,
        "note": (
            "Mitigation strategies have been dynamically ranked based on violation severity. "
            "Applying intervention will affect model accuracy, so human review is recommended."
        ),
    }
