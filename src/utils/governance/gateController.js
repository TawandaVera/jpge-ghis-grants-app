/**
 * gateController
 * Releases Layer 2 operations only after PackArchitect sets layer2Unlocked true.
 */

const gateController = {
  /**
   * Check if Layer 2 can start
   * @param {Object} packRecord - Application pack metadata
   * @returns {{ unlocked: boolean, reason?: string }}
   */
  canEnterLayer2(packRecord) {
    if (!packRecord) return { unlocked: false, reason: 'Pack record missing' };
    return packRecord.layer2Unlocked
      ? { unlocked: true }
      : { unlocked: false, reason: 'Layer 2 gate not unlocked' };
  },
};

export default gateController;
