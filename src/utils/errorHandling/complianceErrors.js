/**
 * complianceErrors
 * Central map of error codes ↔ human descriptions for compliance checks.
 */

const complianceErrors = {
  MISSING_SECTION: {
    level: 'critical',
    message: 'Required section missing from application package',
  },
  WORD_LIMIT_EXCEEDED: {
    level: 'high',
    message: 'Section exceeds funder word limit',
  },
  FORMAT_VIOLATION: {
    level: 'medium',
    message: 'Document formatting does not comply with guidelines',
  },
  OPTIONAL_ATTACHMENT_MISSING: {
    level: 'low',
    message: 'Optional attachment recommended but not provided',
  },
};

export default complianceErrors;
