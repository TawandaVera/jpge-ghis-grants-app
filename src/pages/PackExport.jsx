import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, AlertCircle, ExternalLink, Package, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { SECTION_KEYS } from "@/lib/grantConstants";

const READINESS_ITEMS = [
  "Filled in 'About My Org' (tax ID, mission)",
  "Cost rates added",
  "Financial statements ready",
  "Saved your past write-ups",
  "All sections written",
  "Checked the rules",
  "Budget finished",
  "Team has reviewed it",
];

export default function PackExport() {
  const [matches, setMatches] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readiness, setReadiness] = useState({});
  const [selectedApp, setSelectedApp] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.GrantMatch.filter({ recommendation: "GO" }),
      base44.entities.GrantMatch.filter({ recommendation: "PREP" }),
      base44.entities.GrantApplication.list("-created_date", 100),
    ]).then(([go, prep, apps]) => {
      setMatches([...go, ...prep].sort((a, b) => b.total_score - a.total_score));
      setApplications(apps);
      setLoading(false);
    });
  }, []);

  const getApp = (matchGrantId) => applications.find(a => a.grant_id === matchGrantId);

  const readinessCount = Object.values(readiness).filter(Boolean).length;
  const remaining = READINESS_ITEMS.length - readinessCount;

  const generatePackage = async (match) => {
    const app = getApp(match.grant_id);
    if (!app) {
      toast.error("No application started yet. Use 'Write with AI' first.");
      return;
    }
    setGenerating(true);
    try {
      const sections = app.sections || {};
      const content = [
        `# ${match.grant_title}`,
        `## Funder: ${match.funder}`,
        `## Deadline: ${match.deadline || "TBD"}`,
        `## Match Score: ${match.total_score}% (${match.recommendation})`,
        `\n---\n`,
        ...SECTION_KEYS.map(k => `## ${k.replace(/_/g, " ").toUpperCase()}\n\n${sections[k] || "[Section not drafted — complete in Co-Pilot]"}`)
      ].join("\n\n");
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${match.grant_title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_package.txt`;
      a.click();
      toast.success("Package exported");
    } catch(e) {
      toast.error("Export failed: " + e.message);
    }
    setGenerating(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Finish & Download</h1>
        <p className="text-slate-500 text-sm">Put your best applications together and download them, ready to send</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Grant List */}
        <div className="md:col-span-2 space-y-3">
          <h2 className="font-semibold text-slate-700 text-sm">Your Best Opportunities ({matches.length})</h2>
          {matches.map(match => {
            const app = getApp(match.grant_id);
            const sectionCount = Object.keys(app?.sections || {}).length;
            return (
              <Card
                key={match.id}
                className={`cursor-pointer transition-all hover:shadow-md ${selectedApp?.id === app?.id ? "border-emerald-400 bg-emerald-50/30" : ""}`}
                onClick={() => setSelectedApp(app || null)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">{match.grant_title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{match.funder} · Deadline: {match.deadline}</p>
                      {app && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
                              <div className="h-1.5 bg-emerald-500 rounded-full" style={{ width: `${(sectionCount / SECTION_KEYS.length) * 100}%` }} />
                            </div>
                            <span className="text-xs text-slate-400">{sectionCount}/{SECTION_KEYS.length} sections</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-xs border ${match.recommendation === "GO" ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-blue-100 text-blue-800 border-blue-300"}`}>
                        {match.recommendation === "GO" ? "Great Fit" : "Worth a Look"}
                      </Badge>
                      <span className="text-sm font-bold text-slate-600">{match.total_score}%</span>
                      {app ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          disabled={generating}
                          onClick={e => { e.stopPropagation(); generatePackage(match); }}
                        >
                          <Package className="w-3 h-3" /> Export
                        </Button>
                      ) : (
                        <Link to="/copilot" onClick={e => e.stopPropagation()}>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                            Write with AI <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {matches.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No good matches yet. Score some matches first.</p>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Readiness Checklist */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Readiness Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {READINESS_ITEMS.map(item => (
                <div key={item} className="flex items-center gap-3">
                  <Checkbox
                    checked={!!readiness[item]}
                    onCheckedChange={v => setReadiness(p => ({ ...p, [item]: v }))}
                  />
                  <span className={`text-sm ${readiness[item] ? "line-through text-slate-400" : "text-slate-700"}`}>{item}</span>
                </div>
              ))}
              <div className={`mt-3 flex items-center gap-2 text-sm font-medium ${remaining === 0 ? "text-emerald-600" : "text-amber-600"}`}>
                {remaining === 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {remaining === 0 ? "All items complete!" : `${remaining} item${remaining > 1 ? "s" : ""} remaining`}
              </div>
            </CardContent>
          </Card>

          {/* Package Generator */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                Build Your Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedApp ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-700 font-medium">{selectedApp.grant_title}</p>
                  <div className="space-y-2">
                    {SECTION_KEYS.map(k => (
                      <div key={k} className="flex items-center gap-2 text-xs">
                        {selectedApp.sections?.[k] ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        )}
                        <span className={selectedApp.sections?.[k] ? "text-slate-700" : "text-slate-400"}>
                          {k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2 text-sm"
                    disabled={generating}
                    onClick={() => {
                      const match = matches.find(m => m.grant_id === selectedApp.grant_id);
                      if (match) generatePackage(match);
                    }}
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                    {generating ? "Building..." : "Build Document"}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">Pick one on the left to build your document</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}