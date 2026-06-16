import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch all grants
    const allGrants = await base44.asServiceRole.entities.Grant.list('-created_date', 500);

    // Only process grants missing any CIE tags
    const untagged = allGrants.filter(g =>
      (!g.outcome_areas || g.outcome_areas.length === 0) &&
      (!g.populations_served || g.populations_served.length === 0) &&
      (!g.geographies || g.geographies.length === 0) &&
      !g.funding_type
    );

    if (untagged.length === 0) {
      return Response.json({ message: 'All grants already tagged', processed: 0 });
    }

    const results = { tagged: 0, failed: 0, skipped: 0 };

    // Process in batches of 5 to avoid timeout
    const batch = untagged.slice(0, 20);

    for (const grant of batch) {
      try {
        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are a grant classification assistant. Based on the grant details below, classify it using ONLY the exact values from the enums provided.

Grant Title: ${grant.title}
Funder: ${grant.funder || ''}
Description: ${grant.description || ''}
Eligibility: ${grant.eligibility || ''}
Focus Areas: ${(grant.focus_areas || []).join(', ')}
Geographic Scope: ${grant.geographic_scope || ''}
Category: ${grant.category || ''}

Classify into these fields:
- outcome_areas: array, pick all that clearly apply from ["Health Equity","Leadership Development","Veterans","Workforce Development","Economic Mobility","Food Security","Climate Adaptation","Digital Equity","Housing","Education"]
- populations_served: array, pick all that clearly apply from ["Veterans","Alumni","Youth","BIPOC Communities","Women","Immigrants","Rural Communities","People with Disabilities","Seniors"]
- geographies: array, pick all that clearly apply from ["National","Regional","State-Specific","International","Southwest","Southeast","Midwest","Northeast","West Coast"]. If geographic_scope says "national" or "all states" → ["National"]. If it mentions a specific US region, pick that region.
- funding_type: pick exactly ONE from ["federal_grant","family_foundation","private_foundation","hnwi","major_gift","corporate_giving"]. Infer from funder name: .gov / federal agency = federal_grant; named family like "Smith Family Foundation" = family_foundation; large private like RWJF, Gates = private_foundation; HNWI = hnwi; corporate/CSR = corporate_giving.

Return empty arrays only if genuinely cannot determine. Do not guess wildly.`,
          response_json_schema: {
            type: 'object',
            properties: {
              outcome_areas: { type: 'array', items: { type: 'string' } },
              populations_served: { type: 'array', items: { type: 'string' } },
              geographies: { type: 'array', items: { type: 'string' } },
              funding_type: { type: 'string' }
            }
          }
        });

        const tags = {
          outcome_areas: result.outcome_areas || [],
          populations_served: result.populations_served || [],
          geographies: result.geographies || [],
          funding_type: result.funding_type || null
        };

        await base44.asServiceRole.entities.Grant.update(grant.id, tags);
        results.tagged++;
      } catch (e) {
        results.failed++;
      }
    }

    results.skipped = untagged.length - batch.length;

    return Response.json({
      message: `Auto-tagging complete`,
      total_untagged: untagged.length,
      processed: batch.length,
      ...results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});