# Current limitations

## Utility wiring

The runtime date and upload guard utilities are added but not wired into the large page components in this branch.

## CI execution

The workflow is committed, but CI results should be checked in GitHub after the draft PR is opened.

## Build validation

A local build could not be run from this environment. Run `npm run build` before merging.

## Production readiness

This branch improves readiness but does not complete production hardening. Authentication, source evidence persistence, route roles, and LLM data-boundary enforcement remain follow-up work.
