import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Search, ExternalLink, ShieldCheck, Loader2, TrendingUp, Calendar, DollarSign, CheckCircle2, AlertTriangle, ClipboardList, Users } from "lucide-react";
import DonorResearchPanel from "@/components/dossier/DonorResearchPanel";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { recLabel } from "@/lib/friendlyLabels";

const REC_BADGE = {
  GO: "bg-emerald-100 text-emerald-800 border-emerald-300",
  PREP: "bg-blue-100 text-blue-800 border-blue-300",
  DEF: "bg-amber-100 text-amber-800 border-amber-300",
  DECLINE: "bg-slate-100 text-slate-600 border-slate-300",
};

export default function GrantDossier() {
  const navigate = useNavigate();
  const [grants, setGrants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState("");
  const [recFilter, setRecFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [dossier, setDossier] = useState(null);
  const [logNote, setLogNote] = useState("");
  const [loggingStatus, setLoggingStatus] = useState(false);

  const loadData = () =>
    Promise.all([
      base44.entities.Grant.list("-created_date", 300),
      base44.entities.GrantMatch.list("-total_score", 300),
      base44.entities.GrantApplication.list("-created_date", 100),
    ]).then(([g, m, a]) => {
      setGrants(g);
      setMatches(m);
      setApplications(a);
      setLoading(false);
    });

  useEffect(() => {
    loadData();
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  const getMatch = (grantId) => matches.find(m => m.grant_id === grantId);

  const logStatusUpdate = async () => {
    if (!logNote.trim() || !selected?.app) return;
    setLoggingStatus(true);
    const timestamp = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const existing = selected.app.notes || "";
    await base44.entities.GrantApplication.update(selected.app.id, {
      notes: `[${timestamp}] ${logNote.trim()}\n${existing}`.trim(),
    });
    toast.success("Status logged");
    setLogNote("");
    setLoggingStatus(false);
    loadData();
  };
  const getApp = (grantId) => applications.find(a => a.grant_id === grantId);

  const generateDossier = async (grant) => {
    const match = getMatch(grant.id);
    if (!match) {
      toast.error("Score this one first to build a game plan.");
      return;
    }
    setGenerating(true);
    setDossier(null);
    try {
      const orgProfile = await base44.entities.OrgProfile.list().then(p => p[0] || null);
      const orgDesc = orgProfile
        ? `${orgProfile.org_name}: ${orgProfile.mission}. Focus: ${(orgProfile.focus_areas || []).join(", ")}.`
        : "GHIS LLC — health innovation consultancy serving 14 states. Focus: health equity, workforce, SDOH.";

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior grant strategist. Generate a comprehensive Grant Dossier for the following opportunity.

ORG PROFILE: ${orgDesc}

GRANT: ${grant.title}
FUNDER: ${grant.funder}
OPPORTUNITY #: ${grant.opportunity_number || "N/A"}
DESCRIPTION: ${grant.description || "N/A"}
ELIGIBILITY: ${grant.eligibility || "N/A"}
AWARD: $${grant.award_amount_min || 0}–$${grant.award_amount_max || 0}
DEADLINE: ${grant.deadline || "N/A"}
SCORE: ${match.total_score}% (${match.recommendation})
RATIONALE: ${match.rationale || "N/A"}
STRENGTHS: ${(match.strengths || []).join("; ")}
CONCERNS: ${(match.concerns || []).join("; ")}

Generate a strategic dossier that includes:
1. Executive brief (3 sentences max) 
2. Why this grant fits GHIS (3 bullet points)
3. Key competitive differentiators for this application
4. Top 3 risks and mitigations
5. Application strategy (timeline, key contacts to find, partnerships to consider)
6. Go/No-Go recommendation with rationale`,
        response_json_schema: {
          type: "object",
          properties: {
            executive_brief: { type: "string" },
            fit_reasons: { type: "array", items: { type: "string" } },
            differentiators: { type: "array", items: { type: "string" } },
            risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  risk: { type: "string" },
                  mitigation: { type: "string" }
                }
              }
            },
            application_strategy: {
              type: "object",
              properties: {
                timeline_weeks: { type: "number" },
                key_steps: { type: "array", items: { type: "string" } },
                partnerships: { type: "array", items: { type: "string" } }
              }
            },
            final_recommendation: { type: "string" },
            confidence_level: { type: "string" }
          }
        }
      });
      setDossier(result);
    } catch (e) {
      toast.error("Dossier generation failed: " + e.message);
    }
    setGenerating(false);
  };

  const combined = grants
    .map(g => ({ grant: g, match: getMatch(g.id), app: getApp(g.id) }))
    .filter(({ match }) => match) // only assessed grants
    .filter(({ grant, match }) => {
      const matchSearch = !search ||
        grant.title?.toLowerCase().includes(search.toLowerCase()) ||
        grant.funder?.toLowerCase().includes(search.toLowerCase());
      const matchRec = recFilter === "all" || match?.recommendation === recFilter;
      return matchSearch && matchRec;
    })
    .sort((a, b) => (b.match?.total_score || 0) - (a.match?.total_score || 0));

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-600" /> Funding Library
          </h1>
          <p className="text-slate-500 text-sm">Full details and game plans for opportunities you've scored · {combined.length} scored</p>
        </div>
        <Button
          variant="outline"
          className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
          onClick={() => window.open("https://grantedai.com/grants", "_blank")}
        >
          <ShieldCheck className="w-4 h-4" /> Browse GrantedAI
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search grants or funders..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={recFilter} onValueChange={setRecFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Show all" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Show all</SelectItem>
            <SelectItem value="GO">Great Fit</SelectItem>
            <SelectItem value="PREP">Worth a Look</SelectItem>
            <SelectItem value="DEF">Maybe Later</SelectItem>
            <SelectItem value="DECLINE">Skip</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dossier Cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {combined.map(({ grant, match, app }) => {
          const days = grant.deadline ? differenceInDays(new Date(grant.deadline), new Date()) : null;
          const isUrgent = days !== null && days >= 0 && days < 30;
          return (
            <Card
              key={grant.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => { setSelected({ grant, match, app }); setDossier(null); }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold text-slate-800 line-clamp-2 leading-tight">{grant.title}</CardTitle>
                  <Badge className={`text-xs border shrink-0 ${REC_BADGE[match.recommendation]}`}>{recLabel(match.recommendation)}</Badge>
                </div>
                <p className="text-xs text-slate-500">{grant.funder}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="font-bold text-emerald-700">{Math.round(match.total_score)}% fit</span>
                  </div>
                  <div className={`flex items-center gap-1 ${isUrgent ? "text-red-600 font-medium" : ""}`}>
                    <Calendar className="w-3 h-3" />
                    {days !== null ? (days < 0 ? "Overdue" : `${days}d left`) : "—"}
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full">
                  <div className="h-1.5 bg-emerald-500 rounded-full" style={{ width: `${match.total_score}%` }} />
                </div>
                {grant.award_amount_max && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <DollarSign className="w-3 h-3" />
                    {grant.award_amount_min ? `$${(grant.award_amount_min/1000).toFixed(0)}K` : "—"}
                    {` – $${(grant.award_amount_max/1000).toFixed(0)}K`}
                  </div>
                )}
                {app && (
                  <div className="flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 className="w-3 h-3" /> Application in progress
                  </div>
                )}
                {match.rationale && (
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{match.rationale}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
        {combined.length === 0 && (
          <div className="col-span-3 text-center py-16 text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Nothing here yet. Score some matches first.</p>
          </div>
        )}
      </div>

      {/* Dossier Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setDossier(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap text-base">
              <BookOpen className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="line-clamp-2">{selected?.grant?.title}</span>
              {selected?.match && (
                <Badge className={`text-xs border shrink-0 ${REC_BADGE[selected.match.recommendation]}`}>
                  {recLabel(selected.match.recommendation)}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              {/* Quick facts */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{Math.round(selected.match.total_score)}%</p>
                  <p className="text-xs text-slate-500">Fit Score</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-sm font-bold text-slate-800">{selected.grant.deadline ? format(new Date(selected.grant.deadline), "MMM d, yyyy") : "—"}</p>
                  <p className="text-xs text-slate-500">Deadline</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-sm font-bold text-slate-800">
                    {selected.grant.award_amount_max ? `$${(selected.grant.award_amount_max/1000).toFixed(0)}K` : "—"}
                  </p>
                  <p className="text-xs text-slate-500">Max Award</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-sm font-bold text-slate-800">{selected.grant.opportunity_number || "—"}</p>
                  <p className="text-xs text-slate-500">Opportunity #</p>
                </div>
              </div>

              {/* AI Rationale */}
              {selected.match.rationale && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Why This Score</p>
                  <p className="text-sm text-blue-800">{selected.match.rationale}</p>
                </div>
              )}

              {/* Generate Dossier */}
              {!dossier && (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                  onClick={() => generateDossier(selected.grant)}
                  disabled={generating}
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                  {generating ? "Building Your Game Plan..." : "Build a Game Plan"}
                </Button>
              )}

              {/* Dossier Content */}
              {dossier && (
                <div className="space-y-4">
                  {dossier.executive_brief && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <p className="text-xs font-semibold text-emerald-700 mb-1 uppercase tracking-wider">Executive Brief</p>
                      <p className="text-sm text-emerald-900">{dossier.executive_brief}</p>
                    </div>
                  )}

                  {dossier.fit_reasons?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2">Why This Fits You</p>
                      <ul className="space-y-1">
                        {dossier.fit_reasons.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {dossier.risks?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2">Things to Watch & How to Handle Them</p>
                      <div className="space-y-2">
                        {dossier.risks.map((r, i) => (
                          <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-xs font-medium text-amber-800 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> {r.risk}
                            </p>
                            <p className="text-xs text-amber-700 mt-1">↳ {r.mitigation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {dossier.application_strategy?.key_steps?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2">
                        Your Plan · about {dossier.application_strategy.timeline_weeks} weeks to get ready
                      </p>
                      <ol className="space-y-1">
                        {dossier.application_strategy.key_steps.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="bg-slate-200 text-slate-600 rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">{i + 1}</span>
                            {s}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {dossier.final_recommendation && (
                    <div className="bg-slate-900 text-white rounded-lg p-4">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Our Take · <span className="text-emerald-400">{dossier.confidence_level}</span>
                      </p>
                      <p className="text-sm">{dossier.final_recommendation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Quick-action: Log Status */}
              {selected.app && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-emerald-600" /> Add a Quick Update
                    <Badge className="ml-auto bg-emerald-100 text-emerald-800 border-emerald-300 text-xs border">{selected.app.stage}</Badge>
                  </p>
                  <Textarea
                    value={logNote}
                    onChange={e => setLogNote(e.target.value)}
                    placeholder="e.g. Submitted draft narrative, awaiting PI sign-off..."
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                      onClick={logStatusUpdate}
                      disabled={!logNote.trim() || loggingStatus}
                    >
                      <ClipboardList className="w-3.5 h-3.5" /> Log Update
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate("/tracker")}>
                      <ExternalLink className="w-3.5 h-3.5" /> Open Tracker
                    </Button>
                  </div>
                </div>
              )}
              {!selected.app && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                  <p className="text-xs text-slate-500">No application tracked yet for this grant.</p>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => navigate("/tracker")}>
                    <ClipboardList className="w-3.5 h-3.5" /> Add to Tracker
                  </Button>
                </div>
              )}

              {/* Donor Intelligence */}
              <div id="donor-research-panel">
                <DonorResearchPanel grant={selected?.grant} currentUser={currentUser} />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 flex-wrap pt-1">
                {selected.grant.source_url && (
                  <Button variant="outline" className="gap-2" onClick={() => window.open(selected.grant.source_url, "_blank")}>
                    <ExternalLink className="w-4 h-4" /> View Source
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
                  onClick={() => window.open(`https://grantedai.com/grants?q=${encodeURIComponent(selected.grant.title)}`, "_blank")}
                >
                  <ShieldCheck className="w-4 h-4" /> Verify on GrantedAI
                </Button>
                {["family_foundation", "private_foundation", "hnwi"].includes(selected.grant.funding_type) && (
                  <Button
                    variant="outline"
                    className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                    onClick={() => document.getElementById("donor-research-panel")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    <Users className="w-4 h-4" /> Donor Research
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}