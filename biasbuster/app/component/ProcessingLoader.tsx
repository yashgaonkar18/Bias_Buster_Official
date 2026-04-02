"use client";
import React from "react";

export default function ProcessingLoader({ step }: { step: string }) {
  return (
    <div className="mb-6 p-6 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center gap-4">

        <div className="relative">
          <div className="h-10 w-10 rounded-full border-4 border-blue-200"></div>
          <div className="absolute top-0 left-0 h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        </div>

        <div>
          <div className="text-sm font-semibold text-blue-800">
            Processing Request
          </div>

          <div className="text-xs text-blue-600 mt-1">
            {step}
          </div>
        </div>
      </div>

      <div className="mt-4 w-full bg-blue-100 rounded-full h-2 overflow-hidden">
        <div className="h-full bg-blue-500 animate-pulse w-2/3"></div>
      </div>
    </div>
  );
}