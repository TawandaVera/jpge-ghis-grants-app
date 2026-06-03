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
      artifacts: ['doc.pdf'],
    });

    expect(res.fatalRuleTriggered).toBe(true);
    expect(res.state).toBe('DECLINE');
  });

  it('returns GO when total score high and no fatal rules', async () => {
    const highScores = {
      strategicAlignment: 4,
      funderIntentFit: 4,
      organizationalCapacity: 4,
      competitiveness: 4,
      fundingAmount: 4,
      riskLiability: 4,
    };

    const res = await agent.scoreOpportunity({
      signalId: 'sig2',
      scores: highScores,
      artifacts: ['doc.pdf'],
    });

    expect(res.state).toBe('GO');
  });
});
