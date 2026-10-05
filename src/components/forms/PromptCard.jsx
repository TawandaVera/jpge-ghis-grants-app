import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, HelpCircle, XCircle, ExternalLink, Quote } from "lucide-react";

const STATUS = {
  validated: { label: "Validated", cls: "bg-emerald-100 text-emerald-800 border-emerald-300", Icon: CheckCircle2 },
  unverified: { label: "Unverified", cls: "bg-amber-100 text-amber-800 border-amber-300", Icon: HelpCircle },
  conflict: { label: "Conflict", cls: "bg-red-100 text-red-800 border-red-300", Icon: AlertTriangle },
  missing: { label: "Missing", cls: "bg-slate-100 text-slate-600 border-slate-300", Icon: XCircle },
};

export const PROVENANCE = {
  grant_specific: { label: "Grant-specific", summary: "from funder's materials", cls: "bg-blue-100 text-blue-800 border-blue-300" },
  documented: { label: "Portal documentation", summary: "from portal documentation", cls: "bg-teal-100 text-teal-800 border-teal-300" },
  standard: { label: "Standard guidance", summary: "standard guidance", cls: "bg-indigo-100 text-indigo-800 border-indigo-300" },
};

export default function PromptCard({ prompt }) {
  const s = STATUS[prompt.validation_status] || STATUS.unverified;
  const Icon = s.Icon;
  const prov = PROVENANCE[prompt.provenance];

  return (
    <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-white">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{prompt.section}</span>
        <div className="flex items-center gap-2">
          {prov && <Badge className={`text-xs border ${prov.cls}`}>{prov.label}</Badge>}
          {prompt.word_limit && <span className="text-xs text-slate-500">{prompt.word_limit}</span>}
          <Badge className={`text-xs border gap-1 ${s.cls}`}>
            <Icon className="w-3 h-3" /> {s.label}
          </Badge>
        </div>
      </div>

      <p className="text-sm text-slate-800">{prompt.prompt}</p>

      {prompt.requirement_link && (
        <p className="text-xs text-blue-700">
          <span className="font-medium">Meets:</span> {prompt.requirement_link}
        </p>
      )}

      {prompt.validation_note && <p className="text-xs text-slate-500">{prompt.validation_note}</p>}

      {prompt.evidence_excerpt && (
        <div className="bg-slate-50 border border-slate-200 rounded p-2">
          <p className="text-xs text-slate-500 flex items-start gap-1">
            <Quote className="w-3 h-3 mt-0.5 shrink-0" /> {prompt.evidence_excerpt}
          </p>
          {prompt.evidence_source && (
            <a
              href={prompt.evidence_source}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1 break-all"
            >
              <ExternalLink className="w-3 h-3 shrink-0" /> {prompt.evidence_source}
            </a>
          )}
        </div>
      )}
    </div>
  );
}