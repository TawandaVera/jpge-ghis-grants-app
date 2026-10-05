import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, FileJson, FileText, FileDown, Save } from "lucide-react";
import { toast } from "sonner";

export default function TemplateExportBar({ template, onTemplateChange, application, grant, note }) {
  const [exporting, setExporting] = useState(null);
  const [saving, setSaving] = useState(false);

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
            grant_id: grant?.id || template.grant_id || "",
            grant_title: template.grant_title || template.program_name || template.name,
            funder: template.funder || "Unknown funder",
            deadline: grant?.deadline || "",
            stage: "assessment",
          });
          appId = created.id;
        }
      }
      const updated = await base44.entities.FormTemplate.update(template.id, { status: "saved", application_id: appId });
      onTemplateChange?.(updated);
      toast.success("Saved to your applications");
    } catch (e) {
      toast.error("Couldn't save: " + e.message);
    }
    setSaving(false);
  };

  return (
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
        {note || (application
          ? "This template is linked to the application you opened."
          : "Saving adds this program to your applications and links the template.")}
      </p>
    </div>
  );
}