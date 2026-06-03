import readinessScorer from '../../utils/scoring/readinessScorer.js';

const domains = [
  'financialManagement',
  'organizationalGovernance',
  'projectManagement',
  'compliance',
  'stakeholderAlignment',
];

/**
 * Readiness Validator Agent (Layer-1, SOP-3)
 * Checks organisational preparedness and identifies remediation gaps.
 */
class ReadinessValidator {
  constructor() {
    this.name = 'ReadinessValidator';
    this.stage = 'SOP-3';
  }

  /**
   * Assess organisational readiness.
   * @param {{ screeningId:string, domains:Object<string,{ verified:boolean, artifacts?:string[] }> }} readiness
   * @returns {Promise<{ readinessId:string, gapList:Array, readinessScore:number, estimatedTimeToResolve:number, nextStep:string }>}
   */
  async assessReadiness(readiness) {
    try {
      // 1. Collect gaps
      const gapList = [];
      domains.forEach(d => {
        const info = readiness.domains?.[d];
        if (!info || !info.verified) {
          gapList.push({ domain: d, severity: 'high' });
        }
      });

      // 2. Score readiness (higher score if fewer gaps)
      const readinessScore = readinessScorer.score(gapList);

      // 3. Estimate time to resolve gaps (simple: 14 days per gap)
      const estimatedTimeToResolve = gapList.length * 14;

      // 4. Determine next step
      const nextStep = 'SOP-4: Decision Review';

      return {
        readinessId: `readiness_${Date.now()}`,
        gapList,
        readinessScore,
        estimatedTimeToResolve,
        nextStep,
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
}

export default ReadinessValidator;
