import httpx

from backend.app.llm.base import LLMRequest, LLMResponse
from backend.app.llm.key_rotation import RoundRobinKeyRotator


class GeminiProvider:
    name = "gemini"

    def __init__(self, api_keys: list[str] | tuple[str, ...], model: str):
        self._rotator = RoundRobinKeyRotator(api_keys)
        self._model = model
        self._timeout = httpx.Timeout(20.0, connect=8.0)

    @property
    def has_keys(self) -> bool:
        return self._rotator.has_keys

    async def generate(self, request: LLMRequest) -> LLMResponse:
        if not self._rotator.has_keys:
            raise RuntimeError("Gemini provider has no API keys.")

        last_error: Exception | None = None
        attempts = max(1, self._rotator.total)

        for _ in range(attempts):
            selected_key = await self._rotator.next_key()
            try:
                text = await self._call_gemini(selected_key.value, request)
                if text:
                    return LLMResponse(text=text, provider=f"{self.name}:{self._model}")
            except httpx.HTTPStatusError as exc:
                last_error = exc
                if exc.response.status_code not in {401, 403, 429, 500, 502, 503, 504}:
                    raise
            except (httpx.HTTPError, RuntimeError) as exc:
                last_error = exc

        raise RuntimeError(f"All Gemini keys failed or were rate limited: {last_error}")

    async def _call_gemini(self, api_key: str, request: LLMRequest) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self._model}:generateContent"
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": (
                                f"{request.system_prompt}\n\n"
                                "Use only the controlled simulation outcome below.\n\n"
                                f"{request.user_prompt}"
                            )
                        }
                    ],
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 420,
            },
        }

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(
                url,
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": api_key,
                },
                json=payload,
            )
            response.raise_for_status()

        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            return ""

        parts = candidates[0].get("content", {}).get("parts", [])
        return "\n".join(part.get("text", "") for part in parts).strip()
