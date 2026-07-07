# Production readiness review

## Current status

The app has a strong grant-intelligence workflow, but it should be treated as pre-production until authentication, evidence verification, runtime-date handling, upload parsing, and failure-path tests are complete.

## Strengths

- Clear route structure for discovery, assessment, pipeline, drafting, export, workspace, and admin flows.
- Grant-specific prompts with eligibility, deadline, opportunity number, deduplication, and actionability rules.
- Human-in-the-loop review points.
- Proposal drafting based on organizational narrative, profile, staff, prior proposals, and assessment intelligence.
- Emerging governed-agent architecture in draft PR form.

## Highest-risk items

1. Authentication and role enforcement need explicit production review.
2. Grant evidence is not yet separated enough from LLM summaries.
3. Assessment date logic currently needs runtime-date wiring.
4. Co-Pilot upload copy and behavior should not imply PDF/DOCX parsing until extraction exists.
5. Large architecture PRs should remain draft until tests and integration boundaries are clearer.

## Recommended release gate

A release should require:

- `npm run build` passes.
- `npm run lint` passes.
- `npm run test -- --run` passes.
- Sensitive routes are authenticated.
- Admin routes are role-limited.
- Discovery results include source evidence.
- Export requires human approval.
- PDF/DOCX uploads are either parsed correctly or blocked with a clear message.
