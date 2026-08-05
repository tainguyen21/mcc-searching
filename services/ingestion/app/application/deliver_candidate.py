"""Application use case for delivering validated candidates to NestJS."""

from __future__ import annotations

from app.application.ports import InternalApiPort
from app.domain.models import NormalizedCandidate


async def deliver_candidate(
    candidate: NormalizedCandidate,
    internal_api: InternalApiPort,
) -> dict[str, object]:
    return await internal_api.submit(candidate)
