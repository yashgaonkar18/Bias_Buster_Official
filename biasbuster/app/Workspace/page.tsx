"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Upload, Play, FileText, Database, Brain, CheckCircle, ChevronDown, Settings, BarChart3, Plus, Folder, Save, Clock, X, Search, MoreVertical, ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
const InfoRow = ({ label, value }: { label: string; value?: any }) => (
  <div>
    <div className="text-xs text-gray-500">{label}</div>
    <div className="font-medium text-gray-800">{value ?? "-"}</div>
  </div>
);

const ProcessingLoader = ({ step }: { step: string }) => {
  return (
    <div className="mb-6 p-6 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">

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

          <div className="text-xs text-blue-600 mt-1">
            {step}
          </div>
        </div>
      </div>

      {/* Progress Animation */}
      <div className="mt-4 w-full bg-blue-100 rounded-full h-2 overflow-hidden">
        <div className="h-full bg-blue-500 animate-pulse w-2/3"></div>
      </div>

    </div>
  );
};

const interpretMetric = (metric: string, value: number) => {
  if (metric === "DIR") {
    if (value >= 0.8 && value <= 1.25)
      return { label: "Fair", color: "text-green-600" };

    if ((value >= 0.6 && value < 0.8) || (value > 1.25 && value <= 1.4))
      return { label: "Moderate Bias", color: "text-yellow-600" };

    return { label: "Severe Bias", color: "text-red-600" };
  }

  if (metric === "DPD" || metric === "EOD") {
    const abs = Math.abs(value);

    if (abs <= 0.1)
      return { label: "Fair", color: "text-green-600" };

    if (abs <= 0.2)
      return { label: "Moderate Bias", color: "text-yellow-600" };

    return { label: "Severe Bias", color: "text-red-600" };
  }

  return { label: "Unknown", color: "text-gray-600" };
};

const MetricRow = ({ name, value }: any) => {
  const interpretation = interpretMetric(name, value);

  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <div className="text-xs text-gray-500">{name}</div>

      <div className="flex items-center justify-between mt-1">
        <span className="font-semibold text-gray-800">
          {value?.toFixed(3)}
        </span>

        <span className={`text-xs font-semibold ${interpretation.color}`}>
          {interpretation.label}
        </span>
      </div>
    </div>
  );
};

const BiasSummary = ({ report }: { report: any }) => (
  <div className={`border rounded-lg p-5 ${report.bias_present ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
    }`}>
    <h3 className="text-lg font-bold">
      {report.bias_present ? "Bias Detected" : "No Significant Bias"}
    </h3>

    <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
      <InfoRow label="Primary Driver" value={report.bias_driver ?? "—"} />
      <InfoRow label="Severity Score" value={`${report.bias_severity_score}/10`} />
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
          sr < 0.1 ? "Severely Disadvantaged" :
            sr < 0.2 ? "Moderate Bias" : "Fair";

        return (
          <tr key={group} className={impact !== "Fair" ? "bg-red-50" : ""}>
            <td className="px-3 py-2 font-medium">{group}</td>
            <td className="px-3 py-2 text-center">{sr.toFixed(3)}</td>
            <td className="px-3 py-2 text-center">
              {tpr?.[group]?.toFixed(3) ?? "—"}
            </td>
            <td className="px-3 py-2 text-center font-semibold">
              {impact}
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
);
const AttributeBiasCard = ({ attribute, data }: any) => {
  const severity =
    data.severity_score >= 8 ? "High" :
      data.severity_score >= 4 ? "Medium" : "Low";

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

  type Phase =
    | "UPLOAD"
    | "VALIDATED"
    | "ATTRIBUTES_SELECTED"
    | "BIAS_DETECTED";

  const [currentPhase, setCurrentPhase] = useState<Phase>("UPLOAD");



  const profileRef = useRef<HTMLDivElement | null>(null);
  const settingsBtnRef = useRef<HTMLButtonElement | null>(null);

  type RequestItem = { id: string; name: string; type: string; method: string };
  type Collection = { name: string; requests: RequestItem[] };

  const initialRequests: RequestItem[] = [
    { id: "dataset-test-1", name: "Gender Bias Analysis", type: "Dataset", method: "VALIDATE" },
  ];

  const initialCollections: Collection[] = [
    { name: "My Workspace", requests: initialRequests },
  ];

  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [selectedCollection, setSelectedCollection] = useState<string>(initialCollections[0].name);

  const currentRequests = collections.find((c) => c.name === selectedCollection)?.requests ?? [];
  const activeRequestObj = currentRequests.find((r) => r.id === activeRequest) ?? currentRequests[0] ?? initialRequests[0];

  const addCollection = () => {
    const name = window.prompt('New collection name');
    if (!name) return;
    if (collections.some(c => c.name === name)) {
      setSelectedCollection(name);
      return;
    }
    setCollections(prev => [...prev, { name, requests: [] }]);
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
    const name = window.prompt('New request name');
    if (!name) return;
    const newReq: RequestItem = { id: `req-${Date.now()}`, name, type: 'Dataset', method: requestMethod ?? 'ANALYZE' };
    setCollections(prev => prev.map(c => c.name === selectedCollection ? { ...c, requests: [...c.requests, newReq] } : c));
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
  const [preprocessedDataset, setPreprocessedDataset] = useState<DatasetRow[] | null>(null);
  const [biasResults, setBiasResults] = useState<{ spd?: number; di?: number; details?: Array<{ group: string; rate: number; total: number }> } | null>(null);

  // Very small CSV parser (handles simple CSVs without multiline quoted fields)



  const handleModelFile = (file: File | null) => {
    setModelFile(file);
    setIsModelValid(false);

    if (!file) return;

    const supported = ['.pkl', '.h5', '.joblib', '.onnx', '.json'];
    const ok = supported.some(ext => file.name.endsWith(ext));

    if (!ok) {
      setValidationResults(prev => [...prev, `Model file type not supported: ${file.name}`]);
      setIsModelValid(false);
    } else {
      setValidationResults(prev => [
        ...prev.filter(r => !r.startsWith('Model file type')),
        `Model file accepted: ${file.name}`
      ]);
      setIsModelValid(true);
    }
  };



  const suggestMitigations = () => {
    const suggestions: string[] = [];
    if (!preprocessedDataset && dataset && dataset.length > 0) suggestions.push('Run preprocessing (impute or remove nulls) before detection');
    if (biasResults) {
      if (Math.abs(biasResults.spd ?? 0) > 0.1) suggestions.push('Apply reweighting or resampling to reduce Statistical Parity Difference');
      if ((biasResults.di ?? 1) < 0.8) suggestions.push('Consider Disparate Impact Remover preprocessing or reweighing');
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
      setActiveResponseTab("tests");
      setShowResponse(true);
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


  const attributesSelected =
    selectedSensitive.length > 0 && !!selectedTarget;

  useEffect(() => {
    if (attributesSelected && currentPhase === "VALIDATED") {
      setCurrentPhase("ATTRIBUTES_SELECTED");
    }
  }, [attributesSelected, currentPhase]);






  const renderRequestBody = () => {

    if (requestMethod === "MITIGATE") {
      return (
        <div className="max-w-5xl">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Bias Mitigation Strategy (Phase 5)</h3>
          <p className="text-sm text-gray-600 mb-6">Select up to three algorithms to compare their impact on fairness and accuracy. The system will run all selected methods to determine which works best.</p>

          <div className="space-y-4">
            {/* ... (Mitigation Strategy Selects remain the same) */}
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Pre-processing Algorithms</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-orange-500">
                <option>None Selected</option>
                <option>Reweighting (Dataset)</option>
                <option>Disparate Impact Remover</option>
              </select>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <label className="block text-sm font-semibold text-gray-700 mb-2">In-processing Algorithms</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-orange-500">
                <option>None Selected</option>
                <option>Adversarial Debiasing</option>
                <option>Prejudice Remover</option>
              </select>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Post-processing Algorithms</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-orange-500">
                <option>None Selected</option>
                <option>Calibrated Equalized Odds</option>
                <option>Reject Option Classification (ROC)</option>
              </select>
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
                <option key={c} value={c}>{c}</option>
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
                      !selectedSensitive.includes(col) && selectedSensitive.length >= 2
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (selectedSensitive.length >= 2) return;
                        setSelectedSensitive((prev) => [...prev, col]);
                      } else {
                        setSelectedSensitive((prev) =>
                          prev.filter((c) => c !== col)
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
          <h3 className="text-lg font-bold text-gray-800 mb-4">Dataset and Model Configuration (Phase 1, 2, 3)</h3>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Model Upload (Phase 1) - UI-only validation */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Model Upload (Phase 1)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer h-full flex flex-col justify-center">
                <Brain className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700 mb-1">Upload Trained ML Model</p>
                <p className="text-xs text-gray-500 mb-3">Supports .pkl,.joblib, .json, .ipynb</p>
                <input
                  type="file"
                  accept=".pkl,.joblib"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setModelFile(file);        // ✅ correct
                    handleModelFile(file);     // ✅ correct
                  }}
                />
                {modelFile && <div className="text-xs text-gray-600 mt-2">Selected: {modelFile.name}</div>}
              </div>
            </div>

            {/* Dataset Upload (Phase 1) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Dataset Upload (Phase 1)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 hover:bg-orange-50 transition-all cursor-pointer h-full flex flex-col justify-center">
                <Upload className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700 mb-1">Upload Analysis Dataset</p>
                <p className="text-xs text-gray-500 mb-3">Supports CSV and JSON (client-side)</p>
                <input
                  required={true}
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setDatasetFile(file);     // ✅ needed for backend
                    // ✅ client-side preview
                  }}
                />
                {datasetFile && <div className="text-xs text-gray-600 mt-2">Selected: {datasetFile.name}</div>}
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
            <div className="text-xs text-red-600 mt-2">
              {uploadError}
            </div>
          )}
        </div>
      );
    }
  };
  const StatusCard = ({ title, status }: { title: string; status: boolean | string }) => (
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
            )
          )}
          <div
            className={`p-4 rounded-lg border flex items-center gap-3
        ${biasResults.bias_present
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-green-50 border-green-200 text-green-700"
              }`}
          >
            <CheckCircle className="w-5 h-5" />

            {biasResults.bias_present ? (
              <span className="text-sm font-semibold">
                Bias detected in the model predictions.
                Mitigation is required before deployment.
                Proceed to the <strong>MITIGATE</strong> phase.
              </span>
            ) : (
              <span className="text-sm font-semibold">
                No significant bias detected.
                Model is safe for deployment.
              </span>
            )}
            {/* Next Phase Button */}
            {biasResults.bias_present && (
              <button
                onClick={() => {
                  setRequestMethod("MITIGATE");
                  setShowResponse(false);
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
  };
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col relative">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a className="flex items-center gap-2 group" data-testid="link-home">
              <div className="size-8 flex items-center justify-center text-foreground">
                <Brain className="size-8 stroke-[2.5] text-orange-500" />
              </div>
              <span className="font-display text-xl tracking-wider text-foreground uppercase">BiasBuster</span>
            </a>
          </div>
          <button className="p-1.5 hover:bg-gray-100 rounded">
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Workspace Selector */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Workspace</div>
          <div className="relative">
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {collections.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
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
              <div className="text-xs font-semibold text-gray-500 uppercase">Collections</div>
              <button onClick={addCollection} className="p-1 hover:bg-gray-100 rounded">
                <Plus className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-1">
              {collections.map((col) => (
                <div key={col.name} className="mb-3">
                  <div
                    onClick={() => setSelectedCollection(col.name)}
                    className={`flex items-center gap-1 px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer ${selectedCollection === col.name ? 'bg-gray-50' : ''}`}
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
                          onClick={() => { setActiveRequest(req.id); setSelectedCollection(col.name); }}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer ${activeRequest === req.id ? "bg-orange-50 text-orange-700" : "hover:bg-gray-100"}`}
                        >
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${activeRequest === req.id ? "bg-orange-500 text-white" : "bg-blue-100 text-blue-700"}`}>
                            {req.method}
                          </span>
                          <span className="text-sm truncate">{req.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-400 px-2">No requests</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="px-4 py-3 border-t border-gray-200 space-y-2 relative">
          <button onClick={addRequest} className="w-full px-3 py-2 text-sm font-medium bg-orange-500 text-white rounded hover:bg-orange-600 flex items-center justify-center gap-2">
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
                    <div className="text-xs text-gray-500">yashgaonkar2020@gmail.com</div>
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
                <span className="text-sm font-medium">{activeRequestObj.name}</span>
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
                <option value="MITIGATE" disabled={currentPhase !== "BIAS_DETECTED"}>
                  MITIGATE
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
              <button className="px-1 py-3 text-sm font-medium text-orange-600 border-b-2 border-orange-500">Params</button>
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
                    <span className={`text-xs px-2 py-1 rounded font-medium ${requestMethod === 'MITIGATE' ? 'bg-green-100 text-green-700' : 'bg-green-100 text-green-700'}`}>
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
                    className={`px-1 py-3 text-sm font-medium ${activeResponseTab === "body" ? "text-orange-600 border-b-2 border-orange-500" : "text-gray-600 hover:text-gray-900"
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