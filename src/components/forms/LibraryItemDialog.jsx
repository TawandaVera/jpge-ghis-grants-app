import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Loader2, Lock, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { ACCESS, KIND_LABEL } from "@/components/forms/LibraryItemCard";

const dateLabel = (value) => (value ? new Date(value).toLocaleDateString() : "");

export default function LibraryItemDialog({ item, onOpenChange }) {
  const [opening, setOpening] = useState(false);

  if (!item) return null;
  const a = ACCESS[item.access] || ACCESS.unknown;
  const Icon = a.Icon;

  const openCopy = async () => {
    setOpening(true);
    try {
      const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: item.file_uri, expires_in: 600 });
      const url = res?.signed_url || res?.data?.signed_url;
      if (url) window.open(url, "_blank");
      else throw new Error("No link returned");
    } catch (e) {
      toast.error("Couldn't open the stored copy");
    }
    setOpening(false);
  };

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base pr-6">{item.form_title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            <Badge className={`text-xs border gap-1 ${a.cls}`}>
              <Icon className="w-3 h-3" /> {a.label}
            </Badge>
            <Badge className="text-xs border bg-slate-100 text-slate-600 border-slate-300">{KIND_LABEL[item.kind] || "Other"}</Badge>
            {item.doc_type && (
              <Badge className="text-xs border bg-slate-100 text-slate-600 border-slate-300">{item.doc_type.toUpperCase()}</Badge>
            )}
          </div>

          <div className="text-sm text-slate-600 space-y-0.5">
            {item.funder && <p><span className="text-slate-400">Funder:</span> {item.funder}</p>}
            {item.program_name && <p><span className="text-slate-400">Program:</span> {item.program_name}</p>}
            {item.grant_title && <p><span className="text-slate-400">Found while researching:</span> {item.grant_title}</p>}
            {item.last_seen_at && <p><span className="text-slate-400">Last confirmed:</span> {dateLabel(item.last_seen_at)}</p>}
          </div>

          {item.source_url && (
            <a href={item.source_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 break-all">
              <ExternalLink className="w-3 h-3 shrink-0" /> {item.source_url}
            </a>
          )}

          {item.file_uri && (
            <Button variant="outline" size="sm" className="gap-2" onClick={openCopy} disabled={opening}>
              {opening ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
              Open the stored copy
            </Button>
          )}

          {item.access === "signin_required" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> Behind a sign-in wall
              </p>
              <p className="text-sm text-amber-700">
                This source needs an account, so its contents were not read. The link is kept so you can open it yourself once registered.
              </p>
            </div>
          )}

          {item.fields?.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1.5">Fields the form asks for</p>
              <div className="flex flex-wrap gap-1.5">
                {item.fields.map((f, i) => (
                  <span key={i} className="text-xs bg-slate-100 text-slate-700 rounded-md px-2 py-0.5 border border-slate-200">{f}</span>
                ))}
              </div>
            </div>
          )}

          {item.requirements?.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1.5">Requirements</p>
              <ul className="space-y-1">
                {item.requirements.map((r, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {item.prompts?.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1.5">Prompts captured ({item.prompts.length})</p>
              <div className="space-y-1.5">
                {item.prompts.map((p, i) => (
                  <div key={i} className="border border-slate-200 rounded-lg p-2.5 bg-white">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{p.section || "Other"}</p>
                    <p className="text-sm text-slate-700">{p.prompt}</p>
                    {p.word_limit && <p className="text-xs text-slate-400 mt-0.5">{p.word_limit}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}