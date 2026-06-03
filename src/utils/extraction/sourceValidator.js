/**
 * sourceValidator
 * Verifies admissibility of a data source before parsing.
 */

const allowedProtocols = ['https:', 'http:'];

const sourceValidator = {
  /**
   * Check URL validity and robots permission (placeholder)
   * @param {string} url
   * @returns {{ valid: boolean, reason?: string }}
   */
  validateUrl(url) {
    try {
      const u = new URL(url);
      if (!allowedProtocols.includes(u.protocol)) {
        return { valid: false, reason: 'Protocol not allowed' };
      }
      // TODO: robots.txt check via crawler config
      return { valid: true };
    } catch (e) {
      return { valid: false, reason: 'Malformed URL' };
    }
  },
};

export default sourceValidator;
