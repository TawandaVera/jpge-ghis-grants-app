import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Maps extracted form question topics to our narrative content types
const SECTION_MAPPING = {
  "executive summary": "executive_summary",
  "project summary": "executive_summary",
  "abstract": "executive_summary",
  "needs statement": "needs_statement",
  "statement of need": "needs_statement",
  "problem statement": "needs_statement",
  "goals": "goals_objectives",
  "objectives": "goals_objectives",
  "project goals": "goals_objectives",
  "methodology": "methodology",
  "approach": "methodology",
  "project design": "methodology",
  "activities": "methodology",
  "evaluation": "evaluation_plan",
  "evaluation plan": "evaluation_plan",
  "performance measures": "evaluation_plan",
  "organizational capacity": "organizational_capacity",
  "organizational background": "organizational_capacity",
  "qualifications": "organizational_capacity",
  "budget": "budget_narrative",
  "budget narrative": "budget_narrative",
  "budget justification": "budget_narrative",
};

function mapToFormSections(questions) {
  const sections = new Set();
  for (const q of questions) {
    const lower = q.toLowerCase();
    for (const [keyword, section] of Object.entries(SECTION_MAPPING)) {
      if (lower.includes(keyword)) {
        sections.add(section);
        break;
      }
    }
  }
  return [...sections];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Find GO/PREP matches
    const matches = await base44.asServiceRole.entities.GrantMatch.filter({ recommendation: 'GO' });
    const prepMatches = await base44.asServiceRole.entities.GrantMatch.filter({ recommendation: 'PREP' });
    const allMatches = [...matches, ...prepMatches];

    if (allMatches.length === 0) {
      return Response.json({ message: 'No GO/PREP grants to process', processed: 0 });
    }

    // Get grants that haven't had forms fetched yet
    const grantIds = allMatches.map(m => m.grant_id);
    const allGrants = await base44.asServiceRole.entities.Grant.list('-created_date', 500);
    const targetGrants = allGrants.filter(g =>
      grantIds.includes(g.id) &&
      !g.form_fetched_at &&
      g.source_url
    );

    if (targetGrants.length === 0) {
      return Response.json({ message: 'All GO/PREP grants already have form data', processed: 0 });
    }

    const results = { processed: 0, failed: 0 };
    const batch = targetGrants.slice(0, 3);

    for (const grant of batch) {
      try {
        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are a grant application analyst. Your job is to find and extract the actual application form questions and required sections for this grant opportunity.

Grant Title: ${grant.title}
Funder: ${grant.funder}
Source URL: ${grant.source_url}
Description: ${grant.description || ''}
Requirements listed: ${(grant.requirements || []).join(', ') || 'None listed'}

Search the web RIGHT NOW for this specific grant's application form, RFP, NOFO, or application guidelines at or linked from: ${grant.source_url}

Extract the ACTUAL application questions and required sections that applicants must answer/submit. Examples of what to look for:
- "Describe your organization's mission and history"
- "Statement of Need (max 2 pages)"
- "Project Narrative including goals, objectives, and methodology"
- "Budget Justification"
- "Letters of Support required"
- "Logic Model required"
- "Project Abstract (250 words)"

Return 8-15 specific form questions/requirements. If you cannot find the actual form, infer likely questions based on the funder type, category, and description — but note them as inferred.

Also map each question to the most relevant narrative section category.`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: {
            type: 'object',
            properties: {
              application_form_questions: {
                type: 'array',
                items: { type: 'string' }
              },
              form_source: { type: 'string' },
              confidence: { type: 'string' }
            }
          }
        });

        const questions = result.application_form_questions || [];
        const formSections = mapToFormSections(questions);

        await base44.asServiceRole.entities.Grant.update(grant.id, {
          application_form_questions: questions,
          form_sections: formSections,
          form_fetched_at: new Date().toISOString()
        });

        results.processed++;
      } catch (e) {
        results.failed++;
      }
    }

    return Response.json({
      message: 'Form extraction complete',
      total_eligible: targetGrants.length,
      batch_size: batch.length,
      ...results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});