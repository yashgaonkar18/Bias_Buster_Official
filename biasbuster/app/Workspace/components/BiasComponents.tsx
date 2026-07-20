"use client";

import React from "react";
import { MetricRow } from "./SharedComponents";

export const GroupImpactTable = ({ selectionRate, tpr }: any) => (
  <table className="min-w-full text-sm border mt-4">
    <thead className="bg-gray-100">
      <tr>
        <th className="px-3 py-2 text-left">Group</th>
        <th className="px-3 py-2 text-center">Selection Rate</th>
        <th className="px-3 py-2 text-center">TPR</th>
        <th className="px-3 py-2 text-center">Impact</th>
      </tr>
    </thead>
    <tbody>
      {Object.keys(selectionRate).map((group) => {
        const sr = selectionRate[group];
        const impact =
          sr < 0.1
            ? "Severely Disadvantaged"
            : sr < 0.2
              ? "Moderate Bias"
              : "Fair";

        return (
          <tr key={group} className={impact !== "Fair" ? "bg-red-50" : ""}>
            <td className="px-3 py-2 font-medium">{group}</td>
            <td className="px-3 py-2 text-center">{sr.toFixed(3)}</td>
            <td className="px-3 py-2 text-center">
              {tpr?.[group]?.toFixed(3) ?? "—"}
            </td>
            <td className="px-3 py-2 text-center font-semibold">{impact}</td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

export const ComparisonBar = ({
  value,
  label,
  color = "bg-blue-500",
  max = 1,
}: {
  value: number;
  label: string;
  color?: string;
  max?: number;
}) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[10px] font-semibold text-gray-500">
      <span>{label}</span>
      <span>
        {typeof value === "number" ? `${(value * 100).toFixed(1)}%` : value}
      </span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-full ${color} transition-all duration-500`}
        style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
      />
    </div>
  </div>
);

export const AttributeBiasCard = ({ attribute, data }: any) => {
  const severity =
    data.severity_score >= 8
      ? "High"
      : data.severity_score >= 4
        ? "Medium"
        : "Low";

  return (
    <div className="border rounded-lg bg-white">
      <div className="px-4 py-3 border-b flex justify-between">
        <h4 className="font-semibold capitalize">
          {attribute.replace("_", " ")} Bias
        </h4>
        <span className="text-xs font-semibold text-red-700">
          Severity: {severity}
        </span>
      </div>

      <div className="p-4 grid grid-cols-3 gap-4 text-sm">
        <MetricRow name="DPD" value={data.dpd} />
        <MetricRow name="EOD" value={data.eod} />
        <MetricRow name="DIR" value={data.dir} />
      </div>

      <GroupImpactTable
        selectionRate={data.selection_rate}
        tpr={data.true_positive_rate}
      />
    </div>
  );
};
