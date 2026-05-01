from backend.app.llm.base import LLMRequest, LLMResponse


class MockProvider:
    name = "mock"

    async def generate(self, request: LLMRequest) -> LLMResponse:
        return LLMResponse(text=request.fallback_text, provider=self.name)
