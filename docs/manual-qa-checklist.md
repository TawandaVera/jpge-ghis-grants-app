# Manual QA checklist

Use after wiring the runtime-date and upload-guard utilities.

## Setup

- [ ] Install dependencies.
- [ ] Configure `.env.local`.
- [ ] Run app locally.

## Assessment

- [ ] Run assessment on a future-deadline grant.
- [ ] Confirm days-left calculation uses current date.
- [ ] Set `VITE_EVALUATION_DATE` and confirm deterministic scoring text.
- [ ] Confirm invalid deadline does not crash the assessment flow.

## Co-Pilot upload

- [ ] Upload `.txt` file and confirm text appears.
- [ ] Upload `.md` file and confirm text appears.
- [ ] Upload `.pdf` and confirm clear rejection message.
- [ ] Upload `.docx` and confirm clear rejection message.
- [ ] Paste narrative text and confirm parsing still works.

## Security

- [ ] Anonymous user cannot access private workspace data in production mode.
- [ ] Non-admin cannot open admin workspace management.
- [ ] Pack export requires review gates.

## Discovery evidence

- [ ] Source URL is direct.
- [ ] Deadline is manually verifiable.
- [ ] Eligibility is manually verifiable.
- [ ] Generic homepage URL is flagged for review.
