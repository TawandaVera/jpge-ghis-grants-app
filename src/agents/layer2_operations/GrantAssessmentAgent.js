/**
 * GrantAssessmentAgent (Layer‑2)
 * Implements SOP‑4 100‑point framework with transparent breakdown.
 */
class GrantAssessmentAgent {
  constructor() {
    this.name = 'GrantAssessmentAgent';
    this.mode = 'Assessment';
  }

  /** weight map max points */
  #weights() {
    return {
      strategicAlignment: 20,
      funderIntentFit: 20,
      organizationalCapacity: 15,
      competitiveness: 15,
      fundingAmount: 20,
      riskLiability: 10, // inverse (lower risk → higher score)
    };
  }

  /**
   * Assess a grant opportunity using 0‑4 raw scores per dimension.
   * @param {{ scores:Object<string,number> }} input
   */
  assess(input) {
    const w = this.#weights();
    const breakdown = {};
    let total = 0;

    Object.entries(w).forEach(([dim, max]) => {
      const raw = Math.max(0, Math.min(4, Number(input.scores?.[dim] ?? 0)));
      const pts = Math.round((raw / 4) * max);
      breakdown[dim] = pts;
      total += pts;
    });

    let state = 'DECLINE';
    if (total >= 80) state = 'GO';
    else if (total >= 60) state = 'PREP';
    else if (total >= 40) state = 'DEFER';

    return {
      totalScore: total,
      breakdown,
      state,
      nextStep: state === 'GO' ? 'Packaging' : 'END',
    };
  }
}

export default GrantAssessmentAgent;
