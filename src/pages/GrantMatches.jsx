import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Target, Loader2, ThumbsUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const REC_COLORS = {
  GO: "bg-emerald-100 text-emerald-800 border-emerald-300",
  PREP: "bg-blue-100 text-blue-800 border-blue-300",
  DEF: "bg-amber-100 text-amber-800 border-amber-300",
  DECLINE: "bg-slate-100 text-slate-600 border-slate-300",
};

export default function GrantMatches() {
  const [matches, setMatches] = useState([]);
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [threshold, setThreshold] = useState([40]);
  const [recFilter, setRecFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    Promise.all([
      base44.entities.GrantMatch.list("-total_score", 100),
      base44.entities.Grant.list("-created_date", 100),
    ]).then(([m, g]) => { setMatches(m); setGrants(g); setLoading(false); });
  }, []);

  const runMatching = async () => {
    if (!grants.length) { toast.error("No grants in database. Run discovery first."); return; }
    setScoring(true);
    try {
      let orgProfile = "GHIS LLC — health innovation consultancy, $3.2M deployed across 14 states. Focus: health equity, digital health, workforce development, community engagement.";
      try {
        const profiles = await base44.entities.OrgProfile.list();
        if (profiles.length) orgProfile = `${profiles[0].org_name}: ${profiles[0].mission}. Focus: ${(profiles[0].focus_areas||[]).join(", ")}. States: ${(profiles[0].geographic_coverage||[]).join(", ")}.`;
      } catch(e) {}

      const unscored = grants.filter(g => !matches.find(m => m.grant_id === g.id)).slice(0, 5);
      if (!unscored.length) { toast.info("All grants already scored"); setScoring(false); return; }

      for (const grant of unscored) {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Score this grant opportunity for our organization using SOP4 formula.

ORG PROFILE: ${orgProfile}

GRANT: ${grant.title}
FUNDER: ${grant.funder}
DESCRIPTION: ${grant.description || "N/A"}
FOCUS AREAS: ${(grant.focus_areas||[]).join(", ")}
ELIGIBILITY: ${grant.eligibility || "N/A"}
AWARD: $${grant.award_amount_min||0}–$${grant.award_amount_max||0}
DEADLINE: ${grant.deadline}

Scoring formula (0-100 total):
- Mandate Alignment: 40% weight
- Eligibility Fit: 30% weight  
- Deadline Feasibility: 20% weight
- Geographic Match: 10% weight

Recommendation: GO>=80, PREP>=60, DEF>=40, DECLINE<40

Provide detailed rationale, key strengths, and concerns.`,
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
              strengths: { type: "array", items: { type: "string" } },
              concerns: { type: "array", items: { type: "string" } }
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
      }
      toast.success(`Scored ${unscored.length} grants`);
      const updated = await base44.entities.GrantMatch.list("-total_score", 100);
      setMatches(updated);
    } catch(e) {
      toast.error("Matching failed: " + e.message);
    }
    setScoring(false);
  };

  const submitFeedback = async () => {
    await base44.entities.GrantMatch.update(selected.id, { human_feedback: feedback, status: "approved" });
    toast.success("Feedback saved");
    setSelected(null);
    setFeedback("");
    const updated = await base44.entities.GrantMatch.list("-total_score", 100);
    setMatches(updated);
  };

  const filtered = matches.filter(m => {
    const aboveThreshold = m.total_score >= threshold[0];
    const matchRec = recFilter === "all" || m.recommendation === recFilter;
    return aboveThreshold && matchRec;
  });

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Grant Matches</h1>
          <p className="text-slate-500 text-sm">AI-scored opportunities using SOP4 formula</p>
        </div>
        <Button onClick={runMatching} disabled={scoring} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
          {scoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
          {scoring ? "Scoring..." : "Run AI Matching"}
        </Button>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-6">
          <div className="flex-1 min-w-48">
            <p className="text-sm text-slate-600 mb-2">Score Threshold: <strong>{threshold[0]}</strong></p>
            <Slider value={threshold} onValueChange={setThreshold} min={0} max={100} step={5} className="w-full" />
          </div>
          <Select value={recFilter} onValueChange={setRecFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Recommendation" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="GO">GO (≥80)</SelectItem>
              <SelectItem value="PREP">PREP (≥60)</SelectItem>
              <SelectItem value="DEF">DEF (≥40)</SelectItem>
              <SelectItem value="DECLINE">DECLINE</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-slate-500">{filtered.length} matches</p>
        </CardContent>
      </Card>

      {/* Matches */}
      <div className="space-y-3">
        {filtered.map(match => (
          <Card key={match.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelected(match); setFeedback(match.human_feedback || ""); }}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Score Ring */}
                <div className="shrink-0 text-center">
                  <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center font-bold text-lg ${
                    match.total_score >= 80 ? "border-emerald-400 text-emerald-700" :
                    match.total_score >= 60 ? "border-blue-400 text-blue-700" :
                    match.total_score >= 40 ? "border-amber-400 text-amber-700" :
                    "border-slate-300 text-slate-500"
                  }`}>
                    {Math.round(match.total_score)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-slate-900">{match.grant_title}</h3>
                    <Badge className={`text-xs border ${REC_COLORS[match.recommendation]}`}>{match.recommendation}</Badge>
                    {match.status === "approved" && <Badge className="text-xs bg-green-100 text-green-700">Reviewed</Badge>}
                  </div>
                  <p className="text-sm text-slate-500 mb-2">{match.funder} · Deadline: {match.deadline}</p>
                  {/* Score Bars */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Mandate", val: match.mandate_alignment, weight: "40%" },
                      { label: "Eligibility", val: match.eligibility_fit, weight: "30%" },
                      { label: "Deadline", val: match.deadline_feasibility, weight: "20%" },
                      { label: "Geo", val: match.geographic_match, weight: "10%" },
                    ].map(s => (
                      <div key={s.label}>
                        <p className="text-xs text-slate-400">{s.label} <span className="text-slate-300">({s.weight})</span></p>
                        <div className="h-1.5 bg-slate-100 rounded-full mt-1">
                          <div className="h-1.5 bg-emerald-500 rounded-full" style={{ width: `${s.val || 0}%` }} />
                        </div>
                        <p className="text-xs font-medium text-slate-600 mt-0.5">{Math.round(s.val || 0)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No matches above threshold. Run AI Matching or adjust the threshold.</p>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selected?.grant_title}
              {selected && <Badge className={`border ${REC_COLORS[selected.recommendation]}`}>{selected.recommendation}</Badge>}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Total Score", val: Math.round(selected.total_score) },
                  { label: "Mandate (40%)", val: Math.round(selected.mandate_alignment||0) },
                  { label: "Eligibility (30%)", val: Math.round(selected.eligibility_fit||0) },
                  { label: "Deadline (20%)", val: Math.round(selected.deadline_feasibility||0) },
                ].map(s => (
                  <div key={s.label} className="text-center bg-slate-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-slate-800">{s.val}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
              {selected.rationale && (
                <div><p className="text-sm font-medium text-slate-700 mb-1">AI Rationale</p><p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{selected.rationale}</p></div>
              )}
              {selected.strengths?.length > 0 && (
                <div><p className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><ThumbsUp className="w-4 h-4 text-emerald-500" />Strengths</p>
                <ul className="text-sm text-slate-600 space-y-1">{selected.strengths.map((s,i) => <li key={i} className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">•</span>{s}</li>)}</ul></div>
              )}
              {selected.concerns?.length > 0 && (
                <div><p className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><AlertCircle className="w-4 h-4 text-amber-500" />Concerns</p>
                <ul className="text-sm text-slate-600 space-y-1">{selected.concerns.map((s,i) => <li key={i} className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">•</span>{s}</li>)}</ul></div>
              )}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Human Feedback</p>
                <Textarea placeholder="Add your notes or feedback on this match..." value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} />
              </div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={submitFeedback}>Save Feedback & Mark Reviewed</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}