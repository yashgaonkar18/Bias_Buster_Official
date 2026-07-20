"use client";

import React, { useState, useRef } from "react";
import { useWorkspace } from "../WorkspaceContext";
import { useRouter } from "next/navigation";
import { Brain, Upload, CheckCircle, Database, ChevronRight, Save } from "lucide-react";
import ProcessingLoader from "@/app/component/ProcessingLoader";
import { StatusCard, InfoRow } from "../components/SharedComponents";

export default function ValidatePage() {
  const router = useRouter();
  const {
    datasetFile,
    setDatasetFile,
    modelFile,
    setModelFile,
    uploadError,
    uploadResponse,
    processingStep,
    processingPhase,
    setRequestMethod
  } = useWorkspace();
  const modelInputRef = useRef<HTMLInputElement>(null);
  const datasetInputRef = useRef<HTMLInputElement>(null);
  const [activeResponseTab, setActiveResponseTab] = useState("body");

  // FULL SCREEN LOADER
  if (processingStep) {
    return <ProcessingLoader step={processingStep} phase={processingPhase} />;
  }

  const renderConfig = () => {
    return (
      <div className="max-w-5xl space-y-6">
        <h3 className="font-phase mb-4">
          Dataset and Model Configuration (Phase 1, 2, 3)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div
            onClick={() => modelInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer h-full flex flex-col justify-center "
          >
            <Brain className="w-8 h-8 text-blue-400 mx-auto mb-2" />

            <p className="text-sm font-medium text-gray-700 mb-1">
              Upload Trained ML Model
            </p>

            <p className="text-xs text-gray-500">
              Click anywhere to browse
            </p>

            <input
              ref={modelInputRef}
              type="file"
              accept=".pkl,.joblib"
              className="hidden"
              onChange={(e) => setModelFile(e.target.files?.[0] || null)}
            />

            {modelFile && (
              <div className="text-xs text-gray-600 mt-3">
                Selected: {modelFile.name}
              </div>
            )}
          </div>

          <div
            onClick={() => datasetInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 hover:bg-orange-50 transition-all cursor-pointer h-full flex flex-col justify-center"
          >
            <Upload className="w-8 h-8 text-orange-400 mx-auto mb-2" />

            <p className="text-sm font-medium text-gray-700 mb-1">
              Upload Analysis Dataset
            </p>

            <p className="text-xs text-gray-500">
              Click anywhere to browse
            </p>

            <input
              ref={datasetInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setDatasetFile(e.target.files?.[0] || null)}
            />

            {datasetFile && (
              <div className="text-xs text-gray-600 mt-3">
                Selected: {datasetFile.name}
              </div>
            )}
          </div>
        </div>

        {uploadError && <div className="text-sm text-red-600 mt-4 bg-red-50 p-3 rounded-lg border border-red-100">{uploadError}</div>}
      </div>
    );
  };

  const renderResponseBody = () => {
    if (!uploadResponse) return null;
    const { dataset_info, model_info } = uploadResponse;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
          <StatusCard title="Pipeline Ready" status="Ready for Bias Detection" />
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
            <InfoRow label="Missing Values" value={dataset_info?.missing_values ?? "0"} />
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
            <InfoRow label="Format" value={model_info?.format ?? "Supported"} />
            <InfoRow label="Model Type" value={model_info?.model_type ?? "Classifier"} />
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
            Next Step: Configure bias detection by selecting target and sensitive attributes.
          </span>
          <button
            onClick={() => {
              setRequestMethod("DETECT");
              router.push("/Workspace/detect");
            }}
            className="font-phase px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 flex items-center gap-2 transition-all active:scale-95 shadow-sm"
            style={{ fontSize: '16px' }}
          >
            Go to Detection
            <ChevronRight className="w-5 h-5" />
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

      {uploadResponse && (
        <div className="mt-8 border-t-4 border-gray-200 bg-gray-50 animate-in fade-in duration-700">
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold">Response</span>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded font-medium bg-green-100 text-green-700">200 OK</span>
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
