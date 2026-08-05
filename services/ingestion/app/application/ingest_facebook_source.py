"""Application boundary for Facebook source ingestion."""

from __future__ import annotations

from dataclasses import dataclass

from app.infrastructure.facebook_client import (
    UNSUPPORTED_PROVIDER_CAPABILITY,
    FacebookCapabilityStatus,
    FacebookClient,
)


@dataclass(frozen=True)
class FacebookIngestionOutcome:
    status: str
    capability: FacebookCapabilityStatus
    jobs_created: int
    candidates_delivered: int


class IngestFacebookSource:
    """Returns a stable unavailable outcome until Meta capability evidence exists."""

    def __init__(self, client: FacebookClient) -> None:
        self._client = client

    async def execute(
        self,
        *,
        source_key: str,
        group_id: str,
        cursor: str | None = None,
    ) -> FacebookIngestionOutcome:
        del source_key
        fetch_result = await self._client.fetch_group_items(
            group_id=group_id,
            cursor=cursor,
        )

        return FacebookIngestionOutcome(
            status=fetch_result.status,
            capability=fetch_result.capability,
            jobs_created=0,
            candidates_delivered=0,
        )


def unavailable_facebook_outcome() -> FacebookIngestionOutcome:
    return FacebookIngestionOutcome(
        status=UNSUPPORTED_PROVIDER_CAPABILITY,
        capability=FacebookCapabilityStatus.BLOCKED,
        jobs_created=0,
        candidates_delivered=0,
    )
