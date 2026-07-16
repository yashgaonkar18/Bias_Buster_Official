"""Fairness experiment report generation and persistence."""

from __future__ import annotations

import json
import textwrap
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional
from uuid import uuid4

import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.bias_mitigation import BiasMitigationRun
from app.models.experiment import ExperimentRun, FairnessExperimentReport
from app.models.models import OptimizationRun, CorrectionRecord, UploadRecord
from app.services.model_registry_service import ModelRegistryService


def _safe_round(value: Any, digits: int = 4) -> Any:
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return round(float(value), digits)
    return value


def _normalize_metric(value: Any, fallback: float = 0.0) -> float:
    if value is None:
        return fallback
    try:
        if isinstance(value, str) and not value.strip():
            return fallback
        return float(value)
    except (TypeError, ValueError):
        return fallback


def _extract_best_variant(
    models: list[Dict[str, Any]], source_types: list[str]
) -> Optional[Dict[str, Any]]:
    candidates = [model for model in models if model.get("source_type") in source_types]
    if not candidates:
        return None
    return max(candidates, key=lambda item: item.get("combined_score", 0.0))


def _lookup_model_name(
    models: list[Dict[str, Any]], model_id: Optional[str]
) -> Optional[str]:
    if not model_id:
        return None
    for model in models:
        if model.get("model_id") == model_id:
            return model.get("model_name")
    return model_id


def _interpret_tradeoff(accuracy_gain: float, fairness_gain: float) -> str:
    if fairness_gain >= 0.08 and accuracy_gain >= 0:
        return "Strong fairness improvement with no measurable accuracy loss."
    if fairness_gain >= 0.08 and accuracy_gain > -0.03:
        return "Good fairness gain with acceptable accuracy trade-off."
    if fairness_gain < 0.03 and accuracy_gain < 0:
        return "Limited fairness gain; revisit feature treatment or data quality."
    if accuracy_gain < -0.05:
        return (
            "Accuracy loss is material; this variant may be too costly for production."
        )
    return "Balanced trade-off suitable for review by the deployment owner."


def _build_section_flags(
    comparison: Optional[Dict[str, Any]],
    experiment: Optional[ExperimentRun],
    optimization: Optional[OptimizationRun],
    mitigation: Optional[BiasMitigationRun],
    correction: Optional[CorrectionRecord],
    request_flags: Dict[str, Optional[bool]],
) -> Dict[str, bool]:
    defaults = {
        "comparison": comparison is not None,
        "optimization": optimization is not None,
        "experiments": experiment is not None,
        "explainability": correction is not None,
    }

    resolved = dict(defaults)
    if mitigation is not None:
        resolved["comparison"] = True

    for key, requested in request_flags.items():
        if requested is not None:
            resolved[key] = requested

    return resolved


def _model_chart_data(comparison: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not comparison:
        return {"labels": [], "datasets": [], "scatter": []}

    models = comparison.get("models", []) or []
    labels = [
        model.get("model_name", model.get("model_id", "Model")) for model in models
    ]
    accuracy = [_normalize_metric(model.get("accuracy")) for model in models]
    fairness = [_normalize_metric(model.get("fairness_score")) for model in models]
    combined = [_normalize_metric(model.get("combined_score")) for model in models]

    scatter = [
        {
            "label": model.get("model_name", model.get("model_id", "Model")),
            "x": _normalize_metric(model.get("accuracy")),
            "y": _normalize_metric(model.get("fairness_score")),
            "combined": _normalize_metric(model.get("combined_score")),
            "source_type": model.get("source_type", "unknown"),
        }
        for model in models
    ]

    return {
        "labels": labels,
        "datasets": [
            {"label": "Accuracy", "data": accuracy},
            {"label": "Fairness Score", "data": fairness},
            {"label": "Combined Score", "data": combined},
        ],
        "scatter": scatter,
    }


def _format_model_line(model: Dict[str, Any]) -> str:
    return (
        f"{model.get('source_type', 'model').title()}: {model.get('model_name', 'Model')} | "
        f"accuracy={_normalize_metric(model.get('accuracy')):.3f}, "
        f"fairness={_normalize_metric(model.get('fairness_score')):.3f}, "
        f"combined={_normalize_metric(model.get('combined_score')):.3f}"
    )


def _render_pdf(report_payload: Dict[str, Any], pdf_path: Path) -> None:
    pdf_path.parent.mkdir(parents=True, exist_ok=True)

    with PdfPages(pdf_path) as pdf:
        fig = plt.figure(figsize=(8.27, 11.69))
        fig.patch.set_facecolor("white")
        ax = fig.add_axes([0, 0, 1, 1])
        ax.axis("off")

        title = report_payload.get("title", "Fairness Experiment Report")
        overview = report_payload.get("overview", {})
        summary = report_payload.get("summary", "")

        ax.text(0.06, 0.96, title, fontsize=20, fontweight="bold", va="top")
        ax.text(0.06, 0.92, summary, fontsize=10.5, va="top", wrap=True)

        metrics = overview.get("key_metrics", {})
        lines = [
            f"Upload ID: {overview.get('upload_id')}",
            f"Dataset: {overview.get('dataset_filename', 'Unknown')}",
            f"Model: {overview.get('model_filename', 'Unknown')}",
            f"Best Balanced Model: {overview.get('best_balanced_model_name', 'N/A')}",
            f"Best Accuracy Model: {overview.get('best_accuracy_model_name', 'N/A')}",
            f"Best Fairness Model: {overview.get('best_fairness_model_name', 'N/A')}",
            f"Accuracy: {metrics.get('accuracy', 0.0):.3f}",
            f"Fairness Score: {metrics.get('fairness_score', 0.0):.3f}",
            f"DPD: {metrics.get('dpd', 0.0):.3f}",
            f"EOD: {metrics.get('eod', 0.0):.3f}",
            f"DIR: {metrics.get('dir', 0.0):.3f}",
        ]

        y = 0.82
        for line in lines:
            ax.text(0.06, y, line, fontsize=10, va="top")
            y -= 0.028

        section_lines = [
            f"Sections: {', '.join([name for name, enabled in report_payload.get('section_flags', {}).items() if enabled]) or 'none'}",
            f"Sections: {', '.join([name for name, enabled in report_payload.get('section_flags', {}).items() if enabled]) or 'none'}",
            f"Generated at: {report_payload.get('generated_at', '')}",
        ]
        y -= 0.02
        for line in section_lines:
            ax.text(0.06, y, line, fontsize=9.5, va="top", style="italic")
            y -= 0.022

        pdf.savefig(fig, bbox_inches="tight")
        plt.close(fig)

        tradeoff = report_payload.get("chart_data", {}).get("scatter", [])
        fig, ax = plt.subplots(figsize=(8.27, 11.69))
        fig.patch.set_facecolor("white")
        ax.set_title(
            "Accuracy vs Fairness Trade-off", fontsize=16, fontweight="bold", pad=18
        )
        ax.set_xlabel("Accuracy")
        ax.set_ylabel("Fairness Score")
        ax.grid(True, linestyle="--", alpha=0.25)

        if tradeoff:
            palette = {
                "original": "#6B7280",
                "mitigated": "#2563EB",
                "optimized": "#7C3AED",
                "retrained": "#059669",
            }
            for point in tradeoff:
                color = palette.get(point.get("source_type"), "#EA580C")
                ax.scatter(point.get("x", 0.0), point.get("y", 0.0), s=80, color=color)
                ax.annotate(
                    point.get("label", "Model"),
                    (point.get("x", 0.0), point.get("y", 0.0)),
                    textcoords="offset points",
                    xytext=(6, 5),
                    fontsize=8,
                )
            max_x = max(point.get("x", 0.0) for point in tradeoff)
            max_y = max(point.get("y", 0.0) for point in tradeoff)
            ax.set_xlim(0, min(1.0, max(1.0, max_x + 0.05)))
            ax.set_ylim(0, min(1.0, max(1.0, max_y + 0.05)))
        else:
            ax.text(
                0.5,
                0.5,
                "No comparison data available.",
                ha="center",
                va="center",
                transform=ax.transAxes,
            )

        pdf.savefig(fig, bbox_inches="tight")
        plt.close(fig)

        fig = plt.figure(figsize=(8.27, 11.69))
        fig.patch.set_facecolor("white")
        ax = fig.add_axes([0, 0, 1, 1])
        ax.axis("off")
        ax.text(
            0.06,
            0.96,
            "Model Ranking and Interpretation",
            fontsize=16,
            fontweight="bold",
            va="top",
        )

        interpretation = report_payload.get("interpretation", {})
        interpretation_lines = textwrap.wrap(
            interpretation.get("summary", ""), width=90
        )
        y = 0.91
        for line in interpretation_lines:
            ax.text(0.06, y, line, fontsize=10, va="top")
            y -= 0.024

        y -= 0.02
        for model in report_payload.get("comparison_models", []):
            wrapped = textwrap.wrap(_format_model_line(model), width=90)
            for line in wrapped:
                ax.text(0.06, y, line, fontsize=9.3, va="top")
                y -= 0.022
            y -= 0.01
            if y < 0.08:
                break

        if report_payload.get("section_flags", {}).get("experiments"):
            y -= 0.02
            ax.text(
                0.06, y, "Latest Experiment", fontsize=12, fontweight="bold", va="top"
            )
            y -= 0.03
            experiment = report_payload.get("experiments", {}).get("latest")
            if experiment:
                experiment_lines = textwrap.wrap(
                    experiment.get("insights", ""), width=90
                )
                for line in experiment_lines[:8]:
                    ax.text(0.06, y, line, fontsize=9.2, va="top")
                    y -= 0.021

        pdf.savefig(fig, bbox_inches="tight")
        plt.close(fig)


async def generate_fairness_experiment_report(
    payload: Any,
    session: AsyncSession,
) -> Dict[str, Any]:
    upload = (
        await session.execute(
            select(UploadRecord).where(UploadRecord.id == payload.upload_id)
        )
    ).scalar_one_or_none()

    if not upload:
        raise ValueError("Upload record not found")

    comparison = await ModelRegistryService.compare_models(payload.upload_id, session)
    comparison_dict = comparison.model_dump() if comparison else None

    experiment = (
        await session.execute(
            select(ExperimentRun)
            .where(ExperimentRun.upload_id == payload.upload_id)
            .order_by(desc(ExperimentRun.created_at))
            .limit(1)
        )
    ).scalar_one_or_none()

    optimization = (
        await session.execute(
            select(OptimizationRun)
            .where(OptimizationRun.upload_id == payload.upload_id)
            .order_by(desc(OptimizationRun.created_at))
            .limit(1)
        )
    ).scalar_one_or_none()

    mitigation = (
        await session.execute(
            select(BiasMitigationRun)
            .where(BiasMitigationRun.upload_id == payload.upload_id)
            .order_by(desc(BiasMitigationRun.created_at))
            .limit(1)
        )
    ).scalar_one_or_none()

    correction = (
        await session.execute(
            select(CorrectionRecord)
            .where(CorrectionRecord.upload_id == payload.upload_id)
            .order_by(desc(CorrectionRecord.created_at))
            .limit(1)
        )
    ).scalar_one_or_none()

    request_flags = {
        "optimization": payload.include_optimization,
        "experiments": payload.include_experiments,
        "explainability": payload.include_explainability,
    }
    section_flags = _build_section_flags(
        comparison_dict,
        experiment,
        optimization,
        mitigation,
        correction,
        request_flags,
    )

    comparison_models = comparison_dict.get("models", []) if comparison_dict else []
    best_balanced = None
    if comparison_dict:
        best_balanced_id = comparison_dict.get("best_balanced_model")
        best_balanced = next(
            (
                model
                for model in comparison_models
                if model.get("model_id") == best_balanced_id
            ),
            None,
        ) or _extract_best_variant(
            comparison_models, ["optimized", "mitigated", "original"]
        )

    best_original = _extract_best_variant(comparison_models, ["original"])

    key_metrics = best_balanced or (comparison_models[0] if comparison_models else {})
    before_accuracy = _normalize_metric(
        best_original.get("accuracy") if best_original else None
    )
    after_accuracy = _normalize_metric(
        best_balanced.get("accuracy") if best_balanced else None
    )
    before_fairness = _normalize_metric(
        best_original.get("fairness_score") if best_original else None
    )
    after_fairness = _normalize_metric(
        best_balanced.get("fairness_score") if best_balanced else None
    )

    accuracy_gain = after_accuracy - before_accuracy
    fairness_gain = after_fairness - before_fairness

    interpretation_summary = _interpret_tradeoff(accuracy_gain, fairness_gain)
    if best_balanced:
        interpretation_summary = (
            f"{interpretation_summary} The best balanced model is "
            f"{best_balanced.get('model_name', 'the selected model')} with combined score "
            f"{_normalize_metric(best_balanced.get('combined_score')):.3f}."
        )

    generated_at = datetime.utcnow().isoformat() + "Z"
    report_id = str(uuid4())
    title = payload.title or f"Fairness Experiment Report - Upload {payload.upload_id}"

    report_payload: Dict[str, Any] = {
        "report_id": report_id,
        "title": title,
        "generated_at": generated_at,
        "section_flags": section_flags,
        "overview": {
            "upload_id": upload.id,
            "dataset_filename": upload.original_dataset_filename
            or upload.dataset_filename,
            "model_filename": upload.original_model_filename or upload.model_filename,
            "model_type": upload.model_type,
            "best_balanced_model_name": (
                best_balanced.get("model_name") if best_balanced else None
            ),
            "best_accuracy_model_name": (
                _lookup_model_name(
                    comparison_models, comparison_dict.get("best_accuracy_model")
                )
                if comparison_dict
                else None
            ),
            "best_fairness_model_name": (
                _lookup_model_name(
                    comparison_models, comparison_dict.get("best_fairness_model")
                )
                if comparison_dict
                else None
            ),
            "key_metrics": {
                "accuracy": _normalize_metric(
                    key_metrics.get("accuracy") if key_metrics else None
                ),
                "fairness_score": _normalize_metric(
                    key_metrics.get("fairness_score") if key_metrics else None
                ),
                "dpd": _normalize_metric(
                    key_metrics.get("dpd") if key_metrics else None
                ),
                "eod": _normalize_metric(
                    key_metrics.get("eod") if key_metrics else None
                ),
                "dir": _normalize_metric(
                    key_metrics.get("dir") if key_metrics else None
                ),
                "combined_score": _normalize_metric(
                    key_metrics.get("combined_score") if key_metrics else None
                ),
            },
        },
        "summary": (
            f"{title} summarizes the current fairness state for upload {upload.id}. "
            f"Accuracy changed by {accuracy_gain:+.3f} and fairness score changed by {fairness_gain:+.3f}. "
            f"{interpretation_summary}"
        ),
        "interpretation": {
            "summary": interpretation_summary,
            "accuracy_change": _safe_round(accuracy_gain),
            "fairness_change": _safe_round(fairness_gain),
        },
        "comparison_models": comparison_models,
        "chart_data": _model_chart_data(comparison_dict),
        "experiments": {
            "latest": experiment.model_dump() if experiment else None,
            "latest_optimization": (
                {
                    "optimization_id": optimization.optimization_id,
                    "optimization_method": optimization.optimization_method,
                    "best_params": optimization.best_params,
                    "metrics_before": optimization.metrics_before,
                    "metrics_after": optimization.metrics_after,
                    "improvements": optimization.improvements,
                    "status": optimization.status,
                }
                if optimization
                else None
            ),
            "latest_mitigation": (
                {
                    "id": mitigation.id,
                    "strategy_used": mitigation.strategy_used,
                    "artifact_model_path": mitigation.artifact_model_path,
                    "artifact_dataset_path": mitigation.artifact_dataset_path,
                }
                if mitigation
                else None
            ),
            "latest_correction": (
                {
                    "correction_id": correction.correction_id,
                    "summary": correction.summary,
                    "metrics_before": correction.metrics_before,
                    "metrics_after": correction.metrics_after,
                }
                if correction
                else None
            ),
        },
    }

    report_dir = Path(settings.ARTIFACT_DIR) / "reports"
    report_dir.mkdir(parents=True, exist_ok=True)

    pdf_path = report_dir / f"{report_id}.pdf"
    json_path = report_dir / f"{report_id}.json"

    _render_pdf(report_payload, pdf_path)

    with json_path.open("w", encoding="utf-8") as handle:
        json.dump(report_payload, handle, indent=2, ensure_ascii=True, default=str)

    report_record = FairnessExperimentReport(
        report_id=report_id,
        upload_id=upload.id,
        experiment_id=experiment.experiment_id if experiment else None,
        title=title,
        section_flags=section_flags,
        report_payload=report_payload,
        pdf_path=str(pdf_path),
        json_path=str(json_path),
        summary=report_payload["summary"],
    )
    session.add(report_record)
    await session.commit()
    await session.refresh(report_record)

    return {
        "report_id": report_id,
        "upload_id": upload.id,
        "title": title,
        "summary": report_payload["summary"],
        "section_flags": section_flags,
        "report_payload": report_payload,
        "pdf_download_url": f"/api/report/download/{report_id}",
        "json_download_url": f"/api/report/download-json/{report_id}",
        "created_at": report_record.created_at,
    }
