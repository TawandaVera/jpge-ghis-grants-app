# Application Architecture Repair: Governed Agent Runtime

**Branch:** `fix/governed-agent-runtime-base44`  
**Date:** 2026-05-18  
**Priority:** CRITICAL  
**Scope:** Convert page-level Base44 prototype into governed agent runtime

---

## Overview

This repair addresses **integration drift** between the current app runtime and the attached skills architecture:

- **Current State:** Grant dashboard with local scoring prompts, stale dates, non-canonical states
- **Target State:** Governance-first, source-first, schema-validated grant intelligence system
- **Root Cause:** Entity calls use old patterns, dates hard-coded, advisory states inconsistent, pack gate missing

---

## Module Architecture (Delivered)

Four new foundation layers replace scattered logic:

### 1. **Governance Kernel** (`src/lib/grants/governance.js`)
Controls SOP order, fatal rules, evidence caps, advisory states, pack gate.

**Key Functions:**
- `normalizeAdvisoryState()` - Migrate PREP→PREPARE, DEF→DEFER
- `enforceGovernanceRules()` - Apply fatal rules, evidence caps, scoring thresholds
- `canGeneratePack()` - Verify gate phrase, persona, state before pack generation

**Usage:**
```javascript
import { enforceGovernanceRules, ADVISORY_STATES } from "@/lib/grants/governance";

const result = enforceGovernanceRules(
  { strategic_alignment: 0, funder_intent_fit: 3, eligibility_fit: 2 },
  { funder_intent_fit: ["doc_123"] } // Evidence links
);
// Returns: { scores, total, advisory_state: DECLINE, fatal: true }
```

### 2. **Safe Base44 Wrapper** (`src/lib/base44/safeEntity.js`)
Standardizes entity calls with object syntax instead of positional parameters.

**Key Functions:**
- `listEntity(entity, {order, limit, filters})` - Replace `entity.list("-created_date", 200)`
- `createEntity(entity, payload)` - Safe record creation
- `fetchMultipleEntitiesSafe(requests)` - Resilient multi-entity fetch with partial fallback

**Usage:**
```javascript
import { listEntity, fetchMultipleEntitiesSafe } from "@/lib/base44/safeEntity";

// Old: base44.entities.Grant.list("-created_date", 200)
// New:
const grants = await listEntity(base44.entities.Grant, {
  order: "-created_date",
  limit: 200,
});

// Resilient multi-fetch:
const { data, errors, hasErrors } = await fetchMultipleEntitiesSafe([
  { name: "grants", entity: base44.entities.Grant, options: {} },
  { name: "matches", entity: base44.entities.GrantMatch, options: {} },
]);
```

### 3. **Runtime Date Helpers** (`src/lib/grants/date.js`)
Dynamic date calculations replace hard-coded dates.

**Key Functions:**
- `todayISO()` - Get today in YYYY-MM-DD format
- `addDaysISO(days)` - Future date calculation
- `daysUntil(deadline)` - Days remaining
- `isUrgentDeadline(date, threshold)` - Urgency check
- `validateDeadline(date, minDays, maxDays)` - Date validation

**Usage:**
```javascript
import { todayISO, addDaysISO, daysUntil } from "@/lib/grants/date";

// Old: const today = new Date("2026-05-11");
// New:
const today = todayISO(); // "2026-05-18"
const deadline90 = addDaysISO(90); // "2026-08-16"
const daysLeft = daysUntil("2026-06-18"); // 31 days
```

### 4. **Link and Route Registry** (`src/lib/app/routes.js`)
Centralized route and external link definitions.

**Key Objects:**
- `INTERNAL_ROUTES` - All app routes
- `ROUTE_META` - Route labels, descriptions, icons
- `EXTERNAL_LINKS` - Environment-driven external URLs

**Key Functions:**
- `buildGrantVerificationUrl(title)` - Construct GrantedAI verification URL
- `getNavigationSteps()` - Pipeline visualization steps
- `isValidRoute(route)` - Route validation

**Usage:**
```javascript
import { INTERNAL_ROUTES, buildGrantVerificationUrl } from "@/lib/app/routes";

// Navigate: to={INTERNAL_ROUTES.ASSESSMENT}
// Verify: onClick={() => window.open(buildGrantVerificationUrl(grantTitle))}
```

---

## Page-Specific Repairs

### **Overview.jsx**

**Current Issues:**
- Line 21-34: `Promise.all()` without error handling; one failure blanks dashboard
- Line 38-40: Uses PREP/DEF instead of PREPARE/DEFER

**Repair:**
```javascript
// Replace lines 20-35 with:
useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    const { data, errors, hasErrors } = await fetchMultipleEntitiesSafe([
      { name: "grants", entity: base44.entities.Grant, options: { limit: 200 } },
      { name: "matches", entity: base44.entities.GrantMatch, options: { limit: 200 } },
      { name: "applications", entity: base44.entities.GrantApplication, options: { limit: 100 } },
      { name: "hilItems", entity: base44.entities.HILCheckpoint, options: { filters: { decision: "pending" } } },
      { name: "outcomes", entity: base44.entities.GrantOutcome, options: { limit: 50 } },
    ]);

    setGrants(data.grants || []);
    setMatches(data.matches || []);
    setApplications(data.applications || []);
    setHilItems(data.hilItems || []);
    setOutcomes(data.outcomes || []);
    setLoading(false);
  };

  loadData();
}, []);

// Replace lines 37-40 with state normalization:
const goCount = matches.filter(m => normalizeAdvisoryState(m.recommendation) === ADVISORY_STATES.GO).length;
const prepCount = matches.filter(m => normalizeAdvisoryState(m.recommendation) === ADVISORY_STATES.PREPARE).length;
const deferCount = matches.filter(m => normalizeAdvisoryState(m.recommendation) === ADVISORY_STATES.DEFER).length;
const declineCount = matches.filter(m => normalizeAdvisoryState(m.recommendation) === ADVISORY_STATES.DECLINE).length;
```

**Additional Changes:**
- Line 243: Replace hard-coded link with `buildGrantVerificationUrl(g.title)`

### **GrantDiscovery.jsx**

**Current Issues:**
- Line 86: Hard-coded date `2026-05-11`
- Line 173: Hard-coded date `new Date("2026-05-11")`
- Lines 58, 74: Uses positional entity.list() syntax

**Repair:**
```javascript
// Replace all entity.list() calls:
import { listEntity } from "@/lib/base44/safeEntity";
import { todayISO, addDaysISO } from "@/lib/grants/date";

// Line 56-61: Replace with
const loadGrants = async () => {
  setLoading(true);
  const data = await listEntity(base44.entities.Grant, { limit: 200 });
  setGrants(data);
  setLoading(false);
};

// Line 86: Replace "2026-05-11" with dynamic date
const todaysDate = todayISO();

// Line 93: Replace deadline calculation
- Deadline: MUST be between 2026-05-11 and ${new Date(...).toISOString().split("T")[0]}
+ Deadline: MUST be between ${todaysDate} and ${addDaysISO(scanDeadlineDays)}

// Line 173: Replace
- const today = new Date("2026-05-11");
+ const today = new Date(todayISO());
```

### **Assessment.jsx**

**Current Issues:**
- Line 76: Hard-coded date `new Date("2026-05-10")`
- Line 47-48: Uses positional entity.list() syntax
- Lines 15-20: Uses PREP/DEF instead of canonical states
- No pack gate enforcement

**Repair:**
```javascript
// Replace entity calls:
import { listEntity } from "@/lib/base44/safeEntity";
import { daysUntil } from "@/lib/grants/date";
import { enforceGovernanceRules, normalizeAdvisoryState, ADVISORY_STATES } from "@/lib/grants/governance";

// Lines 44-53: Replace Promise.all() with
const loadData = async () => {
  setLoading(true);
  try {
    const [g, m] = await Promise.all([
      listEntity(base44.entities.Grant, { limit: 200 }),
      listEntity(base44.entities.GrantMatch, { order: "-total_score", limit: 200 }),
    ]);
    setGrants(g);
    setMatches(m);
  } catch (error) {
    console.error("Failed to load assessment data:", error);
    setGrants([]);
    setMatches([]);
  }
  setLoading(false);
};

// Line 76: Replace hard-coded date
- const today = new Date("2026-05-10");
+ const today = new Date();

// Line 80: Replace LLM response with governance enforcement
// After LLM returns draft scores:
const governanceResult = enforceGovernanceRules(
  {
    strategic_alignment: result.mandate_alignment > 30 ? 3 : 2,
    funder_intent_fit: result.eligibility_fit > 25 ? 3 : 1,
    // ... other mappings
  },
  {
    strategic_alignment: result.strengths || [],
    funder_intent_fit: result.rationale ? [result.rationale] : [],
  }
);

// Write canonical advisory state:
await base44.entities.GrantMatch.create({
  grant_id: grant.id,
  grant_title: grant.title,
  funder: grant.funder,
  deadline: grant.deadline,
  ...result,
  recommendation: governanceResult.advisory_state,
  scores: governanceResult.scores,
  total_score: governanceResult.total,
  fatal_rule_triggered: governanceResult.fatal,
  status: "pending_review"
});

// Replace state filter/display (lines 210-220):
// Change all references: PREP → PREPARE, DEF → DEFER
[
  { label: "GO", ... },
  { label: "PREPARE", ... },  // was PREP
  { label: "DEFER", ... },    // was DEF
  { label: "DECLINE", ... },
]
```

### **Layout.jsx**

**Current Issue:**
- Navigation links duplicated from App.jsx; can drift

**Repair:**
```javascript
// Add import:
import { INTERNAL_ROUTES, getNavigationSteps } from "@/lib/app/routes";

// Replace manual route definitions with:
const navSteps = getNavigationSteps();
// Use navSteps in sidebar/header rendering
```

---

## Base44 Client Configuration

**File:** `src/api/base44Client.js`

**Current State:**
```javascript
export const base44 = createClient({
  ...
  requiresAuth: false,  // ← INCONSISTENT with AuthProvider
  ...
});
```

**Decision:** For production workflow app, set `requiresAuth: true` to align with AuthProvider.

**Repair:**
```javascript
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: appBaseUrl || 'https://jpge-ghis-grants-workflow.base44.app',
  requiresAuth: true,  // ← Production setting
  appBaseUrl
});
```

---

## Pack Gate Enforcement

**File:** `src/pages/PackExport.jsx` (or equivalent)

Add gate phrase validation before any pack generation:

```javascript
import { canGeneratePack, PACK_GATE_PHRASE } from "@/lib/grants/governance";

const [gatePhrase, setGatePhrase] = useState("");
const [advisoryState, setAdvisoryState] = useState("DEFER");
const [personaConfirmed, setPersonaConfirmed] = useState(false);

const generatePack = () => {
  if (!canGeneratePack({
    advisory_state: advisoryState,
    gate_phrase: gatePhrase,
    persona_confirmed: personaConfirmed,
  })) {
    toast.error(`Pack generation blocked. Exact phrase required: "${PACK_GATE_PHRASE}"`);
    return;
  }

  // Proceed with pack generation
  // ...
};
```

---

## Validation Checklist

### Phase 1: Governance & Safe Wrappers
- [ ] Import all four new modules into relevant pages
- [ ] Replace `Promise.all()` with `fetchMultipleEntitiesSafe()`
- [ ] Replace all `entity.list()` positional calls with `listEntity(entity, {order, limit})`
- [ ] Test with `npm run lint` and `npm run typecheck`

### Phase 2: Date Fixes
- [ ] Replace all hard-coded date strings (2026-05-11, 2026-05-10)
- [ ] Use `todayISO()`, `addDaysISO()`, `daysUntil()` throughout
- [ ] Verify deadline calculations in Discovery and Assessment

### Phase 3: State Normalization
- [ ] Add state normalization: `normalizeAdvisoryState()` on all UI reads
- [ ] Update UI labels: PREP → PREPARE, DEF → DEFER
- [ ] Update badge colors and descriptions to match canonical states

### Phase 4: Pack Gate
- [ ] Add gate phrase input to PackExport page
- [ ] Wire `canGeneratePack()` validation before pack generation
- [ ] Test gate enforcement: verify pack blocked until exact phrase entered

### Phase 5: Link Registry
- [ ] Move external links to `EXTERNAL_LINKS` with environment variables
- [ ] Replace hard-coded GrantedAI URLs with `buildGrantVerificationUrl()`
- [ ] Update Layout.jsx to use `INTERNAL_ROUTES` and `getNavigationSteps()`

---

## Testing Commands

```bash
# Lint and typecheck
npm install
npm run lint
npm run lint:fix
npm run typecheck

# Build verification
npm run build

# Runtime validation (in browser console post-deploy)
base44.entities.Grant.list({ limit: 3 }).then(console.log)
base44.entities.GrantMatch.list({ limit: 3, order: "-total_score" }).then(console.log)

# Schema probes (verify entity structure)
base44.entities.Grant.schema?.().then(console.log)
base44.entities.GrantMatch.schema?.().then(console.log)
```

---

## Publish Strategy

1. **Branch:** Develop on `fix/governed-agent-runtime-base44`
2. **Validation:** Run full test suite + lint/typecheck
3. **Merge:** Create PR against `main`; peer review required
4. **Push to Base44:** Once merged, push to GitHub
5. **Base44 Builder:** Open app in Base44 Builder; validate deployed schema
6. **Publish:** Publish from Base44 Dashboard when validation complete

---

## Success Criteria

✅ All four governance layers operational  
✅ SOP sequence enforced (no pack without gate)  
✅ Advisory states canonical (PREPARE/DEFER, not PREP/DEF)  
✅ Dates dynamic (no hard-coded 2026-05-11 references)  
✅ Entity calls use safe wrapper syntax  
✅ Routes centralized (no duplication)  
✅ External links environment-driven  
✅ npm run build succeeds  
✅ npm run typecheck passes  

---

**Next Step:** Begin Phase 1 repairs above. Commit to branch after each major phase for review.
