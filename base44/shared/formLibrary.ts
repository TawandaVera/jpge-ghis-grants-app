// Shared helpers for the central form library.
// Used by generateFormTemplate (capture) and buildStandardTemplate (reuse).

const DOC_EXT = /\.(pdf|docx?|xlsx?|pptx?|csv|rtf|txt)(?:$|[?#])/i;
const MAX_COPY_BYTES = 8 * 1024 * 1024;

const KIND_VALUES = new Set([
  'application_form', 'budget_template', 'guidelines', 'checklist',
  'portal', 'documentation', 'requirements', 'page', 'other',
]);

const ACCESS_VALUES = new Set(['public', 'signin_required', 'unknown']);

/** Stable comparison key so the same form is never captured twice. */
export function normalizeUrl(url: any): string {
  return String(url || '')
    .trim()
    .split('#')[0]
    .replace(/[?&]$/, '')
    .replace(/\/+$/, '')
    .toLowerCase();
}

export function docTypeFromUrl(url: any): string {
  const u = String(url || '').toLowerCase();
  if (/\.pdf(?:$|[?#])/.test(u)) return 'pdf';
  if (/\.docx?(?:$|[?#])/.test(u)) return 'docx';
  if (/\.xlsx?(?:$|[?#])/.test(u)) return 'xlsx';
  if (/\.(png|jpe?g|gif|webp)(?:$|[?#])/.test(u)) return 'image';
  if (/portal|logon|login|signin|apply|grantinterface|submittable|fluxx|smartsimple|foundant/i.test(u)) return 'portal';
  return 'webpage';
}

export function slugify(text: any): string {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'form';
}

/**
 * Downloads a publicly reachable document and stores a private copy.
 * Returns "" when the document is not downloadable (sign-in wall, not a
 * document, too large, or any network failure) — the caller records the
 * link either way and never attempts to bypass an authentication wall.
 */
export async function capturePrivateCopy(base44: any, url: string, title: string): Promise<string> {
  try {
    if (!DOC_EXT.test(url)) return '';
    const resp = await fetch(url, { redirect: 'follow' });
    if (!resp.ok) return '';
    const declared = Number(resp.headers.get('content-length') || 0);
    if (declared > MAX_COPY_BYTES) return '';
    const buf = await resp.arrayBuffer();
    if (!buf.byteLength || buf.byteLength > MAX_COPY_BYTES) return '';
    const contentType = resp.headers.get('content-type') || 'application/octet-stream';
    const ext = (DOC_EXT.exec(url)?.[1] || 'bin').toLowerCase();
    const file = new File([buf], `${slugify(title || url)}.${ext}`, { type: contentType });
    const uploaded = await base44.integrations.Core.UploadPrivateFile({ file });
    return uploaded?.file_uri || '';
  } catch (e) {
    return '';
  }
}

/** Maps whatever the researcher calls a document onto the library's kinds. */
export function normalizeKind(value: any, fallback = 'other'): string {
  const k = String(value || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (KIND_VALUES.has(k)) return k;
  if (/budget|spreadsheet|financial|line_item/.test(k)) return 'budget_template';
  if (/checklist|check_list/.test(k)) return 'checklist';
  if (/guide|instruction|manual/.test(k)) return 'guidelines';
  if (/portal|logon|login/.test(k)) return 'portal';
  if (/documentation|resource|tutorial|help|support|article|faq|knowledge/.test(k)) return 'documentation';
  if (/requirement|criteria|eligib/.test(k)) return 'requirements';
  if (/form|proposal|narrative|application/.test(k)) return 'application_form';
  if (/page|site|website/.test(k)) return 'page';
  return fallback;
}

export function buildLibraryItem(raw: any, now: string) {
  return {
    form_title: String(raw.form_title || raw.title || raw.source_url || '').slice(0, 300),
    funder: raw.funder || '',
    program_name: raw.program_name || '',
    source_url: normalizeUrl(raw.source_url),
    source_page: raw.source_page || '',
    grant_id: raw.grant_id || '',
    grant_title: raw.grant_title || '',
    kind: normalizeKind(raw.kind),
    doc_type: raw.doc_type || docTypeFromUrl(raw.source_url),
    access: ACCESS_VALUES.has(raw.access) ? raw.access : 'unknown',
    file_uri: raw.file_uri || '',
    fields: Array.isArray(raw.fields) ? raw.fields.filter(Boolean).slice(0, 60) : [],
    prompts: Array.isArray(raw.prompts) ? raw.prompts.slice(0, 40) : [],
    requirements: Array.isArray(raw.requirements) ? raw.requirements.filter(Boolean).slice(0, 40) : [],
    tags: Array.isArray(raw.tags) ? raw.tags.filter(Boolean).slice(0, 12) : [],
    status: 'active',
    last_seen_at: now,
  };
}

/**
 * Creates or refreshes library entries, deduplicating on the normalized source URL.
 * A single bad entry never fails the whole capture.
 */
export async function upsertLibraryItems(base44: any, items: any[]): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;
  const seen = new Set<string>();

  for (const raw of items) {
    const payload = buildLibraryItem(raw, new Date().toISOString());
    if (!payload.source_url || seen.has(payload.source_url)) continue;
    seen.add(payload.source_url);

    try {
      const found = await base44.entities.FormLibrary.filter({ source_url: payload.source_url });
      const existing = Array.isArray(found) ? found[0] : found?.items?.[0];

      if (existing) {
        await base44.entities.FormLibrary.update(existing.id, {
          ...payload,
          // never lose a copy that was already captured
          file_uri: payload.file_uri || existing.file_uri || '',
          captured_at: existing.captured_at || payload.last_seen_at,
        });
        updated++;
      } else {
        await base44.entities.FormLibrary.create({ ...payload, captured_at: payload.last_seen_at });
        created++;
      }
    } catch (e) {
      // continue with the remaining items
    }
  }

  return { created, updated };
}