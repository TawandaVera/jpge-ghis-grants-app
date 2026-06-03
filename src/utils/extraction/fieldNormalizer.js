/**
 * fieldNormalizer
 * Handles simple data cleaning: trim, collapse whitespace, ISO‑date fix, upper‑case funder codes.
 */

const fieldNormalizer = {
  cleanString(value) {
    return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;
  },

  toIsoDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  },

  upperCase(value) {
    return typeof value === 'string' ? value.toUpperCase() : value;
  },
};

export default fieldNormalizer;
