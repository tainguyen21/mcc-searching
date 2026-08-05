"""Change-aware bank-policy orchestration; it never delivers merchant observations."""

from __future__ import annotations

from app.application.llm_fallback import LlmFallback
from app.domain.models import ExtractedBankPolicy
from app.infrastructure.bank_document_fetcher import BankDocumentFetcher
from app.infrastructure.internal_api_client import InternalApiClient


class BankDocumentIngestor:
    def __init__(
        self,
        fetcher: BankDocumentFetcher,
        llm: LlmFallback,
        internal_api: InternalApiClient,
    ) -> None:
        self._fetcher = fetcher
        self._llm = llm
        self._internal_api = internal_api

    async def ingest(self, *, source_key: str, bank_code: str, document_url: str) -> dict[str, object]:
        document = await self._fetcher.fetch(document_url)
        policy = await self._llm.extract_bank_policy(document.normalized_bytes.decode("utf-8", "replace"))
        normalized = ExtractedBankPolicy(
            **policy.model_dump(
                update={
                    "bank_code": bank_code,
                    "document_url": document.url,
                    "document_hash": document.document_hash,
                }
            )
        )
        return await self._internal_api.submit_bank_policy(normalized, source_key)
