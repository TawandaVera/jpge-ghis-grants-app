import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Filter, Loader2, Minus } from "lucide-react";
import { toast } from "sonner";
import TemplateReview from "@/components/forms/TemplateReview";
import TemplateExportBar from "@/components/forms/TemplateExportBar";

const splitLines = (text) => String(text || "").split("\n").map(s => s.trim()).filter(Boolean);

export default function TailorFromMasterDialog({ open, onOpenChange, grant: presetGrant, application }) {
  const [grants, setGrants] = useState([]);
  const [grantId, setGrantId] = useState("");
  const [title, setTitle] = useState("");
  const [funder, setFunder] = useState("");
  const [requirements, setRequirements] = useState("");
  const [questions, setQuestions] = useState("");
  const [template, setTemplate] = useState(null);
  const [sections, setSections] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTemplate(null);
    setSections(null);
    setLoading(false);
    setGrantId(presetGrant?.id || application?.grant_id || "");
    setTitle(presetGrant?.title || "");
    setFunder(presetGrant?.funder || "");
    setRequirements((presetGrant?.requirements || []).join("\n"));
    setQuestions((presetGrant?.application_form_questions || []).join("\n"));

    base44.entities.Grant.filter({}, {
      sort: "-created_date",
      limit: 60,
      fields: ["title", "funder", "deadline", "requirements", "application_form_questions", "eligibility"],
    })
      .then(page => setGrants(page?.items || []))
      .catch(() => setGrants([]));
  }, [open]);

  const pickGrant = (id) => {
    setGrantId(id);
    const g = grants.find(x => x.id === id);
    if (!g) return;
    setTitle(g.title || "");
    setFunder(g.funder || "");
    setRequirements((g.requirements || []).join("\n"));
    setQuestions((g.application_form_questions || []).join("\n"));
  };

  const filter = async () => {
    if (!grantId && !requirements.trim() && !questions.trim()) {
      toast.error("Choose an opportunity or paste its requirements first");
      return;
    }
    setLoading(true);
    setTemplate(null);
    setSections(null);
    try {
      const res = await base44.functions.invoke("tailorFromMaster", {
        grant_id: grantId,
        application_id: application?.id || "",
        grant_title: title.trim(),
        funder: funder.trim(),
        requirements: splitLines(requirements),
        form_questions: splitLines(questions),
      });
      if (res.data?.error) throw new Error(res.data.error);
      setTemplate(res.data.template);
      setSections({
        included: res.data.included || [],
        excluded: res.data.excluded || [],
      });
      const kept = (res.data.included || []).length;
      const dropped = (res.data.excluded || []).length;
      toast.success(`${kept} section${kept === 1 ? "" : "s"} kept, ${dropped} left out`);
    } catch (e) {
      toast.error("Couldn't tailor the draft: " + e.message);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Filter className="w-5 h-5 text-emerald-600 shrink-0" /> Draft from the Master Application
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            The sections this opportunity calls for are kept; the rest are left out. Your master application itself is never changed.
          </p>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs text-slate-500 font-medium">Opportunity in your library</label>
              <Select value={grantId || "none"} onValueChange={v => (v === "none" ? setGrantId("") : pickGrant(v))}>
                <SelectTrigger><SelectValue placeholder="Choose a grant" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not in my library — I'll enter it below</SelectItem>
                  {grants.map(g => <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Opportunity</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Program or grant name" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Funder</label>
              <Input value={funder} onChange={e => setFunder(e.target.value)} placeholder="Funder" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 font-medium">Stated requirements (one per line)</label>
              <Textarea
                value={requirements}
                onChange={e => setRequirements(e.target.value)}
                rows={5}
                placeholder={"Letters of support required\nBudget spreadsheet required\n501(c)(3) determination letter"}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Application questions (one per line)</label>
              <Textarea
                value={questions}
                onChange={e => setQuestions(e.target.value)}
                rows={5}
                placeholder={"Describe the community need\nExplain your evaluation approach"}
              />
            </div>
          </div>

          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={filter} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
            {loading ? "Filtering sections..." : template ? "Filter again" : "Filter sections for this opportunity"}
          </Button>

          {sections && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" /> Sections included ({sections.included.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sections.included.map(s => (
                    <Badge key={s.section_key} className="text-xs border bg-emerald-100 text-emerald-800 border-emerald-300">
                      {s.section} · {s.reason}
                    </Badge>
                  ))}
                </div>
              </div>

              {sections.excluded.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Minus className="w-4 h-4 text-slate-400" /> Left out for this application ({sections.excluded.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {sections.excluded.map(s => (
                      <Badge key={s.section_key} className="text-xs border bg-slate-100 text-slate-500 border-slate-300">
                        {s.section} · {s.reason}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Still in your master application, so nothing is lost. Add the opportunity's wording above and filter again to bring a section back.
                  </p>
                </div>
              )}
            </div>
          )}

          {template && !loading && (
            <>
              <TemplateReview template={template} />
              <TemplateExportBar
                template={template}
                onTemplateChange={setTemplate}
                application={application}
                grant={presetGrant}
                note="Only the included sections are in this draft. Your master application keeps every section."
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}