# Hardening checklist

This checklist tracks production-readiness work identified during the repository meta-review.

## Completed in this branch

- Replaced the generated Base44 README with product-specific documentation.
- Added `src/lib/runtimeDate.js` to centralize evaluation dates and optional test overrides.
- Added `src/lib/fileUploadGuard.js` to prevent silent PDF/DOCX misreads during narrative upload.

## Required follow-up page wiring

### Assessment date wiring

Update `src/pages/Assessment.jsx`:

```js
import { daysUntilDate, getEvaluationDateLabel } from '@/lib/runtimeDate';
```

Replace:

```js
const today = new Date('2026-05-10');
const deadline = grant.deadline ? new Date(grant.deadline) : null;
const daysLeft = deadline ? Math.round((deadline - today) / (1000 * 60 * 60 * 24)) : 999;
```

With:

```js
const evaluationDateLabel = getEvaluationDateLabel();
const daysLeft = daysUntilDate(grant.deadline) ?? 999;
```

Replace prompt text that says:

```js
DEADLINE: ${grant.deadline} (${daysLeft} days from today 2026-05-10)
```

With:

```js
DEADLINE: ${grant.deadline} (${daysLeft} days from evaluation date ${evaluationDateLabel})
```

### Co-Pilot upload wiring

Update `src/pages/CoPilot.jsx`:

```js
import { validateNarrativeUpload } from '@/lib/fileUploadGuard';
```

Then update `handleFileUpload`:

```js
const handleFileUpload = (e) => {
  const file = e.target.files[0];
  const validation = validateNarrativeUpload(file);

  if (!validation.ok) {
    toast.error(validation.message);
    if (fileRef.current) fileRef.current.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => setNarrativeText(ev.target.result);
  reader.onerror = () => toast.error('Could not read narrative file. Please paste the text instead.');
  reader.readAsText(file);
};
```

Update the upload copy from PDF/DOCX/TXT to plain text only until document extraction is wired.

## Security follow-up

- Review `requiresAuth: false` in `src/api/base44Client.js` before production workspace use.
- Enforce role checks for `/admin/workspaces`.
- Add audit events for discovery, scoring, drafting, review, and export.
- Document which LLM calls may include organization profile, EIN/UEI, budget, staff, and proposal text.

## Evidence follow-up

Discovery records should persist:

- Direct source URL.
- Retrieved page title.
- Retrieval timestamp.
- Deadline evidence.
- Eligibility evidence.
- Funder name evidence.
- Verification status.
- Human reviewer notes.

## Test follow-up

Add failure-path coverage for:

- Past deadlines.
- Invalid dates.
- Missing source URLs.
- Generic homepage URLs.
- LLC-ineligible grants.
- Non-GO pack export attempts.
- Unsupported binary uploads.
- Missing organization profile fields.
