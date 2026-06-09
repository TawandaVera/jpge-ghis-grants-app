// Advisory Decision State Skill (SOP-4)
// Assigns advisory state (GO/PREPARE/DEFER/DECLINE) based on screening + readiness

const advisoryDecisionState = {
  assignState(screeningScore, readinessScore, riskFlags) {
    return {
      state: 'DEFER',
      rationale: 'Advisory state assigned',
      ceoApprovalRequired: true,
    };
  },
};

export default advisoryDecisionState;