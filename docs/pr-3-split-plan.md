# PR 3 split plan

PR #3 contains a large governed-agent integration. It should remain draft until it is split or the blockers are cleared.

## Recommended split

### PR A: CI and test infrastructure

- GitHub Actions workflow.
- Vitest configuration if needed.
- Existing utility tests.

### PR B: schemas only

- Base44 entity schemas.
- Schema documentation.
- Migration notes.

### PR C: governance utilities

- Gate controller.
- Rule engine.
- SOP enforcer.
- Advisory state utilities.
- Pack gate helpers.

### PR D: Layer 1 agents

- Signal classifier.
- Screener.
- Readiness validator.
- Decision reviewer.
- Pack architect.
- Master orchestrator.

### PR E: Layer 2 operation agents

- Discovery.
- Assessment.
- Packaging.
- Writing.
- Review simulation.
- Budget, compliance, deadline, and extraction agents.

### PR F: UI integration

- Page-level integration.
- Route changes.
- User-facing workflow changes.

## Required blocker checks

- No mock discovery feed in production code path.
- Failure-path tests are present.
- Mergeability against `main` is resolved.
- Sensitive LLM prompt boundaries are documented.
- Pack gate cannot be bypassed by UI-only changes.
