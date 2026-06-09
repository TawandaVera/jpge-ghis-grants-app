import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Entity automation: fires when a GrantApplication is created or updated
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data, old_data } = body;

    if (!data) return Response.json({ skipped: true });

    // Auto-sync workspace counts when an application is created/updated
    const owner_id = data.created_by_id;
    if (owner_id) {
      const [grants, apps] = await Promise.all([
        base44.asServiceRole.entities.Grant.filter({ created_by_id: owner_id }),
        base44.asServiceRole.entities.GrantApplication.filter({ created_by_id: owner_id }),
      ]);

      const existing = await base44.asServiceRole.entities.Workspace.filter({ owner_id });
      const payload = {
        owner_id,
        grant_count: grants.length,
        application_count: apps.length,
        status: "active"
      };
      if (existing.length > 0) {
        await base44.asServiceRole.entities.Workspace.update(existing[0].id, payload);
      }
    }

    // Create HIL checkpoint when app moves to hil_review stage
    if (event?.type === "update" && data.stage === "hil_review" && old_data?.stage !== "hil_review") {
      await base44.asServiceRole.entities.HILCheckpoint.create({
        application_id: data.id,
        grant_title: data.grant_title,
        stage: "hil_review",
        tier: "tier1",
        action_required: "Review application sections before final submission",
        context: `Application for ${data.grant_title} (${data.funder}) has been flagged for human review. Deadline: ${data.deadline}.`,
        decision: "pending"
      });
    }

    // Notify admin when application is submitted
    if (event?.type === "update" && data.stage === "submitted" && old_data?.stage !== "submitted") {
      const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });
      for (const admin of admins) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          from_name: "GHIS Grants",
          subject: `✅ Application Submitted: ${data.grant_title}`,
          body: `An application has been marked as submitted.\n\nGrant: ${data.grant_title}\nFunder: ${data.funder}\nDeadline: ${data.deadline}\n\nLog in to track the outcome.`
        });
      }
    }

    return Response.json({ processed: true, stage: data.stage });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});