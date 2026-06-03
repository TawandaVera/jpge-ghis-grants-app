import { describe, it, expect } from 'vitest';
import ReadinessValidator from '../src/agents/layer1_decision/ReadinessValidator.js';

describe('ReadinessValidator', () => {
  const agent = new ReadinessValidator();

  it('scores 100 when no gaps', async () => {
    const res = await agent.assessReadiness({
      screeningId: 'scr1',
      domains: {
        financialManagement: { verified: true },
        organizationalGovernance: { verified: true },
        projectManagement: { verified: true },
        compliance: { verified: true },
        stakeholderAlignment: { verified: true },
      },
    });
    expect(res.readinessScore).toBe(100);
    expect(res.gapList.length).toBe(0);
  });

  it('registers gaps and lowers score', async () => {
    const res = await agent.assessReadiness({
      screeningId: 'scr2',
      domains: {
        financialManagement: { verified: false },
      },
    });
    expect(res.gapList.length).toBeGreaterThan(0);
    expect(res.readinessScore).toBeLessThan(100);
  });
});
