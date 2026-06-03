/**
 * Source Profiles for GrantDiscoveryAgent
 * Controls which grant sources are searched per discovery mode.
 */

export const SOURCE_PROFILES = {
  all: {
    label: 'All Eligible Sources',
    excludeGovernment: false,
    allowedDomains: [],
    blockedDomains: [],
  },

  privateFoundationOnly: {
    label: 'Private Foundations and Philanthropy',
    excludeGovernment: true,
    allowedDomains: [
      'rwjf.org',
      'kresge.org',
      'gatesfoundation.org',
      'bloomberg.org',
      'debeaumont.org',
      'preventioninstitute.org',
      'tfah.org',
      'foundationcenter.org',
      'candid.org',
    ],
    blockedDomains: [
      'grants.gov',
      'nih.gov',
      'hrsa.gov',
      'samhsa.gov',
      'usa.gov',
      'state.gov',
      'ed.gov',
      'hhs.gov',
      'cdc.gov',
    ],
  },
};

export const SOURCE_MODE_LABELS = {
  all: 'All Eligible Sources',
  privateFoundationOnly: 'Private Foundations & Philanthropy',
};
