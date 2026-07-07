# Page wiring patches

The utility files in this branch are ready for page integration. Apply these edits in the Base44 editor or in a local checkout.

## `src/pages/Assessment.jsx`

Add import:

```js
import { daysUntilDate, getEvaluationDateLabel } from '@/lib/runtimeDate';
```

Inside `assessNext`, before the `for (const grant of unscored)` loop, add:

```js
const evaluationDateLabel = getEvaluationDateLabel();
```

Replace this block:

```js
const today = new Date('2026-05-10');
const deadline = grant.deadline ? new Date(grant.deadline) : null;
const daysLeft = deadline ? Math.round((deadline - today) / (1000 * 60 * 60 * 24)) : 999;
```

With:

```js
const daysLeft = daysUntilDate(grant.deadline) ?? 999;
```

Replace:

```js
DEADLINE: ${grant.deadline} (${daysLeft} days from today 2026-05-10)
```

With:

```js
DEADLINE: ${grant.deadline} (${daysLeft} days from evaluation date ${evaluationDateLabel})
```

## `src/pages/CoPilot.jsx`

Add import:

```js
import { validateNarrativeUpload } from '@/lib/fileUploadGuard';
```

Replace `handleFileUpload` with:

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

Replace upload copy:

```jsx
<p className="text-sm font-medium text-slate-600">Drop PDF, DOCX, or TXT</p>
```

With:

```jsx
<p className="text-sm font-medium text-slate-600">Drop a plain-text narrative file</p>
```

Replace input accept:

```jsx
accept=".txt,.docx,.pdf"
```

With:

```jsx
accept=".txt,.md,.markdown,.csv,text/plain"
```
