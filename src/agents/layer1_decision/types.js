/**
 * Layer 1 Decision Agent Type Definitions (JSDoc)
 * Type hints for IDE autocomplete and documentation
 */

/**
 * @typedef {Object} Signal
 * @property {string} source - 'url' | 'paste' | 'import'
 * @property {string} title - Grant title
 * @property {string} funder - Funder name
 * @property {string} deadline - YYYY-MM-DD
 * @property {number} amount - Funding amount
 * @property {string} [rfpText] - RFP text (optional)
 * @property {string} [url] - Grant URL (optional)
 */

/**
 * @typedef {Object} Screening
 * @property {string} signalId - Foreign key to Signal
 * @property {number} strategicAlignment - 0-4 score
 * @property {number} funderIntentFit - 0-4 score
 * @property {number} organizationalCapacity - 0-4 score
 * @property {number} competitiveness - 0-4 score
 * @property {number} fundingAmount - 0-4 score
 * @property {number} riskLiability - 0-4 score
 * @property {string[]} artifacts - Supporting documents
 * @property {number} totalScore - Calculated score (0-100)
 * @property {'GO'|'PREPARE'|'DEFER'|'DECLINE'} state - Decision state
 */

/**
 * @typedef {Object} ReadinessAssessment
 * @property {string} screeningId - Foreign key to Screening
 * @property {Object} financialManagement - { verified, artifacts, gaps }
 * @property {Object} organizationalGovernance - { verified, artifacts, gaps }
 * @property {Object} projectManagement - { verified, artifacts, gaps }
 * @property {Object} compliance - { verified, artifacts, gaps }
 * @property {Object} stakeholderAlignment - { verified, artifacts, gaps }
 * @property {string[]} gapList - Identified gaps
 * @property {number} estimatedTimeToResolve - Days to close gaps
 */

/**
 * @typedef {Object} AdvisoryDecision
 * @property {string} readinessId - Foreign key to ReadinessAssessment
 * @property {'GO'|'PREPARE'|'DEFER'|'DECLINE'} decisionState - Advisory state
 * @property {string} rationale - Decision rationale
 * @property {string[]} riskFlags - Risk items identified
 * @property {boolean} ceoApprovalRequired - Escalation flag
 */

/**
 * @typedef {Object} ApplicationPack
 * @property {string} decisionId - Foreign key to AdvisoryDecision
 * @property {string} gatePhrase - User confirmation ("Proceed to pack.")
 * @property {Object} structure - Pack structure (cover, summary, compliance, narratives, checklists)
 * @property {boolean} layer2Unlocked - Flag to enable Layer 2 operations
 */

export {};
