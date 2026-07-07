# Local development

## Install

```bash
npm ci --legacy-peer-deps
```

If lockfile compatibility issues appear, use:

```bash
npm install --legacy-peer-deps
```

## Environment

Create `.env.local`:

```bash
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_base44_app_url
VITE_BASE44_FUNCTIONS_VERSION=optional_functions_version
```

Optional deterministic assessment date:

```bash
VITE_EVALUATION_DATE=2026-07-07
```

## Run

```bash
npm run dev
```

## Validate

```bash
npm run lint
npm run test -- --run
npm run build
```
