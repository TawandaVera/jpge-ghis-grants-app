/**
 * hallucinationDetector
 * Flags any field values that are inferred or unsupported by source evidence.
 */

const hallucinationDetector = {
  /**
   * Inspect a record and mark fields lacking verification tags.
   * @param {Object} record - Canonical JSON object with _ver status tags.
   * @returns {{ hasHallucination: boolean, fields: string[] }}
   */
  detect(record) {
    const flagged = [];
    for (const [key, value] of Object.entries(record)) {
      if (value && typeof value === 'object' && '_ver' in value) {
        if (value._ver !== 'source') flagged.push(key);
      }
    }
    return { hasHallucination: flagged.length > 0, fields: flagged };
  },
};

export default hallucinationDetector;
