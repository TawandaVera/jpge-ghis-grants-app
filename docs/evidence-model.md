# Grant evidence model

Discovery should separate model-generated interpretation from verifiable source evidence.

## Recommended opportunity evidence fields

```json
{
  "source_url": "https://example.org/grant-page",
  "source_domain": "example.org",
  "retrieved_at": "2026-07-07T00:00:00.000Z",
  "page_title": "Grant Program Title",
  "deadline_raw_text": "Applications due August 15, 2026",
  "deadline_normalized": "2026-08-15",
  "eligibility_raw_text": "Eligible applicants include nonprofits and for-profit organizations.",
  "eligibility_summary": "For-profit and nonprofit applicants are eligible.",
  "award_amount_raw_text": "Awards range from $50,000 to $250,000",
  "award_min": 50000,
  "award_max": 250000,
  "funder_raw_text": "Example Foundation",
  "verification_status": "needs_review",
  "verified_by": null,
  "verified_at": null,
  "review_notes": ""
}
```

## Verification statuses

- `unverified`: imported but not checked.
- `needs_review`: source exists but deadline, eligibility, or amount needs human verification.
- `verified`: direct source evidence supports key fields.
- `rejected`: source does not support the opportunity or grant is closed/ineligible.

## Minimum rules

- Do not treat an LLM summary as evidence.
- Do not allow a generic funder homepage to satisfy source evidence.
- Store the actual deadline text and normalized date.
- Store eligibility text when LLC or for-profit fit affects scoring.
- Re-verify before final pack export.
