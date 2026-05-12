"""Model Registry Service: Centralized ML model lifecycle management."""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.models import (
    ModelRegistry,
    UploadRecord,
    CorrectionRecord,
    OptimizationRun,
)
from app.schemas.model_registry import (
    RegisterModelRequest,
    ModelRegistryEntry,
    ModelComparisonResponse,
    ModelComparisonItem,
    ModelRecommendationResponse,
    ModelLineageResponse,
    ModelLineageNode,
    TradeoffAnalysis,
)
from app.utils.artifact_naming import cleanup_download_filename
import uuid
import os
from typing import List, Dict, Any, Optional
from datetime import datetime


class ModelRegistryService:
    """Service for managing ML model lifecycle and governance."""

    @staticmethod
    async def register_model(
        payload: RegisterModelRequest,
        session: AsyncSession,
    ) -> tuple[bool, str, Optional[str]]:
        """
        Register a model in the registry.

        Args:
            payload: Model registration details
            session: Database session

        Returns:
            (success, message, model_id)
        """
        try:
            # Verify upload exists
            upload = (
                await session.execute(
                    select(UploadRecord).where(UploadRecord.id == payload.upload_id)
                )
            ).scalar_one_or_none()

            if not upload:
                return False, "Upload record not found", None

            # Verify artifact exists
            if not os.path.isfile(payload.artifact_path):
                return False, f"Artifact not found: {payload.artifact_path}", None

            # Generate model_id
            model_id = str(uuid.uuid4())

            # Compute combined score if not provided (should be provided, but safe default)
            combined_score = payload.combined_score
            fairness_score = payload.fairness_metrics.get("fairness_score", 0.5)
            accuracy = payload.performance_metrics.get("accuracy", 0.5)
            if combined_score == 0:
                combined_score = (0.6 * fairness_score) + (0.4 * accuracy)

            # Create registry entry
            entry = ModelRegistry(
                model_id=model_id,
                upload_id=payload.upload_id,
                model_name=payload.model_name,
                model_type=payload.model_type,
                source_type=payload.source_type,
                parent_model_id=payload.parent_model_id,
                optimization_method=payload.optimization_method,
                mitigation_strategy=payload.mitigation_strategy,
                retraining_method=payload.retraining_method,
                artifact_path=payload.artifact_path,
                artifact_size_bytes=payload.artifact_size_bytes,
                performance_metrics=payload.performance_metrics,
                fairness_metrics=payload.fairness_metrics,
                operational_metrics=payload.operational_metrics,
                combined_score=combined_score,
                version=payload.version,
                tags=payload.tags,
                notes=payload.notes,
                experiment_id=payload.experiment_id,
                parameters=payload.parameters,
            )

            session.add(entry)
            await session.commit()

            return True, f"Model {model_id} registered successfully", model_id

        except Exception as e:
            return False, f"Registration failed: {str(e)}", None

    @staticmethod
    async def get_model_by_id(
        model_id: str,
        session: AsyncSession,
    ) -> Optional[ModelRegistryEntry]:
        """Get a specific model from registry."""
        model = (
            await session.execute(
                select(ModelRegistry).where(ModelRegistry.model_id == model_id)
            )
        ).scalar_one_or_none()

        if not model:
            return None

        return ModelRegistryService._model_to_entry(model)

    @staticmethod
    async def get_models_by_upload(
        upload_id: int,
        session: AsyncSession,
    ) -> List[ModelRegistryEntry]:
        """Get all models for a specific upload."""
        models = (
            (
                await session.execute(
                    select(ModelRegistry)
                    .where(ModelRegistry.upload_id == upload_id)
                    .order_by(ModelRegistry.created_at.desc())
                )
            )
            .scalars()
            .all()
        )

        return [ModelRegistryService._model_to_entry(m) for m in models]

    @staticmethod
    async def compare_models(
        upload_id: int,
        session: AsyncSession,
    ) -> Optional[ModelComparisonResponse]:
        """Compare all models for an upload and provide insights."""
        models = await ModelRegistryService.get_models_by_upload(upload_id, session)

        upload = (
            await session.execute(
                select(UploadRecord).where(UploadRecord.id == upload_id)
            )
        ).scalar_one_or_none()

        corrections = (
            (
                await session.execute(
                    select(CorrectionRecord)
                    .where(CorrectionRecord.upload_id == upload_id)
                    .order_by(CorrectionRecord.created_at.desc())
                )
            )
            .scalars()
            .all()
        )

        optimizations = (
            (
                await session.execute(
                    select(OptimizationRun)
                    .where(OptimizationRun.upload_id == upload_id)
                    .order_by(OptimizationRun.created_at.desc())
                )
            )
            .scalars()
            .all()
        )

        comparison_items: List[ModelComparisonItem] = []
        seen_keys: set[str] = set()

        def add_item(item: ModelComparisonItem, key: str) -> None:
            if key in seen_keys:
                return
            seen_keys.add(key)
            comparison_items.append(item)

        for model in models:
            add_item(
                ModelComparisonItem(
                    model_id=model.model_id,
                    model_name=model.model_name,
                    model_type=model.model_type,
                    source_type=model.source_type,
                    version=model.version,
                    accuracy=model.performance_metrics.get("accuracy", 0),
                    fairness_score=model.fairness_metrics.get("fairness_score", 0),
                    combined_score=model.combined_score,
                    dpd=model.fairness_metrics.get("dpd"),
                    eod=model.fairness_metrics.get("eod"),
                    dir=model.fairness_metrics.get("dir"),
                    bias_severity=ModelRegistryService._bias_severity_label(
                        model.fairness_metrics.get("dpd"),
                        model.fairness_metrics.get("eod"),
                        model.fairness_metrics.get("fairness_score", 0),
                    ),
                    recommendation_status=model.recommended_for,
                    download_url=f"/api/models/download/{model.model_id}",
                    artifact_name=cleanup_download_filename(
                        os.path.basename(model.artifact_path)
                    ),
                    summary=model.recommendation_reason or None,
                    is_recommended=(model.recommended_for is not None),
                ),
                key=f"registry:{model.model_id}",
            )

        if upload and not any(
            item.source_type == "original" for item in comparison_items
        ):
            original_metrics: Optional[Dict[str, Any]] = None
            original_model_name = (
                upload.original_model_filename or upload.model_filename
            )
            original_model_type = upload.model_type or "Model"

            if corrections:
                original_metrics = corrections[0].metrics_before or {}
            elif optimizations:
                original_metrics = optimizations[0].metrics_before or {}

            if original_metrics:
                original_accuracy = original_metrics.get("accuracy", 0)
                original_fairness = original_metrics.get("fairness_score", 0)
                original_dpd = original_metrics.get("dpd")
                original_eod = original_metrics.get("eod")
                add_item(
                    ModelComparisonItem(
                        model_id=f"upload-{upload_id}-original",
                        model_name=original_model_name or "Original Model",
                        model_type=original_model_type,
                        source_type="original",
                        version="v1_original",
                        accuracy=original_accuracy,
                        fairness_score=original_fairness,
                        combined_score=(0.6 * original_fairness)
                        + (0.4 * original_accuracy),
                        dpd=original_dpd,
                        eod=original_eod,
                        dir=original_metrics.get("dir"),
                        bias_severity=ModelRegistryService._bias_severity_label(
                            original_dpd,
                            original_eod,
                            original_fairness,
                        ),
                        recommendation_status="baseline",
                        download_url=f"/api/models/download-original/{upload_id}",
                        artifact_name=original_model_name,
                        summary="Baseline original upload used for comparison.",
                        is_recommended=False,
                    ),
                    key="synthetic:original",
                )

        for correction in corrections:
            metrics_after = correction.metrics_after or {}
            model_name = f"{(upload.original_model_filename or upload.model_filename or 'model.joblib').rsplit('.', 1)[0]}_{correction.strategy}_mitigated_model"
            combined_score = (0.6 * metrics_after.get("fairness_score", 0)) + (
                0.4 * metrics_after.get("accuracy", 0)
            )
            add_item(
                ModelComparisonItem(
                    model_id=correction.correction_id,
                    model_name=model_name,
                    model_type=upload.model_type if upload else "Model",
                    source_type="mitigated",
                    version=f"v1_{correction.strategy}",
                    accuracy=metrics_after.get("accuracy", 0),
                    fairness_score=metrics_after.get("fairness_score", 0),
                    combined_score=combined_score,
                    dpd=metrics_after.get("dpd"),
                    eod=metrics_after.get("eod"),
                    dir=metrics_after.get("dir"),
                    bias_severity=ModelRegistryService._bias_severity_label(
                        metrics_after.get("dpd"),
                        metrics_after.get("eod"),
                        metrics_after.get("fairness_score", 0),
                    ),
                    recommendation_status=(
                        "recommended"
                        if correction.status == "success"
                        else correction.status
                    ),
                    download_url=f"/api/correction/download-model/{correction.correction_id}",
                    dataset_download_url=(
                        f"/api/correction/download-dataset/{correction.correction_id}"
                        if correction.dataset_export_path
                        and correction.strategy in ["reweighting", "smote"]
                        else None
                    ),
                    artifact_name=(
                        cleanup_download_filename(
                            correction.model_export_path.split("/")[-1]
                        )
                        if correction.model_export_path
                        else None
                    ),
                    summary=correction.summary,
                    is_recommended=False,
                ),
                key=f"correction:{correction.correction_id}",
            )

        for optimization in optimizations:
            metrics_after = optimization.metrics_after or {}
            model_name = f"{(upload.original_model_filename or upload.model_filename or 'model.joblib').rsplit('.', 1)[0]}_{optimization.optimization_method}_optimized_model"
            combined_score = (0.6 * metrics_after.get("fairness_score", 0)) + (
                0.4 * metrics_after.get("accuracy", 0)
            )
            add_item(
                ModelComparisonItem(
                    model_id=optimization.optimization_id,
                    model_name=model_name,
                    model_type=upload.model_type if upload else "Model",
                    source_type="optimized",
                    version=f"v1_{optimization.optimization_method}",
                    accuracy=metrics_after.get("accuracy", 0),
                    fairness_score=metrics_after.get("fairness_score", 0),
                    combined_score=combined_score,
                    dpd=metrics_after.get("dpd"),
                    eod=metrics_after.get("eod"),
                    dir=metrics_after.get("dir"),
                    bias_severity=ModelRegistryService._bias_severity_label(
                        metrics_after.get("dpd"),
                        metrics_after.get("eod"),
                        metrics_after.get("fairness_score", 0),
                    ),
                    recommendation_status=(
                        "recommended"
                        if optimization.status == "success"
                        else optimization.status
                    ),
                    download_url=(
                        f"/api/optimize/download/{optimization.optimization_id}"
                        if optimization.artifact_path
                        else None
                    ),
                    dataset_download_url=None,
                    artifact_name=(
                        cleanup_download_filename(
                            optimization.artifact_path.split("/")[-1]
                        )
                        if optimization.artifact_path
                        else None
                    ),
                    summary=optimization.error_message
                    or f"Optimization method: {optimization.optimization_method}",
                    is_recommended=False,
                ),
                key=f"optimization:{optimization.optimization_id}",
            )

        if not comparison_items:
            return None

        comparison_items.sort(key=lambda item: item.combined_score, reverse=True)

        accuracy_scores = [item.accuracy for item in comparison_items]
        fairness_scores = [item.fairness_score for item in comparison_items]
        combined_scores = [item.combined_score for item in comparison_items]

        best_accuracy_model = max(comparison_items, key=lambda item: item.accuracy)
        best_fairness_model = max(
            comparison_items, key=lambda item: item.fairness_score
        )
        best_balanced_model = max(
            comparison_items, key=lambda item: item.combined_score
        )

        production_candidates = [
            item
            for item in comparison_items
            if item.source_type in ["retrained", "corrected", "optimized"]
        ]
        best_production_model = max(
            production_candidates if production_candidates else comparison_items,
            key=lambda item: item.combined_score,
        )

        for item in comparison_items:
            if item.model_id == best_balanced_model.model_id:
                item.is_recommended = True
                item.recommendation_status = "recommended"

        statistics = {
            "accuracy": {
                "min": min(accuracy_scores) if accuracy_scores else 0,
                "max": max(accuracy_scores) if accuracy_scores else 0,
                "avg": (
                    sum(accuracy_scores) / len(accuracy_scores)
                    if accuracy_scores
                    else 0
                ),
            },
            "fairness_score": {
                "min": min(fairness_scores) if fairness_scores else 0,
                "max": max(fairness_scores) if fairness_scores else 0,
                "avg": (
                    sum(fairness_scores) / len(fairness_scores)
                    if fairness_scores
                    else 0
                ),
            },
            "combined_score": {
                "min": min(combined_scores) if combined_scores else 0,
                "max": max(combined_scores) if combined_scores else 0,
                "avg": (
                    sum(combined_scores) / len(combined_scores)
                    if combined_scores
                    else 0
                ),
            },
            "total_models": len(comparison_items),
        }

        summary = ModelRegistryService._generate_comparison_summary(
            comparison_items, best_balanced_model
        )

        experiment_summary = ModelRegistryService._generate_experiment_summary(
            comparison_items, best_balanced_model
        )

        optimization_status = (
            "Optimization completed"
            if any(item.source_type == "optimized" for item in comparison_items)
            else "Optimization not performed"
        )

        # Statistics
        return ModelComparisonResponse(
            upload_id=upload_id,
            models=comparison_items,
            statistics=statistics,
            best_accuracy_model=best_accuracy_model.model_id,
            best_fairness_model=best_fairness_model.model_id,
            best_balanced_model=best_balanced_model.model_id,
            best_production_model=best_production_model.model_id,
            summary=summary,
            experiment_summary=experiment_summary,
            optimization_status=optimization_status,
        )

    @staticmethod
    async def recommend_model(
        upload_id: int,
        goal: str = "balanced",
        session: AsyncSession = None,
    ) -> Optional[ModelRecommendationResponse]:
        """
        Recommend best model based on user goal.

        Goals:
        - accuracy: highest accuracy model
        - fairness: highest fairness_score model
        - balanced: best combined_score
        - production: stable retrained/corrected model
        """
        models = await ModelRegistryService.get_models_by_upload(upload_id, session)

        if not models:
            return None

        recommended_model = None
        recommendation_reason = ""

        if goal == "accuracy":
            recommended_model = max(
                models,
                key=lambda m: m.performance_metrics.get("accuracy", 0),
            )
            recommendation_reason = (
                f"This model has the highest accuracy ({recommended_model.performance_metrics['accuracy']:.2%})"
                f" among all models for this dataset."
            )

        elif goal == "fairness":
            recommended_model = max(
                models,
                key=lambda m: m.fairness_metrics.get("fairness_score", 0),
            )
            recommendation_reason = (
                f"This model has the best fairness score ({recommended_model.fairness_metrics['fairness_score']:.2%})"
                f" with DPD: {recommended_model.fairness_metrics.get('dpd', 'N/A'):.4f}."
            )

        elif goal == "production":
            # Prefer retrained/corrected models, fallback to optimized
            prod_models = [
                m for m in models if m.source_type in ["retrained", "corrected"]
            ]
            if not prod_models:
                prod_models = [m for m in models if m.source_type == "optimized"]
            if not prod_models:
                prod_models = models

            recommended_model = max(
                prod_models,
                key=lambda m: m.combined_score,
            )
            recommendation_reason = (
                f"This {recommended_model.source_type} model offers the best production stability"
                f" with combined score: {recommended_model.combined_score:.4f}."
            )

        else:  # balanced (default)
            recommended_model = max(models, key=lambda m: m.combined_score)
            recommendation_reason = (
                f"This model achieves the best accuracy-fairness balance"
                f" (combined score: {recommended_model.combined_score:.4f})."
            )

        # Find alternatives
        alternatives = [m for m in models if m.model_id != recommended_model.model_id][
            :3
        ]

        # Generate tradeoff analysis vs next best
        tradeoffs: List[TradeoffAnalysis] = []
        if len(models) > 1:
            other_models = [
                m for m in models if m.model_id != recommended_model.model_id
            ]
            for other in other_models[:2]:
                acc_diff = recommended_model.performance_metrics.get(
                    "accuracy", 0
                ) - other.performance_metrics.get("accuracy", 0)
                fair_diff = recommended_model.fairness_metrics.get(
                    "fairness_score", 0
                ) - other.fairness_metrics.get("fairness_score", 0)
                combined_diff = recommended_model.combined_score - other.combined_score

                if acc_diff > 0 and fair_diff > 0:
                    explanation = (
                        f"Recommended model is superior in both accuracy "
                        f"(+{abs(acc_diff):.2%}) and fairness (+{abs(fair_diff):.2%})."
                    )
                elif acc_diff > 0:
                    explanation = (
                        f"Recommended model trades +{abs(acc_diff):.2%} accuracy "
                        f"for -{abs(fair_diff):.2%} fairness."
                    )
                else:
                    explanation = (
                        f"Recommended model trades -{abs(acc_diff):.2%} accuracy "
                        f"for +{abs(fair_diff):.2%} fairness improvement."
                    )

                tradeoffs.append(
                    TradeoffAnalysis(
                        model_pair={
                            recommended_model.model_id: recommended_model.model_name,
                            other.model_id: other.model_name,
                        },
                        accuracy_difference=round(acc_diff, 4),
                        fairness_difference=round(fair_diff, 4),
                        combined_score_difference=round(combined_diff, 4),
                        recommendation=(
                            "Recommended" if combined_diff > 0 else "Alternative"
                        ),
                        explanation=explanation,
                    )
                )

        return ModelRecommendationResponse(
            recommended_model_id=recommended_model.model_id,
            recommended_model=recommended_model,
            goal=goal,
            reasoning=recommendation_reason,
            tradeoff_analysis=tradeoffs if tradeoffs else None,
            alternatives=alternatives,
        )

    @staticmethod
    async def get_lineage(
        model_id: str,
        session: AsyncSession,
    ) -> Optional[ModelLineageResponse]:
        """Get full lineage tree for a model and its descendants."""
        # Find root (model with no parent)
        model = await ModelRegistryService.get_model_by_id(model_id, session)
        if not model:
            return None

        # Trace back to root
        current = model
        while current.parent_model_id:
            current = await ModelRegistryService.get_model_by_id(
                current.parent_model_id, session
            )
            if not current:
                break

        # Build tree from root
        all_models = await ModelRegistryService.get_models_by_upload(
            model.upload_id, session
        )
        tree = await ModelRegistryService._build_lineage_tree(
            current.model_id if current else model_id, all_models, session
        )

        if not tree:
            return None

        def count_depth(node: ModelLineageNode) -> int:
            if not node.children:
                return 1
            return 1 + max(count_depth(child) for child in node.children)

        return ModelLineageResponse(
            root=tree,
            all_models=all_models,
            depth=count_depth(tree),
        )

    @staticmethod
    async def toggle_favorite(
        model_id: str,
        session: AsyncSession,
    ) -> tuple[bool, str]:
        """Toggle favorite status of a model."""
        try:
            model = (
                await session.execute(
                    select(ModelRegistry).where(ModelRegistry.model_id == model_id)
                )
            ).scalar_one_or_none()

            if not model:
                return False, "Model not found"

            model.is_favorite = not model.is_favorite
            session.add(model)
            await session.commit()

            return True, f"Model favorite status: {model.is_favorite}"

        except Exception as e:
            return False, f"Error: {str(e)}"

    @staticmethod
    async def add_model_notes(
        model_id: str,
        notes: str,
        session: AsyncSession,
    ) -> tuple[bool, str]:
        """Add or update notes for a model."""
        try:
            model = (
                await session.execute(
                    select(ModelRegistry).where(ModelRegistry.model_id == model_id)
                )
            ).scalar_one_or_none()

            if not model:
                return False, "Model not found"

            model.notes = notes
            session.add(model)
            await session.commit()

            return True, "Notes updated"

        except Exception as e:
            return False, f"Error: {str(e)}"

    # -- Helper methods --

    @staticmethod
    def _model_to_entry(model: ModelRegistry) -> ModelRegistryEntry:
        """Convert DB model to Pydantic schema."""
        return ModelRegistryEntry(
            model_id=model.model_id,
            upload_id=model.upload_id,
            model_name=model.model_name,
            model_type=model.model_type,
            source_type=model.source_type,
            parent_model_id=model.parent_model_id,
            optimization_method=model.optimization_method,
            mitigation_strategy=model.mitigation_strategy,
            retraining_method=model.retraining_method,
            artifact_path=model.artifact_path,
            artifact_size_bytes=model.artifact_size_bytes,
            performance_metrics=model.performance_metrics,
            fairness_metrics=model.fairness_metrics,
            operational_metrics=model.operational_metrics,
            combined_score=model.combined_score,
            recommended_for=model.recommended_for,
            recommendation_reason=model.recommendation_reason,
            version=model.version,
            tags=model.tags,
            notes=model.notes,
            experiment_id=model.experiment_id,
            parameters=model.parameters,
            is_favorite=model.is_favorite,
            is_available=model.is_available,
            created_at=model.created_at.isoformat() if model.created_at else "",
        )

    @staticmethod
    def _generate_comparison_summary(
        models: List[ModelComparisonItem],
        best_balanced_model: Optional[Dict[str, Any]],
    ) -> str:
        """Generate human-readable summary of model comparison."""
        if not models:
            return "No models to compare."

        if len(models) == 1:
            model = models[0]
            return (
                f"Single {model.source_type} model with accuracy "
                f"{model.accuracy:.2%} and fairness "
                f"{model.fairness_score:.2%}."
            )

        varied_types = len(set(m.source_type for m in models)) > 1
        if varied_types:
            return (
                f"Registry contains {len(models)} models across multiple transformation types. "
                f"Best balanced model ({getattr(best_balanced_model, 'model_id', 'N/A')}) "
                f"achieved the optimal accuracy-fairness tradeoff."
            )
        else:
            source = models[0].source_type
            return (
                f"{len(models)} {source} model variants. "
                f"Best variant achieves combined score "
                f"{getattr(best_balanced_model, 'combined_score', 0):.4f}."
            )

    @staticmethod
    def _generate_experiment_summary(
        models: List[ModelComparisonItem],
        best_balanced_model: ModelComparisonItem,
    ) -> str:
        """Generate a concise experiment-style summary."""
        original = next((m for m in models if m.source_type == "original"), None)
        mitigated = next((m for m in models if m.source_type == "mitigated"), None)
        optimized = next((m for m in models if m.source_type == "optimized"), None)

        if original and mitigated and optimized:
            fairness_delta = (optimized.fairness_score - original.fairness_score) * 100
            accuracy_delta = (optimized.accuracy - original.accuracy) * 100
            return (
                f"Mitigation lowered bias from the original model, and optimization refined the tradeoff. "
                f"The recommended model improved fairness by {fairness_delta:.1f} points while changing accuracy by {accuracy_delta:+.1f} points."
            )

        if original and mitigated:
            fairness_delta = (mitigated.fairness_score - original.fairness_score) * 100
            accuracy_delta = (mitigated.accuracy - original.accuracy) * 100
            return f"Mitigation reduced demographic disparity by {abs(fairness_delta):.1f} points and changed accuracy by {accuracy_delta:+.1f} points."

        if original and optimized:
            fairness_delta = (optimized.fairness_score - original.fairness_score) * 100
            accuracy_delta = (optimized.accuracy - original.accuracy) * 100
            return f"Optimization preserved fairness with a {fairness_delta:+.1f} point shift while accuracy changed by {accuracy_delta:+.1f} points."

        return f"Recommended model: {best_balanced_model.model_name} with combined score {best_balanced_model.combined_score:.4f}."

    @staticmethod
    def _bias_severity_label(
        dpd: Optional[float],
        eod: Optional[float],
        fairness_score: float,
    ) -> str:
        """Classify overall bias severity for display."""
        dpd_value = abs(dpd or 0)
        eod_value = abs(eod or 0)

        if dpd_value >= 0.2 or eod_value >= 0.2 or fairness_score < 0.6:
            return "High"
        if dpd_value >= 0.1 or eod_value >= 0.1 or fairness_score < 0.8:
            return "Medium"
        return "Low"

    @staticmethod
    async def _build_lineage_tree(
        root_id: str,
        all_models: List[ModelRegistryEntry],
        session: AsyncSession,
    ) -> Optional[ModelLineageNode]:
        """Build lineage tree recursively."""
        root = next((m for m in all_models if m.model_id == root_id), None)
        if not root:
            return None

        children = [m for m in all_models if m.parent_model_id == root_id]

        child_nodes = []
        for child in children:
            child_node = await ModelRegistryService._build_lineage_tree(
                child.model_id, all_models, session
            )
            if child_node:
                child_nodes.append(child_node)

        return ModelLineageNode(
            model_id=root.model_id,
            model_name=root.model_name,
            source_type=root.source_type,
            version=root.version,
            combined_score=root.combined_score,
            children=child_nodes,
        )
