/**
 * Screening Matrix Skill (SOP-2)
 * Implements 0-4 scoring across six dimensions.
 */

const screeningMatrix = {
  dimensions: [
    'strategicAlignment',
    'funderIntentFit',
    'organizationalCapacity',
    'competitiveness',
    'fundingAmount',
    'riskLiability',
  ],

  calculateScore(scores = {}, artifacts = []) {
    const errors = [];
    let rawTotal = 0;

    this.dimensions.forEach((dimension) => {
      const value = Number(scores[dimension] ?? 0);

      if (value < 0 || value > 4) {
        errors.push(`${dimension} must be between 0 and 4`);
      }

      if (value >= 3 && (!Array.isArray(artifacts) || artifacts.length === 0)) {
        errors.push(`Artifacts required for high score dimension ${dimension}`);
      }

      rawTotal += Math.max(0, Math.min(4, value));
    });

    const totalScore = Math.round((rawTotal / (this.dimensions.length * 4)) * 100);
    const fatalRuleTriggered =
      scores.strategicAlignment === 0 || scores.funderIntentFit === 0 || scores.riskLiability === 0;

    return {
      totalScore,
      rawTotal,
      fatalRuleTriggered,
      errors,
    };
  },

  determineState(totalScore) {
    if (totalScore >= 80) return 'GO';
    if (totalScore >= 60) return 'PREPARE';
    if (totalScore >= 40) return 'DEFER';
    return 'DECLINE';
  },
};

export default screeningMatrix;
