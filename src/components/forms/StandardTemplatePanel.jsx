import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Layers, RefreshCw, Eye } from "lucide-react";
import TemplateReview from "@/components/forms/TemplateReview";

export default function StandardTemplatePanel({ template, onBuild, building }) {
  const [viewing, setViewing] = useState(false);
  const promptCount = (template?.prompts || []).length;

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-slate-900">Platform Standard Template</p>
              {template ? (
                <p className="text-xs text-slate-500">
                  {template.name} · {promptCount} prompts · built {template.generated_at ? new Date(template.generated_at).toLocaleDateString() : "recently"}
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Not built yet. Every grant template is tailored from this base, so standard guidance fills the sections a funder leaves open.
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            {template && (
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setViewing(true)}>
                <Eye className="w-3.5 h-3.5" /> View
              </Button>
            )}
            <Button
              size="sm"
              variant={template ? "outline" : "default"}
              className={template ? "gap-2" : "gap-2 bg-emerald-600 hover:bg-emerald-700"}
              onClick={onBuild}
              disabled={building}
            >
              {building ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {template ? "Rebuild from library" : "Build standard template"}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={viewing} onOpenChange={setViewing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Platform Standard Template</DialogTitle>
          </DialogHeader>
          {template && <TemplateReview template={template} />}
        </DialogContent>
      </Dialog>
    </>
  );
}