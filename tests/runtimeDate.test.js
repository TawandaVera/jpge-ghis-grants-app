import { describe, expect, it } from 'vitest';
import { daysUntilDate, toIsoDate } from '../src/lib/runtimeDate.js';

describe('runtimeDate utilities', () => {
  it('formats dates as ISO date labels', () => {
    expect(toIsoDate(new Date('2026-07-07T15:30:00Z'))).toBe('2026-07-07');
  });

  it('computes days until a target date from a supplied evaluation date', () => {
    expect(daysUntilDate('2026-07-17', new Date('2026-07-07T00:00:00Z'))).toBe(10);
  });

  it('returns null for invalid target dates', () => {
    expect(daysUntilDate('not-a-date', new Date('2026-07-07T00:00:00Z'))).toBeNull();
  });
});
