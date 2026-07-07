# Agent integration review

## Current recommendation

Keep the governed-agent integration in draft until the agent layer is connected to verified data sources, persistence, and tests.

## Positive direction

- SOP-based workflow architecture.
- Layer separation between decision and operations agents.
- Governance utilities and pack gate concepts.
- Early unit tests.

## Review blockers

- Mock discovery feeds must not run in production paths.
- Agent outputs must include evidence and confidence metadata.
- Persistence must validate schemas and permissions.
- Failure-path tests must be added before merge.
- UI integration must preserve existing user workflows.

## Acceptance criteria

- Agents can be tested without live Base44 state.
- Production mode cannot use mock opportunities.
- Pack export requires verified evidence and approved decision state.
- CI passes with failure-path tests.
