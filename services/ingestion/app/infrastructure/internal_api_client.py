"""HTTP adapter for the NestJS Internal ingestion API."""

from __future__ import annotations

import asyncio

import httpx

from app.domain.models import NormalizedCandidate
from app.infrastructure.settings import Settings


class InternalApiClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def submit(self, payload: NormalizedCandidate) -> dict[str, object]:
        url = f"{str(self._settings.internal_api_base_url).rstrip('/')}/internal/ingestion/observations"
        headers = {"X-API-KEY": self._settings.internal_api_key}
        timeout = httpx.Timeout(self._settings.request_timeout_seconds)

        for attempt in range(2):
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    response = await client.post(
                        url,
                        headers=headers,
                        json=payload.model_dump(mode="json"),
                    )
                response.raise_for_status()
                return response.json()
            except httpx.RequestError:
                if attempt == 1:
                    raise
                await asyncio.sleep(0.25)
            except httpx.HTTPStatusError:
                raise

        raise RuntimeError("unreachable")
