"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
    Activity,
    BarChart3,
    BookOpen,
    Brain,
    CheckCircle2,
    ChevronDown,
    CircleDot,
    Database,
    FileText,
    Layers3,
    Menu,
    Rocket,
    Search,
    Shield,
    Target,
    Workflow,
    FlaskConical,
    GraduationCap,
    Network,
    Cpu,
    Gauge,
    ClipboardList,
    Clock3,
    Lightbulb,
    Binary,
    Library,
} from "lucide-react";

type DocPage = {
    id: string;
    title: string;
    category: string;
    icon: React.ReactNode;
    content: React.ReactNode;
};

const categories = [
    "Get Started",
    "Project",
    "System",
    "Bias Detection",
    "Bias Mitigation",
    "Datasets",
    "Implementation",
    "Research",
    "Quality",
    "Results",
];
const docs: DocPage[] = [{
    id: "overview",
    title: "Overview",
    category: "Get Started",
    icon: <BookOpen className="size-4" />,
    content: (
        <>
            <p>
                BiasBuster is a unified no-code platform for detecting,
                analysing and mitigating demographic bias in machine
                learning classification models.
            </p>

            <p>
                The toolkit allows users to upload a trained
                scikit-learn model together with a CSV dataset,
                evaluate fairness, apply mitigation strategies,
                optimize the model and export a complete fairness audit.
            </p>

            <div className="rounded-xl border bg-slate-50 p-4 mt-4">
                <h4 className="font-semibold mb-2">
                    Documentation Overview
                </h4>

                <ul className="list-disc ml-5 space-y-2">
                    <li>What is BiasBuster</li>
                    <li>Workflow</li>
                    <li>Architecture</li>
                    <li>Bias Detection</li>
                    <li>Bias Mitigation</li>
                    <li>Benchmark Datasets</li>
                    <li>API Reference</li>
                    <li>Results</li>
                    <li>Testing</li>
                    <li>Conclusion</li>
                </ul>
            </div>
        </>
    ),
}, {
    id: "what-is",
    title: "What is BiasBuster?",
    category: "Get Started",
    icon: <Brain className="size-4" />,
    content: (
        <>
            <p>
                BiasBuster is a unified fairness platform built for
                students, researchers and practitioners who want to
                evaluate fairness without manually implementing
                fairness mathematics.
            </p>

            <p>
                The system provides automated fairness evaluation,
                mitigation recommendations and comprehensive
                reporting through an intuitive web interface.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">
                Core Idea
            </h3>

            <p>
                Fairness should be as easy to measure as model
                accuracy.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mt-6">

                <div className="rounded-xl border p-4">
                    <h4 className="font-semibold mb-2">
                        ✔ Detect
                    </h4>

                    <p>
                        Automatically computes fairness metrics
                        for demographic groups.
                    </p>
                </div>

                <div className="rounded-xl border p-4">
                    <h4 className="font-semibold mb-2">
                        ✔ Mitigate
                    </h4>

                    <p>
                        Applies multiple debiasing strategies
                        automatically.
                    </p>
                </div>

                <div className="rounded-xl border p-4">
                    <h4 className="font-semibold mb-2">
                        ✔ Compare
                    </h4>

                    <p>
                        Compare original and mitigated models
                        side-by-side.
                    </p>
                </div>

                <div className="rounded-xl border p-4">
                    <h4 className="font-semibold mb-2">
                        ✔ Report
                    </h4>

                    <p>
                        Generate professional PDF fairness reports.
                    </p>
                </div>

            </div>
        </>
    ),
}, {
    id: "workflow",
    title: "Workflow",
    category: "Get Started",
    icon: <Workflow className="size-4" />,
    content: (
        <>
            <p>
                BiasBuster follows a complete fairness evaluation
                pipeline from data upload to report generation.
            </p>

            <ol className="list-decimal ml-6 mt-4 space-y-3">
                <li>Upload CSV dataset.</li>
                <li>Upload trained Scikit-learn model (.pkl).</li>
                <li>Select target attribute.</li>
                <li>Select sensitive attribute(s).</li>
                <li>Run fairness evaluation.</li>
                <li>Receive mitigation recommendation.</li>
                <li>Apply mitigation.</li>
                <li>Optimize model using GridSearchCV or Optuna.</li>
                <li>Generate PDF fairness report.</li>
            </ol>
        </>
    ),
}, {
    id: "black-box",
    title: "Why Black-box Evaluation",
    category: "Get Started",
    icon: <Cpu className="size-4" />,
    content: (
        <>
            <p>
                BiasBuster evaluates fairness using model inputs
                and prediction outputs rather than inspecting
                internal model parameters.
            </p>

            <p>
                This approach enables compatibility with any
                scikit-learn classification model regardless of
                architecture.
            </p>

            <ul className="list-disc ml-5 mt-4 space-y-2">
                <li>No access to model weights required.</li>
                <li>Works across multiple classifiers.</li>
                <li>Produces model-independent fairness reports.</li>
                <li>Supports reusable fairness evaluation workflows.</li>
            </ul>
        </>
    ),
},
{
    id: "requirements",
    title: "Requirements & Tech Stack",
    category: "System",
    icon: <Gauge className="size-4" />,
    content: (
        <>
            <p>
                BiasBuster is designed to run on commodity hardware while
                leveraging a modern machine learning and web development stack.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">
                Hardware Requirements
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-xl">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="border p-3 text-left">Component</th>
                            <th className="border p-3 text-left">Requirement</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr>
                            <td className="border p-3">Processor</td>
                            <td className="border p-3">Intel i3 / Ryzen 3 or higher</td>
                        </tr>

                        <tr>
                            <td className="border p-3">RAM</td>
                            <td className="border p-3">8 GB</td>
                        </tr>

                        <tr>
                            <td className="border p-3">Storage</td>
                            <td className="border p-3">20 GB SSD</td>
                        </tr>

                        <tr>
                            <td className="border p-3">Graphics</td>
                            <td className="border p-3">Integrated Graphics</td>
                        </tr>

                        <tr>
                            <td className="border p-3">Internet</td>
                            <td className="border p-3">Optional</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3 className="text-lg font-semibold mt-8 mb-3">
                Software Stack
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-xl">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="border p-3 text-left">Layer</th>
                            <th className="border p-3 text-left">Technology</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr>
                            <td className="border p-3">Frontend</td>
                            <td className="border p-3">
                                Next.js 15, React 19, TypeScript, Tailwind CSS
                            </td>
                        </tr>

                        <tr>
                            <td className="border p-3">Backend</td>
                            <td className="border p-3">
                                FastAPI, Python 3.12, Uvicorn
                            </td>
                        </tr>

                        <tr>
                            <td className="border p-3">Database</td>
                            <td className="border p-3">
                                PostgreSQL 17, SQLAlchemy, Alembic
                            </td>
                        </tr>

                        <tr>
                            <td className="border p-3">Machine Learning</td>
                            <td className="border p-3">
                                Scikit-learn, Fairlearn,
                                Imbalanced-learn, Pandas,
                                NumPy, Joblib
                            </td>
                        </tr>

                        <tr>
                            <td className="border p-3">Reporting</td>
                            <td className="border p-3">
                                ReportLab, WeasyPrint
                            </td>
                        </tr>

                        <tr>
                            <td className="border p-3">Development</td>
                            <td className="border p-3">
                                Git, GitHub, Docker, Postman
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    ),
},

{
    id: "libraries",
    title: "Why These Libraries",
    category: "System",
    icon: <Library className="size-4" />,
    content: (
        <>
            <p>
                Every library in BiasBuster was selected to provide
                production-ready fairness evaluation while minimizing
                custom implementation.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mt-6">

                <div className="rounded-xl border p-4">
                    <h4 className="font-semibold mb-2">
                        Fairlearn
                    </h4>

                    <p>
                        Provides fairness metrics and mitigation algorithms
                        including Threshold Optimization.
                    </p>
                </div>

                <div className="rounded-xl border p-4">
                    <h4 className="font-semibold mb-2">
                        Imbalanced-learn
                    </h4>

                    <p>
                        Used for SMOTE oversampling to reduce class imbalance.
                    </p>
                </div>

                <div className="rounded-xl border p-4">
                    <h4 className="font-semibold mb-2">
                        Scikit-learn
                    </h4>

                    <p>
                        Handles model loading, prediction,
                        GridSearchCV, pipelines and evaluation.
                    </p>
                </div>

                <div className="rounded-xl border p-4">
                    <h4 className="font-semibold mb-2">
                        ReportLab
                    </h4>

                    <p>
                        Generates downloadable fairness audit reports.
                    </p>
                </div>

            </div>
        </>
    ),
},

{
    id: "problem",
    title: "Problem Statement",
    category: "Project",
    icon: <Target className="size-4" />,
    content: (
        <>
            <p>
                Machine learning models often inherit historical
                discrimination present within training datasets.
            </p>

            <p>
                Bias may originate from data collection,
                feature engineering,
                algorithms or historical human decisions.
            </p>

            <p>
                Existing fairness toolkits are powerful but fragmented,
                making them difficult for students and non-experts.
            </p>

            <p>
                Since accuracy and fairness frequently conflict,
                both should be evaluated together.
            </p>
        </>
    ),
},

{
    id: "motivation",
    title: "Motivation",
    category: "Project",
    icon: <Lightbulb className="size-4" />,
    content: (
        <>
            <p>
                Fairness-aware machine learning aims to detect,
                measure and reduce discriminatory behaviour while
                preserving predictive performance.
            </p>

            <p>
                BiasBuster was created as an end-to-end fairness
                workflow that detects bias,
                recommends mitigation,
                optimizes models
                and generates downloadable reports.
            </p>
        </>
    ),
},

{
    id: "research-gap",
    title: "Research Gap",
    category: "Project",
    icon: <Binary className="size-4" />,
    content: (
        <>
            <p>
                Most existing tools focus on only one stage of the
                fairness pipeline such as detection,
                mitigation or visualization.
            </p>

            <p>
                BiasBuster integrates fairness evaluation,
                mitigation,
                optimization,
                reporting
                and recommendations into a unified platform.
            </p>
        </>
    ),
},

{
    id: "objectives",
    title: "Objectives",
    category: "Project",
    icon: <ClipboardList className="size-4" />,
    content: (
        <>
            <ul className="list-disc ml-6 space-y-3">
                <li>Detect demographic bias clearly and interpretably.</li>

                <li>
                    Mitigate unfairness using Reweighting,
                    SMOTE and Threshold Optimization.
                </li>

                <li>
                    Compare original and mitigated models.
                </li>

                <li>
                    Increase awareness of fairness in
                    high-impact machine learning applications.
                </li>
            </ul>
        </>
    ),
},
{
    id: "architecture",
    title: "System Architecture",
    category: "System",
    icon: <Layers3 className="size-4" />,
    content: (
        <>
            <p>
                BiasBuster follows a three-layer architecture that separates
                presentation, application logic, and machine learning
                processing to ensure scalability and maintainability.
            </p>

            <div className="grid gap-4 mt-6">

                <div className="rounded-xl border p-5 bg-slate-50">
                    <h3 className="font-semibold text-lg mb-2">
                        Presentation Layer
                    </h3>

                    <ul className="list-disc ml-5 space-y-2">
                        <li>Next.js 15 + React 19 Frontend</li>
                        <li>Dataset & Model Upload</li>
                        <li>Attribute Selection</li>
                        <li>Interactive Charts</li>
                        <li>PDF Report Download</li>
                    </ul>
                </div>

                <div className="flex justify-center text-3xl font-bold">
                    ↓
                </div>

                <div className="rounded-xl border p-5 bg-slate-50">
                    <h3 className="font-semibold text-lg mb-2">
                        Application Layer
                    </h3>

                    <ul className="list-disc ml-5 space-y-2">
                        <li>FastAPI REST Backend</li>
                        <li>JWT Authentication</li>
                        <li>Business Logic</li>
                        <li>Recommendation Engine</li>
                        <li>Request Validation</li>
                    </ul>
                </div>

                <div className="flex justify-center text-3xl font-bold">
                    ↓
                </div>

                <div className="rounded-xl border p-5 bg-slate-50">
                    <h3 className="font-semibold text-lg mb-2">
                        Data Processing Layer
                    </h3>

                    <ul className="list-disc ml-5 space-y-2">
                        <li>Scikit-learn</li>
                        <li>Fairlearn</li>
                        <li>Imbalanced-learn</li>
                        <li>PostgreSQL</li>
                        <li>ReportLab / WeasyPrint</li>
                    </ul>
                </div>

            </div>
        </>
    ),
},

{
    id: "modules",
    title: "System Modules",
    category: "System",
    icon: <Network className="size-4" />,
    content: (
        <>
            <p>
                BiasBuster consists of six independent modules that work
                together to provide a complete fairness workflow.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mt-6">

                <div className="rounded-xl border p-4">
                    <h4 className="font-semibold">
                        1. Dataset & Model Ingestion
                    </h4>

                    <p className="mt-2 text-gray-600">
                        Upload CSV datasets and trained Scikit-learn models.
                    </p>
                </div>

                <div className="rounded-xl border p-4">
                    <h4 className="font-semibold">
                        2. Preprocessing
                    </h4>

                    <p className="mt-2 text-gray-600">
                        Validate data, detect columns and prepare features.
                    </p>
                </div>

                <div className="rounded-xl border p-4">
                    <h4 className="font-semibold">
                        3. Bias Detection
                    </h4>

                    <p className="mt-2 text-gray-600">
                        Compute fairness metrics and classify bias severity.
                    </p>
                </div>

                <div className="rounded-xl border p-4">
                    <h4 className="font-semibold">
                        4. Mitigation
                    </h4>

                    <p className="mt-2 text-gray-600">
                        Apply debiasing strategies automatically.
                    </p>
                </div>

                <div className="rounded-xl border p-4">
                    <h4 className="font-semibold">
                        5. Visualization
                    </h4>

                    <p className="mt-2 text-gray-600">
                        Interactive dashboards and fairness comparisons.
                    </p>
                </div>

                <div className="rounded-xl border p-4">
                    <h4 className="font-semibold">
                        6. Report Generation
                    </h4>

                    <p className="mt-2 text-gray-600">
                        Generate downloadable PDF fairness audit reports.
                    </p>
                </div>

            </div>
        </>
    ),
},

{
    id: "pipeline",
    title: "Backend Pipeline",
    category: "System",
    icon: <Workflow className="size-4" />,
    content: (
        <>
            <p>
                Every uploaded dataset follows the same processing
                pipeline before generating the final report.
            </p>

            <div className="space-y-5 mt-6">

                <div className="rounded-xl border p-4">
                    <h4 className="font-semibold">
                        Step 1 — Data Ingestion
                    </h4>

                    <p className="mt-2">
                        Upload CSV dataset and trained model.
                    </p>
                </div>

                <div className="text-center text-2xl">
                    ↓
                </div>

                <div className="rounded-xl border p-4">
                    <h4 className="font-semibold">
                        Step 2 — Data Validation
                    </h4>

                    <p className="mt-2">
                        Validate schema, detect missing values and identify
                        target and sensitive attributes.
                    </p>
                </div>

                <div className="text-center text-2xl">
                    ↓
                </div>

                <div className="rounded-xl border p-4">
                    <h4 className="font-semibold">
                        Step 3 — Fairness Evaluation
                    </h4>

                    <p className="mt-2">
                        Compute DPD, DIR and EOD metrics.
                    </p>
                </div>

                <div className="text-center text-2xl">
                    ↓
                </div>

                <div className="rounded-xl border p-4">
                    <h4 className="font-semibold">
                        Step 4 — Mitigation
                    </h4>

                    <p className="mt-2">
                        Apply Reweighting, SMOTE or Threshold Optimization.
                    </p>
                </div>

                <div className="text-center text-2xl">
                    ↓
                </div>

                <div className="rounded-xl border p-4">
                    <h4 className="font-semibold">
                        Step 5 — Optimization
                    </h4>

                    <p className="mt-2">
                        Optimize using GridSearchCV or Optuna while balancing
                        fairness and predictive performance.
                    </p>
                </div>

                <div className="text-center text-2xl">
                    ↓
                </div>

                <div className="rounded-xl border p-4 bg-green-50">
                    <h4 className="font-semibold">
                        Step 6 — Report Generation
                    </h4>

                    <p className="mt-2">
                        Produce downloadable fairness reports containing
                        metrics, mitigation strategy, execution time,
                        comparison charts and recommendations.
                    </p>
                </div>

            </div>
        </>
    ),
},
{
    id: "bias-detection",
    title: "Bias Detection",
    category: "Bias Detection",
    icon: <Activity className="size-4" />,
    content: (
        <>
            <p>
                The Bias Detection module evaluates demographic fairness by
                comparing prediction outcomes across privileged and
                unprivileged groups.
            </p>

            <p>
                The system automatically computes fairness metrics and
                classifies the overall severity of bias before recommending
                an appropriate mitigation strategy.
            </p>

            <div className="rounded-xl border bg-slate-50 p-5 mt-6">
                <h4 className="font-semibold mb-3">
                    Detection Workflow
                </h4>

                <ol className="list-decimal ml-6 space-y-2">
                    <li>Load trained model</li>
                    <li>Generate predictions</li>
                    <li>Identify privileged and unprivileged groups</li>
                    <li>Compute fairness metrics</li>
                    <li>Compare with thresholds</li>
                    <li>Classify severity</li>
                    <li>Recommend mitigation strategy</li>
                </ol>
            </div>
        </>
    ),
},

{
    id: "metrics",
    title: "Fairness Metrics",
    category: "Bias Detection",
    icon: <BarChart3 className="size-4" />,
    content: (
        <>
            <p>
                BiasBuster evaluates fairness using three industry-standard
                fairness metrics.
            </p>

            <div className="grid md:grid-cols-3 gap-4 mt-6">

                <div className="rounded-xl border p-5">
                    <h4 className="font-semibold mb-2">
                        Demographic Parity Difference (DPD)
                    </h4>

                    <p>
                        Measures the difference in positive prediction rates
                        between privileged and unprivileged groups.
                    </p>
                </div>

                <div className="rounded-xl border p-5">
                    <h4 className="font-semibold mb-2">
                        Disparate Impact Ratio (DIR)
                    </h4>

                    <p>
                        Measures whether one group receives favorable outcomes
                        significantly more often than another.
                    </p>
                </div>

                <div className="rounded-xl border p-5">
                    <h4 className="font-semibold mb-2">
                        Equal Opportunity Difference (EOD)
                    </h4>

                    <p>
                        Compares the true positive rates between demographic
                        groups.
                    </p>
                </div>

            </div>
        </>
    ),
},

{
    id: "thresholds",
    title: "Threshold Values",
    category: "Bias Detection",
    icon: <Gauge className="size-4" />,
    content: (
        <>
            <p>
                Fairness metrics are interpreted using predefined thresholds.
            </p>

            <div className="overflow-x-auto mt-6">
                <table className="w-full border">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="border p-3 text-left">Metric</th>
                            <th className="border p-3 text-left">Ideal</th>
                            <th className="border p-3 text-left">Threshold</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr>
                            <td className="border p-3">
                                Demographic Parity Difference
                            </td>

                            <td className="border p-3">
                                0
                            </td>

                            <td className="border p-3">
                                ≤ 0.10
                            </td>
                        </tr>

                        <tr>
                            <td className="border p-3">
                                Disparate Impact Ratio
                            </td>

                            <td className="border p-3">
                                1
                            </td>

                            <td className="border p-3">
                                ≥ 0.80
                            </td>
                        </tr>

                        <tr>
                            <td className="border p-3">
                                Equal Opportunity Difference
                            </td>

                            <td className="border p-3">
                                0
                            </td>

                            <td className="border p-3">
                                ≤ 0.10
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3 className="text-lg font-semibold mt-8 mb-3">
                Severity Levels
            </h3>

            <ul className="list-disc ml-6 space-y-2">
                <li><strong>Low:</strong> All metrics satisfy thresholds.</li>
                <li><strong>Moderate:</strong> One metric exceeds threshold.</li>
                <li><strong>High:</strong> Multiple metrics exceed thresholds.</li>
            </ul>
        </>
    ),
},

{
    id: "mitigation",
    title: "Bias Mitigation",
    category: "Bias Mitigation",
    icon: <Shield className="size-4" />,
    content: (
        <>
            <p>
                BiasBuster supports multiple mitigation strategies to reduce
                demographic unfairness while maintaining predictive
                performance.
            </p>

            <div className="grid md:grid-cols-3 gap-4 mt-6">

                <div className="rounded-xl border p-5">
                    <h4 className="font-semibold mb-2">
                        Reweighting
                    </h4>

                    <p>
                        Adjusts sample weights so that disadvantaged groups
                        contribute more during model training.
                    </p>
                </div>

                <div className="rounded-xl border p-5">
                    <h4 className="font-semibold mb-2">
                        SMOTE
                    </h4>

                    <p>
                        Balances minority classes using synthetic samples before
                        retraining the classifier.
                    </p>
                </div>

                <div className="rounded-xl border p-5">
                    <h4 className="font-semibold mb-2">
                        Threshold Optimization
                    </h4>

                    <p>
                        Learns separate decision thresholds for demographic
                        groups to improve fairness.
                    </p>
                </div>

            </div>

            <p className="mt-6">
                After mitigation, fairness metrics and model performance are
                recomputed and compared with the baseline model.
            </p>
        </>
    ),
},

{
    id: "optimization",
    title: "Model Optimization",
    category: "Bias Mitigation",
    icon: <FlaskConical className="size-4" />,
    content: (
        <>
            <p>
                BiasBuster optimizes both predictive performance and
                fairness using automated hyperparameter search.
            </p>

            <div className="grid md:grid-cols-2 gap-5 mt-6">

                <div className="rounded-xl border p-5">
                    <h4 className="font-semibold mb-2">
                        GridSearchCV
                    </h4>

                    <ul className="list-disc ml-5 space-y-2">
                        <li>Cross-validation</li>
                        <li>Parameter search</li>
                        <li>Best estimator selection</li>
                        <li>Accuracy optimization</li>
                    </ul>
                </div>

                <div className="rounded-xl border p-5">
                    <h4 className="font-semibold mb-2">
                        Optuna
                    </h4>

                    <ul className="list-disc ml-5 space-y-2">
                        <li>Bayesian optimization</li>
                        <li>Automatic parameter tuning</li>
                        <li>Fairness-aware optimization</li>
                        <li>Execution time tracking</li>
                    </ul>
                </div>

            </div>

            <p className="mt-6">
                The final report stores the best-performing configuration,
                fairness metrics, accuracy, and optimization time for future
                comparison.
            </p>
        </>
    ),
},
{
    id: "datasets",
    title: "Benchmark Datasets",
    category: "Datasets",
    icon: <Database className="size-4" />,
    content: (
        <>
            <p>
                BiasBuster was evaluated using widely adopted benchmark
                datasets from fairness research. Each dataset contains
                demographic attributes that enable group fairness analysis.
            </p>

            <div className="grid md:grid-cols-3 gap-5 mt-6">

                <div className="rounded-xl border p-5">
                    <h4 className="font-semibold text-lg mb-3">
                        Adult Income
                    </h4>

                    <p className="mb-3">
                        Predict whether an individual's annual income exceeds
                        $50K.
                    </p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li>Sex</li>
                        <li>Race</li>
                        <li>Age</li>
                    </ul>

                    <div className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm">
                        70 / 30 Stratified Split
                    </div>
                </div>

                <div className="rounded-xl border p-5">
                    <h4 className="font-semibold text-lg mb-3">
                        COMPAS Recidivism
                    </h4>

                    <p className="mb-3">
                        Predict criminal recidivism while evaluating racial
                        fairness.
                    </p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li>Race</li>
                        <li>Sex</li>
                        <li>Age Category</li>
                    </ul>

                    <div className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm">
                        70 / 30 Stratified Split
                    </div>
                </div>

                <div className="rounded-xl border p-5">
                    <h4 className="font-semibold text-lg mb-3">
                        Healthcare Test Result
                    </h4>

                    <p className="mb-3">
                        Evaluate fairness in healthcare outcome prediction.
                    </p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li>Gender</li>
                        <li>Age</li>
                        <li>Blood Type</li>
                    </ul>

                    <div className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm">
                        70 / 30 Stratified Split
                    </div>
                </div>

            </div>
        </>
    ),
},

{
    id: "dataset-details",
    title: "Dataset Details",
    category: "Datasets",
    icon: <ClipboardList className="size-4" />,
    content: (
        <>
            <p>
                Every benchmark dataset follows a consistent evaluation
                workflow before fairness analysis.
            </p>

            <div className="overflow-x-auto mt-6">
                <table className="w-full border border-gray-200">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="border p-3 text-left">Dataset</th>
                            <th className="border p-3 text-left">Target</th>
                            <th className="border p-3 text-left">Sensitive Attributes</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr>
                            <td className="border p-3">Adult Income</td>
                            <td className="border p-3">Income</td>
                            <td className="border p-3">
                                Sex, Race, Age
                            </td>
                        </tr>

                        <tr>
                            <td className="border p-3">COMPAS</td>
                            <td className="border p-3">Recidivism</td>
                            <td className="border p-3">
                                Race, Sex, Age Category
                            </td>
                        </tr>

                        <tr>
                            <td className="border p-3">Healthcare</td>
                            <td className="border p-3">
                                Test Result
                            </td>
                            <td className="border p-3">
                                Gender, Age, Blood Type
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <p className="mt-6">
                All datasets are divided using a
                <strong> 70% training </strong>
                and
                <strong> 30% testing </strong>
                split before evaluation.
            </p>
        </>
    ),
},

{
    id: "api",
    title: "API Reference",
    category: "Implementation",
    icon: <FileText className="size-4" />,
    content: (
        <>
            <p>
                BiasBuster exposes REST APIs for every major stage of the
                fairness pipeline.
            </p>

            <div className="space-y-4 mt-6">

                <div className="rounded-xl border p-5">
                    <h4 className="font-semibold text-green-600">
                        POST /upload
                    </h4>

                    <p className="mt-2">
                        Upload a CSV dataset together with a trained
                        Scikit-learn model.
                    </p>
                </div>

                <div className="rounded-xl border p-5">
                    <h4 className="font-semibold text-blue-600">
                        GET /api/validate
                    </h4>

                    <p className="mt-2">
                        Validate uploaded files and infer dataset schema.
                    </p>
                </div>

                <div className="rounded-xl border p-5">
                    <h4 className="font-semibold text-purple-600">
                        POST /api/detect-bias
                    </h4>

                    <p className="mt-2">
                        Compute fairness metrics and classify demographic bias.
                    </p>
                </div>

                <div className="rounded-xl border p-5">
                    <h4 className="font-semibold text-orange-600">
                        POST /api/mitigate
                    </h4>

                    <p className="mt-2">
                        Apply Reweighting, SMOTE or Threshold Optimization to
                        improve fairness.
                    </p>
                </div>

                <div className="rounded-xl border p-5">
                    <h4 className="font-semibold text-red-600">
                        GET /api/report
                    </h4>

                    <p className="mt-2">
                        Generate and download a comprehensive PDF fairness
                        audit report.
                    </p>
                </div>

            </div>
        </>
    ),
},
{
    id: "testing",
    title: "Testing Summary",
    category: "Results",
    icon: <CheckCircle2 className="size-4" />,
    content: (
        <>
            <p>
                BiasBuster underwent comprehensive validation using multiple
                testing methodologies to ensure correctness, reliability,
                performance and usability.
            </p>

            <div className="overflow-x-auto mt-6">
                <table className="w-full border">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="border p-3 text-left">Testing Type</th>
                            <th className="border p-3 text-left">Status</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr>
                            <td className="border p-3">Unit Testing</td>
                            <td className="border p-3 text-green-600 font-semibold">Passed</td>
                        </tr>
                        <tr>
                            <td className="border p-3">Integration Testing</td>
                            <td className="border p-3 text-green-600 font-semibold">Passed</td>
                        </tr>
                        <tr>
                            <td className="border p-3">System Testing</td>
                            <td className="border p-3 text-green-600 font-semibold">Passed</td>
                        </tr>
                        <tr>
                            <td className="border p-3">User Acceptance Testing</td>
                            <td className="border p-3 text-green-600 font-semibold">Passed</td>
                        </tr>
                        <tr>
                            <td className="border p-3">Performance Testing</td>
                            <td className="border p-3 text-green-600 font-semibold">Passed</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="rounded-xl border bg-green-50 p-5 mt-6">
                <h4 className="font-semibold">Overall Result</h4>
                <p className="mt-2">
                    76 documented test cases executed with a 100% pass rate.
                </p>
            </div>
        </>
    ),
},

{
    id: "results",
    title: "Results & Observations",
    category: "Results",
    icon: <BarChart3 className="size-4" />,
    content: (
        <>
            <p>
                Experimental evaluation demonstrated measurable fairness
                improvements across multiple datasets after mitigation.
            </p>

            <div className="grid md:grid-cols-2 gap-5 mt-6">

                <div className="rounded-xl border p-5">
                    <h4 className="font-semibold">🏆 Threshold Optimization</h4>
                    <p className="mt-2">
                        Delivered the most consistent fairness improvements while
                        preserving predictive accuracy.
                    </p>
                </div>

                <div className="rounded-xl border p-5">
                    <h4 className="font-semibold">⚠ SMOTE</h4>
                    <p className="mt-2">
                        Reduced bias in some cases but occasionally decreased
                        model performance.
                    </p>
                </div>

                <div className="rounded-xl border p-5">
                    <h4 className="font-semibold">COMPAS Dataset</h4>
                    <p className="mt-2">
                        Exhibited the strongest baseline bias and showed the
                        greatest improvement after Threshold Optimization.
                    </p>
                </div>

                <div className="rounded-xl border p-5">
                    <h4 className="font-semibold">German Credit</h4>
                    <p className="mt-2">
                        Baseline bias was relatively mild, while SMOTE reduced
                        predictive performance.
                    </p>
                </div>

            </div>
        </>
    ),
},

{
    id: "timeline",
    title: "Project Timeline",
    category: "Results",
    icon: <Clock3 className="size-4" />,
    content: (
        <>
            <p>
                Development progressed through eleven major phases between
                July 2025 and July 2026.
            </p>

            <div className="mt-6 space-y-4">

                {[
                    "Problem Definition",
                    "Literature Review",
                    "Requirement Analysis",
                    "System Design",
                    "Frontend Development",
                    "Backend Development",
                    "Bias Detection Module",
                    "Mitigation Module",
                    "Testing & Evaluation",
                    "Documentation",
                    "Final Submission"
                ].map((phase, index) => (
                    <div
                        key={phase}
                        className="flex items-center gap-4 rounded-xl border p-4"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white font-bold">
                            {index + 1}
                        </div>

                        <div>
                            <h4 className="font-semibold">{phase}</h4>
                        </div>
                    </div>
                ))}

            </div>
        </>
    ),
},

{
    id: "literature",
    title: "Literature Survey",
    category: "Research",
    icon: <GraduationCap className="size-4" />,
    content: (
        <>
            <p>
                BiasBuster is inspired by several fairness-aware machine
                learning research papers.
            </p>

            <div className="mt-6 space-y-4">

                <details className="rounded-xl border p-4">
                    <summary className="cursor-pointer font-semibold">
                        Ethical AI: Balancing Bias Mitigation and Fairness
                    </summary>

                    <p className="mt-3">
                        Introduces a four-stage Ethical AI framework and concludes
                        that no single fairness metric is universally applicable.
                    </p>
                </details>

                <details className="rounded-xl border p-4">
                    <summary className="cursor-pointer font-semibold">
                        FairerML Platform
                    </summary>

                    <p className="mt-3">
                        Demonstrates interactive dashboards, fairness comparison
                        tools and visualization techniques.
                    </p>
                </details>

                <details className="rounded-xl border p-4">
                    <summary className="cursor-pointer font-semibold">
                        Survey on Bias and Fairness
                    </summary>

                    <p className="mt-3">
                        Reviews multiple fairness metrics and mitigation
                        strategies used across modern machine learning systems.
                    </p>
                </details>

                <details className="rounded-xl border p-4">
                    <summary className="cursor-pointer font-semibold">
                        Interactive Bias Detection
                    </summary>

                    <p className="mt-3">
                        Proposes a human-in-the-loop fairness workflow that
                        inspired BiasBuster's recommendation engine.
                    </p>
                </details>

                <details className="rounded-xl border p-4">
                    <summary className="cursor-pointer font-semibold">
                        BeFair Banking
                    </summary>

                    <p className="mt-3">
                        Demonstrates that removing sensitive attributes alone is
                        insufficient because proxy variables can still introduce
                        discrimination.
                    </p>
                </details>

            </div>
        </>
    ),
},

{
    id: "conclusion",
    title: "Conclusion",
    category: "Results",
    icon: <Rocket className="size-4" />,
    content: (
        <>
            <p>
                BiasBuster integrates dataset upload, fairness evaluation,
                mitigation, optimization and PDF report generation into a
                unified workflow.
            </p>

            <p>
                Experimental results demonstrate that fairness can be
                improved while maintaining competitive predictive
                performance, although every mitigation strategy involves
                practical trade-offs.
            </p>

            <div className="rounded-xl border bg-green-50 p-5 mt-6">
                <h4 className="font-semibold mb-2">
                    Final Takeaway
                </h4>

                <p>
                    The modular architecture enables future extensions such as
                    additional fairness metrics, explainable AI techniques,
                    deep learning support and domain-specific bias analysis.
                </p>
            </div>
        </>
    ),
}
];
export default function DocsPage() {
    const [activeId, setActiveId] = useState("overview");
    const [query, setQuery] = useState("");
    const [mobileOpen, setMobileOpen] = useState(false);

    const filteredDocs = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return docs;
        return docs.filter(
            d =>
                d.title.toLowerCase().includes(q) ||
                d.category.toLowerCase().includes(q) ||
                d.id.toLowerCase().includes(q)
        );
    }, [query]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.find((e) => e.isIntersecting);

                if (visible?.target.id) {
                    setActiveId(visible.target.id);
                }
            },
            {
                rootMargin: "-30% 0px -55% 0px",
                threshold: 0,
            }
        );

        docs.forEach((doc) => {
            const el = document.getElementById(doc.id);

            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);
    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });

        setActiveId(id);
        setMobileOpen(false);
    };

    return (
        <div className="min-h-screen bg-[#f8f7f4] text-[#111827]">
            <style jsx global>{`
        html { scroll-behavior: smooth; }
        .topbar {
          position: fixed; top: 0; left: 0; right: 0; height: 64px;
          background: rgba(248,247,244,0.92); backdrop-filter: blur(10px);
          border-bottom: 1px solid #e5e7eb; z-index: 100; display: flex;
          align-items: center; padding: 0 20px; gap: 14px;
        }
        .brand { display: flex; align-items: center; gap: 10px; font-weight: 800; letter-spacing: -0.02em; }
        .search {
          margin-left: auto; display: flex; align-items: center; gap: 10px;
          border: 1px solid #e5e7eb; background: white; border-radius: 12px;
          padding: 10px 12px; min-width: 320px;
        }
        .search input { width: 100%; outline: none; background: transparent; font-size: 14px; }
        .layout { padding-top: 64px; display: flex; }
        .sidebar {
          width: 280px; flex-shrink: 0; border-right: 1px solid #e5e7eb;
          background: #f8f7f4; height: calc(100vh - 64px); overflow-y: auto;
          position: sticky; top: 64px; padding: 18px 12px;
        }
        .sidebar-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; padding: 10px 12px 8px; }
        .nav-item {
          display: flex; align-items: center; gap: 10px; width: 100%; text-align: left;
          padding: 10px 12px; border-radius: 10px; font-size: 14px; color: #4b5563;
        }
        .nav-item:hover { background: #fff; color: #111827; }
        .nav-item.active { background: #111827; color: #f8f7f4; }
        .dot { width: 6px; height: 6px; border-radius: 999px; background: #cbd5e1; flex-shrink: 0; }
        .nav-item.active .dot { background: #86efac; }
        .main { flex: 1; display: flex; justify-content: center; min-width: 0; }
        .content { width: 100%; max-width: 860px; padding: 28px 28px 120px; }
        .section {
          background: white; border: 1px solid #e5e7eb; border-radius: 18px;
          padding: 28px; margin-bottom: 18px; box-shadow: 0 1px 2px rgba(0,0,0,.03);
        }
        .eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #16a34a; margin-bottom: 12px; }
        .title { font-size: 34px; line-height: 1.05; font-weight: 800; letter-spacing: -0.03em; margin: 0; }
        .lede { margin-top: 12px; color: #6b7280; font-size: 16px; max-width: 680px; }
        .page-title { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 12px; }
        .page-text { color: #374151; }
        .toc {
          width: 220px; flex-shrink: 0; padding: 24px 16px 24px 0;
          position: sticky; top: 64px; height: calc(100vh - 64px); overflow-y: auto;
        }
        .toc-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; margin-bottom: 10px; }
        .toc button { display: block; width: 100%; text-align: left; padding: 6px 0 6px 12px; border-left: 1px solid #e5e7eb; color: #4b5563; font-size: 13px; }
        .toc button:hover { color: #16a34a; border-left-color: #16a34a; }
        .cards { display: grid; gap: 14px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .card {
          background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 18px;
        }
        .card h4 { margin: 0 0 8px; font-size: 14px; font-weight: 700; }
        .card p { margin: 0; color: #6b7280; font-size: 13px; }
         @media (max-width: 1024px) {
          .toc { display: none; }
        }
        @media (max-width: 900px) {
          .sidebar {
            position: fixed; left: 0; top: 64px; z-index: 120; transform: translateX(-100%);
            transition: transform .2s ease; width: 280px;
          }
          .sidebar.open { transform: translateX(0); }
          .content { padding: 20px 16px 100px; }
          .search { min-width: 0; width: 100%; }
          .topbar { padding: 0 14px; }
          .cards { grid-template-columns: 1fr; }
        }
      `}</style>

            <header className="topbar">
                <button className="md:hidden rounded-lg border border-gray-200 bg-white p-2" onClick={() => setMobileOpen(v => !v)} aria-label="Toggle navigation">
                    <Menu className="size-5" />
                </button>

                <Link href="/" className="flex items-center gap-2 group">
                    <div className="size-8 flex items-center justify-center text-foreground">
                        <Brain className="size-8 stroke-[2.5]" />
                    </div>
                    <span className="font-display text-xl tracking-wider text-foreground uppercase">
                        BiasBuster
                    </span>
                </Link>

                <div className="search">
                    <Search className="size-4 text-gray-400" />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documentation" />
                </div>
            </header>

            <div className="layout">
                <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
                    {categories.map((cat) => {
                        const items = filteredDocs.filter((d) => d.category === cat);
                        if (!items.length) return null;
                        return (
                            <div key={cat} className="mb-5">
                                <div className="sidebar-title">{cat}</div>
                                <div className="space-y-1">
                                    {items.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => scrollTo(item.id)}
                                            className={`nav-item ${activeId === item.id ? "active" : ""}`}
                                        >
                                            {item.icon}

                                            <span>{item.title}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </aside>

                <main className="main">
                    <div className="content">
                        <section className="section">
                            <div className="eyebrow">Documentation</div>
                            <h1 className="title">BiasBuster</h1>
                            <p className="lede">
                                A practical fairness toolkit for detecting bias, applying mitigation, and generating readable audit reports.
                            </p>
                        </section>

                        <section className="cards mb-5">
                            <div className="card">
                                <h4>Detect</h4>
                                <p>Bias metrics for group fairness evaluation.</p>
                            </div>
                            <div className="card">
                                <h4>Mitigate</h4>
                                <p>Reweighting, SMOTE, and threshold optimization.</p>
                            </div>
                            <div className="card">
                                <h4>Report</h4>
                                <p>Clear before/after summaries and exportable audits.</p>
                            </div>
                        </section>

                        <div className="space-y-4">
                            {filteredDocs.map((doc) => (
                                <section key={doc.id} id={doc.id} className="section scroll-mt-24">
                                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-[#f8fafc] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-600">
                                        <CircleDot className="size-3" />
                                        {doc.category}
                                    </div>
                                    <h2 className="page-title">{doc.title}</h2>
                                    <div className="page-text space-y-3">{doc.content}</div>
                                </section>
                            ))}
                        </div>
                    </div>
                </main>

                <aside className="toc">
                    <div className="toc-title">On this page</div>
                    {filteredDocs.map((doc) => (
                        <button
                            key={doc.id}
                            onClick={() => scrollTo(doc.id)}
                            className={`${activeId === doc.id
                                    ? "text-green-600 font-semibold border-l-green-600"
                                    : ""
                                }`}
                        >
                            {doc.title}
                        </button>
                    ))}
                </aside>
            </div>
        </div>
    );
}