"""HTTP adapter for the NestJS Internal ingestion API."""

from __future__ import annotations

import asyncio

import httpx

from app.domain.models import ExtractedBankPolicy, NormalizedCandidate
from app.infrastructure.settings import Settings


class InternalApiClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def submit(self, payload: NormalizedCandidate) -> dict[str, object]:
        return await self._post("/internal/ingestion/observations", payload.model_dump(mode="json"))

    async def submit_bank_policy(self, payload: ExtractedBankPolicy, source_key: str) -> dict[str, object]:
        body = payload.model_dump(mode="json")
        body["sourceKey"] = source_key
        body["bankCode"] = body.pop("bank_code")
        body["documentUrl"] = body.pop("document_url")
        body["documentHash"] = body.pop("document_hash")
        body["effectiveFrom"] = body.pop("effective_from")
        body["effectiveTo"] = body.pop("effective_to")
        body["eligibleMccCodes"] = body.pop("eligible_mcc_codes")
        body["excludedMccCodes"] = body.pop("excluded_mcc_codes")
        return await self._post("/internal/ingestion/bank-policies", body)

    async def _post(self, path: str, body: dict[str, object]) -> dict[str, object]:
        url = f"{str(self._settings.internal_api_base_url).rstrip('/')}{path}"
        headers = {"X-API-KEY": self._settings.internal_api_key}
        timeout = httpx.Timeout(self._settings.request_timeout_seconds)

        for attempt in range(2):
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    response = await client.post(
                        url,
                        headers=headers,
                        json=body,
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
