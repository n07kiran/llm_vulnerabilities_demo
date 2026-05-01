import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


BACKEND_ROOT = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACKEND_ROOT.parent

load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(BACKEND_ROOT / ".env")


def _csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    app_name: str = "LLM Vulnerability Lab"
    gemini_api_keys: tuple[str, ...] = tuple(_csv(os.getenv("GEMINI_API_KEYS", "")))
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    llm_provider: str = os.getenv("LLM_PROVIDER", "gemini").lower()
    cors_origins: tuple[str, ...] = tuple(
        _csv(os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"))
    )


settings = Settings()
