"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Upload,
  Play,
  FileText,
  Database,
  ShieldCheck,
  Brain,
  CheckCircle,
  ChevronDown,
  Settings,
  BarChart3,
  Plus,
  Folder,
  Save,
  Clock,
  X,
  Search,
  MoreVertical,
  ChevronRight,
  Download,
} from "lucide-react";
import { api } from "@/lib/api";
import { getMetricInterpretation } from "@/utils/fairnessInterpretation";
const InfoRow = ({ label, value }: { label: string; value?: any }) => (
  <div>
    <div className="text-xs text-gray-500">{label}</div>
    <div className="font-medium text-gray-800">{value ?? "-"}</div>
  </div>
);

const ProcessingLoader = ({ step }: { step: string }) => {
  return (
    <div className="mb-6 p-6 border rounded-lg bg-linear-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center gap-4">
        {/* Animated Spinner */}
        <div className="relative">
          <div className="h-10 w-10 rounded-full border-4 border-blue-200"></div>
          <div className="absolute top-0 left-0 h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        </div>

        {/* Text */}
        <div>
          <div className="text-sm font-semibold text-blue-800">
            Processing Request
          </div>

          <div className="text-xs text-blue-600 mt-1">{step}</div>
        </div>
      </div>

      {/* Progress Animation */}
      <div className="mt-4 w-full bg-blue-100 rounded-full h-2 overflow-hidden">
        <div className="h-full bg-blue-500 animate-pulse w-2/3"></div>
      </div>
    </div>
  );
};

const MetricRow = ({ name, value, baselineValue }: any) => {
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

const BiasSummary = ({ report }: { report: any }) => (
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

const GroupImpactTable = ({ selectionRate, tpr }: any) => (
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
const ComparisonBar = ({
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

const ComparisonDashboard = ({
  data,
  onDownload,
}: {
  data: any;
  onDownload: (model: any) => void;
}) => {
  if (!data || !Array.isArray(data.models) || data.models.length === 0)
    return null;

  const models = [...data.models].sort(
    (a: any, b: any) => (b.combined_score || 0) - (a.combined_score || 0),
  );
  const recommended =
    models.find((m: any) => m.model_id === data.best_balanced_model) ||
    models[0];
  const optimizationStatus =
    data.optimization_status ||
    (models.some((m: any) => m.source_type === "optimized")
      ? "Optimization completed"
      : "Optimization not performed");
  const hasOptimized = models.some((m: any) => m.source_type === "optimized");

  const modelBadge = (sourceType: string) => {
    if (sourceType === "original") return "bg-gray-100 text-gray-700";
    if (sourceType === "mitigated") return "bg-blue-100 text-blue-700";
    if (sourceType === "optimized") return "bg-purple-100 text-purple-700";
    return "bg-green-100 text-green-700";
  };

  const severityBadge = (severity?: string) => {
    if (severity === "High") return "bg-red-100 text-red-700";
    if (severity === "Medium") return "bg-amber-100 text-amber-700";
    return "bg-emerald-100 text-emerald-700";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-linear-to-r from-orange-500 to-amber-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldCheck className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
              Recommended Model
            </span>
            <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
              {optimizationStatus}
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {recommended?.model_name || "Optimal Fairness-Aware Model"}
          </h2>
          <p className="text-orange-50 text-sm max-w-3xl leading-relaxed">
            {data.experiment_summary ||
              data.summary ||
              "This dashboard compares the available model variants and highlights the best fairness-performance balance."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <div className="bg-white/15 px-3 py-2 rounded-lg">
              Combined Score: {(recommended?.combined_score ?? 0).toFixed(3)}
            </div>
            <div className="bg-white/15 px-3 py-2 rounded-lg">
              Accuracy: {(recommended?.accuracy ?? 0).toFixed(3)}
            </div>
            <div className="bg-white/15 px-3 py-2 rounded-lg">
              Fairness: {(recommended?.fairness_score ?? 0).toFixed(3)}
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => onDownload(recommended)}
              className="bg-white text-orange-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" /> Download Recommended
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {models.map((model: any) => (
          <div
            key={model.model_id}
            className={`border rounded-xl p-5 bg-white transition-all hover:shadow-md ${model.model_id === recommended?.model_id ? "ring-2 ring-orange-500 border-orange-200" : "border-gray-200"}`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${modelBadge(model.source_type)}`}
                  >
                    {model.source_type}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${severityBadge(model.bias_severity)}`}
                  >
                    {model.bias_severity || "Low"} Bias
                  </span>
                </div>
                <h4 className="font-bold text-gray-800 leading-snug">
                  {model.model_name}
                </h4>
                <p className="text-[11px] text-gray-500 mt-1">
                  {model.model_type || "Classifier"}
                </p>
              </div>
              {model.model_id === recommended?.model_id && (
                <div
                  className="bg-orange-100 text-orange-600 p-1.5 rounded-full"
                  title="Recommended Model"
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <ComparisonBar
                label="Accuracy"
                value={model.accuracy || 0}
                color="bg-blue-500"
              />
              <ComparisonBar
                label="Fairness Score"
                value={model.fairness_score || 0}
                color="bg-green-500"
              />
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50 text-center">
                <div>
                  <div className="text-[10px] text-gray-400">DPD</div>
                  <div className="text-xs font-bold">
                    {(model.dpd ?? 0).toFixed(3)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400">EOD</div>
                  <div className="text-xs font-bold">
                    {(model.eod ?? 0).toFixed(3)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50 text-center">
                <div>
                  <div className="text-[10px] text-gray-400">Combined</div>
                  <div className="text-xs font-bold">
                    {(model.combined_score ?? 0).toFixed(3)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400">Status</div>
                  <div className="text-xs font-bold capitalize">
                    {model.recommendation_status || "available"}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 italic min-h-[34px]">
                {model.summary ||
                  (model.source_type === "original"
                    ? "Baseline model used as the comparison anchor."
                    : model.source_type === "mitigated"
                      ? "Mitigated variant tuned for fairness tradeoffs."
                      : "Optimized variant selected for the best combined score.")}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <button
                onClick={() => onDownload(model)}
                className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border border-gray-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download Model
              </button>
              {model.dataset_download_url && (
                <button
                  onClick={() =>
                    onDownload({
                      ...model,
                      download_url: model.dataset_download_url,
                      artifact_name: model.artifact_name?.replace(
                        /\.joblib$/i,
                        ".csv",
                      ),
                    })
                  }
                  className="w-full py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border border-gray-200 transition-colors"
                >
                  <Database className="w-3.5 h-3.5" /> Download Corrected
                  Dataset
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-500" /> Fairness Comparison
          </h4>
          <div className="space-y-3">
            {models.map((model: any) => (
              <ComparisonBar
                key={`${model.model_id}-fairness`}
                label={model.source_type}
                value={model.fairness_score || 0}
                color="bg-green-500"
              />
            ))}
          </div>
        </div>

        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" /> Accuracy Comparison
          </h4>
          <div className="space-y-3">
            {models.map((model: any) => (
              <ComparisonBar
                key={`${model.model_id}-accuracy`}
                label={model.source_type}
                value={model.accuracy || 0}
                color="bg-blue-500"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="border rounded-xl p-6 bg-white shadow-sm">
        <h4 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-orange-500" /> Accuracy vs Fairness
          Tradeoff
        </h4>

        <div className="h-64 relative border-l-2 border-b-2 border-gray-200 mb-8 ml-8">
          <div className="absolute -left-10 top-1/2 -rotate-90 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Accuracy
          </div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Fairness
          </div>

          {models.map((model: any) => (
            <div
              key={model.model_id}
              className={`absolute size-4 rounded-full border-2 transform -translate-x-1/2 translate-y-1/2 transition-all cursor-pointer group hover:scale-150 z-20 ${
                model.source_type === "original"
                  ? "bg-gray-500 border-white shadow-gray-200"
                  : model.source_type === "mitigated"
                    ? "bg-blue-500 border-white shadow-blue-200"
                    : "bg-purple-500 border-white shadow-purple-200"
              }`}
              style={{
                left: `${Math.min(100, Math.max(0, (model.fairness_score || 0) * 100))}%`,
                bottom: `${Math.min(100, Math.max(0, (model.accuracy || 0) * 100))}%`,
              }}
              title={`${model.model_name}: Acc ${(model.accuracy || 0).toFixed(3)}, Fair ${(model.fairness_score || 0).toFixed(3)}`}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-30 transition-opacity">
                {model.model_name}
              </div>
            </div>
          ))}

          <div className="absolute inset-0 border-t border-gray-100 border-dashed translate-y-1/4 h-px w-full" />
          <div className="absolute inset-0 border-t border-gray-100 border-dashed translate-y-1/2 h-px w-full" />
          <div className="absolute inset-0 border-t border-gray-100 border-dashed translate-y-3/4 h-px w-full" />
          <div className="absolute inset-0 border-r border-gray-100 border-dashed translate-x-1/4 w-px h-full" />
          <div className="absolute inset-0 border-r border-gray-100 border-dashed translate-x-1/2 w-px h-full" />
          <div className="absolute inset-0 border-r border-gray-100 border-dashed translate-x-3/4 w-px h-full" />
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-gray-500"></div> Original
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-blue-500"></div> Mitigated
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-purple-500"></div> Optimized
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <h4 className="font-bold text-gray-800 mb-3">Experiment Summary</h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {data.experiment_summary || data.summary}
          </p>
        </div>
        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <h4 className="font-bold text-gray-800 mb-3">Optimization Status</h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {hasOptimized
              ? "Optimization was performed and the dashboard includes the optimized model for comparison."
              : "Optimization not performed. The dashboard compares the original and mitigated variants only."}
          </p>
        </div>
      </div>
    </div>
  );
};

const DownloadModal = ({ model, onConfirm, onClose }: any) => {
  if (!model) return null;

  const summary = {
    model_type: model.model_type || "Fairness-Aware Classifier",
    source_type: model.source_type || "original",
    strategy:
      model.mitigation_strategy ||
      model.optimization_method ||
      model.strategy ||
      model.source_type,
    accuracy:
      typeof model.accuracy === "number"
        ? Number(model.accuracy.toFixed(3))
        : model.accuracy,
    fairness_score:
      typeof model.fairness_score === "number"
        ? Number(model.fairness_score.toFixed(3))
        : model.fairness_score,
    combined_score:
      typeof model.combined_score === "number"
        ? Number(model.combined_score.toFixed(3))
        : model.combined_score,
    bias_severity: model.bias_severity || "Low",
    artifact: model.artifact_name || model.model_name || "artifact",
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              Download Preview
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Review the artifact metadata before download.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            {Object.entries(summary).map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between items-center gap-4"
              >
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {label.replace(/_/g, " ")}
                </span>
                <span className="text-xs font-bold text-gray-800 text-right">
                  {String(value ?? "-")}
                </span>
              </div>
            ))}
          </div>

          {model.dataset_download_url && (
            <div className="p-4 border border-emerald-100 bg-emerald-50 rounded-xl">
              <h5 className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1">
                Corrected Dataset Available
              </h5>
              <p className="text-[10px] text-emerald-700 leading-relaxed">
                This mitigation modified the dataset, so the corrected dataset
                can also be downloaded.
              </p>
            </div>
          )}

          <div className="p-4 border border-orange-100 bg-orange-50 rounded-xl">
            <h5 className="text-[10px] font-bold text-orange-800 uppercase tracking-widest mb-1">
              Recommendation
            </h5>
            <p className="text-[10px] text-orange-700 leading-relaxed">
              Confirm the artifact metadata before promoting the model to
              production use.
            </p>
          </div>
        </div>

        <div className="p-6 bg-gray-50 rounded-b-2xl flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(model.model_id, model.download_url);
              onClose();
            }}
            className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" /> Download
          </button>
        </div>
      </div>
    </div>
  );
};

const AttributeBiasCard = ({ attribute, data }: any) => {
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

export default function BiasBuster() {
  const [activeRequest, setActiveRequest] = useState("dataset-test-1");
  const [requestMethod, setRequestMethod] = useState("VALIDATE");

  const [showResponse, setShowResponse] = useState(false);
  const [activeResponseTab, setActiveResponseTab] = useState("body");
  const [showProfile, setShowProfile] = useState(false);
  const [isDatasetValid, setIsDatasetValid] = useState(false);
  const [isModelValid, setIsModelValid] = useState(false);
  const [uploadId, setUploadId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [uploadResponse, setUploadResponse] = useState<any | null>(null);

  type Phase = "UPLOAD" | "VALIDATED" | "ATTRIBUTES_SELECTED" | "BIAS_DETECTED";

  const [currentPhase, setCurrentPhase] = useState<Phase>("UPLOAD");
  const [isExperimentMode, setIsExperimentMode] = useState(false);

  // Optimization params
  const [optMethod, setOptMethod] = useState("optuna");
  const [optTrials, setOptTrials] = useState(20);
  const [optCV, setOptCV] = useState(5);
  const [optAccuracyWeight, setOptAccuracyWeight] = useState(0.6);
  const [optFairnessWeight, setOptFairnessWeight] = useState(0.4);
  const [optTimeout, setOptTimeout] = useState(300);

  const profileRef = useRef<HTMLDivElement | null>(null);
  const settingsBtnRef = useRef<HTMLButtonElement | null>(null);

  type RequestItem = { id: string; name: string; type: string; method: string };
  type Collection = { name: string; requests: RequestItem[] };

  const initialRequests: RequestItem[] = [
    {
      id: "dataset-test-1",
      name: "Gender Bias Analysis",
      type: "Dataset",
      method: "VALIDATE",
    },
  ];

  const initialCollections: Collection[] = [
    { name: "My Workspace", requests: initialRequests },
  ];

  const [collections, setCollections] =
    useState<Collection[]>(initialCollections);
  const [selectedCollection, setSelectedCollection] = useState<string>(
    initialCollections[0].name,
  );

  const currentRequests =
    collections.find((c) => c.name === selectedCollection)?.requests ?? [];
  const activeRequestObj =
    currentRequests.find((r) => r.id === activeRequest) ??
    currentRequests[0] ??
    initialRequests[0];

  const addCollection = () => {
    const name = window.prompt("New collection name");
    if (!name) return;
    if (collections.some((c) => c.name === name)) {
      setSelectedCollection(name);
      return;
    }
    setCollections((prev) => [...prev, { name, requests: [] }]);
    setSelectedCollection(name);
  };

  const uploadDatasetAndModel = async () => {
    console.log("Method:", requestMethod);
    if (!datasetFile || !modelFile) {
      setUploadError("Please upload both dataset and model files");
      return null;
    }

    const formData = new FormData();
    formData.append("dataset_file", datasetFile);
    formData.append("model_file", modelFile);

    try {
      setUploading(true);
      setProcessingStep("Uploading dataset and model...");
      setUploadError(null);

      const res = await api.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProcessingStep("Preprocessing dataset...");
      setProcessingStep(null);

      setUploadId(res.data.upload_id);
      setUploadResponse(res.data);
      setColumns(res.data.dataset_info.column_names);

      setSelectedTarget(null);
      setSelectedSensitive([]);

      setCurrentPhase("VALIDATED");
      setIsDatasetValid(true);
      setIsModelValid(true);

      return res.data; // ✅ IMPORTANT
    } catch (err: any) {
      setUploadError(err?.response?.data?.detail || "Upload failed");
      setCurrentPhase("UPLOAD");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const addRequest = () => {
    const name = window.prompt("New request name");
    if (!name) return;
    const newReq: RequestItem = {
      id: `req-${Date.now()}`,
      name,
      type: "Dataset",
      method: requestMethod ?? "ANALYZE",
    };
    setCollections((prev) =>
      prev.map((c) =>
        c.name === selectedCollection
          ? { ...c, requests: [...c.requests, newReq] }
          : c,
      ),
    );
    setActiveRequest(newReq.id);
  };

  // --- Client-side dataset/model handling (UI-only, no backend) ---
  type DatasetRow = { [key: string]: string | number | null };

  const [modelFile, setModelFile] = useState<File | null>(null);
  const [dataset, setDataset] = useState<DatasetRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedSensitive, setSelectedSensitive] = useState<string[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<string[]>([]);
  const [preprocessedDataset, setPreprocessedDataset] = useState<
    DatasetRow[] | null
  >(null);
  const [biasResults, setBiasResults] = useState<{
    spd?: number;
    di?: number;
    details?: Array<{ group: string; rate: number; total: number }>;
  } | null>(null);

  // Very small CSV parser (handles simple CSVs without multiline quoted fields)

  const [selectedStrategy, setSelectedStrategy] = useState("reweighting");
  const [mitigationResults, setMitigationResults] = useState<any>(null);
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [recommendationResult, setRecommendationResult] = useState<any>(null);
  const [optimizationResults, setOptimizationResults] = useState<any>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [downloadModelMetadata, setDownloadModelMetadata] = useState<any>(null);

  const fetchComparison = async () => {
    if (!uploadId) return;
    try {
      setProcessingStep("Fetching comparison data from registry...");
      const res = await api.get(`/api/models/compare/${uploadId}`);
      setComparisonData(res.data);
      setRequestMethod("COMPARE");
      setShowResponse(true);
      setProcessingStep(null);
    } catch (err: any) {
      setProcessingStep(null);
      alert(err?.response?.data?.detail || "Failed to fetch comparison data");
    }
  };

  const fetchRanking = async () => {
    setIsExperimentMode(true);
  };

  const applyOptimization = async () => {
    try {
      setProcessingStep(`Running ${optMethod} optimization...`);
      const res = await api.post(`/api/optimize`, {
        upload_id: uploadId,
        target_column: selectedTarget,
        sensitive_columns: selectedSensitive,
        method: optMethod,
        n_trials: optTrials,
        cv_folds: optCV,
        accuracy_weight: optAccuracyWeight,
        fairness_weight: optFairnessWeight,
        timeout: optTimeout,
      });
      setProcessingStep(null);
      setOptimizationResults(res.data);
      setActiveResponseTab("body");
      setShowResponse(true);
    } catch (err: any) {
      setProcessingStep(null);
      alert(err?.response?.data?.detail || "Optimization failed");
    }
  };

  const applyMitigation = async (strategy: string) => {
    try {
      setProcessingStep(`Applying ${strategy} strategy...`);
      const res = await api.post(`/api/bias/mitigate`, {
        upload_id: uploadId,
        target_column: selectedTarget,
        sensitive_columns: selectedSensitive,
        strategy_name: strategy,
        confirm_recommendation: true,
      });
      setProcessingStep(null);
      setMitigationResults(res.data);
      setActiveResponseTab("body");
      setShowResponse(true);
    } catch (err: any) {
      setProcessingStep(null);
      alert(err?.response?.data?.detail || "Mitigation failed");
    }
  };

  const handleModelFile = (file: File | null) => {
    setModelFile(file);
    setIsModelValid(false);

    if (!file) return;

    const supported = [".pkl", ".h5", ".joblib", ".onnx", ".json"];
    const ok = supported.some((ext) => file.name.endsWith(ext));

    if (!ok) {
      setValidationResults((prev) => [
        ...prev,
        `Model file type not supported: ${file.name}`,
      ]);
      setIsModelValid(false);
    } else {
      setValidationResults((prev) => [
        ...prev.filter((r) => !r.startsWith("Model file type")),
        `Model file accepted: ${file.name}`,
      ]);
      setIsModelValid(true);
    }
  };

  const suggestMitigations = () => {
    const suggestions: string[] = [];
    if (!preprocessedDataset && dataset && dataset.length > 0)
      suggestions.push(
        "Run preprocessing (impute or remove nulls) before detection",
      );
    if (biasResults) {
      if (Math.abs(biasResults.spd ?? 0) > 0.1)
        suggestions.push(
          "Apply reweighting or resampling to reduce Statistical Parity Difference",
        );
      if ((biasResults.di ?? 1) < 0.8)
        suggestions.push(
          "Consider Disparate Impact Remover preprocessing or reweighing",
        );
    }
    return suggestions;
  };

  const runAnalysis = async () => {
    setShowResponse(false);

    // ===== VALIDATE =====
    if (requestMethod === "VALIDATE") {
      const res = await uploadDatasetAndModel();
      if (!res) return;

      setActiveResponseTab("body");
      setShowResponse(true);
      return;
    }

    // ===== DETECT =====
    if (requestMethod === "DETECT") {
      if (!uploadId) {
        alert("Upload ID missing. Please validate first.");
        return;
      }

      if (!selectedTarget || selectedSensitive.length === 0) {
        alert("Please select target and sensitive attributes");
        return;
      }

      try {
        setProcessingStep("Preparing dataset for bias audit...");
        await new Promise((r) => setTimeout(r, 800));

        setProcessingStep("Running fairness metrics (DPD, EOD, DIR)...");
        const res = await api.post("/api/bias/detect", {
          upload_id: uploadId, // ⚠️ NUMBER
          target_column: selectedTarget,
          sensitive_columns: selectedSensitive,
        });
        setProcessingStep(null);
        setBiasResults(res.data);
        setCurrentPhase("BIAS_DETECTED");
        setActiveResponseTab("body");
        setShowResponse(true);
      } catch (err: any) {
        alert(err?.response?.data?.detail || "Bias detection failed");
      }

      return;
    }

    // ===== MITIGATE =====
    if (requestMethod === "MITIGATE") {
      if (!recommendationResult) {
        alert("Please run DETECT first to configure mitigation.");
        return;
      }
      await applyMitigation(selectedStrategy);
      return;
    }

    // ===== OPTIMIZE =====
    if (requestMethod === "OPTIMIZE") {
      await applyOptimization();
      return;
    }

    // ===== COMPARE =====
    if (requestMethod === "COMPARE") {
      await fetchComparison();
      return;
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node | null;
      if (
        showProfile &&
        profileRef.current &&
        target &&
        !profileRef.current.contains(target) &&
        settingsBtnRef.current &&
        !settingsBtnRef.current.contains(target)
      ) {
        setShowProfile(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowProfile(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [showProfile]);

  const attributesSelected = selectedSensitive.length > 0 && !!selectedTarget;

  useEffect(() => {
    if (attributesSelected && currentPhase === "VALIDATED") {
      setCurrentPhase("ATTRIBUTES_SELECTED");
    }
  }, [attributesSelected, currentPhase]);

  const renderRequestBody = () => {
    if (requestMethod === "MITIGATE" && !mitigationResults) {
      if (!recommendationResult) {
        return (
          <div className="text-sm text-gray-500 p-4">
            Loading recommendations...
          </div>
        );
      }

      const { computed_metrics, dataset_analysis, recommendation } =
        recommendationResult;

      return (
        <div className="max-w-4xl space-y-8">
          <div className="border-b pb-4">
            <h3 className="text-xl font-bold text-gray-800">
              Strategy Recommendation
            </h3>
            <p className="text-sm text-gray-600">
              Fairness-aware guidance for your mitigation pipeline.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="border rounded-lg bg-white p-4">
              <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Fairness Metrics Summary
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <MetricRow name="DPD" value={computed_metrics?.dpd} />
                <MetricRow name="EOD" value={computed_metrics?.eod} />
                <MetricRow name="DI" value={computed_metrics?.di} />
                <MetricRow
                  name="Fairness Score"
                  value={computed_metrics?.fairness_score}
                />
              </div>
            </div>

            <div className="border rounded-lg bg-white p-4">
              <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <Database className="w-4 h-4" /> Dataset Analysis
              </h4>
              <div className="space-y-3">
                <InfoRow
                  label="Prediction Skew"
                  value={dataset_analysis?.prediction_skew}
                />
                <InfoRow
                  label="Dataset Size"
                  value={dataset_analysis?.dataset_size}
                />
                <InfoRow
                  label="Imbalance Ratio"
                  value={dataset_analysis?.imbalance_ratio}
                />
                <InfoRow
                  label="Sensitive Attributes"
                  value={dataset_analysis?.sensitive_attribute_count}
                />
              </div>
            </div>
          </div>

          <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              Recommended Strategy
            </div>
            <h4 className="text-lg font-bold text-blue-900 mb-2 capitalize flex items-center gap-2">
              <Brain className="w-5 h-5" />{" "}
              {recommendation?.recommended_strategy}
            </h4>
            <div className="flex gap-4 items-center mb-4 text-sm">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold">
                Confidence: {recommendation?.confidence_score}%
              </span>
            </div>
            <p className="text-blue-800 text-sm mb-4 leading-relaxed">
              {recommendation?.reasoning}
            </p>
            <div className="bg-white/60 p-3 rounded text-sm text-blue-900 italic border border-blue-100">
              {recommendation?.explanation_summary}
            </div>

            <div className="mt-6 pt-4 border-t border-blue-200">
              <h5 className="font-semibold text-sm mb-3 text-blue-900">
                Validated Improvements
              </h5>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded shadow-sm">
                  <div className="text-xs text-gray-500">DPD Reduction</div>
                  <div className="font-bold text-green-600">
                    {recommendation?.validated_improvements?.dpd_reduction !==
                    undefined
                      ? `+${(recommendation?.validated_improvements?.dpd_reduction * 100).toFixed(2)}%`
                      : "-"}
                  </div>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <div className="text-xs text-gray-500">EOD Reduction</div>
                  <div className="font-bold text-green-600">
                    {recommendation?.validated_improvements?.eod_reduction !==
                    undefined
                      ? `+${(recommendation?.validated_improvements?.eod_reduction * 100).toFixed(2)}%`
                      : "-"}
                  </div>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <div className="text-xs text-gray-500">Accuracy Impact</div>
                  <div className="font-bold text-orange-600">
                    {recommendation?.validated_improvements
                      ?.accuracy_tradeoff !== undefined
                      ? `${(recommendation?.validated_improvements?.accuracy_tradeoff * 100).toFixed(2)}%`
                      : "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!isExperimentMode ? (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-300 rounded-lg bg-gray-50 mt-6">
              <h4 className="text-gray-700 font-semibold mb-2">
                Want to explore alternative mitigations?
              </h4>
              <p className="text-sm text-gray-500 mb-4 text-center">
                Run a deep comparative analysis to rank and evaluate all
                available fairness strategies against your dataset.
              </p>
              <button
                onClick={fetchRanking}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-100 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" /> Experiment with Other
                Strategies
              </button>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              <div>
                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" /> Ranked Strategies (Experiment
                  Mode)
                </h4>
                {recommendation?.strategy_rankings ? (
                  <div className="grid grid-cols-1 gap-4">
                    {recommendation.strategy_rankings.map((strat: any) => (
                      <div
                        key={strat.strategy}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedStrategy === strat.strategy
                            ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500"
                            : "hover:border-blue-300 bg-white"
                        }`}
                        onClick={() => setSelectedStrategy(strat.strategy)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold capitalize flex items-center gap-2">
                            {strat.recommended && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                Recommended
                              </span>
                            )}
                            <span className="text-gray-500">#{strat.rank}</span>{" "}
                            {strat.strategy}
                          </div>
                          <div className="text-sm font-semibold text-gray-600">
                            Score: {strat.combined_score.toFixed(3)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {strat.tradeoff_analysis}
                        </p>

                        <div className="flex gap-4 text-xs mt-3 pt-3 border-t">
                          <div>
                            <span className="text-gray-500">
                              Fairness Gain:
                            </span>{" "}
                            <span className="font-semibold text-green-600">
                              +{strat.fairness_improvement.toFixed(4)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">
                              Accuracy Drop:
                            </span>{" "}
                            <span className="font-semibold text-orange-600">
                              {(strat.accuracy_drop * 100).toFixed(2)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Stability:</span>{" "}
                            <span className="font-semibold">
                              {(strat.stability_score * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 p-4 border rounded-lg bg-white">
                    No ranked strategies found.
                  </div>
                )}
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h5 className="font-semibold text-orange-800 text-sm mb-2">
                  Selected Mitigation Strategy
                </h5>
                <div className="flex items-center gap-3">
                  <span className="capitalize font-bold text-lg text-orange-900">
                    {selectedStrategy}
                  </span>
                  {selectedStrategy === recommendation.recommended_strategy && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-bold">
                      Recommended
                    </span>
                  )}
                </div>
                {selectedStrategy !== recommendation.recommended_strategy && (
                  <div className="mt-2 text-xs text-orange-700">
                    ⚠️ You selected a strategy different from the recommended
                    mitigation approach.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 pt-6 border-t mt-8">
            <button
              onClick={async () => {
                setSelectedStrategy(recommendation.recommended_strategy);
                await applyMitigation(recommendation.recommended_strategy);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Apply Recommended Strategy
            </button>

            {isExperimentMode && (
              <button
                onClick={async () => {
                  await applyMitigation(selectedStrategy);
                }}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-50"
              >
                Apply Selected Strategy
              </button>
            )}
          </div>
        </div>
      );
    }
    if (requestMethod === "OPTIMIZE") {
      return (
        <div className="max-w-4xl space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Settings className="w-5 h-5" /> Fairness-Aware Optimization
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Optimize your mitigated model to restore accuracy while preserving
              fairness gains.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              Optimization Method
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`p-4 border rounded-lg cursor-pointer ${optMethod === "gridsearch" ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500" : "hover:bg-gray-50"}`}
                onClick={() => setOptMethod("gridsearch")}
              >
                <div className="font-bold text-gray-800">GridSearch</div>
                <div className="text-xs text-gray-600 mt-1">
                  Exhaustive deterministic search. Best for smaller parameter
                  spaces and strict reproducibility.
                </div>
              </div>
              <div
                className={`p-4 border rounded-lg cursor-pointer ${optMethod === "optuna" ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500" : "hover:bg-gray-50"}`}
                onClick={() => setOptMethod("optuna")}
              >
                <div className="font-bold text-gray-800 flex items-center gap-2">
                  Optuna{" "}
                  <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded uppercase font-bold">
                    Recommended
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Adaptive intelligent search. Best for large spaces, scales
                  efficiently.
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Cross-Validation Folds
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={optCV}
                onChange={(e) => setOptCV(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>

            {optMethod === "optuna" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Number of Trials
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={optTrials}
                    onChange={(e) => setOptTrials(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="3600"
                    value={optTimeout}
                    onChange={(e) => setOptTimeout(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </>
            )}

            <div className="col-span-2 pt-4 border-t border-gray-200 mt-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Objective Weights (Total: 1.0)
              </label>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">
                      Accuracy Weight
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={optAccuracyWeight}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setOptAccuracyWeight(v);
                        setOptFairnessWeight(Number((1 - v).toFixed(1)));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">
                      Fairness Weight
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={optFairnessWeight}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setOptFairnessWeight(v);
                        setOptAccuracyWeight(Number((1 - v).toFixed(1)));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    if (requestMethod === "DETECT") {
      return (
        <div className="max-w-4xl space-y-6">
          <h3 className="text-lg font-bold text-gray-800">
            Bias Detection Configuration
          </h3>

          {/* Target Column */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Target Column
            </label>
            <select
              value={selectedTarget ?? ""}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="">Select target column...</option>
              {columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sensitive Attributes (MULTI SELECT) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sensitive Attributes
            </label>

            <div className="grid grid-cols-2 gap-2">
              {columns.map((col) => (
                <label
                  key={col}
                  className="flex items-center gap-2 text-sm border rounded px-3 py-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedSensitive.includes(col)}
                    disabled={
                      !selectedSensitive.includes(col) &&
                      selectedSensitive.length >= 2
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (selectedSensitive.length >= 2) return;
                        setSelectedSensitive((prev) => [...prev, col]);
                      } else {
                        setSelectedSensitive((prev) =>
                          prev.filter((c) => c !== col),
                        );
                      }
                    }}
                  />

                  {col}
                </label>
              ))}
            </div>

            <div className="text-xs text-gray-500 mt-1">
              Hold Ctrl / Cmd to select multiple sensitive attributes
            </div>
          </div>

          {/* Helper */}
          <div className="text-xs text-gray-500">
            Select one target column and one or more sensitive attributes.
          </div>
        </div>
      );
    }

    // Phase 1, 2, 3: Dataset and Model Analysis Configuration UI
    if (activeRequestObj.type === "Dataset") {
      return (
        <div className="max-w-5xl">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Dataset and Model Configuration (Phase 1, 2, 3)
          </h3>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Model Upload (Phase 1) - UI-only validation */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Model Upload (Phase 1)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer h-full flex flex-col justify-center">
                <Brain className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Upload Trained ML Model
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Supports .pkl,.joblib, .json, .ipynb
                </p>
                <input
                  type="file"
                  accept=".pkl,.joblib"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setModelFile(file); // ✅ correct
                    handleModelFile(file); // ✅ correct
                  }}
                />
                {modelFile && (
                  <div className="text-xs text-gray-600 mt-2">
                    Selected: {modelFile.name}
                  </div>
                )}
              </div>
            </div>

            {/* Dataset Upload (Phase 1) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Dataset Upload (Phase 1)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 hover:bg-orange-50 transition-all cursor-pointer h-full flex flex-col justify-center">
                <Upload className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Upload Analysis Dataset
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Supports CSV and JSON (client-side)
                </p>
                <input
                  required={true}
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setDatasetFile(file); // ✅ needed for backend
                    // ✅ client-side preview
                  }}
                />
                {datasetFile && (
                  <div className="text-xs text-gray-600 mt-2">
                    Selected: {datasetFile.name}
                  </div>
                )}
              </div>
            </div>
          </div>
          {uploading && (
            <div className="text-xs text-blue-600 mt-3">
              Uploading dataset & model...
            </div>
          )}

          {uploadId && (
            <div className="text-xs text-green-600 mt-8">
              Upload successful • Upload ID: {uploadId}
            </div>
          )}

          {uploadError && (
            <div className="text-xs text-red-600 mt-2">{uploadError}</div>
          )}
        </div>
      );
    }
  };
  const StatusCard = ({
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

  const InfoRow = ({ label, value }: { label: string; value?: any }) => (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium text-gray-800">{value ?? "-"}</div>
    </div>
  );

  const renderResponseBody = () => {
    if (requestMethod === "VALIDATE" && uploadResponse) {
      const { dataset_info, model_info } = uploadResponse;

      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <div className="text-sm font-semibold text-green-700">
                  Validation Completed Successfully
                </div>
                <div className="text-xs text-green-600">
                  Dataset and model are compatible with BiasBuster pipeline
                </div>
              </div>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-3 gap-4">
            <StatusCard title="Dataset Validation" status={true} />
            <StatusCard title="Model Validation" status={true} />
            <StatusCard
              title="Pipeline Ready"
              status="Ready for Bias Detection"
            />
          </div>

          {/* Dataset Card */}
          <div className="border rounded-lg bg-white shadow-sm">
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <Database className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold">Dataset Overview</span>
            </div>

            <div className="grid grid-cols-2 gap-6 p-4 text-sm">
              <InfoRow label="File Name" value={datasetFile?.name} />
              <InfoRow label="Rows" value={dataset_info?.rows} />
              <InfoRow label="Columns" value={dataset_info?.columns} />
              <InfoRow
                label="Missing Values"
                value={dataset_info?.missing_values ?? "0"}
              />
            </div>
          </div>

          {/* Model Card */}
          <div className="border rounded-lg bg-white shadow-sm">
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold">Model Verification</span>
            </div>

            <div className="grid grid-cols-2 gap-6 p-4 text-sm">
              <InfoRow label="Model File" value={modelFile?.name} />
              <InfoRow
                label="Format"
                value={model_info?.format ?? "Supported"}
              />
              <InfoRow
                label="Model Type"
                value={model_info?.model_type ?? "Classifier"}
              />
              <InfoRow label="Compatibility" value="Compatible with pipeline" />
            </div>
          </div>

          {/* Validation Checklist */}
          <div className="border rounded-lg bg-white shadow-sm">
            <div className="px-4 py-3 border-b text-sm font-semibold">
              Validation Checklist
            </div>

            <div className="p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                Dataset file uploaded successfully
              </div>

              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                Model file format supported
              </div>

              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                Dataset structure verified
              </div>

              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                Model ready for bias analysis
              </div>
            </div>
          </div>

          {/* Next Step Hint */}
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm text-blue-700 font-medium">
              Next Step: Configure bias detection by selecting target and
              sensitive attributes.
            </span>

            <button
              onClick={() => setRequestMethod("DETECT")}
              className="px-4 py-2 text-sm font-semibold bg-orange-500 text-white rounded hover:bg-orange-600 flex items-center gap-2"
            >
              Go to Detection
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    if (requestMethod === "DETECT" && biasResults) {
      return (
        <div className="space-y-6">
          <div className="p-4 border rounded-lg bg-gray-50 text-sm mb-4">
            <div className="font-semibold mb-2">Fairness Metric Guidelines</div>

            <ul className="space-y-1 text-gray-600">
              <li>DPD ≤ 0.1 → Fair</li>
              <li>EOD ≤ 0.1 → Fair</li>
              <li>DIR between 0.8 and 1.25 → Fair</li>
            </ul>
          </div>
          <BiasSummary report={biasResults} />

          {Object.entries(biasResults.sensitive_audit).map(
            ([attribute, data]: any) => (
              <AttributeBiasCard
                key={attribute}
                attribute={attribute}
                data={data}
              />
            ),
          )}
          <div
            className={`p-4 rounded-lg border flex items-center gap-3
        ${
          biasResults.bias_present
            ? "bg-red-50 border-red-200 text-red-700"
            : "bg-green-50 border-green-200 text-green-700"
        }`}
          >
            <CheckCircle className="w-5 h-5" />

            {biasResults.bias_present ? (
              <span className="text-sm font-semibold">
                Bias detected in the model predictions. Mitigation is required
                before deployment. Proceed to the <strong>MITIGATE</strong>{" "}
                phase.
              </span>
            ) : (
              <span className="text-sm font-semibold">
                No significant bias detected. Model is safe for deployment.
              </span>
            )}
            {/* Next Phase Button */}
            {biasResults.bias_present && (
              <button
                onClick={async () => {
                  setRequestMethod("MITIGATE");
                  setShowResponse(false);
                  try {
                    setProcessingStep("Fetching strategy recommendation...");
                    const rec = await api.post(`/api/bias/recommend-strategy`, {
                      upload_id: uploadId,
                      target_column: selectedTarget,
                      sensitive_columns: selectedSensitive,
                    });
                    setProcessingStep(null);
                    setRecommendationResult(rec.data);
                    if (rec.data.recommendation?.recommended_strategy) {
                      setSelectedStrategy(
                        rec.data.recommendation.recommended_strategy,
                      );
                    }
                  } catch (e) {
                    setProcessingStep(null);
                    console.error("Failed to fetch recommendation", e);
                    alert("Failed to fetch recommendation");
                  }
                }}
                className="px-4 py-2 text-sm font-semibold bg-orange-500 text-white rounded hover:bg-orange-600 flex items-center gap-2"
              >
                Go to Mitigation
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      );
    }

    if (requestMethod === "MITIGATE" && mitigationResults) {
      if (mitigationResults.status !== "success") {
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-5">
            <h3 className="text-lg font-bold text-red-800 mb-2">
              Mitigation Failed
            </h3>
            <p className="text-sm text-red-700">
              {mitigationResults.diagnostic_details ||
                "An unknown error occurred."}
            </p>
          </div>
        );
      }

      return (
        <div className="space-y-8 max-w-5xl">
          <div className="flex flex-col gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-5">
              <h3 className="text-lg font-bold text-green-800 mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" /> Mitigation Pipeline
                Successful
              </h3>
              <p className="text-sm text-green-700 mb-4">
                {mitigationResults.tradeoff_analysis}
              </p>
              <div className="grid grid-cols-3 gap-4 text-sm mt-4">
                <InfoRow
                  label="Strategy Applied"
                  value={
                    mitigationResults.strategy_applied?.toUpperCase() ||
                    "UNKNOWN"
                  }
                />
                <InfoRow
                  label="Fairness Gain"
                  value={`+${((mitigationResults.fairness_improvement?.fairness_score_gain || 0) * 100).toFixed(1)}%`}
                />
                <InfoRow
                  label="Accuracy Impact"
                  value={`${((mitigationResults.performance_impact?.accuracy_change || 0) * 100).toFixed(1)}%`}
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">
              Before & After Analysis
            </h4>
            <div className="grid grid-cols-2 gap-8 text-sm pt-2">
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg shadow-sm">
                <div className="font-bold text-gray-500 mb-4 text-xs uppercase tracking-widest flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Baseline Model
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <MetricRow
                    name="Accuracy"
                    value={
                      mitigationResults.metrics_before?.accuracy ||
                      mitigationResults.metrics_before?.performance?.accuracy
                    }
                  />
                  <MetricRow
                    name="Fairness Score"
                    value={
                      mitigationResults.metrics_before?.fairness_score ||
                      mitigationResults.metrics_before?.fairness?.aggregate
                        ?.fairness_score
                    }
                  />
                  <MetricRow
                    name="DPD"
                    value={
                      mitigationResults.metrics_before?.dpd ||
                      mitigationResults.metrics_before?.fairness?.aggregate?.dpd
                    }
                  />
                  <MetricRow
                    name="EOD"
                    value={
                      mitigationResults.metrics_before?.eod ||
                      mitigationResults.metrics_before?.fairness?.aggregate?.eod
                    }
                  />
                </div>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg shadow-sm">
                <div className="font-bold text-orange-600 mb-4 text-xs uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Mitigated Model
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <MetricRow
                    name="Accuracy"
                    value={
                      mitigationResults.metrics_after?.accuracy ||
                      mitigationResults.metrics_after?.performance?.accuracy
                    }
                    baselineValue={
                      mitigationResults.metrics_before?.accuracy ||
                      mitigationResults.metrics_before?.performance?.accuracy
                    }
                  />
                  <MetricRow
                    name="Fairness Score"
                    value={
                      mitigationResults.metrics_after?.fairness_score ||
                      mitigationResults.metrics_after?.fairness?.aggregate
                        ?.fairness_score
                    }
                    baselineValue={
                      mitigationResults.metrics_before?.fairness_score ||
                      mitigationResults.metrics_before?.fairness?.aggregate
                        ?.fairness_score
                    }
                  />
                  <MetricRow
                    name="DPD"
                    value={
                      mitigationResults.metrics_after?.dpd ||
                      mitigationResults.metrics_after?.fairness?.aggregate?.dpd
                    }
                    baselineValue={
                      mitigationResults.metrics_before?.dpd ||
                      mitigationResults.metrics_before?.fairness?.aggregate?.dpd
                    }
                  />
                  <MetricRow
                    name="EOD"
                    value={
                      mitigationResults.metrics_after?.eod ||
                      mitigationResults.metrics_after?.fairness?.aggregate?.eod
                    }
                    baselineValue={
                      mitigationResults.metrics_before?.eod ||
                      mitigationResults.metrics_before?.fairness?.aggregate?.eod
                    }
                  />
                </div>

                {/* Mini Comparison */}
                <div className="mt-4 pt-4 border-t border-orange-100 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">
                        Quick Comparison Preview
                      </div>
                      <div className="text-[11px] text-orange-700">
                        {optimizationResults
                          ? "Original, mitigated, and optimized variants are available."
                          : "Optimization not performed."}
                      </div>
                    </div>
                    <button
                      onClick={fetchComparison}
                      className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
                    >
                      Compare Models <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      {
                        label: "Original Model",
                        source: "original",
                        accuracy:
                          mitigationResults.metrics_before?.accuracy ||
                          mitigationResults.metrics_before?.performance
                            ?.accuracy,
                        fairness_score:
                          mitigationResults.metrics_before?.fairness_score ||
                          mitigationResults.metrics_before?.fairness?.aggregate
                            ?.fairness_score,
                        dpd:
                          mitigationResults.metrics_before?.dpd ||
                          mitigationResults.metrics_before?.fairness?.aggregate
                            ?.dpd,
                        eod:
                          mitigationResults.metrics_before?.eod ||
                          mitigationResults.metrics_before?.fairness?.aggregate
                            ?.eod,
                      },
                      {
                        label: "Mitigated Model",
                        source: "mitigated",
                        accuracy:
                          mitigationResults.metrics_after?.accuracy ||
                          mitigationResults.metrics_after?.performance
                            ?.accuracy,
                        fairness_score:
                          mitigationResults.metrics_after?.fairness_score ||
                          mitigationResults.metrics_after?.fairness?.aggregate
                            ?.fairness_score,
                        dpd:
                          mitigationResults.metrics_after?.dpd ||
                          mitigationResults.metrics_after?.fairness?.aggregate
                            ?.dpd,
                        eod:
                          mitigationResults.metrics_after?.eod ||
                          mitigationResults.metrics_after?.fairness?.aggregate
                            ?.eod,
                      },
                      ...(optimizationResults
                        ? [
                            {
                              label: "Optimized Model",
                              source: "optimized",
                              accuracy:
                                optimizationResults.optimized_model?.performance
                                  ?.accuracy ||
                                optimizationResults.optimized_model?.accuracy,
                              fairness_score:
                                optimizationResults.optimized_model?.fairness
                                  ?.aggregate?.fairness_score ||
                                optimizationResults.optimized_model
                                  ?.fairness_score,
                              dpd: optimizationResults.optimized_model?.fairness
                                ?.aggregate?.dpd,
                              eod: optimizationResults.optimized_model?.fairness
                                ?.aggregate?.eod,
                            },
                          ]
                        : []),
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-lg border border-orange-100 bg-white/80 p-3"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="text-xs font-semibold text-gray-700">
                            {item.label}
                          </div>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${item.source === "original" ? "bg-gray-100 text-gray-600" : item.source === "mitigated" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}
                          >
                            {item.source}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                          <div>
                            Acc:{" "}
                            <span className="font-semibold text-gray-800">
                              {typeof item.accuracy === "number"
                                ? item.accuracy.toFixed(3)
                                : "-"}
                            </span>
                          </div>
                          <div>
                            Fair:{" "}
                            <span className="font-semibold text-gray-800">
                              {typeof item.fairness_score === "number"
                                ? item.fairness_score.toFixed(3)
                                : "-"}
                            </span>
                          </div>
                          <div>
                            DPD:{" "}
                            <span className="font-semibold text-gray-800">
                              {typeof item.dpd === "number"
                                ? item.dpd.toFixed(3)
                                : "-"}
                            </span>
                          </div>
                          <div>
                            EOD:{" "}
                            <span className="font-semibold text-gray-800">
                              {typeof item.eod === "number"
                                ? item.eod.toFixed(3)
                                : "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <ComparisonBar
                    label="Fairness Gain vs Baseline"
                    value={
                      mitigationResults.fairness_improvement
                        ?.fairness_score_gain || 0
                    }
                    max={0.5}
                    color="bg-green-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleModelDownload({
                    model_id: mitigationResults.correction_id,
                    download_url: `http://localhost:8000/api/correction/download-model/${mitigationResults.correction_id}`,
                    model_type: "Mitigated Classifier",
                    accuracy:
                      mitigationResults.metrics_after?.performance?.accuracy ||
                      mitigationResults.metrics_after?.accuracy,
                    fairness_score:
                      mitigationResults.metrics_after?.fairness?.aggregate
                        ?.fairness_score ||
                      mitigationResults.metrics_after?.fairness_score,
                    source_type: "mitigated",
                  });
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" /> Download Mitigated Model
              </button>
              {["reweighting", "smote"].includes(
                mitigationResults.strategy_applied,
              ) && (
                <button
                  onClick={() => {
                    window.open(
                      `http://localhost:8000/api/correction/download-dataset/${mitigationResults.correction_id}`,
                      "_blank",
                    );
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center gap-2 shadow-sm"
                >
                  <Database className="w-4 h-4" /> Download Corrected Dataset
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setRequestMethod("OPTIMIZE");
                setShowResponse(false);
              }}
              className="px-6 py-2 bg-indigo-600 text-white rounded font-semibold hover:bg-indigo-700 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" /> Proceed to Optimization
            </button>
          </div>
        </div>
      );
    }

    if (requestMethod === "OPTIMIZE" && optimizationResults) {
      return (
        <div className="space-y-8 max-w-5xl">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5">
            <h3 className="text-lg font-bold text-indigo-800 mb-2 flex items-center gap-2">
              <Settings className="w-5 h-5" /> Optimization Complete
            </h3>
            <p className="text-sm text-indigo-700">
              Successfully optimized the mitigated model using{" "}
              {optimizationResults.optimization_method ||
                optimizationResults.method}
              .
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">
              Optimization Results
            </h4>
            <div className="grid grid-cols-2 gap-8 text-sm pt-2">
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg shadow-sm">
                <div className="font-bold text-gray-500 mb-4 text-xs uppercase tracking-widest">
                  Before Optimization
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <MetricRow
                    name="Accuracy"
                    value={
                      optimizationResults.baseline_model?.performance?.accuracy
                    }
                  />
                  <MetricRow
                    name="Fairness Score"
                    value={
                      optimizationResults.baseline_model?.fairness?.aggregate
                        ?.fairness_score
                    }
                  />
                  <MetricRow
                    name="DPD"
                    value={
                      optimizationResults.baseline_model?.fairness?.aggregate
                        ?.dpd
                    }
                  />
                  <MetricRow
                    name="EOD"
                    value={
                      optimizationResults.baseline_model?.fairness?.aggregate
                        ?.eod
                    }
                  />
                </div>
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg shadow-sm">
                <div className="font-bold text-indigo-600 mb-4 text-xs uppercase tracking-widest">
                  After Optimization
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <MetricRow
                    name="Accuracy"
                    value={
                      optimizationResults.optimized_model?.performance?.accuracy
                    }
                    baselineValue={
                      optimizationResults.baseline_model?.performance?.accuracy
                    }
                  />
                  <MetricRow
                    name="Fairness Score"
                    value={
                      optimizationResults.optimized_model?.fairness?.aggregate
                        ?.fairness_score
                    }
                    baselineValue={
                      optimizationResults.baseline_model?.fairness?.aggregate
                        ?.fairness_score
                    }
                  />
                  <MetricRow
                    name="DPD"
                    value={
                      optimizationResults.optimized_model?.fairness?.aggregate
                        ?.dpd
                    }
                    baselineValue={
                      optimizationResults.baseline_model?.fairness?.aggregate
                        ?.dpd
                    }
                  />
                  <MetricRow
                    name="EOD"
                    value={
                      optimizationResults.optimized_model?.fairness?.aggregate
                        ?.eod
                    }
                    baselineValue={
                      optimizationResults.baseline_model?.fairness?.aggregate
                        ?.eod
                    }
                  />
                </div>
              </div>
            </div>

            {optimizationResults.best_params && (
              <div className="mt-6 p-4 bg-gray-900 rounded-lg shadow-sm">
                <div className="font-bold text-gray-400 mb-2 text-xs uppercase tracking-widest flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Best Hyperparameters
                </div>
                <pre className="text-sm text-green-400 font-mono overflow-x-auto">
                  {JSON.stringify(optimizationResults.best_params, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-6">
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleModelDownload({
                    model_id: optimizationResults.optimization_id,
                    download_url: `http://localhost:8000/api/optimize/download/${optimizationResults.optimization_id}`,
                    model_type: "Optimized Classifier",
                    accuracy:
                      optimizationResults.optimized_model?.performance
                        ?.accuracy ||
                      optimizationResults.optimized_model?.accuracy,
                    fairness_score:
                      optimizationResults.optimized_model?.fairness?.aggregate
                        ?.fairness_score ||
                      optimizationResults.optimized_model?.fairness_score,
                    source_type: "optimized",
                  });
                }}
                className="px-4 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-50 flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" /> Download Optimized Model
              </button>
              <button
                onClick={fetchComparison}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center gap-2 shadow-sm"
              >
                <BarChart3 className="w-4 h-4" /> Compare All Models
              </button>
            </div>
            <button
              onClick={() => {
                alert(
                  "Model promoted to Model Registry and Production-ready staging.",
                );
              }}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center gap-2 shadow-md"
            >
              <CheckCircle className="w-4 h-4" /> Approve for Production
            </button>
          </div>
        </div>
      );
    }

    if (requestMethod === "COMPARE" && comparisonData) {
      return (
        <ComparisonDashboard
          data={comparisonData}
          onDownload={(id) => {
            const model = comparisonData.models.find(
              (m: any) => m.model_id === id,
            );
            setDownloadModelMetadata(model);
          }}
        />
      );
    }
  };

  const handleModelDownload = (model: any) => {
    setDownloadModelMetadata(model);
  };

  const confirmDownload = (modelId: string, downloadUrl?: string) => {
    if (downloadUrl) {
      const resolvedUrl = downloadUrl.startsWith("http")
        ? downloadUrl
        : `http://localhost:8000${downloadUrl.startsWith("/") ? "" : "/"}${downloadUrl}`;
      window.open(resolvedUrl, "_blank");
    } else {
      window.open(
        `http://localhost:8000/api/models/download/${modelId}`,
        "_blank",
      );
    }
  };
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Download Modal Overlay */}
      {downloadModelMetadata && (
        <DownloadModal
          model={downloadModelMetadata}
          onConfirm={confirmDownload}
          onClose={() => setDownloadModelMetadata(null)}
        />
      )}
      {/* Left Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col relative">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a
              className="flex items-center gap-2 group"
              data-testid="link-home"
            >
              <div className="size-8 flex items-center justify-center text-foreground">
                <Brain className="size-8 stroke-[2.5] text-orange-500" />
              </div>
              <span className="font-display text-xl tracking-wider text-foreground uppercase">
                BiasBuster
              </span>
            </a>
          </div>
          <button className="p-1.5 hover:bg-gray-100 rounded">
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Workspace Selector */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Workspace
          </div>
          <div className="relative">
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {collections.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Collections */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-gray-500 uppercase">
                Collections
              </div>
              <button
                onClick={addCollection}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Plus className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-1">
              {collections.map((col) => (
                <div key={col.name} className="mb-3">
                  <div
                    onClick={() => setSelectedCollection(col.name)}
                    className={`flex items-center gap-1 px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer ${selectedCollection === col.name ? "bg-gray-50" : ""}`}
                  >
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                    <Folder className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium">{col.name}</span>
                  </div>
                  <div className="ml-6 space-y-0.5 mt-1">
                    {col.requests.length ? (
                      col.requests.map((req) => (
                        <div
                          key={req.id}
                          onClick={() => {
                            setActiveRequest(req.id);
                            setSelectedCollection(col.name);
                          }}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer ${activeRequest === req.id ? "bg-orange-50 text-orange-700" : "hover:bg-gray-100"}`}
                        >
                          <span
                            className={`text-xs font-semibold px-1.5 py-0.5 rounded ${activeRequest === req.id ? "bg-orange-500 text-white" : "bg-blue-100 text-blue-700"}`}
                          >
                            {req.method}
                          </span>
                          <span className="text-sm truncate">{req.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-400 px-2">
                        No requests
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="px-4 py-3 border-t border-gray-200 space-y-2 relative">
          <button
            onClick={addRequest}
            className="w-full px-3 py-2 text-sm font-medium bg-orange-500 text-white rounded hover:bg-orange-600 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Request
          </button>

          <div className="relative">
            <button
              ref={settingsBtnRef}
              onClick={() => setShowProfile((s) => !s)}
              className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>

            {showProfile && (
              <div
                ref={profileRef}
                className="absolute left-0 mb-16 bottom-14 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-40"
                role="dialog"
                aria-modal="true"
              >
                <div className="flex items-center gap-3">
                  <Image
                    src="/Screenshot 2024-10-14 212938.png"
                    alt="avatar"
                    width={120}
                    height={120}
                  />
                  <div>
                    <div className="text-sm font-semibold">Yash Gaonkar</div>
                    <div className="text-xs text-gray-500">
                      yashgaonkar2020@gmail.com
                    </div>
                    <button
                      className="mt-2 text-xs px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                      onClick={() => {
                        setShowProfile(false);
                        alert("Open full profile page (implement route)");
                      }}
                    >
                      View Profile
                    </button>
                  </div>
                </div>

                <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                  <button className="w-full text-left px-2 py-2 rounded hover:bg-gray-50 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-gray-600" />
                    <span className="text-sm">Dashboard</span>
                  </button>
                  <button className="w-full text-left px-2 py-2 rounded hover:bg-gray-50 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm">My Requests</span>
                  </button>
                  <button className="w-full text-left px-2 py-2 rounded hover:bg-gray-50 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm">Recent Activity</span>
                  </button>
                </div>

                <div className="mt-3 border-t border-gray-100 pt-3">
                  <button
                    className="w-full text-left px-2 py-2 rounded hover:bg-gray-50 flex items-center gap-2 text-red-600"
                    onClick={() => {
                      setShowProfile(false);
                      alert("Signed out (implement action)");
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200">
          <div className="flex items-center px-4">
            <div className="flex items-center gap-1 border-r border-gray-200 pr-4">
              <div className="px-4 py-3 border-b-2 border-orange-500 flex items-center gap-2 cursor-pointer">
                <span className="text-sm font-medium">
                  {activeRequestObj.name}
                </span>
                <X className="w-3.5 h-3.5 text-gray-500 hover:text-gray-700" />
              </div>
            </div>
            <button className="px-3 py-3 text-gray-400 hover:text-gray-600">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Request Builder */}
        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              {/* Phase 4 & 5: Method Selection */}
              <select
                value={requestMethod}
                onChange={(e) => {
                  setRequestMethod(e.target.value);
                  setShowResponse(false);
                }}
                className="px-3 py-2 text-sm font-semibold border border-gray-300 rounded
             focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="VALIDATE">VALIDATE</option>
                <option value="DETECT" disabled={currentPhase !== "VALIDATED"}>
                  DETECT
                </option>
                <option
                  value="MITIGATE"
                  disabled={currentPhase !== "BIAS_DETECTED"}
                >
                  MITIGATE
                </option>
                <option value="OPTIMIZE" disabled={!mitigationResults}>
                  OPTIMIZE
                </option>
                <option value="COMPARE" disabled={!mitigationResults}>
                  COMPARE
                </option>
              </select>

              <button
                onClick={runAnalysis}
                className="px-6 py-2 bg-orange-500 text-white text-sm font-semibold rounded hover:bg-orange-600 flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>

          <div className="bg-white border-b border-gray-200 px-6">
            <div className="flex gap-6">
              <button className="px-1 py-3 text-sm font-medium text-orange-600 border-b-2 border-orange-500">
                Params
              </button>
            </div>
          </div>

          <div className="p-6 bg-white">
            {(uploading || processingStep) && (
              <ProcessingLoader step={processingStep || "Processing..."} />
            )}

            {renderRequestBody()}
          </div>

          {showResponse && (
            <div className="border-t-4 border-gray-200 bg-gray-50">
              <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold">Response</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ${requestMethod === "MITIGATE" ? "bg-green-100 text-green-700" : "bg-green-100 text-green-700"}`}
                    >
                      200 OK
                    </span>
                    <span className="text-xs text-gray-500">1.24s</span>
                    <span className="text-xs text-gray-500">2.4 KB</span>
                  </div>
                </div>
                <button className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1">
                  <Save className="w-3.5 h-3.5" />
                  Save Response (Report)
                </button>
              </div>

              <div className="bg-white border-b border-gray-200 px-6">
                <div className="flex gap-6">
                  <button
                    onClick={() => setActiveResponseTab("body")}
                    className={`px-1 py-3 text-sm font-medium ${
                      activeResponseTab === "body"
                        ? "text-orange-600 border-b-2 border-orange-500"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Body
                  </button>
                </div>
              </div>

              <div className="p-6 bg-white">
                {activeResponseTab === "body" && renderResponseBody()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
