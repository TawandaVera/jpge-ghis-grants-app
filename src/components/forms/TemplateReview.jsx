import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ExternalLink, ListChecks, ShieldAlert } from "lucide-react";
import PromptCard from "@/components/forms/PromptCard";

const CHIPS = [
  { key: "validated", label: "validated", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { key: "unverified", label: "unverified", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  { key: "conflicts", label: "conflicts", cls: "bg-red-100 text-red-800 border-red-300" },
  { key: "missing", label: "missing", cls: "bg-slate-100 text-slate-600 border-slate-300" },
];

export default function TemplateReview({ template }) {
  const vs = template.validation_summary || {};
  const prompts = template.prompts || [];

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
          {template.status === "saved" && (
            <Badge className="text-xs border bg-blue-100 text-blue-800 border-blue-300">Saved to pipeline</Badge>
          )}
          {!template.official_documentation_found && (
            <Badge className="text-xs border bg-amber-100 text-amber-800 border-amber-300 gap-1">
              <AlertTriangle className="w-3 h-3" /> No official docs found
            </Badge>
          )}
        </div>
      </div>

      {template.application_link && (
        <a
          href={template.application_link}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue-600 hover:underline flex items-center gap-1 break-all"
        >
          <ExternalLink className="w-3 h-3 shrink-0" /> {template.application_link}
        </a>
      )}

      <div className="flex flex-wrap gap-2">
        {CHIPS.map(c => (
          <Badge key={c.key} className={`text-xs border ${c.cls}`}>
            {vs[c.key] || 0} {c.label}
          </Badge>
        ))}
      </div>

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
              <li key={i} className="text-xs text-slate-500">
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">
                    {s.title || s.url}
                  </a>
                ) : (
                  s.title
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}