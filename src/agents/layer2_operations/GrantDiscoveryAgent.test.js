import { describe, it, expect, beforeEach } from 'vitest';
import GrantDiscoveryAgent from '../src/agents/layer2_operations/GrantDiscoveryAgent.js';

describe('GrantDiscoveryAgent — source filtering', () => {
  let agent;

  beforeEach(() => {
    agent = new GrantDiscoveryAgent();
  });

  // ─── isAllowedSource ────────────────────────────────────────────────────────

  it('blocks grants.gov in privateFoundationOnly mode', () => {
    expect(agent.isAllowedSource('https://www.grants.gov/opportunity/123', 'privateFoundationOnly')).toBe(false);
  });

  it('blocks nih.gov in privateFoundationOnly mode', () => {
    expect(agent.isAllowedSource('https://grants.nih.gov/grants/oer.htm', 'privateFoundationOnly')).toBe(false);
  });

  it('blocks hrsa.gov in privateFoundationOnly mode', () => {
    expect(agent.isAllowedSource('https://hrsa.gov/grants', 'privateFoundationOnly')).toBe(false);
  });

  it('blocks cdc.gov in privateFoundationOnly mode', () => {
    expect(agent.isAllowedSource('https://www.cdc.gov/grants', 'privateFoundationOnly')).toBe(false);
  });

  it('allows rwjf.org in privateFoundationOnly mode', () => {
    expect(agent.isAllowedSource('https://www.rwjf.org/en/grants.html', 'privateFoundationOnly')).toBe(true);
  });

  it('allows kresge.org in privateFoundationOnly mode', () => {
    expect(agent.isAllowedSource('https://kresge.org/grants', 'privateFoundationOnly')).toBe(true);
  });

  it('allows gatesfoundation.org in privateFoundationOnly mode', () => {
    expect(agent.isAllowedSource('https://www.gatesfoundation.org/grants', 'privateFoundationOnly')).toBe(true);
  });

  it('blocks unknown domains not in allowedDomains', () => {
    expect(agent.isAllowedSource('https://somerandomblog.com/grants', 'privateFoundationOnly')).toBe(false);
  });

  it('allows any domain in all mode', () => {
    expect(agent.isAllowedSource('https://grants.gov/opportunity/123', 'all')).toBe(true);
    expect(agent.isAllowedSource('https://rwjf.org/grants', 'all')).toBe(true);
  });

  it('returns false for malformed URLs', () => {
    expect(agent.isAllowedSource('not-a-url', 'privateFoundationOnly')).toBe(false);
  });

  // ─── resetDiscovery ─────────────────────────────────────────────────────────

  it('clears currentResults on reset', async () => {
    agent.currentResults = [{ title: 'Old Grant' }];
    agent.resetDiscovery({ sourceMode: 'privateFoundationOnly' });
    expect(agent.currentResults).toHaveLength(0);
  });

  it('records a DISCOVERY_RESET audit event', () => {
    agent.resetDiscovery({ sourceMode: 'privateFoundationOnly' });
    const event = agent.auditTrail[0];
    expect(event.event).toBe('DISCOVERY_RESET');
    expect(event.sourceMode).toBe('privateFoundationOnly');
    expect(event.governmentSourcesExcluded).toBe(true);
  });

  it('preserves existing auditTrail entries on reset', () => {
    agent.auditTrail.push({ event: 'PRIOR_RUN', timestamp: '2025-01-01T00:00:00Z' });
    agent.resetDiscovery({ sourceMode: 'privateFoundationOnly' });
    expect(agent.auditTrail).toHaveLength(2);
    expect(agent.auditTrail[0].event).toBe('PRIOR_RUN');
  });

  // ─── discoverPrivateFoundationGrants ────────────────────────────────────────

  it('returns governmentSourcesExcluded: true', async () => {
    const result = await agent.discoverPrivateFoundationGrants({ keywords: ['health equity'] });
    expect(result.governmentSourcesExcluded).toBe(true);
    expect(result.sourceMode).toBe('privateFoundationOnly');
  });

  it('includes a transparency report with required fields', async () => {
    const result = await agent.discoverPrivateFoundationGrants();
    const { transparencyReport } = result;
    expect(transparencyReport).toHaveProperty('run_id');
    expect(transparencyReport.source_mode).toBe('privateFoundationOnly');
    expect(transparencyReport.government_sources_excluded).toBe(true);
    expect(Array.isArray(transparencyReport.searched_sources)).toBe(true);
    expect(transparencyReport.searched_sources).toContain('rwjf.org');
    expect(transparencyReport.searched_sources).not.toContain('grants.gov');
  });

  it('includes resetEvent and auditTrail in result', async () => {
    const result = await agent.discoverPrivateFoundationGrants();
    expect(result.resetEvent.event).toBe('DISCOVERY_RESET');
    expect(Array.isArray(result.auditTrail)).toBe(true);
  });
});
