import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { target_user_id } = body;

    // Fetch all entity data (service role to bypass RLS)
    const [grants, applications, matches, narratives, orgProfiles, outcomes, hilCheckpoints, workspaces] = await Promise.all([
      base44.asServiceRole.entities.Grant.list(),
      base44.asServiceRole.entities.GrantApplication.list(),
      base44.asServiceRole.entities.GrantMatch.list(),
      base44.asServiceRole.entities.MasterNarrative.list(),
      base44.asServiceRole.entities.OrgProfile.list(),
      base44.asServiceRole.entities.GrantOutcome.list(),
      base44.asServiceRole.entities.HILCheckpoint.list(),
      base44.asServiceRole.entities.Workspace.list(),
    ]);

    // If filtering by user, filter what we can by created_by_id
    const filter = (arr) => target_user_id
      ? arr.filter(r => r.created_by_id === target_user_id)
      : arr;

    const backup = {
      exported_at: new Date().toISOString(),
      exported_by: user.email,
      target_user_id: target_user_id || 'all',
      data: {
        grants: filter(grants),
        grant_applications: filter(applications),
        grant_matches: filter(matches),
        master_narratives: filter(narratives),
        org_profiles: filter(orgProfiles),
        grant_outcomes: filter(outcomes),
        hil_checkpoints: filter(hilCheckpoints),
        workspaces: filter(workspaces),
      },
      counts: {}
    };

    // Build counts
    for (const [key, arr] of Object.entries(backup.data)) {
      backup.counts[key] = arr.length;
    }

    return new Response(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="ghis-backup-${new Date().toISOString().split('T')[0]}.json"`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});