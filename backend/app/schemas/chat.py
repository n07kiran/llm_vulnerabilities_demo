from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, Field


ChatRole = Literal["user", "assistant"]
SimulationMode = Literal["vulnerable", "protected"]


class ChatMessage(BaseModel):
    role: ChatRole
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: dict[str, Any] = Field(default_factory=dict)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    session_id: str = Field(default="default", min_length=1, max_length=120)
    mode: SimulationMode = "vulnerable"


class ResetRequest(BaseModel):
    session_id: str = Field(default="default", min_length=1, max_length=120)


class ChatHistoryResponse(BaseModel):
    session_id: str
    scenario_slug: str
    messages: list[ChatMessage]


class ChatResponse(ChatHistoryResponse):
    provider: str
    mode: SimulationMode
