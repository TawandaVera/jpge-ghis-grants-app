import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ArrowRight, CalendarClock } from "lucide-react";
import { differenceInDays, format } from "date-fns";

// Ranks scored matches by Expected Value = award potential × match score,
// keeps only ones with enough deadline runway, and shows the top 3 next moves.
export default function ThisWeekPlan({ matches, grants, applications }) {
  const grantById = {};
  grants.forEach(g => { grantById[g.id] = g; });

  const appByGrantId = {};
  applications.forEach(a => { if (a.grant_id) appByGrantId[a.grant_id] = a; });

  const now = new Date();
  const ranked = matches
    .filter(m => ["GO", "PREP"].includes(m.recommendation))
    .map(m => {
      const grant = grantById[m.grant_id];
      const award = grant?.award_amount_max || grant?.award_amount_min || 0;
      const days = m.deadline ? differenceInDays(new Date(m.deadline), now) : null;
      const ev = award * ((m.total_score || 0) / 100);
      return { ...m, award, days, ev, app: appByGrantId[m.grant_id] };
    })
    .filter(m => m.days === null || m.days >= 7)
    .sort((a, b) => b.ev - a.ev)
    .slice(0, 3);

  if (ranked.length === 0) return null;

  const nextStep = (m) => {
    if (!m.app) return { label: "Start writing", to: "/copilot" };
    if (["submission_ready", "submitted"].includes(m.app.stage)) return { label: "Track it", to: "/tracker" };
    return { label: "Keep writing", to: "/copilot" };
  };

  return (
    <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50/60 to-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          This Week's Best Moves
          <span className="text-xs font-normal text-slate-400">ranked by potential payoff × match score</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {ranked.map((m, i) => {
          const step = nextStep(m);
          return (
            <div key={m.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{m.grant_title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-slate-500">
                  {m.award > 0 && <span className="text-emerald-700 font-semibold">up to ${(m.award / 1000).toFixed(0)}K</span>}
                  <span>· {m.total_score}% match</span>
                  {m.days !== null && (
                    <span className={`flex items-center gap-1 ${m.days < 30 ? "text-red-600 font-medium" : ""}`}>
                      <CalendarClock className="w-3 h-3" /> due {format(new Date(m.deadline), "MMM d")} ({m.days}d)
                    </span>
                  )}
                </div>
              </div>
              <Badge className={m.recommendation === "GO" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                {m.recommendation === "GO" ? "Great Fit" : "Worth a Look"}
              </Badge>
              <Link to={step.to} className="shrink-0">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800">
                  {step.label} <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}