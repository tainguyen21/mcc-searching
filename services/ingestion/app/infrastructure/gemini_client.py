"""Gemini adapter. Model IDs stay in environment configuration."""

from __future__ import annotations

import json

from app.application.ports import LlmPort
from app.infrastructure.settings import Settings


class GeminiClient(LlmPort):
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def extract(self, text: str) -> dict[str, object]:
        if not self._settings.gemini_api_key or not self._settings.gemini_model:
            raise RuntimeError("gemini_not_configured")
        from google import genai

        client = genai.Client(api_key=self._settings.gemini_api_key)
        response = await client.aio.models.generate_content(
            model=self._settings.gemini_model,
            contents=text,
            config={"response_mime_type": "application/json"},
        )
        return json.loads(response.text)
