import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  useEffect(() => {
    loadApps();
  }, []);

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
        prompt: `You are an expert grant writer for GHIS LLC (Global Health Innovation Solutions), a health innovation consultancy.

Write the "${activeSection.replace(/_/g, " ").toUpperCase()}" section for this grant application:

GRANT: ${selected.grant_title}
FUNDER: ${selected.funder}

ORG: GHIS LLC — health innovation consultancy that has implemented $3.2M in health innovation projects across 14 states since 2020. Focus areas: health equity, digital health, workforce development, community engagement.

EXISTING CONTENT (if any): ${sections[activeSection] || "None — generate fresh content"}

Write a compelling, specific, and professional section. Be detailed and evidence-based. 300-500 words.`,
        response_json_schema: {
          type: "object",
          properties: { content: { type: "string" } }
        }
      });
      setSections(prev => ({ ...prev, [activeSection]: result.content }));
      toast.success("Section drafted by AI");
    } catch(e) {
      toast.error("Draft failed: " + e.message);
    }
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
        prompt: `Perform a compliance check on this grant application.

GRANT: ${selected.grant_title} (${selected.funder})
SECTIONS COMPLETED: ${Object.keys(sections).join(", ")}
CONTENT PREVIEW: ${Object.entries(sections).slice(0,3).map(([k,v]) => `${k}: ${v?.substring(0,200)}`).join("\n")}

Check for:
1. Eligibility completeness
2. Required section coverage  
3. Consistency across sections
4. Content quality and specificity
5. Federal compliance requirements

Return a score (0-100) and specific issues found.`,
        response_json_schema: {
          type: "object",
          properties: {
            score: { type: "number" },
            issues: { type: "array", items: { type: "string" } },
            passed: { type: "boolean" }
          }
        }
      });

      await base44.entities.GrantApplication.update(selected.id, {
        compliance_score: result.score,
        compliance_issues: result.issues,
        stage: result.passed ? "budget" : "compliance_check"
      });

      // Create HIL checkpoint
      await base44.entities.HILCheckpoint.create({
        application_id: selected.id,
        grant_title: selected.grant_title,
        stage: "compliance_check",
        tier: result.passed ? "tier3" : "tier1",
        action_required: result.passed ? "Review compliance results" : "Fix compliance issues before proceeding",
        context: `Score: ${result.score}/100. Issues: ${result.issues?.join("; ")}`
      });

      toast.success(`Compliance check complete: ${result.score}/100`);
      const refreshed = await base44.entities.GrantApplication.list("-created_date", 50);
      setApps(refreshed);
      const updated = refreshed.find(a => a.id === selected.id);
      if (updated) setSelected(updated);
    } catch(e) {
      toast.error("Compliance check failed: " + e.message);
    }
    setChecking(false);
  };

  const resolveHIL = async (checkpoint, decision) => {
    await base44.entities.HILCheckpoint.update(checkpoint.id, { decision, decision_by: "user" });
    toast.success(`HIL checkpoint ${decision}`);
    const remaining = hilCheckpoints.filter(h => h.id !== checkpoint.id);
    setHilCheckpoints(remaining);
    if (!remaining.length) setShowHIL(false);
  };

  const stageColor = (stage) => {
    const map = {
      discovery: "bg-slate-100 text-slate-600",
      assessment: "bg-blue-100 text-blue-700",
      writing: "bg-yellow-100 text-yellow-700",
      compliance_check: "bg-orange-100 text-orange-700",
      hil_review: "bg-red-100 text-red-700",
      submission_ready: "bg-green-100 text-green-700",
      awarded: "bg-emerald-100 text-emerald-700",
    };
    return map[stage] || "bg-slate-100 text-slate-600";
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  if (selected) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        {/* HIL Alert */}
        {showHIL && hilCheckpoints.length > 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <div>
                <p className="font-bold text-red-800">─── HIL CHECKPOINT: {hilCheckpoints[0].stage?.toUpperCase()} ───</p>
                <p className="text-sm text-red-600">{hilCheckpoints[0].action_required}</p>
              </div>
            </div>
            {hilCheckpoints[0].context && <p className="text-sm text-slate-600 bg-white rounded p-2 mb-3">{hilCheckpoints[0].context}</p>}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => resolveHIL(hilCheckpoints[0], "approved")}>✅ Approve & Advance</Button>
              <Button size="sm" variant="outline" onClick={() => resolveHIL(hilCheckpoints[0], "edited")}>✏️ Edit Before Continuing</Button>
              <Button size="sm" variant="outline" onClick={() => resolveHIL(hilCheckpoints[0], "regenerated")}>🔄 Regenerate</Button>
              <Button size="sm" variant="outline" onClick={() => resolveHIL(hilCheckpoints[0], "flagged")}>🔍 Flag for Verification</Button>
              <Button size="sm" variant="outline" onClick={() => resolveHIL(hilCheckpoints[0], "paused")}>⏸️ Pause</Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => resolveHIL(hilCheckpoints[0], "blocked")}>🚫 Block</Button>
            </div>
            {hilCheckpoints[0].tier === "tier1" && <p className="text-xs text-red-600 mt-2">⚠️ Pipeline cannot advance until you select an option.</p>}
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <button onClick={() => setSelected(null)} className="text-sm text-emerald-600 hover:underline mb-1">← Back to Applications</button>
            <h1 className="text-xl font-bold text-slate-900">{selected.grant_title}</h1>
            <p className="text-slate-500 text-sm">{selected.funder}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={stageColor(selected.stage)}>{STAGE_LABELS[selected.stage]}</Badge>
            <Button variant="outline" onClick={runCompliance} disabled={checking} className="gap-2">
              {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Compliance Check
            </Button>
          </div>
        </div>

        {selected.compliance_score != null && (
          <div className={`rounded-lg p-3 flex items-center gap-3 ${selected.compliance_score >= 70 ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
            <CheckCircle className={`w-5 h-5 ${selected.compliance_score >= 70 ? "text-green-600" : "text-amber-600"}`} />
            <div>
              <p className="font-medium text-sm">Compliance Score: {selected.compliance_score}/100</p>
              {selected.compliance_issues?.length > 0 && <p className="text-xs text-slate-600">{selected.compliance_issues.slice(0,2).join(" · ")}</p>}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-4">
          {/* Section List */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Sections</CardTitle></CardHeader>
            <CardContent className="p-2 space-y-1">
              {SECTIONS.map(s => (
                <button key={s.key} onClick={() => setActiveSection(s.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${activeSection === s.key ? "bg-emerald-50 text-emerald-800 font-medium" : "hover:bg-slate-50 text-slate-600"}`}>
                  <span>{s.label}</span>
                  {sections[s.key] && <div className="w-2 h-2 bg-emerald-400 rounded-full" />}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Editor */}
          <Card className="md:col-span-3">
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-base">{SECTIONS.find(s => s.key === activeSection)?.label}</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={draftSection} disabled={drafting} className="gap-2">
                  {drafting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  AI Draft
                </Button>
                <Button size="sm" onClick={saveSection} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={sections[activeSection] || ""}
                onChange={e => setSections(prev => ({ ...prev, [activeSection]: e.target.value }))}
                placeholder={`Write the ${SECTIONS.find(s => s.key === activeSection)?.label} section here, or click "AI Draft" to generate...`}
                className="min-h-80 resize-none font-mono text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">{(sections[activeSection] || "").length} chars</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
        <p className="text-slate-500 text-sm">Grant application workspaces</p>
      </div>

      <div className="grid gap-3">
        {apps.map(app => (
          <Card key={app.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openApp(app)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 truncate">{app.grant_title}</h3>
                    <Badge className={stageColor(app.stage)}>{STAGE_LABELS[app.stage]}</Badge>
                  </div>
                  <p className="text-sm text-slate-500">{app.funder} · Deadline: {app.deadline}</p>
                  {app.compliance_score != null && (
                    <p className="text-xs text-slate-400 mt-1">Compliance: {app.compliance_score}/100</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{Object.keys(app.sections || {}).length}/{SECTIONS.length} sections</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {apps.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No applications yet. Add grants from the Discovery page.</p>
          </div>
        )}
      </div>
    </div>
  );
}