import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { jsPDF } from 'npm:jspdf@4.0.0';
import { buildDocx } from './docx.ts';

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as unknown as number[]);
  }
  return btoa(binary);
}

function slug(text: string): string {
  return (text || 'application-form')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'application-form';
}

const STATUS_LABEL: Record<string, string> = {
  validated: 'Validated',
  unverified: 'Unverified',
  conflict: 'Conflict',
  missing: 'Missing',
};

const ACCESS_LABEL: Record<string, string> = {
  public: 'publicly available',
  signin_required: 'sign-in required',
  unknown: 'access unconfirmed',
};

const PROVENANCE_LABEL: Record<string, string> = {
  grant_specific: 'Grant-specific',
  standard: 'Standard guidance',
};

function buildPdf(template: any): Uint8Array {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const M = 48;
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  let y = M;

  const write = (text: string, opts: { size?: number; bold?: boolean; gap?: number; indent?: number } = {}) => {
    const size = opts.size ?? 10;
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(30, 41, 59);
    const indent = opts.indent ?? 0;
    const lines = doc.splitTextToSize(String(text || ''), W - M * 2 - indent);
    for (const ln of lines) {
      if (y + size + 2 > H - M) { doc.addPage(); y = M; }
      doc.text(ln, M + indent, y);
      y += size + 2;
    }
    y += opts.gap ?? 4;
  };

  write(template.name || 'Application Form Template', { size: 18, bold: true, gap: 2 });
  write(`${template.funder || ''}${template.program_name ? ' — ' + template.program_name : ''}`, { size: 11, gap: 2 });
  if (template.application_link) write(template.application_link, { size: 9, gap: 10 });

  const vs = template.validation_summary || {};
  write(`Validation: ${vs.validated || 0} validated · ${vs.unverified || 0} unverified · ${vs.conflicts || 0} conflicts · ${vs.missing || 0} missing`, { size: 10, bold: true, gap: 2 });
  if (!template.official_documentation_found) {
    write('No official application documentation was located — every prompt below should be treated as unverified.', { size: 9, gap: 10 });
  } else {
    y += 8;
  }

  if (template.eligibility_summary) {
    write('Eligibility', { size: 13, bold: true, gap: 2 });
    write(template.eligibility_summary, { gap: 10 });
  }

  if (template.requirements?.length) {
    write('Submission Requirements', { size: 13, bold: true, gap: 2 });
    template.requirements.forEach((r: string) => write(`• ${r}`, { indent: 12, gap: 2 }));
    y += 8;
  }

  if (template.supplemental_links?.length) {
    write('Official Sources', { size: 13, bold: true, gap: 2 });
    template.supplemental_links.forEach((l: any) => {
      write(`• ${l.label || l.kind || 'Source'} — ${ACCESS_LABEL[l.access] || 'access unconfirmed'}`, { indent: 12, gap: 2 });
      if (l.url) write(l.url, { size: 9, indent: 24, gap: 2 });
      if (l.note) write(l.note, { size: 9, indent: 24, gap: 2 });
    });
    y += 8;
  }

  if (template.documents?.length) {
    write('Captured Forms & Documents', { size: 13, bold: true, gap: 2 });
    template.documents.forEach((d: any) => {
      write(`• ${d.title} — ${ACCESS_LABEL[d.access] || 'access unconfirmed'}${d.file_uri ? ' · copy stored' : ''}`, { indent: 12, gap: 2 });
      if (d.url) write(d.url, { size: 9, indent: 24, gap: 2 });
      if (d.extracted_fields?.length) write(`Fields: ${d.extracted_fields.join(', ')}`, { size: 9, indent: 24, gap: 2 });
      if (d.note) write(d.note, { size: 9, indent: 24, gap: 2 });
    });
    y += 8;
  }

  if (template.access_notes) {
    write('Behind the Registration Wall', { size: 13, bold: true, gap: 2 });
    write(template.access_notes, { size: 10, gap: 10 });
  }

  const prompts = template.prompts || [];
  write(`Application Prompts (${prompts.length})`, { size: 13, bold: true, gap: 6 });
  prompts.forEach((p: any, i: number) => {
    write(`${i + 1}. ${p.section || 'Other'}`, { size: 11, bold: true, gap: 2 });
    write(p.prompt || '', { gap: 2 });
    const meta = [`Status: ${STATUS_LABEL[p.validation_status] || 'Unverified'}`, PROVENANCE_LABEL[p.provenance] || PROVENANCE_LABEL.grant_specific];
    if (p.word_limit) meta.push(`Limit: ${p.word_limit}`);
    write(meta.join('  ·  '), { size: 9, gap: 2 });
    if (p.requirement_link) write(`Meets: ${p.requirement_link}`, { size: 9, indent: 12, gap: 2 });
    if (p.validation_note) write(p.validation_note, { size: 9, indent: 12, gap: 2 });
    if (p.evidence_excerpt) write(`Evidence: "${p.evidence_excerpt}"`, { size: 9, indent: 12, gap: 2 });
    if (p.evidence_source) write(p.evidence_source, { size: 8, indent: 12, gap: 10 });
    else y += 8;
  });

  if (template.gaps?.length) {
    write('Not Verified / Gaps', { size: 13, bold: true, gap: 2 });
    template.gaps.forEach((g: string) => write(`• ${g}`, { indent: 12, gap: 2 }));
    y += 8;
  }

  if (template.sources?.length) {
    write('Sources', { size: 13, bold: true, gap: 2 });
    template.sources.forEach((s: any) => write(`• ${s.title || s.url}${s.url ? ' — ' + s.url : ''}`, { size: 9, indent: 12, gap: 2 }));
  }

  return new Uint8Array(doc.output('arraybuffer') as ArrayBuffer);
}

function buildDocxBlocks(template: any) {
  const blocks: any[] = [];
  blocks.push({ text: template.name || 'Application Form Template', bold: true, size: 36 });
  blocks.push({ text: `${template.funder || ''}${template.program_name ? ' — ' + template.program_name : ''}`, size: 22 });
  if (template.application_link) blocks.push({ text: template.application_link, size: 18 });
  blocks.push({});

  const vs = template.validation_summary || {};
  blocks.push({ text: `Validation: ${vs.validated || 0} validated · ${vs.unverified || 0} unverified · ${vs.conflicts || 0} conflicts · ${vs.missing || 0} missing`, bold: true });
  if (!template.official_documentation_found) {
    blocks.push({ text: 'No official application documentation was located — treat every prompt below as unverified.' });
  }
  blocks.push({});

  if (template.eligibility_summary) {
    blocks.push({ text: 'Eligibility', bold: true, size: 26 });
    blocks.push({ text: template.eligibility_summary });
    blocks.push({});
  }

  if (template.requirements?.length) {
    blocks.push({ text: 'Submission Requirements', bold: true, size: 26 });
    template.requirements.forEach((r: string) => blocks.push({ text: `• ${r}` }));
    blocks.push({});
  }

  if (template.supplemental_links?.length) {
    blocks.push({ text: 'Official Sources', bold: true, size: 26 });
    template.supplemental_links.forEach((l: any) => {
      blocks.push({ text: `• ${l.label || l.kind || 'Source'} — ${ACCESS_LABEL[l.access] || 'access unconfirmed'}`, size: 20 });
      if (l.url) blocks.push({ text: l.url, size: 18 });
      if (l.note) blocks.push({ text: l.note, size: 18 });
    });
    blocks.push({});
  }

  if (template.documents?.length) {
    blocks.push({ text: 'Captured Forms & Documents', bold: true, size: 26 });
    template.documents.forEach((d: any) => {
      blocks.push({ text: `• ${d.title} — ${ACCESS_LABEL[d.access] || 'access unconfirmed'}${d.file_uri ? ' · copy stored' : ''}`, size: 20 });
      if (d.url) blocks.push({ text: d.url, size: 18 });
      if (d.extracted_fields?.length) blocks.push({ text: `Fields: ${d.extracted_fields.join(', ')}`, size: 18 });
      if (d.note) blocks.push({ text: d.note, size: 18 });
    });
    blocks.push({});
  }

  if (template.access_notes) {
    blocks.push({ text: 'Behind the Registration Wall', bold: true, size: 26 });
    blocks.push({ text: template.access_notes });
    blocks.push({});
  }

  const prompts = template.prompts || [];
  blocks.push({ text: `Application Prompts (${prompts.length})`, bold: true, size: 26 });
  prompts.forEach((p: any, i: number) => {
    blocks.push({ text: `${i + 1}. ${p.section || 'Other'}`, bold: true, size: 22 });
    blocks.push({ text: p.prompt || '' });
    const meta = [`Status: ${STATUS_LABEL[p.validation_status] || 'Unverified'}`, PROVENANCE_LABEL[p.provenance] || PROVENANCE_LABEL.grant_specific];
    if (p.word_limit) meta.push(`Limit: ${p.word_limit}`);
    blocks.push({ text: meta.join('  ·  '), size: 18 });
    if (p.requirement_link) blocks.push({ text: `Meets: ${p.requirement_link}`, size: 18 });
    if (p.validation_note) blocks.push({ text: p.validation_note, size: 18 });
    if (p.evidence_excerpt) blocks.push({ text: `Evidence: "${p.evidence_excerpt}"`, size: 18 });
    if (p.evidence_source) blocks.push({ text: p.evidence_source, size: 16 });
    blocks.push({});
  });

  if (template.gaps?.length) {
    blocks.push({ text: 'Not Verified / Gaps', bold: true, size: 26 });
    template.gaps.forEach((g: string) => blocks.push({ text: `• ${g}` }));
    blocks.push({});
  }

  if (template.sources?.length) {
    blocks.push({ text: 'Sources', bold: true, size: 26 });
    template.sources.forEach((s: any) => blocks.push({ text: `• ${s.title || s.url}${s.url ? ' — ' + s.url : ''}`, size: 18 }));
  }

  return blocks;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { template_id = '', format = 'json' } = body || {};
    if (!template_id) return Response.json({ error: 'template_id is required' }, { status: 400 });

    const template = await base44.entities.FormTemplate.get(template_id);
    if (!template) return Response.json({ error: 'Template not found' }, { status: 404 });

    const base = slug(template.name);

    if (format === 'pdf') {
      const bytes = buildPdf(template);
      return Response.json({ filename: `${base}.pdf`, mime: 'application/pdf', base64: toBase64(bytes) });
    }

    if (format === 'docx') {
      const bytes = buildDocx(buildDocxBlocks(template));
      return Response.json({
        filename: `${base}.docx`,
        mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        base64: toBase64(bytes),
      });
    }

    const json = JSON.stringify(template, null, 2);
    return Response.json({ filename: `${base}.json`, mime: 'application/json', base64: toBase64(new TextEncoder().encode(json)) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}