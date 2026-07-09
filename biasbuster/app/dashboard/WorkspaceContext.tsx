"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

type Phase = "UPLOAD" | "VALIDATED" | "ATTRIBUTES_SELECTED" | "BIAS_DETECTED";

export interface Workspace {
  id: string | number;
  name: string;
  is_favorite: boolean;
}

export interface Experiment {
  id: string | number;
  workspace_id: string | number;
  name: string;
}

interface ToastMessage {
  message: string;
  type: "success" | "error";
}

interface WorkspaceContextType {
  // Workspaces & Experiments
  workspaces: Workspace[];
  selectedWorkspace: Workspace | null;
  experiments: Experiment[];
  selectedExperiment: Experiment | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  toast: ToastMessage | null;
  showToast: (message: string, type?: "success" | "error") => void;
  setToast: (toast: ToastMessage | null) => void;
  
  selectWorkspace: (ws: Workspace | null) => void;
  selectExperiment: (exp: Experiment | null) => void;
  createNewWorkspace: (name: string) => Promise<void>;
  renameWorkspace: (id: string | number, newName: string) => Promise<void>;
  deleteWorkspace: (id: string | number) => Promise<void>;
  toggleFavoriteWorkspace: (id: string | number) => Promise<void>;
  
  createNewExperiment: (name: string) => Promise<void>;
  renameExperiment: (id: string | number, newName: string) => Promise<void>;
  deleteExperiment: (id: string | number) => Promise<void>;
  fetchExperiments: (workspaceId: string | number, search?: string) => Promise<any>;

  // Pipeline State
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
  // Workspaces & Experiments
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Experiment States Caching
  const [experimentStates, setExperimentStates] = useState<{ [id: string]: any }>({});

  // Pipeline State
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

  // Optimization Params
  const [optMethod, setOptMethod] = useState("optuna");
  const [optTrials, setOptTrials] = useState(20);
  const [optCV, setOptCV] = useState(5);
  const [optAccuracyWeight, setOptAccuracyWeight] = useState(0.6);
  const [optFairnessWeight, setOptFairnessWeight] = useState(0.4);
  const [optTimeout, setOptTimeout] = useState(300);

  // Results & Data
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

  // Toast notifier helper
  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Fetching workspaces from backend or fallback
  const fetchWorkspaces = async () => {
    try {
      const res = await api.get("/api/workspaces");
      setWorkspaces(res.data);
      localStorage.setItem("bb_workspaces", JSON.stringify(res.data));
      return res.data;
    } catch (err) {
      console.warn("Backend /api/workspaces unavailable, using local storage cache");
      const cached = localStorage.getItem("bb_workspaces");
      const defaultWS = cached ? JSON.parse(cached) : [];
      setWorkspaces(defaultWS);
      localStorage.setItem("bb_workspaces", JSON.stringify(defaultWS));
      return defaultWS;
    }
  };

  // Fetching experiments from backend or fallback
  const fetchExperiments = useCallback(async (workspaceId: string | number, search?: string) => {
    try {
      let url = `/api/experiments?workspace_id=${workspaceId}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const res = await api.get(url);
      setExperiments(res.data);
      localStorage.setItem(`bb_experiments_${workspaceId}`, JSON.stringify(res.data));
      return res.data;
    } catch (err) {
      console.warn("Backend /api/experiments unavailable, using local storage cache");
      const cached = localStorage.getItem(`bb_experiments_${workspaceId}`);
      let fallback = cached ? JSON.parse(cached) : [];
      if (search) {
        fallback = fallback.filter((e: any) => e.name.toLowerCase().includes(search.toLowerCase()));
      }
      setExperiments(fallback);
      return fallback;
    }
  }, []);

  // Workspace CRUD actions
  const createNewWorkspace = async (name: string) => {
    if (workspaces.length >= 3) {
      showToast("Workspace limit reached", "error");
      return;
    }
    try {
      const res = await api.post("/api/workspaces", { name });
      const updated = [...workspaces, res.data];
      setWorkspaces(updated);
      localStorage.setItem("bb_workspaces", JSON.stringify(updated));
      selectWorkspace(res.data);
      showToast("Workspace created successfully", "success");
    } catch (err: any) {
      if (err?.response?.data?.detail === "Workspace limit reached" || err?.response?.status === 400) {
        showToast("Workspace limit reached", "error");
      } else {
        showToast(err?.response?.data?.detail || "Failed to create workspace", "error");
      }
    }
  };

  const renameWorkspace = async (id: string | number, newName: string) => {
    try {
      const res = await api.patch(`/api/workspaces/${id}`, { name: newName });
      const updated = workspaces.map(w => w.id === id ? { ...w, name: res.data.name } : w);
      setWorkspaces(updated);
      localStorage.setItem("bb_workspaces", JSON.stringify(updated));
      if (selectedWorkspace?.id === id) {
        setSelectedWorkspace(prev => prev ? { ...prev, name: res.data.name } : null);
      }
      showToast("Workspace renamed", "success");
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Failed to rename workspace", "error");
    }
  };

  const deleteWorkspace = async (id: string | number) => {
    try {
      await api.delete(`/api/workspaces/${id}`);
      const updated = workspaces.filter(w => w.id !== id);
      setWorkspaces(updated);
      localStorage.setItem("bb_workspaces", JSON.stringify(updated));
      if (selectedWorkspace?.id === id) {
        selectWorkspace(updated[0] || null);
      }
      showToast("Workspace deleted", "success");
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Failed to delete workspace", "error");
    }
  };

  const toggleFavoriteWorkspace = async (id: string | number) => {
    const ws = workspaces.find(w => w.id === id);
    if (!ws) return;
    const nextFavorite = !ws.is_favorite;
    try {
      const res = await api.patch(`/api/workspaces/${id}`, { is_favorite: nextFavorite });
      const updated = workspaces.map(w => w.id === id ? { ...w, is_favorite: res.data.is_favorite } : w);
      setWorkspaces(updated);
      localStorage.setItem("bb_workspaces", JSON.stringify(updated));
      if (selectedWorkspace?.id === id) {
        setSelectedWorkspace(prev => prev ? { ...prev, is_favorite: res.data.is_favorite } : null);
      }
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Failed to toggle favorite", "error");
    }
  };

  // Experiment CRUD actions
  const createNewExperiment = async (name: string) => {
    if (!selectedWorkspace) return;
    try {
      const res = await api.post("/api/experiments", { name, workspace_id: selectedWorkspace.id });
      const updated = [...experiments, res.data];
      setExperiments(updated);
      localStorage.setItem(`bb_experiments_${selectedWorkspace.id}`, JSON.stringify(updated));
      selectExperiment(res.data);
      showToast("Experiment created successfully", "success");
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Failed to create experiment", "error");
    }
  };

  const renameExperiment = async (id: string | number, newName: string) => {
    if (!selectedWorkspace) return;
    try {
      const res = await api.patch(`/api/experiments/${id}`, { name: newName });
      const updated = experiments.map(e => e.id === id ? { ...e, name: res.data.name } : e);
      setExperiments(updated);
      localStorage.setItem(`bb_experiments_${selectedWorkspace.id}`, JSON.stringify(updated));
      if (selectedExperiment?.id === id) {
        setSelectedExperiment(prev => prev ? { ...prev, name: res.data.name } : null);
      }
      showToast("Experiment renamed", "success");
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Failed to rename experiment", "error");
    }
  };

  const deleteExperiment = async (id: string | number) => {
    if (!selectedWorkspace) return;
    try {
      await api.delete(`/api/experiments/${id}`);
      const updated = experiments.filter(e => e.id !== id);
      setExperiments(updated);
      localStorage.setItem(`bb_experiments_${selectedWorkspace.id}`, JSON.stringify(updated));
      if (selectedExperiment?.id === id) {
        selectExperiment(updated[0] || null);
      }
      showToast("Experiment deleted", "success");
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Failed to delete experiment", "error");
    }
  };

  // Switch Active Workspace
  const selectWorkspace = (ws: Workspace | null) => {
    setSelectedWorkspace(ws);
    if (ws) {
      localStorage.setItem("bb_selected_workspace_id", String(ws.id));
      fetchExperiments(ws.id).then((expList) => {
        if (expList && expList.length > 0) {
          const savedExpId = localStorage.getItem(`bb_selected_experiment_id_${ws.id}`);
          const initialExp = expList.find((e: any) => String(e.id) === savedExpId) || expList[0];
          selectExperiment(initialExp);
        } else {
          selectExperiment(null);
        }
      });
    } else {
      localStorage.removeItem("bb_selected_workspace_id");
      setExperiments([]);
      selectExperiment(null);
    }
  };

  // Switch Active Experiment (with pipeline cache preservation)
  const selectExperiment = (exp: Experiment | null) => {
    // 1. Cache old experiment state
    if (selectedExperiment) {
      setExperimentStates(prev => ({
        ...prev,
        [selectedExperiment.id]: {
          uploadId,
          uploadResponse,
          datasetFile,
          modelFile,
          biasResults,
          mitigationResults,
          optimizationResults,
          columns,
          selectedTarget,
          selectedSensitive,
          currentPhase,
          requestMethod
        }
      }));
    }

    // 2. Load new experiment state
    if (exp) {
      if (selectedWorkspace) {
        localStorage.setItem(`bb_selected_experiment_id_${selectedWorkspace.id}`, String(exp.id));
      }
      const state = experimentStates[exp.id];
      if (state) {
        setUploadId(state.uploadId ?? null);
        setUploadResponse(state.uploadResponse ?? null);
        setDatasetFile(state.datasetFile ?? null);
        setModelFile(state.modelFile ?? null);
        setBiasResults(state.biasResults ?? null);
        setMitigationResults(state.mitigationResults ?? null);
        setOptimizationResults(state.optimizationResults ?? null);
        setColumns(state.columns ?? []);
        setSelectedTarget(state.selectedTarget ?? null);
        setSelectedSensitive(state.selectedSensitive ?? []);
        setCurrentPhase(state.currentPhase ?? "UPLOAD");
        setRequestMethod(state.requestMethod ?? "VALIDATE");
      } else {
        // Reset state for new experiment
        setUploadId(null);
        setUploadResponse(null);
        setDatasetFile(null);
        setModelFile(null);
        setBiasResults(null);
        setMitigationResults(null);
        setOptimizationResults(null);
        setColumns([]);
        setSelectedTarget(null);
        setSelectedSensitive([]);
        setCurrentPhase("UPLOAD");
        setRequestMethod("VALIDATE");
      }
    } else {
      if (selectedWorkspace) {
        localStorage.removeItem(`bb_selected_experiment_id_${selectedWorkspace.id}`);
      }
      setUploadId(null);
      setUploadResponse(null);
      setDatasetFile(null);
      setModelFile(null);
      setBiasResults(null);
      setMitigationResults(null);
      setOptimizationResults(null);
      setColumns([]);
      setSelectedTarget(null);
      setSelectedSensitive([]);
      setCurrentPhase("UPLOAD");
      setRequestMethod("VALIDATE");
    }
    setSelectedExperiment(exp);
  };

  // Pipeline methods
  const uploadDatasetAndModel = async () => {
    if (!datasetFile || !modelFile) {
      setUploadError("Please upload both dataset and model files");
      return null;
    }
    if (!selectedExperiment) {
      setUploadError("Please select an active experiment first");
      return null;
    }

    const formData = new FormData();
    formData.append("dataset_file", datasetFile);
    formData.append("model_file", modelFile);
    formData.append("experiment_id", String(selectedExperiment.id));

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

  // Initialize workspaces on startup
  useEffect(() => {
    const initialize = async () => {
      const wsList = await fetchWorkspaces();
      if (wsList && wsList.length > 0) {
        const savedWSId = localStorage.getItem("bb_selected_workspace_id");
        const initialWS = wsList.find((w: any) => String(w.id) === savedWSId) || wsList[0];
        setSelectedWorkspace(initialWS);
        
        const expList = await fetchExperiments(initialWS.id);
        if (expList && expList.length > 0) {
          const savedExpId = localStorage.getItem(`bb_selected_experiment_id_${initialWS.id}`);
          const initialExp = expList.find((e: any) => String(e.id) === savedExpId) || expList[0];
          setSelectedExperiment(initialExp);
        }
      }
    };
    initialize();
  }, [fetchExperiments]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        selectedWorkspace,
        experiments,
        selectedExperiment,
        searchQuery,
        setSearchQuery,
        toast,
        showToast,
        setToast,
        selectWorkspace,
        selectExperiment,
        createNewWorkspace,
        renameWorkspace,
        deleteWorkspace,
        toggleFavoriteWorkspace,
        createNewExperiment,
        renameExperiment,
        deleteExperiment,
        fetchExperiments,

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
