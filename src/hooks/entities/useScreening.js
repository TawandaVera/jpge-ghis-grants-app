import { useState } from 'react';

export default function useScreening(initialScreening) {
  const [screening, setScreening] = useState(initialScreening);
  const update = patch => setScreening(s => ({ ...s, ...patch }));
  return { screening, update };
}
