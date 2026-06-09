import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Entity automation: fires when a Workspace is created — sends welcome email
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data } = body;

    if (event?.type !== "create" || !data?.owner_email) {
      return Response.json({ skipped: true });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: data.owner_email,
      from_name: "JPGE-GMS",
      subject: "Welcome to the JPGE Grant Management System",
      body: `Hello ${data.owner_name || ""},

Your workspace has been set up on the JPGE Grant Management System (JPGE-GMS).

Your workspace is now active and ready to use. You can:
• Discover and assess grant opportunities
• Draft proposal sections with AI Co-Pilot
• Track your pipeline in real time
• Export and backup your data at any time

Log in to get started.

— JPGE-GMS Team`
    });

    return Response.json({ welcomed: true, email: data.owner_email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});