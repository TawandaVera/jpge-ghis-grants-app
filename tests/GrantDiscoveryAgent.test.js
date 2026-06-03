import { describe, it, expect } from 'vitest';
import GrantDiscoveryAgent from '../src/agents/layer2_operations/GrantDiscoveryAgent.js';

describe('GrantDiscoveryAgent', () => {
  const agent = new GrantDiscoveryAgent();

  it('returns ranked grants based on keyword match', async () => {
    const res = await agent.discoverGrants({ keywords: ['health'], maxAmount: 300000 });
    expect(res.grants.length).toBeGreaterThan(0);
    const top = res.grants[0];
    expect(top.title.toLowerCase()).toContain('health');
  });
});
