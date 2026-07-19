from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..db import Base


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)

    is_favorite = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
    )

    is_deleted = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
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

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user = relationship(
        "User",
        back_populates="workspaces",
    )

    experiments = relationship(
        "DashboardExperiment",
        back_populates="workspace",
        cascade="all, delete-orphan",
    )

    legacy_experiments = relationship(
        "Experiment",
        back_populates="workspace",
        cascade="all, delete-orphan",
    )


class DashboardExperiment(Base):
    __tablename__ = "dashboard_experiments"

    id = Column(Integer, primary_key=True, index=True)

    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name = Column(
        String(255),
        nullable=False,
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

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user = relationship(
        "User",
        back_populates="dashboard_experiments",
    )

    workspace = relationship(
        "Workspace",
        back_populates="experiments",
    )
    
    uploads = relationship("UploadRecord", back_populates="experiment", cascade="all, delete-orphan")
