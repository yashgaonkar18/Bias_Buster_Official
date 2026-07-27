"use client";

import React from "react";
import { CheckCircle, Brain, Database, BarChart3 } from "lucide-react";
import { getMetricInterpretation } from "@/utils/fairnessInterpretation";

export const InfoRow = ({ label, value }: { label: string; value?: any }) => (
  <div>
    <div className="text-xs text-gray-500">{label}</div>
    <div className="font-medium text-gray-800">{value ?? "-"}</div>
  </div>
);

export const StatusCard = ({
  title,
  status,
}: {
  title: string;
  status: boolean | string;
}) => (
  <div className="border rounded-lg p-4 bg-white flex items-center gap-3">
    <CheckCircle className="w-5 h-5 text-green-600" />
    <div>
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-gray-500">
        {status === true ? "Successful" : status}
      </div>
    </div>
  </div>
);

export const MetricRow = ({ name, value, baselineValue }: any) => {
  const interpretation = getMetricInterpretation(name, value, baselineValue);

  return (
    <div
      className="border rounded-lg p-3 bg-gray-50"
      title={interpretation.tooltip}
    >
      <div className="text-xs text-gray-500">{name}</div>

      <div className="flex items-center justify-between mt-1">
        <span className="font-semibold text-gray-800">
          {typeof value === "number" ? value.toFixed(3) : (value ?? "-")}
        </span>

        <div className="flex flex-col items-end">
          {interpretation.label && (
            <span className={`text-xs font-semibold ${interpretation.color}`}>
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
};

export const BiasSummary = ({ report }: { report: any }) => (
  <div
    className={`border rounded-lg p-5 ${
      report.bias_present
        ? "bg-red-50 border-red-200"
        : "bg-green-50 border-green-200"
    }`}
  >
    <h3 className="text-lg font-bold">
      {report.bias_present ? "Bias Detected" : "No Significant Bias"}
    </h3>

    <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
      <InfoRow label="Primary Driver" value={report.bias_driver ?? "—"} />
      <InfoRow
        label="Severity Score"
        value={`${report.bias_severity_score}/10`}
      />
      <InfoRow
        label="Next Step"
        value={report.bias_present ? "Mitigation Required" : "Approved"}
      />
    </div>
  </div>
);

export const GroupImpactTable = ({ selectionRate, tpr }: any) => {
  if (!selectionRate) return null;
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border mt-4 rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Group</th>
            <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Selection Rate</th>
            <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">TPR</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {Object.keys(selectionRate).map((group) => {
            const sr = selectionRate[group];
            const impact =
              sr < 0.1
                ? "Severely Disadvantaged"
                : sr < 0.2
                  ? "Moderate Bias"
                  : "Fair";

            return (
              <tr key={group} className={impact !== "Fair" ? "bg-red-50/50" : "bg-white"}>
                <td className="px-3 py-2 font-medium text-gray-800">{group}</td>
                <td className="px-3 py-2 text-center text-gray-600">{typeof sr === 'number' ? sr.toFixed(3) : sr}</td>
                <td className="px-3 py-2 text-center text-gray-600">
                  {typeof tpr?.[group] === 'number' ? tpr[group].toFixed(3) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export const AttributeBiasCard = ({ attribute, data }: any) => {
  const severity =
    data.severity_score >= 8
      ? "High"
      : data.severity_score >= 4
        ? "Medium"
        : "Low";

  return (
    <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b bg-gray-50/50 flex justify-between items-center">
        <h4 className="font-bold text-gray-800 capitalize flex items-center gap-2">
          <Database className="w-4 h-4 text-orange-500" />
          {attribute.replace("_", " ")} Bias Analysis
        </h4>
        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
          severity === 'High' ? 'bg-red-100 text-red-700' : severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
        }`}>
          Severity: {severity}
        </span>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <MetricRow name="DPD" value={data.dpd} />
        <MetricRow name="EOD" value={data.eod} />
        <MetricRow name="DIR" value={data.dir} />
      </div>

      <div className="px-4 pb-4">
        <GroupImpactTable
          selectionRate={data.selection_rate}
          tpr={data.true_positive_rate}
        />
      </div>
    </div>
  );
};
