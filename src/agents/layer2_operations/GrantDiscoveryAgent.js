import crypto from 'crypto';
import dataTransform from '../../utils/extraction/dataTransform.js';
import fieldNormalizer from '../../utils/extraction/fieldNormalizer.js';

/**
 * Grant Discovery Agent (Layer-2)
 * NOTE: Placeholder implementation that ranks a static dataset.
 */
const MOCK_FEED = [
  {
    opportunityId: 'GRANT001',
    title: 'Community Health Improvement',
    funder: 'HHS',
    deadline: '2026-08-15',
    fundingAmount: 250000,
    description: 'Grants to improve community health outcomes.',
  },
  {
    opportunityId: 'GRANT002',
    title: 'Renewable Energy Innovation',
    funder: 'DOE',
    deadline: '2026-07-01',
    fundingAmount: 500000,
    description: 'Support for novel renewable energy technologies.',
  },
];

class GrantDiscoveryAgent {
  constructor() {
    this.name = 'GrantDiscoveryAgent';
    this.mode = 'Discovery';
  }

  /** Build fingerprint */
  #fp(g) {
    const str = `${g.title}|${g.funder}|${g.deadline}|${g.fundingAmount}`;
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  /** Simple relevance score: keyword match + amount fit */
  #score(grant, criteria) {
    const kwScore = criteria.keywords?.some(k => grant.title.toLowerCase().includes(k.toLowerCase())) ? 60 : 30;
    const amtScore = grant.fundingAmount <= (criteria.maxAmount || Infinity) ? 40 : 10;
    return kwScore + amtScore; // out of 100
  }

  /**
   * Discover and rank opportunities against criteria.
   * @param {{ keywords:string[], maxAmount?:number }} criteria
   */
  async discoverGrants(criteria = {}) {
    try {
      // 1. Fetch feed (mock)
      const canonical = MOCK_FEED.map(r => dataTransform.toCanonical(r));

      // 2. Normalize fields
      canonical.forEach(g => {
        g.title = fieldNormalizer.cleanString(g.title);
        g.deadline = fieldNormalizer.toIsoDate(g.deadline);
      });

      // 3. Fingerprint (dedupe placeholder)
      const unique = {};
      canonical.forEach(g => {
        const fp = this.#fp(g);
        if (!unique[fp]) unique[fp] = { ...g, fingerprint: fp };
      });

      // 4. Score
      const scored = Object.values(unique).map(g => {
        const score = this.#score(g, criteria);
        return { grant: g, score };
      });

      // 5. Rank
      scored.sort((a, b) => b.score - a.score);

      return {
        grants: scored.map(s => s.grant),
        scores: Object.fromEntries(scored.map(s => [s.grant.opportunityId, s.score])),
        matches: scored,
        lastCrawl: new Date().toISOString(),
      };
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  }
}

export default GrantDiscoveryAgent;
