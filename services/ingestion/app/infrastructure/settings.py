"""Worker-only environment contract. DATABASE_URL is intentionally absent."""

from __future__ import annotations

from pydantic import HttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    internal_api_key: str
    internal_api_base_url: HttpUrl = "http://localhost:3001"
    request_timeout_seconds: float = 10
