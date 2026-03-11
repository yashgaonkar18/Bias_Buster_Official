from sqlalchemy import Column, Integer, ForeignKey, DateTime, JSON, Float, Boolean, String
from sqlalchemy.sql import func
from ..db import Base


class BiasReport(Base):
    __tablename__ = "bias_reports"

    id = Column(Integer, primary_key=True, index=True)

    upload_id = Column(Integer, ForeignKey("upload_records.id"), nullable=False)

    bias_present = Column(Boolean, default=False)
    bias_driver = Column(String)
    bias_severity_score = Column(Float)

    dataset_health = Column(JSON)
    target_info = Column(JSON)
    sensitive_attributes = Column(JSON)
    sensitive_audit = Column(JSON)
    warnings = Column(JSON)

    created_at = Column(DateTime(timezone=True), server_default=func.now())