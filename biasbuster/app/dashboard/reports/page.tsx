"use client";

import React, { useState } from "react";
import { useWorkspace } from "../WorkspaceContext";
import { BarChart3, Save } from "lucide-react";
import ProcessingLoader from "@/app/component/ProcessingLoader";
import { ComparisonDashboard, DownloadModal, ReportPreviewModal } from "../components/ComparisonComponents";

export default function ReportsPage() {
  const {
    processingStep,
    processingPhase,
    mitigationResults,
    comparisonData,
    fetchComparison,
    downloadModelMetadata,
    setDownloadModelMetadata,
    confirmDownload,
    generateComparisonReport,
    generatedReport,
    setGeneratedReport,
    reportBusy
  } = useWorkspace();

  const [activeResponseTab, setActiveResponseTab] = useState("body");

  if (processingStep) {
    return <ProcessingLoader step={processingStep} phase={processingPhase} />;
  }

  if (!mitigationResults && !comparisonData) {
    return (
      <div className="p-12 text-center text-gray-500">
        Complete the mitigation or optimization phase to compare model variants.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4 border-b pb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Model Variant Comparison</h1>
            <p className="text-sm text-gray-500">Benchmark accuracy and fairness across all model versions.</p>
          </div>
          <button
            onClick={fetchComparison}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-50 flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer text-xs"
          >
            <BarChart3 className="w-4 h-4 text-orange-500" /> Refresh Registry
          </button>
        </div>
      </div>

      <div className="mt-4 border-t-4 border-gray-200 bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-800">Response</span>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded font-medium bg-green-100 text-green-700">200 OK</span>
              <span className="text-xs text-gray-500">2.84s</span>
              <span className="text-xs text-gray-500">12.5 KB</span>
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

        <div className="p-6 bg-white min-h-[600px]">
          {activeResponseTab === "body" && (
            comparisonData ? (
              <ComparisonDashboard 
                data={comparisonData} 
                onDownload={(model) => setDownloadModelMetadata(model)} 
                onGenerateReport={generateComparisonReport}
                reportBusy={reportBusy}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-gray-50 border-gray-200">
                <BarChart3 className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4 text-sm">Registry data not yet fetched for this workspace.</p>
                <button
                  onClick={fetchComparison}
                  className="px-6 py-2 bg-orange-500 text-white rounded font-bold hover:bg-orange-600 shadow transition-all active:scale-95 cursor-pointer text-xs"
                >
                  Fetch Comparison Dashboard
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {downloadModelMetadata && (
        <DownloadModal 
          model={downloadModelMetadata} 
          onConfirm={confirmDownload} 
          onClose={() => setDownloadModelMetadata(null)} 
        />
      )}

      {generatedReport && (
        <ReportPreviewModal 
          report={generatedReport} 
          onClose={() => setGeneratedReport(null)} 
        />
      )}
    </div>
  );
}
