import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Count user's own records
    const [grants, applications, matches] = await Promise.all([
      base44.entities.Grant.filter({ created_by_id: user.id }),
      base44.entities.GrantApplication.filter({ created_by_id: user.id }),
      base44.entities.GrantMatch.filter({ created_by_id: user.id }),
    ]);

    // Upsert workspace record
    const existing = await base44.asServiceRole.entities.Workspace.filter({ owner_id: user.id });

    const payload = {
      owner_id: user.id,
      owner_name: user.full_name || user.email,
      owner_email: user.email,
      grant_count: grants.length,
      application_count: applications.length,
      status: 'active',
    };

    let workspace;
    if (existing.length > 0) {
      workspace = await base44.asServiceRole.entities.Workspace.update(existing[0].id, payload);
    } else {
      workspace = await base44.asServiceRole.entities.Workspace.create(payload);
    }

    return Response.json({ workspace, grant_count: grants.length, application_count: applications.length, match_count: matches.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});