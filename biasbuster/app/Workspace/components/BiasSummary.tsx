"use client";

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: any;
}) => (
  <div>
    <div className="text-xs text-gray-500">
      {label}
    </div>

    <div className="font-medium text-gray-800">
      {value ?? "-"}
    </div>
  </div>
);

export default function BiasSummary({
  report,
}: {
  report: any;
}) {

  return (
    <div
      className={`border rounded-lg p-5 ${
        report.bias_present
          ? "bg-red-50 border-red-200"
          : "bg-green-50 border-green-200"
      }`}
    >
      <h3 className="text-lg font-bold">
        {report.bias_present
          ? "Bias Detected"
          : "No Significant Bias"}
      </h3>

      <div className="grid grid-cols-3 gap-4 mt-4 text-sm">

        <InfoRow
          label="Primary Driver"
          value={report.bias_driver}
        />

        <InfoRow
          label="Severity Score"
          value={`${report.bias_severity_score}/10`}
        />

        <InfoRow
          label="Next Step"
          value={
            report.bias_present
              ? "Mitigation Required"
              : "Approved"
          }
        />
      </div>
    </div>
  );
}