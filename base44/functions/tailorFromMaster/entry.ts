import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  matchSections,
  tokenize,
  normalizeForMatch,
  canonicalSectionFor,
  promptKey,
} from '../../shared/masterApplication.ts';

const VALID_STATUS = new Set(['validated', 'unverified', 'conflict', 'missing']);
const VALID_PROVENANCE = new Set(['grant_specific', 'documented', 'standard']);
const MAX_PROMPTS = 60;

/**
 * Builds a draft application for one opportunity straight from the comprehensive
 * master application: sections the opportunity's own requirements point at are
 * included, the rest are excluded, and the master itself is never modified.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const application_id = body?.application_id || '';
    const grant_id = body?.grant_id || '';

    let requirements = Array.isArray(body?.requirements) ? body.requirements.filter(Boolean) : [];
    let questions = Array.isArray(body?.form_questions) ? body.form_questions.filter(Boolean) : [];
    let eligibility = body?.eligibility || '';
    let title = body?.grant_title || '';
    let funderName = body?.funder || '';
    let deadline = body?.deadline || '';
    let link = body?.application_link || '';
    let focusAreas = Array.isArray(body?.focus_areas) ? body.focus_areas : [];

    let grant = null;
    if (grant_id) {
      try { grant = await base44.entities.Grant.get(grant_id); } catch (e) { grant = null; }
    }
    if (grant) {
      title = title || grant.title || '';
      funderName = funderName || grant.funder || '';
      deadline = deadline || grant.deadline || '';
      link = link || grant.source_url || '';
      eligibility = eligibility || grant.eligibility || '';
      if (!requirements.length) requirements = grant.requirements || [];
      if (!questions.length) questions = grant.application_form_questions || [];
      if (!focusAreas.length) focusAreas = grant.focus_areas || [];
    }

    const grantText = normalizeForMatch([
      title,
      funderName,
      eligibility,
      focusAreas.join(' '),
      ...requirements,
      ...questions,
    ].filter(Boolean).join(' '));

    // Without the opportunity's own words there is nothing to match against, and
    // guessing would mean shipping sections the grant never asked for.
    if (grantText.length < 12) {
      return Response.json({
        error: "Add this opportunity's requirements or application questions first, so the master sections can be matched to it.",
      }, { status: 400 });
    }

    const context = { text: grantText, tokens: new Set(tokenize(grantText)) };

    const page = await base44.entities.MasterApplication.filter(
      { status: 'active' },
      { sort: 'section_key', limit: 100 },
    );
    const sections = page?.items || [];

    if (!sections.length) {
      return Response.json({
        error: 'Your master application is empty. Open it and integrate your form library first.',
      }, { status: 400 });
    }

    const { included, excluded } = matchSections(sections, context);
    const includedKeys = new Set(included.map((s: any) => s.section_key));
    const includedSections = sections.filter((s: any) => includedKeys.has(s.section_key));

    // Prompts are carried across verbatim so every one keeps the source it came from.
    const prompts: any[] = [];
    const seen = new Set<string>();
    const addPrompt = (p: any, sectionLabel: string, fallbackProvenance: string) => {
      const key = promptKey(p?.prompt);
      if (!key || seen.has(key)) return;
      seen.add(key);
      prompts.push({
        section: sectionLabel,
        prompt: p.prompt,
        word_limit: p.word_limit || '',
        requirement_link: p.requirement_link || '',
        evidence_source: p.evidence_source || '',
        evidence_excerpt: p.evidence_excerpt || '',
        validation_status: VALID_STATUS.has(p.validation_status) ? p.validation_status : 'unverified',
        validation_note: p.validation_note || '',
        provenance: VALID_PROVENANCE.has(p.provenance) ? p.provenance : fallbackProvenance,
      });
    };

    const coveredKeys = new Set<string>();
    for (const section of includedSections) {
      if ((section.prompts || []).length) coveredKeys.add(section.section_key);
      for (const p of section.prompts || []) addPrompt(p, section.section, 'grant_specific');
    }

    // Sections this opportunity asks for that the master has no prompt for yet
    // fall back to the platform standard guidance.
    let standard = null;
    try {
      const std = await base44.entities.FormTemplate.filter(
        { source_type: 'standard' },
        { sort: '-created_date', limit: 1 },
      );
      standard = std?.items?.[0] || null;
    } catch (e) { standard = null; }

    if (standard) {
      const openKeys = new Set(included.map((s: any) => s.section_key).filter((k: string) => !coveredKeys.has(k)));
      if (openKeys.size) {
        for (const p of standard.prompts || []) {
          const section = canonicalSectionFor(p.section);
          if (!openKeys.has(section.key)) continue;
          addPrompt(p, section.label, 'standard');
        }
      }
    }

    const counts = { validated: 0, unverified: 0, conflicts: 0, missing: 0 };
    for (const p of prompts) {
      if (p.validation_status === 'validated') counts.validated++;
      else if (p.validation_status === 'conflict') counts.conflicts++;
      else if (p.validation_status === 'missing') counts.missing++;
      else counts.unverified++;
    }

    // Sections kept in the draft that still have no prompt are the honest gaps.
    const gaps: string[] = [];
    for (const section of included) {
      const hasPrompt = prompts.some(p => p.section === section.section);
      if (!hasPrompt) gaps.push(`${section.section} is called for here but the master application has no prompt for it yet.`);
    }
    if (excluded.length) {
      gaps.push(`${excluded.length} master section${excluded.length === 1 ? '' : 's'} left out because this opportunity does not mention ${excluded.length === 1 ? 'it' : 'them'}: ${excluded.map((e: any) => e.section).join(', ')}.`);
    }

    const sourceSeen = new Set<string>();
    const sources: any[] = [];
    for (const section of includedSections) {
      for (const s of section.sources || []) {
        const key = String(s.url || s.title || '').toLowerCase();
        if (!key || sourceSeen.has(key)) continue;
        sourceSeen.add(key);
        sources.push({ title: s.title || s.url || '', url: s.url || '', access: s.access || 'unknown' });
        if (sources.length >= 40) break;
      }
      if (sources.length >= 40) break;
    }

    const template = await base44.entities.FormTemplate.create({
      name: `${title || 'Grant application'} — draft from master application`,
      source_type: application_id || grant_id ? 'pipeline' : 'donor',
      grant_id: grant?.id || grant_id || '',
      grant_title: title || 'Untitled opportunity',
      funder: funderName,
      program_name: title || '',
      application_link: link,
      application_id,
      supplemental_links: [],
      documents: [],
      access_notes: '',
      standard_template_id: standard?.id || '',
      tailored_from_master: true,
      included_sections: included.map((s: any) => s.section),
      excluded_sections: excluded.map((s: any) => s.section),
      section_matches: [...included, ...excluded].map((s: any) => ({
        section: s.section,
        score: s.score,
        matched_terms: s.matched_terms,
        prompt_count: s.prompt_count,
        reason: s.reason,
      })),
      eligibility_summary: eligibility || '',
      requirements,
      prompts: prompts.slice(0, MAX_PROMPTS),
      validation_summary: counts,
      gaps,
      sources,
      official_documentation_found: prompts.length > 0,
      status: 'draft',
      generated_at: new Date().toISOString(),
    });

    return Response.json({
      template,
      included,
      excluded,
      master_sections: sections.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}