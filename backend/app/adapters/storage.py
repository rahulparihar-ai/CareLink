"""Document storage adapter.

Documents are stored in PRIVATE server-side storage (local filesystem by
default; object storage is a future integration). File names are rewritten to
opaque keys so no PII leaks into the URL. Access is always via a short-lived
signed token; documents are never served from a public URL.
"""

from __future__ import annotations

import os
import uuid
from typing import Optional


class StorageAdapter:
    def __init__(self, base_dir: Optional[str] = None) -> None:
        self.base_dir = base_dir or os.getenv(
            "CARELINK_STORAGE_DIR",
            os.path.join("storage", "documents"),
        )
        os.makedirs(self.base_dir, exist_ok=True)

    def save(self, content: bytes, content_type: Optional[str] = None,
             ext: Optional[str] = None) -> tuple[str, str]:
        """Save bytes and return (storage_key, full_path)."""
        key = uuid.uuid4().hex
        if ext:
            key = f"{key}{ext}"
        full_path = os.path.join(self.base_dir, key)
        with open(full_path, "wb") as f:
            f.write(content)
        return key, full_path

    def open_path(self, storage_key: str) -> str:
        return os.path.join(self.base_dir, storage_key)

    def exists(self, storage_key: str) -> bool:
        full = self.open_path(storage_key)
        return os.path.isfile(full)

    def read(self, storage_key: str) -> bytes:
        with open(self.open_path(storage_key), "rb") as f:
            return f.read()

    def delete(self, storage_key: str) -> bool:
        full = self.open_path(storage_key)
        if os.path.isfile(full):
            os.remove(full)
            return True
        return False