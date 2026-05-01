from backend.app.core.config import settings
from backend.app.llm.base import LLMProvider
from backend.app.llm.gemini import GeminiProvider
from backend.app.llm.mock import MockProvider


def build_provider() -> LLMProvider:
    if settings.llm_provider == "gemini" and settings.gemini_api_keys:
        return GeminiProvider(settings.gemini_api_keys, settings.gemini_model)
    return MockProvider()
