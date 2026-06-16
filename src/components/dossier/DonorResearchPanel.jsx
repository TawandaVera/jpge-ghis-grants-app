import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Users, Search, AlertTriangle, ChevronRight, X, FileText, CalendarPlus } from "lucide-react";
import ScheduleMeetingModal from "@/components/dossier/ScheduleMeetingModal";
import { format } from "date-fns";
import { toast } from "sonner";

const CONFIDENCE_COLORS = {
  "Direct Evidence": "bg-emerald-100 text-emerald-800 border-emerald-300",
  "Strong Inference": "bg-blue-100 text-blue-800 border-blue-300",
  "Speculative": "bg-amber-100 text-amber-700 border-amber-300"
};

const PRIVATE_TYPES = ["family_foundation", "private_foundation", "hnwi"];

function RunDetailPanel({ run, onClose, onExport, exporting, funderName, grantTitle }) {
  const [tab, setTab] = useState("people");
  const [schedulingPerson, setSchedulingPerson] = useState(null);
  const individuals = run.linked_individuals || [];
  const causes = run.cause_signals || [];
  const evidence = run.evidence_trail || [];

  // Build opportunities from individual outreach_angles
  const opportunities = individuals.flatMap(p =>
    (p.outreach_angles || []).map(o => ({ person: p.name, ...o }))
  );

  const tabs = [
    { id: "people", label: `People (${individuals.length})` },
    { id: "causes", label: `Cause Signals (${causes.length})` },
    { id: "evidence", label: `Evidence Trail (${evidence.length})` },
    { id: "opportunities", label: `Opportunities (${opportunities.length})` }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <p className="font-semibold text-slate-900 text-sm">Research Run</p>
            <p className="text-xs text-slate-500">
              {format(new Date(run.run_date || run.created_date), "MMM d, yyyy h:mm a")} ·{" "}
              <span className={`font-medium ${run.confidence_score >= 70 ? "text-emerald-600" : run.confidence_score >= 40 ? "text-blue-600" : "text-amber-600"}`}>
                {run.confidence_score || 0}% confidence
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onExport}
              disabled={exporting}
              title="Export to Google Doc"
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium transition-colors disabled:opacity-50"
            >
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              Export to Doc
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-white">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${tab === t.id ? "border-b-2 border-emerald-600 text-emerald-700" : "text-slate-500 hover:text-slate-700"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* People */}
          {tab === "people" && (
            individuals.length === 0
              ? <p className="text-slate-400 text-sm text-center py-8">No individuals identified.</p>
              : individuals.map((p, i) => (
                <Card key={i} className="border-slate-200">
                <CardContent className="p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.role}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge className={`text-[10px] border ${CONFIDENCE_COLORS[p.confidence_label] || "bg-slate-100 text-slate-600"}`}>
                        {p.confidence_label}
                      </Badge>
                      <button
                        onClick={() => setSchedulingPerson(p)}
                        title="Schedule follow-up meeting"
                        className="p-1 rounded hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {p.linked_causes?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.linked_causes.map((c, ci) => (
                        <span key={ci} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">{c}</span>
                      ))}
                    </div>
                  )}
                </CardContent>
                </Card>
              ))
          )}

          {/* Cause Signals */}
          {tab === "causes" && (
            causes.length === 0
              ? <p className="text-slate-400 text-sm text-center py-8">No cause signals detected.</p>
              : <div className="flex flex-wrap gap-2 pt-2">
                {causes.map((c, i) => (
                  <span key={i} className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-full font-medium">{c}</span>
                ))}
              </div>
          )}

          {/* Evidence Trail */}
          {tab === "evidence" && (
            evidence.length === 0
              ? <p className="text-slate-400 text-sm text-center py-8">No evidence items recorded.</p>
              : evidence.map((e, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-3 bg-white space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{e.type}</Badge>
                    <span className="text-xs text-slate-400">{e.source}</span>
                    {e.date && <span className="text-xs text-slate-400 ml-auto">{e.date}</span>}
                  </div>
                  <p className="text-xs text-slate-700">{e.summary}</p>
                </div>
              ))
          )}

          {/* Opportunities */}
          {tab === "opportunities" && (
            opportunities.length === 0
              ? <p className="text-slate-400 text-sm text-center py-8">No outreach opportunities generated.</p>
              : opportunities.map((o, i) => (
                <div key={i} className="border border-blue-200 bg-blue-50 rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-blue-700">{o.person}</p>
                    <button
                      onClick={() => setSchedulingPerson(individuals.find(p => p.name === o.person) || { name: o.person })}
                      title="Schedule follow-up meeting"
                      className="p-1 rounded hover:bg-blue-100 text-blue-400 hover:text-blue-700 transition-colors shrink-0"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-sm text-blue-900 font-medium">{o.angle}</p>
                  <p className="text-xs text-blue-700">{o.rationale}</p>
                </div>
              ))
          )}
        </div>
      </div>

      {schedulingPerson && (
        <ScheduleMeetingModal
          open={!!schedulingPerson}
          onClose={() => setSchedulingPerson(null)}
          person={schedulingPerson}
          funderName={funderName}
          grantTitle={grantTitle}
        />
      )}
    </div>
  );
}

export default function DonorResearchPanel({ grant, currentUser }) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [exporting, setExporting] = useState(false);

  const isPrivate = PRIVATE_TYPES.includes(grant?.funding_type);

  useEffect(() => {
    if (!grant?.id) return;
    base44.entities.ResearchRun.filter({ grant_id: grant.id }, "-run_date", 20)
      .then(r => { setRuns(r); setLoading(false); })
      .catch(() => setLoading(false));
  }, [grant?.id]);

  const exportToDoc = async (run) => {
    setExporting(true);
    try {
      const res = await base44.functions.invoke("exportResearchRunToDoc", { run_id: run.id });
      if (res.data?.doc_url) {
        window.open(res.data.doc_url, "_blank");
        toast.success("Google Doc created successfully!");
      } else {
        toast.error("Export failed — no doc URL returned.");
      }
    } catch (e) {
      toast.error("Export failed: " + e.message);
    }
    setExporting(false);
  };

  const triggerResearch = async () => {
    setTriggering(true);
    try {
      const run = await base44.entities.ResearchRun.create({
        grant_id: grant.id,
        triggered_by: currentUser?.full_name || currentUser?.email || "unknown",
        run_date: new Date().toISOString(),
        status: "pending"
      });

      setRuns(prev => [run, ...prev]);

      // Invoke backend function (fire and update)
      base44.functions.invoke("researchGrantDonors", {
        run_id: run.id,
        grant_name: grant.title,
        funder_name: grant.funder,
        funder_ein: grant.cfda_number || null,
        outcome_areas: grant.outcome_areas || [],
        funding_type: grant.funding_type
      }).then(async () => {
        const updated = await base44.entities.ResearchRun.filter({ grant_id: grant.id }, "-run_date", 20);
        setRuns(updated);
      }).catch(async () => {
        const updated = await base44.entities.ResearchRun.filter({ grant_id: grant.id }, "-run_date", 20);
        setRuns(updated);
      });

      toast.success("Research started — this may take 30–60 seconds");
    } catch (e) {
      toast.error("Failed to start research: " + e.message);
    }
    setTriggering(false);
  };

  const statusBadge = (status) => {
    const map = {
      pending: "bg-slate-100 text-slate-600",
      running: "bg-blue-100 text-blue-700",
      complete: "bg-emerald-100 text-emerald-700",
      failed: "bg-red-100 text-red-700"
    };
    return map[status] || "bg-slate-100 text-slate-600";
  };

  if (!isPrivate) return null;

  return (
    <div className="space-y-4">
      {/* Trigger button */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-600" />
          <p className="text-sm font-semibold text-purple-900">Donor Intelligence</p>
        </div>
        <p className="text-xs text-purple-700">
          Identify the people behind this foundation — board members, trustees, and principals — and map their cause affinities for strategic outreach.
        </p>
        <Button
          size="sm"
          onClick={triggerResearch}
          disabled={triggering}
          className="bg-purple-700 hover:bg-purple-800 text-white gap-2"
        >
          {triggering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          {triggering ? "Starting..." : "Investigate people behind this grant"}
        </Button>
      </div>

      {/* Research History */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Research History</p>
        {loading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>}
        {!loading && runs.length === 0 && (
          <p className="text-xs text-slate-400 py-3">No research runs yet. Click the button above to start.</p>
        )}
        {!loading && runs.map(run => (
          <div
            key={run.id}
            onClick={() => setSelectedRun(run)}
            className="flex items-center justify-between px-3 py-2.5 border border-slate-200 rounded-lg mb-2 cursor-pointer hover:border-purple-300 hover:bg-purple-50/40 transition-colors"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Badge className={`text-[10px] ${statusBadge(run.status)}`}>{run.status}</Badge>
                {run.confidence_score != null && run.status === "complete" && (
                  <span className="text-xs text-slate-500">{run.confidence_score}% confidence</span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {run.run_date ? format(new Date(run.run_date), "MMM d, yyyy h:mm a") : "—"} ·{" "}
                {run.linked_individuals?.length || 0} individual{(run.linked_individuals?.length || 0) !== 1 ? "s" : ""} found
              </p>
            </div>
            {run.status === "complete" && (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); exportToDoc(run); }}
                  disabled={exporting}
                  title="Export to Google Doc"
                  className="p-1 rounded hover:bg-purple-100 text-slate-400 hover:text-purple-600 transition-colors"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                </button>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            )}
            {run.status === "running" && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
            {run.status === "failed" && <AlertTriangle className="w-4 h-4 text-red-400" />}
          </div>
        ))}
      </div>

      {/* Detail Side Panel */}
      {selectedRun && (
        <RunDetailPanel
          run={selectedRun}
          onClose={() => setSelectedRun(null)}
          onExport={() => exportToDoc(selectedRun)}
          exporting={exporting}
          funderName={grant?.funder}
          grantTitle={grant?.title}
        />
      )}
    </div>
  );
}