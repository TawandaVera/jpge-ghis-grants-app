import { useState } from 'react';

export default function usePack(initialPack) {
  const [pack, setPack] = useState(initialPack);
  const update = patch => setPack(p => ({ ...p, ...patch }));
  return { pack, update };
}
