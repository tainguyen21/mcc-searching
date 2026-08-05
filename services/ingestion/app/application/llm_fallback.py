"""Provider waterfall that never emits a partially validated bank policy."""

from __future__ import annotations

import json

from pydantic import ValidationError

from app.application.ports import LlmPort
from app.domain.models import ExtractedBankPolicy


class LlmFallbackError(RuntimeError):
    def __init__(self, providers: list[str]) -> None:
        super().__init__("all_llm_providers_failed")
        self.providers = providers


class LlmFallback:
    def __init__(self, providers: list[tuple[str, LlmPort]]) -> None:
        self._providers = providers

    async def extract_bank_policy(self, text: str) -> ExtractedBankPolicy:
        failures: list[str] = []
        for name, provider in self._providers:
            try:
                result = await provider.extract(text)
                if isinstance(result, str):
                    result = json.loads(result)
                return ExtractedBankPolicy.model_validate(result)
            except (RuntimeError, ValueError, ValidationError, json.JSONDecodeError):
                failures.append(name)
        raise LlmFallbackError(failures)
