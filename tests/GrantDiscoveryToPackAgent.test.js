import { describe, it, expect } from 'vitest';
import GrantDiscoveryToPackAgent from '../src/agents/layer2_operations/GrantDiscoveryToPackAgent.js';

describe('GrantDiscoveryToPackAgent', () => {
  const agent = new GrantDiscoveryToPackAgent();

  it('flags opportunity beyond 60-day deadline', () => {
    const res = agent.validate({ state: 'GO', matchScore: 90, deadline: '2027-01-01' });
    expect(res.actionable).toBe(false);
  });

  it('passes opportunity within window and score', () => {
    const future = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    const res = agent.validate({ state: 'PREP', matchScore: 75, deadline: future });
    expect(res.actionable).toBe(true);
    expect(res.checkpoints.length).toBe(3);
  });
});
