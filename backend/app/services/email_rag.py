from __future__ import annotations

import hashlib
import math
import re
from dataclasses import dataclass
from threading import Lock

from backend.app.schemas.email import EmailMessage
from backend.app.services.email_inbox import EmailInbox, email_inbox


@dataclass(frozen=True)
class RetrievedChunk:
    email_id: str
    chunk_id: str
    score: float
    from_address: str
    subject: str
    received_at_iso: str
    trust: str
    text: str


@dataclass(frozen=True)
class _IndexedChunk:
    email: EmailMessage
    chunk_id: str
    text: str
    vector: list[float]


class _HashingEmbedder:
    def __init__(self, dim: int = 256) -> None:
        self._dim = dim

    def embed(self, text: str) -> list[float]:
        vec = [0.0] * self._dim
        tokens = _tokenize(text)
        for token in tokens:
            bucket = _stable_bucket(token, self._dim)
            vec[bucket] += 1.0

        norm = math.sqrt(sum(value * value for value in vec))
        if not norm:
            return vec
        return [value / norm for value in vec]


class EmailRAG:
    def __init__(
        self,
        inbox: EmailInbox,
        *,
        top_k_default: int = 8,
        embedding_dim: int = 256,
        chunk_size: int = 2000,
        chunk_overlap: int = 120,
    ) -> None:
        self._inbox = inbox
        self._embedder = _HashingEmbedder(dim=embedding_dim)
        self._top_k_default = top_k_default
        self._chunk_size = chunk_size
        self._chunk_overlap = chunk_overlap

        self._lock = Lock()
        self._indexed_revision = -1
        self._chunks: list[_IndexedChunk] = []

    def retrieve(self, query: str, *, top_k: int | None = None) -> list[RetrievedChunk]:
        self._ensure_index()

        query_vector = self._embedder.embed(query)
        scored: list[tuple[float, _IndexedChunk]] = []
        for chunk in self._chunks:
            score = _dot(query_vector, chunk.vector)
            scored.append((score, chunk))

        scored.sort(key=lambda item: item[0], reverse=True)
        chosen = scored[: (top_k or self._top_k_default)]

        results: list[RetrievedChunk] = []
        for score, chunk in chosen:
            results.append(
                RetrievedChunk(
                    email_id=chunk.email.id,
                    chunk_id=chunk.chunk_id,
                    score=float(score),
                    from_address=chunk.email.from_address,
                    subject=chunk.email.subject,
                    received_at_iso=chunk.email.received_at.isoformat(),
                    trust=chunk.email.trust,
                    text=chunk.text,
                )
            )
        return results

    def render_retrieved_context(self, query: str) -> str:
        chunks = self.retrieve(query)
        if not chunks:
            return "No retrieved email chunks."

        rendered: list[str] = []
        for chunk in chunks:
            rendered.append(
                "\n".join(
                    [
                        f"[email_chunk email_id={chunk.email_id} chunk_id={chunk.chunk_id}]",
                        f"From: {chunk.from_address}",
                        f"Subject: {chunk.subject}",
                        f"Received: {chunk.received_at_iso}",
                        f"Trust: {chunk.trust}",
                        "Text:",
                        chunk.text,
                    ]
                )
            )

        return "\n\n".join(rendered)

    def _ensure_index(self) -> None:
        revision = self._inbox.revision
        with self._lock:
            if revision == self._indexed_revision:
                return

            emails = self._inbox.list()
            chunks: list[_IndexedChunk] = []
            for email in emails:
                doc_text = _render_email_document(email)
                for index, chunk_text in enumerate(
                    _chunk_text(doc_text, chunk_size=self._chunk_size, chunk_overlap=self._chunk_overlap)
                ):
                    chunk_id = f"{email.id}-c{index+1}"
                    chunks.append(
                        _IndexedChunk(
                            email=email,
                            chunk_id=chunk_id,
                            text=chunk_text,
                            vector=self._embedder.embed(chunk_text),
                        )
                    )

            self._chunks = chunks
            self._indexed_revision = revision


def _render_email_document(email: EmailMessage) -> str:
    return (
        "\n".join(
            [
                f"From: {email.from_address}",
                f"To: {email.to}",
                f"Subject: {email.subject}",
                f"Received: {email.received_at.isoformat()}",
                f"Trust: {email.trust}",
                "",
                email.body,
            ]
        )
        .strip()
        + "\n"
    )


def _chunk_text(text: str, *, chunk_size: int, chunk_overlap: int) -> list[str]:
    normalized = text.replace("\r\n", "\n")
    if len(normalized) <= chunk_size:
        return [normalized]

    step = max(1, chunk_size - chunk_overlap)
    chunks: list[str] = []
    start = 0
    while start < len(normalized):
        end = min(len(normalized), start + chunk_size)
        chunk = normalized[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == len(normalized):
            break
        start += step

    return chunks


def _dot(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b, strict=False))


_TOKEN_RE = re.compile(r"[a-z0-9]{2,}")


def _tokenize(text: str) -> list[str]:
    return _TOKEN_RE.findall(text.lower())


def _stable_bucket(token: str, dim: int) -> int:
    digest = hashlib.sha256(token.encode("utf-8")).digest()
    value = int.from_bytes(digest[:4], "little")
    return value % dim


email_rag = EmailRAG(email_inbox)
