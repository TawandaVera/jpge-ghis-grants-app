import screeningScorer from '../../utils/scoring/screeningScorer.js';
import ruleEngine from '../../utils/governance/ruleEngine.js';

const dimensions = [
  'strategicAlignment',
  'funderIntentFit',
  'organizationalCapacity',
  'competitiveness',
  'fundingAmount',
  'riskLiability',
];

const critical = ['strategicAlignment', 'funderIntentFit', 'riskLiability'];

/**
 * Screener Agent (Layer-1, SOP-2)
 * Scores an opportunity across six dimensions and assigns a preliminary state.
 */
class Screener {
  constructor() {
    this.name = 'Screener';
    this.stage = 'SOP-2';
  }

  /**
   * Validate scores and artifacts before computing totals.
   */
  #validate(screening) {
    const err = [];
    // every dimension present 0-4
    dimensions.forEach(d => {
      const v = screening.scores?.[d];
      if (v == null || v < 0 || v > 4) err.push(`Score ${d} missing or out of range`);
      if (v >= 3 && (!Array.isArray(screening.artifacts) || screening.artifacts.length === 0)) {
        err.push(`Artifacts required for high score dimension ${d}`);
      }
    });
    return err;
  }

  /**
   * Score opportunity using screening matrix.
   * @param {{ signalId:string, scores:Object<string,number>, artifacts:string[] }} screening
   * @returns {Promise<{ screeningId:string, totalScore:number, state:string, fatalRuleTriggered:boolean, nextStep:string, errors?:string[] }>}
   */
  async scoreOpportunity(screening) {
    try {
      const validationErrors = this.#validate(screening);
      if (validationErrors.length) {
        return { status: 'error', errors: validationErrors };
      }

      // fatal rule check
      const fatalRule = () => {
        const zeroCrit = critical.find(c => screening.scores[c] === 0);
        return zeroCrit
          ? { pass: false, message: `Critical dimension ${zeroCrit} scored 0` }
          : { pass: true };
      };

      const { allPass, failedRules } = ruleEngine.evaluate([fatalRule]);
      const fatal = !allPass;

      // scoring
      const totalScore = screeningScorer.total(screening.scores);

      // determine state
      let state = 'DECLINE';
      if (!fatal) {
        if (totalScore >= 80) state = 'GO';
        else if (totalScore >= 60) state = 'PREPARE';
        else if (totalScore >= 40) state = 'DEFER';
      }

      const nextStep = state === 'DECLINE' || fatal ? 'END' : 'SOP-3: Readiness';

      return {
        screeningId: `screening_${Date.now()}`,
        totalScore,
        state,
        fatalRuleTriggered: fatal,
        failedRules,
        nextStep,
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
}

export default Screener;
