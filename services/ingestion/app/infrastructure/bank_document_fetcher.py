"""Fetch configured bank documents and make their hash stable across line endings."""

from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256

import httpx


@dataclass(frozen=True)
class FetchedBankDocument:
    url: str
    normalized_bytes: bytes
    document_hash: str


class BankDocumentFetcher:
    def __init__(self, timeout_seconds: float) -> None:
        self._timeout = httpx.Timeout(timeout_seconds)

    async def fetch(self, url: str) -> FetchedBankDocument:
        async with httpx.AsyncClient(timeout=self._timeout, follow_redirects=True) as client:
            response = await client.get(url)
        response.raise_for_status()
        normalized = response.content.replace(b"\r\n", b"\n").strip()
        return FetchedBankDocument(
            url=url,
            normalized_bytes=normalized,
            document_hash=sha256(normalized).hexdigest(),
        )
