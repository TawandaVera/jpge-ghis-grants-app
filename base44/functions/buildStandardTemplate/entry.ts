import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const VALID_STATUS = new Set(['validated', 'unverified', 'conflict', 'missing']);

const STANDARD_NAME = 'JPGE Platform Standard Application Template';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Everything captured so far, across every opportunity.
    const page = await base44.entities.FormLibrary.filter(
      { status: 'active' },
      { sort: '-last_seen_at', limit: 200 },
    );
    const items = page?.items || [];

    if (!items.length) {
      return Response.json({
        error: 'Your form library is empty. Build a grant template first — the forms and prompts it finds are added to the library automatically.',
      }, { status: 400 });
    }

    const formText = items.map((i: any) => {
      const fields = (i.fields || []).slice(0, 20);
      const prompts = (i.prompts || []).slice(0, 12).map((p: any) => `    · [${p.section}] ${p.prompt}${p.word_limit ? ` (${p.word_limit})` : ''}`);
      return [
        `- ${i.form_title} — ${i.funder || 'unknown funder'} (${i.kind}${i.doc_type ? `, ${i.doc_type}` : ''}, access: ${i.access})`,
        `  source: ${i.source_url}`,
        fields.length ? `  fields: ${fields.join(', ')}` : '',
        prompts.length ? `  prompts:\n${prompts.join('\n')}` : '',
        (i.requirements || []).length ? `  requirements: ${(i.requirements || []).join('; ')}` : '',
      ].filter(Boolean).join('\n');
    }).join('\n');

    const funders = [...new Set(items.map((i: any) => i.funder).filter(Boolean))];

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a grant application standards analyst for JPGE Consulting LLC. Build the platform-standard application template: ONE reusable master template, grounded in the official forms already captured in the library below, that is later tailored to each individual opportunity.

CAPTURED FORMS AND SOURCES (${items.length} entries from ${funders.length} funder(s): ${funders.slice(0, 12).join(', ') || 'various'})
${formText}

TASK
1. Derive the COMMON structure across these official forms: the sections that recur, the questions applicants are actually asked, and the documents routinely required. This is a standard, not any single funder's form.
2. Write each prompt as the reusable version of a question the captured forms ask — general enough to fit any opportunity, specific enough to write against. Do NOT attribute any prompt to a particular funder.
3. Note the fillable fields and attachments that recur across the captured forms (budget lines, letters of support, registrations, organizational documents).
4. Return:
   - name: the template name.
   - eligibility_summary: the typical eligibility position, phrased as general guidance.
   - requirements: the documents and registrations routinely required.
   - prompts: each with section (Executive Summary, Needs Statement, Goals & Objectives, Methodology, Evaluation Plan, Organizational Capacity, Budget Narrative, or Other), prompt, word_limit ("" unless a limit is genuinely typical), requirement_link (the general requirement it satisfies, "" if none), evidence_source (a URL from the library above that supports it), evidence_excerpt (a short verbatim quote from that source), validation_status ("validated" when the captured official forms support it, "unverified" when it is general good practice rather than something found in the captured forms), and validation_note (one sentence).
   - gaps: anything standard practice suggests but the captured forms do not confirm.
   - sources: the library sources that informed the standard, each with title and url.
5. Never invent a requirement. Prompts that are good practice rather than evidence from a captured form must be marked "unverified".

Return 12-20 prompts.`,
      add_context_from_internet: false,
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
      // Standard prompts exist precisely where an opportunity does not spell a section out.
      provenance: 'standard',
    }));

    const counts = { validated: 0, unverified: 0, conflicts: 0, missing: 0 };
    for (const p of prompts) {
      if (p.validation_status === 'validated') counts.validated++;
      else if (p.validation_status === 'conflict') counts.conflicts++;
      else if (p.validation_status === 'missing') counts.missing++;
      else counts.unverified++;
    }

    const payload = {
      name: result.name || STANDARD_NAME,
      source_type: 'standard',
      grant_id: '',
      grant_title: '',
      funder: '',
      program_name: '',
      application_link: '',
      application_id: '',
      supplemental_links: [],
      documents: [],
      access_notes: '',
      standard_template_id: '',
      eligibility_summary: result.eligibility_summary || '',
      requirements: result.requirements || [],
      prompts,
      validation_summary: counts,
      gaps: result.gaps || [],
      sources: (result.sources || []).map((s: any) => ({ title: s.title || s.url || '', url: s.url || '', access: 'public' })),
      official_documentation_found: true,
      status: 'draft',
      generated_at: new Date().toISOString(),
    };

    // One standard template per app: refresh it rather than piling up copies.
    const existingPage = await base44.entities.FormTemplate.filter(
      { source_type: 'standard' },
      { sort: '-created_date', limit: 1 },
    );
    const existing = existingPage?.items?.[0];

    const template = existing
      ? await base44.entities.FormTemplate.update(existing.id, payload)
      : await base44.entities.FormTemplate.create(payload);

    return Response.json({
      template,
      library_count: items.length,
      refreshed: !!existing,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}