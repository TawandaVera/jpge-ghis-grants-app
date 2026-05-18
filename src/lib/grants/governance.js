export const ADVISORY_STATES = Object.freeze({
  GO: "GO",
  PREPARE: "PREPARE",
  DEFER: "DEFER",
  DECLINE: "DECLINE",
});

export const LEGACY_STATE_MAP = Object.freeze({
  PREP: ADVISORY_STATES.PREPARE,
  DEF: ADVISORY_STATES.DEFER,
});

export const PACK_GATE_PHRASE = "Proceed to pack.";

export const SCREENING_DIMENSIONS = Object.freeze([
  "strategic_alignment",
  "funder_intent_fit",
  "eligibility_fit",
  "readiness",
  "risk_liability",
  "deadline_feasibility",
]);

export const FATAL_ZERO_DIMENSIONS = Object.freeze([
  "strategic_alignment",
  "funder_intent_fit",
  "risk_liability",
]);

export function normalizeAdvisoryState(state) {
  return LEGACY_STATE_MAP[state] ?? state;
}

export function isDraftableState(state) {
  const normalized = normalizeAdvisoryState(state);
  return normalized === ADVISORY_STATES.GO || normalized === ADVISORY_STATES.PREPARE;
}

export function enforceGovernanceRules(scores = {}, evidence = {}) {
  const cappedScores = { ...scores };

  for (const key of SCREENING_DIMENSIONS) {
    const rawScore = Number(cappedScores[key] ?? 0);
    const hasEvidence = Boolean(evidence[key]);
    cappedScores[key] = rawScore >= 3 && !hasEvidence ? 2 : rawScore;
  }

  const total = SCREENING_DIMENSIONS.reduce(
    (sum, key) => sum + Number(cappedScores[key] ?? 0),
    0
  );

  const fatalZeroDimension = FATAL_ZERO_DIMENSIONS.find(
    (key) => Number(cappedScores[key] ?? 0) === 0
  );

  if (fatalZeroDimension || total <= 12) {
    return {
      scores: cappedScores,
      total,
      advisory_state: ADVISORY_STATES.DECLINE,
      fatal: true,
      fatal_reason: fatalZeroDimension
        ? `Fatal zero on ${fatalZeroDimension}`
        : "Total screening score is 12 or below",
    };
  }

  const advisory_state =
    total >= 20
      ? ADVISORY_STATES.GO
      : total >= 16
        ? ADVISORY_STATES.PREPARE
        : ADVISORY_STATES.DEFER;

  return {
    scores: cappedScores,
    total,
    advisory_state,
    fatal: false,
    fatal_reason: null,
  };
}

export function canGeneratePack({
  advisory_state,
  gate_phrase,
  persona_confirmed,
  readiness_verified,
}) {
  const state = normalizeAdvisoryState(advisory_state);

  return (
    isDraftableState(state) &&
    gate_phrase === PACK_GATE_PHRASE &&
    persona_confirmed === true &&
    readiness_verified === true
  );
}

export function getPackBlockReason({
  advisory_state,
  gate_phrase,
  persona_confirmed,
  readiness_verified,
}) {
  const state = normalizeAdvisoryState(advisory_state);

  if (!isDraftableState(state)) {
    return "Pack generation is blocked because the advisory state is not GO or PREPARE.";
  }

  if (persona_confirmed !== true) {
    return "Pack generation is blocked until the organization persona is confirmed.";
  }

  if (readiness_verified !== true) {
    return "Pack generation is blocked until readiness artifacts are verified.";
  }

  if (gate_phrase !== PACK_GATE_PHRASE) {
    return `Pack generation is blocked until the exact phrase "${PACK_GATE_PHRASE}" is recorded.`;
  }

  return null;
}

export function normalizeMatchRecord(match) {
  if (!match) return match;
  return {
    ...match,
    recommendation: normalizeAdvisoryState(match.recommendation),
    advisory_state: normalizeAdvisoryState(match.advisory_state ?? match.recommendation),
  };
}
