import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Zap, ThumbsUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const REC_BADGE = {
  GO: "bg-emerald-100 text-emerald-800 border-emerald-300",
  PREP: "bg-blue-100 text-blue-800 border-blue-300",
  DEF: "bg-amber-100 text-amber-800 border-amber-300",
  DECLINE: "bg-slate-100 text-slate-600 border-slate-300",
};

export default function Assessment() {
  const [grants, setGrants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [stateFilter, setStateFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [checked, setChecked] = useState({});

  useEffect(() => {
    loadData();
  }, []);

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
    try {
      let orgProfile = "GHIS LLC — health innovation consultancy, $3.2M deployed across 14 states. Focus: health equity, digital health, workforce development, community engagement.";
      try {
        const profiles = await base44.entities.OrgProfile.list();
        if (profiles.length) {
          const p = profiles[0];
          orgProfile = `${p.org_name}: ${p.mission}. Focus: ${(p.focus_areas||[]).join(", ")}. States: ${(p.geographic_coverage||[]).join(", ")}.`;
        }
      } catch(e) {}

      const scoredIds = new Set(matches.map(m => m.grant_id));
      const unscored = grants.filter(g => !scoredIds.has(g.id)).slice(0, count);
      if (!unscored.length) { toast.info("All grants already assessed"); setScoring(false); return; }

      let done = 0;
      for (const grant of unscored) {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Score this grant for GHIS LLC using the SOP4 formula.

ORG: ${orgProfile}

GRANT: ${grant.title}
FUNDER: ${grant.funder}
DESCRIPTION: ${grant.description || "N/A"}
ELIGIBILITY: ${grant.eligibility || "N/A"}
AWARD: $${grant.award_amount_min||0}–$${grant.award_amount_max||0}
DEADLINE: ${grant.deadline}

Score (0-100 each):
- Mandate Alignment (40% weight)
- Eligibility Fit (30% weight)
- Deadline Feasibility (20% weight)
- Geographic Match (10% weight)
Composite total_score = weighted sum.
Recommendation: GO>=80, PREP>=60, DEF>=40, DECLINE<40.
Provide a 1-2 sentence brief.`,
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
        done++;
      }
      toast.success(`Assessed ${done} grants`);
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

  // Build combined view: all grants with their match data
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

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assessment Matrix</h1>
          <p className="text-slate-500 text-sm">{matches.length} assessed · {pendingCount} pending</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Filter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="GO">GO</SelectItem>
              <SelectItem value="PREP">PREP</SelectItem>
              <SelectItem value="DEF">DEFER</SelectItem>
              <SelectItem value="DECLINE">DECLINE</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => assessNext(20)} disabled={scoring} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            {scoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {scoring ? "Assessing..." : "Assess Next 20"}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="w-8 px-4 py-3"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Match</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">State</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Grant</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Brief</th>
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
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {match ? (
                    <Badge className={`text-xs border ${REC_BADGE[match.recommendation] || "bg-slate-100 text-slate-600"}`}>
                      {match.recommendation}
                    </Badge>
                  ) : (
                    <span className="text-xs text-slate-400">Pending</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800 truncate max-w-56">{grant.title}</p>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <p className="text-slate-500 text-xs line-clamp-2 max-w-xs">{match?.rationale || "—"}</p>
                </td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {grant.deadline ? format(new Date(grant.deadline), "MMM d") : "—"}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-16 text-center text-slate-400">No grants match the filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              {selected?.grant_title}
              {selected && <Badge className={`text-xs border ${REC_BADGE[selected.recommendation]}`}>{selected.recommendation}</Badge>}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
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
              {selected.rationale && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">AI Rationale</p>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{selected.rationale}</p>
                </div>
              )}
              {selected.strengths?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><ThumbsUp className="w-4 h-4 text-emerald-500" />Strengths</p>
                  <ul className="space-y-1">{selected.strengths.map((s, i) => <li key={i} className="text-sm text-slate-600 flex items-start gap-2"><span className="text-emerald-500 mt-0.5">•</span>{s}</li>)}</ul>
                </div>
              )}
              {selected.concerns?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><AlertCircle className="w-4 h-4 text-amber-500" />Concerns</p>
                  <ul className="space-y-1">{selected.concerns.map((s, i) => <li key={i} className="text-sm text-slate-600 flex items-start gap-2"><span className="text-amber-500 mt-0.5">•</span>{s}</li>)}</ul>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Human Feedback</p>
                <Textarea placeholder="Add your notes..." value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} />
              </div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={saveFeedback}>Save Feedback & Mark Reviewed</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}