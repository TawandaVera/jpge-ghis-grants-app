# CI notes

## Workflow added

`.github/workflows/hardening-ci.yml`

## Current commands

```bash
npm ci --legacy-peer-deps
npm run lint
npm run test -- --run
```

## Future CI additions

- Add `npm run build` after initial lint/test stability is confirmed.
- Add dependency audit review as a non-blocking scheduled workflow.
- Add Playwright smoke tests for dashboard, assessment, Co-Pilot upload, and pack gate.
- Add branch protection requiring green CI before merge.
