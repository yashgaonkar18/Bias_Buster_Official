"use client";

import { Download, X } from "lucide-react";

export default function DownloadModal({
  model,
  onConfirm,
  onClose,
}: any) {

  if (!model) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">

        <div className="p-6 border-b flex justify-between items-center">

          <div>
            <h3 className="text-xl font-bold text-gray-800">
              Download Preview
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Review artifact metadata before download.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">

            <div className="flex justify-between">
              <span className="text-xs text-gray-500">
                Model
              </span>

              <span className="text-xs font-bold">
                {model.model_name}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-xs text-gray-500">
                Accuracy
              </span>

              <span className="text-xs font-bold">
                {model.accuracy?.toFixed(3)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-xs text-gray-500">
                Fairness
              </span>

              <span className="text-xs font-bold">
                {model.fairness_score?.toFixed(3)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 rounded-b-2xl flex gap-3">

          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border rounded-xl"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              onConfirm(model.model_id, model.download_url);
              onClose();
            }}
            className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}