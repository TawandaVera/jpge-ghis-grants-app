# Developer handbook

## Principle

Keep grant workflow logic testable, auditable, and separate from page rendering where possible.

## Recommended structure

- `src/lib`: small reusable utilities.
- `src/utils`: business and validation helpers.
- `src/agents`: agent orchestration and domain workflows.
- `src/pages`: route-level rendering and user interactions.
- `src/components`: reusable UI.
- `tests`: unit and workflow tests.
- `docs`: engineering, security, and product documentation.

## Coding guidance

- Do not hard-code evaluation dates in scoring logic.
- Do not read binary documents as plain text.
- Do not treat LLM output as verified evidence.
- Do not rely on UI hiding for security.
- Keep prompt construction in helpers where possible.
- Add tests for every governance rule.

## Pull request guidance

Small PRs are preferred. Separate documentation, utility, schema, agent, and UI integration changes when possible.
