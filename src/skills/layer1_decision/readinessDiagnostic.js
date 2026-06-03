/**
 * Readiness Diagnostic Skill (SOP-3)
 * Identifies organizational gaps across five domains.
 */

const readinessDiagnostic = {
  domains: [
    'financialManagement',
    'organizationalGovernance',
    'projectManagement',
    'compliance',
    'stakeholderAlignment',
  ],

  assessReadiness(domainData = {}) {
    const gapList = [];
    let verified = 0;

    this.domains.forEach((domain) => {
      const record = domainData[domain];
      if (record?.verified) {
        verified += 1;
      } else {
        gapList.push({ domain, severity: 'high' });
      }
    });

    const readinessScore = Math.round((verified / this.domains.length) * 100);

    return {
      readinessScore,
      gapList,
      estimatedTimeToResolve: gapList.length * 14,
    };
  },

  gapsClosed(gapList = []) {
    return gapList.length === 0;
  },
};

export default readinessDiagnostic;
