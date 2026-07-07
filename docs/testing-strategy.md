# Testing strategy

## Unit tests

Cover small utilities and pure logic:

- Runtime dates.
- File upload validation.
- Scoring thresholds.
- Source URL validation.
- Advisory state normalization.
- Pack gate rules.

## Integration tests

Cover workflow boundaries:

- Discovery result to assessment candidate.
- Assessment candidate to pipeline application.
- Pipeline application to Co-Pilot draft.
- Co-Pilot draft to pack export.

## Failure-path tests

Required before production:

- Past deadline.
- Invalid deadline string.
- Missing source URL.
- Generic funder homepage URL.
- Unsupported PDF/DOCX upload.
- Missing organization profile.
- LLC-ineligible opportunity.
- Export attempt for `DECLINE` or `DEF`.
- Export attempt without human approval.

## Manual QA smoke test

1. Load dashboard.
2. Add a plain-text narrative.
3. Reject a PDF upload and confirm the message is clear.
4. Run discovery with a narrow filter.
5. Verify a source URL manually.
6. Score one opportunity.
7. Move a GO/PREP item to pipeline.
8. Draft one proposal section.
9. Confirm pack export remains gated.
