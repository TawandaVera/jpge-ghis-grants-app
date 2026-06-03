import { describe, it, expect } from 'vitest';
import SignalClassifier from '../src/agents/layer1_decision/SignalClassifier.js';

describe('SignalClassifier', () => {
  const agent = new SignalClassifier();

  it('rejects missing required fields', async () => {
    const res = await agent.processSignal({ title: 'Test' });
    expect(res.status).toBe('error');
    expect(res.error).toMatch(/Missing fields/);
  });

  it('accepts minimal valid signal', async () => {
    const res = await agent.processSignal({
      source: 'manual',
      title: 'My Grant',
      funder: 'XYZ',
      deadline: '2026-12-31',
      amount: 10000,
    });
    expect(res.status).toBe('signal_recorded');
    expect(res.nextStep).toBe('SOP-2: Screening');
  });
});
