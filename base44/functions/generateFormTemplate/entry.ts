import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const VALID_STATUS = new Set(['validated', 'unverified', 'conflict', 'missing']);

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const {
      source_type = 'pipeline',
      grant_id = '',
      application_id = '',
      application_link = '',
      program_name = '',
      funder = '',
      grant_title = '',
    } = body || {};

    // Resolve the opportunity context from a known grant or the provided link.
    let grant = null;
    if (grant_id) {
      try { grant = await base44.entities.Grant.get(grant_id); } catch (e) { grant = null; }
    } else if (application_link) {
      try {
        const found = await base44.entities.Grant.filter({ source_url: application_link });
        if (found.length) grant = found[0];
      } catch (e) { grant = null; }
    }

    let orgDesc = 'JPGE Consulting LLC — strategic growth and capital advisory firm. Focus: health equity, workforce innovation, health technology, prevention & SDOH.';
    try {
      const profiles = await base44.entities.OrgProfile.list();
      if (profiles.length) {
        const p = profiles[0];
        orgDesc = `${p.org_name}: ${p.mission}. Focus: ${(p.focus_areas || []).join(', ')}. States: ${(p.geographic_coverage || []).join(', ')}.`;
      }
    } catch (e) { /* org profile optional */ }

    const title = grant_title || grant?.title || program_name || 'Application Form Template';
    const funderName = funder || grant?.funder || '';
    const link = application_link || grant?.source_url || '';
    const description = grant?.description || '';
    const eligibility = grant?.eligibility || '';
    const requirements = (grant?.requirements || []).join('; ');
    const knownQuestions = (grant?.application_form_questions || []).join('; ');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a grant application form analyst for JPGE Consulting LLC. Build a VALIDATED application form template for the opportunity below.

OPPORTUNITY
Title: ${title}
Funder: ${funderName || 'Unknown'}
Application link: ${link || 'Not provided'}
Description: ${description || 'N/A'}
Known eligibility: ${eligibility || 'Not provided'}
Known requirements: ${requirements || 'Not provided'}
Known form questions already captured: ${knownQuestions || 'None'}

APPLICANT ORGANIZATION
${orgDesc}

TASK
1. Research the official application materials with web search: the funder's application portal or program page, plus any RFP, NOFO, guidelines, or linked documentation reachable from the application link.
2. Extract the ACTUAL questions and prompts an applicant must answer. Capture stated word or page limits.
3. For EACH prompt, return:
   - section: the proposal section it belongs to (Executive Summary, Needs Statement, Goals & Objectives, Methodology, Evaluation Plan, Organizational Capacity, Budget Narrative, or Other).
   - prompt: the exact question or instruction, phrased as an actionable writing prompt.
   - word_limit: any stated limit, otherwise "".
   - requirement_link: which eligibility criterion or stated requirement this prompt satisfies.
   - evidence_source: the exact URL where you found it.
   - evidence_excerpt: a short verbatim quote from that source proving the prompt exists.
   - validation_status: "validated" (found in official materials), "unverified" (inferred from funder type or category, not confirmed), "conflict" (official materials disagree with each other or with the stated eligibility), or "missing" (a required item you could not locate).
   - validation_note: one sentence explaining the status.
4. eligibility_summary: applicant eligibility in plain language.
5. requirements: the concrete submission requirements (documents, registrations, formats, letters of support, etc.).
6. gaps: anything a complete application needs that you could NOT verify from official sources.
7. sources: every official source used, each with a title and URL.
8. official_documentation_found: true only if you actually located the funder's own application materials.

Return 8-15 prompts. Never fabricate requirements — mark them unverified or missing instead. If no official documentation can be found, still produce a best-effort template but mark every prompt "unverified", list the gaps, and set official_documentation_found to false.`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          eligibility_summary: { type: 'string' },
          requirements: { type: 'array', items: { type: 'string' } },
          prompts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                section: { type: 'string' },
                prompt: { type: 'string' },
                word_limit: { type: 'string' },
                requirement_link: { type: 'string' },
                evidence_source: { type: 'string' },
                evidence_excerpt: { type: 'string' },
                validation_status: { type: 'string' },
                validation_note: { type: 'string' },
              },
            },
          },
          gaps: { type: 'array', items: { type: 'string' } },
          sources: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                url: { type: 'string' },
              },
            },
          },
          official_documentation_found: { type: 'boolean' },
        },
        required: ['name', 'prompts'],
      },
    });

    const prompts = (result.prompts || []).map((p: any) => ({
      section: p.section || 'Other',
      prompt: p.prompt || '',
      word_limit: p.word_limit || '',
      requirement_link: p.requirement_link || '',
      evidence_source: p.evidence_source || '',
      evidence_excerpt: p.evidence_excerpt || '',
      validation_status: VALID_STATUS.has(p.validation_status) ? p.validation_status : 'unverified',
      validation_note: p.validation_note || '',
    }));

    // Validation counts are computed from the prompts so they always agree with what is shown.
    const counts = { validated: 0, unverified: 0, conflicts: 0, missing: 0 };
    for (const p of prompts) {
      if (p.validation_status === 'validated') counts.validated++;
      else if (p.validation_status === 'conflict') counts.conflicts++;
      else if (p.validation_status === 'missing') counts.missing++;
      else counts.unverified++;
    }

    const template = await base44.entities.FormTemplate.create({
      name: result.name || title,
      source_type,
      grant_id: grant?.id || grant_id || '',
      grant_title: title,
      funder: funderName,
      program_name: program_name || grant?.title || title,
      application_link: link,
      application_id,
      eligibility_summary: result.eligibility_summary || eligibility || '',
      requirements: result.requirements || grant?.requirements || [],
      prompts,
      validation_summary: counts,
      gaps: result.gaps || [],
      sources: result.sources || [],
      official_documentation_found: !!result.official_documentation_found,
      status: 'draft',
      generated_at: new Date().toISOString(),
    });

    return Response.json({ template });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}