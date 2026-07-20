import uuid
from enum import Enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SqlEnum,
    Integer,
    String,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..db import Base


class AuthProvider(str, Enum):
    EMAIL = "email"
    GOOGLE = "google"
    GITHUB = "github"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    public_id = Column(
        String(36),
        unique=True,
        nullable=False,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    full_name = Column(String(255), nullable=False)

    email = Column(String(255), unique=True, nullable=False, index=True)

    hashed_password = Column(String(255), nullable=True)

    provider = Column(
        SqlEnum(AuthProvider),
        nullable=False,
        default=AuthProvider.EMAIL,
    )
    
    auth_provider_id = Column(
        String(255),
        nullable=True
    )

    avatar_url = Column(String(500), nullable=True)

    email_verified = Column(Boolean, default=False, nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)

    is_superuser = Column(Boolean, default=False, nullable=False)

    last_login = Column(DateTime(timezone=True), nullable=True)

    failed_login_attempts = Column(
        Integer,
        nullable=False,
        default=0,
    )

    locked_until = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    last_password_change = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    workspaces = relationship(
        "Workspace",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    dashboard_experiments = relationship(
        "DashboardExperiment",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    refresh_tokens = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    uploads = relationship(
        "UploadRecord",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    corrections = relationship(
        "CorrectionRecord",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    optimizations = relationship(
        "OptimizationRun",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    models = relationship(
        "ModelRegistry",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    bias_audits = relationship("BiasAuditRecord", back_populates="user", cascade="all, delete-orphan")
    mitigation_runs = relationship("BiasMitigationRun", back_populates="user", cascade="all, delete-orphan")
    experiment_runs = relationship("ExperimentRun", back_populates="user", cascade="all, delete-orphan")
    fairness_experiment_reports = relationship("FairnessExperimentReport", back_populates="user", cascade="all, delete-orphan")
    mitigation_rankings = relationship("MitigationRanking", back_populates="user", cascade="all, delete-orphan")
    workspaces = relationship("Workspace", back_populates="user", cascade="all, delete-orphan")
