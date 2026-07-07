# Acceptance criteria

## This branch

- README is no longer a generic Base44 scaffold.
- Runtime date utility exists and is tested.
- File upload guard exists and is tested.
- CI workflow exists for lint and tests.
- Production-readiness documentation exists.
- PR template exists.

## Follow-up branch

- `Assessment.jsx` uses `getEvaluationDateLabel()` and `daysUntilDate()`.
- `CoPilot.jsx` uses `validateNarrativeUpload()`.
- Co-Pilot UI no longer advertises unsupported PDF/DOCX parsing.
- Manual QA confirms upload and date behavior.

## Production release

- Authentication and role checks are enforced.
- Discovery source evidence is persisted.
- LLM data-boundary policy is implemented.
- Pack export requires verified evidence and human approval.
