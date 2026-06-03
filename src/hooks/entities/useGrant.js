import { useState } from 'react';

/**
 * useGrant
 * Local state hook for a single grant opportunity record.
 */
export default function useGrant(initialGrant) {
  const [grant, setGrant] = useState(initialGrant);
  const update = patch => setGrant(g => ({ ...g, ...patch }));
  return { grant, update };
}
