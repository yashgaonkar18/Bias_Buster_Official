"use client";

import React, { useState } from "react";
import { 
  BarChart3, 
  ShieldCheck, 
  Download, 
  FileText, 
  X,
  Database,
  ChevronRight,
  Brain
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Bar, Scatter } from "react-chartjs-2";
import { api } from "@/lib/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Title,
);

const getMetric = (obj: any, key: string) => {
  if (!obj) return 0;
  if (typeof obj[key] === "number") return obj[key];
  
  if (key === "accuracy" || key === "performance") {
    return obj.performance?.accuracy ?? obj.accuracy ?? obj.accuracy_score ?? 0;
  }
  if (key === "fairness_score" || key === "fairness") {
    return obj.fairness?.aggregate?.fairness_score ?? obj.fairness_score ?? obj.fairness_aggregate ?? 0;
  }
  if (key === "combined_score") {
    return obj.combined_score ?? obj.score ?? 0;
  }
  return obj[key] ?? 0;
};

const modelBadge = (sourceType: string) => {
  if (sourceType === "original") return "bg-gray-100 text-gray-700";
  if (sourceType === "mitigated") return "bg-blue-100 text-blue-700";
  if (sourceType === "optimized") return "bg-purple-100 text-purple-700";
  return "bg-green-100 text-green-700";
};

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

export const ComparisonDashboard = ({
  data,
  onDownload,
  onGenerateReport,
  reportBusy,
}: {
  data: any;
  onDownload: (model: any) => void;
  onGenerateReport: () => void;
  reportBusy?: boolean;
}) => {
  if (!data || !Array.isArray(data.models) || data.models.length === 0)
    return null;

  // Build lineage-first structure and deduplicate near-identical artifacts.
  const sourcePriority: Record<string, number> = {
    mitigated: 0,
    original: 1,
    optimized: 2,
  };

  const rawModels = Array.isArray(data.models) ? [...data.models] : [];

  // Deduplicate by parent+strategy+rounded metrics signature
  const seen = new Set<string>();
  const deduped: any[] = [];
  rawModels.forEach((m: any) => {
    const parent =
      m.parent_model_id || m.parent_id || m.origin_model_id || "root";
    const strategy =
      m.mitigation_strategy ||
      m.strategy ||
      m.optimization_method ||
      m.source_type ||
      "unknown";
    const sig = `${parent}::${strategy}::${(m.accuracy || 0).toFixed(3)}::${(m.fairness_score || 0).toFixed(3)}::${(m.combined_score || 0).toFixed(3)}`;
    if (!seen.has(sig)) {
      seen.add(sig);
      deduped.push(m);
    }
  });

  const models = deduped.sort((a: any, b: any) => {
    const pa = sourcePriority[a.source_type] ?? 99;
    const pb = sourcePriority[b.source_type] ?? 99;
    if (pa !== pb) return pa - pb;
    return getMetric(b, "combined_score") - getMetric(a, "combined_score");
  });

  // Pick base uploaded model (original) or fallback to highest combined
  const baseModel =
    models.find((m: any) => m.source_type === "original") || models[0] || null;

  // Build children map keyed by parent id
  const byParent: Record<string, any[]> = {};
  models.forEach((m: any) => {
    const pid =
      m.parent_model_id ||
      m.parent_id ||
      m.origin_model_id ||
      (m.source_type === "original" ? "root" : baseModel?.model_id || "root");
    if (!byParent[pid]) byParent[pid] = [];
    byParent[pid].push(m);
  });

  const recommended =
    models.find((m: any) => m.model_id === data.best_balanced_model) ||
    models[0] ||
    null;

  const optimizationStatus =
    data.optimization_status ||
    (models.some((m: any) => m.source_type === "optimized")
      ? "Optimization completed"
      : "Optimization not performed");
  const hasOptimized = models.some((m: any) => m.source_type === "optimized");

  const variantLabel = (v: any) => {
    if (!v) return "Variant";
    if (v.source_type === "original") return "Base Model";
    if (v.source_type === "mitigated") {
      const strat = v.mitigation_strategy || v.strategy || "Mitigated";
      return `${String(strat).replace(/[_-]/g, " ")} Mitigated Variant`;
    }
    if (v.source_type === "optimized") {
      const opt = v.optimization_method || "Optimized";
      return `${String(opt).replace(/[_-]/g, " ")} Optimized Variant`;
    }
    return (
      v.mitigation_strategy ||
      v.strategy ||
      v.source_type ||
      "Variant"
    ).toString();
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
              Combined Score: {getMetric(recommended, "combined_score").toFixed(3)}
            </div>
            <div className="bg-white/15 px-3 py-2 rounded-lg">
              Accuracy: {getMetric(recommended, "accuracy").toFixed(3)}
            </div>
            <div className="bg-white/15 px-3 py-2 rounded-lg">
              Fairness: {getMetric(recommended, "fairness_score").toFixed(3)}
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => onDownload(recommended)}
              className="bg-white text-orange-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" /> Download Recommended
            </button>
            <button
              onClick={onGenerateReport}
              disabled={reportBusy}
              className="bg-orange-950/90 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-950 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4" />
              {reportBusy ? "Generating Report..." : "Generate Report"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Base Uploaded Model */}
        {baseModel && (
          <div
            className={`border rounded-2xl p-6 bg-white ${baseModel.model_id === recommended?.model_id ? "ring-2 ring-orange-500" : ""}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-500">Base Uploaded Model</div>
                <h3 className="text-xl font-bold mt-1">
                  {baseModel.model_name}
                </h3>
                <p className="text-sm text-gray-500">
                  {baseModel.model_type || "Classifier"} •{" "}
                  {baseModel.original_filename ||
                    baseModel.artifact_name ||
                    "uploaded model"}
                </p>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="bg-gray-50 px-3 py-2 rounded flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Accuracy</span>
                    <span className="font-semibold">{getMetric(baseModel, "accuracy").toFixed(3)}</span>
                  </div>
                  <div className="bg-gray-50 px-3 py-2 rounded flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Fairness</span>
                    <span className="font-semibold">{getMetric(baseModel, "fairness_score").toFixed(3)}</span>
                  </div>
                  <div className="bg-gray-50 px-3 py-2 rounded flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">DPD</span>
                    <span className="font-semibold">{(baseModel.dpd ?? 0).toFixed(3)}</span>
                  </div>
                  <div className="bg-gray-50 px-3 py-2 rounded flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">EOD</span>
                    <span className="font-semibold">{(baseModel.eod ?? 0).toFixed(3)}</span>
                  </div>
                  <div className="bg-gray-50 px-3 py-2 rounded flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">DIR</span>
                    <span className="font-semibold">{(baseModel.dir ?? 0).toFixed(3)}</span>
                  </div>
                </div>
                <p className="text-[13px] text-gray-600 mt-4 leading-relaxed">
                  {baseModel.summary ||
                    "Baseline model used as the experiment anchor."}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {baseModel.model_id === recommended?.model_id && (
                  <div className="px-3 py-1 rounded bg-orange-100 text-orange-700 font-bold">
                    Recommended
                  </div>
                )}
                <button
                  onClick={() => onDownload(baseModel)}
                  className="px-3 py-1 rounded bg-gray-50 hover:bg-gray-100 text-sm border"
                >
                  Download Base
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generated Experimental Variants grouped by mitigation strategy */}
        <div className="border rounded-2xl p-4 bg-white">
          <h4 className="font-bold text-gray-800 mb-3">
            Generated Experimental Variants
          </h4>
          <div className="space-y-4">
            {(byParent[baseModel?.model_id || "root"] || [])
              .filter((m: any) => m.model_id !== baseModel?.model_id)
              .sort(
                (a: any, b: any) =>
                  (b.combined_score || 0) - (a.combined_score || 0),
              )
              .map((variant: any) => (
                <div key={variant.model_id} className="border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${modelBadge(variant.source_type)}`}
                        >
                          {variantLabel(variant)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {variant.mitigation_strategy ||
                            variant.strategy ||
                            variant.optimization_method ||
                            variant.source_type}
                        </span>
                      </div>
                      <h5 className="font-semibold text-gray-800 mt-2">
                        {variant.model_name}
                      </h5>
                      <p className="text-sm text-gray-500 mt-1">
                        {variant.summary ||
                          "Experimental variant derived from base model."}
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-gray-50 px-2 py-1.5 rounded flex justify-between items-center">
                          <span className="text-[10px] text-gray-400 uppercase font-bold">Acc</span>
                          <span className="font-semibold">{getMetric(variant, "accuracy").toFixed(3)}</span>
                        </div>
                        <div className="bg-gray-50 px-2 py-1.5 rounded flex justify-between items-center">
                          <span className="text-[10px] text-gray-400 uppercase font-bold">Fair</span>
                          <span className="font-semibold">{getMetric(variant, "fairness_score").toFixed(3)}</span>
                        </div>
                        <div className="bg-gray-50 px-2 py-1.5 rounded flex justify-between items-center">
                          <span className="text-[10px] text-gray-400 uppercase font-bold">DPD</span>
                          <span className="font-semibold">{(variant.dpd ?? 0).toFixed(3)}</span>
                        </div>
                        <div className="bg-gray-50 px-2 py-1.5 rounded flex justify-between items-center">
                          <span className="text-[10px] text-gray-400 uppercase font-bold">EOD</span>
                          <span className="font-semibold">{(variant.eod ?? 0).toFixed(3)}</span>
                        </div>
                        <div className="bg-gray-50 px-2 py-1.5 rounded flex justify-between items-center">
                          <span className="text-[10px] text-gray-400 uppercase font-bold">DIR</span>
                          <span className="font-semibold">{(variant.dir ?? 0).toFixed(3)}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-center py-1 bg-orange-50/50 rounded text-[11px] font-bold text-orange-700">
                        Combined Score: {getMetric(variant, "combined_score").toFixed(3)}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {variant.model_id === recommended?.model_id && (
                        <div className="px-3 py-1 rounded bg-orange-100 text-orange-700 font-bold">
                          🏆 Recommended
                        </div>
                      )}
                      <div className="flex flex-col gap-2 text-right">
                        <button
                          onClick={() => onDownload(variant)}
                          className="px-3 py-1 rounded bg-gray-50 hover:bg-gray-100 text-sm border"
                        >
                          Download Model
                        </button>
                        {variant.dataset_download_url && (
                          <button
                            onClick={() => {
                              const apiBase = api.defaults.baseURL || "http://localhost:8000";
                              const u = variant.dataset_download_url.startsWith("http")
                                ? variant.dataset_download_url
                                : `${apiBase}${variant.dataset_download_url.startsWith("/") ? "" : "/"}${variant.dataset_download_url}`;
                              window.open(u, "_blank");
                            }}
                            className="px-3 py-1 rounded bg-white border text-sm flex items-center gap-1"
                          >
                             <Database className="w-3 h-3" /> Download Dataset
                          </button>
                        )}
                        <details className="mt-2 text-sm text-left text-gray-600">
                          <summary className="cursor-pointer">
                            View Technical Details
                          </summary>
                          <div className="mt-2 text-xs text-gray-500 space-y-1">
                            <div>Artifact: {variant.artifact_name || "—"}</div>
                            <div>Model ID: {variant.model_id}</div>
                            <div>
                              Parent:{" "}
                              {variant.parent_model_id ||
                                variant.parent_id ||
                                baseModel?.model_id ||
                                "—"}
                            </div>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-[11px] overflow-auto">
                              {JSON.stringify(
                                {
                                  mitigation_strategy:
                                    variant.mitigation_strategy,
                                  optimization_method:
                                    variant.optimization_method,
                                  hyperparameters: variant.hyperparameters,
                                },
                                null,
                                2,
                              )}
                            </pre>
                          </div>
                        </details>
                      </div>
                    </div>
                  </div>

                  {/* Optimized children (if any) */}
                  {byParent[variant.model_id] &&
                    byParent[variant.model_id].length > 0 && (
                      <div className="mt-4 pl-6 border-l border-gray-100">
                        {byParent[variant.model_id].map((opt: any) => (
                          <div
                            key={opt.model_id}
                            className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                          >
                            <div>
                              <div className="text-sm font-medium">
                                {opt.model_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {opt.optimization_method || "Optimized Variant"}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-right">
                              <div className="text-sm font-semibold">
                                Acc {getMetric(opt, "accuracy").toFixed(3)}
                              </div>
                              <div className="text-sm font-semibold">
                                Fair {getMetric(opt, "fairness_score").toFixed(3)}
                              </div>
                              <button
                                onClick={() => onDownload(opt)}
                                className="px-2 py-1 bg-gray-50 rounded border text-xs hover:bg-gray-100"
                              >
                                Download
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              ))}
          </div>
        </div>
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
                value={getMetric(model, "fairness_score")}
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
                value={getMetric(model, "accuracy")}
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
                left: `${Math.min(100, Math.max(0, getMetric(model, "fairness_score") * 100))}%`,
                bottom: `${Math.min(100, Math.max(0, getMetric(model, "accuracy") * 100))}%`,
              }}
              title={`${model.model_name}: Acc ${getMetric(model, "accuracy").toFixed(3)}, Fair ${getMetric(model, "fairness_score").toFixed(3)}`}
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

export const ReportPreviewModal = ({ report, onClose }: any) => {
  if (!report) return null;

  const apiBase = api.defaults.baseURL || "http://localhost:8000";
  const resolveUrl = (url: string) =>
    url.startsWith("http")
      ? url
      : `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`;

  const payload = report.report_payload || {};
  const chartData = payload.chart_data || {};
  const labels = chartData.labels || [];
  const models = payload.comparison_models || [];
  const scatterPoints = chartData.scatter || [];

  const barData = {
    labels,
    datasets: (chartData.datasets || []).map((dataset: any, index: number) => ({
      label: dataset.label,
      data: dataset.data,
      backgroundColor: ["#2563EB", "#059669", "#7C3AED"][index] || "#EA580C",
      borderRadius: 8,
    })),
  };

  const scatterData = {
    datasets: [
      {
        label: "Model trade-off",
        data: scatterPoints.map((point: any) => ({ x: point.x, y: point.y })),
        backgroundColor: scatterPoints.map((point: any) => {
          if (point.source_type === "original") return "#6B7280";
          if (point.source_type === "mitigated") return "#2563EB";
          if (point.source_type === "optimized") return "#7C3AED";
          return "#EA580C";
        }),
        pointRadius: 7,
      },
    ],
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 p-4 overflow-y-auto flex items-center justify-center">
      <div className="max-w-6xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-300">
        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-orange-500 font-bold">
              Fairness Report
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {report.title}
            </h3>
            <p className="text-sm text-gray-500 mt-2 max-w-3xl leading-relaxed">
              {report.summary}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="border rounded-2xl p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-800">Model Comparison</h4>
                <span className="text-xs text-gray-500">Chart.js preview</span>
              </div>
              <div className="h-80">
                <Bar
                  data={barData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "bottom" },
                    },
                    scales: {
                      y: { beginAtZero: true, max: 1 },
                    },
                  }}
                />
              </div>
            </div>

            <div className="border rounded-2xl p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-800">
                  Accuracy vs Fairness
                </h4>
                <span className="text-xs text-gray-500">Chart.js Scatter preview</span>
              </div>
              <div className="h-80">
                <Scatter
                  data={scatterData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      x: { beginAtZero: true, max: 1, title: { display: true, text: 'Fairness' } },
                      y: { beginAtZero: true, max: 1, title: { display: true, text: 'Accuracy' } },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border rounded-2xl p-4 bg-white">
              <h4 className="font-bold text-gray-800 mb-3">Section Status</h4>
              <div className="space-y-3 text-sm">
                {Object.entries(report.section_flags || {}).map(
                  ([key, enabled]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="capitalize text-gray-600 font-semibold">{key.replace('_', ' ')}</span>
                      <span
                        className={`font-phase px-2 py-0.5 rounded-full scale-75 origin-right ${enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                        style={{ fontSize: '14px', lineHeight: '20px' }}
                      >
                        {enabled ? "INCLUDED" : "SKIPPED"}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="border rounded-2xl p-4 bg-white">
              <h4 className="font-bold text-gray-800 mb-3">Interpretation</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {payload.interpretation?.summary ||
                  "No interpretation available."}
              </p>
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="text-[11px] uppercase text-gray-500 font-bold">
                    Accuracy Change
                  </div>
                  <div className="font-semibold text-gray-800 mt-1">
                    {typeof payload.interpretation?.accuracy_change === "number"
                      ? `${(payload.interpretation.accuracy_change * 100).toFixed(1)}%`
                      : "—"}
                  </div>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="text-[11px] uppercase text-gray-500 font-bold">
                    Fairness Change
                  </div>
                  <div className="font-semibold text-gray-800 mt-1">
                    {typeof payload.interpretation?.fairness_change === "number"
                      ? `${(payload.interpretation.fairness_change * 100).toFixed(1)}%`
                      : "—"}
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-2xl p-4 bg-white">
              <h4 className="font-bold text-gray-800 mb-3">Actions</h4>
              <div className="space-y-3">
                <button
                  onClick={() =>
                    window.open(resolveUrl(report.pdf_download_url), "_blank")
                  }
                  className="w-full py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors shadow-sm"
                >
                  Download PDF Report
                </button>
              </div>
            </div>

            <div className="border rounded-2xl p-4 bg-gray-50">
              <h4 className="font-bold text-gray-800 mb-3">Top Models</h4>
              <div className="space-y-3 max-h-72 overflow-auto pr-1 scrollbar-thin">
                {models.slice(0, 5).map((model: any) => (
                  <div
                    key={model.model_id}
                    className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-sm text-gray-800 truncate">
                        {model.model_name}
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${modelBadge(model.source_type)}`}>
                        {model.source_type}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-2 grid grid-cols-3 gap-2 border-t pt-2">
                      <div className="flex flex-col"><span>ACC</span><span className="font-bold text-gray-700">{Number(model.accuracy || 0).toFixed(3)}</span></div>
                      <div className="flex flex-col"><span>FAIR</span><span className="font-bold text-gray-700">{Number(model.fairness_score || 0).toFixed(3)}</span></div>
                      <div className="flex flex-col"><span>COMB</span><span className="font-bold text-gray-700">{Number(model.combined_score || 0).toFixed(3)}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DownloadModal = ({ model, onConfirm, onClose }: any) => {
  if (!model) return null;
  const [downloadFormat, setDownloadFormat] = useState<"joblib" | "pkl">("pkl");

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

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
            {Object.entries(summary).map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between items-center gap-4"
              >
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {label.replace(/_/g, " ")}
                </span>
                <span className="text-xs font-bold text-gray-800 text-right truncate max-w-[200px]">
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
            <h5 className="text-[10px] font-bold text-orange-800 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Brain className="w-3 h-3" /> Recommendation
            </h5>
            <p className="text-[10px] text-orange-700 leading-relaxed">
              Confirm the artifact metadata before promoting the model to
              production use.
            </p>
          </div>

          <div className="p-4 border border-gray-200 bg-white rounded-xl">
            <h5 className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">
              Download Format
            </h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setDownloadFormat("joblib")}
                className={`px-3 py-2 rounded border font-semibold transition-all ${downloadFormat === "joblib" ? "bg-orange-50 border-orange-300 text-orange-700 shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                joblib
              </button>
              <button
                onClick={() => setDownloadFormat("pkl")}
                className={`px-3 py-2 rounded border font-semibold transition-all ${downloadFormat === "pkl" ? "bg-orange-50 border-orange-300 text-orange-700 shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                pkl
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-2">
              Both options download the same serialized model with the chosen
              extension.
            </p>
          </div>
        </div>

        <div className="p-6 bg-gray-50 rounded-b-2xl flex gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(model, downloadFormat);
              onClose();
            }}
            className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-orange-200"
          >
            <Download className="w-4 h-4" /> Download
          </button>
        </div>
      </div>
    </div>
  );
};
