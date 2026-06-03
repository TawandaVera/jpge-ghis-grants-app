/**
 * sopEnforcer
 * Guarantees workflow follows SOP‑1 → SOP‑5 strictly with no skips or backtracks.
 */

const allowedSequence = ['SOP-1', 'SOP-2', 'SOP-3', 'SOP-4', 'SOP-5'];

const sopEnforcer = {
  /**
   * Validate transition between steps
   * @param {string} currentStep
   * @param {string} targetStep
   * @returns {{ allowed: boolean, error?: string }}
   */
  validate(currentStep, targetStep) {
    const currIndex = allowedSequence.indexOf(currentStep);
    const targetIndex = allowedSequence.indexOf(targetStep);
    if (currIndex === -1 || targetIndex === -1) {
      return { allowed: false, error: 'Unknown SOP step' };
    }
    if (targetIndex === currIndex + 1) return { allowed: true };
    return { allowed: false, error: 'SOP transition not permitted' };
  },
};

export default sopEnforcer;
