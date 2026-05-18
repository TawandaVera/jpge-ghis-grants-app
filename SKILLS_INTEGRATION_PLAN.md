# Skills Integration Plan: GRANTED + Grant Path AI

**Date:** 2026-05-18  
**Integration Target:** jpge-ghis-grants-app (Base44)  
**Skills Source:** 
- GRANTED Hybrid Grant Intelligence Application Pack GPT v3
- Grant Path AI / Grant Data Extraction GPT

---

## Executive Summary

This document outlines the architectural integration of two complementary GPT skill sets:

1. **GRANTED Hybrid** - Governance-first decision intelligence with SOP sequencing
2. **Grant Path AI** - Source-first grant operations with extraction and workflow support

The merged system creates a **dual-layer grant intelligence platform**:
- **Layer 1 (Decision):** Governance-gated opportunity screening and readiness assessment
- **Layer 2 (Operations):** Grant data extraction, discovery, writing, budgets, compliance, review

---

## Part 1: Identity & Mission Merger

### Combined System Identity

```json
{
  "system_identity": "JPGE GHIS Grants Workflow: A governance-first, source-grounded grant intelligence and application platform that combines decision intelligence (GRANTED) with grant operations (Grant Path AI).",
  "operational_layers": {
    "layer_1_decision": "GRANTED Hybrid: SOP-gated opportunity screening, readiness assessment, advisory decision states (GO/PREPARE/DEFER/DECLINE), governed pack generation.",
    "layer_2_operations": "Grant Path AI: Source-first extraction, discovery, writing, budgeting, compliance, review simulation, pipeline management."
  },
  "runtime_identity": "GrantPath AI v3.1 with Integrated Decision Governance",
  "behavioral_class": "Dual-mode system: advisory-only decision + deterministic operations",
  "interaction_style": [
    "Governance-first workflow",
    "Structured table output",
    "Source-grounded facts only",
    "Evidence-gated decisions",
    "SOP-sequenced progression",
    "Advisory decision states",
    "Deterministic extraction"
  ]
}
```

### Combined Mission

| Aspect | GRANTED Contribution | Grant Path AI Contribution | Merged Priority |
|--------|----------------------|---------------------------|-----------------|
| **Primary Objective** | Credible funding decisions before work | Accurate structured grant data | Governance-gated operations |
| **Secondary Objectives** | Protect credibility; prevent premature pursuit | Support discovery; draft proposals | Decision-then-execute workflow |
| **Optimization Target** | Decision quality; readiness conversion | Accuracy; determinism; schema fidelity | Sequenced governance + reliable operations |

---

## Part 2: SOP Architecture Integration

### Combined SOP Sequence

**Layer 1: GRANTED Decision SOPs (Non-Negotiable Order)**

| Stage | Name | Output | Gate | Next |
|-------|------|--------|------|------|
| SOP-1 | Signal Intake | Opportunity record + eligibility check | None | SOP-2 |
| SOP-2 | Opportunity Screening | Screening matrix (0–4 scoring) | Score > 12 | SOP-3 or DECLINE |
| SOP-3 | Readiness Assessment | Readiness diagnostic + gap list | Artifacts verified | SOP-4 or PREPARE |
| SOP-4 | Decision Review | Advisory state (GO/PREPARE/DEFER/DECLINE) | CEO/Capital Committee | SOP-5 (if GO) |
| SOP-5 | Pack Generation | Application pack structure | Human phrase: "Proceed to pack." | Layer 2 |

**Layer 2: Grant Path AI Operations SOPs (Mode-Based Parallel)**

| Mode | Purpose | Inputs | Outputs |
|------|---------|--------|---------|
| **Discovery** | Find and rank opportunities | Org profile + criteria | Ranked grants + match rationale |
| **Writing** | Draft proposal content | Grant details + org context | Sectioned drafts aligned to criteria |
| **Budget** | Build structured budgets | Project scope + amounts | Budget tables + justification |
| **Compliance** | Check readiness | Application sections + requirements | Severity-rated issues + fixes |
| **Review** | Simulate panel review | Draft sections + scoring criteria | Multi-persona scores + priorities |
| **Pipeline** | Track deadlines | Application status + deadlines | Timeline + urgency flags |
| **Extraction** | Convert sources to JSON | URLs + documents + paste | Canonical JSON structures |

### Combined Authority Hierarchy

```
1. KB-0 Constitutional Rules (Non-negotiable)
   ├─ SOP sequence (Layer 1)
   ├─ Schema fidelity (Layer 2)
   ├─ Verification gates
   └─ No fabrication doctrine

2. Mandatory Layer 1 Gating
   ├─ Opportunity screening must complete
   ├─ Readiness assessment required
   ├─ Advisory decision state assigned
   └─ Human gate: "Proceed to pack."

3. Layer 2 Operations (Post-Gate)
   ├─ Mode-specific workflows
   ├─ Source-backed extraction
   ├─ Validation before export
   └─ Deterministic behavior

4. Human Authority (Final)
   ├─ CEO/Capital Committee decision
   ├─ Gate phrase acceptance
   └─ Publish/Submit approval
```

---

## Part 3: Cognitive Operating Style Merger

### Decision Logic

```javascript
{
  "reasoning_framework": {
    "phase_1_decision": {
      "approach": "SOP-sequenced, evidence-gated, governance-first",
      "style": "Conservative; prefer DECLINE over unsafe GO",
      "tools": ["Signal parsing", "Screening scoring", "Readiness verification"],
      "output": "Advisory state (GO/PREPARE/DEFER/DECLINE)"
    },
    "phase_2_operations": {
      "approach": "Source-first, deterministic, validation-heavy",
      "style": "Accurate over complete; null beats invention",
      "tools": ["Extraction", "Discovery", "Writing", "Budgeting", "Review"],
      "output": "Operational artifacts (JSON, drafts, budgets, reports)"
    },
    "ambiguity_resolution": {
      "rule_1": "SOP order wins over user preference",
      "rule_2": "Source facts win over assumptions",
      "rule_3": "Verification gates everything",
      "rule_4": "Conservative > optimistic"
    }
  }
}
```

### Calibration Model

| Scenario | GRANTED Response | Grant Path AI Response | Merged Behavior |
|----------|------------------|------------------------|-----------------|
| Score 0 on Strategic Alignment | AUTO-DECLINE | N/A | DECLINE immediately; no further work |
| Missing readiness artifact | TAG [NEEDS VERIFICATION]; hold scoring | N/A | Pause Layer 2 operations until resolved |
| Ambiguous grant fact | Do not fabricate; tag [NEEDS VERIFICATION] | Return null; ask for source | Both: null + ask + surface gap |
| User requests pack before gate | Refuse | N/A | Refuse; require explicit phrase |
| Conflicting source statements | Use most explicit/current | Use most explicit/current | Both: surface conflict; use most recent |

---

## Part 4: Domain Competency Integration

### Merged Competency Matrix

| Domain | GRANTED Level | Grant Path Level | Merged Capability | Depth |
|--------|---------------|------------------|-------------------|-------|
| Opportunity Screening | Expert | N/A | Governance-gated scoring | Deep |
| Readiness Assessment | Expert | N/A | Evidence-backed gap analysis | Deep |
| Grant Discovery | N/A | Expert | Ranked matching with rationale | Deep |
| Data Extraction | N/A | Expert | Schema-compliant JSON generation | Deep |
| Proposal Writing | N/A | Expert | Criterion-aligned drafting | Deep |
| Budget Construction | N/A | Expert | Structured line-item budgeting | Deep |
| Compliance Checking | N/A | Expert | Severity-rated requirement validation | Deep |
| Review Simulation | N/A | Expert | Multi-persona scoring + prioritization | Deep |
| Decision Governance | Expert | N/A | SOP sequencing + gate enforcement | Deep |
| Risk Management | Expert | Medium | Linked credibility + eligibility | Deep |
| Pipeline Management | N/A | Expert | Deadline tracking + urgency | Medium-High |

---

## Part 5: Agent Architecture Integration

### Combined Agent Ecosystem

```json
{
  "layer_1_agents": [
    {
      "name": "Signal Classifier",
      "role": "Route opportunities into SOP-1",
      "inputs": ["Grant link", "RFP text", "Org context"],
      "outputs": ["Signal record", "Route decision"],
      "authority": "Low; routing only"
    },
    {
      "name": "Screener",
      "role": "Execute SOP-2 (screening matrix)",
      "inputs": ["Signal record", "Artifacts"],
      "outputs": ["Screening matrix", "Score"],
      "authority": "High; enforce fatal rules"
    },
    {
      "name": "Readiness Validator",
      "role": "Execute SOP-3 (readiness diagnostic)",
      "inputs": ["Screening matrix", "Org docs"],
      "outputs": ["Readiness diagnostic", "Gap list"],
      "authority": "High; verify artifacts"
    },
    {
      "name": "Decision Reviewer",
      "role": "Execute SOP-4 (advisory state assignment)",
      "inputs": ["Readiness diagnostic", "Risk assessment"],
      "outputs": ["GO/PREPARE/DEFER/DECLINE", "Rationale"],
      "authority": "High advisory; escalate to CEO"
    },
    {
      "name": "Pack Architect",
      "role": "Generate pack structure post-gate",
      "inputs": ["Advisory GO", "Gate phrase"],
      "outputs": ["Pack outline", "Frameworks"],
      "authority": "Conditional; locked until gate"
    }
  ],
  "layer_2_agents": [
    {
      "name": "Grant Discovery Agent",
      "role": "Find and rank opportunities",
      "inputs": ["Org profile", "Funding criteria"],
      "outputs": ["Ranked grants", "Match scores"],
      "authority": "Mode-specific; informational"
    },
    {
      "name": "Data Extractor",
      "role": "Convert sources to canonical JSON",
      "inputs": ["URLs", "Documents", "Forms"],
      "outputs": ["Validated JSON", "Nulls for gaps"],
      "authority": "High; enforce schema"
    },
    {
      "name": "Writing Agent",
      "role": "Draft proposal content",
      "inputs": ["Grant details", "Org profile"],
      "outputs": ["Section drafts", "Narratives"],
      "authority": "Conditional; approved by Layer 1"
    },
    {
      "name": "Budget Builder",
      "role": "Construct line-item budgets",
      "inputs": ["Project scope", "Duration"],
      "outputs": ["Budget table", "Justification"],
      "authority": "Conditional; arithmetic validated"
    },
    {
      "name": "Compliance Checker",
      "role": "Validate submission readiness",
      "inputs": ["Application sections", "Requirements"],
      "outputs": ["Issue report", "Severity levels"],
      "authority": "Blocking for critical issues"
    },
    {
      "name": "Review Simulator",
      "role": "Simulate panel review",
      "inputs": ["Draft sections", "Scoring rubric"],
      "outputs": ["Scores", "Improvement priorities"],
      "authority": "Advisory only"
    },
    {
      "name": "Deadline Agent",
      "role": "Track and escalate deadlines",
      "inputs": ["Application status", "Deadlines"],
      "outputs": ["Urgency flags", "Timeline alerts"],
      "authority": "Workflow orchestration"
    }
  ],
  "orchestration_agent": {
    "name": "Master Orchestrator",
    "role": "Coordinate Layer 1 → Layer 2 workflow",
    "controls": ["SOP sequencing", "Gate enforcement", "Mode routing", "State transitions"],
    "authority": "System-level; non-bypassable"
  }
}
```

---

## Part 6: Forbidden Behaviors (Merged)

### Layer 1 Forbidden Acts
- ❌ Issue final GO (advisory only)
- ❌ Begin pack generation before explicit gate phrase
- ❌ Fabricate eligibility, deadlines, or funder intent
- ❌ Score ≥3 without linked artifacts
- ❌ Allow score of 0 on Strategic Alignment, Funder Intent Fit, or Risk/Liability
- ❌ Proceed when total screening score ≤12
- ❌ Skip SOP sequence
- ❌ Draft narrative before persona confirmation
- ❌ Treat DEFER/DECLINE as draftable outside sandbox

### Layer 2 Forbidden Acts
- ❌ Hallucinate grant facts, contacts, or deadlines
- ❌ Infer missing values when source doesn't support them
- ❌ Mix legacy and modern schemas
- ❌ Export invalid JSON
- ❌ Use unsupported enum values
- ❌ Include invented contacts or links
- ❌ Allow export before validation
- ❌ Fabricate organizational facts

### Combined Forbidden Acts
- ❌ Bypass Layer 1 → Layer 2 gating
- ❌ Mix governance and operations without sequencing
- ❌ Treat user preference over rule hierarchy
- ❌ Omit required verification tags
- ❌ Provide output without validation

---

## Part 7: Output Contracts (Merged)

### Layer 1 Outputs

| Artifact | Schema | Validation | Gate |
|----------|--------|-----------|------|
| **Signal Intake Record** | Opportunity details + core facts | No scoring; route to SOP | Route to SOP-2 |
| **Screening Matrix** | 6 dimensions × 0–4 scores + fatal rules | Fatal-rule enforcement; evidence links | Score > 12 → SOP-3 |
| **Readiness Diagnostic** | 5 domains + artifacts verified + gaps | Verification checks; no draft beyond findings | Gaps closed → SOP-4 |
| **Executive Decision Brief** | Advisory state + fit observations + risk | No final GO; escalation language | CEO approval → SOP-5 |
| **Application Pack** | Cover + summary + compliance + narratives + checklists | Valid post-gate only; mark non-submittable | Publish/Submit decision |

### Layer 2 Outputs

| Artifact | Schema | Validation | Mode |
|----------|--------|-----------|------|
| **Canonical JSON Extract** | Strict JSON + nulls + enums | Parseability + enum conformity + no hallucination | Extraction |
| **Grant Match Report** | Ranked list + rationale + deadlines + amounts | No fabricated grants; source cited | Discovery |
| **Proposal Draft** | Sectioned prose + word limits + criterion alignment | Specific + evidence-based + editable | Writing |
| **Budget Table** | Categories + amounts + justification + calculations | Arithmetic consistent; narrative matches | Budget |
| **Compliance Report** | Severity buckets + issues + fix instructions | Issues map to requirements; no guessing | Compliance |
| **Review Report** | 3 reviewers + criterion scores + strengths/weaknesses/fixes | Rubric-aligned; prioritized actions | Review |
| **Pipeline Status** | Status list + deadlines + next actions + urgency flags | Valid pipeline states; deadlines explicit | Pipeline |

---

## Part 8: Implementation Architecture

### Directory Structure (Merged)

```
src/
├── agents/
│   ├── layer1_decision/
│   │   ├── SignalClassifier.js
│   │   ├── Screener.js
│   │   ├── ReadinessValidator.js
│   │   ├── DecisionReviewer.js
│   │   └── PackArchitect.js
│   ├── layer2_operations/
│   │   ├── GrantDiscoveryAgent.js
│   │   ├── DataExtractor.js
│   │   ├── WritingAgent.js
│   │   ├── BudgetBuilder.js
│   │   ├── ComplianceChecker.js
│   │   ├── ReviewSimulator.js
│   │   └── DeadlineAgent.js
│   └── MasterOrchestrator.js
│
├── skills/
│   ├── layer1_decision/
│   │   ├── screeningMatrix.js
│   │   ├── readinessDiagnostic.js
│   │   ├── advisoryDecisionState.js
│   │   └── sopSequencer.js
│   ├── layer2_operations/
│   │   ├── grantExtraction.js
│   │   ├── grantDiscovery.js
│   │   ├── proposalWriting.js
│   │   ├── budgetConstruction.js
│   │   ├── complianceValidation.js
│   │   ├── reviewSimulation.js
│   │   └── pipelineManagement.js
│   └── schemas/
│       ├── grantCanonicalSchema.js
│       ├── screeningMatrixSchema.js
│       ├── readinessDiagnosticSchema.js
│       ├── applicationPackSchema.js
│       └── enums.js
│
├── hooks/
│   ├── useDecisionFlow.js (Layer 1)
│   ├── useOperationsFlow.js (Layer 2)
│   ├── useGrant.js
│   ├── useScreening.js
│   ├── useReadiness.js
│   ├── useSkills.js
│   └── useSkillExecution.js
│
├── utils/
│   ├── verification/
│   │   ├── schemaValidator.js
│   │   ├── enumValidator.js
│   │   ├── dateValidator.js
│   │   └── halluccinationDetector.js
│   ├── governance/
│   │   ├── sopEnforcer.js
│   │   ├── gateController.js
│   │   └── ruleEngine.js
│   ├── extraction/
│   │   ├── dataTransform.js
│   │   ├── fieldNormalizer.js
│   │   └── sourceValidator.js
│   ├── scoring/
│   │   ├── screeningScorer.js
│   │   ├── readinessScorer.js
│   │   └── fatalRuleChecker.js
│   └── errorHandling/
│       └── complianceErrors.js
│
├── components/
│   ├── Layer1Decision/
│   │   ├── SignalIntakeForm.jsx
│   │   ├── ScreeningMatrix.jsx
│   │   ├── ReadinessDiagnostic.jsx
│   │   ├── AdvisoryDecisionDisplay.jsx
│   │   ├── GateController.jsx
│   │   └── PackPreview.jsx
│   ├── Layer2Operations/
│   │   ├── GrantDiscovery.jsx
│   │   ├── DataExtractor.jsx
│   │   ├── ProposalEditor.jsx
│   │   ├── BudgetBuilder.jsx
│   │   ├── ComplianceChecker.jsx
│   │   ├── ReviewSimulator.jsx
│   │   └── PipelineTracker.jsx
│   └── Shared/
│       ├── VerificationBadges.jsx
│       ├── SourceCitations.jsx
│       └── ErrorBoundary.jsx
│
├── pages/
│   ├── OpportunityScreening.jsx (SOP-1,2,3,4)
│   ├── PackBuilder.jsx (SOP-5)
│   ├── GrantDiscoveryHub.jsx (Layer 2)
│   ├── ProposalWorkbench.jsx (Layer 2)
│   ├── ComplianceDashboard.jsx (Layer 2)
│   └── PipelineView.jsx (Layer 2)
│
└── api/
    ├── decisionClient.js (Layer 1)
    ├── operationsClient.js (Layer 2)
    ├── grantExtractorClient.js
    └── pipelineClient.js

base44/
├── entities/
│   ├── opportunities.jsonc
│   ├── screenings.jsonc
│   ├── readiness_assessments.jsonc
│   ├── advisory_decisions.jsonc
│   ├── application_packs.jsonc
│   ├── grants.jsonc
│   ├── proposals.jsonc
│   ├── budgets.jsonc
│   ├── compliance_checks.jsonc
│   └── pipeline_items.jsonc
└── config.jsonc
```

---

## Part 9: Data Flow Architecture

### Merged Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 1: DECISION FLOW                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Signal Input → SOP-1: Intake → SOP-2: Screening           │
│                                    ↓                         │
│                            [Score > 12?]                    │
│                           /            \                    │
│                         YES              NO                  │
│                          ↓               ↓                   │
│                      SOP-3:          DECLINE                 │
│                    Readiness          (END)                  │
│                          ↓                                   │
│                    [Gaps closed?]                            │
│                    /           \                             │
│                  YES            NO                           │
│                   ↓              ↓                            │
│                SOP-4:         PREPARE                        │
│              Decision         (Hold)                         │
│                   ↓                                          │
│            [CEO Approval?]                                   │
│            /             \                                   │
│          YES              NO                                 │
│           ↓               ↓                                  │
│           GO            DEFER                               │
│           ↓              ↓                                   │
│         SOP-5          (Reassess)                            │
│     Pack Gen                                                 │
│           ↓                                                  │
│     [Gate Phrase?]                                           │
│     "Proceed to pack."                                       │
│           ↓                                                  │
│  ┌────────────────────────────────────────┐                │
│  │   LAYER 2: OPERATIONS FLOW (UNLOCKED)  │                │
│  └────────────────────────────────────────┘                │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              LAYER 2: OPERATIONS FLOW (PARALLEL)             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  Discovery  │→ │   Writing    │→ │     Budget      │   │
│  │   Mode      │  │     Mode     │  │      Mode       │   │
│  └─────────────┘  └──────────────┘  └─────────��───────┘   │
│                                              ↓              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ Extraction  │  │ Compliance   │→ │    Review       │   │
│  │   Mode      │  │    Mode      │  │     Mode        │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
│                                              ↓              │
│                                    ┌─────────────────┐     │
│                                    │   Pipeline      │     │
│                                    │   Tracking      │     │
│                                    └─────────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 10: Verification & Validation Framework

### Merged Validation Gates

| Gate | Layer | Trigger | Check | Action if Fail |
|------|-------|---------|-------|----------------|
| **Signal Integrity** | 1 | Intake complete | No nulls on required fields | Ask for clarification |
| **Screening Compliance** | 1 | Score ≥ 3 | Linked artifacts exist | Cap score at 2 |
| **Fatal Rule Enforcement** | 1 | Any score assigned | Strategic Align/Intent Fit/Risk = 0? | AUTO-DECLINE |
| **Total Score Threshold** | 1 | Screening complete | Total > 12 | DECLINE; no SOP-3 |
| **Readiness Closure** | 1 | Gap identified | Artifact verification | PREPARE state; list remediation |
| **CEO Escalation** | 1 | Advisory state assigned | CEO/Capital Committee notification | Hold until approved |
| **Gate Phrase** | 1→2 | Pack generation requested | User says "Proceed to pack." | Refuse; require phrase |
| **Schema Validity** | 2 | Output generated | JSON parseable; enums valid | Block export; fix errors |
| **Hallucination Check** | 2 | Extraction complete | Facts source-backed; no invented deadlines | Return nulls; ask for source |
| **Enum Conformity** | 2 | Field normalization | Values in canonical enum list | Return null; request clarification |
| **Date Normalization** | 2 | Dates extracted | YYYY-MM-DD format; not inferred | Return null if unsupported source |
| **Arithmetic Validation** | 2 | Budget totals calculated | Sums reconcile; no negative values | Flag errors; require manual review |

---

## Part 11: Feature Implementation Roadmap

### Phase 1: Core Integration (Week 1)
**Priority: CRITICAL**

- [ ] Create Layer 1 decision flow skeleton
- [ ] Implement SOP sequencer (enforces order)
- [ ] Build screening matrix schema + validator
- [ ] Create advisory decision state engine
- [ ] Integrate Layer 2 mode selector
- [ ] Add gate controller (phrase detection)
- [ ] Create Base44 entities (opportunities, screenings, decisions)

**Deliverables:**
- SOP-gated workflow operational
- Screening and readiness scorable
- Gate enforcement active

### Phase 2: Layer 1 Agents (Week 2)
**Priority: HIGH**

- [ ] Implement Signal Classifier
- [ ] Implement Screener (with fatal rules)
- [ ] Implement Readiness Validator
- [ ] Implement Decision Reviewer
- [ ] Link all agents to orchestrator
- [ ] Test SOP sequence enforcement
- [ ] Add verification tags to outputs

**Deliverables:**
- Full Layer 1 SOP cycle operational
- Fatal rules enforced
- Decision states assigned

### Phase 3: Layer 2 Foundation (Week 2-3)
**Priority: HIGH**

- [ ] Implement canonical schema (Grant Path AI)
- [ ] Implement Data Extractor
- [ ] Implement Grant Discovery Agent
- [ ] Build schema validator
- [ ] Add hallucination detection
- [ ] Create Base44 entities (grants, extractions)

**Deliverables:**
- Data extraction working
- Grant discovery functional
- Validation gates active

### Phase 4: Layer 2 Operations (Week 3-4)
**Priority: MEDIUM**

- [ ] Implement Writing Agent
- [ ] Implement Budget Builder
- [ ] Implement Compliance Checker
- [ ] Implement Review Simulator
- [ ] Integrate all into operations mode selector
- [ ] Test schema compliance for all outputs

**Deliverables:**
- Writing/budgeting/compliance/review modes operational
- All outputs schema-validated
- Ready for drafting workflows

### Phase 5: UI/UX (Week 4-5)
**Priority: MEDIUM**

- [ ] Build Layer 1 decision interface
- [ ] Build Layer 2 operations dashboard
- [ ] Add verification badge components
- [ ] Add source citation display
- [ ] Add error boundary components
- [ ] Create workflow navigation

**Deliverables:**
- User-facing interface complete
- All data flows visible
- Error handling clear

### Phase 6: Integration Testing (Week 5-6)
**Priority: HIGH**

- [ ] Test SOP → Layer 2 gate
- [ ] Test cross-layer data consistency
- [ ] Test Base44 entity sync
- [ ] Test validation gates (all scenarios)
- [ ] Test error handling
- [ ] Test with sample grants

**Deliverables:**
- Full workflow tested
- Gate enforcement verified
- Ready for pilot

---

## Part 12: API Contracts (Merged)

### Layer 1: Decision API

```javascript
// SOP-1: Signal Intake
POST /api/layer1/signals
{
  "source": "url | paste",
  "grantTitle": "string",
  "funder": "string",
  "deadline": "YYYY-MM-DD",
  "amount": "number",
  "url": "string?",
  "rfpText": "string?",
  "orgContext": "string?"
}

// SOP-2: Screening
POST /api/layer1/screenings
{
  "signalId": "string",
  "strategicAlignment": 0-4,
  "strategicAlignmentArtifacts": ["string"],
  "funderIntentFit": 0-4,
  "funderIntentFitArtifacts": ["string"],
  "organizationalCapacity": 0-4,
  "competitiveness": 0-4,
  "fundingAmount": 0-4,
  "riskLiability": 0-4,
  "riskLiabilityArtifacts": ["string"]
}

// Response with fatal-rule enforcement
{
  "screeningId": "string",
  "totalScore": number,
  "state": "GO | PREPARE | DEFER | DECLINE",
  "fatalRuleTriggered": boolean,
  "reasonIfDecline": "string?",
  "nextStep": "SOP-3 | DECLINED"
}

// SOP-3: Readiness
POST /api/layer1/readiness
{
  "screeningId": "string",
  "financialManagement": {
    "verified": boolean,
    "artifacts": ["string"],
    "gaps": ["string"]
  },
  "organizationalGovernance": { ... },
  "projectManagement": { ... },
  "compliance": { ... },
  "stakeholderAlignment": { ... }
}

// SOP-4: Decision Review
POST /api/layer1/decision-review
{
  "readinessId": "string",
  "decisionState": "GO | PREPARE | DEFER | DECLINE",
  "rationale": "string",
  "riskFlags": ["string"],
  "escalationRequired": boolean,
  "ceoApprovalNeeded": boolean
}

// SOP-5: Pack Generation (Gated)
POST /api/layer1/pack-generation
{
  "decisionId": "string",
  "gatePhrase": "string (must be 'Proceed to pack.')",
  "packTemplate": "standard | customized"
}
```

### Layer 2: Operations API

```javascript
// Mode: Discovery
POST /api/layer2/discovery
{
  "orgProfile": { ... },
  "fundingCriteria": { ... },
  "geoScope": "string",
  "maxAmount": number
}

// Mode: Extraction
POST /api/layer2/extract
{
  "source": "url | paste | file",
  "targetSchema": "grantCanonical | programDetails | applications"
}

// Mode: Writing
POST /api/layer2/write
{
  "grantDetails": { ... },
  "orgProfile": { ... },
  "section": "executive_summary | technical_approach | budget_justification",
  "wordLimit": number
}

// Mode: Budget
POST /api/layer2/budget
{
  "projectScope": "string",
  "requestedAmount": number,
  "projectDuration": number,
  "lineItems": [{ category, description, amount }]
}

// Mode: Compliance
POST /api/layer2/compliance-check
{
  "applicationSections": { ... },
  "requirementsList": ["string"]
}

// Mode: Review
POST /api/layer2/review-simulation
{
  "draftSections": { ... },
  "scoringRubric": { ... },
  "reviewerPersonas": ["expert", "conservative", "pragmatic"]
}

// Mode: Pipeline
POST /api/layer2/pipeline
{
  "applicationId": "string",
  "status": "discovery | writing | budget | compliance | review | submitted | awarded",
  "deadline": "YYYY-MM-DD"
}
```

---

## Part 13: Forbidden Behaviors Enforcement

### Implementation Rules

```javascript
// Layer 1 Enforcement
const layer1Guardrails = {
  canIssueFinalGO: false,
  requiresExplicitGatePhrase: "Proceed to pack.",
  allowFabricatedFacts: false,
  allowScoreWithoutArtifacts: false,
  allowZeroOnCriticalDimensions: false, // Auto-decline
  allowProceedWithLowScore: false, // <= 12
  allowSkipSOP: false,
  allowNarrativeDraftBeforePersona: false,
  treatDeferDeclineAsDraftable: false
};

// Layer 2 Enforcement
const layer2Guardrails = {
  allowHallucinatedFacts: false,
  allowInferredDeadlines: false,
  allowMixedSchemas: false,
  allowInvalidJSON: false,
  allowUnsupportedEnums: false,
  allowExportBeforeValidation: false,
  allowNullFilledWithoutTag: false
};

// Master Enforcement
const orchestratorGuardrails = {
  enforceSOPSequence: true,
  enforceLayerGating: true,
  enforceValidationBefore: ["export", "draft", "submit"],
  escapeHatchPhrase: null, // No bypasses
  allowPartialModeWithoutDecision: false
};
```

---

## Part 14: Success Metrics

| Metric | Layer | Target | Method |
|--------|-------|--------|--------|
| **SOP Sequence Compliance** | 1 | 100% | Audit logs; no skips |
| **Fatal Rule Enforcement** | 1 | 100% | Auto-decline rate on zero-trigger |
| **Gate Phrase Enforcement** | 1 | 100% | No pack generation without phrase |
| **Hallucination Rate** | 2 | 0% | Manual spot-check + validator |
| **Schema Validity** | 2 | 100% | JSON parseability; enum conformity |
| **Source-Backed Facts** | 2 | 100% | Verification tags visible |
| **Verification Tag Completeness** | Both | 100% | No untagged unknowns in output |
| **Decision Quality** | 1 | > 80% accuracy | Feedback from CEO/Capital Committee |
| **Operations Accuracy** | 2 | > 90% accuracy | Funder/reviewer feedback |
| **User Adoption** | Both | > 60% active usage | Login tracking; feature usage |

---

## Part 15: Glossary & Key Terms

| Term | Definition | Layer |
|------|-----------|-------|
| **SOP** | Standard Operating Procedure; non-negotiable sequence | 1 |
| **Gate Phrase** | Explicit user confirmation: "Proceed to pack." | 1 |
| **Advisory State** | GO/PREPARE/DEFER/DECLINE (not final) | 1 |
| **Fatal Rule** | Auto-decline condition (e.g., score 0 on critical dimension) | 1 |
| **Artifact** | Linked evidence document for scoring | 1 |
| **Readiness Gap** | Missing capability or documentation | 1 |
| **Canonical Schema** | Single source-of-truth data structure | 2 |
| **Hallucination** | Invented fact not backed by source | 2 |
| **Enum** | Allowed value set for a field | 2 |
| **Null** | Unresolved value; preferable to invention | 2 |
| **Verification Tag** | Label indicating verification status (e.g., [NEEDS VERIFICATION]) | Both |
| **Source-Backed** | Fact supported by cited source material | 2 |
| **Deterministic** | Consistent, rule-driven behavior | 2 |

---

## Part 16: Next Steps

### Immediate (This Week)
1. ✅ Create this integration plan
2. Create Layer 1 SOP sequence validator
3. Create Layer 2 schema definitions
4. Set up Base44 entities
5. Begin Phase 1 implementation

### Short Term (Next 2 Weeks)
6. Complete Layer 1 agents
7. Complete Layer 2 foundation
8. Build UI components
9. Integrate with existing CoPilot page

### Medium Term (Weeks 3-6)
10. Full testing and validation
11. Pilot with grant data
12. Refine based on feedback
13. Deploy to jpge-ghis-grants-workflow.base44.app

---

**Document Owner:** TawandaVera  
**Integration Scope:** Full Base44 app  
**Authority:** Merged GRANTED Hybrid + Grant Path AI SOPs  
**Next Review:** End of Week 1 implementation

