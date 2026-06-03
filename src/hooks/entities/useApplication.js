import { useState } from 'react';

export default function useApplication(initialApplication) {
  const [app, setApp] = useState(initialApplication);
  const update = patch => setApp(a => ({ ...a, ...patch }));
  return { app, update };
}
