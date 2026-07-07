# Code review checklist

## Utility review

- [ ] `runtimeDate.js` handles invalid dates safely.
- [ ] `runtimeDate.js` supports deterministic override.
- [ ] `fileUploadGuard.js` blocks PDF/DOCX.
- [ ] `fileUploadGuard.js` permits plain text.

## Documentation review

- [ ] README is product-specific.
- [ ] Security notes are actionable.
- [ ] Evidence model is clear.
- [ ] Page wiring instructions are precise.

## CI review

- [ ] Workflow uses Node 20.
- [ ] Workflow installs dependencies consistently.
- [ ] Workflow runs lint and tests.

## Merge review

- [ ] No runtime page behavior changed unexpectedly.
- [ ] Follow-up wiring branch is identified.
