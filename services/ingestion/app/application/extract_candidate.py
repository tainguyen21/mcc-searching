"""Convert redacted provider output into a strict normalized candidate."""

from __future__ import annotations

from datetime import datetime

from pydantic import ValidationError

from app.application.ports import LlmPort
from app.application.redact_pii import redact_pii
from app.domain.models import NormalizedCandidate, SourceItem


class CandidateRejected(ValueError):
    """Raised locally when a provider result cannot become an Internal API payload."""


async def extract_candidate(
    *,
    source_key: str,
    source_item: SourceItem,
    llm: LlmPort,
) -> NormalizedCandidate:
    extraction = await llm.extract(redact_pii(source_item.text))
    try:
        return NormalizedCandidate(
            source_key=source_key,
            external_item_id=source_item.external_item_id,
            source_url=source_item.source_url,
            observed_at=source_item.observed_at,
            merchant_name=extraction["merchant_name"],
            mcc_code=extraction["mcc_code"],
            channel=extraction["channel"],
            address=extraction.get("address"),
            province=extraction.get("province"),
            issuer_bank=extraction.get("issuer_bank"),
            card_network=extraction.get("card_network"),
            evidence_snippet=extraction.get("evidence_snippet"),
        )
    except (KeyError, TypeError, ValidationError) as error:
        raise CandidateRejected(f"incomplete_candidate:{error.__class__.__name__}") from error


def hand_crafted_candidate(
    *,
    source_key: str,
    external_item_id: str,
    source_url: str,
    merchant_name: str,
    mcc_code: str,
    channel: str,
    observed_at: datetime | None = None,
) -> NormalizedCandidate:
    """Small local helper for operator smoke checks without an LLM provider."""
    try:
        return NormalizedCandidate(
            source_key=source_key,
            external_item_id=external_item_id,
            source_url=source_url,
            merchant_name=merchant_name,
            mcc_code=mcc_code,
            channel=channel,  # type: ignore[arg-type]
            observed_at=observed_at,
        )
    except ValidationError as error:
        raise CandidateRejected(f"incomplete_candidate:{error.__class__.__name__}") from error
