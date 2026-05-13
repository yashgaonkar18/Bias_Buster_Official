"use client";

import { getMetricInterpretation } from "@/utils/fairnessInterpretation";

export default function MetricRow({
  name,
  value,
  baselineValue,
}: any) {

  const interpretation = getMetricInterpretation(
    name,
    value,
    baselineValue
  );

  return (
    <div
      className="border rounded-lg p-3 bg-gray-50"
      title={interpretation.tooltip}
    >
      <div className="text-xs text-gray-500">
        {name}
      </div>

      <div className="flex justify-between mt-1">

        <span className="font-semibold text-gray-800">
          {typeof value === "number"
            ? value.toFixed(3)
            : value ?? "-"}
        </span>

        <div className="flex flex-col items-end">

          {interpretation.label && (
            <span
              className={`text-xs font-semibold ${interpretation.color}`}
            >
              {interpretation.label}
            </span>
          )}

          {interpretation.improvementLabel && (
            <span
              className={`text-[10px] font-bold ${interpretation.improvementColor}`}
            >
              {interpretation.improvementLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}