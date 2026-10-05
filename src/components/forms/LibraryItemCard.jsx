import { Badge } from "@/components/ui/badge";
import { Globe, HelpCircle, Lock } from "lucide-react";

export const KIND_LABEL = {
  application_form: "Application form",
  budget_template: "Budget template",
  guidelines: "Guidelines",
  checklist: "Checklist",
  portal: "Portal",
  documentation: "Documentation",
  requirements: "Requirements",
  document: "Document",
  page: "Page",
  other: "Other",
};

export const ACCESS = {
  public: { label: "Public", cls: "bg-emerald-100 text-emerald-800 border-emerald-300", Icon: Globe },
  signin_required: { label: "Sign-in required", cls: "bg-amber-100 text-amber-800 border-amber-300", Icon: Lock },
  unknown: { label: "Access unconfirmed", cls: "bg-slate-100 text-slate-600 border-slate-300", Icon: HelpCircle },
};

export default function LibraryItemCard({ item, onOpen }) {
  const a = ACCESS[item.access] || ACCESS.unknown;
  const Icon = a.Icon;

  return (
    <button
      onClick={onOpen}
      className="text-left w-full bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all space-y-2"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm text-slate-900 line-clamp-2 flex-1">{item.form_title}</p>
        <Badge className={`text-xs border gap-1 shrink-0 ${a.cls}`}>
          <Icon className="w-3 h-3" /> {a.label}
        </Badge>
      </div>

      <p className="text-xs text-slate-500 truncate">{item.funder || item.program_name || "Unknown source"}</p>

      <div className="flex flex-wrap gap-1.5">
        <Badge className="text-xs border bg-slate-100 text-slate-600 border-slate-300">{KIND_LABEL[item.kind] || "Other"}</Badge>
        {item.doc_type && item.doc_type !== "webpage" && (
          <Badge className="text-xs border bg-slate-100 text-slate-600 border-slate-300">{item.doc_type.toUpperCase()}</Badge>
        )}
        {item.file_uri && (
          <Badge className="text-xs border bg-emerald-100 text-emerald-800 border-emerald-300">Copy stored</Badge>
        )}
      </div>

      <p className="text-xs text-slate-400">
        {(item.fields || []).length} fields · {(item.prompts || []).length} prompts
      </p>
    </button>
  );
}