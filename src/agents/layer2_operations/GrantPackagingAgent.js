/**
 * GrantPackagingAgent (Layer-2)
 * Packages top grants per class into application-ready dossiers with
 * checklists, portal text, and CEO executive summaries.
 */
import fs from 'fs';
import path from 'path';

class GrantPackagingAgent {
  constructor() {
    this.name = 'GrantPackagingAgent';
    this.mode = 'Packaging';
  }

  /**
   * Select top 20 grants per class (GO & PREP) then package them.
   * @param {Array} grants - Array of grant objects with { class_id, state, matchScore, deadline }
   * @returns {Object} dossiers, trackingSheet, ceoSummary
   */
  packageGrants(grants) {
    // 1 Filter GO + PREP
    const eligible = grants.filter(g => ['GO', 'PREP'].includes(g.state));

    // 2 Bucket by class
    const buckets = {};
    eligible.forEach(g => {
      if (!buckets[g.class_id]) buckets[g.class_id] = [];
      buckets[g.class_id].push(g);
    });

    // 3 Sort & slice top 20 per class
    Object.values(buckets).forEach(list => {
      list.sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        return new Date(a.deadline) - new Date(b.deadline);
      });
    });

    const top = Object.fromEntries(
      Object.entries(buckets).map(([cls, list]) => [cls, list.slice(0, 20)]),
    );

    // 4 Build dossiers (light placeholder)
    const dossiers = [];
    Object.values(top).forEach(list => {
      list.forEach(g => {
        dossiers.push({
          opportunityId: g.opportunityId,
          title: g.title,
          summary: `${g.title} by ${g.funder} fits strategic priorities`,
          eligibilityChecklist: ['SAM active', 'DUNS verified', 'LLC eligible'],
          requiredForms: ['SF-424', 'Budget Justification'],
          portalSnippets: {
            orgDescription: 'GHIS LLC is a consulting firm...',
            capability: 'We deliver health systems innovation...',
            narrativeOutline: '* Problem * Approach * Impact',
          },
        });
      });
    });

    // 5 CEO Executive summary
    const totalRaw = eligible.length;
    const prepCount = eligible.filter(g => g.state === 'PREP').length;
    const percentage = ((prepCount / totalRaw) * 100).toFixed(0);
    const ceoSummary = `${totalRaw} → ${prepCount} PREP (${percentage}%) ready for review`;

    // 6 Tracking sheet (CSV)
    const csvLines = ['opportunityId,title,funder,state,class_id,deadline,matchScore'];
    eligible.forEach(g => {
      csvLines.push(
        `${g.opportunityId},"${g.title}",${g.funder},${g.state},${g.class_id},${g.deadline},${g.matchScore}`,
      );
    });
    const csv = csvLines.join('\n');
    fs.writeFileSync(path.join('outputs', `tracking_${Date.now()}.csv`), csv);

    return { dossiers, trackingSheet: csv, ceoSummary };
  }
}

export default GrantPackagingAgent;
