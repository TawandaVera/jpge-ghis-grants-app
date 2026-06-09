import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Scheduled daily: finds grants/applications with deadlines in <7 or <30 days and emails users
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const today = new Date();
    const in7 = new Date(today); in7.setDate(today.getDate() + 7);
    const in30 = new Date(today); in30.setDate(today.getDate() + 30);

    const [applications, users] = await Promise.all([
      base44.asServiceRole.entities.GrantApplication.list(),
      base44.asServiceRole.entities.User.list(),
    ]);

    const urgent = applications.filter(a => {
      if (!a.deadline || ["submitted", "awarded", "declined"].includes(a.stage)) return false;
      const d = new Date(a.deadline);
      return d >= today && d <= in30;
    });

    if (!urgent.length) return Response.json({ sent: 0, message: "No upcoming deadlines" });

    const adminEmails = users.filter(u => u.role === "admin" || u.role === "user").map(u => u.email).filter(Boolean);
    let sent = 0;

    for (const email of adminEmails) {
      const critical = urgent.filter(a => new Date(a.deadline) <= in7);
      const upcoming = urgent.filter(a => new Date(a.deadline) > in7);

      const lines = [];
      if (critical.length) {
        lines.push(`🚨 CRITICAL — Due within 7 days (${critical.length}):`);
        critical.forEach(a => lines.push(`  • ${a.grant_title} (${a.funder}) — ${a.deadline} [${a.stage}]`));
      }
      if (upcoming.length) {
        lines.push(`\n📅 Upcoming — Due within 30 days (${upcoming.length}):`);
        upcoming.forEach(a => lines.push(`  • ${a.grant_title} (${a.funder}) — ${a.deadline} [${a.stage}]`));
      }

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `⚠️ GHIS Grant Deadline Alert — ${urgent.length} application(s) need attention`,
        body: `Grant Deadline Alert — ${today.toDateString()}\n\n${lines.join("\n")}\n\nLog in to the GHIS Grants platform to take action.`
      });
      sent++;
    }

    return Response.json({ sent, urgent: urgent.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});