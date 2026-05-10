import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, Clock, AlertTriangle, CheckCircle, 
  DollarSign, Target, FileText, Zap, ArrowRight, Activity
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

export default function Dashboard() {
  const [grants, setGrants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [applications, setApplications] = useState([]);
  const [hilItems, setHilItems] = useState([]);
  const [outcomes, setOutcomes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Grant.list("-created_date", 50),
      base44.entities.GrantMatch.list("-created_date", 50),
      base44.entities.GrantApplication.list("-created_date", 50),
      base44.entities.HILCheckpoint.filter({ decision: "pending" }),
      base44.entities.GrantOutcome.list("-created_date", 20),
    ]).then(([g, m, a, h, o]) => {
      setGrants(g);
      setMatches(m);
      setApplications(a);
      setHilItems(h);
      setOutcomes(o);
      setLoading(false);
    });
  }, []);

  const awarded = outcomes.filter(o => o.outcome === "awarded");
  const totalAwarded = awarded.reduce((s, o) => s + (o.award_amount || 0), 0);
  const goMatches = matches.filter(m => m.recommendation === "GO");
  const urgentDeadlines = applications.filter(a => {
    const days = differenceInDays(new Date(a.deadline), new Date());
    return days >= 0 && days <= 14;
  });

  const stageColors = {
    discovery: "bg-slate-100 text-slate-700",
    assessment: "bg-blue-100 text-blue-700",
    matching: "bg-purple-100 text-purple-700",
    writing: "bg-yellow-100 text-yellow-700",
    compliance_check: "bg-orange-100 text-orange-700",
    budget: "bg-cyan-100 text-cyan-700",
    review: "bg-indigo-100 text-indigo-700",
    hil_review: "bg-red-100 text-red-700",
    submission_ready: "bg-green-100 text-green-700",
    submitted: "bg-emerald-100 text-emerald-700",
    awarded: "bg-green-200 text-green-800",
    declined: "bg-gray-100 text-gray-600",
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">GrantPath AI</h1>
          <p className="text-slate-500 text-sm">Multi-agent grant discovery & management — GHIS LLC</p>
        </div>
        <Link to="/discovery">
          <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <Zap className="w-4 h-4" /> Run Discovery
          </Button>
        </Link>
      </div>

      {/* HIL Alert */}
      {hilItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-semibold text-red-800">{hilItems.length} HIL Checkpoint{hilItems.length > 1 ? "s" : ""} Awaiting Review</p>
              <p className="text-sm text-red-600">Pipeline paused — human decision required</p>
            </div>
          </div>
          <Link to="/applications">
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100 gap-2">
              Review Now <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Grants" value={grants.length} icon={FileText} color="blue" />
        <StatCard title="GO Matches" value={goMatches.length} icon={Target} color="emerald" />
        <StatCard title="Active Apps" value={applications.filter(a => !["awarded","declined","submitted"].includes(a.stage)).length} icon={Activity} color="purple" />
        <StatCard title="Total Awarded" value={`$${(totalAwarded/1000).toFixed(0)}K`} icon={DollarSign} color="amber" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top GO Matches */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              Top GO Matches
              <Link to="/matches"><span className="text-xs text-emerald-600 font-normal hover:underline">View all →</span></Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {goMatches.slice(0, 4).map(m => (
              <div key={m.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-slate-900 truncate">{m.grant_title}</p>
                  <p className="text-xs text-slate-500">{m.funder}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-sm font-bold text-emerald-600">{m.total_score}</span>
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">GO</Badge>
                </div>
              </div>
            ))}
            {goMatches.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No GO matches yet. Run discovery to find opportunities.</p>}
          </CardContent>
        </Card>

        {/* Urgent Deadlines */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              Urgent Deadlines
              <Link to="/pipeline"><span className="text-xs text-emerald-600 font-normal hover:underline">View pipeline →</span></Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgentDeadlines.map(a => {
              const days = differenceInDays(new Date(a.deadline), new Date());
              return (
                <div key={a.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-slate-900 truncate">{a.grant_title}</p>
                    <p className="text-xs text-slate-500">{a.funder}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Clock className={`w-4 h-4 ${days <= 7 ? "text-red-500" : "text-amber-500"}`} />
                    <span className={`text-sm font-bold ${days <= 7 ? "text-red-600" : "text-amber-600"}`}>{days}d</span>
                  </div>
                </div>
              );
            })}
            {urgentDeadlines.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No urgent deadlines in the next 14 days.</p>}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              Active Applications
              <Link to="/applications"><span className="text-xs text-emerald-600 font-normal hover:underline">View all →</span></Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {applications.filter(a => !["awarded","declined"].includes(a.stage)).slice(0, 4).map(a => (
              <div key={a.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-slate-900 truncate">{a.grant_title}</p>
                  <p className="text-xs text-slate-500">{a.funder}</p>
                </div>
                <Badge className={`text-xs ${stageColors[a.stage]}`}>{a.stage?.replace("_", " ")}</Badge>
              </div>
            ))}
            {applications.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No active applications yet.</p>}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/discovery"><Button variant="outline" className="w-full justify-start gap-2"><Zap className="w-4 h-4 text-emerald-600" />Discover New Grants</Button></Link>
            <Link to="/matches"><Button variant="outline" className="w-full justify-start gap-2"><Target className="w-4 h-4 text-blue-600" />Review AI Matches</Button></Link>
            <Link to="/applications"><Button variant="outline" className="w-full justify-start gap-2"><FileText className="w-4 h-4 text-purple-600" />Open Application Workspace</Button></Link>
            <Link to="/pipeline"><Button variant="outline" className="w-full justify-start gap-2"><Activity className="w-4 h-4 text-amber-600" />View Pipeline Kanban</Button></Link>
            <Link to="/org-profile"><Button variant="outline" className="w-full justify-start gap-2"><CheckCircle className="w-4 h-4 text-slate-600" />Update Org Profile</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: IconComp, color }) {
  const Icon = IconComp;
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}