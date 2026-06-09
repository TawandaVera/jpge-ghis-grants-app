import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Zap, ThumbsUp, AlertCircle, Download, BarChart3, Send, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const REC_BADGE = {
  GO: "bg-emerald-100 text-emerald-800 border-emerald-300",
  PREP: "bg-blue-100 text-blue-800 border-blue-300",
  DEF: "bg-amber-100 text-amber-800 border-amber-300",
  DECLINE: "bg-slate-100 text-slate-600 border-slate-300",
};

// 5 Mandate Areas per spec
const MANDATE_AREAS = [
  { key: "health_systems", label: "Health Systems", color: "bg-blue-500" },
  { key: "workforce", label: "Workforce Innovation", color: "bg-amber-500" },
  { key: "equity", label: "Health Equity", color: "bg-rose-500" },
  { key: "technology", label: "Health Technology", color: "bg-purple-500" },
  { key: "prevention_sdoh", label: "Prevention & SDOH", color: "bg-green-500" },
];

export default function Assessment() {
  const navigate = useNavigate();
  const [grants, setGrants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [stateFilter, setStateFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [checked, setChecked] = useState({});
  const [batchReport, setBatchReport] = useState(null);
  const [sendingToPipeline, setSendingToPipeline] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [g, m] = await Promise.all([
      base44.entities.Grant.list("-created_date", 200),
      base44.entities.GrantMatch.list("-total_score", 200),
    ]);
    setGrants(g);
    setMatches(m);
    setLoading(false);
  };

  const assessNext = async (count = 20) => {
    if (!grants.length) { toast.error("No grants in database. Run discovery first."); return; }
    setScoring(true);
    setBatchReport(null);
    try {
      let orgProfile = "JPGE — health innovation consultancy operating across multiple states. Focus areas: health systems, workforce innovation, health equity, health technology, prevention & SDOH.";
      try {
        const profiles = await base44.entities.OrgProfile.list();
        if (profiles.length) {
          const p = profiles[0];
          orgProfile = `${p.org_name}: ${p.mission}. Focus: ${(p.focus_areas||[]).join(", ")}. States: ${(p.geographic_coverage||[]).join(", ")}. Budget: $${p.annual_budget?.toLocaleString()}. Indirect rate: ${p.indirect_cost_rate}%.`;
        }
      } catch(e) {}

      const scoredIds = new Set(matches.map(m => m.grant_id));
      const unscored = grants.filter(g => !scoredIds.has(g.id)).slice(0, count);
      if (!unscored.length) { toast.info("All grants already assessed"); setScoring(false); return; }

      const report = { GO: 0, PREP: 0, DEF: 0, DECLINE: 0, total: 0, topFunders: [] };

      for (const grant of unscored) {
        const today = new Date("2026-05-10");
        const deadline = grant.deadline ? new Date(grant.deadline) : null;
        const daysLeft = deadline ? Math.round((deadline - today) / (1000 * 60 * 60 * 24)) : 999;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are the Grant Assessment Agent for GHIS LLC. Apply the SOP4 framework.

ORG PROFILE: ${orgProfile}

GRANT: ${grant.title}
FUNDER: ${grant.funder}
DESCRIPTION: ${grant.description || "N/A"}
ELIGIBILITY: ${grant.eligibility || "N/A"}
AWARD: $${grant.award_amount_min||0}–$${grant.award_amount_max||0}
DEADLINE: ${grant.deadline} (${daysLeft} days from today 2026-05-10)
CATEGORY: ${grant.category || "N/A"}

SOP4 SCORING (0-100 total):
1. MANDATE ALIGNMENT (40 pts) — Score across 5 areas (0-8 each):
   - Health Systems Transformation (care models, payment reform, quality improvement)
   - Health Workforce Innovation (training, workforce diversity, pipeline)
   - Health Equity Advancement (equity focus, underserved populations, data disaggregation)
   - Health Technology Innovation (digital health, AI, telehealth, interoperability)
   - Prevention & SDOH Integration (social determinants, prevention, community resources)
2. ELIGIBILITY FIT (30 pts) — LLC eligibility (15) + focus area match (15)
3. DEADLINE FEASIBILITY (20 pts) — >180d=20, 90-180d=15, 30-89d=10, <30d=0
4. GEOGRAPHIC MATCH (10 pts) — US national/14-state focus

AUTO-DECLINE if LLC not eligible.
AUTO-DEF if <30 days to deadline.
State: GO>=80, PREP>=60, DEF>=40, DECLINE<40.`,
          response_json_schema: {
            type: "object",
            properties: {
              mandate_alignment: { type: "number" },
              eligibility_fit: { type: "number" },
              deadline_feasibility: { type: "number" },
              geographic_match: { type: "number" },
              total_score: { type: "number" },
              recommendation: { type: "string" },
              rationale: { type: "string" },
              mandate_scores: {
                type: "object",
                properties: {
                  health_systems: { type: "number" },
                  workforce: { type: "number" },
                  equity: { type: "number" },
                  technology: { type: "number" },
                  prevention_sdoh: { type: "number" }
                }
              },
              strengths: { type: "array", items: { type: "string" } },
              concerns: { type: "array", items: { type: "string" } },
              gap_analysis: { type: "array", items: { type: "string" } },
              recommended_actions: { type: "array", items: { type: "string" } },
              estimated_prep_days: { type: "number" }
            }
          }
        });

        await base44.entities.GrantMatch.create({
          grant_id: grant.id,
          grant_title: grant.title,
          funder: grant.funder,
          deadline: grant.deadline,
          ...result,
          status: "pending_review"
        });

        report.total++;
        const rec = result.recommendation;
        if (rec in report) report[rec]++;
        report.topFunders.push(grant.funder);
      }

      setBatchReport(report);
      toast.success(`Assessed ${report.total} grants — GO:${report.GO} PREP:${report.PREP} DEF:${report.DEF} DECLINE:${report.DECLINE}`);
      await loadData();
    } catch(e) {
      toast.error("Assessment failed: " + e.message);
    }
    setScoring(false);
  };

  const saveFeedback = async () => {
    await base44.entities.GrantMatch.update(selected.id, { human_feedback: feedback, status: "approved" });
    toast.success("Feedback saved");
    setSelected(null);
    setFeedback("");
    await loadData();
  };

  const sendCheckedToPipeline = async () => {
    const checkedIds = Object.entries(checked).filter(([, v]) => v).map(([id]) => id);
    if (!checkedIds.length) { toast.error("Check at least one grant first"); return; }
    setSendingToPipeline(true);
    let added = 0;
    for (const grantId of checkedIds) {
      const grant = grants.find(g => g.id === grantId);
      if (!grant) continue;
      const existing = await base44.entities.GrantApplication.filter({ grant_id: grantId });
      if (existing.length === 0) {
        await base44.entities.GrantApplication.create({
          grant_id: grant.id,
          grant_title: grant.title,
          funder: grant.funder,
          deadline: grant.deadline,
          stage: "assessment",
        });
        added++;
      }
    }
    setSendingToPipeline(false);
    setChecked({});
    toast.success(`${added} grant(s) sent to pipeline`);
  };

  const startDrafting = async (match) => {
    let appId;
    const existing = await base44.entities.GrantApplication.filter({ grant_id: match.grant_id });
    if (existing.length === 0) {
      const created = await base44.entities.GrantApplication.create({
        grant_id: match.grant_id,
        grant_title: match.grant_title,
        funder: match.funder,
        deadline: match.deadline,
        stage: "writing",
      });
      appId = created.id;
    } else {
      await base44.entities.GrantApplication.update(existing[0].id, { stage: "writing" });
      appId = existing[0].id;
    }
    navigate(`/copilot?app_id=${appId}`);
    toast.success("Opening Co-Pilot for drafting");
  };

  const exportGoPrep = () => {
    const eligible = matches.filter(m => ["GO", "PREP"].includes(m.recommendation));
    const rows = [["Grant", "Funder", "Score", "State", "Deadline", "Rationale"]];
    eligible.forEach(m => rows.push([m.grant_title, m.funder, m.total_score, m.recommendation, m.deadline || "", m.rationale || ""]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "go-prep-grants.csv"; a.click();
    toast.success("Exported GO/PREP grants");
  };

  const combined = grants.map(g => ({
    grant: g,
    match: matches.find(m => m.grant_id === g.id) || null,
  }));

  const filtered = combined.filter(({ match }) => {
    if (stateFilter === "all") return true;
    if (stateFilter === "pending") return !match;
    return match?.recommendation === stateFilter;
  });

  const pendingCount = grants.filter(g => !matches.find(m => m.grant_id === g.id)).length;
  const goCount = matches.filter(m => m.recommendation === "GO").length;
  const prepCount = matches.filter(m => m.recommendation === "PREP").length;

  // Mandate heatmap data
  const mandateHeatmap = MANDATE_AREAS.map(area => {
    const scores = matches.filter(m => m.mandate_scores?.[area.key] !== undefined).map(m => m.mandate_scores[area.key] || 0);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return { ...area, avg: Math.round(avg * 10) / 10 };
  });

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assessment Matrix</h1>
          <p className="text-slate-500 text-sm">{matches.length} assessed · {pendingCount} pending · GO:{goCount} PREP:{prepCount}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All States" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="GO">GO</SelectItem>
              <SelectItem value="PREP">PREP</SelectItem>
              <SelectItem value="DEF">DEFER</SelectItem>
              <SelectItem value="DECLINE">DECLINE</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportGoPrep} className="gap-2">
            <Download className="w-4 h-4" /> Export GO/PREP
          </Button>
          <Button onClick={() => assessNext(20)} disabled={scoring} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            {scoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {scoring ? "Assessing..." : "Assess Next 20"}
          </Button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {Object.values(checked).some(Boolean) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3 flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-medium text-blue-800">
              {Object.values(checked).filter(Boolean).length} grant(s) selected
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setChecked({})}>Clear</Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={sendCheckedToPipeline} disabled={sendingToPipeline}>
                {sendingToPipeline ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send to Pipeline
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Batch Report */}
      {batchReport && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <p className="font-semibold text-emerald-800 mb-2">Batch Assessment Complete — {batchReport.total} grants processed</p>
            <div className="flex gap-4 flex-wrap text-sm">
              {["GO", "PREP", "DEF", "DECLINE"].map(s => (
                <span key={s} className={`font-bold ${s === "GO" ? "text-emerald-700" : s === "PREP" ? "text-blue-700" : s === "DEF" ? "text-amber-700" : "text-slate-600"}`}>
                  {s}: {batchReport[s]}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="matrix">
        <TabsList>
          <TabsTrigger value="matrix">Assessment Table</TabsTrigger>
          <TabsTrigger value="heatmap">Mandate Heatmap</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="w-8 px-4 py-3"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Match</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">State</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Grant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Brief</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Forms</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(({ grant, match }) => (
                  <tr
                    key={grant.id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => match && (setSelected(match), setFeedback(match.human_feedback || ""))}
                  >
                    <td className="px-4 py-3">
                      <Checkbox checked={!!checked[grant.id]} onCheckedChange={v => setChecked(p => ({...p, [grant.id]: v}))} onClick={e => e.stopPropagation()} />
                    </td>
                    <td className="px-4 py-3">
                      {match ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{Math.round(match.total_score)}%</span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full hidden sm:block">
                            <div className="h-1.5 bg-emerald-500 rounded-full" style={{ width: `${match.total_score}%` }} />
                          </div>
                        </div>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {match ? (
                        <Badge className={`text-xs border ${REC_BADGE[match.recommendation] || "bg-slate-100 text-slate-600"}`}>
                          {match.recommendation}
                        </Badge>
                      ) : <span className="text-xs text-slate-400">Pending</span>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 truncate max-w-52">{grant.title}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-slate-500 text-xs line-clamp-2 max-w-xs">{match?.rationale || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden md:table-cell">0 forms</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                      {grant.deadline ? format(new Date(grant.deadline), "MMM d") : "—"}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-16 text-center text-slate-400">No grants match the filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="heatmap">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Mandate Alignment Heatmap</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {mandateHeatmap.map(area => (
                <div key={area.key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{area.label}</span>
                    <span className="text-slate-500">{area.avg}/8 avg</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full">
                    <div className={`h-3 ${area.color} rounded-full transition-all`} style={{ width: `${(area.avg / 8) * 100}%` }} />
                  </div>
                </div>
              ))}
              {mandateHeatmap.every(a => a.avg === 0) && (
                <p className="text-slate-400 text-sm text-center py-4">Run assessments to populate mandate heatmap data</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              {selected?.grant_title}
              {selected && <Badge className={`text-xs border ${REC_BADGE[selected.recommendation]}`}>{selected.recommendation}</Badge>}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {/* Score Breakdown */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total Score", val: Math.round(selected.total_score || 0) },
                  { label: "Mandate (40%)", val: Math.round(selected.mandate_alignment || 0) },
                  { label: "Eligibility (30%)", val: Math.round(selected.eligibility_fit || 0) },
                  { label: "Deadline (20%)", val: Math.round(selected.deadline_feasibility || 0) },
                ].map(s => (
                  <div key={s.label} className="text-center bg-slate-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-slate-800">{s.val}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Mandate Area Scores */}
              {selected.mandate_scores && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Mandate Area Breakdown</p>
                  <div className="space-y-2">
                    {MANDATE_AREAS.map(area => {
                      const score = selected.mandate_scores[area.key] || 0;
                      return (
                        <div key={area.key} className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-40 shrink-0">{area.label}</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full">
                            <div className={`h-2 ${area.color} rounded-full`} style={{ width: `${(score / 8) * 100}%` }} />
                          </div>
                          <span className="text-xs font-medium text-slate-700 w-8 text-right">{score}/8</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selected.rationale && (
                <div><p className="text-sm font-medium text-slate-700 mb-1">AI Rationale</p><p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{selected.rationale}</p></div>
              )}

              {/* Strengths */}
              {selected.strengths?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><ThumbsUp className="w-4 h-4 text-emerald-500" />Strengths</p>
                  <ul className="space-y-1">{selected.strengths.map((s, i) => <li key={i} className="text-sm text-slate-600 flex items-start gap-2"><span className="text-emerald-500 mt-0.5">•</span>{s}</li>)}</ul>
                </div>
              )}

              {/* Gap Analysis */}
              {selected.gap_analysis?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><AlertCircle className="w-4 h-4 text-amber-500" />Gap Analysis</p>
                  <ul className="space-y-1">{selected.gap_analysis.map((s, i) => <li key={i} className="text-sm text-slate-600 flex items-start gap-2"><span className="text-amber-500 mt-0.5">•</span>{s}</li>)}</ul>
                </div>
              )}

              {/* Recommended Actions */}
              {selected.recommended_actions?.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-800 mb-1">Recommended Actions</p>
                  <ul className="space-y-1">{selected.recommended_actions.map((s, i) => <li key={i} className="text-sm text-blue-700">→ {s}</li>)}</ul>
                  {selected.estimated_prep_days && <p className="text-xs text-blue-600 mt-2">Estimated prep time: {selected.estimated_prep_days} days</p>}
                </div>
              )}

              {/* Tiered HIL Notice */}
              <div className={`rounded-lg p-3 text-sm border ${selected.total_score >= 80 ? "bg-emerald-50 border-emerald-200 text-emerald-800" : selected.total_score >= 60 ? "bg-blue-50 border-blue-200 text-blue-800" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
                <span className="font-medium">HIL Tier: </span>
                {selected.total_score >= 80 ? "Tier 2 — Review recommended (48h window)" : selected.total_score >= 60 ? "Tier 1 — Mandatory human review required" : "Tier 3 — Auto-defer, notification only"}
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Human Feedback</p>
                <Textarea placeholder="Add your notes or override..." value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={saveFeedback}>Save Feedback & Mark Reviewed</Button>
                {["GO", "PREP"].includes(selected?.recommendation) && (
                  <>
                    <Button variant="outline" className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50" onClick={async () => {
                      const grant = grants.find(g => g.id === selected.grant_id);
                      if (!grant) return;
                      const existing = await base44.entities.GrantApplication.filter({ grant_id: selected.grant_id });
                      if (existing.length === 0) {
                        await base44.entities.GrantApplication.create({ grant_id: grant.id, grant_title: grant.title, funder: grant.funder, deadline: grant.deadline, stage: "assessment" });
                        toast.success("Sent to pipeline");
                      } else {
                        toast.info("Already in pipeline");
                      }
                    }} disabled={sendingToPipeline}>
                      <Send className="w-4 h-4" /> Pipeline
                    </Button>
                    <Button className="gap-2 bg-purple-600 hover:bg-purple-700" onClick={() => { setSelected(null); startDrafting(selected); }}>
                      <Wand2 className="w-4 h-4" /> Draft Now
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}