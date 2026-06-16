import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function scoreToLabel(score) {
  if (score >= 80) return "Direct Evidence";
  if (score >= 50) return "Strong Inference";
  return "Speculative";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { run_id, grant_name, funder_name, outcome_areas, funding_type } = await req.json();
    if (!run_id) return Response.json({ error: "run_id is required" }, { status: 400 });

    await base44.asServiceRole.entities.ResearchRun.update(run_id, { status: "running" });

    // LLM-powered research with web context
    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a philanthropic intelligence analyst. Research the following foundation and identify its principals, board members, and cause affinities using publicly available information.

FOUNDATION: ${funder_name}
GRANT: ${grant_name}
OUTCOME AREAS: ${(outcome_areas || []).join(", ")}
FUNDING TYPE: ${funding_type}

Tasks:
1. Identify known founders, board members, trustees, or named principals
2. For each person provide their role and a confidence score (0–100): 90+ = direct public record, 60–89 = strong inference from news/bios, below 60 = speculative
3. Identify recurring cause themes this funder supports
4. List specific evidence sources (news articles, IRS filings, GuideStar, foundation websites, press releases) with source name, type, date, and a one-sentence summary

Return only factual, publicly verifiable information. Do not fabricate names.`,
      add_context_from_internet: true,
      model: "gemini_3_1_pro",
      response_json_schema: {
        type: "object",
        properties: {
          individuals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                role: { type: "string" },
                confidence_score: { type: "number" },
                source_basis: { type: "string" }
              }
            }
          },
          cause_signals: { type: "array", items: { type: "string" } },
          evidence_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                source: { type: "string" },
                type: { type: "string" },
                date: { type: "string" },
                summary: { type: "string" }
              }
            }
          }
        }
      }
    });

    const individuals = (llmResult.individuals || []).map(p => ({
      ...p,
      confidence_label: scoreToLabel(p.confidence_score || 30),
      linked_causes: outcome_areas || []
    }));
    const causeSignals = llmResult.cause_signals || [];
    const evidenceTrail = llmResult.evidence_items || [];

    // Generate outreach angles
    let outreachMap = {};
    if (individuals.length > 0) {
      const oppResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `For the following donor profiles at "${funder_name}", suggest specific outreach angles aligned with our organization's focus areas.

INDIVIDUALS: ${JSON.stringify(individuals.slice(0, 5))}
CAUSE SIGNALS: ${causeSignals.join(", ")}
OUR OUTCOME AREAS: ${(outcome_areas || []).join(", ")}
GRANT: ${grant_name}

For each person (max 5), suggest 1–2 specific, actionable outreach angles based on their known causes and roles.`,
        response_json_schema: {
          type: "object",
          properties: {
            opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  person_name: { type: "string" },
                  angle: { type: "string" },
                  rationale: { type: "string" }
                }
              }
            }
          }
        }
      });

      for (const o of (oppResult.opportunities || [])) {
        const key = (o.person_name || "").toLowerCase().split(" ")[0];
        if (!outreachMap[key]) outreachMap[key] = [];
        outreachMap[key].push({ angle: o.angle, rationale: o.rationale });
      }
    }

    const enriched = individuals.map(p => ({
      ...p,
      outreach_angles: outreachMap[(p.name || "").toLowerCase().split(" ")[0]] || []
    }));

    const avgConfidence = enriched.length > 0
      ? Math.round(enriched.reduce((s, p) => s + (p.confidence_score || 0), 0) / enriched.length)
      : 0;

    await base44.asServiceRole.entities.ResearchRun.update(run_id, {
      status: "complete",
      linked_individuals: enriched,
      cause_signals: causeSignals,
      evidence_trail: evidenceTrail,
      confidence_score: avgConfidence
    });

    return Response.json({ success: true, run_id, individual_count: enriched.length, confidence_score: avgConfidence });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});