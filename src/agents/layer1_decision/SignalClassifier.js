import crypto from 'crypto';
import enumValidator from '../../utils/verification/enumValidator.js';
import schemaValidator from '../../utils/verification/schemaValidator.js';
import opportunitiesSchema from '../../skills/schemas/grantCanonicalSchema.js';

/**
 * Signal Classifier Agent (Layer 1, SOP-1)
 * Validates incoming grant signals, deduplicates via fingerprint, and records
 * an "opportunity" entity ready for SOP-2 screening.
 */
class SignalClassifier {
  constructor() {
    this.name = 'SignalClassifier';
    this.stage = 'SOP-1';
  }

  /**
   * Build SHA-256 fingerprint for deduplication.
   * @param {Object} s
   * @returns {string}
   */
  #fingerprint(s) {
    const basis = `${s.title}|${s.funder}|${s.deadline}|${s.amount}`;
    return crypto.createHash('sha256').update(basis).digest('hex');
  }

  /**
   * Classify and intake a grant signal.
   * @param {{ source:string, title:string, funder:string, deadline:string, amount:number, rfpText?:string, url?:string }} signal
   * @returns {Promise<{ signalId:string, status:string, nextStep?:string, error?:string }>}
   */
  async processSignal(signal) {
    try {
      // 1. Quick required-field check
      const required = ['source', 'title', 'funder', 'deadline', 'amount'];
      const missing = required.filter(k => !(k in signal));
      if (missing.length) {
        return { status: 'error', error: `Missing fields: ${missing.join(', ')}` };
      }

      // 2. Enum validate source
      const { valid: srcOk, error } = enumValidator.validate(
        ['grants.gov', 'manual', 'import', 'url', 'paste', 'file'],
        signal.source,
      );
      if (!srcOk) return { status: 'error', error };

      // 3. Schema sanity (non-blocking) – logs errors but proceeds
      const { valid, errors } = schemaValidator.validate(opportunitiesSchema, signal);
      if (!valid) {
        // eslint-disable-next-line no-console
        console.warn('Signal schema warnings', errors);
      }

      // 4. Generate fingerprint and pseudo-dedupe (in-memory placeholder)
      const fp = this.#fingerprint(signal);
      // TODO: Replace with Redis/DB lookup; for now, always proceed.

      // 5. Create opportunityId using first 10 chars of fingerprint
      const opportunityId = `opp_${fp.slice(0, 10)}`;

      // TODO: Persist to Base44 via SDK once available

      return {
        signalId: opportunityId,
        status: 'signal_recorded',
        nextStep: 'SOP-2: Screening',
      };
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  }
}

export default SignalClassifier;
