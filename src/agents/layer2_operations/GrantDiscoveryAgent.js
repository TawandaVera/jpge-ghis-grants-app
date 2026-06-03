import crypto from 'crypto';
import { SOURCE_PROFILES } from './discovery/sourceProfiles.js';

/**
 * Grant Discovery Agent (Layer 2, Operations)
 * Discovers, deduplicates, scores, and ranks grant opportunities.
 * Supports source-mode filtering to restrict discovery to private foundations.
 */
class GrantDiscoveryAgent {
  constructor() {
    this.name = 'GrantDiscoveryAgent';
    this.mode = 'Discovery';
    this.currentResults = [];
    this.auditTrail = [];
    this.seenFingerprints = new Set();
  }

  // ─── Fingerprinting ────────────────────────────────────────────────────────

  #fingerprint(grant) {
    const basis = `${grant.title}|${grant.funder}|${grant.deadline}|${grant.amount}`;
    return crypto.createHash('sha256').update(basis).digest('hex');
  }

  // ─── Source filtering ──────────────────────────────────────────────────────

  /**
   * Returns true if the given URL is permitted under the active source profile.
   * @param {string} url
   * @param {string} sourceMode
   * @returns {boolean}
   */
  isAllowedSource(url, sourceMode = 'all') {
    const profile = SOURCE_PROFILES[sourceMode];
    if (!profile) return true;

    let host;
    try {
      host = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return false;
    }

    const blocked = profile.blockedDomains.some(domain => host.endsWith(domain));
    if (blocked) return false;

    if (profile.allowedDomains.length === 0) return true;

    return profile.allowedDomains.some(domain => host.endsWith(domain));
  }

  // ─── Discovery reset ───────────────────────────────────────────────────────

  /**
   * Clears the current discovery working set and records an audit event.
   * Historical auditTrail entries are preserved.
   * @param {{ sourceMode?: string }} options
   * @returns {Object} resetEvent
   */
  resetDiscovery({ sourceMode = 'privateFoundationOnly' } = {}) {
    const profile = SOURCE_PROFILES[sourceMode];

    this.currentResults = [];
    this.seenFingerprints = new Set();

    const resetEvent = {
      event: 'DISCOVERY_RESET',
      timestamp: new Date().toISOString(),
      sourceMode,
      governmentSourcesExcluded: profile.excludeGovernment,
      allowedDomains: profile.allowedDomains,
      blockedDomains: profile.blockedDomains,
    };

    this.auditTrail.push(resetEvent);
    return resetEvent;
  }

  // ─── Core discovery (mock → replace with live crawlers) ───────────────────

  /**
   * Core discovery method. Accepts sourceMode to pre-filter candidates.
   * @param {Object} criteria
   * @returns {Promise<{ grants: Object[], scores: Object[], matches: Object[] }>}
   */
  async discoverGrants(criteria = {}) {
    const { sourceMode = 'all', keywords = [], maxAmount } = criteria;

    // TODO: Replace mock feed with live crawlers + Redis fingerprint cache.
    // Each crawler module should call this.isAllowedSource(url, sourceMode)
    // before adding a candidate to the pipeline.
    const mockCandidates = [];

    const grants = [];
    const duplicatesRejected = [];
    const invalidRejected = [];

    for (const candidate of mockCandidates) {
      const url = candidate.source_url || candidate.url || '';

      if (!this.isAllowedSource(url, sourceMode)) {
        invalidRejected.push({ grant: candidate, reason: 'source_blocked' });
        continue;
      }

      const fp = this.#fingerprint(candidate);
      if (this.seenFingerprints.has(fp)) {
        duplicatesRejected.push({ grant: candidate, reason: 'duplicate_fingerprint' });
        continue;
      }

      this.seenFingerprints.add(fp);
      grants.push({ ...candidate, _fingerprint: fp });
    }

    const scores = grants.map(g => ({
      grantId: g._fingerprint?.slice(0, 10),
      score: this.#scoreGrant(g, keywords, maxAmount),
    }));

    const matches = grants
      .map((grant, i) => ({ grant, score: scores[i]?.score ?? 0 }))
      .sort((a, b) => b.score - a.score);

    this.currentResults = grants;

    return { grants, scores, matches, duplicatesRejected, invalidRejected };
  }

  // ─── Scoring ───────────────────────────────────────────────────────────────

  #scoreGrant(grant, keywords = [], maxAmount) {
    let score = 50;

    if (keywords.length > 0) {
      const text = `${grant.title} ${grant.description || ''}`.toLowerCase();
      const hits = keywords.filter(kw => text.includes(kw.toLowerCase())).length;
      score += (hits / keywords.length) * 30;
    }

    if (maxAmount && grant.amount <= maxAmount) score += 10;
    if (grant.deadline) {
      const daysUntil = (new Date(grant.deadline) - Date.now()) / 86_400_000;
      if (daysUntil > 30 && daysUntil < 180) score += 10;
    }

    return Math.min(100, Math.round(score));
  }

  // ─── Private Foundation Reset (primary public API) ─────────────────────────

  /**
   * Clears results and runs discovery restricted to private foundation sources.
   * Government grant sources are explicitly excluded.
   * @param {Object} criteria - keywords, maxAmount, etc.
   * @returns {Promise<Object>} Full transparency report + filtered results
   */
  async discoverPrivateFoundationGrants(criteria = {}) {
    const resetEvent = this.resetDiscovery({ sourceMode: 'privateFoundationOnly' });

    const candidates = await this.discoverGrants({
      ...criteria,
      sourceMode: 'privateFoundationOnly',
      excludeGovernment: true,
    });

    const transparencyReport = {
      run_id: `private_foundation_reset_${Date.now()}`,
      source_mode: 'privateFoundationOnly',
      government_sources_excluded: true,
      searched_sources: SOURCE_PROFILES.privateFoundationOnly.allowedDomains,
      raw_candidates_found: candidates.grants.length,
      duplicates_rejected: candidates.duplicatesRejected ?? [],
      invalid_rejected: candidates.invalidRejected ?? [],
      new_grants_added: candidates.grants.map(g => g._fingerprint?.slice(0, 10)),
      class_distribution: {
        foundations: 0,
        hybrid: 0,
        innovation: 0,
      },
    };

    return {
      sourceMode: 'privateFoundationOnly',
      governmentSourcesExcluded: true,
      resetEvent,
      grants: candidates.grants,
      scores: candidates.scores,
      matches: candidates.matches,
      transparencyReport,
      auditTrail: this.auditTrail,
      lastCrawl: new Date().toISOString(),
    };
  }
}

export default GrantDiscoveryAgent;
