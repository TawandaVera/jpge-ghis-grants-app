/**
 * readinessScorer
 * Computes readiness percentage from gap list severity.
 */

const readinessScorer = {
  /**
   * Compute readiness (0‑100). Fewer gaps → higher score.
   * Accepts array of gaps with { severity: 'critical'|'high'|'medium'|'low' }
   */
  score(gapList) {
    if (!gapList || gapList.length === 0) return 100;

    const severityWeight = { critical: 25, high: 15, medium: 8, low: 2 };
    const maxPenalty = 100;
    let penalty = 0;

    gapList.forEach(g => {
      penalty += severityWeight[g.severity] || 5;
    });

    penalty = Math.min(penalty, maxPenalty);
    return 100 - penalty;
  },
};

export default readinessScorer;
