# Release gates

Use these gates before publishing grant workflow changes to production.

## Required checks

```bash
npm ci --legacy-peer-deps
npm run lint
npm run test -- --run
npm run build
```

## Functional checks

- User can load overview dashboard.
- Discovery run creates only opportunities with direct source URLs.
- Assessment run uses the runtime evaluation date.
- Co-Pilot rejects PDF/DOCX upload until extraction is implemented.
- Co-Pilot accepts plain text upload and pasted narrative text.
- Final pack export requires readiness and human review gates.

## Security checks

- Real workspaces require authentication.
- Admin workspace routes are role-limited.
- Sensitive profile and proposal data are not exposed in public contexts.
- LLM prompt data boundaries are documented and approved.

## Evidence checks

- Deadline evidence is stored.
- Eligibility evidence is stored.
- Source URL is direct, not a generic homepage.
- Human reviewer can mark evidence verified or rejected.
