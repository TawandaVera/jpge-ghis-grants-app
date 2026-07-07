# JPGE GHIS Grants App

JPGE GHIS Grants App is a Base44 and Vite application for grant discovery, fit assessment, application pipeline management, AI-assisted proposal drafting, and final pack preparation.

The product is built for grant teams that need a governed workflow from funding search through application packaging. It combines grant opportunity discovery, eligibility scoring, human-in-the-loop review, organizational narrative reuse, staff-capacity context, and export-ready proposal sections.

## Core workflow

1. Discover opportunities.
   - Search for open grants by topic, funder type, applicant type, deadline window, award size, geography, population, and outcome area.
   - Record source URLs, deadlines, eligibility, funder details, and classification tags.

2. Score matches.
   - Assess opportunities against JPGE/GHIS mandate areas.
   - Classify opportunities as `GO`, `PREP`, `DEF`, or `DECLINE`.
   - Track mandate alignment, eligibility fit, deadline feasibility, geographic match, strengths, concerns, and recommended actions.

3. Manage the pipeline.
   - Move selected grants into an application tracker.
   - Monitor stage, deadline, review status, and readiness.

4. Draft with Co-Pilot.
   - Reuse approved organizational narrative blocks.
   - Draw from organization profile, staff capacity, previous proposal text, grant details, and assessment intelligence.
   - Generate proposal sections for executive summary, needs statement, goals, methodology, evaluation, organizational capacity, and budget narrative.

5. Export the pack.
   - Prepare final application materials only after readiness checks and human review gates.

## Main application routes

- `/` overview dashboard
- `/discovery` grant discovery
- `/assessment` grant scoring
- `/pipeline` application pipeline
- `/copilot` AI drafting workflow
- `/pack` final pack export
- `/org-profile` organization profile
- `/dossier` grant dossier
- `/tracker` application tracker
- `/my-workspace` user workspace
- `/admin/workspaces` admin workspace management
- `/ai-assistant` assistant interface
- `/help` help content
- `/tracks` funding tracks

## Technology stack

- React 18
- Vite
- Base44 SDK and Base44 Vite plugin
- TanStack React Query
- React Router
- Tailwind CSS
- Radix UI components
- Recharts
- Vitest
- ESLint

## Local setup

```bash
npm install
npm run dev
```

Create `.env.local` with the Base44 values for the target app:

```bash
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_base44_app_url
VITE_BASE44_FUNCTIONS_VERSION=optional_functions_version
```

## Development commands

```bash
npm run dev        # local development
npm run build      # production build
npm run preview    # preview production build
npm run lint       # lint source files
npm run lint:fix   # auto-fix lint issues
npm run test       # run Vitest tests
```

## Security and privacy notes

This app can process sensitive grant operations data, including organization profile details, EIN/UEI fields, staff capacity, proposal content, budget narratives, and funder strategy. Production use should require:

- Authentication enforced for real workspaces.
- Role-based access for admin and workspace routes.
- Audit logging for discovery, scoring, drafting, review, and export actions.
- Clear handling of LLM prompt data boundaries.
- Evidence capture for grant source URLs, eligibility, deadline, and funder terms.
- Human review before proposal content is treated as submission-ready.

The current client configuration and Base44 workspace policies should be reviewed before storing live client or funder-sensitive data.

## Known limitations

- Discovery results must be independently verified against direct funder pages before submission decisions.
- PDF and DOCX uploads require proper text extraction before narrative parsing. Plain text upload and pasted text are safest until document extraction is fully wired.
- LLM-generated scoring and drafting should be treated as decision support, not as final grant compliance review.
- Large governed-agent integration work should remain in draft until tests, mergeability, and production boundaries are resolved.

## Immediate hardening backlog

1. Replace hard-coded assessment dates with runtime evaluation dates.
2. Add reliable PDF/DOCX extraction or block unsupported binary uploads.
3. Enforce authentication and role checks on sensitive routes.
4. Persist source evidence for grant discovery results.
5. Add failure-path tests for scoring, fatal rules, stale deadlines, invalid sources, and pack-gate refusal.
6. Split large architecture PRs into smaller reviewable units.

## Base44 publishing

Changes pushed to the connected GitHub repository are reflected in Base44 Builder. Publish production changes from Base44 only after build, lint, test, and workspace-access checks pass.
