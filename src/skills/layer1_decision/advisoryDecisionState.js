/**
 * Advisory Decision State Skill (SOP-4)
 * Assigns advisory state (GO/PREPARE/DEFER/DECLINE) based on screening + readiness.
 */

const advisoryDecisionState = {
  assignState(screeningScore, readinessScore, riskFlags = []) {
    const aggregate = Math.round((Number(screeningScore) * 0.6) + (Number(readinessScore) * 0.4));
    let state = 'DECLINE';

    if (aggregate >= 80) state = 'GO';
    else if (aggregate >= 60) state = 'PREPARE';
    else if (aggregate >= 40) state = 'DEFER';

    if (riskFlags.includes('critical') && state === 'GO') {
      state = 'PREPARE';
    }

    return {
      state,
      aggregateScore: aggregate,
      rationale: `Aggregate score ${aggregate}; risk flags: ${riskFlags.join(', ') || 'none'}.`,
      ceoApprovalRequired: state === 'GO',
    };
  },
};

export default advisoryDecisionState;
