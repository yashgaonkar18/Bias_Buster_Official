"use client";

import {
  ShieldCheck,
  Download,
  Database,
  BarChart3,
} from "lucide-react";

const ComparisonBar = ({
  value,
  label,
  color = "bg-blue-500",
}: any) => (
  <div className="space-y-1">

    <div className="flex justify-between text-[10px] font-semibold text-gray-500">
      <span>{label}</span>

      <span>
        {(value * 100).toFixed(1)}%
      </span>
    </div>

    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">

      <div
        className={`h-full ${color}`}
        style={{
          width: `${value * 100}%`,
        }}
      />
    </div>
  </div>
);

export default function ComparisonDashboard({
  data,
  onDownload,
}: any) {

  if (!data?.models) return null;

  const models = [...data.models].sort(
    (a, b) =>
      (b.combined_score || 0) -
      (a.combined_score || 0)
  );

  const recommended = models[0];

  return (
    <div className="space-y-8">

      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl p-6 text-white">

        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5" />

          <span className="font-bold">
            Recommended Model
          </span>
        </div>

        <h2 className="text-2xl font-bold">
          {recommended?.model_name}
        </h2>

        <div className="mt-4 flex gap-4">

          <div className="bg-white/20 px-3 py-2 rounded-lg">
            Accuracy:
            {" "}
            {recommended?.accuracy?.toFixed(3)}
          </div>

          <div className="bg-white/20 px-3 py-2 rounded-lg">
            Fairness:
            {" "}
            {recommended?.fairness_score?.toFixed(3)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {models.map((model: any) => (
          <div
            key={model.model_id}
            className="border rounded-xl p-5 bg-white"
          >
            <h4 className="font-bold">
              {model.model_name}
            </h4>

            <div className="space-y-3 mt-4">

              <ComparisonBar
                label="Accuracy"
                value={model.accuracy}
                color="bg-blue-500"
              />

              <ComparisonBar
                label="Fairness"
                value={model.fairness_score}
                color="bg-green-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-center">

              <div>
                <div className="text-xs text-gray-400">
                  DPD
                </div>

                <div className="font-bold">
                  {model.dpd?.toFixed(3)}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-400">
                  EOD
                </div>

                <div className="font-bold">
                  {model.eod?.toFixed(3)}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">

              <button
                onClick={() => onDownload(model)}
                className="w-full py-2 bg-gray-50 border rounded-lg text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                Download Model
              </button>

              {model.dataset_download_url && (
                <button
                  className="w-full py-2 bg-white border rounded-lg text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Database className="w-3.5 h-3.5" />
                  Dataset
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border rounded-xl p-6 bg-white">

        <h4 className="font-bold flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-orange-500" />
          Accuracy vs Fairness
        </h4>

        <div className="space-y-4">

          {models.map((model: any) => (
            <div key={model.model_id}>
              <div className="flex justify-between text-xs mb-1">
                <span>{model.model_name}</span>

                <span>
                  Score:
                  {" "}
                  {model.combined_score?.toFixed(3)}
                </span>
              </div>

              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">

                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                  style={{
                    width: `${model.combined_score * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}