# Merge plan

## Step 1: Review this branch

Review `hardening/readme-date-upload` for documentation, utility, test, and CI changes.

## Step 2: Run checks

```bash
npm ci --legacy-peer-deps
npm run lint
npm run test -- --run
npm run build
```

## Step 3: Merge if checks pass

This branch is safe to merge because it does not directly change page runtime behavior.

## Step 4: Create follow-up wiring branch

Suggested branch:

```bash
git checkout -b hardening/wire-date-upload-guards
```

Wire:

- `src/lib/runtimeDate.js` into `src/pages/Assessment.jsx`.
- `src/lib/fileUploadGuard.js` into `src/pages/CoPilot.jsx`.

## Step 5: Create security branch

Suggested branch:

```bash
git checkout -b hardening/auth-and-workspace-roles
```

Implement route and data-level access controls.
