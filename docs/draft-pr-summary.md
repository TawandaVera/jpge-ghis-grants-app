# Draft PR summary

## Title

Hardening: README, runtime date utility, upload guard, CI, and production-readiness docs

## Summary

This draft PR adds the first safe hardening layer for the JPGE GHIS Grants App. It improves documentation, adds runtime-date and upload-validation utilities, adds tests, adds CI, and documents production-readiness risks.

## Files to review first

1. `README.md`
2. `src/lib/runtimeDate.js`
3. `src/lib/fileUploadGuard.js`
4. `tests/runtimeDate.test.js`
5. `tests/fileUploadGuard.test.js`
6. `docs/page-wiring-patches.md`
7. `docs/risk-register.md`

## Follow-up required

A separate branch should wire the utilities into `Assessment.jsx` and `CoPilot.jsx`.
