import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, Target, CheckCircle2, AlertTriangle, Download, ArrowRight, ShieldCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { differenceInDays, format } from "date-fns";
import { toast } from "sonner";
import ThisWeekPlan from "@/components/overview/ThisWeekPlan";

export default function Overview() {
  const [grants, setGrants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [applications, setApplications] = useState([]);
  const [hilItems, setHilItems] = useState([]);
  const [outcomes, setOutcomes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Grant.list("-created_date", 200),
      base44.entities.GrantMatch.list("-total_score", 200),
      base44.entities.GrantApplication.list("-created_date", 100),
      base44.entities.HILCheckpoint.filter({ decision: "pending" }),
      base44.entities.GrantOutcome.list("-created_date", 50),
    ]).then(([g, m, a, h, o]) => {
      setGrants(g);
      setMatches(m);
      setApplications(a);
      setHilItems(h);
      setOutcomes(o);
      setLoading(false);
    }).catch((e) => {
      setLoadError(true);
      setLoading(false);
      toast.error("Failed to load dashboard data: " + e.message);
    });
  }, []);

  const goCount = matches.filter(m => m.recommendation === "GO").length;
  const prepCount = matches.filter(m => m.recommendation === "PREP").length;
  const deferCount = matches.filter(m => m.recommendation === "DEF").length;
  const declineCount = matches.filter(m => m.recommendation === "DECLINE").length;
  const assessed = matches.length;

  // ROI & submission tracking
  const submitted = applications.filter(a => ["submitted", "awarded", "declined"].includes(a.stage));
  const awarded = outcomes.filter(o => o.outcome === "awarded");
  const totalAwarded = awarded.reduce((s, o) => s + (o.award_amount || 0), 0);
  const successRate = submitted.length > 0 ? Math.round((awarded.length / submitted.length) * 100) : 0;

  // Deadline distribution
  const now = new Date();
  const lt30 = grants.filter(g => g.deadline && differenceInDays(new Date(g.deadline), now) < 30 && differenceInDays(new Date(g.deadline), now) >= 0).length;
  const d30to60 = grants.filter(g => g.deadline && differenceInDays(new Date(g.deadline), now) >= 30 && differenceInDays(new Date(g.deadline), now) < 60).length;
  const d60to90 = grants.filter(g => g.deadline && differenceInDays(new Date(g.deadline), now) >= 60 && differenceInDays(new Date(g.deadline), now) < 90).length;
  const gt90 = grants.filter(g => g.deadline && differenceInDays(new Date(g.deadline), now) >= 90).length;

  // Grants by category
  const catMap = {};
  grants.forEach(g => {
    const c = g.category || "other";
    catMap[c] = (catMap[c] || 0) + 1;
  });
  const catLabels = {
    health_equity: "Health Equity", digital_health: "Digital Health",
    workforce_development: "Workforce Dev", community_engagement: "Community",
    research: "Research", other: "Other"
  };
  const chartData = Object.entries(catMap).map(([k, v]) => ({ name: catLabels[k] || k, count: v }));

  const recentGrants = grants.slice(0, 6);

  const exportCSV = () => {
    const rows = [["Title", "Funder", "Category", "Deadline", "Score", "Recommendation"]];
    matches.forEach(m => {
      rows.push([m.grant_title, m.funder, "", m.deadline || "", m.total_score || "", m.recommendation || ""]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "jpge-cie-funding.csv"; a.click();
    toast.success("CSV exported");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  if (loadError) return (
    <div className="flex flex-col items-center justify-center h-96 text-center gap-3">
      <AlertTriangle className="w-10 h-10 text-amber-500" />
      <p className="text-slate-700 font-medium">Couldn't load dashboard data</p>
      <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Capital Intelligence Engine</h1>
          <p className="text-slate-500 text-sm">Find the right funding and apply with confidence — we make it simple</p>
        </div>
        <Button variant="outline" onClick={exportCSV} className="gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* Needs Your Review Alert */}
      {hilItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div>
              <p className="font-semibold text-amber-800">{hilItems.length} item{hilItems.length > 1 ? "s" : ""} need your review</p>
              <p className="text-sm text-amber-600">We paused here so you can take a quick look before moving on</p>
            </div>
          </div>
          <Link to="/copilot">
            <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100 gap-2">
              Review Now <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Step Flow */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">How It Works — Follow These Steps</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { step: 1, label: "Find Funding", desc: "Search for grants", to: "/discovery", color: "border-slate-300 hover:border-slate-400", num: "bg-slate-200 text-slate-700" },
            { step: 2, label: "Score Matches", desc: "See how well they fit", to: "/assessment", color: "border-blue-200 hover:border-blue-400", num: "bg-blue-100 text-blue-700" },
            { step: 3, label: "Track Progress", desc: "Manage your pipeline", to: "/pipeline", color: "border-purple-200 hover:border-purple-400", num: "bg-purple-100 text-purple-700" },
            { step: 4, label: "Write with AI", desc: "Draft your proposals", to: "/copilot", color: "border-emerald-200 hover:border-emerald-500", num: "bg-emerald-100 text-emerald-700" },
            { step: 5, label: "Finish & Download", desc: "Export your application", to: "/pack", color: "border-amber-200 hover:border-amber-400", num: "bg-amber-100 text-amber-700" },
          ].map(s => (
            <Link key={s.step} to={s.to}>
              <div className={`border-2 rounded-xl p-3 cursor-pointer transition-all hover:shadow-sm ${s.color} flex flex-col gap-1`}>
                <span className={`w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center ${s.num}`}>{s.step}</span>
                <p className="text-sm font-semibold text-slate-800 mt-1">{s.label}</p>
                <p className="text-xs text-slate-400">{s.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <ThisWeekPlan matches={matches} grants={grants} applications={applications} />

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Opportunities Found" value={grants.length} sub={`${grants.length} total`} icon={<Database className="w-5 h-5" />} color="slate" />
        <StatCard label="Scored" value={assessed} sub={`of ${grants.length} found`} icon={<Target className="w-5 h-5" />} color="blue" />
        <StatCard label="Great Fits" value={goCount} sub={`${assessed ? Math.round(goCount/assessed*100) : 0}% of scored`} icon={<CheckCircle2 className="w-5 h-5" />} color="emerald" />
        <StatCard label="Worth a Look" value={prepCount} sub={`${assessed ? Math.round(prepCount/assessed*100) : 0}% of scored`} icon={<AlertTriangle className="w-5 h-5" />} color="amber" />
      </div>

      {/* ROI & Financial Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Submitted" value={submitted.length} sub={submitted.length > 0 ? "applications" : "none sent yet"} icon={<ArrowRight className="w-5 h-5" />} color="blue" />
        <StatCard label="Awarded" value={awarded.length} sub={submitted.length > 0 ? `${successRate}% success rate` : "track wins here"} icon={<CheckCircle2 className="w-5 h-5" />} color="emerald" />
        <StatCard label="Total Funded" value={`$${(totalAwarded/1000).toFixed(0)}K`} sub="awarded to date" icon={<Target className="w-5 h-5" />} color="amber" />
        <StatCard label="Needs Review" value={hilItems.length} sub="waiting for you" icon={<AlertTriangle className="w-5 h-5" />} color={hilItems.length > 0 ? "amber" : "slate"} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Grants by Category */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Opportunities by Topic</CardTitle></CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Deadline Distribution */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">When Things Are Due</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { label: "< 30d", count: lt30, color: "bg-red-50 border-red-200 text-red-900" },
                { label: "30-60d", count: d30to60, color: "bg-amber-50 border-amber-200 text-amber-900" },
                { label: "60-90d", count: d60to90, color: "bg-emerald-50 border-emerald-200 text-emerald-900" },
                { label: "90d+", count: gt90, color: "bg-blue-50 border-blue-200 text-blue-900" },
              ].map(d => (
                <div key={d.label} className={`${d.color} border rounded-xl p-4 text-center`}>
                  <p className="text-3xl font-bold">{d.count}</p>
                  <p className="text-sm opacity-90">{d.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* How Matches Scored */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">How Your Matches Scored</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Great Fit", count: goCount, color: "bg-emerald-500" },
              { label: "Worth a Look", count: prepCount, color: "bg-amber-500" },
              { label: "Maybe Later", count: deferCount, color: "bg-slate-400" },
              { label: "Skip", count: declineCount, color: "bg-red-400" },
            ].map(s => (
              <div key={s.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{s.label}</span>
                  <span className="text-slate-500">{s.count} ({assessed ? Math.round(s.count/assessed*100) : 0}%)</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full">
                  <div className={`h-2 ${s.color} rounded-full transition-all`} style={{ width: `${assessed ? (s.count/assessed*100) : 0}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              Recent Activity
              <Link to="/discovery"><span className="text-xs text-emerald-600 font-normal hover:underline">View all →</span></Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentGrants.map(g => (
              <div key={g.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0 gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-slate-800 truncate">{g.title}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400 truncate max-w-32" title={g.funder}>{g.funder}</span>
                  {g.source_url && (
                    <button
                      onClick={() => window.open(g.source_url, "_blank")}
                      className="text-amber-500 hover:text-amber-700 transition-colors"
                      title="Verify at source"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {recentGrants.length === 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-slate-400 mb-2">No opportunities yet.</p>
                <Link to="/discovery">
                  <Button size="sm" variant="outline" className="gap-1">
                    Find Funding <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color }) {
  const colors = {
    slate: "bg-slate-50 text-slate-500",
    blue: "bg-blue-50 text-blue-500",
    emerald: "bg-emerald-50 text-emerald-500",
    amber: "bg-amber-50 text-amber-500",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
          </div>
          <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}