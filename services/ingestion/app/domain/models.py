"""Validated models that cross the ingestion application boundary."""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl, field_validator


class SourceItem(BaseModel):
    external_item_id: str = Field(min_length=1, max_length=500)
    source_url: HttpUrl
    text: str = Field(min_length=1)
    observed_at: datetime | None = None


class NormalizedCandidate(BaseModel):
    source_key: str = Field(min_length=1, max_length=100)
    external_item_id: str = Field(min_length=1, max_length=500)
    source_url: HttpUrl
    merchant_name: str = Field(min_length=1, max_length=255)
    mcc_code: str = Field(pattern=r"^\d{4}$")
    channel: Literal["offline", "online"]
    observed_at: datetime | None = None
    address: str | None = Field(default=None, max_length=500)
    province: str | None = Field(default=None, max_length=100)
    issuer_bank: str | None = Field(default=None, max_length=255)
    card_network: str | None = Field(default=None, max_length=100)
    evidence_snippet: str | None = Field(default=None, max_length=2000)

    @field_validator("merchant_name")
    @classmethod
    def merchant_name_is_not_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("merchant_name must not be blank")
        return stripped


class ExtractedBankPolicy(BaseModel):
    bank_code: str = Field(min_length=1, max_length=50)
    document_url: HttpUrl
    document_hash: str = Field(pattern=r"^[a-f0-9]{64}$")
    effective_from: date | None = None
    effective_to: date | None = None
    eligible_mcc_codes: list[str] = Field(default_factory=list)
    excluded_mcc_codes: list[str] = Field(default_factory=list)

    @field_validator("eligible_mcc_codes", "excluded_mcc_codes")
    @classmethod
    def mcc_codes_are_four_digits(cls, values: list[str]) -> list[str]:
        if any(len(value) != 4 or not value.isdigit() for value in values):
            raise ValueError("every MCC code must be four digits")
        return sorted(set(values))
