export type SeverityLabel =
  | "Fair"
  | "Low Bias"
  | "Moderate Bias"
  | "High Bias"
  | "Unknown";

export type FairnessQualityLabel =
  | "Excellent Fairness"
  | "Good Fairness"
  | "Moderate Fairness"
  | "Poor Fairness"
  | "Unknown";

export const interpretBiasSeverity = (
  metric: string,
  value: number,
): { label: SeverityLabel; color: string; tooltip: string } => {
  const absValue = Math.abs(value);

  if (metric === "DPD" || metric === "EOD") {
    if (absValue <= 0.05)
      return {
        label: "Fair",
        color: "text-green-600",
        tooltip: "Fair: Minimal disparity between protected groups.",
      };
    if (absValue <= 0.1)
      return {
        label: "Low Bias",
        color: "text-yellow-600",
        tooltip: "Low Bias: Small disparity detected.",
      };
    if (absValue <= 0.2)
      return {
        label: "Moderate Bias",
        color: "text-orange-500",
        tooltip:
          "Moderate Bias indicates measurable disparity between protected groups.",
      };
    return {
      label: "High Bias",
      color: "text-red-600",
      tooltip: "High Bias: Severe disparity detected.",
    };
  }

  if (metric === "DIR" || metric === "DI") {
    // Interpret DIR using absolute value ranges
    if (value < 0.5) {
      return {
        label: "High Bias",
        color: "text-red-600",
        tooltip:
          "Severe disparity: DIR < 0.5 indicates strong adverse impact against the protected group.",
      };
    }

    if (value < 0.8) {
      return {
        label: "Moderate Bias",
        color: "text-orange-500",
        tooltip:
          "Moderate disparity: DIR between 0.5 and 0.8 indicates notable adverse impact.",
      };
    }

    if (value <= 1.25) {
      return {
        label: "Fair",
        color: "text-green-600",
        tooltip:
          "Fair: DIR between 0.8 and 1.25 indicates acceptable balance between groups.",
      };
    }

    return {
      label: "High Bias",
      color: "text-red-600",
      tooltip:
        "Reverse disparity: DIR > 1.25 indicates the imbalance is reversed (protected group favored).",
    };
  }

  return { label: "Unknown", color: "text-gray-600", tooltip: "" };
};

export const interpretFairnessScore = (
  score: number,
): { label: FairnessQualityLabel; color: string; tooltip: string } => {
  if (score >= 0.9)
    return {
      label: "Excellent Fairness",
      color: "text-green-600",
      tooltip: "Excellent Fairness: High equity across groups.",
    };
  if (score >= 0.8)
    return {
      label: "Good Fairness",
      color: "text-green-500",
      tooltip: "Good Fairness: Acceptable equity across groups.",
    };
  if (score >= 0.7)
    return {
      label: "Moderate Fairness",
      color: "text-orange-500",
      tooltip: "Moderate Fairness: Some disparities exist.",
    };
  return {
    label: "Poor Fairness",
    color: "text-red-600",
    tooltip: "Poor Fairness: Significant disparities detected.",
  };
};

export const interpretImprovement = (
  metricType: "accuracy" | "fairness" | "bias" | "dir",
  before: number,
  after: number,
): { label: string; color: string } => {
  if (before === undefined || after === undefined) {
    return { label: "", color: "" };
  }

  const diff = after - before;

  if (metricType === "accuracy") {
    if (diff > 0.02) return { label: "Improved", color: "text-green-600" };
    if (diff > 0.005)
      return { label: "Slightly Improved", color: "text-green-500" };
    if (Math.abs(diff) <= 0.005)
      return { label: "Stable", color: "text-blue-600" };
    if (diff >= -0.02)
      return { label: "Slightly Reduced", color: "text-orange-500" };
    return { label: "Reduced", color: "text-red-600" };
  }

  if (metricType === "fairness") {
    // Higher is better (Fairness Score)
    if (diff > 0.02)
      return { label: "Fairness Improved", color: "text-green-600" };
    if (Math.abs(diff) <= 0.02)
      return { label: "Fairness Stable", color: "text-blue-600" };
    return { label: "Fairness Degraded", color: "text-red-600" };
  }

  if (metricType === "bias") {
    // Lower absolute value is better (DPD, EOD)
    const beforeAbs = Math.abs(before);
    const afterAbs = Math.abs(after);
    const absDiff = beforeAbs - afterAbs;

    if (absDiff > 0.02)
      return { label: "Bias Reduced", color: "text-green-600" };
    if (Math.abs(absDiff) <= 0.02)
      return { label: "Fairness Stable", color: "text-blue-600" };
    return { label: "Bias Increased", color: "text-red-600" };
  }

  if (metricType === "dir") {
    // Closer to 1 is better
    const beforeDistance = Math.abs(before - 1);
    const afterDistance = Math.abs(after - 1);
    const distanceDiff = beforeDistance - afterDistance;

    if (distanceDiff > 0.02)
      return { label: "Bias Reduced", color: "text-green-600" };
    if (Math.abs(distanceDiff) <= 0.02)
      return { label: "Fairness Stable", color: "text-blue-600" };
    return { label: "Bias Increased", color: "text-red-600" };
  }

  return { label: "", color: "text-gray-500" };
};

export const getMetricInterpretation = (
  name: string,
  value: number,
  baselineValue?: number,
) => {
  if (value === undefined || value === null) {
    return {
      label: "",
      color: "",
      tooltip: "",
      improvementLabel: "",
      improvementColor: "",
    };
  }

  let state: any;
  let improvement: any = null;

  if (name.toLowerCase().includes("fairness")) {
    state = interpretFairnessScore(value);
  } else if (name === "Accuracy") {
    state = { label: "", color: "text-gray-800", tooltip: "" };
  } else {
    state = interpretBiasSeverity(name, value);
  }

  if (baselineValue !== undefined && baselineValue !== null) {
    if (name === "Accuracy") {
      improvement = interpretImprovement("accuracy", baselineValue, value);
    } else if (name.toLowerCase().includes("fairness")) {
      improvement = interpretImprovement("fairness", baselineValue, value);
    } else if (name === "DIR" || name === "DI") {
      improvement = interpretImprovement("dir", baselineValue, value);
    } else {
      improvement = interpretImprovement("bias", baselineValue, value);
    }
  }

  return {
    label: state.label,
    color: state.color,
    tooltip: state.tooltip || "",
    improvementLabel: improvement?.label || "",
    improvementColor: improvement?.color || "",
  };
};