import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { integrateLibraryItems } from '../../shared/masterApplication.ts';
import { buildStandardTemplateFromLibrary } from '../../shared/standardTemplate.ts';

/**
 * Folds captured forms into the master application (deterministic, no model call)
 * and refreshes the platform standard template from the same library.
 * Runs automatically after every capture, and on demand from the Form Library.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    let items = [];
    if (body?.library_item_id) {
      const one = await base44.entities.FormLibrary.get(body.library_item_id);
      items = one ? [one] : [];
    } else {
      const page = await base44.entities.FormLibrary.filter(
        { status: 'active' },
        { sort: '-last_seen_at', limit: 200 },
      );
      items = page?.items || [];
    }

    if (!items.length) {
      return Response.json({
        error: 'Your form library is empty. Build a grant template first — the forms and prompts it finds are added to the library automatically.',
      }, { status: 400 });
    }

    const master = await integrateLibraryItems(base44, items);

    // The standard template is a secondary write: if it fails, the master
    // application is still integrated and the caller is told what happened.
    let standard = null;
    let standard_error = '';
    try {
      const built = await buildStandardTemplateFromLibrary(base44);
      standard = built.template;
    } catch (e) {
      standard_error = e.message;
    }

    return Response.json({
      master,
      standard,
      standard_error,
      library_count: items.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}