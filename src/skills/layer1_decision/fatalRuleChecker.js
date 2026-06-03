/**
 * Fatal Rule Checker Skill
 * Enforces auto-decline conditions.
 */

const fatalRuleChecker = {
  checkFatalRules(screening = {}, totalScore = 0) {
    const scores = screening.scores || screening;

    if (scores.strategicAlignment === 0) {
      return { triggered: true, reason: 'Strategic Alignment scored 0' };
    }

    if (scores.funderIntentFit === 0) {
      return { triggered: true, reason: 'Funder Intent Fit scored 0' };
    }

    if (scores.riskLiability === 0) {
      return { triggered: true, reason: 'Risk/Liability scored 0' };
    }

    if (Number(totalScore) <= 12) {
      return { triggered: true, reason: 'Total screening score is 12 or below' };
    }

    return { triggered: false, reason: null };
  },
};

export default fatalRuleChecker;
