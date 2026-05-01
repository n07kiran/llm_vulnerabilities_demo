import asyncio
from dataclasses import dataclass


@dataclass(frozen=True)
class ApiKeySelection:
    value: str
    index: int
    total: int


class RoundRobinKeyRotator:
    def __init__(self, api_keys: list[str] | tuple[str, ...]):
        self._api_keys = [key.strip() for key in api_keys if key.strip()]
        self._cursor = 0
        self._lock = asyncio.Lock()

    @property
    def has_keys(self) -> bool:
        return bool(self._api_keys)

    @property
    def total(self) -> int:
        return len(self._api_keys)

    async def next_key(self) -> ApiKeySelection:
        if not self._api_keys:
            raise RuntimeError("No Gemini API keys configured.")

        async with self._lock:
            index = self._cursor
            self._cursor = (self._cursor + 1) % len(self._api_keys)

        return ApiKeySelection(
            value=self._api_keys[index],
            index=index,
            total=len(self._api_keys),
        )
