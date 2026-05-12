from pathlib import Path
import joblib
from typing import Any, Dict

from sklearn.base import BaseEstimator
from fairlearn.postprocessing import ThresholdOptimizer

ALLOWED_METHODS = [
    "predict",
    "predict_proba",
    "predict_score",
    "predict_label",
    "transform",
]


def has_allowed_method(obj: Any) -> bool:
    return any(hasattr(obj, m) for m in ALLOWED_METHODS)


def _get_final_estimator(obj: Any) -> Any:
    """
    Return the final estimator from Pipeline/nested Pipeline.
    """

    try:
        # sklearn Pipeline
        steps = getattr(obj, "steps", None)

        if isinstance(steps, list) and len(steps) > 0:
            final = steps[-1][1]
            return _get_final_estimator(final)

        # named_steps
        named = getattr(obj, "named_steps", None)

        if isinstance(named, dict) and len(named) > 0:
            final = list(named.values())[-1]
            return _get_final_estimator(final)

    except Exception:
        pass

    return obj


def detect_model_type(model: Any) -> str:
    """
    Detect actual estimator type inside pipelines/wrappers.
    """

    try:
        final = _get_final_estimator(model)
        return type(final).__name__

    except Exception:
        return type(model).__name__


def extract_model_from_dict(bundle: Dict) -> Any:
    """
    Extract estimator from dictionary bundles.
    """

    for key in ["model", "estimator", "base_model", "clf"]:
        if key in bundle:
            return bundle[key]

    return None


def extract_wrapped_model(obj: Any) -> Any:
    """
    Extract wrapped estimator from custom wrapper objects.
    """

    possible_attrs = [
        "model",
        "base_model",
        "estimator",
        "clf",
        "inner_model",
    ]

    for attr in possible_attrs:
        if hasattr(obj, attr):
            return getattr(obj, attr)

    return None


def safe_load_model_from_path(path: Path) -> Dict:
    """
    Safely load ML model and detect actual estimator type.
    """

    try:
        model_obj = joblib.load(path)

    except Exception as exc:
        raise ValueError(
            "Model file could not be loaded. "
            "Ensure it's a joblib/pickle file."
        ) from exc

    # ---------------------------------------------------
    # ThresholdOptimizer
    # ---------------------------------------------------

    if isinstance(model_obj, ThresholdOptimizer):

        base = model_obj.estimator_

        if not has_allowed_method(base):
            raise ValueError(
                "ThresholdOptimizer wrapper loaded, "
                "but inner estimator lacks prediction methods."
            )

        final_base = _get_final_estimator(base)

        return {
            "model": model_obj,
            "model_type": "ThresholdOptimizer",
            "base_model_type": detect_model_type(base),
            "supports_proba": hasattr(final_base, "predict_proba"),
        }

    # ---------------------------------------------------
    # Dictionary bundles
    # ---------------------------------------------------

    if isinstance(model_obj, dict):

        inner = extract_model_from_dict(model_obj)

        if inner is None:
            raise ValueError(
                "Model is a dict but does not contain "
                "a valid underlying model."
            )

        if not has_allowed_method(inner):
            raise ValueError(
                "Underlying model in dict "
                "does not support prediction."
            )

        final_inner = _get_final_estimator(inner)

        return {
            "model": model_obj,
            "model_type": f"DictBundle({detect_model_type(inner)})",
            "supports_proba": hasattr(final_inner, "predict_proba"),
        }

    # ---------------------------------------------------
    # sklearn estimators / pipelines
    # ---------------------------------------------------

    if isinstance(model_obj, BaseEstimator):

        if not has_allowed_method(model_obj):
            raise ValueError(
                "Uploaded sklearn estimator "
                "does not support prediction."
            )

        final = _get_final_estimator(model_obj)

        return {
            "model": model_obj,
            "model_type": detect_model_type(model_obj),
            "supports_proba": hasattr(final, "predict_proba"),
        }

    # ---------------------------------------------------
    # Custom wrappers
    # ---------------------------------------------------

    wrapped = extract_wrapped_model(model_obj)

    if wrapped is not None and has_allowed_method(wrapped):

        final_wrapped = _get_final_estimator(wrapped)

        return {
            "model": model_obj,
            "model_type": f"Wrapper({detect_model_type(wrapped)})",
            "supports_proba": hasattr(
                final_wrapped,
                "predict_proba",
            ),
        }

    # ---------------------------------------------------
    # Generic predictive objects
    # ---------------------------------------------------

    if has_allowed_method(model_obj):

        final = _get_final_estimator(model_obj)

        return {
            "model": model_obj,
            "model_type": detect_model_type(model_obj),
            "supports_proba": hasattr(final, "predict_proba"),
        }

    # ---------------------------------------------------
    # Invalid model
    # ---------------------------------------------------

    raise ValueError(
        f"Uploaded object of type "
        f"'{type(model_obj).__name__}' "
        f"is not a valid predictive model or wrapper."
    )