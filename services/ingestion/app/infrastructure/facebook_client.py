"""Capability boundary for Facebook group ingestion.

Facebook Groups API access is blocked for this project until the owner supplies
the official Meta capability evidence recorded in docs/decisions/0001-facebook-group-ingestion.md.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


UNSUPPORTED_PROVIDER_CAPABILITY = "unsupported_provider_capability"


class FacebookCapabilityStatus(StrEnum):
    BLOCKED = "blocked"


@dataclass(frozen=True)
class FacebookFetchResult:
    status: str
    capability: FacebookCapabilityStatus
    items: tuple[object, ...] = ()
    next_cursor: str | None = None


class FacebookClient:
    """A no-network adapter for the currently blocked provider capability."""

    capability = FacebookCapabilityStatus.BLOCKED

    async def fetch_group_items(
        self,
        *,
        group_id: str,
        cursor: str | None = None,
    ) -> FacebookFetchResult:
        del group_id, cursor
        return FacebookFetchResult(
            status=UNSUPPORTED_PROVIDER_CAPABILITY,
            capability=self.capability,
        )
