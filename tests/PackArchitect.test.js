import { describe, it, expect } from 'vitest';
import PackArchitect from '../src/agents/layer1_decision/PackArchitect.js';

describe('PackArchitect', () => {
  const agent = new PackArchitect();

  it('requires correct gate phrase', async () => {
    const res = await agent.generatePack({ decisionId: 'dec1', gatePhrase: 'Wrong' });
    expect(res.status).toBe('error');
  });

  it('unlocks layer2 with correct phrase', async () => {
    const res = await agent.generatePack({ decisionId: 'dec1', gatePhrase: 'Proceed to pack.' });
    expect(res.layer2Unlocked).toBe(true);
    expect(res.nextStep).toMatch(/Discovery/);
  });
});
