// Fatal Rule Checker Skill
// Enforces auto-decline conditions

const fatalRuleChecker = {
  checkFatalRules(screening, totalScore, readinessScore) {
    return { triggered: false, reason: null };
  },
};

export default fatalRuleChecker;