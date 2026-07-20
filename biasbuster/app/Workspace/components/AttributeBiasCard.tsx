"use client";

import MetricRow from "./MetricRow";
import GroupImpactTable from "./GroupImpactTable";

export default function AttributeBiasCard({
  attribute,
  data,
}: any) {

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

        <MetricRow
          name="DPD"
          value={data.dpd}
        />

        <MetricRow
          name="EOD"
          value={data.eod}
        />

        <MetricRow
          name="DIR"
          value={data.dir}
        />
      </div>

      <GroupImpactTable
        selectionRate={data.selection_rate}
        tpr={data.true_positive_rate}
      />
    </div>
  );
}