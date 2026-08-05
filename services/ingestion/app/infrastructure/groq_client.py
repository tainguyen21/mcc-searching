"""Groq adapter for the strict JSON fallback chain."""

from __future__ import annotations

import json

from app.application.ports import LlmPort
from app.infrastructure.settings import Settings


class GroqClient(LlmPort):
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def extract(self, text: str) -> dict[str, object]:
        if not self._settings.groq_api_key or not self._settings.groq_model:
            raise RuntimeError("groq_not_configured")
        from groq import AsyncGroq

        client = AsyncGroq(api_key=self._settings.groq_api_key)
        response = await client.chat.completions.create(
            model=self._settings.groq_model,
            messages=[{"role": "user", "content": text}],
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content or "{}")
