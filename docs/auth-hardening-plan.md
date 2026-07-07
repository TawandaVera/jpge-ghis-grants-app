# Auth hardening plan

## Goal

Protect grant workspace data before production use.

## Current concern

The client configuration should be reviewed because production grant data may include organization profile, EIN/UEI, staff records, proposal drafts, budgets, and strategic opportunity notes.

## Recommended approach

1. Confirm intended app mode.
   - Public demo mode: use seeded or non-sensitive data only.
   - Private workspace mode: require authentication and role checks.

2. Enforce data access outside UI visibility.
   - Do not rely only on hidden navigation.
   - Protect admin routes and workspace data with policy checks.

3. Define roles.
   - Admin.
   - Grant lead.
   - Writer.
   - Reviewer.
   - Viewer.

4. Add audit events.
   - Login/access checks.
   - Discovery import.
   - Match scoring.
   - Human review.
   - Draft generation.
   - Pack export.

5. Redaction review.
   - Decide whether EIN, UEI, staff biographies, prior proposals, and budget data can be included in LLM prompts.
   - Redact or block fields where needed.

## Acceptance criteria

- Production workspace cannot be accessed anonymously.
- Admin route is role-limited.
- Sensitive records are not exposed through public pages.
- LLM prompt policy is documented.
- Export action is auditable.
