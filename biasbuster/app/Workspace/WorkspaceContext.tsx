"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";

type Phase = "UPLOAD" | "VALIDATED" | "ATTRIBUTES_SELECTED" | "BIAS_DETECTED";

interface WorkspaceContextType {
  // State
  activeRequest: string;
  setActiveRequest: (id: string) => void;
  requestMethod: string;
  setRequestMethod: (method: string) => void;
  uploadId: number | null;
  setUploadId: (id: number | null) => void;
  uploading: boolean;
  processingStep: string | null;
  processingPhase: string;
  uploadError: string | null;
  datasetFile: File | null;
  modelFile: File | null;
  setDatasetFile: (file: File | null) => void;
  setModelFile: (file: File | null) => void;
  uploadResponse: any | null;
  currentPhase: Phase;
  setCurrentPhase: (phase: Phase) => void;
  isExperimentMode: boolean;
  setIsExperimentMode: (val: boolean) => void;
  
  // Optimization Params
  optMethod: string;
  setOptMethod: (val: string) => void;
  optTrials: number;
  setOptTrials: (val: number) => void;
  optCV: number;
  setOptCV: (val: number) => void;
  optAccuracyWeight: number;
  setOptAccuracyWeight: (val: number) => void;
  optFairnessWeight: number;
  setOptFairnessWeight: (val: number) => void;
  optTimeout: number;
  setOptTimeout: (val: number) => void;

  // Results & Data
  columns: string[];
  selectedSensitive: string[];
  setSelectedSensitive: React.Dispatch<React.SetStateAction<string[]>>;
  selectedTarget: string | null;
  setSelectedTarget: (val: string | null) => void;
  biasResults: any | null;
  mitigationResults: any | null;
  recommendationResult: any | null;
  optimizationResults: any | null;
  comparisonData: any | null;
  selectedStrategy: string;
  setSelectedStrategy: (val: string) => void;
  downloadModelMetadata: any | null;
  setDownloadModelMetadata: (val: any | null) => void;
  generatedReport: any | null;
  setGeneratedReport: (val: any | null) => void;
  reportBusy: boolean;

  // Actions
  uploadDatasetAndModel: () => Promise<any>;
  runBiasDetection: () => Promise<void>;
  applyMitigation: (strategy: string) => Promise<void>;
  applyOptimization: () => Promise<void>;
  fetchComparison: () => Promise<void>;
  fetchRecommendation: () => Promise<void>;
  confirmDownload: (model: any, format?: string) => void;
  generateComparisonReport: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRequest, setActiveRequest] = useState("dataset-test-1");
  const [requestMethod, setRequestMethod] = useState("VALIDATE");
  const [uploadId, setUploadId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [processingPhase, setProcessingPhase] = useState<string>("VALIDATE");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [uploadResponse, setUploadResponse] = useState<any | null>(null);
  const [currentPhase, setCurrentPhase] = useState<Phase>("UPLOAD");
  const [isExperimentMode, setIsExperimentMode] = useState(false);

  const [optMethod, setOptMethod] = useState("optuna");
  const [optTrials, setOptTrials] = useState(20);
  const [optCV, setOptCV] = useState(5);
  const [optAccuracyWeight, setOptAccuracyWeight] = useState(0.6);
  const [optFairnessWeight, setOptFairnessWeight] = useState(0.4);
  const [optTimeout, setOptTimeout] = useState(300);

  const [columns, setColumns] = useState<string[]>([]);
  const [selectedSensitive, setSelectedSensitive] = useState<string[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [biasResults, setBiasResults] = useState<any>(null);
  const [mitigationResults, setMitigationResults] = useState<any>(null);
  const [recommendationResult, setRecommendationResult] = useState<any>(null);
  const [optimizationResults, setOptimizationResults] = useState<any>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [selectedStrategy, setSelectedStrategy] = useState("reweighting");
  const [downloadModelMetadata, setDownloadModelMetadata] = useState<any>(null);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [reportBusy, setReportBusy] = useState(false);

  const uploadDatasetAndModel = async () => {
    if (!datasetFile || !modelFile) {
      setUploadError("Please upload both dataset and model files");
      return null;
    }
    const formData = new FormData();
    formData.append("dataset_file", datasetFile);
    formData.append("model_file", modelFile);

    try {
      setUploading(true);
      setProcessingPhase("VALIDATE");
      setProcessingStep("Uploading dataset and model...");
      setUploadError(null);

      const res = await api.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setUploadId(res.data.upload_id);
      setUploadResponse(res.data);
      setColumns(res.data.dataset_info.column_names);
      setCurrentPhase("VALIDATED");
      setProcessingStep(null);
      return res.data;
    } catch (err: any) {
      setUploadError(err?.response?.data?.detail || "Upload failed");
      setCurrentPhase("UPLOAD");
      setProcessingStep(null);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const runBiasDetection = async () => {
    if (!uploadId || !selectedTarget || selectedSensitive.length === 0) return;
    try {
      setProcessingPhase("DETECT");
      setProcessingStep("Running fairness metrics...");
      const res = await api.post("/api/bias/detect", {
        upload_id: uploadId,
        target_column: selectedTarget,
        sensitive_columns: selectedSensitive,
      });
      setBiasResults(res.data);
      setCurrentPhase("BIAS_DETECTED");
      setProcessingStep(null);
    } catch (err: any) {
      setProcessingStep(null);
      alert(err?.response?.data?.detail || "Bias detection failed");
    }
  };

  const fetchRecommendation = async () => {
    if (!uploadId || !selectedTarget || selectedSensitive.length === 0) return;
    try {
      setProcessingPhase("RECOMMEND");
      setProcessingStep("Fetching strategy recommendation...");
      const res = await api.post(`/api/bias/recommend-strategy`, {
        upload_id: uploadId,
        target_column: selectedTarget,
        sensitive_columns: selectedSensitive,
      });
      setRecommendationResult(res.data);
      if (res.data.recommendation?.recommended_strategy) {
        setSelectedStrategy(res.data.recommendation.recommended_strategy);
      }
      setProcessingStep(null);
    } catch (err: any) {
      setProcessingStep(null);
      console.error("Failed to fetch recommendation", err);
    }
  };

  const applyMitigation = async (strategy: string) => {
    try {
      setProcessingPhase("MITIGATE");
      setProcessingStep(`Applying ${strategy} strategy...`);
      const res = await api.post(`/api/bias/mitigate`, {
        upload_id: uploadId,
        target_column: selectedTarget,
        sensitive_columns: selectedSensitive,
        strategy_name: strategy,
        confirm_recommendation: true,
      });
      setMitigationResults(res.data);
      setProcessingStep(null);
    } catch (err: any) {
      setProcessingStep(null);
      alert(err?.response?.data?.detail || "Mitigation failed");
    }
  };

  const applyOptimization = async () => {
    try {
      setProcessingPhase("OPTIMIZE");
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
      setOptimizationResults(res.data);
      setProcessingStep(null);
    } catch (err: any) {
      setProcessingStep(null);
      alert(err?.response?.data?.detail || "Optimization failed");
    }
  };

  const fetchComparison = async () => {
    if (!uploadId) return;
    try {
      setProcessingPhase("COMPARE");
      setProcessingStep("Fetching comparison data...");
      const res = await api.get(`/api/models/compare/${uploadId}`);
      setComparisonData(res.data);
      setProcessingStep(null);
      setRequestMethod("COMPARE");
    } catch (err: any) {
      setProcessingStep(null);
      alert(err?.response?.data?.detail || "Failed to fetch comparison data");
    }
  };

  const generateComparisonReport = async () => {
    const reportUploadId = comparisonData?.upload_id || uploadId;
    if (!reportUploadId) return;
    try {
      setReportBusy(true);
      const res = await api.post(`/api/report/generate`, {
        upload_id: reportUploadId,
      });
      setGeneratedReport(res.data);
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to generate report");
    } finally {
      setReportBusy(false);
    }
  };

  const confirmDownload = (model: any, format: string = "pkl") => {
    const baseUrl = "http://localhost:8000";
    const toAbsoluteUrl = (url: string) =>
      url.startsWith("http")
        ? url
        : `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;

    const sourceUrl = model?.download_url
      ? toAbsoluteUrl(model.download_url)
      : `${baseUrl}/api/models/download/${model?.model_id || ""}`;

    const separator = sourceUrl.includes("?") ? "&" : "?";
    const finalUrl = `${sourceUrl}${separator}format=${format}`;
    window.open(finalUrl, "_blank");
  };

  return (
    <WorkspaceContext.Provider
      value={{
        activeRequest,
        setActiveRequest,
        requestMethod,
        setRequestMethod,
        uploadId,
        setUploadId,
        uploading,
        processingStep,
        processingPhase,
        uploadError,
        datasetFile,
        modelFile,
        setDatasetFile,
        setModelFile,
        uploadResponse,
        currentPhase,
        setCurrentPhase,
        isExperimentMode,
        setIsExperimentMode,
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
        columns,
        selectedSensitive,
        setSelectedSensitive,
        selectedTarget,
        setSelectedTarget,
        biasResults,
        mitigationResults,
        recommendationResult,
        optimizationResults,
        comparisonData,
        selectedStrategy,
        setSelectedStrategy,
        uploadDatasetAndModel,
        runBiasDetection,
        applyMitigation,
        applyOptimization,
        fetchComparison,
        fetchRecommendation,
        downloadModelMetadata,
        setDownloadModelMetadata,
        generatedReport,
        setGeneratedReport,
        reportBusy,
        confirmDownload,
        generateComparisonReport
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
