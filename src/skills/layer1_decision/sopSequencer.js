/**
 * SOP Sequencer Skill (System Level)
 * Enforces SOP order (no skipping, no backtracking).
 */

const sopSequencer = {
  sequence: ['SOP-1', 'SOP-2', 'SOP-3', 'SOP-4', 'SOP-5'],

  isTransitionAllowed(currentStep, targetStep) {
    const currentIndex = this.sequence.indexOf(currentStep);
    const targetIndex = this.sequence.indexOf(targetStep);

    if (currentIndex === -1 || targetIndex === -1) {
      return false;
    }

    return targetIndex === currentIndex + 1;
  },

  getNextStep(currentStep) {
    const index = this.sequence.indexOf(currentStep);

    if (index === -1 || index === this.sequence.length - 1) {
      return null;
    }

    return this.sequence[index + 1];
  },
};

export default sopSequencer;
