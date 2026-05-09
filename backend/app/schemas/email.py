from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


EmailTrust = Literal["trusted", "untrusted"]


class EmailMessage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    from_address: str = Field(alias="from")
    to: str
    subject: str
    body: str
    received_at: datetime
    trust: EmailTrust = "trusted"


class EmailCreateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    from_address: str = Field(alias="from")
    to: str
    subject: str
    body: str
    trust: EmailTrust = "untrusted"
    received_at: datetime | None = None


class EmailListResponse(BaseModel):
    emails: list[EmailMessage]


class EmailCreateResponse(BaseModel):
    email: EmailMessage


def normalize_received_at(received_at: datetime | None) -> datetime:
    if received_at is None:
        return datetime.now(timezone.utc)
    if received_at.tzinfo is None:
        return received_at.replace(tzinfo=timezone.utc)
    return received_at.astimezone(timezone.utc)
