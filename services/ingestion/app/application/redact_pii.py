"""Best-effort PII redaction before any candidate extraction request."""

from __future__ import annotations

import re


REDACTION_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"(?<![\w.-])[\w.+-]+@[\w-]+(?:\.[\w-]+)+(?![\w.-])", re.I), "[EMAIL]"),
    (
        re.compile(r"(?<!\d)(?:\+?84|0)(?:[\s.-]?\d){9,10}(?!\d)"),
        "[PHONE]",
    ),
    (
        re.compile(r"(?<!\d)(?:\d[\s-]?){12,18}\d(?!\d)"),
        "[CARD_NUMBER]",
    ),
    (re.compile(r"(?<!\w)@[A-Za-z0-9._-]{2,}(?!\w)"), "[FACEBOOK_HANDLE]"),
)


def redact_pii(text: str) -> str:
    """Replace sensitive patterns while preserving merchant and MCC wording."""
    redacted = text
    for pattern, replacement in REDACTION_PATTERNS:
        redacted = pattern.sub(replacement, redacted)
    return redacted
