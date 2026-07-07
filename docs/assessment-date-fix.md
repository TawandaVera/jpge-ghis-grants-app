# Assessment date fix

## Problem

Assessment scoring should not depend on a fixed historical date. Deadline feasibility must be computed from a runtime evaluation date or an explicit test override.

## Utility added

`src/lib/runtimeDate.js`

Provides:

- `toIsoDate(date)`
- `getEvaluationDate()`
- `getEvaluationDateLabel()`
- `daysUntilDate(targetDate, fromDate)`

## Environment override

For deterministic tests or replayed assessments:

```bash
VITE_EVALUATION_DATE=2026-07-07
```

## Required page integration

See `docs/page-wiring-patches.md` for exact replacement code.
