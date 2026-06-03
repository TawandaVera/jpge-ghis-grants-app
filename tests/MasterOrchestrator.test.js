import { describe, it, expect } from 'vitest';
import { MasterOrchestrator, layer1Agents, layer2Agents } from '../src/agents/index.js';

describe('MasterOrchestrator', () => {
  const orchestrator = new MasterOrchestrator(layer1Agents, layer2Agents);

  it('runs SOP 1→5 and unlocks Layer 2', async () => {
    const result = await orchestrator.processSignal({
      source: 'manual',
      title: 'Community Health',
      funder: 'HHS',
      deadline: '2026-12-31',
      amount: 50000,
      // demo props for screening + readiness
      scores: {
        strategicAlignment: 3,
        funderIntentFit: 3,
        organizationalCapacity: 3,
        competitiveness: 3,
        fundingAmount: 3,
        riskLiability: 2,
      },
      artifacts: ['plan.pdf'],
      domains: {
        financialManagement: { verified: true },
        organizationalGovernance: { verified: true },
        projectManagement: { verified: true },
        compliance: { verified: true },
        stakeholderAlignment: { verified: true },
      },
    });

    expect(result.status).toBe('workflow_complete');
    expect(result.decision.decisionState).toBe('GO');
    expect(result.layer2Unlocked).toBe(true);
  });
});
