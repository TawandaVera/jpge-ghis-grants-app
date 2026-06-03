import { describe, it, expect } from 'vitest';
import DecisionReviewer from '../src/agents/layer1_decision/DecisionReviewer.js';

describe('DecisionReviewer', () => {
  const agent = new DecisionReviewer();

  it('returns GO with high aggregate', async () => {
    const res = await agent.reviewAndDecide({
      screeningScore: 90,
      readinessScore: 90,
      gapList: [],
      riskFlags: [],
    });
    expect(res.decisionState).toBe('GO');
    expect(res.ceoApprovalRequired).toBe(true);
  });

  it('returns DECLINE on low aggregate', async () => {
    const res = await agent.reviewAndDecide({
      screeningScore: 30,
      readinessScore: 20,
      gapList: [],
      riskFlags: [],
    });
    expect(res.decisionState).toBe('DECLINE');
  });
});
