import { useState, useCallback } from 'react';
import gateController from '../utils/governance/gateController.js';

/**
 * useOperationsFlow
 * Manages Layer‑2 (Operations) status through discovery → submission pipeline.
 */
const phases = [
  'discovery',
  'extraction',
  'drafting',
  'budget',
  'compliance',
  'review',
  'submission',
];

export default function useOperationsFlow(packRecord) {
  const init = phases[0];
  const [phase, setPhase] = useState(init);
  const [error, setError] = useState(null);

  const advance = useCallback(
    target => {
      if (!gateController.canEnterLayer2(packRecord).unlocked) {
        setError('Layer‑2 locked: pack not approved');
        return false;
      }
      const currIdx = phases.indexOf(phase);
      const tgtIdx = phases.indexOf(target);
      if (tgtIdx === currIdx + 1) {
        setPhase(target);
        setError(null);
        return true;
      }
      setError('Invalid phase transition');
      return false;
    },
    [phase, packRecord],
  );

  return { phase, advance, error, phases };
}
