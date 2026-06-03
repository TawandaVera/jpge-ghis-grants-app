/**
 * dataTransform
 * Generic helper for mapping raw scraped key/value pairs into canonical schema keys.
 */

const keyMap = {
  'cfdaNumber': 'fundingProgram',
  'postedDate': 'publicationDate',
  'closeDate': 'deadline',
};

const dataTransform = {
  /**
   * Map and rename keys based on keyMap; leave unknown keys unchanged.
   * @param {Object} rawRec
   * @returns {Object}
   */
  toCanonical(rawRec) {
    return Object.entries(rawRec).reduce((acc, [k, v]) => {
      const mappedKey = keyMap[k] || k;
      acc[mappedKey] = v;
      return acc;
    }, {});
  },
};

export default dataTransform;
