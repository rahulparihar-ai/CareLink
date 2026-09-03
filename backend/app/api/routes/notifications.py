"""Notification routes (self-owned)."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...database import get_db
from ...deps import CurrentUser, get_current_user
from ...middleware.errors import NotFoundError
from ...models.models import Notification
from ...schemas import ApiResponse

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=ApiResponse[List[dict]])
def my_notifications(db: Session = Depends(get_db),
                     current: CurrentUser = Depends(get_current_user)):
    rows = db.query(Notification).filter(
        Notification.recipient_user_id == current.user.id).order_by(
        Notification.created_at.desc()).limit(100).all()
    out = [
        {"id": n.id, "kind": n.kind, "title": n.title, "body": n.body,
         "read": n.read,
         "created_at": n.created_at.isoformat() if n.created_at else None}
        for n in rows
    ]
    return ApiResponse(data=out)


@router.post("/{notification_id}/read", response_model=ApiResponse[dict])
def mark_read(notification_id: str, db: Session = Depends(get_db),
              current: CurrentUser = Depends(get_current_user)):
    n = db.get(Notification, notification_id)
    if not n or n.recipient_user_id != current.user.id:
        raise NotFoundError("Notification not found.")
    n.read = True
    db.commit()
    return ApiResponse(data={"id": n.id, "read": True})