"use client";

import React, { useState, useRef, useEffect } from "react";
import { useWorkspace, Workspace, Experiment, WorkspaceProvider } from "./WorkspaceContext";
import { usePathname, useRouter } from "next/navigation";
import { 
  Brain, 
  Search, 
  Plus, 
  Settings, 
  ChevronDown, 
  Star, 
  Trash2, 
  Edit3, 
  X, 
  FileText, 
  BarChart3, 
  ShieldAlert, 
  Award,
  Upload,
  AlertTriangle,
  FolderOpen
} from "lucide-react";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    workspaces,
    selectedWorkspace,
    experiments,
    selectedExperiment,
    searchQuery,
    setSearchQuery,
    toast,
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
    
    // pipeline states to determine tab locks
    currentPhase,
    mitigationResults,
    optimizationResults,
    comparisonData
  } = useWorkspace();

  // Dropdowns & Modals state
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"createWorkspace" | "renameWorkspace" | "deleteWorkspace" | "createExperiment" | "renameExperiment" | "deleteExperiment" | null>(null);
  
  // Temp inputs for modals
  const [modalInputName, setModalInputName] = useState("");
  const [targetWorkspace, setTargetWorkspace] = useState<Workspace | null>(null);
  const [targetExperiment, setTargetExperiment] = useState<Experiment | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowWorkspaceDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync workspace search on input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (selectedWorkspace) {
      fetchExperiments(selectedWorkspace.id, val);
    }
  };

  // Open modals helper
  const openModal = (
    type: typeof modalType,
    initialVal: string = "",
    ws: Workspace | null = null,
    exp: Experiment | null = null
  ) => {
    setModalType(type);
    setModalInputName(initialVal);
    setTargetWorkspace(ws);
    setTargetExperiment(exp);
    setModalOpen(true);
    setShowWorkspaceDropdown(false);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalInputName.trim() && modalType !== "deleteWorkspace" && modalType !== "deleteExperiment") return;

    if (modalType === "createWorkspace") {
      await createNewWorkspace(modalInputName.trim());
    } else if (modalType === "renameWorkspace" && targetWorkspace) {
      await renameWorkspace(targetWorkspace.id, modalInputName.trim());
    } else if (modalType === "deleteWorkspace" && targetWorkspace) {
      await deleteWorkspace(targetWorkspace.id);
    } else if (modalType === "createExperiment") {
      await createNewExperiment(modalInputName.trim());
    } else if (modalType === "renameExperiment" && targetExperiment) {
      await renameExperiment(targetExperiment.id, modalInputName.trim());
    } else if (modalType === "deleteExperiment" && targetExperiment) {
      await deleteExperiment(targetExperiment.id);
    }

    setModalOpen(false);
    setModalType(null);
    setModalInputName("");
    setTargetWorkspace(null);
    setTargetExperiment(null);
  };

  // Path navigation checks
  const tabs = [
    { name: "Upload", path: "/dashboard/upload", icon: Upload, locked: false },
    { name: "Bias Detection", path: "/dashboard/bias", icon: ShieldAlert, locked: currentPhase === "UPLOAD" },
    { name: "Mitigation", path: "/dashboard/mitigation", icon: AlertTriangle, locked: !biasResultsExist() },
    { name: "Optimization", path: "/dashboard/optimization", icon: Settings, locked: !mitigationResults },
    { name: "Reports", path: "/dashboard/reports", icon: BarChart3, locked: !mitigationResults && !comparisonData }
  ];

  function biasResultsExist() {
    return currentPhase !== "UPLOAD" && currentPhase !== "VALIDATED";
  }

  const navigateToTab = (path: string, locked: boolean) => {
    if (locked) return;
    router.push(path);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* Left Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col relative select-none z-20">
        
        {/* Logo & Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 flex items-center justify-center">
              <Brain className="size-8 stroke-[2.5] text-orange-500" />
            </div>
            <span className="font-display text-xl tracking-wider text-gray-800 uppercase font-black">
              BiasBuster
            </span>
          </div>
        </div>

        {/* Workspaces Section */}
        <div className="px-4 py-3 border-b border-gray-200 relative" ref={dropdownRef}>
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Workspaces</span>
          </div>

          {selectedWorkspace ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 hover:text-gray-900 focus:outline-none transition-all py-1"
                >
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showWorkspaceDropdown ? "rotate-180" : ""}`} />
                  <span>{selectedWorkspace.name}</span>
                </button>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleFavoriteWorkspace(selectedWorkspace.id)}
                    title="Favorite Workspace"
                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-yellow-500"
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        selectedWorkspace.is_favorite
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-400"
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => openModal("renameWorkspace", selectedWorkspace.name, selectedWorkspace)}
                    title="Rename Workspace"
                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openModal("deleteWorkspace", "", selectedWorkspace)}
                    title="Delete Workspace"
                    className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => openModal("createWorkspace")}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-md bg-white hover:bg-gray-50 text-orange-500 font-semibold"
            >
              <Plus className="w-4 h-4" /> Create Workspace
            </button>
          )}

          {/* Workspace Dropdown Panel */}
          {showWorkspaceDropdown && (
            <div className="absolute left-4 right-4 mt-1 bg-white border border-gray-200 rounded-md shadow-xl z-50 overflow-hidden animate-in fade-in duration-100">
              <div className="p-1 border-b border-gray-100 max-h-48 overflow-y-auto">
                {workspaces.map((ws) => (
                  <div
                    key={ws.id}
                    className={`flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer ${
                      selectedWorkspace?.id === ws.id ? "bg-orange-50/50" : ""
                    }`}
                  >
                    <div
                      onClick={() => {
                        selectWorkspace(ws);
                        setShowWorkspaceDropdown(false);
                      }}
                      className="flex-1 min-w-0 pr-2"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-sm ${
                            selectedWorkspace?.id === ws.id
                              ? "font-bold text-orange-600"
                              : "text-gray-700"
                          } truncate`}
                        >
                          {ws.name}
                        </span>
                        {ws.is_favorite && (
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal("renameWorkspace", ws.name, ws);
                        }}
                        className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal("deleteWorkspace", "", ws);
                        }}
                        className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-1 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => openModal("createWorkspace")}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-orange-500 font-semibold hover:bg-orange-50/50 rounded transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> New Workspace
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search & Experiment List */}
        {selectedWorkspace && (
          <>
            {/* Search Experiments */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search Experiments..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                />
              </div>
            </div>

            {/* Experiment List */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className="space-y-1">
                {experiments.length > 0 ? (
                  experiments.map((exp) => (
                    <div
                      key={exp.id}
                      className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all border ${
                        selectedExperiment?.id === exp.id
                          ? "bg-orange-50 text-orange-700 border-orange-200"
                          : "hover:bg-gray-50 text-gray-700 border-transparent"
                      }`}
                    >
                      <div
                        onClick={() => selectExperiment(exp)}
                        className="flex-1 min-w-0 truncate text-sm font-medium"
                      >
                        {exp.name}
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal("renameExperiment", exp.name, null, exp);
                          }}
                          className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal("deleteExperiment", "", null, exp);
                          }}
                          className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-400 text-center py-6">
                    No experiments found.
                  </div>
                )}

                {/* Inline New Experiment Action */}
                <button
                  onClick={() => openModal("createExperiment")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-orange-500 hover:bg-orange-50 rounded-md transition-all mt-2 border border-dashed border-transparent hover:border-orange-200"
                >
                  <Plus className="w-3.5 h-3.5" /> New Experiment
                </button>
              </div>
            </div>
          </>
        )}

        {!selectedWorkspace && (
          <div className="flex-1 overflow-y-auto px-4 py-6 text-xs text-gray-400 text-center">
            Create or select a workspace to get started.
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Breadcrumb Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            <span>Workspaces</span>
            <span>/</span>
            <span className="text-gray-600 font-bold">
              {selectedWorkspace ? selectedWorkspace.name : "None"}
            </span>
            {selectedExperiment && (
              <>
                <span>/</span>
                <span className="text-orange-500 font-bold">
                  {selectedExperiment.name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Stage Navigation Tab bar (Only active when Workspace + Experiment exist) */}
        {selectedWorkspace && selectedExperiment && (
          <div className="bg-white border-b border-gray-200 px-6 shrink-0 z-10 flex gap-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.path;
              return (
                <button
                  key={tab.name}
                  onClick={() => navigateToTab(tab.path, tab.locked)}
                  disabled={tab.locked}
                  className={`px-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                    isActive
                      ? "text-orange-600 border-orange-500"
                      : tab.locked
                      ? "text-gray-300 border-transparent opacity-40 cursor-not-allowed"
                      : "text-gray-500 border-transparent hover:text-gray-800 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Core Content Layout (with Empty State overlays) */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {!selectedWorkspace ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white/70 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="p-4 bg-orange-50 text-orange-500 rounded-full mb-4">
                <FolderOpen className="w-12 h-12 stroke-[1.5]" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Create your first Workspace</h2>
              <p className="text-sm text-gray-500 max-w-sm mb-6">
                Workspaces gather your data models and experiments. Create a workspace to get started.
              </p>
              <button
                onClick={() => openModal("createWorkspace")}
                className="px-6 py-2.5 bg-orange-500 text-white rounded font-semibold text-sm hover:bg-orange-600 shadow transition-all"
              >
                Create Workspace
              </button>
            </div>
          ) : !selectedExperiment ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white/70 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="p-4 bg-indigo-50 text-indigo-500 rounded-full mb-4">
                <FileText className="w-12 h-12 stroke-[1.5]" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Create your first Experiment</h2>
              <p className="text-sm text-gray-500 max-w-sm mb-6">
                Experiments correspond to a specific dataset model run in workspace "{selectedWorkspace.name}".
              </p>
              <button
                onClick={() => openModal("createExperiment")}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded font-semibold text-sm hover:bg-indigo-700 shadow transition-all"
              >
                Create Experiment
              </button>
            </div>
          ) : (
            <div className="h-full bg-white">
              {children}
            </div>
          )}
        </div>
      </div>

      {/* Global Modals Portal Backdrop */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-100">
          <div className="bg-white border border-gray-200 rounded-lg shadow-2xl p-6 w-96 max-w-full animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-bold text-gray-800">
                {modalType === "createWorkspace" && "Create Workspace"}
                {modalType === "renameWorkspace" && "Rename Workspace"}
                {modalType === "deleteWorkspace" && "Delete Workspace"}
                {modalType === "createExperiment" && "Create Experiment"}
                {modalType === "renameExperiment" && "Rename Experiment"}
                {modalType === "deleteExperiment" && "Delete Experiment"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              {modalType === "deleteWorkspace" || modalType === "deleteExperiment" ? (
                <div className="text-sm text-gray-600 leading-relaxed">
                  <div className="font-bold text-base text-gray-800 mb-1">Are you sure?</div>
                  This will permanently delete the {modalType === "deleteWorkspace" ? "workspace" : "experiment"}{" "}
                  <span className="font-bold text-red-600">
                    "{modalType === "deleteWorkspace" ? targetWorkspace?.name : targetExperiment?.name}"
                  </span>.
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={modalInputName}
                    onChange={(e) => setModalInputName(e.target.value)}
                    placeholder="Enter name..."
                    autoFocus
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded text-xs font-semibold ${
                    modalType === "deleteWorkspace" || modalType === "deleteExperiment"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}
                >
                  {modalType?.startsWith("create") && "Create"}
                  {modalType?.startsWith("rename") && "Save"}
                  {modalType?.startsWith("delete") && "Delete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Toast Banner Overlay */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`border rounded-lg shadow-xl px-4 py-3 flex items-center gap-3 w-80 max-w-full ${
              toast.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-green-50 border-green-200 text-green-800"
            }`}
          >
            <div className="flex-1 text-sm font-semibold">{toast.message}</div>
            <button
              onClick={() => setToast(null)}
              className="p-0.5 hover:bg-black/5 rounded text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/authentication");
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  if (isAuthorized === null) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50 font-sans">
        <div className="flex flex-col items-center gap-3">
          <Brain className="w-12 h-12 stroke-[2.5] text-orange-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-500">Checking authorization...</span>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </WorkspaceProvider>
  );
}
