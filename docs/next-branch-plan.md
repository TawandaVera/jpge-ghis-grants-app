# Next branch plan

After this branch is reviewed, create:

`hardening/wire-runtime-date-and-upload-guard`

## Scope

- Edit `src/pages/Assessment.jsx` to use `runtimeDate.js`.
- Edit `src/pages/CoPilot.jsx` to use `fileUploadGuard.js`.
- Update Co-Pilot upload UI copy.
- Add a smoke test or manual QA note confirming behavior.

## Do not include

- Agent architecture changes.
- Auth redesign.
- Evidence persistence schema changes.

Those should remain separate branches.
