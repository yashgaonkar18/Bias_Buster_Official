from sqlalchemy import Column, Integer, String, DateTime, JSON, Float, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db import Base


class ExperimentRun(Base):
    """
    Stores experiment runs containing multiple mitigation strategy results.

    Fields:
        - experiment_id: Unique experiment identifier
        - upload_id: Reference to uploaded dataset/model
        - target_column: Target variable name
        - sensitive_columns: List of sensitive attributes
        - strategies_tested: List of strategies run (e.g., ['threshold', 'reweighting', 'smote'])
        - metrics_before: Baseline metrics (accuracy, dpd, eod, dir)
        - results: Array of strategy results
        - best_strategy: Best performing strategy
        - combined_score: Score used for best strategy selection
        - insights: Generated explanations
        - created_at: Timestamp
    """

    __tablename__ = "experiment_runs"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(String, unique=True, index=True, nullable=False)
    upload_id = Column(Integer, ForeignKey("upload_records.id"), nullable=False)
    target_column = Column(String, nullable=False)
    sensitive_columns = Column(JSON, nullable=False)  # List of column names
    strategies_tested = Column(
        JSON, nullable=False
    )  # ['threshold', 'reweighting', 'smote']

    # Baseline metrics before any mitigation
    metrics_before = Column(
        JSON, nullable=False
    )  # {accuracy, dpd, eod, dir, fairness_score}

    # Results for each strategy
    results = Column(JSON, nullable=False)  # List of strategy results

    # Best strategy selection
    best_strategy = Column(String, nullable=True)
    combined_score = Column(Float, nullable=True)

    # Generated insights
    insights = Column(String, nullable=True)

    # Metadata
    total_duration_seconds = Column(Float, nullable=True)
    status = Column(String, default="completed")  # completed, failed, in_progress
    error_message = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    user = relationship("User", back_populates="experiment_runs")


class FairnessExperimentReport(Base):
    """Persisted downloadable report generated from fairness experiments."""

    __tablename__ = "fairness_experiment_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String, unique=True, index=True, nullable=False)
    upload_id = Column(
        Integer, ForeignKey("upload_records.id"), nullable=False, index=True
    )
    experiment_id = Column(String, nullable=True, index=True)
    title = Column(String, nullable=False)
    section_flags = Column(JSON, nullable=False)
    report_payload = Column(JSON, nullable=False)
    pdf_path = Column(String, nullable=False)
    json_path = Column(String, nullable=False)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    user = relationship("User", back_populates="fairness_experiment_reports")
class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    dataset_name = Column(String(255), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    workspace = relationship("Workspace", back_populates="experiments")
    uploads = relationship("UploadRecord", back_populates="experiment", cascade="all, delete-orphan")
