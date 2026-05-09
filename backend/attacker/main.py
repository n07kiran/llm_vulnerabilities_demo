from __future__ import annotations

from datetime import datetime, timezone
from threading import Lock
from typing import Any

import httpx
from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field

from backend.app.core.config import settings


VICTIM_BASE_URL_DEFAULT = "http://localhost:8000"

# 1x1 transparent PNG
_TRANSPARENT_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
    b"\x00\x00\x00\x0cIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\x0d\n\x2d\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)


class AttackerSendEmailRequest(BaseModel):
    victim_base_url: str = Field(default=VICTIM_BASE_URL_DEFAULT)

    from_address: str = Field(alias="from")
    to: str
    subject: str
    body: str
    trust: str = "untrusted"


class AttackerSendEmailResponse(BaseModel):
    delivered: bool
    victim_response: dict[str, Any] | None = None


class ExfilEvent(BaseModel):
    received_at: str
    session_id: str | None
    n: int | None
    raw: str | None
    decoded: str | None
    remote_ip: str | None
    user_agent: str | None


class ExfilEventsResponse(BaseModel):
    events: list[ExfilEvent]


class _EventStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self._events: list[ExfilEvent] = []

    def add(self, event: ExfilEvent) -> None:
        with self._lock:
            self._events.append(event)

    def list(self) -> list[ExfilEvent]:
        with self._lock:
            return list(self._events)

    def reset(self) -> None:
        with self._lock:
            self._events = []


store = _EventStore()

app = FastAPI(title="LLM Vulnerability Lab — Attacker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/p")
async def pixel(
    request: Request,
    s: str | None = Query(default=None),
    n: int | None = Query(default=None),
    d: str | None = Query(default=None),
) -> Response:
    decoded = _decode_chunk(d) if d else None

    store.add(
        ExfilEvent(
            received_at=datetime.now(timezone.utc).isoformat(),
            session_id=s,
            n=n,
            raw=d,
            decoded=decoded,
            remote_ip=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
    )

    return Response(content=_TRANSPARENT_PNG, media_type="image/png")


@app.get("/api/attacker/events", response_model=ExfilEventsResponse)
async def list_events() -> ExfilEventsResponse:
    return ExfilEventsResponse(events=store.list())


@app.post("/api/attacker/reset")
async def reset_events() -> dict[str, str]:
    store.reset()
    return {"status": "ok"}


@app.post("/api/attacker/send-email", response_model=AttackerSendEmailResponse)
async def send_email_to_victim(payload: AttackerSendEmailRequest) -> AttackerSendEmailResponse:
    victim_url = payload.victim_base_url.rstrip("/")

    async with httpx.AsyncClient(timeout=8.0) as client:
        try:
            response = await client.post(
                f"{victim_url}/api/email/inbox",
                json={
                    "from": payload.from_address,
                    "to": payload.to,
                    "subject": payload.subject,
                    "body": payload.body,
                    "trust": payload.trust,
                },
            )
        except httpx.HTTPError:
            return AttackerSendEmailResponse(delivered=False, victim_response=None)

    if response.status_code >= 400:
        return AttackerSendEmailResponse(delivered=False, victim_response={"error": response.text})

    return AttackerSendEmailResponse(delivered=True, victim_response=response.json())


def _decode_chunk(value: str | None) -> str | None:
    if value is None:
        return None

    # Mirrors the simple substitution scheme from the Wraith walkthrough:
    # space -> +, newline -> _, URL-fragile chars -> -
    return value.replace("+", " ").replace("_", "\n")
