# Engineering Decision Record 002

## Decision

Keep the large governed-agent integration PR in draft until blockers are resolved.

## Context

The agent integration has broad architectural value but changes many files and includes scaffold behavior that should not be treated as production-ready.

## Blockers

- Mergeability must be resolved.
- Mock discovery paths must be isolated.
- Failure-path tests must be added.
- Sensitive LLM data boundaries must be enforced.
- Agent persistence must respect schema validation and access controls.

## Consequence

PR #3 should remain a draft review artifact until it is split or hardened.
