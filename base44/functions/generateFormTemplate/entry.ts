import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  normalizeUrl,
  normalizeKind,
  capturePrivateCopy,
  upsertLibraryItems,
} from '../../shared/formLibrary.ts';
import { integrateLibraryItems } from '../../shared/masterApplication.ts';
import { buildStandardTemplateFromLibrary } from '../../shared/standardTemplate.ts';

const VALID_STATUS = new Set(['validated', 'unverified', 'conflict', 'missing']);
const VALID_ACCESS = new Set(['public', 'signin_required', 'unknown']);
const VALID_PROVENANCE = new Set(['grant_specific', 'documented', 'standard']);
const DOC_KINDS = new Set(['application_form', 'budget_template', 'guidelines', 'checklist', 'portal', 'other']);
const LINK_KINDS = new Set(['portal', 'documentation', 'requirements', 'document', 'page', 'other']);

const MAX_LINKS = 8;
const MAX_DOCUMENTS = 20;
const MAX_COPIES = 5;

function accessLabel(value: string) {
  if (value === 'signin_required') return 'sign-in required';
  if (value === 'public') return 'public';
  return 'unconfirmed';
}

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
      supplemental_links = [],
    } = body || {};

    // Additional official sources the applicant supplied (documentation pages,
    // requirements pages, portals, direct form links).
    const supplements = (Array.isArray(supplemental_links) ? supplemental_links : [])
      .map((l: any) => (typeof l === 'string' ? { url: l } : l))
      .filter((l: any) => l && String(l.url || '').trim())
      .slice(0, MAX_LINKS)
      .map((l: any) => ({
        url: String(l.url).trim(),
        label: String(l.label || '').trim(),
        kind: LINK_KINDS.has(l.kind) ? l.kind : 'page',
        note: '',
      }));

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

    // The platform-standard template: the base every grant template is tailored from.
    let standard = null;
    try {
      const page = await base44.entities.FormTemplate.filter(
        { source_type: 'standard' },
        { sort: '-created_date', limit: 1 },
      );
      standard = page?.items?.[0] || null;
    } catch (e) { standard = null; }

    // Previously captured forms, so the same official document is never re-researched.
    let library = [];
    try {
      const page = await base44.entities.FormLibrary.filter(
        { status: 'active' },
        { sort: '-last_seen_at', limit: 40 },
      );
      library = page?.items || [];
    } catch (e) { library = []; }

    const supplementText = supplements.length
      ? supplements.map((l: any, i: number) => {
        const tag = l.kind === 'documentation' ? 'documentation: public portal help article / tutorial' : l.kind;
        return `${i + 1}. ${l.url}${l.label ? ` — ${l.label}` : ''}${tag ? ` [${tag}]` : ''}`;
      }).join('\n')
      : 'None provided';

    const standardText = standard
      ? `Standard template: ${standard.name}
Reusable prompts:
${(standard.prompts || []).slice(0, 20).map((p: any) => `- [${p.section}] ${p.prompt}`).join('\n')}
Standard requirements: ${(standard.requirements || []).join('; ') || 'None recorded'}`
      : 'No platform standard template has been built yet.';

    const libraryText = library.length
      ? library.slice(0, 25).map((i: any) => {
        const fields = (i.fields || []).slice(0, 10).join(', ');
        return `- ${i.form_title} (${i.kind}, access: ${i.access}) ${i.source_url}${fields ? ` | fields: ${fields}` : ''}`;
      }).join('\n')
      : 'Empty';

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a grant application form analyst for JPGE Consulting LLC. Build a VALIDATED application form template for the opportunity below.

OPPORTUNITY
Title: ${title}
Funder: ${funderName || 'Unknown'}
Primary application link: ${link || 'Not provided'}
Description: ${description || 'N/A'}
Known eligibility: ${eligibility || 'Not provided'}
Known requirements: ${requirements || 'Not provided'}
Known form questions already captured: ${knownQuestions || 'None'}

ADDITIONAL OFFICIAL SOURCES (supplied by the applicant — research ALL of them)
${supplementText}

PUBLIC PORTAL DOCUMENTATION BEHIND A REGISTRATION WALL
An application portal (Foundant, Submittable, Fluxx, SmartSimple and the like) keeps the real form behind a sign-in. The portal vendor usually publishes public help articles and step-by-step applicant tutorials that describe that form, and the applicant may have supplied one above as documentation. Those articles are public, so they are legitimate evidence:
- A question, required field, character or word limit, or submission step stated in such an article is "validated", with evidence_source set to that article's URL and evidence_excerpt quoting it.
- Give every prompt you take from that documentation provenance "documented", and set requirement_link to the portal step or requirement it comes from.
- Return the article in source_links with kind "documentation" and access "public".
Documentation DESCRIBES the portal; it is not the portal. Reading a public help article is allowed. Registering, signing in, or trying to reach anything the article gates is not.

PLATFORM STANDARD TEMPLATE (the reusable base — tailor it to this opportunity)
${standardText}

ALREADY-CAPTURED FORMS IN THE LIBRARY
${libraryText}

APPLICANT ORGANIZATION
${orgDesc}

TASK
1. Research the official application materials with web search: the primary application link, EVERY additional official source listed above, plus any RFP, NOFO, guidelines, budget template or linked documentation reachable from them. Many funders publish the real "how to apply" detail on a separate page from the programme page, and link their fillable documents from there — follow those links.
2. Extract the ACTUAL questions and prompts an applicant must answer. Capture stated word or page limits.
3. Locate the fillable and supporting documents themselves: application forms, budget spreadsheets/templates, guidelines, checklists. Report each one at its direct URL (e.g. a .pdf or .xlsx link), not just the page that links to it.
4. For the fillable documents, capture the fields they ask for: named budget lines, columns, tables, and any required attachments.
5. REGISTRATION WALLS: a source may lead to a sign-in or registration page (an online application portal). You cannot see behind it, and you must NOT claim or imply that you did. Mark that source "signin_required" and record, from the public pages AND from any public documentation or tutorial supplied for that portal, what the applicant will need once registered. Never invent portal contents.
6. For EACH prompt, return:
   - section: the proposal section it belongs to (Executive Summary, Needs Statement, Goals & Objectives, Methodology, Evaluation Plan, Organizational Capacity, Budget Narrative, or Other).
   - prompt: the exact question or instruction, phrased as an actionable writing prompt.
   - word_limit: any stated limit, otherwise "".
   - requirement_link: which eligibility criterion or stated requirement this prompt satisfies.
   - evidence_source: the exact URL where you found it.
   - evidence_excerpt: a short verbatim quote from that source proving the prompt exists.
   - validation_status: "validated" (found in official materials), "unverified" (inferred from funder type or category, not confirmed), "conflict" (official materials disagree with each other or with the stated eligibility), or "missing" (a required item you could not locate).
   - validation_note: one sentence explaining the status.
   - provenance: "grant_specific" when the prompt comes from this funder's own explicit application materials; "documented" when it comes from that portal's public documentation or applicant tutorial; "standard" when this opportunity requires a section but does not spell it out and you are supplying the platform standard prompt as reusable guidance. Priority: the funder's own materials win, then the portal documentation, then the standard prompt — never restate a lower source as if the funder required it.
7. eligibility_summary: applicant eligibility in plain language.
8. requirements: the concrete submission requirements (documents, registrations, formats, letters of support, etc.).
9. source_links: one entry per source you were given (the primary link and each additional source) with url, label, kind, access ("public", "signin_required" or "unknown") and a one-sentence note on what it offers or what it withholds.
10. documents: every fillable or supporting document you located, each with title, url, kind, access, extracted_fields (the fields, columns or line items it asks for), and a one-sentence note.
11. access_notes: what an applicant cannot see without an account, and what the public pages say they will need once registered. Use "" if everything is public.
12. gaps: anything a complete application needs that you could NOT verify from official sources.
13. sources: every official source used, each with a title, url and access.
14. official_documentation_found: true only if you actually located the funder's own application materials.

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
                provenance: { type: 'string' },
              },
            },
          },
          source_links: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                label: { type: 'string' },
                kind: { type: 'string' },
                access: { type: 'string' },
                note: { type: 'string' },
              },
            },
          },
          documents: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                url: { type: 'string' },
                kind: { type: 'string' },
                access: { type: 'string' },
                extracted_fields: { type: 'array', items: { type: 'string' } },
                note: { type: 'string' },
              },
            },
          },
          access_notes: { type: 'string' },
          gaps: { type: 'array', items: { type: 'string' } },
          sources: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                url: { type: 'string' },
                access: { type: 'string' },
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
      provenance: VALID_PROVENANCE.has(p.provenance) ? p.provenance : 'grant_specific',
    }));

    // Validation counts are computed from the prompts so they always agree with what is shown.
    const counts = { validated: 0, unverified: 0, conflicts: 0, missing: 0 };
    for (const p of prompts) {
      if (p.validation_status === 'validated') counts.validated++;
      else if (p.validation_status === 'conflict') counts.conflicts++;
      else if (p.validation_status === 'missing') counts.missing++;
      else counts.unverified++;
    }

    // Keep the applicant's own labels and kinds; take access + notes from research.
    const researched = new Map<string, any>();
    for (const s of result.source_links || []) {
      const key = normalizeUrl(s?.url);
      if (key) researched.set(key, s);
    }

    const supplementalLinks = supplements.map((l: any) => {
      const match = researched.get(normalizeUrl(l.url));
      return {
        url: l.url,
        label: l.label || match?.label || '',
        kind: LINK_KINDS.has(normalizeKind(match?.kind)) ? normalizeKind(match?.kind) : l.kind,
        access: VALID_ACCESS.has(match?.access) ? match.access : 'unknown',
        note: match?.note || l.note || '',
      };
    });

    const accessFor = (url: string) => {
      const match = researched.get(normalizeUrl(url));
      return VALID_ACCESS.has(match?.access) ? match.access : 'unknown';
    };

    const documents = (result.documents || [])
      .filter((d: any) => d && String(d.url || '').trim())
      .slice(0, MAX_DOCUMENTS)
      .map((d: any) => ({
        title: String(d.title || d.url).slice(0, 300),
        url: String(d.url).trim(),
        kind: DOC_KINDS.has(normalizeKind(d.kind)) ? normalizeKind(d.kind) : 'other',
        access: VALID_ACCESS.has(d.access) ? d.access : 'unknown',
        file_uri: '',
        extracted_fields: Array.isArray(d.extracted_fields) ? d.extracted_fields.filter(Boolean).slice(0, 40) : [],
        note: d.note || '',
      }));

    // Keep an accessible copy of the documents that are openly downloadable.
    // Sign-in-walled material is recorded as a link only and never fetched.
    let copies = 0;
    for (const doc of documents) {
      if (copies >= MAX_COPIES) break;
      if (doc.access !== 'public') continue;
      const fileUri = await capturePrivateCopy(base44, doc.url, doc.title);
      if (fileUri) {
        doc.file_uri = fileUri;
        copies++;
      }
    }

    const sources = (result.sources || []).map((s: any) => ({
      title: s.title || s.url || '',
      url: s.url || '',
      access: VALID_ACCESS.has(s.access) ? s.access : 'unknown',
    }));

    const accessNotes = result.access_notes
      || documents.filter(d => d.access === 'signin_required').map(d => `${d.title} is behind a sign-in or registration wall.`).join(' ')
      || '';

    const template = await base44.entities.FormTemplate.create({
      name: result.name || title,
      source_type,
      grant_id: grant?.id || grant_id || '',
      grant_title: title,
      funder: funderName,
      program_name: program_name || grant?.title || title,
      application_link: link,
      application_id,
      supplemental_links: supplementalLinks,
      documents,
      access_notes: accessNotes,
      standard_template_id: standard?.id || '',
      eligibility_summary: result.eligibility_summary || eligibility || '',
      requirements: result.requirements || grant?.requirements || [],
      prompts,
      validation_summary: counts,
      gaps: result.gaps || [],
      sources,
      official_documentation_found: !!result.official_documentation_found,
      status: 'draft',
      generated_at: new Date().toISOString(),
    });

    // Feed the central library so the same form is reused instead of re-researched.
    // Each library prompt keeps its provenance and evidence, so the master
    // application can carry them into later drafts intact.
    const promptFor = (url: string) => prompts
      .filter(p => normalizeUrl(p.evidence_source) === normalizeUrl(url))
      .map(p => ({
        section: p.section,
        prompt: p.prompt,
        word_limit: p.word_limit,
        requirement_link: p.requirement_link,
        evidence_source: p.evidence_source,
        evidence_excerpt: p.evidence_excerpt,
        validation_status: p.validation_status,
        validation_note: p.validation_note,
        provenance: p.provenance,
      }));

    const common = {
      funder: funderName,
      program_name: program_name || grant?.title || title,
      source_page: link,
      grant_id: grant?.id || grant_id || '',
      grant_title: title,
    };

    const libraryItems: any[] = [];
    const capturedUrls = new Set(documents.map(d => normalizeUrl(d.url)));

    // Documents first: when a link and a document share a URL, the captured
    // document — with its stored copy and fields — is the richer library entry.
    for (const d of documents) {
      libraryItems.push({
        ...common,
        form_title: d.title,
        source_url: d.url,
        kind: d.kind,
        access: d.access,
        file_uri: d.file_uri,
        fields: d.extracted_fields,
        prompts: promptFor(d.url),
        tags: ['document', d.kind],
      });
    }

    if (link) {
      libraryItems.push({
        ...common,
        form_title: `${title} — application page`,
        source_url: link,
        kind: 'portal',
        access: accessFor(link),
        requirements: result.requirements || [],
        prompts: promptFor(link),
        tags: ['application-page'],
      });
    }

    for (const l of supplementalLinks) {
      if (capturedUrls.has(normalizeUrl(l.url))) continue;
      libraryItems.push({
        ...common,
        form_title: l.label || `${title} — supporting source`,
        source_url: l.url,
        kind: l.kind,
        access: accessFor(l.url),
        prompts: promptFor(l.url),
        tags: ['supplemental-source', l.kind],
      });
    }

    const libraryResult = await upsertLibraryItems(base44, libraryItems);

    // Everything captured so far is folded into the master application, so the
    // next application starts from all accumulated context instead of a blank page.
    let master = null;
    let standardRefreshed = false;
    let integrationError = '';
    try {
      const libraryPage = await base44.entities.FormLibrary.filter(
        { status: 'active' },
        { sort: '-last_seen_at', limit: 200 },
      );
      master = await integrateLibraryItems(base44, libraryPage?.items || []);

      // The standard template is rebuilt from the same library. A failure here
      // must not lose the capture that has just succeeded.
      const built = await buildStandardTemplateFromLibrary(base44);
      standardRefreshed = !!built?.template;
    } catch (e) {
      integrationError = e.message;
    }

    return Response.json({
      template,
      library: libraryResult,
      master,
      standard_refreshed: standardRefreshed,
      integration_error: integrationError,
      copies,
      standard_applied: !!standard,
      access_summary: {
        signin_required: documents.filter(d => d.access === 'signin_required').length + supplementalLinks.filter(l => l.access === 'signin_required').length,
        public: documents.filter(d => d.access === 'public').length + supplementalLinks.filter(l => l.access === 'public').length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}