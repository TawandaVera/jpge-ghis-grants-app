# Governance review

## Product governance objective

The grant workflow should prevent users from moving weak, unverifiable, or ineligible opportunities into final application packaging without human review.

## Required controls

- Discovery evidence verification.
- Fit assessment scoring.
- Human feedback capture.
- Drafting eligibility rules.
- Pack export gate.
- Audit trail for decisions.

## Decision states

Recommended canonical states:

- `GO`: strong fit and ready to proceed.
- `PREP`: potentially viable but requires preparation or evidence gaps.
- `DEF`: defer because timing, readiness, or eligibility is weak.
- `DECLINE`: do not proceed.

## Export rule

Final pack export should only be allowed for approved `GO` or approved `PREP` opportunities where readiness checks and source verification are complete.

## Reviewer responsibilities

- Verify source URL.
- Confirm deadline.
- Confirm applicant eligibility.
- Review LLM-generated rationale.
- Approve or reject draft content before export.
