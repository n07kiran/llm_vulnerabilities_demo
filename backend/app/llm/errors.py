class LLMRateLimitError(RuntimeError):
    def __init__(
        self,
        *,
        provider: str,
        attempted_keys: int,
        total_keys: int,
        retry_after_seconds: float | None = None,
        last_error: Exception | None = None,
    ) -> None:
        self.provider = provider
        self.attempted_keys = attempted_keys
        self.total_keys = total_keys
        self.retry_after_seconds = retry_after_seconds
        self.last_error = last_error

        message = f"{provider} rate limited after trying {attempted_keys}/{total_keys} API keys."
        if retry_after_seconds is not None:
            message += f" Retry after ~{int(retry_after_seconds)}s."
        if last_error is not None:
            message += f" ({last_error})"

        super().__init__(message)
