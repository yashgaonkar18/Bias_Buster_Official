"use client";

import React from "react";

const phaseConfig = {
  VALIDATE: {
    title: "Validation Pipeline",
    description:
      "BiasBuster is validating uploaded assets and preparing the fairness analysis pipeline.",
    steps: [
      "Dataset Validation",
      "Model Verification",
      "Schema Analysis",
      "Pipeline Initialization",
    ],
  },
  DETECT: {
    title: "Bias Detection Engine",
    description:
      "BiasBuster is analyzing sensitive attributes, calculating fairness metrics, and detecting demographic bias patterns.",
    steps: [
      "Fairness Metric Analysis",
      "Sensitive Attribute Audit",
      "Bias Pattern Detection",
      "Generating Fairness Report",
    ],
  },
  MITIGATE: {
    title: "Bias Mitigation Engine",
    description:
      "BiasBuster is applying mitigation strategies and optimizing fairness across demographic groups.",
    steps: [
      "Mitigation Strategy Setup",
      "Bias Reduction Processing",
      "Fairness Optimization",
      "Generating Mitigated Model",
    ],
  },
  OPTIMIZE: {
    title: "Fairness-Aware Optimization",
    description:
      "BiasBuster is running hyperparameter optimization to restore accuracy while preserving fairness gains.",
    steps: [
      "Parameter Search Setup",
      "Trial Evaluation",
      "Best Params Selection",
      "Optimized Model Evaluation",
    ],
  },
  COMPARE: {
    title: "Model Comparison Engine",
    description:
      "BiasBuster is fetching and comparing all model variants across accuracy and fairness dimensions.",
    steps: [
      "Loading Model Registry",
      "Computing Combined Scores",
      "Ranking Model Variants",
      "Generating Comparison Report",
    ],
  },
  RECOMMEND: {
    title: "Strategy Recommendation Engine",
    description:
      "BiasBuster is analyzing your dataset's fairness profile and computing the optimal mitigation strategy for your model.",
    steps: [
      "Fairness Profile Analysis",
      "Strategy Scoring",
      "Tradeoff Evaluation",
      "Generating Recommendation Report",
    ],
  },
};

export default function ProcessingLoader({
  step,
  phase,
}: {
  step: string;
  phase: string;
}) {
  const current =
    phaseConfig[phase as keyof typeof phaseConfig] ||
    phaseConfig.VALIDATE;

  return (
    <div className="min-h-[600px] flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Top Accent */}
          <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-red-500 to-orange-400" />

          <div className="p-10">
            {/* Header */}
            <div className="flex items-start gap-5">
              {/* Loader */}
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl border-4 border-orange-100"></div>
                <div className="absolute inset-0 rounded-2xl border-4 border-orange-500 border-t-transparent animate-spin"></div>
              </div>

              {/* Text */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {current.title}
                </h2>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  {current.description}
                </p>

                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-orange-50 border border-orange-100 px-4 py-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-orange-700">
                    {step}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </span>
                <span className="text-xs font-semibold text-gray-700">
                  Processing
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full w-2/3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Steps */}
            <div className="mt-10 grid grid-cols-2 gap-4">
              {current.steps.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="text-sm font-medium text-gray-700">
                      {item}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}