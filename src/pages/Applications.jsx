import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Wand2, Loader2, CheckCircle, AlertTriangle, ChevronRight, Save } from "lucide-react";
import { toast } from "sonner";

const SECTIONS = [
  { key: "executive_summary", label: "Executive Summary" },
  { key: "needs_statement", label: "Needs Statement" },
  { key: "goals_objectives", label: "Goals & Objectives" },
  { key: "methodology", label: "Methodology" },
  { key: "evaluation_plan", label: "Evaluation Plan" },
  { key: "organizational_capacity", label: "Org Capacity" },
  { key: "budget_narrative", label: "Budget Narrative" },
];

const STAGE_LABELS = {
  discovery: "Discovery", assessment: "Assessment", matching: "Matching",
  writing: "Writing", compliance_check: "Compliance", budget: "Budget",
  review: "Review", hil_review: "HIL Review", submission_ready: "Ready",
  submitted: "Submitted", awarded: "Awarded", declined: "Declined"
};

export default function Applications() {
  const [apps, setApps] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sections, setSections] = useState({});
  const [activeSection, setActiveSection] = useState("executive_summary");
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showHIL, setShowHIL] = useState(false);
  const [hilCheckpoints, setHilCheckpoints] = useState([]);

  useEffect(() => { loadApps(); }, []);

  const loadApps = async () => {
    setLoading(true);
    const data = await base44.entities.GrantApplication.list("-created_date", 50);
    setApps(data);
    setLoading(false);
  };

  const openApp = async (app) => {
    setSelected(app);
    setSections(app.sections || {});
    const hils = await base44.entities.HILCheckpoint.filter({ application_id: app.id, decision: "pending" });
    setHilCheckpoints(hils);
    if (hils.length > 0) setShowHIL(true);
  };

  const draftSection = async () => {
    if (!selected) return;
    setDrafting(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Write the "${activeSection}" section for ${selected.grant_title}.`,
        response_json_schema: { type: "object", properties: { content: { type: "string" } } }
      });
      setSections(prev => ({ ...prev, [activeSection]: result.content }));
      toast.success("Section drafted by AI");
    } catch(e) { toast.error("Draft failed: " + e.message); }
    setDrafting(false);
  };

  const saveSection = async () => {
    if (!selected) return;
    setSaving(true);
    await base44.entities.GrantApplication.update(selected.id, { sections });
    toast.success("Saved");
    setSaving(false);
  };

  const runCompliance = async () => {
    if (!selected) return;
    setChecking(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Perform a compliance check on ${selected.grant_title}.`,
        response_json_schema: { type: "object", properties: { score: { type: "number" }, issues: { type: "array", items: { type: "string" } }, passed: { type: "boolean" } } }
      });
      await base44.entities.GrantApplication.update(selected.id, { compliance_score: result.score, compliance_issues: result.issues, stage: result.passed ? "budget" : "compliance_check" });
      await base44.entities.HILCheckpoint.create({ application_id: selected.id, grant_title: selected.grant_title, stage: "compliance_check", tier: result.passed ? "tier3" : "tier1", action_required: result.passed ? "Review compliance results" : "Fix compliance issues before proceeding", context: `Score: ${result.score}/100. Issues: ${result.issues?.join("; ")}` });
      toast.success(`Compliance check complete: ${result.score}/100`);
      await loadApps();
    } catch(e) { toast.error("Compliance check failed: " + e.message); }
    setChecking(false);
  };

  const resolveHIL = async (checkpoint, decision) => {
    await base44.entities.HILCheckpoint.update(checkpoint.id, { decision, decision_by: "user" });
    toast.success(`HIL checkpoint ${decision}`);
    const remaining = hilCheckpoints.filter(h => h.id !== checkpoint.id);
    setHilCheckpoints(remaining);
    if (!remaining.length) setShowHIL(false);
  };

  const stageColor = (stage) => ({ discovery: "bg-slate-100 text-slate-600", assessment: "bg-blue-100 text-blue-700", writing: "bg-yellow-100 text-yellow-700", compliance_check: "bg-orange-100 text-orange-700", hil_review: "bg-red-100 text-red-700", submission_ready: "bg-green-100 text-green-700", awarded: "bg-emerald-100 text-emerald-700" }[stage] || "bg-slate-100 text-slate-600");

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  if (selected) return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {showHIL && hilCheckpoints.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3"><AlertTriangle className="w-6 h-6 text-red-500" /><div><p className="font-bold text-red-800">HIL CHECKPOINT: {hilCheckpoints[0].stage?.toUpperCase()}</p><p className="text-sm text-red-600">{hilCheckpoints[0].action_required}</p></div></div>
          <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => resolveHIL(hilCheckpoints[0], "approved")}>Approve</Button><Button size="sm" variant="outline" onClick={() => resolveHIL(hilCheckpoints[0], "blocked")}>Block</Button></div>
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3"><div><button onClick={() => setSelected(null)} className="text-sm text-emerald-600 hover:underline mb-1">← Back</button><h1 className="text-xl font-bold text-slate-900">{selected.grant_title}</h1><p className="text-slate-500 text-sm">{selected.funder}</p></div><div className="flex items-center gap-2"><Badge className={stageColor(selected.stage)}>{STAGE_LABELS[selected.stage]}</Badge><Button variant="outline" onClick={runCompliance} disabled={checking} className="gap-2">{checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}Compliance Check</Button></div></div>
      <div className="grid md:grid-cols-4 gap-4"><Card className="md:col-span-1"><CardHeader className="pb-2"><CardTitle className="text-sm">Sections</CardTitle></CardHeader><CardContent className="p-2 space-y-1">{SECTIONS.map(s => <button key={s.key} onClick={() => setActiveSection(s.key)} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${activeSection === s.key ? "bg-emerald-50 text-emerald-800 font-medium" : "hover:bg-slate-50 text-slate-600"}`}><span>{s.label}</span>{sections[s.key] && <div className="w-2 h-2 bg-emerald-400 rounded-full" />}</button>)}</CardContent></Card><Card className="md:col-span-3"><CardHeader className="pb-2 flex-row items-center justify-between"><CardTitle className="text-base">{SECTIONS.find(s => s.key === activeSection)?.label}</CardTitle><div className="flex gap-2"><Button size="sm" variant="outline" onClick={draftSection} disabled={drafting} className="gap-2">{drafting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}AI Draft</Button><Button size="sm" onClick={saveSection} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save</Button></div></CardHeader><CardContent><Textarea value={sections[activeSection] || ""} onChange={e => setSections(prev => ({ ...prev, [activeSection]: e.target.value }))} className="min-h-80 resize-none font-mono text-sm" /><p className="text-xs text-slate-400 mt-1">{(sections[activeSection] || "").length} chars</p></CardContent></Card></div>
    </div>
  );

  return <div className="p-6 max-w-7xl mx-auto"><h1 className="text-2xl font-bold text-slate-900 mb-4">Applications</h1><div className="grid gap-3">{apps.map(app => <Card key={app.id} className="cursor-pointer hover:shadow-md" onClick={() => openApp(app)}><CardContent className="p-4 flex items-center justify-between"><div className="flex items-center gap-3"><FileText className="w-5 h-5 text-emerald-600" /><div><p className="font-semibold">{app.grant_title}</p><p className="text-sm text-slate-500">{app.funder}</p></div></div><div className="flex items-center gap-2"><Badge className={stageColor(app.stage)}>{STAGE_LABELS[app.stage]}</Badge><ChevronRight className="w-4 h-4 text-slate-400" /></div></CardContent></Card>)}</div></div>;
}
