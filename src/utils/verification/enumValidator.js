/**
 * enumValidator
 * Ensures a given value exists inside an allowed enum list.
 */
const enumValidator = {
  /**
   * Validate that value is in the allowed list
   * @param {string[]} allowed - Whitelisted values
   * @param {string} value - Value to test
   * @returns {{ valid: boolean, error?: string }}
   */
  validate(allowed, value) {
    const valid = Array.isArray(allowed) && allowed.includes(value);
    return valid ? { valid } : { valid, error: `Value '${value}' is not in enum list` };
  },
};

export default enumValidator;
