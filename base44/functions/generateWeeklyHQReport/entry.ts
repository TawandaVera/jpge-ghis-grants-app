import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Weekly HQ progress report: compiles activity across tracked workspaces and emails subscribers.
// Supports preview mode (returns report text without sending).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let body: any = {};
    try { body = await req.json(); } catch {}
    const previewMode = body.preview === true;

    const [trackedWorkspaces, subscribers] = await Promise.all([
      base44.asServiceRole.entities.WeeklyReportWorkspace.filter({ is_active: true }),
      base44.asServiceRole.entities.WeeklyReportSubscriber.filter({ is_active: true }),
    ]);

    if (trackedWorkspaces.length === 0) {
      return Response.json({ error: 'No tracked workspaces configured. Add workspaces on the Weekly Report page.' }, { status: 400 });
    }

    const [grants, matches, applications, hilItems, outcomes, researchRuns] = await Promise.all([
      base44.asServiceRole.entities.Grant.list(),
      base44.asServiceRole.entities.GrantMatch.list(),
      base44.asServiceRole.entities.GrantApplication.list(),
      base44.asServiceRole.entities.HILCheckpoint.list(),
      base44.asServiceRole.entities.GrantOutcome.list(),
      base44.asServiceRole.entities.ResearchRun.list(),
    ]);

    const now = new Date();
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
    const twoWeeksOut = new Date(now); twoWeeksOut.setDate(now.getDate() + 14);

    const isThisWeek = (dateStr: string) => {
      if (!dateStr) return false;
      return new Date(dateStr) >= weekAgo;
    };

    const workspaceSummaries = trackedWorkspaces.map(ws => {
      const ownerId = ws.owner_id;
      const wsGrants = grants.filter(g => g.created_by_id === ownerId);
      const wsMatches = matches.filter(m => m.created_by_id === ownerId);
      const wsApps = applications.filter(a => a.created_by_id === ownerId);
      const wsOutcomes = outcomes.filter(o => o.created_by_id === ownerId);
      const wsResearch = researchRuns.filter(r => r.created_by_id === ownerId);
      const wsHIL = hilItems.filter(h => h.created_by_id === ownerId);

      const newGrants = wsGrants.filter(g => isThisWeek(g.created_date));
      const newMatches = wsMatches.filter(m => isThisWeek(m.created_date));
      const newApps = wsApps.filter(a => isThisWeek(a.created_date));
      const newOutcomes = wsOutcomes.filter(o => isThisWeek(o.decision_date) || isThisWeek(o.created_date));
      const newResearch = wsResearch.filter(r => isThisWeek(r.run_date) || isThisWeek(r.created_date));
      const pendingHIL = wsHIL.filter(h => h.decision === "pending");

      const activeApps = wsApps.filter(a => !["submitted", "awarded", "declined"].includes(a.stage));
      const awarded = wsOutcomes.filter(o => o.outcome === "awarded");
      const totalFunded = awarded.reduce((s: number, o: any) => s + (o.award_amount || 0), 0);

      const urgentDeadlines = activeApps.filter(a => {
        if (!a.deadline) return false;
        const d = new Date(a.deadline);
        return d >= now && d <= twoWeeksOut;
      });

      const priorities: string[] = [];
      if (pendingHIL.length > 0) priorities.push(`Resolve ${pendingHIL.length} pending review checkpoint(s) blocking applications.`);
      if (urgentDeadlines.length > 0) priorities.push(`${urgentDeadlines.length} application(s) with deadlines within 14 days — prioritize completion.`);
      if (newGrants.length === 0 && newMatches.length === 0) priorities.push("Focus on lead generation — no new grants or matches this week.");
      if (activeApps.length === 0 && priorities.length === 0) priorities.push("Focus on lead generation and expanding outreach efforts to populate the pipeline.");
      if (priorities.length === 0) priorities.push("Maintain pipeline momentum and continue application drafting.");

      return {
        owner_name: ws.owner_name,
        org_name: ws.org_name || '',
        pipeline: {
          totalGrants: wsGrants.length,
          totalMatches: wsMatches.length,
          activeApps: activeApps.length,
          totalFunded,
          awardedCount: awarded.length,
        },
        thisWeek: {
          newGrants: newGrants.length,
          newMatches: newMatches.length,
          newApps: newApps.length,
          newOutcomes: newOutcomes.length,
          newResearch: newResearch.length,
        },
        pendingHIL: pendingHIL.length,
        newOutcomesList: newOutcomes.map((o: any) => ({ title: o.grant_title, outcome: o.outcome, amount: o.award_amount })),
        newAppsList: newApps.map((a: any) => ({ title: a.grant_title, funder: a.funder, stage: a.stage })),
        priorities,
      };
    });

    const weekStart = new Date(weekAgo);
    const dateRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    let emailBody = `JPGE HQ WEEKLY PROGRESS REPORT\nWeek of ${dateRange}\n`;
    emailBody += `Reporting on ${workspaceSummaries.length} workspace(s)\n`;
    emailBody += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    for (const ws of workspaceSummaries) {
      emailBody += `▶ ${ws.owner_name}${ws.org_name ? ` — ${ws.org_name}` : ''}\n`;
      emailBody += `${'─'.repeat(35)}\n\n`;

      emailBody += `PIPELINE STATUS: ${ws.pipeline.activeApps} active application(s)`;
      if (ws.pipeline.totalFunded > 0) emailBody += ` | $${ws.pipeline.totalFunded.toLocaleString()} awarded to date (${ws.pipeline.awardedCount} grant(s))`;
      emailBody += `\n  • Grants in database: ${ws.pipeline.totalGrants}\n  • Matches assessed: ${ws.pipeline.totalMatches}\n\n`;

      emailBody += `DISCOVERY ACTIVITY (this week):\n`;
      if (ws.thisWeek.newGrants > 0 || ws.thisWeek.newMatches > 0) {
        emailBody += `  • ${ws.thisWeek.newGrants} new grant(s) added\n  • ${ws.thisWeek.newMatches} new match(es) assessed\n`;
      } else {
        emailBody += `  • No activity recorded for this week.\n`;
      }
      emailBody += `\n`;

      emailBody += `APPLICATION PROGRESS (this week):\n`;
      if (ws.thisWeek.newApps > 0) {
        emailBody += ws.newAppsList.map(a => `  • ${a.title} (${a.funder}) — ${a.stage}`).join("\n") + "\n";
      } else {
        emailBody += `  • No new applications initiated.\n`;
      }
      emailBody += `\n`;

      if (ws.thisWeek.newResearch > 0) {
        emailBody += `DONOR INTELLIGENCE: ${ws.thisWeek.newResearch} research run(s) completed this week.\n\n`;
      }

      if (ws.thisWeek.newOutcomes > 0) {
        emailBody += `OUTCOMES (this week):\n`;
        emailBody += ws.newOutcomesList.map(o => `  • ${o.title} — ${o.outcome}${o.amount ? ` ($${o.amount.toLocaleString()})` : ''}`).join("\n") + "\n\n";
      }

      emailBody += `BLOCKERS: ${ws.pendingHIL > 0 ? `${ws.pendingHIL} review checkpoint(s) pending approval.` : 'No roadblocks identified requiring executive decisions.'}\n\n`;

      emailBody += `RECOMMENDED PRIORITIES:\n`;
      emailBody += ws.priorities.map(p => `  • ${p}`).join("\n") + "\n";
      emailBody += `\n${'═'.repeat(35)}\n\n`;
    }

    emailBody += `\nThis report was auto-generated by the JPGE Capital Intelligence Engine.\nLog in to the platform for full details.`;

    if (previewMode) {
      return Response.json({
        success: true,
        preview: emailBody,
        workspace_count: workspaceSummaries.length,
        subscriber_count: subscribers.length,
        summaries: workspaceSummaries,
      });
    }

    if (subscribers.length === 0) {
      return Response.json({ error: 'No active subscribers configured. Add recipients on the Weekly Report page.' }, { status: 400 });
    }

    let sent = 0;
    const failures: string[] = [];
    for (const sub of subscribers) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: sub.email,
          from_name: "JPGE HQ Reports",
          subject: `JPGE HQ Weekly Progress Report — Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          body: emailBody,
        });
        sent++;
      } catch (e: any) {
        failures.push(`${sub.email}: ${e.message || 'send failed'}`);
      }
    }

    return Response.json({
      success: true,
      sent,
      subscriber_count: subscribers.length,
      workspace_count: workspaceSummaries.length,
      failures,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});