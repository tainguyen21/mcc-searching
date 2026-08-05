"""Scheduling boundary for ingestion providers."""

from __future__ import annotations

from dataclasses import dataclass

from app.application.ingest_facebook_source import (
    FacebookIngestionOutcome,
    IngestFacebookSource,
    unavailable_facebook_outcome,
)
from app.infrastructure.facebook_client import FacebookCapabilityStatus


@dataclass(frozen=True)
class FacebookScheduleStatus:
    status: str
    capability: FacebookCapabilityStatus
    scheduling: str
    job_created: bool


class IngestionScheduler:
    """Exposes source availability without scheduling blocked Facebook work."""

    def __init__(self, facebook_ingestion: IngestFacebookSource) -> None:
        self._facebook_ingestion = facebook_ingestion

    async def facebook_status(self) -> FacebookScheduleStatus:
        return FacebookScheduleStatus(
            status="unsupported_provider_capability",
            capability=FacebookCapabilityStatus.BLOCKED,
            scheduling="skipped",
            job_created=False,
        )

    async def run_facebook_schedule(self) -> FacebookIngestionOutcome:
        return unavailable_facebook_outcome()
