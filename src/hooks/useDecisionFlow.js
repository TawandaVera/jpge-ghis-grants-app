import { useState, useCallback } from 'react';
import { sopEnforcer } from '../utils/governance/sopEnforcer.js';

/**
 * useDecisionFlow
 * React hook to manage Layer-1 (Decision) SOP state machine in the UI.
 */
export default function useDecisionFlow(initialStep = 'SOP-1') {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [history, setHistory] = useState([initialStep]);
  const [error, setError] = useState(null);

  /**
   * Attempt a transition; rejects invalid moves via sopEnforcer.
   */
  const next = useCallback(
    targetStep => {
      const { allowed, error: err } = sopEnforcer.validate(currentStep, targetStep);
      if (!allowed) {
        setError(err);
        return false;
      }
      setCurrentStep(targetStep);
      setHistory(h => [...h, targetStep]);
      setError(null);
      return true;
    },
    [currentStep],
  );

  return { currentStep, history, error, next };
}
