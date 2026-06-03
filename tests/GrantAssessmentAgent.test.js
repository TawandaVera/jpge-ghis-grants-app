import { describe, it, expect } from 'vitest';
import GrantAssessmentAgent from '../src/agents/layer2_operations/GrantAssessmentAgent.js';

describe('GrantAssessmentAgent', () => {
  const agent = new GrantAssessmentAgent();

  it('returns GO for high total score', () => {
    const result = agent.assess({
      scores: {
        strategicAlignment: 4,
        funderIntentFit: 4,
        organizationalCapacity: 3,
        competitiveness: 3,
        fundingAmount: 4,
        riskLiability: 3,
      },
    });
    expect(result.state).toBe('GO');
    expect(result.totalScore).toBeGreaterThanOrEqual(80);
  });

  it('returns DECLINE for low total', () => {
    const result = agent.assess({
      scores: {
        strategicAlignment: 1,
        funderIntentFit: 1,
        organizationalCapacity: 1,
        competitiveness: 1,
        fundingAmount: 1,
        riskLiability: 1,
      },
    });
    expect(result.state).toBe('DECLINE');
  });
});
