# LLM data boundaries

## Purpose

The app uses LLM calls for grant discovery, classification, assessment, narrative parsing, and proposal drafting. These calls can include sensitive organizational data. This document defines the review areas that must be resolved before production use.

## Data that may appear in prompts

- Organization name and mission.
- Geographic coverage.
- Annual budget and indirect cost rate.
- Staff names, titles, education, experience, competencies, certifications, and biographies.
- Past performance.
- Prior proposal text.
- Grant opportunity title, funder, deadline, eligibility, and description.
- Assessment scores, strengths, concerns, and recommended actions.

## Data requiring explicit approval

- EIN.
- UEI.
- Staff biographies.
- Staff education and certifications.
- Budget details.
- Prior proposal text.
- Client-specific strategy notes.

## Recommended controls

- Add prompt construction helpers that redact restricted fields by default.
- Add a workspace-level setting for whether sensitive fields may be included in LLM prompts.
- Log prompt purpose and data categories, not full prompt text, unless secure retention is approved.
- Require human review before generated content is marked submission-ready.

## Acceptance criteria

- Product owner approves allowed prompt data categories.
- Admin can disable sensitive-field inclusion.
- Proposal export does not bypass human review.
- Documentation is visible to technical reviewers and workspace administrators.
