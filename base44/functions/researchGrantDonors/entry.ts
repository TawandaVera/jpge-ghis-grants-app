import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONFIDENCE_LABELS = {
  direct: "Direct Evidence",
  strong: "Strong Inference",
  speculative: "Speculative"
};

function scoreToLabel(score) {
  if (score >= 90) return CONFIDENCE_LABELS.direct;
  if (score >= 50) return CONFIDENCE_LABELS.strong;
  return CONFIDENCE_LABELS.speculative;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { run_id, grant_name, funder_name, funder_ein, outcome_areas, funding_type } = body;

    if (!run_id) return Response.json({ error: "run_id is required" }, { status: 400 });

    // Mark as running
    await base44.asServiceRole.entities.ResearchRun.update(run_id, { status: "running" });

    const CANDID_API_KEY = Deno.env.get("CANDID_API_KEY");
    const LEXISNEXIS_API_KEY = Deno.env.get("LEXISNEXIS_API_KEY");

    let individuals = [];
    let evidenceTrail = [];
    let causeSignals = [];

    // ── Step A: Candid Grants API — funder profile, officers, trustees ──
    if (CANDID_API_KEY && funder_ein) {
      try {
        const candidRes = await fetch(
          `https://api.candid.org/profile/v3/${encodeURIComponent(funder_ein)}?apikey=${CANDID_API_KEY}`,
          { headers: { "Accept": "application/json" } }
        );
        if (candidRes.ok) {
          const candidData = await candidRes.json();
          const officers = candidData?.data?.people || [];
          for (const person of officers) {
            const role = person.title || person.role || "Unknown Role";
            let confidence = 90; // direct filing record
            if (role.toLowerCase().includes("trustee") || role.toLowerCase().includes("board")) confidence = 95;
            individuals.push({
              name: person.name || "Unknown",
              role,
              confidence_score: confidence,
              confidence_label: scoreToLabel(confidence),
              source: "Candid 990 Filing",
              linked_causes: outcome_areas || []
            });
            evidenceTrail.push({
              source: "Candid Grants API",
              type: "990 Filing",
              date: new Date().toISOString().split("T")[0],
              summary: `${person.name} listed as ${role} in foundation IRS filing for ${funder_name}.`
            });
          }
        }
      } catch (e) {
        evidenceTrail.push({ source: "Candid API", type: "error", date: new Date().toISOString().split("T")[0], summary: `Candid lookup failed: ${e.message}` });
      }
    }

    // ── Step B: LexisNexis Nexis API — wealth signals, cause affinities, news ──
    if (LEXISNEXIS_API_KEY && individuals.length > 0) {
      for (const person of individuals) {
        try {
          const lnRes = await fetch("https://api.nexisuni.com/v1/search", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${LEXISNEXIS_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              query: `"${person.name}" "${funder_name}" philanthropy OR foundation OR donation`,
              sources: ["news", "biographies", "publicrecords"],
              limit: 10
            })
          });
          if (lnRes.ok) {
            const lnData = await lnRes.json();
            const articles = lnData?.results || [];
            // Extract cause signals from article keywords/summaries
            for (const article of articles.slice(0, 5)) {
              const text = (article.title || "") + " " + (article.snippet || "");
              const matchedCauses = (outcome_areas || []).filter(area =>
                text.toLowerCase().includes(area.toLowerCase())
              );
              matchedCauses.forEach(c => { if (!causeSignals.includes(c)) causeSignals.push(c); });
              if (article.title) {
                evidenceTrail.push({
                  source: article.source || "LexisNexis",
                  type: "News/Media",
                  date: article.date || new Date().toISOString().split("T")[0],
                  summary: `[Re: ${person.name}] ${article.title}`
                });
                // Upgrade or downgrade confidence based on media evidence
                if (matchedCauses.length > 0 && person.confidence_score < 75) {
                  person.confidence_score = 60;
                  person.confidence_label = scoreToLabel(60);
                }
              }
            }
            // Add cause affinities from LN if available
            const affinities = lnData?.cause_affinities || [];
            affinities.forEach(c => { if (!causeSignals.includes(c)) causeSignals.push(c); });
          }
        } catch (e) {
          // LN lookup per-person is best-effort
        }
      }
    }

    // ── Step C: LLM fallback — if no API keys or no results, use AI web inference ──
    if (individuals.length === 0) {
      const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a philanthropic intelligence analyst. Research the following foundation and identify its likely principals, board members, and cause affinities based on publicly available information.

FOUNDATION: ${funder_name}
EIN: ${funder_ein || "unknown"}
GRANT: ${grant_name}
OUTCOME AREAS: ${(outcome_areas || []).join(", ")}
FUNDING TYPE: ${funding_type}

Based on what you know or can infer from the foundation name, grant focus, and sector context:
1. Identify likely founders, board members, or named principals (if publicly known)
2. For each person, note their role and your confidence level
3. Identify recurring cause themes this funder appears to support
4. List any notable evidence (news articles, public filings, philanthropic databases) you are aware of

Be honest about confidence levels. Do NOT fabricate specific names unless you have reasonable basis.`,
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

      individuals = (llmResult.individuals || []).map(p => ({
        ...p,
        confidence_label: scoreToLabel(p.confidence_score || 30),
        linked_causes: (outcome_areas || [])
      }));
      causeSignals = llmResult.cause_signals || [];
      evidenceTrail = llmResult.evidence_items || [];
    }

    // ── Step D: Generate outreach opportunities per person ──
    const opportunitiesResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Based on these donor profiles and cause signals for "${funder_name}", suggest specific outreach angles that align with our organization's focus areas.

INDIVIDUALS: ${JSON.stringify(individuals.slice(0, 5))}
CAUSE SIGNALS: ${causeSignals.join(", ")}
OUR OUTCOME AREAS: ${(outcome_areas || []).join(", ")}
GRANT: ${grant_name}

For each person (max 5), suggest 1-2 specific, non-generic outreach angles based on their known causes and roles. Be actionable and specific.`,
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

    // Attach opportunities to individuals
    const opps = opportunitiesResult.opportunities || [];
    individuals = individuals.map(person => ({
      ...person,
      outreach_angles: opps
        .filter(o => o.person_name?.toLowerCase().includes(person.name?.split(" ")[0]?.toLowerCase()))
        .map(o => ({ angle: o.angle, rationale: o.rationale }))
    }));

    // Compute overall confidence score (average of individual scores)
    const avgConfidence = individuals.length > 0
      ? Math.round(individuals.reduce((sum, p) => sum + (p.confidence_score || 0), 0) / individuals.length)
      : 0;

    // Write results back
    await base44.asServiceRole.entities.ResearchRun.update(run_id, {
      status: "complete",
      linked_individuals: individuals,
      cause_signals: causeSignals,
      evidence_trail: evidenceTrail,
      confidence_score: avgConfidence,
      raw_output: JSON.stringify({ individuals, causeSignals, evidenceTrail })
    });

    return Response.json({ success: true, run_id, individual_count: individuals.length, confidence_score: avgConfidence });
  } catch (error) {
    // Try to mark as failed if we have run_id
    try {
      const b = createClientFromRequest(req);
      const body2 = await req.clone().json().catch(() => ({}));
      if (body2.run_id) {
        await b.asServiceRole.entities.ResearchRun.update(body2.run_id, { status: "failed", raw_output: error.message });
      }
    } catch (_) {}
    return Response.json({ error: error.message }, { status: 500 });
  }
});