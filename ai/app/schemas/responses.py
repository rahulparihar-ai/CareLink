"""CareLink AI - FastAPI response models.

Standardize the response envelope so the backend always gets a consistent shape:
success flag, data, metadata (model/provider/language/direction) and warnings.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class MetadataOut(BaseModel):
    language: str = "en"
    language_code: Optional[str] = None
    direction: Optional[str] = None
    model: Optional[str] = None
    provider: Optional[str] = None
    mock: bool = True
    request_id: Optional[str] = None
    task: Optional[str] = None
    prompt_version: Optional[str] = None


class StandardResponse(BaseModel):
    success: bool = True
    data: Dict[str, Any] = Field(default_factory=dict)
    metadata: MetadataOut = Field(default_factory=MetadataOut)
    warnings: List[str] = Field(default_factory=list)


class ErrorDetail(BaseModel):
    code: str
    message: str


class StandardError(BaseModel):
    success: bool = False
    error: ErrorDetail
    metadata: MetadataOut = Field(default_factory=MetadataOut)
    warnings: List[str] = Field(default_factory=list)