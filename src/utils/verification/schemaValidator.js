/**
 * schemaValidator
 * Runtime JSON schema validation against skills schemas.
 * Usage: schemaValidator.validate(schema, data) => { valid, errors }
 */

import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true, strict: false });

const schemaValidator = {
  /**
   * Validate data against provided JSON schema definition
   * @param {Object} schema - JSON schema definition
   * @param {Object} data - Data to validate
   * @returns {{ valid: boolean, errors: Ajv.ErrorObject[] | null }}
   */
  validate(schema, data) {
    const validate = ajv.compile(schema);
    const valid = validate(data);
    return { valid, errors: valid ? null : validate.errors };
  },
};

export default schemaValidator;
