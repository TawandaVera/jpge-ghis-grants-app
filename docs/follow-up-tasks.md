# Follow-up tasks

## P0

1. Wire runtime-date utility into `src/pages/Assessment.jsx`.
2. Wire upload guard into `src/pages/CoPilot.jsx`.
3. Review `src/api/base44Client.js` and Base44 workspace policies for authentication enforcement.

## P1

1. Add grant evidence fields to discovery persistence.
2. Add reviewer verification status to opportunity records.
3. Add failure-path tests for invalid deadlines, missing URLs, and unsupported uploads.
4. Add admin route guard for `/admin/workspaces`.

## P2

1. Add PDF/DOCX extraction support through a safe parser.
2. Split PR #3 into smaller agent architecture PRs if possible.
3. Add audit trail views for discovery, scoring, drafting, and export.
4. Add release checklist to pull request template.
