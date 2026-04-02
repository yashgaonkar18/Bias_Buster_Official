import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score


def _safe_array(arr):
    return np.asarray(arr, dtype=float)


def selection_rate(y_pred):
    y_pred = _safe_array(y_pred)
    return float(np.mean(y_pred == 1))


def true_positive_rate(y_true, y_pred):
    y_true = _safe_array(y_true)
    y_pred = _safe_array(y_pred)

    positives = y_true == 1
    if positives.sum() == 0:
        return 0.0

    return float((y_pred[positives] == 1).mean())


def demographic_parity_difference(group_rates: dict) -> float:
    return max(group_rates.values()) - min(group_rates.values())


def equal_opportunity_difference(group_tprs: dict) -> float:
    return max(group_tprs.values()) - min(group_tprs.values())


def disparate_impact_ratio(group_rates: dict) -> float:
    rates = list(group_rates.values())
    min_rate = min(rates)
    max_rate = max(rates)
    if max_rate == 0:
        return 0.0
    return min_rate / max_rate


def calculate_severity(dpd: float, eod: float, dir: float) -> float:
    """
    Calculates overall bias severity score (0–10)
    based on fairness metrics.
    """

    score = 0

    # Demographic Parity Difference
    score += min(abs(dpd) * 10, 4)

    # Equalized Odds Difference
    score += min(abs(eod) * 10, 3)

    # Disparate Impact penalty
    if dir < 1:
        score += min((1 - dir) * 10, 3)

    return round(min(score, 10), 1)

def evaluate_baseline(y_true, y_pred, sensitive):
    unique_labels = set(pd.Series(y_true).dropna().unique()) | set(
        pd.Series(y_pred).dropna().unique()
    )
    metric_average = "binary" if len(unique_labels) <= 2 else "macro"

    df = pd.DataFrame(
        {"y_true": y_true, "y_pred": y_pred, "sensitive": sensitive}
    )

    group_rates = {}
    group_tprs = {}

    for group, gdf in df.groupby("sensitive"):
        group_rates[group] = selection_rate(gdf["y_pred"])
        group_tprs[group] = true_positive_rate(
            gdf["y_true"], gdf["y_pred"]
        )

    fairness = {
        "selection_rate": group_rates,
        "dpd": demographic_parity_difference(group_rates),
        "dir": disparate_impact_ratio(group_rates),
        "eod": equal_opportunity_difference(group_tprs),
    }

    performance = {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(
            y_true,
            y_pred,
            average=metric_average,
            zero_division=0,
        ),
        "recall": recall_score(
            y_true,
            y_pred,
            average=metric_average,
            zero_division=0,
        ),
        "f1": f1_score(
            y_true,
            y_pred,
            average=metric_average,
            zero_division=0,
        ),
    }

    return {
        "performance": performance,
        "fairness": fairness,
    }