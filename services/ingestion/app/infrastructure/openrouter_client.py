"""OpenRouter adapter using the shared HTTP client library."""

from __future__ import annotations

import httpx

from app.application.ports import LlmPort
from app.infrastructure.settings import Settings


class OpenRouterClient(LlmPort):
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def extract(self, text: str) -> dict[str, object]:
        if not self._settings.openrouter_api_key or not self._settings.openrouter_model:
            raise RuntimeError("openrouter_not_configured")
        async with httpx.AsyncClient(timeout=self._settings.request_timeout_seconds) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={"Authorization": f"Bearer {self._settings.openrouter_api_key}"},
                json={
                    "model": self._settings.openrouter_model,
                    "messages": [{"role": "user", "content": text}],
                    "response_format": {"type": "json_object"},
                },
            )
        response.raise_for_status()
        body = response.json()
        return body["choices"][0]["message"]["content"]
