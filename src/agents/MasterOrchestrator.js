import sopEnforcer from '../utils/governance/sopEnforcer.js';

/**
 * Master Orchestrator – drives Layer-1 workflow end-to-end.
 */
class MasterOrchestrator {
  constructor(layer1Agents, layer2Agents) {
    this.name = 'MasterOrchestrator';
    this.l1 = layer1Agents;
    this.l2 = layer2Agents;
  }

  /**
   * Run SOP-1 → SOP-5 in order.
   */
  async processSignal(signal) {
    try {
      // SOP-1
      const s1 = await new this.l1.signalClassifier().processSignal(signal);
      if (s1.status === 'error') return s1;

      // SOP-2
      const screeningPayload = {
        signalId: s1.signalId,
        scores: signal.scores, // supplied externally for demo
        artifacts: signal.artifacts || [],
      };
      const s2 = await new this.l1.screener().scoreOpportunity(screeningPayload);
      if (s2.fatalRuleTriggered || s2.state === 'DECLINE') return s2;

      // SOP-3
      const readinessPayload = {
        screeningId: s2.screeningId,
        domains: signal.domains, // demo input
      };
      const s3 = await new this.l1.readinessValidator().assessReadiness(readinessPayload);

      // SOP-4
      const reviewerInp = {
        screeningScore: s2.totalScore,
        readinessScore: s3.readinessScore,
        gapList: s3.gapList,
        riskFlags: signal.riskFlags || [],
      };
      const s4 = await new this.l1.decisionReviewer().reviewAndDecide(reviewerInp);
      if (s4.decisionState !== 'GO') return s4; // PREPARE/DEFER/DECLINE stop here

      // SOP-5
      const pack = await new this.l1.packArchitect().generatePack({
        decisionId: s4.decisionId,
        gatePhrase: 'Proceed to pack.',
      });

      return {
        status: 'workflow_complete',
        signal: s1,
        screening: s2,
        readiness: s3,
        decision: s4,
        pack,
        layer2Unlocked: pack.layer2Unlocked,
      };
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  }

  /** Validate SOP sequence (simple) */
  isSopTransitionAllowed(curr, tgt) {
    return sopEnforcer.validate(curr, tgt).allowed;
  }

  isLayer2Unlocked(packRecord) {
    return packRecord?.layer2Unlocked === true;
  }
}

export default MasterOrchestrator;
