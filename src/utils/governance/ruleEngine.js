/**
 * ruleEngine
 * Centralised rule enforcement for fatal conditions, scoring caps, and policy constraints.
 */

const ruleEngine = {
  /**
   * Evaluate a set of rule functions
   * @param {Array<Function>} rules - Functions returning { pass: boolean, message?: string }
   * @returns {{ allPass: boolean, failedRules: string[] }}
   */
  evaluate(rules) {
    const failed = [];
    for (const rule of rules) {
      const { pass, message } = rule();
      if (!pass) failed.push(message || 'Unnamed rule failed');
    }
    return { allPass: failed.length === 0, failedRules: failed };
  },
};

export default ruleEngine;
