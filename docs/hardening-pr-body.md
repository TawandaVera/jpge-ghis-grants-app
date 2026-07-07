# PR body

## Summary

This PR applies the first safe production-readiness hardening pass for the JPGE GHIS Grants App.

## Included

- Replaces the generated Base44 README with product-specific documentation.
- Adds runtime date utilities for deterministic and current-date assessment scoring.
- Adds upload validation utilities to prevent silent PDF/DOCX misreads.
- Adds unit tests for the new utilities.
- Adds a hardening CI workflow.
- Adds a pull request template.
- Adds documentation for security, evidence verification, LLM data boundaries, release gates, testing strategy, and follow-up wiring.

## Not included

This PR does not directly edit `Assessment.jsx` or `CoPilot.jsx`. Exact page wiring patches are documented in `docs/page-wiring-patches.md` and should be applied in a follow-up branch using a local checkout or the Base44 editor.

## Why this is safe

The branch adds supporting utilities, tests, CI, and documentation without changing current page runtime behavior.

## Review checklist

- [ ] README accurately describes the product.
- [ ] `runtimeDate.js` API is acceptable.
- [ ] `fileUploadGuard.js` behavior is acceptable.
- [ ] Tests are clear.
- [ ] CI workflow is acceptable.
- [ ] Documentation reflects production-readiness priorities.
