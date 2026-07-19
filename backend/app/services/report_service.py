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
import io
import tempfile
from pathlib import Path as _Path


try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.enums import TA_CENTER
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import (
        SimpleDocTemplate,
        Paragraph,
        Spacer,
        Table,
        TableStyle,
        Image as RLImage,
        PageBreak,
        BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
    Table, TableStyle, Image as RLImage, HRFlowable, PageBreak,
    )

    REPORTLAB_AVAILABLE = True
except Exception:
    REPORTLAB_AVAILABLE = False
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


# ---------------------------------------------------------------- Palette ---
# Re-themed to match the React ComparisonDashboard component:
#   - Header banner: orange-500 -> amber-600 gradient (bg-gradient-to-r from-orange-500 to-amber-600)
#   - Accuracy accent: blue-500
#   - Fairness accent: green-500
#   - Combined score / "recommended" accent: orange-500 -> red-500 gradient
#   - Body text: gray-500 / gray-400 (Tailwind slate/gray scale)
#   - Card borders: gray-200, card fill: gray-50 / white

ORANGE, AMBER, BLUE = colors.HexColor("#F97316"), colors.HexColor("#D97706"), colors.HexColor("#3B82F6")
INK, SLATE, MUTED, LINE = colors.HexColor("#111827"), colors.HexColor("#6B7280"), colors.HexColor("#9CA3AF"), colors.HexColor("#E5E7EB")
BG_CARD = colors.HexColor("#F9FAFB")
GREEN, GREEN_LIGHT = colors.HexColor("#22C55E"), colors.HexColor("#F0FDF4")
RED, RED_LIGHT = colors.HexColor("#EF4444"), colors.HexColor("#FEF2F2")
BLUE_LIGHT = colors.HexColor("#EFF6FF")
PAGE_W, PAGE_H = A4
MARGIN = 0.62 * inch
CONTENT_W = PAGE_W - 2 * MARGIN  # full usable page width (in points), used to size full-bleed charts

styles = getSampleStyleSheet()
style_section = ParagraphStyle("Section", parent=styles["Heading2"], fontName="Helvetica-Bold",
                                fontSize=13, textColor=INK, spaceBefore=16, spaceAfter=8)
style_body = ParagraphStyle("Body", parent=styles["Normal"], fontName="Helvetica", fontSize=9.6, textColor=SLATE, leading=15)
style_card_label = ParagraphStyle("CardLabel", parent=styles["Normal"], fontName="Helvetica-Bold",  fontSize=8.2, textColor=MUTED, alignment=TA_CENTER)
style_card_value = ParagraphStyle("CardValue", parent=styles["Normal"], fontName="Helvetica-Bold",  fontSize=19, textColor=INK, alignment=TA_CENTER)
style_card_delta = ParagraphStyle("CardDelta", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=8.6, alignment=TA_CENTER)
style_table_head = ParagraphStyle("TableHead", parent=styles["Normal"], fontName="Helvetica-Bold",  fontSize=8.4, textColor=colors.white)
style_table_cell = ParagraphStyle("TableCell", parent=styles["Normal"], fontName="Helvetica", fontSize=8.6, textColor=SLATE, leading=12)
style_table_cell_bold = ParagraphStyle("TableCellBold", parent=styles["Normal"], fontName="Helvetica-Bold",
                                        fontSize=8.6, textColor=INK, leading=12)
style_badge = ParagraphStyle("Badge", parent=styles["Normal"], fontName="Helvetica-Bold",  fontSize=8, alignment=TA_CENTER)


# ------------------------------------------------------------ small builders
def _metric_card(label: str, value: str, delta_text: str = None, accent=BLUE, delta_color=GREEN):
    rows = [[Paragraph(label.upper(), style_card_label)],
            [Paragraph(value, style_card_value)]]
    if delta_text:
        rows.append([Paragraph(delta_text, ParagraphStyle(
            "d", parent=style_card_delta, textColor=delta_color))])
    t = Table(rows, colWidths=[1.62 * inch])
    style = [
        ("BACKGROUND", (0, 0), (-1, -1), BG_CARD),
        ("LINEABOVE", (0, 0), (-1, 0), 2.6, accent),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, 0), 11), ("BOTTOMPADDING", (0, 0), (-1, 0), 2),
        ("TOPPADDING", (0, 1), (-1, 1), 2),
    ]
    style += [("BOTTOMPADDING", (0, 1), (-1, 1), 2 if delta_text else 11)]
    if delta_text:
        style += [("TOPPADDING", (0, 2), (-1, 2), 2), ("BOTTOMPADDING", (0, 2), (-1, 2), 11)]
    t.setStyle(TableStyle(style))
    return t


def _section(text):
    return Paragraph(text, style_section)


def _divider():
    return HRFlowable(width="100%", thickness=0.8, color=LINE, spaceBefore=2, spaceAfter=10)


def _fmt(v, digits=3):
    return f"{_normalize_metric(v):.{digits}f}"


# --------------------------------------------------------------- header/foot
def _make_header_footer(report_payload):
    title = report_payload.get("title", "Fairness Experiment Report")
    overview = report_payload.get("overview", {})
    generated_at = report_payload.get("generated_at", "")

    def draw(c, doc):
        c.saveState()
        band_h = 1.15 * inch

        # Emulate the React header's orange-500 -> amber-600 gradient with
        # a stepped multi-band fill (ReportLab has no native linear gradient fill for rects).
        steps = 24
        start_rgb, end_rgb = (0.976, 0.451, 0.086), (0.851, 0.467, 0.024)  # orange-500 -> amber-600
        for i in range(steps):
            t = i / (steps - 1)
            r = start_rgb[0] + (end_rgb[0] - start_rgb[0]) * t
            g = start_rgb[1] + (end_rgb[1] - start_rgb[1]) * t
            b = start_rgb[2] + (end_rgb[2] - start_rgb[2]) * t
            c.setFillColorRGB(r, g, b)
            seg_w = PAGE_W / steps
            c.rect(i * seg_w, PAGE_H - band_h, seg_w + 1, band_h, stroke=0, fill=1)

        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 18)
        c.drawString(MARGIN, PAGE_H - 0.58 * inch, title)

        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(colors.HexColor("#FFE8D1"))
        c.drawRightString(PAGE_W - MARGIN, PAGE_H - 0.55 * inch,  f"UPLOAD ID  {overview.get('upload_id', '-')}")
        c.setFont("Helvetica", 8)
        c.drawRightString(PAGE_W - MARGIN, PAGE_H - 0.70 * inch, overview.get("dataset_filename") or "-")
        c.drawRightString(PAGE_W - MARGIN, PAGE_H - 0.85 * inch, str(generated_at)[:10])

        c.setFont("Helvetica", 7.6)
        c.setFillColor(MUTED)
        c.drawString(MARGIN, 0.45 * inch, "Fairness Experiment Report — Automated Bias Audit")
        c.drawRightString(PAGE_W - MARGIN, 0.45 * inch, f"Page {doc.page}")
        c.setStrokeColor(LINE)
        c.line(MARGIN, 0.62 * inch, PAGE_W - MARGIN, 0.62 * inch)
        c.restoreState()

    return draw


# ------------------------------------------------------------------ charts
def _declutter_annotations(fig, anns, iterations: int = 60, min_gap_px: float = 3.0,
                            max_shift_px: float = 34.0) -> None:
    """Iteratively pushes overlapping annotation labels apart in pixel space.

    Matplotlib places each label at a fixed offset from its point, so when two
    points are close together (common with accuracy/fairness scores) the text
    boxes collide. This nudges colliding labels away from each other a little
    at a time until nothing overlaps (or the iteration budget runs out).

    Each label's total displacement is capped at `max_shift_px` so a cluster of
    many overlapping points can't push a label arbitrarily far away — that
    would both create long leader lines and blow up the saved figure's
    bounding box (since bbox_inches="tight" expands to fit wherever labels end
    up).
    """
    if len(anns) < 2:
        return

    fig.canvas.draw()
    renderer = fig.canvas.get_renderer()
    dpi = fig.dpi
    moved_total = [0.0] * len(anns)

    def _shift(idx, dx_px, dy_px):
        mag = (dx_px ** 2 + dy_px ** 2) ** 0.5
        if mag <= 0:
            return
        remaining = max_shift_px - moved_total[idx]
        if remaining <= 0:
            return
        if mag > remaining:
            scale = remaining / mag
            dx_px, dy_px, mag = dx_px * scale, dy_px * scale, remaining
        moved_total[idx] += mag
        dx_pt, dy_pt = dx_px * 72.0 / dpi, dy_px * 72.0 / dpi
        cur_dx, cur_dy = anns[idx].get_position()
        anns[idx].set_position((cur_dx + dx_pt, cur_dy + dy_pt))

    for _ in range(iterations):
        boxes = [ann.get_window_extent(renderer) for ann in anns]
        moved = False
        for i in range(len(anns)):
            for j in range(i + 1, len(anns)):
                bi, bj = boxes[i], boxes[j]
                if not bi.overlaps(bj):
                    continue
                cix, ciy = bi.x0 + bi.width / 2, bi.y0 + bi.height / 2
                cjx, cjy = bj.x0 + bj.width / 2, bj.y0 + bj.height / 2
                dx, dy = cjx - cix, cjy - ciy
                dist = (dx ** 2 + dy ** 2) ** 0.5 or 1.0
                ux, uy = dx / dist, dy / dist
                overlap_x = (bi.width + bj.width) / 2 - abs(dx)
                overlap_y = (bi.height + bj.height) / 2 - abs(dy)
                push = max(overlap_x, overlap_y, min_gap_px) / 2 + min_gap_px
                before_i, before_j = moved_total[i], moved_total[j]
                _shift(i, -ux * push, -uy * push)
                _shift(j, ux * push, uy * push)
                if moved_total[i] > before_i or moved_total[j] > before_j:
                    moved = True
        if not moved:
            break


def _save_tradeoff_chart(chart_data: Dict[str, Any], out_path: str) -> None:
    import math

    palette = {
        "original": "#9CA3AF",
        "mitigated": "#22C55E",
        "optimized": "#3B82F6",
        "retrained": "#F97316",
    }

    scatter = chart_data.get("scatter", []) or []

    # Remove duplicate points
    seen_points = set()
    deduped_scatter = []
    for pt in scatter:
        key = (
            pt.get("label"),
            round(pt.get("x", 0.0), 4),
            round(pt.get("y", 0.0), 4),
        )
        if key not in seen_points:
            seen_points.add(key)
            deduped_scatter.append(pt)

    scatter = deduped_scatter

    fig, ax = plt.subplots(figsize=(10.4, 10.4), dpi=200)
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")

    best = max(scatter, key=lambda p: p.get("combined", 0.0)) if scatter else None
    annotations = []

    # Angles used to spread labels around the cluster
    angles = [
        0, 35, 70, 105, 140,
        180, 220, 255, 290, 325
    ]

    LABEL_DISTANCE = 170

    for i, pt in enumerate(scatter):
        x = pt.get("x", 0.0)
        y = pt.get("y", 0.0)

        color = palette.get(pt.get("source_type"), "#F97316")
        is_best = pt is best

        ax.scatter(
            x,
            y,
            s=420 if is_best else 280,
            color=color,
            edgecolor="white",
            linewidth=2.0,
            zorder=5 if is_best else 4,
        )

        angle = math.radians(angles[i % len(angles)])

        offset_x = LABEL_DISTANCE * math.cos(angle)
        offset_y = LABEL_DISTANCE * math.sin(angle)

        ann = ax.annotate(
            pt.get("label", ""),
            (x, y),
            textcoords="offset points",
            xytext=(offset_x, offset_y),
            fontsize=13,
            color="#111827",
            fontweight="bold" if is_best else "normal",
            zorder=6,
            clip_on=False,
            arrowprops=dict(
                arrowstyle="-",
                color="#B0B8C4",
                lw=0.6,
                shrinkA=0,
                shrinkB=0,
            ),
        )

        annotations.append(ann)

    ax.plot(
        [0, 1],
        [0, 1],
        color="#E5E7EB",
        linestyle="--",
        linewidth=1.2,
        zorder=1,
    )

    ax.set_xlim(-0.06, 1.08)
    ax.set_ylim(-0.06, 1.08)

    ax.set_xlabel(
        "Accuracy",
        fontsize=15,
        color="#111827",
        fontweight="bold",
        labelpad=10,
    )

    ax.set_ylabel(
        "Fairness Score",
        fontsize=15,
        color="#111827",
        fontweight="bold",
        labelpad=10,
    )

    ax.grid(True, color="#E5E7EE", linewidth=0.9, zorder=0)

    for s in ("top", "right"):
        ax.spines[s].set_visible(False)

    for s in ("left", "bottom"):
        ax.spines[s].set_color("#9CA3AF")

    ax.tick_params(colors="#9CA3AF", labelsize=13)

    fig.tight_layout(pad=1.6)

    _declutter_annotations(fig, annotations)

    fig.savefig(
        out_path,
        dpi=200,
        bbox_inches="tight",
        pad_inches=0.15,
        transparent=True,
    )

    plt.close(fig)


# def _save_before_after_chart(report_payload: Dict[str, Any], out_path: str) -> None:
#     before = report_payload.get("overview", {}).get("key_metrics", {}) or {}
#     after_model = next(
#         (m for m in report_payload.get("comparison_models", []) if m.get("source_type") in ("mitigated", "optimized")),
#         {},
#     )
#     labels = ["DPD", "EOD", "DIR"]
#     before_vals = [_normalize_metric(before.get(k)) for k in ("dpd", "eod", "dir")]
#     after_vals = [_normalize_metric(after_model.get(k)) for k in ("dpd", "eod", "dir")]

#     x = range(len(labels))
#     width = 0.32
#     fig, ax = plt.subplots(figsize=(10.4, 5.6), dpi=200)
#     fig.patch.set_facecolor("white")
#     bars_before = ax.bar([i - width / 2 for i in x], before_vals, width, label="Before", color="#9CA3AF")
#     bars_after = ax.bar([i + width / 2 for i in x], after_vals, width, label="After", color="#22C55E")
#     ax.bar_label(bars_before, fmt="%.3f", fontsize=11, color="#4B5563", padding=3)
#     ax.bar_label(bars_after, fmt="%.3f", fontsize=11, color="#166534", padding=3)
#     ax.set_xticks(list(x)); ax.set_xticklabels(labels, fontsize=14, color="#111827", fontweight="bold")
#     ax.set_ylabel("Value", fontsize=14, color="#111827", fontweight="bold", labelpad=8)
#     ax.set_title("Before vs. After Fairness Metrics", fontsize=18, color="#111827", fontweight="bold", pad=16)
#     ax.legend(frameon=False, fontsize=13)
#     ax.grid(True, axis="y", color="#E5E7EE", linewidth=0.9, zorder=0)
#     for s in ("top", "right"):
#         ax.spines[s].set_visible(False)
#     ax.tick_params(colors="#9CA3AF", labelsize=13)
#     ax.margins(y=0.12)

#     fig.tight_layout(pad=1.6)
#     fig.savefig(out_path, dpi=200, bbox_inches="tight", transparent=True)
#     plt.close(fig)


# --------------------------------------------------------------- main build
def _render_pdf_reportlab(report_payload: Dict[str, Any], pdf_path: _Path) -> None:
    doc = BaseDocTemplate(
        str(pdf_path), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=1.4 * inch, bottomMargin=0.8 * inch,
        title=report_payload.get("title", "Fairness Experiment Report"),
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame],
                                        onPage=_make_header_footer(report_payload))])

    overview = report_payload.get("overview", {})
    km = overview.get("key_metrics", {}) or {}
    interp = report_payload.get("interpretation", {}) or {}
    comparison_models = report_payload.get("comparison_models", []) or []
    section_flags = report_payload.get("section_flags", {}) or {}
    acc_change = _normalize_metric(interp.get("accuracy_change"))
    fair_change = _normalize_metric(interp.get("fairness_change"))

    story = []

    logo_path="app/assets/logo.png"

    logo = RLImage(
    str(logo_path),
    width=6 * inch,
    height=4 * inch
    )
    logo.hAlign = "CENTER"

    story.append(logo)
    story.append(Spacer(1, 12))

    # status badges — direction computed from fetched values, not hardcoded
    fair_ok = fair_change >= 0
    acc_ok = acc_change >= 0
    badge_tbl = Table([[
        Paragraph(("▲ FAIRNESS IMPROVED" if fair_ok else "▼ FAIRNESS DECLINED"), ParagraphStyle("b1", parent=style_badge, textColor=GREEN if fair_ok else RED)),
        Paragraph(("● NO ACCURACY LOSS" if acc_ok else "● ACCURACY DECREASED"), ParagraphStyle("b2", parent=style_badge, textColor=BLUE if acc_ok else RED)),
    ]], colWidths=[2.7 * inch, 2.0 * inch])
    badge_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), GREEN_LIGHT if fair_ok else RED_LIGHT),
        ("BACKGROUND", (1, 0), (1, 0), BLUE_LIGHT if acc_ok else RED_LIGHT),
        ("BOX", (0, 0), (0, 0), 0.5, GREEN if fair_ok else RED),
        ("BOX", (1, 0), (1, 0), 0.5, BLUE if acc_ok else RED),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))
    story.append(badge_tbl)
    story.append(Spacer(1, 14))

    story.append(_section("Executive Summary"))
    story.append(Paragraph(report_payload.get("summary", ""), style_body))
    story.append(Spacer(1, 14))

    # KPI cards — accuracy=blue, fairness=green, combined/DIR=orange (mirrors React accents)
    cards = [
        _metric_card("Accuracy", _fmt(km.get("accuracy")), f"{'▲' if acc_change >= 0 else '▼'} {acc_change:+.3f}", BLUE, GREEN if acc_change >= 0 else RED),
        _metric_card("Fairness Score", _fmt(km.get("fairness_score")), f"{'▲' if fair_change >= 0 else '▼'} {fair_change:+.3f}", GREEN, GREEN if fair_change >= 0 else RED),
        _metric_card("Combined Score", _fmt(km.get("combined_score")), overview.get("best_balanced_model_name") or "—", ORANGE, MUTED),
        _metric_card("Disparate Impact", _fmt(km.get("dir")), "Ratio (DIR)", AMBER, MUTED),
    ]
    story.append(Table([cards], colWidths=[1.72 * inch] * 4, hAlign="LEFT"))
    story.append(Spacer(1, 18))

    story.append(_section("Dataset & Model Information"))
    info_tbl = Table([
        [Paragraph("DATASET", style_table_head), Paragraph("MODEL", style_table_head), Paragraph("SECTIONS INCLUDED", style_table_head)],
        [Paragraph(overview.get("dataset_filename") or "-", style_table_cell), Paragraph(overview.get("model_filename") or "-", style_table_cell), Paragraph(", ".join(k for k, v in section_flags.items() if v) or "none", style_table_cell)],
    ], colWidths=[2.2 * inch, 2.6 * inch, 1.86 * inch])
    info_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ORANGE),
        ("BACKGROUND", (0, 1), (-1, 1), BG_CARD),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 10), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(info_tbl)
    story.append(Spacer(1, 18))

    story.append(_section("Fairness Metrics"))
    fm_defs = [
        ("Demographic Parity Difference (DPD)", "dpd", "Difference in positive-prediction rates across groups; closer to 0 is more equitable."),
        ("Equalized Odds Difference (EOD)", "eod", "Gap in true/false positive rates between groups; closer to 0 indicates equal error rates."),
        ("Disparate Impact Ratio (DIR)", "dir", "Ratio of favorable outcome rates between groups; values near 1.0 indicate parity."),
    ]
    fm_rows = [[Paragraph("METRIC", style_table_head), Paragraph("VALUE", style_table_head),
                Paragraph("INTERPRETATION", style_table_head)]]
    for i, (name, key, meaning) in enumerate(fm_defs, start=1):
        fm_rows.append([Paragraph(name, style_table_cell_bold), Paragraph(_fmt(km.get(key)), style_table_cell), Paragraph(meaning, style_table_cell)])
    fm_tbl = Table(fm_rows, colWidths=[2.55 * inch, 0.75 * inch, 3.36 * inch])
    fm_style = [
        ("BACKGROUND", (0, 0), (-1, 0), ORANGE),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 10), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 0), (1, -1), "CENTER"),
    ]
    for i in range(2, len(fm_rows), 2):
        fm_style.append(("BACKGROUND", (0, i), (-1, i), BG_CARD))
    fm_tbl.setStyle(TableStyle(fm_style))
    story.append(fm_tbl)
    story.append(Spacer(1, 18))

    if comparison_models:
        story.append(_section("Model Comparison"))
        rows = [[Paragraph(h, style_table_head) for h in ("Model", "Accuracy", "Fairness", "DPD", "EOD", "DIR", "Combined")]]
        best_name = overview.get("best_balanced_model_name")
        for m in comparison_models:
            name = m.get("model_name", m.get("model_id", "Model"))
            name_style = (ParagraphStyle("hi", parent=style_table_cell_bold, textColor=ORANGE) if name == best_name else style_table_cell)
            rows.append([
                Paragraph(("★ " if name == best_name else "") + name, name_style),
                Paragraph(_fmt(m.get("accuracy")), style_table_cell),
                Paragraph(_fmt(m.get("fairness_score")), style_table_cell),
                Paragraph(_fmt(m.get("dpd")), style_table_cell),
                Paragraph(_fmt(m.get("eod")), style_table_cell),
                Paragraph(_fmt(m.get("dir")), style_table_cell),
                Paragraph(_fmt(m.get("combined_score")), style_table_cell),
            ])
        cm_tbl = Table(rows, repeatRows=1,
                        colWidths=[1.7 * inch, 0.75 * inch, 0.75 * inch, 0.6 * inch,
                                   0.6 * inch, 0.6 * inch, 0.75 * inch])
        cm_style = [
            ("BACKGROUND", (0, 0), (-1, 0), ORANGE),
            ("GRID", (0, 0), (-1, -1), 0.5, LINE),
            ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ]
        for i in range(2, len(rows), 2):
            cm_style.append(("BACKGROUND", (0, i), (-1, i), BG_CARD))
        cm_tbl.setStyle(TableStyle(cm_style))
        story.append(cm_tbl)
        story.append(Spacer(1, 18))

    # charts — generated straight from report_payload, no placeholders
    tmpdir = tempfile.mkdtemp()
    try:
        scatter_path = _Path(tmpdir) / f"tradeoff_{report_payload.get('report_id')}.png"
        _save_tradeoff_chart(report_payload.get("chart_data", {}), str(scatter_path))
        story.append(PageBreak())
        story.append(_section("Accuracy vs. Fairness Trade-off"))
        # Square chart at full page width — width and height both equal CONTENT_W.
        story.append(RLImage(str(scatter_path), width=CONTENT_W, height=CONTENT_W))
        story.append(Spacer(1, 10))

        # bar_path = _Path(tmpdir) / f"before_after_{report_payload.get('report_id')}.png"
        # _save_before_after_chart(report_payload, str(bar_path))
        # story.append(PageBreak())
        # story.append(_section("Before vs. After Fairness Metrics"))
        # # Full page width, height follows the 10.4 x 5.6 figure aspect ratio.
        # story.append(RLImage(str(bar_path), width=CONTENT_W, height=CONTENT_W * (5.6 / 10.4)))
        # story.append(Spacer(1, 12))

        story.append(_section("Recommendations"))
        story.append(Paragraph(
            "Fairness improved after mitigation. Consider validating and deploying the mitigated "
            "model." if fair_change > 0 else
            "No substantial fairness improvement observed. Consider revising mitigation strategy "
            "or feature preprocessing.",
            style_body))

        doc.build(story)
    finally:
        import shutil
        shutil.rmtree(tmpdir, ignore_errors=True)

def _render_pdf(report_payload: Dict[str, Any], pdf_path: Path) -> None:
    pdf_path.parent.mkdir(parents=True, exist_ok=True)
    if REPORTLAB_AVAILABLE:
        _render_pdf_reportlab(report_payload, pdf_path)
        return
    # keep your existing matplotlib/PdfPages fallback here, unchanged

def _render_pdf(report_payload: Dict[str, Any], pdf_path: Path) -> None:
    pdf_path.parent.mkdir(parents=True, exist_ok=True)

    # If ReportLab is available, use it for a high-quality multi-page layout.
    if REPORTLAB_AVAILABLE:
        _render_pdf_reportlab(report_payload, pdf_path)
        return

    # Fallback: keep original matplotlib-based rendering for environments without ReportLab.
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
            f"Generated at: {report_payload.get('generated_at', '')}",
        ]
        y -= 0.02
        for line in section_lines:
            ax.text(0.06, y, line, fontsize=9.5, va="top", style="italic")
            y -= 0.022

        pdf.savefig(fig, bbox_inches="tight")
        plt.close(fig)

        # Keep the previous matplotlib tradeoff chart for fallback
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
            f"Accuracy changed to {accuracy_gain:+.3f} and fairness score changed to {fairness_gain:+.3f}."
            f" {interpretation_summary}"
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