"use client";

import React, { useState, useEffect } from "react";
import { useWorkspace } from "../WorkspaceContext";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Brain, 
  BarChart3, 
  Database, 
  CheckCircle, 
  ChevronRight, 
  Save, 
  Download,
  Settings
} from "lucide-react";
import ProcessingLoader from "@/app/component/ProcessingLoader";
import { InfoRow, MetricRow } from "../components/SharedComponents";
import { DownloadModal } from "../components/ComparisonComponents";

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

export default function MitigationPage() {
  const router = useRouter();
  const {
    uploadId,
    processingStep,
    processingPhase,
    recommendationResult,
    fetchRecommendation,
    selectedStrategy,
    setSelectedStrategy,
    applyMitigation,
    mitigationResults,
    optimizationResults,
    setRequestMethod,
    fetchComparison,
    downloadModelMetadata,
    setDownloadModelMetadata,
    confirmDownload
  } = useWorkspace();

  const [activeResponseTab, setActiveResponseTab] = useState("body");
  const [isExperimentMode, setIsExperimentMode] = useState(false);

  // Fetch recommendation if missing but uploadId exists
  useEffect(() => {
    if (uploadId && !recommendationResult && !mitigationResults) {
      fetchRecommendation();
    }
  }, [uploadId, recommendationResult, mitigationResults, fetchRecommendation]);

  // FULL SCREEN LOADER
  if (processingStep) {
    return <ProcessingLoader step={processingStep} phase={processingPhase} />;
  }

  if (!recommendationResult && !mitigationResults) {
    return (
      <div className="p-12 text-center text-gray-500">
        Run bias detection first to see mitigation recommendations.
      </div>
    );
  }

  const renderConfig = () => {
    if (mitigationResults) return null;
    if (!recommendationResult) return null;

    const { computed_metrics, dataset_analysis, recommendation } = recommendationResult;

    return (
      <div className="max-w-5xl space-y-8 animate-in fade-in duration-500">
        <div className="border-b pb-4">
          <h3 className="font-phase text-gray-800 text-lg">Strategy Recommendation</h3>
          <p className="text-sm text-gray-600">Fairness-aware guidance for your mitigation pipeline.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg bg-white p-4">
            <h4 className="font-semibold mb-3 text-sm flex items-center gap-2 text-gray-700">
              <BarChart3 className="w-4 h-4 text-orange-500" /> Fairness Metrics Summary
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <MetricRow name="DPD" value={computed_metrics?.dpd} />
              <MetricRow name="EOD" value={computed_metrics?.eod} />
              <MetricRow name="DI" value={computed_metrics?.di} />
              <MetricRow name="Fairness Score" value={computed_metrics?.fairness_score} />
            </div>
          </div>

          <div className="border rounded-lg bg-white p-4">
            <h4 className="font-semibold mb-3 text-sm flex items-center gap-2 text-gray-700">
              <Database className="w-4 h-4 text-blue-500" /> Dataset Analysis
            </h4>
            <div className="space-y-3">
              <InfoRow label="Prediction Skew" value={dataset_analysis?.prediction_skew} />
              <InfoRow label="Dataset Size" value={dataset_analysis?.dataset_size} />
              <InfoRow label="Imbalance Ratio" value={dataset_analysis?.imbalance_ratio} />
              <InfoRow label="Sensitive Attributes" value={dataset_analysis?.sensitive_attribute_count} />
            </div>
          </div>
        </div>

        <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
            Recommended Strategy
          </div>
          <h4 className="text-lg font-bold text-blue-900 mb-2 capitalize flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" /> {recommendation?.recommended_strategy}
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
            <h5 className="font-semibold text-sm mb-3 text-blue-900">Validated Improvements</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-xs text-gray-500">DPD Reduction</div>
                <div className="font-bold text-green-600">
                  {recommendation?.validated_improvements?.dpd_reduction !== undefined
                    ? `+${(recommendation?.validated_improvements?.dpd_reduction * 100).toFixed(2)}%`
                    : "-"}
                </div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-xs text-gray-500">EOD Reduction</div>
                <div className="font-bold text-green-600">
                  {recommendation?.validated_improvements?.eod_reduction !== undefined
                    ? `+${(recommendation?.validated_improvements?.eod_reduction * 100).toFixed(2)}%`
                    : "-"}
                </div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="text-xs text-gray-500">Accuracy Impact</div>
                <div className="font-bold text-orange-600">
                  {recommendation?.validated_improvements?.accuracy_tradeoff !== undefined
                    ? `${(recommendation?.validated_improvements?.accuracy_tradeoff * 100).toFixed(2)}%`
                    : "-"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isExperimentMode ? (
          <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-300 rounded-lg bg-gray-50 mt-6">
            <h4 className="font-phase text-gray-700 text-base mb-2">Want to explore alternative mitigations?</h4>
            <p className="text-sm text-gray-500 mb-4 text-center">
              Run a deep comparative analysis to rank and evaluate all available fairness strategies against your dataset.
            </p>
            <button
              onClick={() => setIsExperimentMode(true)}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-100 flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer text-xs"
            >
              <Settings className="w-4 h-4 text-gray-500" /> Experiment with Other Strategies
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-6 animate-in fade-in duration-300">
            <h4 className="font-phase mb-4 flex items-center gap-2 text-gray-700">
              <Settings className="w-5 h-5 text-indigo-500" /> Ranked Strategies (Experiment Mode)
            </h4>
            {recommendation?.strategy_rankings?.map((strat: any) => (
              <div
                key={strat.strategy}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedStrategy === strat.strategy
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500"
                    : "hover:border-blue-300 bg-white border-gray-200"
                }`}
                onClick={() => setSelectedStrategy(strat.strategy)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold capitalize flex items-center gap-2">
                    {strat.recommended && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-semibold">Recommended</span>}
                    <span className="text-gray-400 font-mono">#{strat.rank}</span> {strat.strategy}
                  </div>
                  <div className="text-sm font-semibold text-gray-600">Score: {strat.combined_score.toFixed(3)}</div>
                </div>
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">{strat.tradeoff_analysis}</p>
                <div className="flex gap-4 text-xs mt-3 pt-3 border-t border-gray-100">
                  <div><span className="text-gray-500">Fairness Gain:</span> <span className="font-semibold text-green-600">+{strat.fairness_improvement.toFixed(4)}</span></div>
                  <div><span className="text-gray-500">Accuracy Drop:</span> <span className="font-semibold text-orange-600">{(strat.accuracy_drop * 100).toFixed(2)}%</span></div>
                  <div><span className="text-gray-500">Stability:</span> <span className="font-semibold text-gray-700">{(strat.stability_score * 100).toFixed(1)}%</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 pt-6 border-t mt-8">
          <button
            onClick={() => applyMitigation(recommendation?.recommended_strategy)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 shadow transition-all active:scale-95 cursor-pointer font-bold text-sm"
          >
            <CheckCircle className="w-4 h-4" /> Apply Recommended Strategy
          </button>
          {isExperimentMode && (
            <button
              onClick={() => applyMitigation(selectedStrategy)}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 shadow transition-all active:scale-95 cursor-pointer text-sm"
            >
              Apply Selected Strategy
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderResponseBody = () => {
    if (!mitigationResults) return null;
    
    if (mitigationResults.status !== "success" && mitigationResults.status !== undefined) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5">
          <h3 className="text-lg font-bold text-red-800 mb-2">Mitigation Failed</h3>
          <p className="text-sm text-red-700">{mitigationResults.diagnostic_details || mitigationResults.detail || "An unknown error occurred."}</p>
        </div>
      );
    }

    const getMetric = (obj: any, key: string) => {
        if (!obj) return undefined;
        return obj[key] ?? obj.performance?.[key] ?? obj.fairness?.[key] ?? obj.fairness?.aggregate?.[key];
    };

    const before = mitigationResults.metrics_before || mitigationResults.baseline_model || {};
    const after = mitigationResults.metrics_after || mitigationResults.mitigated_model || {};

    return (
      <div className="space-y-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <h3 className="text-lg font-bold text-green-800 mb-2 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" /> Mitigation Pipeline Successful
          </h3>
          <p className="text-sm text-green-700 mb-4">{mitigationResults.tradeoff_analysis || "The model has been successfully mitigated."}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4">
            <InfoRow label="Strategy Applied" value={mitigationResults.strategy_applied?.toUpperCase() || "N/A"} />
            <InfoRow label="Fairness Gain" value={`+${((mitigationResults.fairness_improvement?.fairness_score_gain || 0) * 100).toFixed(1)}%`} />
            <InfoRow label="Accuracy Impact" value={`${((mitigationResults.performance_impact?.accuracy_change || 0) * 100).toFixed(1)}%`} />
          </div>
        </div>

        <div>
          <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Before &amp; After Analysis</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-sm pt-2">
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg shadow-sm">
              <div className="font-bold text-gray-500 mb-4 text-xs uppercase tracking-widest flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Baseline Model
              </div>
              <div className="grid grid-cols-2 gap-4">
                <MetricRow name="Accuracy" value={getMetric(before, "accuracy")} />
                <MetricRow name="Fairness Score" value={getMetric(before, "fairness_score")} />
                <MetricRow name="DPD" value={getMetric(before, "dpd")} />
                <MetricRow name="EOD" value={getMetric(before, "eod")} />
              </div>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg shadow-sm">
              <div className="font-bold text-orange-600 mb-4 text-xs uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Mitigated Model
              </div>
              <div className="grid grid-cols-2 gap-4">
                <MetricRow name="Accuracy" value={getMetric(after, "accuracy")} baselineValue={getMetric(before, "accuracy")} />
                <MetricRow name="Fairness Score" value={getMetric(after, "fairness_score")} baselineValue={getMetric(before, "fairness_score")} />
                <MetricRow name="DPD" value={getMetric(after, "dpd")} baselineValue={getMetric(before, "dpd")} />
                <MetricRow name="EOD" value={getMetric(after, "eod")} baselineValue={getMetric(before, "eod")} />
              </div>

              <div className="mt-4 pt-4 border-t border-orange-100 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Quick Comparison Preview</div>
                  <button 
                    onClick={async () => {
                      await fetchComparison();
                      router.push("/dashboard/reports");
                    }} 
                    className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 cursor-pointer"
                  >
                    Compare Models <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Original", source: "original", accuracy: getMetric(before, "accuracy"), fairness: getMetric(before, "fairness_score") },
                        { label: "Mitigated", source: "mitigated", accuracy: getMetric(after, "accuracy"), fairness: getMetric(after, "fairness_score") },
                        ...(optimizationResults ? [{ label: "Optimized", source: "optimized", accuracy: optimizationResults.optimized_model?.performance?.accuracy, fairness: optimizationResults.optimized_model?.fairness?.aggregate?.fairness_score }] : [])
                    ].map(item => (
                        <div key={item.label} className="rounded-lg border border-orange-100 bg-white/80 p-3">
                            <div className="text-[10px] font-bold text-gray-500 mb-1">{item.label}</div>
                            <div className="text-[11px] font-semibold text-gray-700">Acc: {typeof item.accuracy === "number" ? item.accuracy.toFixed(3) : "-"}</div>
                            <div className="text-[11px] font-semibold text-gray-700">Fair: {typeof item.fairness === "number" ? item.fairness.toFixed(3) : "-"}</div>
                        </div>
                    ))}
                </div>
                <ComparisonBar label="Fairness Gain vs Baseline" value={mitigationResults.fairness_improvement?.fairness_score_gain || 0} max={0.5} color="bg-green-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex gap-3">
            <button
              onClick={() => setDownloadModelMetadata({
                model_id: mitigationResults.mitigation_id || mitigationResults.correction_id,
                model_name: "Mitigated Model",
                source_type: "mitigated",
                accuracy: getMetric(after, "accuracy"),
                fairness_score: getMetric(after, "fairness_score"),
                download_url: mitigationResults.correction_id 
                  ? `/api/correction/download-model/${mitigationResults.correction_id}`
                  : undefined,
                dataset_download_url: mitigationResults.correction_id
                  ? `/api/correction/download-dataset/${mitigationResults.correction_id}`
                  : undefined
              })}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4 text-gray-500" /> Download Mitigated Model
            </button>
            <button
              onClick={async () => {
                await fetchComparison();
                router.push("/dashboard/reports");
              }}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-gray-500" /> View Comparison Dashboard
            </button>
          </div>
          <button
            onClick={() => {
                setRequestMethod("OPTIMIZE");
                router.push("/dashboard/optimization");
            }}
            className="font-phase px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 shadow transition-all active:scale-95 cursor-pointer"
            style={{ fontSize: "14px" }}
          >
            <Settings className="w-4 h-4" /> Proceed to Optimization
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="p-6">
        {renderConfig()}
      </div>

      {mitigationResults && (
        <div className="mt-8 border-t-4 border-gray-200 bg-gray-50 animate-in fade-in duration-700">
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-800">Response</span>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded font-medium bg-green-100 text-green-700">200 OK</span>
                <span className="text-xs text-gray-500">1.84s</span>
                <span className="text-xs text-gray-500">4.2 KB</span>
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
                className={`px-1 py-3 text-sm font-medium ${activeResponseTab === "body"
                  ? "text-orange-600 border-b-2 border-orange-500"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Body
              </button>
            </div>
          </div>

          <div className="p-6 bg-white min-h-[400px]">
            {activeResponseTab === "body" && renderResponseBody()}
          </div>
        </div>
      )}

      {downloadModelMetadata && (
        <DownloadModal 
          model={downloadModelMetadata} 
          onConfirm={confirmDownload} 
          onClose={() => setDownloadModelMetadata(null)} 
        />
      )}
    </div>
  );
}
