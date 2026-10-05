import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { buildStandardTemplateFromLibrary, EMPTY_LIBRARY_ERROR } from '../../shared/standardTemplate.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await buildStandardTemplateFromLibrary(base44);
    return Response.json(result);
  } catch (error) {
    const message = error.message || 'Could not build the standard template';
    const status = message === EMPTY_LIBRARY_ERROR ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}