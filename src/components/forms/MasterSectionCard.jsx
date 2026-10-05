import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink, Globe, HelpCircle, Lock, ListChecks, Paperclip } from "lucide-react";
import PromptCard from "@/components/forms/PromptCard";

const ACCESS = {
  public: { label: "Public", cls: "bg-emerald-100 text-emerald-800 border-emerald-300", Icon: Globe },
  signin_required: { label: "Sign-in required", cls: "bg-amber-100 text-amber-800 border-amber-300", Icon: Lock },
  unknown: { label: "Access unconfirmed", cls: "bg-slate-100 text-slate-600 border-slate-300", Icon: HelpCircle },
};

export default function MasterSectionCard({ section }) {
  const [showAll, setShowAll] = useState(false);
  const prompts = section.prompts || [];
  const visible = showAll ? prompts : prompts.slice(0, 2);
  const requirements = section.requirements || [];
  const fields = section.fields || [];
  const sources = section.sources || [];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{section.section}</p>
          {section.description && <p className="text-xs text-slate-500">{section.description}</p>}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          <Badge className="text-xs border bg-slate-100 text-slate-600 border-slate-300">
            {section.prompt_count || prompts.length} prompts
          </Badge>
          <Badge className="text-xs border bg-slate-100 text-slate-600 border-slate-300">
            {section.source_count || 0} sources
          </Badge>
          {section.conflict_count > 0 && (
            <Badge className="text-xs border bg-red-100 text-red-800 border-red-300 gap-1">
              <AlertTriangle className="w-3 h-3" /> {section.conflict_count} conflicts
            </Badge>
          )}
        </div>
      </div>

      {prompts.length === 0 ? (
        <p className="text-sm text-slate-400">
          No prompts captured for this section yet. Integrate new forms and they will collect here.
        </p>
      ) : (
        <div className="space-y-2">
          {visible.map((p, i) => <PromptCard key={p.prompt_key || i} prompt={p} />)}
          {prompts.length > 2 && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setShowAll(v => !v)}>
              {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showAll ? "Show fewer" : `Show all ${prompts.length} prompts`}
            </Button>
          )}
        </div>
      )}

      {requirements.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
            <ListChecks className="w-3.5 h-3.5 text-emerald-600" /> Requirements learned here
          </p>
          <ul className="space-y-1">
            {requirements.map((r, i) => (
              <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span> {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {fields.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5 text-emerald-600" /> Fields and line items
          </p>
          <div className="flex flex-wrap gap-1.5">
            {fields.map((f, i) => (
              <span key={i} className="text-xs bg-slate-100 text-slate-700 rounded-md px-2 py-0.5 border border-slate-200">{f}</span>
            ))}
          </div>
        </div>
      )}

      {sources.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Sources behind this section</p>
          <ul className="space-y-1">
            {sources.slice(0, 8).map((s, i) => {
              const a = ACCESS[s.access] || ACCESS.unknown;
              const Icon = a.Icon;
              return (
                <li key={i} className="text-xs flex items-center gap-1.5 flex-wrap">
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all flex items-center gap-1">
                      <ExternalLink className="w-3 h-3 shrink-0" /> {s.title || s.url}
                    </a>
                  ) : (
                    <span className="text-slate-600">{s.title}</span>
                  )}
                  <Badge className={`text-[10px] border gap-1 ${a.cls}`}>
                    <Icon className="w-2.5 h-2.5" /> {a.label}
                  </Badge>
                </li>
              );
            })}
            {sources.length > 8 && <li className="text-xs text-slate-400">+{sources.length - 8} more sources</li>}
          </ul>
        </div>
      )}
    </div>
  );
}