from __future__ import annotations

import json
from pathlib import Path
from threading import Lock
from uuid import uuid4

from backend.app.core.config import PROJECT_ROOT
from backend.app.schemas.email import EmailCreateRequest, EmailMessage, normalize_received_at


_EMAIL_DATA_PATH = PROJECT_ROOT / "backend" / "app" / "data" / "dummy_emails.json"


class EmailInbox:
    def __init__(self, seed_path: Path = _EMAIL_DATA_PATH) -> None:
        self._seed_path = seed_path
        self._lock = Lock()
        self._emails: list[EmailMessage] = []
        self._revision: int = 0
        self.reset()

    @property
    def revision(self) -> int:
        with self._lock:
            return self._revision

    def list(self) -> list[EmailMessage]:
        with self._lock:
            return list(self._emails)

    def add(self, request: EmailCreateRequest) -> EmailMessage:
        email = EmailMessage(
            id=f"email-{uuid4().hex[:12]}",
            **{
                "from": request.from_address,
                "to": request.to,
                "subject": request.subject,
                "body": request.body,
                "trust": request.trust,
                "received_at": normalize_received_at(request.received_at),
            },
        )

        with self._lock:
            self._emails.insert(0, email)
            self._revision += 1
            return email

    def reset(self) -> list[EmailMessage]:
        with self._lock:
            raw = json.loads(self._seed_path.read_text(encoding="utf-8"))
            self._emails = [EmailMessage.model_validate(item) for item in raw]
            self._emails.sort(key=lambda email: email.received_at, reverse=True)
            self._revision += 1
            return list(self._emails)


email_inbox = EmailInbox()
