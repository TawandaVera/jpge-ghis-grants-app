import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Scheduled daily: sends a digest email summarizing pipeline health
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const [grants, matches, applications, hilItems, outcomes, users] = await Promise.all([
      base44.asServiceRole.entities.Grant.list(),
      base44.asServiceRole.entities.GrantMatch.list(),
      base44.asServiceRole.entities.GrantApplication.list(),
      base44.asServiceRole.entities.HILCheckpoint.filter({ decision: "pending" }),
      base44.asServiceRole.entities.GrantOutcome.list(),
      base44.asServiceRole.entities.User.list(),
    ]);

    const goCount = matches.filter(m => m.recommendation === "GO").length;
    const prepCount = matches.filter(m => m.recommendation === "PREP").length;
    const inProgress = applications.filter(a => !["submitted", "awarded", "declined"].includes(a.stage)).length;
    const awarded = outcomes.filter(o => o.outcome === "awarded");
    const totalFunded = awarded.reduce((s, o) => s + (o.award_amount || 0), 0);

    const today = new Date();
    const in7days = new Date(today); in7days.setDate(today.getDate() + 7);
    const urgent = applications.filter(a => a.deadline && !["submitted", "awarded", "declined"].includes(a.stage) && new Date(a.deadline) >= today && new Date(a.deadline) <= in7days);

    const adminUsers = users.filter(u => u.role === "admin");

    for (const user of adminUsers) {
      const body = `JPGE-GMS Daily Digest — ${today.toDateString()}

━━━━━━━━━━━━━━━━━━━━━━━
📊 PIPELINE SNAPSHOT
━━━━━━━━━━━━━━━━━━━━━━━
Total Grants in Database: ${grants.length}
Assessed: ${matches.length} (GO: ${goCount} | PREP: ${prepCount})
Active Applications: ${inProgress}
HIL Checkpoints Pending: ${hilItems.length}
Total Awarded to Date: $${totalFunded.toLocaleString()}

${urgent.length > 0 ? `⚠️ URGENT — ${urgent.length} deadline(s) within 7 days:
${urgent.map(a => `  • ${a.grant_title} — Due ${a.deadline}`).join("\n")}
` : "✅ No critical deadlines in the next 7 days.\n"}
${hilItems.length > 0 ? `🔴 HIL CHECKPOINTS REQUIRING REVIEW:
${hilItems.map(h => `  • ${h.grant_title} [${h.stage}]`).join("\n")}
` : ""}
Log in at the JPGE-GMS platform to manage your pipeline.`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        from_name: "JPGE-GMS",
        subject: `📊 Daily Digest — ${today.toDateString()} | ${urgent.length ? `${urgent.length} urgent` : "Pipeline update"}`,
        body
      });
    }

    return Response.json({ sent: adminUsers.length, grants: grants.length, applications: inProgress, hilPending: hilItems.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});