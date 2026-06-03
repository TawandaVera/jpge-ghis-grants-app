import { useState } from 'react';

export default function useReadiness(initialReadiness) {
  const [readiness, setReadiness] = useState(initialReadiness);
  const update = patch => setReadiness(r => ({ ...r, ...patch }));
  return { readiness, update };
}
