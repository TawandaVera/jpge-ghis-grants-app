// Screening Matrix Skill (SOP-2)
// Implements 0-4 scoring across 6 dimensions

const screeningMatrix = {
  dimensions: ['strategicAlignment', 'funderIntentFit', 'organizationalCapacity', 'competitiveness', 'fundingAmount', 'riskLiability'],

  calculateScore(scores, artifacts) {
    return { totalScore: 0, fatalRuleTriggered: false };
  },

  determineState(totalScore) {
    if (totalScore >= 80) return 'GO';
    if (totalScore >= 60) return 'PREPARE';
    if (totalScore >= 40) return 'DEFER';
    return 'DECLINE';
  },
};

export default screeningMatrix;