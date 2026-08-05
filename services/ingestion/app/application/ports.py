"""Ports that keep ingestion orchestration independent of transport providers."""

from __future__ import annotations

from typing import Protocol

from app.domain.models import NormalizedCandidate


class LlmPort(Protocol):
    async def extract(self, text: str) -> dict[str, object]: ...


class InternalApiPort(Protocol):
    async def submit(self, payload: NormalizedCandidate) -> dict[str, object]: ...
