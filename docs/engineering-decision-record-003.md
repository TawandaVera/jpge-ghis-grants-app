# Engineering Decision Record 003

## Decision

Grant discovery should persist source evidence separately from LLM summaries.

## Context

Grant decisions depend on funder deadlines, eligibility, source authority, award amounts, and applicant type. LLM-generated summaries are useful for triage, but they cannot substitute for source evidence.

## Required evidence

- Direct source URL.
- Retrieval timestamp.
- Page title.
- Deadline raw text and normalized date.
- Eligibility raw text and summary.
- Award amount raw text and normalized amounts.
- Verification status.

## Consequence

Future discovery work should add source evidence fields and verification states before enabling final pack export from newly discovered opportunities.
