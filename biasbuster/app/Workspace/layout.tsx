"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Brain,
  MoreVertical,
  Search,
  Plus,
  Settings,
  Folder,
  ChevronDown,
  ChevronRight,
  BarChart3,
  FileText,
  Clock,
  X,
  Play,
} from "lucide-react";
import { WorkspaceProvider, useWorkspace } from "./WorkspaceContext";
import { useRouter } from "next/navigation";

function WorkspaceLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const {
    activeRequest,
    setActiveRequest,
    requestMethod,
    setRequestMethod,
    currentPhase,
    mitigationResults,
    uploadDatasetAndModel,
    runBiasDetection,
    applyMitigation,
    applyOptimization,
    fetchComparison,
    selectedStrategy,
    optMethod,
  } = useWorkspace();

  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const settingsBtnRef = useRef<HTMLButtonElement | null>(null);

  // Mock collections for now to match user UI
  const [collections] = useState([
    {
      name: "My Workspace",
      requests: [
        { id: "dataset-test-1", name: "Gender Bias Analysis", method: "VALIDATE" }
      ]
    }
  ]);
  const [selectedCollection, setSelectedCollection] = useState("My Workspace");

  const handleSend = () => {
    if (requestMethod === "VALIDATE") uploadDatasetAndModel();
    else if (requestMethod === "DETECT") runBiasDetection();
    else if (requestMethod === "MITIGATE") applyMitigation(selectedStrategy);
    else if (requestMethod === "OPTIMIZE") applyOptimization();
    else if (requestMethod === "COMPARE") fetchComparison();
  };

  // Sync route with requestMethod
  useEffect(() => {
    const path = `/Workspace/${requestMethod.toLowerCase()}`;
    if (window.location.pathname !== path) {
      router.push(path);
    }
  }, [requestMethod, router]);

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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfile]);

  const activeRequestObj = collections[0].requests.find(r => r.id === activeRequest) || collections[0].requests[0];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Left Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col relative">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 flex items-center justify-center">
              <Brain className="size-8 stroke-[2.5] text-orange-500" />
            </div>
            <span className="font-display text-xl tracking-wider text-foreground uppercase">
              BiasBuster
            </span>
          </div>
          <button className="p-1.5 hover:bg-gray-100 rounded">
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Workspace Selector */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Workspace
          </div>
          <div className="relative">
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {collections.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
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
              <div className="text-xs font-semibold text-gray-500 uppercase">
                Collections
              </div>
              <button className="p-1.5 hover:bg-gray-100 rounded">
                <Plus className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-1">
              {collections.map((col) => (
                <div key={col.name} className="mb-3">
                  <div className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer">
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                    <Folder className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium">{col.name}</span>
                  </div>
                  <div className="ml-6 space-y-0.5 mt-1">
                    {col.requests.map((req) => (
                      <div
                        key={req.id}
                        onClick={() => setActiveRequest(req.id)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer ${activeRequest === req.id ? "bg-orange-50 text-orange-700" : "hover:bg-gray-100"}`}
                      >
                        <span className={`text-xs px-1.5 py-0.5 rounded ${activeRequest === req.id ? "bg-orange-500 text-white" : "bg-blue-100 text-blue-700"}`}>
                          {req.method}
                        </span>
                        <span className="text-sm truncate">{req.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="px-4 py-3 border-t border-gray-200 space-y-2 relative">
          <button className="w-full px-3 py-2 text-sm font-medium bg-orange-500 text-white rounded hover:bg-orange-600 flex items-center justify-center gap-2">
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
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-gray-200 overflow-hidden">
                    <Image src="/Screenshot 2024-10-14 212938.png" alt="avatar" width={40} height={40} />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-sm font-semibold truncate">Yash Gaonkar</div>
                    <div className="text-[10px] text-gray-500 truncate">yashgaonkar2020@gmail.com</div>
                  </div>
                </div>
                <div className="mt-3 border-t border-gray-100 pt-3 space-y-1">
                  <button className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 flex items-center gap-2 text-sm">
                    <BarChart3 className="w-4 h-4 text-gray-400" /> Dashboard
                  </button>
                  <button className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-gray-400" /> My Requests
                  </button>
                  <button className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" /> Recent Activity
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Tabs */}
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

        {/* Sub-Header (Method Selector) */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
          <select
            value={requestMethod}
            onChange={(e) => setRequestMethod(e.target.value)}
            className="font-phase px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            <option value="VALIDATE">VALIDATE</option>
            <option value="DETECT" disabled={currentPhase === "UPLOAD"}>DETECT</option>
            <option value="MITIGATE" disabled={!["BIAS_DETECTED", "ATTRIBUTES_SELECTED"].includes(currentPhase)}>MITIGATE</option>
            <option value="OPTIMIZE" disabled={!mitigationResults}>OPTIMIZE</option>
            <option value="COMPARE" disabled={!mitigationResults}>COMPARE</option>
          </select>

          <button 
            onClick={handleSend}
            className="px-6 py-2 bg-orange-500 text-white text-sm font-semibold rounded hover:bg-orange-600 flex items-center gap-2 shadow-sm"
          >
            <Play className="w-4 h-4" /> Send
          </button>
        </div>

        {/* Tab Bar */}
        <div className="bg-white border-b border-gray-200 px-6">
            <div className="flex gap-6">
                <button className="px-1 py-3 text-sm font-medium text-orange-600 border-b-2 border-orange-500">
                    Params
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <WorkspaceLayoutInner>{children}</WorkspaceLayoutInner>
    </WorkspaceProvider>
  );
}
