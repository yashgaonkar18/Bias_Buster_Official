from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class ReportGenerateRequest(BaseModel):
    """Request for a downloadable fairness experiment report."""

    upload_id: int = Field(..., description="UploadRecord ID")
    title: Optional[str] = Field(
        default=None,
        description="Optional report title; a default is generated when omitted.",
    )
    include_optimization: Optional[bool] = Field(
        default=None,
        description="Override optimization section inclusion. Defaults to backend discovery.",
    )
    include_experiments: Optional[bool] = Field(
        default=None,
        description="Override experiments section inclusion. Defaults to backend discovery.",
    )
    include_explainability: Optional[bool] = Field(
        default=None,
        description="Override explainability section inclusion. Defaults to backend discovery.",
    )


class ReportGenerateResponse(BaseModel):
    """Response returned after report generation."""

    report_id: str
    upload_id: int
    title: str
    summary: str
    section_flags: Dict[str, bool]
    report_payload: Dict[str, Any]
    pdf_download_url: str
    json_download_url: str
    created_at: datetime
