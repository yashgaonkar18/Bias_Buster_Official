"use client";

import React, { useState } from "react";
import { useWorkspace } from "../WorkspaceContext";
import { useRouter } from "next/navigation";
import { ChevronRight, Save, CheckCircle } from "lucide-react";
import ProcessingLoader from "@/app/component/ProcessingLoader";
import { BiasSummary, AttributeBiasCard } from "../components/SharedComponents";

export default function DetectPage() {
  const router = useRouter();
  const {
    uploadId,
    columns,
    selectedSensitive,
    setSelectedSensitive,
    selectedTarget,
    setSelectedTarget,
    runBiasDetection,
    biasResults,
    processingStep,
    processingPhase,
    setRequestMethod,
    fetchRecommendation
  } = useWorkspace();

  const [activeResponseTab, setActiveResponseTab] = useState("body");

  // FULL SCREEN LOADER
  if (processingStep) {
    return <ProcessingLoader step={processingStep} phase={processingPhase} />;
  }

  if (!uploadId) {
    return (
      <div className="p-12 text-center text-gray-500">
        Please upload a dataset and model in the Validate phase first.
      </div>
    );
  }

  const renderConfig = () => {
    return (
      <div className="max-w-4xl space-y-6">
        <h3 className="font-phase">Bias Detection Configuration</h3>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Target Column</label>
          <select
            value={selectedTarget ?? ""}
            onChange={(e) => setSelectedTarget(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 bg-white"
          >
            <option value="">Select target column...</option>
            {columns.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Sensitive Attributes</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {columns.map((col) => (
              <label
                key={col}
                className={`flex items-center gap-2 text-sm border rounded px-3 py-2 cursor-pointer transition-all ${selectedSensitive.includes(col) ? "bg-orange-50 border-orange-500" : "hover:bg-gray-50"
                  }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSensitive.includes(col)}
                  disabled={!selectedSensitive.includes(col) && selectedSensitive.length >= 2}
                  onChange={(e) => {
                    if (e.target.checked) {
                      if (selectedSensitive.length < 2) setSelectedSensitive([...selectedSensitive, col]);
                    } else {
                      setSelectedSensitive(selectedSensitive.filter((c) => c !== col));
                    }
                  }}
                  className="rounded text-orange-500 focus:ring-orange-500"
                />
                <span className="truncate">{col}</span>
              </label>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-2 italic">Select up to 2 sensitive attributes for analysis.</div>
        </div>
      </div>
    );
  };

  const renderResponseBody = () => {
    if (!biasResults) return null;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="p-4 border rounded-lg bg-gray-50 text-sm mb-4">
          <div className="font-semibold mb-2">Fairness Metric Guidelines</div>
          <ul className="space-y-1 text-gray-600">
            <li>DPD ≤ 0.1 → Fair</li>
            <li>EOD ≤ 0.1 → Fair</li>
            <li>DIR between 0.8 and 1.25 → Fair</li>
          </ul>
        </div>

        <BiasSummary report={biasResults} />

        {Object.entries(biasResults.sensitive_audit || {}).map(([attribute, data]: any) => (
          <AttributeBiasCard key={attribute} attribute={attribute} data={data} />
        ))}

        <div className={`p-4 rounded-lg border flex items-center justify-between gap-3 ${biasResults.bias_present ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"
          }`}
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-semibold">
              {biasResults.bias_present
                ? "Bias detected in the model predictions. Mitigation is required before deployment."
                : "No significant bias detected. Model is safe for deployment."}
            </span>
          </div>

          {biasResults.bias_present && (
            <button
              onClick={async () => {
                await fetchRecommendation();
                setRequestMethod("MITIGATE");
                router.push("/Workspace/mitigate");
              }}
              className="font-phase px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 flex items-center gap-2 shadow-sm transition-all active:scale-95"
              style={{ fontSize: '16px' }}
            >
              Go to Mitigation
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">


        </div>
        {renderConfig()}
      </div>

      {biasResults && (
        <div className="mt-8 border-t-4 border-gray-200 bg-gray-50 animate-in fade-in duration-700">
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold">Response</span>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded font-medium bg-green-100 text-green-700">200 OK</span>
                <span className="text-xs text-gray-500">2.1s</span>
                <span className="text-xs text-gray-500">8.4 KB</span>
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
    </div>
  );
}