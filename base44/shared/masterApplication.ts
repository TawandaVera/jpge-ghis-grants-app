// Canonical application structure, library -> master application integration, and
// the deterministic relevance matching that tailors a draft to one opportunity.
// Used by integrateFormLibrary and tailorFromMaster.

const VALID_STATUS = new Set(['validated', 'unverified', 'conflict', 'missing']);
const VALID_PROVENANCE = new Set(['grant_specific', 'documented', 'standard']);

const MAX_PROMPTS_PER_SECTION = 40;
const MAX_EVIDENCE_PER_PROMPT = 6;
const MAX_TERMS = 60;

/** The sections every accumulated application is organised into. */
export const SECTIONS = [
  {
    key: 'executive_summary',
    label: 'Executive Summary',
    description: 'The short opening summary of the request, the need and the ask.',
    aliases: ['executive summary', 'project summary', 'summary', 'abstract', 'overview', 'project overview', 'purpose of request'],
  },
  {
    key: 'needs_statement',
    label: 'Needs Statement',
    description: 'The problem, the community need and the evidence behind it.',
    aliases: ['needs statement', 'statement of need', 'need statement', 'needs assessment', 'problem statement', 'community need', 'need', 'needs', 'challenge', 'gap'],
  },
  {
    key: 'goals_objectives',
    label: 'Goals & Objectives',
    description: 'What the project will achieve, stated as goals, objectives and outcomes.',
    aliases: ['goals', 'objectives', 'goals and objectives', 'outcomes', 'impact', 'theory of change', 'expected outcomes', 'expected results'],
  },
  {
    key: 'methodology',
    label: 'Methodology',
    description: 'How the work will be carried out: approach, activities, timeline.',
    aliases: ['methodology', 'approach', 'program design', 'project design', 'implementation', 'work plan', 'activities', 'project plan', 'project description'],
  },
  {
    key: 'evaluation_plan',
    label: 'Evaluation Plan',
    description: 'How success will be measured and reported.',
    aliases: ['evaluation', 'evaluation plan', 'measurement', 'performance measures', 'indicators', 'data collection', 'outcomes measurement', 'results'],
  },
  {
    key: 'organizational_capacity',
    label: 'Organizational Capacity',
    description: 'Who the applicant is, their track record, staff and governance.',
    aliases: ['organizational capacity', 'organisation capacity', 'capacity', 'organizational background', 'organization background', 'history', 'governance', 'staff', 'qualifications', 'experience', 'track record', 'board', 'about the organization', 'organizational information'],
  },
  {
    key: 'budget_narrative',
    label: 'Budget Narrative',
    description: 'The budget, its justification and the line items behind the ask.',
    aliases: ['budget', 'budget narrative', 'budget justification', 'budget detail', 'budget request', 'financial', 'costs', 'cost', 'expenses', 'line item', 'line items', 'funding request'],
  },
  {
    key: 'sustainability',
    label: 'Sustainability',
    description: 'How the work continues after this funding ends.',
    aliases: ['sustainability', 'sustainability plan', 'continuation', 'future funding', 'long term', 'long-term'],
  },
  {
    key: 'attachments',
    label: 'Attachments & Other Requirements',
    description: 'Documents, letters, forms and other submissions that accompany the narrative.',
    aliases: ['attachments', 'attachment', 'letters of support', 'letter of support', 'letters of commitment', 'appendices', 'appendix', 'required documents', 'financial statements', 'irs determination', 'supporting documents', 'supporting documentation', 'other'],
  },
];

// Every application needs a summary, so it is never filtered out.
export const CORE_KEYS = new Set(['executive_summary']);

const SECTION_BY_KEY = new Map(SECTIONS.map(s => [s.key, s]));

const STOP = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'will', 'your', 'their', 'have', 'has', 'are', 'was', 'were',
  'must', 'should', 'shall', 'into', 'over', 'than', 'then', 'them', 'they', 'been', 'being', 'about', 'which',
  'when', 'what', 'how', 'who', 'whom', 'whose', 'also', 'such', 'each', 'other', 'others', 'more', 'most',
  'less', 'least', 'upon', 'within', 'without', 'under', 'during', 'before', 'after', 'above', 'below', 'between',
  'both', 'same', 'very', 'only', 'just', 'not', 'but', 'can', 'may', 'might', 'would', 'could', 'does', 'did',
  'done', 'any', 'all', 'some', 'one', 'two', 'three', 'provide', 'describe', 'include', 'includes', 'including',
  'included', 'ensure', 'please', 'applicant', 'applicants', 'application', 'apply', 'grant', 'grants', 'project',
  'program', 'programme', 'organization', 'organisation', 'funding', 'funder', 'required', 'requirement',
  'requirements', 'section', 'answer', 'response', 'submit', 'submission', 'statement', 'document', 'documents',
  'information', 'details', 'specific', 'following', 'support', 'supports', 'explain', 'discuss', 'identify',
  'list', 'outline', 'summarize', 'summary', 'page', 'pages', 'word', 'words', 'limit', 'limits', 'attach',
  'upload', 'file', 'files', 'link', 'links', 'please', 'note', 'letter', 'letters', 'form', 'forms',
]);

function normalizeText(value: any): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Lowercased, punctuation-free text used for substring and term matching. */
export function normalizeForMatch(value: any): string {
  return normalizeText(value);
}

export function tokenize(text: any): string[] {
  return normalizeText(text)
    .split(' ')
    .filter(t => t.length >= 4 && !STOP.has(t));
}

/** Normalized prompt text — the key that collapses the same question across forms. */
export function promptKey(text: any): string {
  return normalizeText(text).slice(0, 300);
}

/** Maps whatever a captured form called a section onto a canonical section. */
export function canonicalSectionFor(name: any) {
  const raw = normalizeText(name);
  if (!raw) return SECTION_BY_KEY.get('attachments')!;

  for (const section of SECTIONS) {
    if (section.key === raw || normalizeText(section.label) === raw) return section;
    if (section.aliases.includes(raw)) return section;
  }

  // Longest alias contained in the captured section name wins.
  let best: any = null;
  let bestLength = 0;
  for (const section of SECTIONS) {
    for (const alias of section.aliases) {
      if (alias.length > 3 && raw.includes(alias) && alias.length > bestLength) {
        best = section;
        bestLength = alias.length;
      }
    }
  }
  if (best) return best;

  const rules: Array<[RegExp, string]> = [
    [/summar|overview|abstract/, 'executive_summary'],
    [/budget|financial|cost|expense|line item/, 'budget_narrative'],
    [/evaluat|measur|indicator|performance/, 'evaluation_plan'],
    [/goal|objective|outcome|impact|result/, 'goals_objectives'],
    [/need|problem|challenge|gap/, 'needs_statement'],
    [/method|approach|design|implement|activit|work plan|timeline/, 'methodology'],
    [/capacit|organi|history|staff|governance|qualif|experience|board|about/, 'organizational_capacity'],
    [/sustain|continuation|future fund/, 'sustainability'],
  ];
  for (const [pattern, key] of rules) {
    if (pattern.test(raw)) return SECTION_BY_KEY.get(key)!;
  }
  return SECTION_BY_KEY.get('attachments')!;
}

/** Where a source's requirements and fields belong when it captured no prompts. */
export function fallbackSectionForItem(item: any) {
  const kind = String(item?.kind || '');
  if (kind === 'budget_template') return SECTION_BY_KEY.get('budget_narrative')!;
  return SECTION_BY_KEY.get('attachments')!;
}

function provenanceForItem(item: any): string {
  if (item?.kind === 'documentation') return 'documented';
  if (item?.grant_id || item?.grant_title || item?.funder) return 'grant_specific';
  return 'standard';
}

/** Groups every captured source into the canonical sections it contributes to. */
export function buildMasterSections(items: any[]) {
  const buckets = new Map<string, any>();

  const ensure = (section: any) => {
    let bucket = buckets.get(section.key);
    if (!bucket) {
      bucket = {
        key: section.key,
        section: section.label,
        description: section.description,
        aliases: section.aliases,
        prompts: [],
        requirements: [],
        fields: [],
        sources: [],
      };
      buckets.set(section.key, bucket);
    }
    return bucket;
  };

  for (const item of items || []) {
    if (!item) continue;
    const touched = new Set<string>();

    for (const p of Array.isArray(item.prompts) ? item.prompts : []) {
      if (!p || !String(p.prompt || '').trim()) continue;
      const section = canonicalSectionFor(p.section);
      const bucket = ensure(section);
      touched.add(section.key);
      bucket.prompts.push({
        prompt: String(p.prompt).trim().slice(0, 2000),
        word_limit: String(p.word_limit || '').slice(0, 60),
        requirement_link: String(p.requirement_link || '').slice(0, 300),
        validation_status: VALID_STATUS.has(p.validation_status) ? p.validation_status : 'unverified',
        validation_note: String(p.validation_note || '').slice(0, 400),
        provenance: VALID_PROVENANCE.has(p.provenance) ? p.provenance : provenanceForItem(item),
        evidence_source: p.evidence_source || item.source_url || '',
        evidence_excerpt: String(p.evidence_excerpt || '').slice(0, 600),
        item,
      });
    }

    const source = {
      title: String(item.form_title || item.source_url || '').slice(0, 300),
      url: item.source_url || '',
      kind: item.kind || 'other',
      access: item.access || 'unknown',
      funder: item.funder || '',
    };

    for (const key of touched.size ? [...touched] : []) {
      ensure(SECTION_BY_KEY.get(key)!).sources.push(source);
    }

    // Requirements and fillable fields have no section of their own, so they live
    // with the section that matches the material: budgets with the budget, every
    // other form or attachment with the attachments section.
    const home = ensure(fallbackSectionForItem(item));
    home.sources.push(source);
    for (const r of Array.isArray(item.requirements) ? item.requirements : []) {
      if (String(r || '').trim()) home.requirements.push(String(r).trim().slice(0, 400));
    }
    for (const f of Array.isArray(item.fields) ? item.fields : []) {
      if (String(f || '').trim()) home.fields.push(String(f).trim().slice(0, 200));
    }
  }

  return buckets;
}

function uniqueStrings(values: string[], max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const v = String(value || '').trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
    if (out.length >= max) break;
  }
  return out;
}

function uniqueSources(sources: any[], max: number) {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const s of sources) {
    const key = String(s.url || s.title || '').toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

/** Describes how two captured sources disagree, or "" when they agree. */
function conflictNote(prior: any, evidence: any): string {
  const limits = [...new Set([prior.word_limit, evidence.word_limit].filter(Boolean))];
  const statuses = [...new Set(
    [prior.validation_status, evidence.validation_status].filter(s => s && s !== 'unverified' && s !== 'conflict'),
  )];
  const problems: string[] = [];
  if (limits.length > 1) problems.push(`stated limits differ (${limits.join(' vs ')})`);
  if (statuses.length > 1) problems.push(`official sources disagree (${statuses.join(' vs ')})`);
  if (!problems.length) return '';
  return `Conflicting evidence from ${(prior.evidence || []).length} captured sources: ${problems.join('; ')}. Kept side by side rather than resolved.`;
}

/**
 * Merges one section's newly captured prompts into its master record.
 * Repeats are collapsed, their evidence is kept, and any disagreement between
 * sources is flagged as a conflict instead of being silently overwritten.
 */
export function mergeSection(existing: any, bucket: any, now: string) {
  const byKey = new Map<string, any>();
  for (const p of Array.isArray(existing?.prompts) ? existing.prompts : []) {
    const key = p?.prompt_key || promptKey(p?.prompt);
    if (!key) continue;
    byKey.set(key, { ...p, evidence: Array.isArray(p.evidence) ? [...p.evidence] : [] });
  }

  let conflicts = 0;
  for (const incoming of bucket.prompts) {
    const key = promptKey(incoming.prompt);
    if (!key) continue;

    const evidence = {
      source_title: String(incoming.item?.form_title || incoming.item?.source_url || '').slice(0, 300),
      url: incoming.item?.source_url || '',
      funder: incoming.item?.funder || '',
      kind: incoming.item?.kind || 'other',
      access: incoming.item?.access || 'unknown',
      library_item_id: incoming.item?.id || '',
      validation_status: incoming.validation_status,
      word_limit: incoming.word_limit || '',
      excerpt: incoming.evidence_excerpt || '',
      seen_at: now,
    };

    const prior = byKey.get(key);
    if (!prior) {
      byKey.set(key, {
        prompt: incoming.prompt,
        prompt_key: key,
        section: bucket.section,
        word_limit: incoming.word_limit || '',
        requirement_link: incoming.requirement_link || '',
        validation_status: incoming.validation_status,
        validation_note: incoming.validation_note || '',
        provenance: incoming.provenance,
        evidence_source: incoming.evidence_source || evidence.url,
        evidence_excerpt: incoming.evidence_excerpt || '',
        evidence: [evidence],
        occurrences: 1,
        first_seen_at: now,
        last_seen_at: now,
      });
      continue;
    }

    const duplicate = prior.evidence.some(e => e.url && e.url === evidence.url && e.excerpt === evidence.excerpt);
    if (!duplicate) {
      prior.evidence.push(evidence);
      prior.occurrences = (prior.occurrences || 1) + 1;
    }
    prior.last_seen_at = now;

    const note = conflictNote(prior, evidence);
    if (note) {
      prior.validation_status = 'conflict';
      prior.validation_note = note;
      conflicts++;
    } else if (evidence.validation_status === 'validated' && prior.validation_status !== 'validated') {
      // A source that confirms the prompt outranks one that only inferred it.
      prior.validation_status = 'validated';
      prior.validation_note = incoming.validation_note || prior.validation_note;
      prior.evidence_source = evidence.url || prior.evidence_source;
      prior.evidence_excerpt = evidence.excerpt || prior.evidence_excerpt;
    }

    if (prior.evidence.length > MAX_EVIDENCE_PER_PROMPT) {
      prior.evidence = prior.evidence.slice(-MAX_EVIDENCE_PER_PROMPT);
    }
  }

  const prompts = [...byKey.values()]
    .sort((a, b) => (b.occurrences || 1) - (a.occurrences || 1))
    .slice(0, MAX_PROMPTS_PER_SECTION);

  const requirements = uniqueStrings([...(existing?.requirements || []), ...bucket.requirements], 40);
  const fields = uniqueStrings([...(existing?.fields || []), ...bucket.fields], 60);
  const sources = uniqueSources([...(existing?.sources || []), ...bucket.sources], 60);

  // Matching terms grow with every integrated form, so later opportunities are
  // matched against everything learned so far.
  const terms = new Set<string>(bucket.aliases);
  for (const p of prompts) {
    for (const t of tokenize(p.prompt).slice(0, 6)) terms.add(t);
  }
  for (const r of requirements) {
    for (const t of tokenize(r).slice(0, 4)) terms.add(t);
  }

  const record = {
    section: bucket.section,
    section_key: bucket.key,
    description: bucket.description,
    prompts,
    requirements,
    fields,
    sources,
    relevance_terms: [...terms].slice(0, MAX_TERMS),
    prompt_count: prompts.length,
    source_count: new Set(prompts.flatMap(p => (p.evidence || []).map((e: any) => e.url).filter(Boolean))).size,
    conflict_count: prompts.filter(p => p.validation_status === 'conflict').length,
    reusable: prompts.length > 0 || requirements.length > 0,
    status: 'active',
    last_integrated_at: now,
  };

  return { record, conflicts };
}

/**
 * Integrates captured library material into the master application.
 * Idempotent: the same library can be integrated again without duplicating prompts.
 */
export async function integrateLibraryItems(base44: any, items: any[]) {
  const now = new Date().toISOString();
  const buckets = buildMasterSections(items || []);
  if (!buckets.size) return { sections: 0, prompts: 0, sources: 0, conflicts: 0 };

  const keys = [...buckets.keys()];
  const found = await base44.entities.MasterApplication.filter({ section_key: { $in: keys } });
  const existingRows = Array.isArray(found) ? found : found?.items || [];
  const existing = new Map(existingRows.map((r: any) => [r.section_key, r]));

  const records: any[] = [];
  let conflicts = 0;
  for (const [key, bucket] of buckets) {
    const { record, conflicts: sectionConflicts } = mergeSection(existing.get(key), bucket, now);
    conflicts += sectionConflicts;
    records.push(record);
  }

  await base44.entities.MasterApplication.upsert(records, { key: 'section_key' });

  return {
    sections: records.length,
    prompts: records.reduce((sum, r) => sum + r.prompt_count, 0),
    sources: records.reduce((sum, r) => sum + r.source_count, 0),
    conflicts,
  };
}

/**
 * Deterministic relevance: how strongly one opportunity's own words point at a
 * master section. A section alias in the grant text is a direct hit; other
 * accumulated terms count as supporting evidence.
 */
export function scoreSection(section: any, context: { text: string; tokens: Set<string> }) {
  const aliases = section.aliases || [];
  const matched: string[] = [];
  let score = 0;

  for (const alias of aliases) {
    if (!alias) continue;
    const single = !alias.includes(' ');
    const hit = single ? context.tokens.has(alias) : context.text.includes(alias);
    if (hit) {
      matched.push(alias);
      score += 3;
    }
  }

  for (const term of section.relevance_terms || []) {
    const t = String(term || '').toLowerCase();
    if (!t || aliases.includes(t) || t.length < 4) continue;
    const single = !t.includes(' ');
    const hit = single ? context.tokens.has(t) : context.text.includes(t);
    if (hit) {
      matched.push(t);
      score += 1;
    }
  }

  const terms = [...new Set(matched)];
  return {
    score,
    matched_terms: terms.slice(0, 8),
    reason: terms.length
      ? `Matched ${terms.slice(0, 4).join(', ')}`
      : 'No mention in this opportunity',
  };
}

/** Splits master sections into the ones this opportunity calls for and the rest. */
export function matchSections(sections: any[], context: { text: string; tokens: Set<string> }) {
  const included: any[] = [];
  const excluded: any[] = [];

  for (const section of sections || []) {
    const match = scoreSection(section, context);
    const core = CORE_KEYS.has(section.section_key);
    const entry = {
      section: section.section,
      section_key: section.section_key,
      score: match.score,
      matched_terms: match.matched_terms,
      prompt_count: (section.prompts || []).length,
      reason: core ? 'Every application needs a summary' : match.reason,
    };
    (core || match.score >= 3 ? included : excluded).push(entry);
  }

  return { included, excluded };
}