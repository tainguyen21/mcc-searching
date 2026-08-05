"""FastAPI entrypoint for the ingestion worker."""

from fastapi import FastAPI

from app.application.ingest_facebook_source import IngestFacebookSource
from app.application.scheduler import IngestionScheduler
from app.domain.models import NormalizedCandidate
from app.infrastructure.facebook_client import FacebookClient
from app.infrastructure.internal_api_client import InternalApiClient
from app.infrastructure.settings import Settings


app = FastAPI(title="MCC Ingestion Worker")
facebook_scheduler = IngestionScheduler(IngestFacebookSource(FacebookClient()))


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/facebook/capability")
async def facebook_capability() -> dict[str, str | bool]:
    status = await facebook_scheduler.facebook_status()
    return {
        "status": status.status,
        "capability": status.capability.value,
        "scheduling": status.scheduling,
        "jobCreated": status.job_created,
    }


@app.post("/internal/smoke-delivery")
async def smoke_delivery(candidate: NormalizedCandidate) -> dict[str, object]:
    """Operator-only route to verify the authenticated NestJS handoff."""
    return await InternalApiClient(Settings()).submit(candidate)
