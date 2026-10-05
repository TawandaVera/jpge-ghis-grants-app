import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ExternalLink, Globe, HelpCircle, Lock, ListChecks, Paperclip, ShieldAlert } from "lucide-react";
import PromptCard, { PROVENANCE } from "@/components/forms/PromptCard";

const CHIPS = [
  { key: "validated", label: "validated", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { key: "unverified", label: "unverified", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  { key: "conflicts", label: "conflicts", cls: "bg-red-100 text-red-800 border-red-300" },
  { key: "missing", label: "missing", cls: "bg-slate-100 text-slate-600 border-slate-300" },
];

const ACCESS = {
  public: { label: "Public", cls: "bg-emerald-100 text-emerald-800 border-emerald-300", Icon: Globe },
  signin_required: { label: "Sign-in required", cls: "bg-amber-100 text-amber-800 border-amber-300", Icon: Lock },
  unknown: { label: "Access unconfirmed", cls: "bg-slate-100 text-slate-600 border-slate-300", Icon: HelpCircle },
};

const KIND_LABEL = {
  application_form: "Application form",
  budget_template: "Budget template",
  guidelines: "Guidelines",
  checklist: "Checklist",
  portal: "Portal",
  documentation: "Documentation / tutorial",
  requirements: "Requirements",
  document: "Document",
  page: "Page",
  other: "Other",
};

function AccessBadge({ access }) {
  const a = ACCESS[access] || ACCESS.unknown;
  const Icon = a.Icon;
  return (
    <Badge className={`text-xs border gap-1 ${a.cls}`}>
      <Icon className="w-3 h-3" /> {a.label}
    </Badge>
  );
}

export default function TemplateReview({ template }) {
  const vs = template.validation_summary || {};
  const prompts = template.prompts || [];
  const links = template.supplemental_links || [];
  const documents = template.documents || [];

  const provCounts = { grant_specific: 0, documented: 0, standard: 0 };
  for (const p of prompts) {
    if (provCounts[p.provenance] !== undefined) provCounts[p.provenance]++;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{template.name}</p>
          <p className="text-xs text-slate-500">
            {template.funder}
            {template.program_name && template.program_name !== template.funder ? ` · ${template.program_name}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {template.source_type === "standard" && (
            <Badge className="text-xs border bg-indigo-100 text-indigo-800 border-indigo-300">Platform standard template</Badge>
          )}
          {template.source_type !== "standard" && template.status === "saved" && (
            <Badge className="text-xs border bg-blue-100 text-blue-800 border-blue-300">Saved to pipeline</Badge>
          )}
          {template.standard_template_id && (
            <Badge className="text-xs border bg-slate-100 text-slate-600 border-slate-300">Tailored from standard</Badge>
          )}
          {!template.official_documentation_found && (
            <Badge className="text-xs border bg-amber-100 text-amber-800 border-amber-300 gap-1">
              <AlertTriangle className="w-3 h-3" /> No official docs found
            </Badge>
          )}
        </div>
      </div>

      {links.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">Official Sources ({links.length})</p>
          <ul className="space-y-2">
            {links.map((l, i) => (
              <li key={i} className="border border-slate-200 rounded-lg p-2.5 space-y-1 bg-white">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-medium text-slate-700">
                    {l.label || KIND_LABEL[l.kind] || "Source"}
                  </span>
                  <AccessBadge access={l.access} />
                </div>
                {l.url && (
                  <a href={l.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 break-all">
                    <ExternalLink className="w-3 h-3 shrink-0" /> {l.url}
                  </a>
                )}
                {l.note && <p className="text-xs text-slate-500">{l.note}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {CHIPS.map(c => (
          <Badge key={c.key} className={`text-xs border ${c.cls}`}>
            {vs[c.key] || 0} {c.label}
          </Badge>
        ))}
      </div>

      {prompts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {["grant_specific", "documented", "standard"].map(key => (
            <Badge key={key} className={`text-xs border ${PROVENANCE[key].cls}`}>
              {provCounts[key]} {PROVENANCE[key].summary}
            </Badge>
          ))}
        </div>
      )}

      {template.eligibility_summary && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Eligibility</p>
          <p className="text-sm text-slate-700">{template.eligibility_summary}</p>
        </div>
      )}

      {template.requirements?.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <ListChecks className="w-4 h-4 text-emerald-600" /> Submission Requirements
          </p>
          <ul className="space-y-1">
            {template.requirements.map((r, i) => (
              <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span> {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {documents.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Paperclip className="w-4 h-4 text-emerald-600" /> Captured Forms &amp; Documents ({documents.length})
          </p>
          <ul className="space-y-2">
            {documents.map((d, i) => (
              <li key={i} className="border border-slate-200 rounded-lg p-2.5 space-y-1 bg-white">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-medium text-slate-700">{d.title}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge className="text-xs border bg-slate-100 text-slate-600 border-slate-300">{KIND_LABEL[d.kind] || "Other"}</Badge>
                    <AccessBadge access={d.access} />
                  </div>
                </div>
                {d.url && (
                  <a href={d.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 break-all">
                    <ExternalLink className="w-3 h-3 shrink-0" /> {d.url}
                  </a>
                )}
                {d.extracted_fields?.length > 0 && (
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">Fields:</span> {d.extracted_fields.join(", ")}
                  </p>
                )}
                {d.file_uri && <p className="text-xs text-emerald-700">Copy stored in your form library</p>}
                {d.note && <p className="text-xs text-slate-500">{d.note}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {template.access_notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
            <Lock className="w-4 h-4" /> Behind the Registration Wall
          </p>
          <p className="text-sm text-amber-700">{template.access_notes}</p>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">Application Prompts ({prompts.length})</p>
        <div className="space-y-2">
          {prompts.map((p, i) => (
            <PromptCard key={i} prompt={p} />
          ))}
          {prompts.length === 0 && <p className="text-sm text-slate-400">No prompts were generated.</p>}
        </div>
      </div>

      {template.gaps?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" /> Couldn't Verify
          </p>
          <ul className="space-y-1">
            {template.gaps.map((g, i) => (
              <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                <span className="mt-0.5">•</span> {g}
              </li>
            ))}
          </ul>
        </div>
      )}

      {template.sources?.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">Sources</p>
          <ul className="space-y-1">
            {template.sources.map((s, i) => (
              <li key={i} className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">
                    {s.title || s.url}
                  </a>
                ) : (
                  s.title
                )}
                {s.access && s.access !== "unknown" && (
                  <span className="text-slate-400">· {ACCESS[s.access]?.label}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}