# Security notes

JPGE GHIS Grants App can hold sensitive grant operations data. Treat organization profile records, staff biographies, EIN/UEI fields, proposal drafts, grant strategy notes, budgets, and reviewer comments as restricted workspace data.

## Authentication

Before production use, review the Base44 client configuration and workspace policies. If the app is used with real client or grant records, authentication should be enforced at both the application and data-access layers.

## Role boundaries

Recommended roles:

- Admin: workspace setup, user management, organization profile, security settings.
- Grant lead: discovery, scoring, application routing, final review.
- Writer: narrative library, section drafting, proposal editing.
- Reviewer: assessment review, HIL checkpoints, pack approval.
- Viewer: read-only dashboard and pipeline visibility.

Admin-only routes should not rely on UI hiding alone.

## LLM data boundaries

Current drafting flows may include organization profile, staff capacity, previous proposal text, grant details, and assessment intelligence in prompts. Before storing live data, define:

- Which records are permitted in prompts.
- Which records require redaction.
- Whether EIN, UEI, budget, staff bios, and past proposals can be sent to model providers.
- How prompt and response logs are retained.
- Who can trigger drafting and export.

## Source evidence

Grant discovery should persist verifiable evidence rather than only model-generated summaries. Each opportunity should include source URL, retrieval timestamp, page title, deadline evidence, eligibility evidence, and reviewer verification state.

## Export controls

Final pack export should require:

- Human approval.
- Readiness check completion.
- Evidence verification.
- Organization persona confirmation.
- Clear decision state allowing export.
