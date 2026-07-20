"use client";

import React, { useState } from "react";
import { useWorkspace } from "../WorkspaceContext";
import { useRouter } from "next/navigation";
import { 
  Settings, 
  BarChart3, 
  CheckCircle, 
  Download, 
  Save,
  Play
} from "lucide-react";
import ProcessingLoader from "@/app/component/ProcessingLoader";
import { MetricRow } from "../components/SharedComponents";
import { DownloadModal } from "../components/ComparisonComponents";

export default function OptimizePage() {
  const router = useRouter();
  const {
    uploadId,
    processingStep,
    processingPhase,
    optMethod,
    setOptMethod,
    optTrials,
    setOptTrials,
    optCV,
    setOptCV,
    optAccuracyWeight,
    setOptAccuracyWeight,
    optFairnessWeight,
    setOptFairnessWeight,
    optTimeout,
    setOptTimeout,
    applyOptimization,
    optimizationResults,
    fetchComparison,
    downloadModelMetadata,
    setDownloadModelMetadata,
    confirmDownload
  } = useWorkspace();

  const [activeResponseTab, setActiveResponseTab] = useState("body");

  // FULL SCREEN LOADER
  if (processingStep) {
    return <ProcessingLoader step={processingStep} phase={processingPhase} />;
  }

  const renderConfig = () => {
    if (!uploadId) {
        return (
          <div className="p-12 text-center text-gray-500">
            Complete the mitigation phase to enable fairness-aware optimization.
          </div>
        );
      }

    return (
      <div className="max-w-4xl space-y-6">
        <div className="border-b pb-4">
          <h3 className="font-phase flex items-center gap-2">
            <Settings className="w-5 h-5" /> Fairness-Aware Optimization
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Optimize your mitigated model to restore accuracy while preserving fairness gains.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700">Optimization Method</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-all ${optMethod === "gridsearch" ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500" : "hover:bg-gray-50 bg-white"}`}
              onClick={() => setOptMethod("gridsearch")}
            >
              <div className="font-bold text-gray-800">GridSearch</div>
              <div className="text-xs text-gray-600 mt-1">
                Exhaustive deterministic search. Best for smaller parameter spaces and strict reproducibility.
              </div>
            </div>
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-all ${optMethod === "optuna" ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500" : "hover:bg-gray-50 bg-white"}`}
              onClick={() => setOptMethod("optuna")}
            >
              <div className="font-bold text-gray-800 flex items-center gap-2">
                Optuna <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded uppercase font-bold">Recommended</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Adaptive intelligent search. Best for large spaces, scales efficiently.
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Cross-Validation Folds</label>
            <input
              type="number"
              min="2"
              max="10"
              value={optCV}
              onChange={(e) => setOptCV(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {optMethod === "optuna" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Number of Trials</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={optTrials}
                  onChange={(e) => setOptTrials(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Timeout (seconds)</label>
                <input
                  type="number"
                  min="60"
                  max="3600"
                  value={optTimeout}
                  onChange={(e) => setOptTimeout(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </>
          )}

          <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-200 mt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Objective Weights (Total: 1.0)</label>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <label className="text-xs text-gray-500 mb-1 block">Accuracy Weight</label>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="text-xs text-gray-500 mb-1 block">Fairness Weight</label>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-6 border-t mt-8">
          <button
            onClick={applyOptimization}
            className="px-6 py-2 bg-indigo-600 text-white rounded font-semibold hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <Play className="w-4 h-4" /> Run {optMethod === "optuna" ? "Adaptive" : "GridSearch"} Optimization
          </button>
        </div>
      </div>
    );
  };

  const renderResponseBody = () => {
    if (!optimizationResults) return null;

    return (
      <div className="space-y-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5">
          <h3 className="text-lg font-bold text-indigo-800 mb-2 flex items-center gap-2">
            <Settings className="w-5 h-5" /> Optimization Complete
          </h3>
          <p className="text-sm text-indigo-700">
            Successfully optimized the mitigated model using {optimizationResults.optimization_method || "Adaptive Search"}.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Optimization Results</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-sm pt-2">
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg shadow-sm">
              <div className="font-bold text-gray-500 mb-4 text-xs uppercase tracking-widest">Before Optimization</div>
              <div className="grid grid-cols-2 gap-4">
                <MetricRow name="Accuracy" value={optimizationResults.baseline_model?.performance?.accuracy} />
                <MetricRow name="Fairness Score" value={optimizationResults.baseline_model?.fairness?.aggregate?.fairness_score} />
                <MetricRow name="DPD" value={optimizationResults.baseline_model?.fairness?.aggregate?.dpd} />
                <MetricRow name="EOD" value={optimizationResults.baseline_model?.fairness?.aggregate?.eod} />
              </div>
            </div>

            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg shadow-sm">
              <div className="font-bold text-indigo-600 mb-4 text-xs uppercase tracking-widest">After Optimization</div>
              <div className="grid grid-cols-2 gap-4">
                <MetricRow name="Accuracy" value={optimizationResults.optimized_model?.performance?.accuracy} baselineValue={optimizationResults.baseline_model?.performance?.accuracy} />
                <MetricRow name="Fairness Score" value={optimizationResults.optimized_model?.fairness?.aggregate?.fairness_score} baselineValue={optimizationResults.baseline_model?.fairness?.aggregate?.fairness_score} />
                <MetricRow name="DPD" value={optimizationResults.optimized_model?.fairness?.aggregate?.dpd} baselineValue={optimizationResults.baseline_model?.fairness?.aggregate?.dpd} />
                <MetricRow name="EOD" value={optimizationResults.optimized_model?.fairness?.aggregate?.eod} baselineValue={optimizationResults.baseline_model?.fairness?.aggregate?.eod} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6">
          <div className="flex gap-3">
            <button
              onClick={() => setDownloadModelMetadata({
                model_id: optimizationResults.optimization_id,
                model_name: "Optimized Model",
                source_type: "optimized",
                accuracy: optimizationResults.optimized_model?.performance?.accuracy,
                fairness_score: optimizationResults.optimized_model?.fairness?.aggregate?.fairness_score,
                download_url: `/api/optimize/download/${optimizationResults.optimization_id}`
              })}
              className="px-4 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-50 flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Download className="w-4 h-4" /> Download Optimized Model
            </button>
            <button
              onClick={async () => {
                await fetchComparison();
                router.push("/Workspace/compare");
              }}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <BarChart3 className="w-4 h-4" /> Compare All Models
            </button>
          </div>
          <button
            onClick={() => alert("Model promoted to Model Registry and Production-ready staging.")}
            className="font-phase px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-md transition-all active:scale-95"
            style={{ fontSize: '18px' }}
          >
            <CheckCircle className="w-6 h-6" /> Approve for Production
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

      {optimizationResults && (
        <div className="mt-8 border-t-4 border-gray-200 bg-gray-50 animate-in fade-in duration-700">
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold">Response</span>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded font-medium bg-green-100 text-green-700">200 OK</span>
                <span className="text-xs text-gray-500">4.5s</span>
                <span className="text-xs text-gray-500">6.2 KB</span>
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