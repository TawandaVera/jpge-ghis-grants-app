/**
 * screeningScorer
 * Converts 0‑4 dimension scores into a 0‑100 total weight.
 */

const weights = {
  strategicAlignment: 0.20,
  funderIntentFit: 0.20,
  organizationalCapacity: 0.15,
  competitiveness: 0.15,
  fundingAmount: 0.20,
  riskLiability: 0.10,
};

const screeningScorer = {
  /**
   * Calculate weighted total (0‑100)
   * @param {Object} scores - keys matching weight map
   */
  total(scores) {
    let sum = 0;
    for (const [k, w] of Object.entries(weights)) {
      const s = Number(scores[k] ?? 0);
      sum += (s / 4) * 100 * w; // normalize each dimension 0‑100 then weight
    }
    return Math.round(sum);
  },
};

export default screeningScorer;
