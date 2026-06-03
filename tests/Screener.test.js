import { describe, it, expect } from 'vitest';
import Screener from '../src/agents/layer1_decision/Screener.js';

describe('Screener', () => {
  const agent = new Screener();

  const baseScores = {
    strategicAlignment: 3,
    funderIntentFit: 3,
    organizationalCapacity: 3,
    competitiveness: 3,
    fundingAmount: 3,
    riskLiability: 2,
  };

  it('declines when critical dimension is 0', async () => {
    const scores = { ...baseScores, funderIntentFit: 0 };

    const res = await agent.scoreOpportunity({
      signalId: 'sig1',
      scores,
      artifacts: [],
    });

    expect(res.fatalRuleTriggered).toBe(true);
    expect(res.state).toBe('DECLINE');
  });

  it('returns GO when total score high and no fatal rules', async () => {
    const res = await agent.scoreOpportunity({
      signalId: 'sig2',
      scores: baseScores,
      artifacts: ['doc.pdf'],
    });

    expect(res.state).toBe('GO');
  });
});
