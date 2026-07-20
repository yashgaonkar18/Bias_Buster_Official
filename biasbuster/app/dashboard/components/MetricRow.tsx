"use client";

import { getMetricInterpretation } from "@/utils/fairnessInterpretation";
import { Info } from "lucide-react";

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
      <div className="flex items-center gap-1 text-xs text-gray-500">
        {name}
        {interpretation.tooltip && interpretation.improvementLabel && (
          <Info className="w-3 h-3 text-gray-400" />
        )}
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
              className={`text-[10px] font-bold ${interpretation.improvementColor} mt-0.5`}
            >
              {interpretation.improvementLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}