/**
 * Layer 2 Operations Agent Type Definitions (JSDoc)
 * Type hints for IDE autocomplete and documentation
 */

/**
 * @typedef {Object} DiscoveryCriteria
 * @property {Object} orgProfile - Organization profile
 * @property {Object} fundingCriteria - Funding preferences
 * @property {string} geoScope - Geographic scope
 * @property {number} maxAmount - Maximum funding amount
 */

/**
 * @typedef {Object} ExtractionSource
 * @property {string} source - 'url' | 'paste' | 'file'
 * @property {string} targetSchema - Target schema name
 */

/**
 * @typedef {Object} WritingRequest
 * @property {Object} grantDetails - Grant opportunity details
 * @property {Object} orgProfile - Organization profile
 * @property {string} section - Section to draft
 * @property {number} wordLimit - Word limit for section
 */

/**
 * @typedef {Object} BudgetRequest
 * @property {string} projectScope - Project description
 * @property {number} requestedAmount - Total request amount
 * @property {number} projectDuration - Duration in months
 * @property {Array} lineItems - Line items
 */

/**
 * @typedef {Object} ComplianceRequest
 * @property {Object} applicationSections - Draft sections
 * @property {Array} requirementsList - Grant requirements
 */

/**
 * @typedef {Object} ReviewRequest
 * @property {Object} draftSections - Draft sections to review
 * @property {Object} scoringRubric - Rubric for scoring
 * @property {Array} reviewerPersonas - Personas ("expert", "officer", "stakeholder")
 */

/**
 * @typedef {Object} PipelineItem
 * @property {string} applicationId - Application ID
 * @property {string} status - Current status
 * @property {string} deadline - Deadline date (YYYY-MM-DD)
 */

export {};
