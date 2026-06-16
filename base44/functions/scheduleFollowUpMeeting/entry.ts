import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { person_name, person_role, funder_name, grant_title, date, time, duration_minutes, notes } = await req.json();

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection("6a31b29fd03140a38ccb7b13");

    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + (duration_minutes || 60) * 60 * 1000);

    const event = {
      summary: `Follow-up: ${person_name} — ${funder_name}`,
      description: [
        `Contact: ${person_name}${person_role ? ` (${person_role})` : ""}`,
        `Funder: ${funder_name}`,
        `Grant: ${grant_title || "N/A"}`,
        notes ? `\nNotes: ${notes}` : "",
        `\nScheduled via JPGE Capital Intelligence Engine`
      ].filter(Boolean).join("\n"),
      start: { dateTime: startDateTime.toISOString() },
      end: { dateTime: endDateTime.toISOString() },
    };

    const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    if (!res.ok) {
      const err = await res.json();
      return Response.json({ error: err.error?.message || "Google Calendar API error" }, { status: res.status });
    }

    const created = await res.json();
    return Response.json({ event_id: created.id, event_link: created.htmlLink });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});