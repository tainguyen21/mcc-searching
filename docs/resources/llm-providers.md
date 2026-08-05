# LLM Providers for Bank Policies

Last verified: 2026-08-05

## Purpose

The ingestion worker extracts MCC eligibility and exclusion policies from configured bank
documents. It redacts source text before extraction and validates every response against a
strict schema. The order is Gemini, then Groq, then OpenRouter. A malformed response, quota,
timeout, or validation failure advances to the next provider; no partial policy is delivered.

## Gemini

1. Open Google AI Studio and create or import an API key for the MCC project.
2. Store the key in `GEMINI_API_KEY` and the selected JSON-capable model ID in `GEMINI_MODEL`.
3. Send one redacted sample document through the worker and record quota behavior.
4. Rotate by deploying a replacement key first, then revoke the old key in Google AI Studio.

## Groq

1. Create a GroqCloud account, open `API Keys`, and create a service key.
2. Store it as `GROQ_API_KEY` and its exact model ID as `GROQ_MODEL`.
3. Verify the same redacted sample reaches Pydantic validation through the fallback path.
4. Delete the old key after a replacement is active and confirm errors remain sanitized.

## OpenRouter

1. Create an OpenRouter account and create a named key in `Keys`.
2. Store it as `OPENROUTER_API_KEY` and its selected model ID as `OPENROUTER_MODEL`.
3. Set a project credit limit in OpenRouter; the MVP does not send optional application-identification headers.
4. Verify schema validation and revoke old keys after rotation.

## Integration

The worker receives no `DATABASE_URL`. Configure only the `INTERNAL_API_KEY`, one or more provider
key/model pairs, and operator-approved bank-document URLs. Bank policies are delivered to
`POST /internal/ingestion/bank-policies`; this route persists only `BankDocument` and
`BankMccPolicy` records, never `MccObservation` rows.

## Verification and Troubleshooting

- Run a configured document twice. The second unchanged hash returns `no_change`.
- Simulate invalid JSON, auth errors, and timeouts. The next provider should be tried.
- If all providers fail, record only provider names and a non-sensitive failure reason.
- Model availability, quotas, and free-tier limits are external state. Keep model IDs in configuration rather than code.

## Least Privilege

Use one key per environment, restrict access to the project secret manager, and rotate keys on a
defined schedule or immediately after exposure. Prompts must not include raw PII; logs record
provider and status only.

## Official References

- [Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key)
- [Groq quickstart](https://console.groq.com/docs/quickstart)
- [OpenRouter quickstart](https://openrouter.ai/docs/quickstart)
