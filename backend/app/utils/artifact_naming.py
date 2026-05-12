"""Helpers for readable, sanitized artifact filenames."""

from __future__ import annotations

import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

_INVALID_CHARS = re.compile(r"[^A-Za-z0-9._-]+")
_UUID_PREFIX = re.compile(r"^(?:corr_|opt_)?[0-9a-f]{8,32}_", re.IGNORECASE)


def sanitize_artifact_component(value: str) -> str:
    """Return a filesystem-safe filename component."""
    normalized = unicodedata.normalize("NFKD", str(value))
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_value = _INVALID_CHARS.sub("_", ascii_value).strip("._-")
    return ascii_value or "artifact"


def build_artifact_filename(
    original_name: str,
    *parts: str,
    suffix: str | None = None,
    timestamp: str | None = None,
) -> str:
    """Build a readable artifact filename with preserved original stem."""
    base_stem = sanitize_artifact_component(Path(original_name).stem or "artifact")
    extension = suffix if suffix is not None else Path(original_name).suffix
    components = [base_stem]

    for part in parts:
        if part:
            components.append(sanitize_artifact_component(part))

    if timestamp is None:
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    components.append(timestamp)
    return "_".join(components) + extension


def cleanup_download_filename(filename: str) -> str:
    """Strip legacy UUID prefixes while keeping human-readable names intact."""
    cleaned = Path(filename).name
    return _UUID_PREFIX.sub("", cleaned)
