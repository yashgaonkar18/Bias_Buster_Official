def compute_strategy_score(before, after):
    fairness_before = before["fairness"]
    fairness_after = after["fairness"]

    perf_before = before["performance"]
    perf_after = after["performance"]

    # Fairness improvements (lower DPD and EOD are better; closer to 1.0 for DIR is better)
    dpd_improve = abs(fairness_before.get("dpd", 0)) - abs(fairness_after.get("dpd", 0))
    eod_improve = abs(fairness_before.get("eod", 0)) - abs(fairness_after.get("eod", 0))
    
    dir_before = fairness_before.get("dir", 1.0)
    dir_after = fairness_after.get("dir", 1.0)
    dir_improve = abs(1.0 - dir_before) - abs(1.0 - dir_after)

    fairness_score = dpd_improve + eod_improve + dir_improve

    # Accuracy penalty (penalize more heavily for drops in accuracy)
    accuracy_drop = perf_before.get("accuracy", 0) - perf_after.get("accuracy", 0)

    # We weigh the accuracy drop by 1.5x so models don't sacrifice too much viability for fairness
    final_score = fairness_score - (1.5 * accuracy_drop)

    return final_score


def rank_strategies(results):
    ranking = []

    for strategy, data in results.items():
        score = compute_strategy_score(data["before"], data["after"])
        ranking.append({"strategy": strategy, "score": score})

    ranking.sort(key=lambda x: x["score"], reverse=True)

    return ranking


def find_best_strategy(strategy_results):
    ranking = rank_strategies(strategy_results)
    best = ranking[0]
    return {"best_strategy": best["strategy"], "ranking": ranking}
