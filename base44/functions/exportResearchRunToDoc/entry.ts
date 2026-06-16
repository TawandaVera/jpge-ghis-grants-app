import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { run_id } = await req.json();
    if (!run_id) return Response.json({ error: "run_id is required" }, { status: 400 });

    const run = await base44.asServiceRole.entities.ResearchRun.get(run_id);
    if (!run) return Response.json({ error: "Run not found" }, { status: 404 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledocs");

    const individuals = run.linked_individuals || [];
    const causes = run.cause_signals || [];
    const evidence = run.evidence_trail || [];
    const runDate = run.run_date ? new Date(run.run_date).toLocaleDateString() : "Unknown Date";

    // Build Google Docs batchUpdate requests
    const requests = [];

    // Helper to append styled text
    let index = 1;
    const appendText = (text) => {
      requests.push({ insertText: { location: { index }, text } });
      index += text.length;
    };
    const appendHeading = (text, style = "HEADING_1") => {
      const start = index;
      appendText(text + "\n");
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: start, endIndex: index },
          paragraphStyle: { namedStyleType: style },
          fields: "namedStyleType"
        }
      });
    };
    const appendBold = (label, value) => {
      const start = index;
      appendText(label);
      requests.push({
        updateTextStyle: {
          range: { startIndex: start, endIndex: start + label.length },
          textStyle: { bold: true },
          fields: "bold"
        }
      });
      appendText(value + "\n");
    };

    // Title
    appendHeading(`Donor Intelligence Report`, "TITLE");
    appendText(`Generated: ${runDate}  |  Confidence: ${run.confidence_score || 0}%\n\n`);

    // Section 1 — Individuals
    appendHeading("Key Individuals", "HEADING_1");
    if (individuals.length === 0) {
      appendText("No individuals identified.\n\n");
    } else {
      for (const p of individuals) {
        appendHeading(`${p.name}`, "HEADING_2");
        appendBold("Role: ", p.role || "—");
        appendBold("Confidence: ", `${p.confidence_label || ""} (${p.confidence_score || 0}%)`);
        if (p.linked_causes?.length > 0) {
          appendBold("Cause Areas: ", p.linked_causes.join(", "));
        }
        if (p.outreach_angles?.length > 0) {
          appendText("Outreach Angles:\n");
          for (const o of p.outreach_angles) {
            appendText(`  • ${o.angle}\n    ${o.rationale}\n`);
          }
        }
        appendText("\n");
      }
    }

    // Section 2 — Cause Signals
    appendHeading("Cause Signals", "HEADING_1");
    appendText(causes.length > 0 ? causes.join(", ") + "\n\n" : "None detected.\n\n");

    // Section 3 — Evidence Trail
    appendHeading("Evidence Trail", "HEADING_1");
    if (evidence.length === 0) {
      appendText("No evidence items recorded.\n\n");
    } else {
      for (const e of evidence) {
        appendBold(`[${e.type || "Source"}] ${e.source || ""}`, e.date ? `  (${e.date})` : "");
        appendText(`${e.summary || ""}\n\n`);
      }
    }

    // Step 1: Create the document
    const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: `Donor Intelligence — ${runDate}` })
    });
    const doc = await createRes.json();
    if (!doc.documentId) return Response.json({ error: "Failed to create Google Doc", detail: doc }, { status: 500 });

    // Step 2: Insert content
    await fetch(`https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ requests })
    });

    const docUrl = `https://docs.google.com/document/d/${doc.documentId}/edit`;
    return Response.json({ success: true, doc_url: docUrl, doc_id: doc.documentId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});