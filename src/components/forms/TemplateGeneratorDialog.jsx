import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Wand2, FileJson, FileText, FileDown, Save, Link2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import TemplateReview from "@/components/forms/TemplateReview";

const STEPS = [
  "Searching official application materials...",
  "Extracting required prompts...",
  "Checking eligibility and requirements...",
  "Validating sources...",
];

export default function TemplateGeneratorDialog({ open, onOpenChange, grant, application, defaultLink }) {
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [funder, setFunder] = useState("");
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [exporting, setExporting] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const g = grant || {};
    setTemplate(null);
    setStep(0);
    setLoading(false);
    setLink(g.source_url || defaultLink || "");
    setTitle(g.title || "");
    setFunder(g.funder || "");

    const query = application?.id ? { application_id: application.id } : grant?.id ? { grant_id: grant.id } : null;
    if (query) {
      base44.entities.FormTemplate.filter(query, { sort: "-created_date", limit: 1 })
        .then(page => {
          const items = page?.items || page;
          if (items?.length) setTemplate(items[0]);
        })
        .catch(() => {});
    }
  }, [open]);

  const generate = async () => {
    const effectiveLink = link.trim() || grant?.source_url || "";
    if (!application && !grant && !effectiveLink) {
      toast.error("Add the application link first");
      return;
    }
    setLoading(true);
    setTemplate(null);
    setStep(0);
    const timer = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 4000);
    try {
      const res = await base44.functions.invoke("generateFormTemplate", {
        source_type: application ? "pipeline" : "donor",
        grant_id: grant?.id || application?.grant_id || "",
        application_id: application?.id || "",
        application_link: effectiveLink,
        program_name: title.trim(),
        funder: funder.trim(),
        grant_title: title.trim(),
      });
      if (res.data?.error) throw new Error(res.data.error);
      setTemplate(res.data.template);
      toast.success("Form template built");
    } catch (e) {
      toast.error("Couldn't build the template: " + e.message);
    }
    clearInterval(timer);
    setLoading(false);
  };

  const download = async (format) => {
    if (!template) return;
    setExporting(format);
    try {
      const res = await base44.functions.invoke("exportFormTemplate", { template_id: template.id, format });
      const payload = res.data || {};
      if (payload.error) throw new Error(payload.error);
      const bytes = Uint8Array.from(atob(payload.base64), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: payload.mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = payload.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Export failed: " + e.message);
    }
    setExporting(null);
  };

  const saveToPipeline = async () => {
    if (!template) return;
    setSaving(true);
    try {
      let appId = application?.id || template.application_id;
      if (!appId) {
        const existing = grant?.id ? await base44.entities.GrantApplication.filter({ grant_id: grant.id }) : [];
        if (existing.length) {
          appId = existing[0].id;
        } else {
          const created = await base44.entities.GrantApplication.create({
            grant_id: grant?.id || "",
            grant_title: template.grant_title || template.program_name || template.name,
            funder: template.funder || "Unknown funder",
            deadline: grant?.deadline || "",
            stage: "assessment",
          });
          appId = created.id;
        }
      }
      const updated = await base44.entities.FormTemplate.update(template.id, { status: "saved", application_id: appId });
      setTemplate(updated);
      toast.success("Saved to your applications");
    } catch (e) {
      toast.error("Couldn't save: " + e.message);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Wand2 className="w-5 h-5 text-emerald-600 shrink-0" /> Application Form Builder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs text-slate-500 font-medium">Application link</label>
              <Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://funder.org/apply" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Program / opportunity</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Program name" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Funder</label>
              <Input value={funder} onChange={e => setFunder(e.target.value)} placeholder="Funding organization" />
            </div>
          </div>

          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {loading ? "Researching and building..." : template ? "Rebuild Form Template" : "Build Form Template"}
          </Button>

          {loading && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
              {STEPS.map((s, i) => (
                <p key={s} className={`text-xs flex items-center gap-2 ${i <= step ? "text-slate-700" : "text-slate-400"}`}>
                  {i < step
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    : i === step
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500 shrink-0" />
                      : <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />}
                  {s}
                </p>
              ))}
            </div>
          )}

          {template && !loading && (
            <>
              <TemplateReview template={template} />

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <p className="text-xs font-semibold text-slate-600">Download</p>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => download("json")} disabled={!!exporting}>
                    {exporting === "json" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileJson className="w-3.5 h-3.5" />} JSON
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => download("pdf")} disabled={!!exporting}>
                    {exporting === "pdf" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />} PDF
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => download("docx")} disabled={!!exporting}>
                    {exporting === "docx" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />} DOCX
                  </Button>
                  {template.status !== "saved" && (
                    <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={saveToPipeline} disabled={saving}>
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save to Applications
                    </Button>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {application
                    ? "This template is linked to the application you opened."
                    : "Saving adds this program to your applications and links the template."}
                </p>
              </div>
            </>
          )}

          {!template && !loading && (
            <p className="text-xs text-slate-500 flex items-start gap-1.5">
              <Link2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
              We research the funder's official application materials, extract the required prompts, and check each one against the stated eligibility and requirements before you export.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}