/**
 * Decision Reviewer Agent (Layer-1, SOP-4)
 * Combines screening and readiness scores, applies risk modifiers,
 * and returns an advisory state for leadership approval.
 */
class DecisionReviewer {
  constructor() {
    this.name = 'DecisionReviewer';
    this.stage = 'SOP-4';
  }

  /**
   * Assign advisory decision state.
   * @param {{ screeningScore:number, readinessScore:number, gapList?:Array, riskFlags?:string[] }} input
   */
  async reviewAndDecide(input) {
    try {
      const { screeningScore = 0, readinessScore = 0, riskFlags = [], gapList = [] } = input;

      // Simple weighted aggregate (60% screening, 40% readiness)
      const aggregate = Math.round(screeningScore * 0.6 + readinessScore * 0.4);

      // Baseline state
      let state = 'DECLINE';
      if (aggregate >= 80) state = 'GO';
      else if (aggregate >= 60) state = 'PREPARE';
      else if (aggregate >= 40) state = 'DEFER';

      // Risk override: any critical risk → at most PREPARE
      const criticalRisk = riskFlags.includes('critical');
      if (criticalRisk && state === 'GO') state = 'PREPARE';

      // CEO escalation rules: GO always requires CEO; PREPARE requires if >3 high-severity gaps
      const ceoApprovalRequired =
        state === 'GO' || (state === 'PREPARE' && gapList.filter(g => g.severity === 'high').length > 3);

      const rationale = `Aggregate ${aggregate}. Gaps: ${gapList.length}. Risks: ${riskFlags.join(', ') || 'none'}.`;

      return {
        decisionId: `decision_${Date.now()}`,
        decisionState: state,
        aggregateScore: aggregate,
        rationale,
        ceoApprovalRequired,
        nextStep: state === 'DECLINE' ? 'END' : 'SOP-5: Pack Generation',
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
}

export default DecisionReviewer;
