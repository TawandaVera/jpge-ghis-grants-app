# Consolidated Improvements: Discovery Engine & Agents Integration

**Date:** 2026-06-03  
**Scope:** Merge insights from `grantpath-ai` (discovery architecture) + `jpge-ghis-grants-app` (frontend scaffold + skills plan)  
**Target:** jpge-ghis-grants-app as unified platform  
**Deliverable:** Production-ready grant intelligence platform with dual-layer SOP gating

---

## Executive Summary

This document consolidates two complementary codebases:

1. **TawandaVera/grantpath-ai** (TypeScript backend):
   - 11 agent architecture defined conceptually
   - Discovery engine architecture documented
   - 8 entity data model
   - Agent bootstrap guidance
   - **Missing:** Actual implementation, Base44 function code, frontend

2. **TawandaVera/jpge-ghis-grants-app** (JavaScript frontend + Base44):
   - React/Vite frontend scaffold (12 pages)
   - Comprehensive skills integration plan (GRANTED Hybrid + Grant Path AI)
   - Layer 1 (Decision) & Layer 2 (Operations) architecture defined
   - Meta review with action plan
   - **Missing:** Agent logic, discovery engine, Base44 entity definitions, hooks/utils

**Result:** Unified architecture combining GRANTED Hybrid (governance-first decision layer) + Grant Path AI (source-first operations layer).

---

## Part 1: Architecture Overview

### Dual-Layer System

**Layer 1: Decision (GRANTED Hybrid)**
- Signal Intake (SOP-1) → Screening (SOP-2) → Readiness (SOP-3) → Decision (SOP-4) → Pack (SOP-5)
- Advisory states: GO / PREPARE / DEFER / DECLINE
- CEO approval required
- Gate phrase enforcement: "Proceed to pack."

**Layer 2: Operations (Grant Path AI)**
- Discovery Mode: Find & rank opportunities
- Writing Mode: Draft proposal sections
- Budget Mode: Build line-item budgets
- Compliance Mode: Validate requirements
- Review Mode: Simulate multi-persona review
- Extraction Mode: Convert sources to canonical JSON
- Pipeline Mode: Track deadlines & urgency

**Orchestration:** Master Orchestrator enforces SOP sequence, manages state transitions, gates Layer 2 until Layer 1 decision.

---

## Part 2: 12 Agents Architecture

### Layer 1 (Decision)
1. **Signal Classifier** — Route opportunities into SOP-1
2. **Screener** — Execute SOP-2 (0–4 scoring matrix)
3. **Readiness Validator** — Execute SOP-3 (gap identification)
4. **Decision Reviewer** — Execute SOP-4 (advisory state assignment)
5. **Pack Architect** — Generate SOP-5 (application pack structure)

### Layer 2 (Operations)
6. **Grant Discovery Agent** — Find & rank opportunities (cosine similarity + GPT-4o)
7. **Data Extractor** — Convert sources to canonical JSON (no hallucination)
8. **Writing Agent** — Draft proposal content (section-level, criterion-aligned)
9. **Budget Builder** — Construct line-item budgets (IDC rates, fringe)
10. **Compliance Checker** — Validate requirements (severity-rated issues)
11. **Review Simulator** — Simulate multi-persona panel review
12. **Deadline Agent** — Track deadlines & escalate urgency

### Orchestration
13. **Master Orchestrator** — Coordinate Layer 1 → Layer 2, enforce SOP sequencing, manage gates

---

## Part 3: Discovery Engine

**Core Process:**
1. Crawl Grants.gov every 6 hours (grantDiscoveryAgent)
2. Create fingerprint (SHA256) to detect duplicates
3. Score each opportunity (matchingAgent: 0–100 scale)
4. Rank by score, deadline, funding amount
5. Display in searchable database with detail panel

**Scoring Formula (SOP4):**
```javascript
Total Score = (Mandate × 0.40) + (Eligibility × 0.30) + (Deadline × 0.20) + (Geography × 0.10)

Decision Thresholds:
  GO        ≥ 80  — Pursue immediately
  PREP      ≥ 60  — Prepare with conditions
  DEFER     ≥ 40  — Monitor; reassess later
  DECLINE   < 40  — Do not pursue
```

Weights auto-calibrate from real grant outcomes (scoringCalibrationAgent).

---

## Part 4: Data Model (11 Entities)

**Core (8 from grantpath-ai):**
- Grant (Grants.gov opportunities)
- OrgProfile (GHIS LLC profile, mission, capacity)
- GrantMatch (AI-scored matches with rationale)
- GrantApplication (Full application workspace)
- MasterNarrative (Versioned org narrative with diff)
- HILCheckpoint (Human-in-the-loop decision log)
- CalibrationSnapshot (Scoring calibration history)
- GrantOutcome (Award/decline outcomes + ROI)

**Layer 1 Specific:**
- Opportunity (Signal for decision gating)
- Screening (SOP-2 output)
- ReadinessAssessment (SOP-3 output)
- AdvisoryDecision (SOP-4 output)
- ApplicationPack (SOP-5 output, gates Layer 2)

**Audit:**
- SkillExecution (Agent invocation record)

---

## Part 5: 6-Week Implementation Roadmap

| Phase | Week | Focus | Deliverables |
|-------|------|-------|--------------|
| 1 | W1 | Foundation | Directory structure, Base44 entities, SOP sequencer, schemas |
| 2 | W2 | Layer 1 Agents | All 5 decision agents, screening matrix, fatal rules |
| 3 | W2-3 | Layer 2 Foundation | Discovery agent, data extractor, validation gates |
| 4 | W3-4 | Layer 2 Operations | Writing, budget, compliance, review agents |
| 5 | W4-5 | UI/UX | Decision interface, ops dashboard, verification badges |
| 6 | W5-6 | Testing & Docs | Full workflows, gate enforcement, pilot data, documentation |

---

## Part 6: Forbidden Behaviors (Auto-Enforced, No Bypass)

**Layer 1 Rules:**
- ❌ Issue final GO (advisory only)
- ❌ Begin pack generation before gate phrase: "Proceed to pack."
- ❌ Fabricate eligibility, deadlines, or funder intent
- ❌ Score ≥3 without linked artifacts
- ❌ Allow score of 0 on Strategic Alignment → AUTO-DECLINE
- ❌ Proceed with total screening score ≤12 → AUTO-DECLINE
- ❌ Skip SOP sequence

**Layer 2 Rules:**
- ❌ Hallucinate grant facts, contacts, or deadlines
- ❌ Infer missing values (return null instead)
- ❌ Mix legacy and modern schemas
- ❌ Export invalid JSON
- ❌ Use unsupported enum values
- ❌ Allow export before validation

**System Rules:**
- ❌ Bypass Layer 1 → Layer 2 gating
- ❌ Treat user preference over rule hierarchy
- ❌ Omit required verification tags
- ❌ Provide output without validation

---

## Part 7: Directory Structure (Phase 1)

```
src/
├── agents/
│   ├── layer1_decision/
│   │   ├── SignalClassifier.js
│   │   ├── Screener.js
│   │   ├── ReadinessValidator.js
│   │   ├── DecisionReviewer.js
│   │   ├── PackArchitect.js
│   │   └── types.js
│   ├── layer2_operations/
│   │   ├── GrantDiscoveryAgent.js
│   │   ├── DataExtractor.js
│   │   ├── WritingAgent.js
│   │   ├── BudgetBuilder.js
│   │   ├── ComplianceChecker.js
│   │   ├── ReviewSimulator.js
│   │   ├── DeadlineAgent.js
│   │   └── types.js
│   ├── MasterOrchestrator.js
│   └── index.js
│
├── skills/
│   ├── layer1_decision/
│   │   ├── screeningMatrix.js
│   │   ├── readinessDiagnostic.js
│   │   ├── advisoryDecisionState.js
│   │   ├── sopSequencer.js
│   │   └── fatalRuleChecker.js
│   ├── layer2_operations/
│   │   ├── grantExtraction.js
│   │   ├── grantDiscovery.js
│   │   ├── proposalWriting.js
│   │   ├── budgetConstruction.js
│   │   ├── complianceValidation.js
│   │   ├── reviewSimulation.js
│   │   └── pipelineManagement.js
│   ├── schemas/
│   │   ├── grantCanonicalSchema.js
│   │   ├── screeningMatrixSchema.js
│   │   ├── readinessDiagnosticSchema.js
│   │   ├── applicationPackSchema.js
│   │   └── enums.js
│   └── index.js
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
└── hooks/
    ├── useDecisionFlow.js
    ├── useOperationsFlow.js
    ├── useGrant.js
    ├── useScreening.js
    ├── useReadiness.js
    ├── useSkills.js
    └── useSkillExecution.js

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
│   ├── pipeline_items.jsonc
│   └── skill_executions.jsonc
└── config.jsonc (updated)
```

---

## Part 8: API Contracts

### Layer 1: Decision Flow

```javascript
// SOP-1: Signal Intake
POST /api/layer1/signals
{ source, title, funder, deadline, amount, rfpText?, url? }
→ { signalId, status: "signal_recorded" }

// SOP-2: Screening
POST /api/layer1/screenings
{ signalId, strategicAlignment, funderIntentFit, organizationalCapacity, competitiveness, fundingAmount, riskLiability, artifacts }
→ { screeningId, totalScore, state: "GO|PREPARE|DEFER|DECLINE" }

// SOP-3: Readiness
POST /api/layer1/readiness
{ screeningId, financialManagement, organizationalGovernance, projectManagement, compliance, stakeholderAlignment }
→ { readinessId, gapList, estimatedTimeToResolve }

// SOP-4: Decision Review
POST /api/layer1/decision-review
{ readinessId, decisionState, rationale }
→ { decisionId, ceoApprovalRequired }

// SOP-5: Pack Generation (Gated)
POST /api/layer1/pack-generation
{ decisionId, gatePhrase: "Proceed to pack." }
→ { packId, structure, layer2Unlocked: true }
```

### Layer 2: Operations Flow

```javascript
// Discovery
POST /api/layer2/discovery
{ orgProfile, fundingCriteria, geoScope, maxAmount }
→ { grants, scores, matches }

// Extraction
POST /api/layer2/extract
{ source, targetSchema }
→ { validJson, nullFields, warnings }

// Writing
POST /api/layer2/write
{ grantDetails, orgProfile, section, wordLimit }
→ { draft, wordCount, alignmentScore }

// Budget
POST /api/layer2/budget
{ projectScope, requestedAmount, projectDuration, lineItems }
→ { budgetTable, justification, totalReconciled }

// Compliance
POST /api/layer2/compliance-check
{ applicationSections, requirementsList }
→ { issues: [{severity, message, fix}], isReady }

// Review
POST /api/layer2/review-simulation
{ draftSections, scoringRubric, reviewerPersonas }
→ { scores, strengths, weaknesses, priorities }

// Pipeline
POST /api/layer2/pipeline
{ applicationId, status, deadline }
→ { timeline, urgencyFlags, nextActions }
```

---

## Part 9: Configuration Updates

### base44/config.jsonc
```jsonc
{
  "name": "GrantPath AI",
  "version": "1.0.0",
  "description": "Governance-first grant intelligence and application platform",
  "site": {
    "installCommand": "npm install",
    "buildCommand": "npm run build",
    "serveCommand": "npm run dev",
    "outputDirectory": "./dist",
    "nodeVersion": "18"
  },
  "agents": {
    "layer1": ["SignalClassifier", "Screener", "ReadinessValidator", "DecisionReviewer", "PackArchitect"],
    "layer2": ["GrantDiscoveryAgent", "DataExtractor", "WritingAgent", "BudgetBuilder", "ComplianceChecker", "ReviewSimulator", "DeadlineAgent"]
  },
  "orchestration": {
    "sopEnforcement": true,
    "gateEnforcement": true,
    "validationRequired": ["export", "draft", "submit"]
  }
}
```

### package.json (add to dependencies)
```json
{
  "zustand": "^4.4.0",
  "zod": "^3.24.2",
  "axios": "^1.6.0",
  "@hookform/resolvers": "^3.3.0"
}
```

---

## Part 10: Success Metrics

| Metric | Target | Validation |
|--------|--------|-----------|
| **SOP Sequence Compliance** | 100% | Audit logs; no skips |
| **Fatal Rule Enforcement** | 100% | Auto-decline on zero-trigger |
| **Gate Phrase Enforcement** | 100% | No pack generation without phrase |
| **Hallucination Rate** | 0% | Manual spot-check + validator |
| **Schema Validity** | 100% | JSON parseability; enum conformity |
| **Source-Backed Facts** | 100% | Verification tags visible |
| **Decision Quality** | >80% accuracy | CEO/Capital Committee feedback |
| **Operations Accuracy** | >90% accuracy | Funder/reviewer feedback |
| **Delivery Timeline** | 6 weeks | On-time delivery |

---

## Part 11: What's Being Integrated

### From grantpath-ai:
✅ 11-agent architecture  
✅ Discovery engine (crawl, deduplicate, score, rank)  
✅ Scoring formula (40-30-20-10 weights)  
✅ Data model (8 core entities)  
✅ HIL checkpoint format  
✅ Master narrative versioning  
✅ Financial ROI tracking  

### From jpge-ghis-grants-app:
✅ React/Vite frontend scaffold  
✅ Skills integration plan (full Layer 1/2 architecture)  
✅ Page structure (12 pages)  
✅ Auth context & API setup  
✅ Base44 SDK integration  
✅ Tailwind CSS styling  
✅ Meta review & action plan  

---

## Part 12: Immediate Next Steps

### This Week
1. ✅ Create CONSOLIDATED_IMPROVEMENTS.md (this document)
2. Create directory structure (agents/, skills/, utils/, hooks/)
3. Create Base44 entity definitions (.jsonc files)
4. Implement Phase 1 skeleton files
5. Create SOP Sequencer + GateController core

### Week 1-2
6. Implement Layer 1 agents (all 5)
7. Build screening matrix + fatal rules
8. Create validation framework

### Week 2-3
9. Implement Layer 2 agents (all 7)
10. Build UI components
11. Integrate with pages

### Week 3-6
12. Full testing & debugging
13. Performance optimization
14. Documentation & pilot
15. Deploy to jpge-ghis-grants-workflow.base44.app

---

## Reference Documents

- **SKILLS_INTEGRATION_PLAN.md** — Full Layer 1/2 architecture (jpge-ghis-grants-app)
- **META_REVIEW.md** — jpge-ghis-grants-app evaluation (jpge-ghis-grants-app)
- **grantpath-ai/README.md** — Original agent architecture (grantpath-ai)
- **CONSOLIDATED_IMPROVEMENTS.md** — This unified blueprint

---

**Owner:** TawandaVera  
**Integration Scope:** jpge-ghis-grants-app (unified platform)  
**Authority:** grantpath-ai (discovery) + jpge-ghis-grants-app (skills plan) merged  
**Next Review:** End of Phase 1 (1 week)  
**Status:** ✅ Blueprint Complete — Ready for Phase 1 Implementation
