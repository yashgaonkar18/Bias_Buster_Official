from sqlalchemy import Column, Integer, ForeignKey, DateTime, JSON, String, Float
from sqlalchemy.sql import func
from ..db import Base


class MitigationReport(Base):
    __tablename__ = "mitigation_reports"

    id = Column(Integer, primary_key=True, index=True)

    bias_report_id = Column(Integer, ForeignKey("bias_reports.id"), nullable=False)

    method_used = Column(String, nullable=False)

    rows_before = Column(Integer)
    rows_after = Column(Integer)

    before_metrics = Column(JSON)
    after_metrics = Column(JSON)

    improvement_score = Column(Float)

    created_at = Column(DateTime(timezone=True), server_default=func.now())