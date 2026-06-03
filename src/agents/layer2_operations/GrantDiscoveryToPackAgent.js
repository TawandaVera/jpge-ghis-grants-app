/**
 * GrantDiscoveryToPackAgent (Layer‑2)
 * Determines if an opportunity is actionable for immediate packaging and
 * schedules mandatory Human‑in‑the‑Loop checkpoints.
 */
import { differenceInCalendarDays, parseISO } from 'date-fns';

class GrantDiscoveryToPackAgent {
  constructor() {
    this.name = 'GrantDiscoveryToPackAgent';
    this.mode = 'Discovery‑to‑Pack';
  }

  /**
   * Basic actionability rules (can be extended):
   * 1. State must be GO or PREP
   * 2. matchScore ≥ 60
   * 3. Deadline within 60 days
   * @param {{ state:string, matchScore:number, deadline:string }} opp
   */
  validate(opp) {
    if (!['GO', 'PREP'].includes(opp.state)) {
      return { actionable: false, reason: 'State not GO/PREP' };
    }
    if ((opp.matchScore ?? 0) < 60) {
      return { actionable: false, reason: 'Match score below 60' };
    }

    const days = differenceInCalendarDays(parseISO(opp.deadline), new Date());
    if (Number.isNaN(days) || days > 60) {
      return { actionable: false, reason: 'Deadline beyond 60‑day window' };
    }

    // schedule HIL checkpoints placeholder
    const checkpoints = [
      { step: 'Eligibility Review', dueInDays: 7 },
      { step: 'Narrative Draft Review', dueInDays: 21 },
      { step: 'Final Sign‑off', dueInDays: days - 7 },
    ];

    return {
      actionable: true,
      checkpoints,
    };
  }
}

export default GrantDiscoveryToPackAgent;
