// SOP Sequencer Skill (System Level)
// Enforces SOP order (no skipping, no backtracking)

const sopSequencer = {
  sequence: ['SOP-1', 'SOP-2', 'SOP-3', 'SOP-4', 'SOP-5'],

  isTransitionAllowed(currentStep, targetStep) {
    const currentIdx = this.sequence.indexOf(currentStep);
    const targetIdx = this.sequence.indexOf(targetStep);
    return targetIdx === currentIdx + 1;
  },

  getNextStep(currentStep) {
    const idx = this.sequence.indexOf(currentStep);
    return idx >= 0 && idx < this.sequence.length - 1 ? this.sequence[idx + 1] : null;
  },
};

export default sopSequencer;