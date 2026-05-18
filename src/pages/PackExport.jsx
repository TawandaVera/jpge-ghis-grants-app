import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertCircle, Package, Loader2, ArrowRight, Lock } from "lucide-react";
import { toast } from "sonner";
import { SECTION_KEYS } from "@/lib/grantConstants";
import {
  PACK_GATE_PHRASE,
  canGeneratePack,
  getPackBlockReason,
  isDraftableState,
  normalizeMatchRecord,
} from "@/lib/grants/governance";

const READINESS_ITEMS = [
  "SAM.gov Registration Active",
  "DUNS/UEI Number Current",
  "LLC Operating Agreement Filed",
  "Professional Liability Insurance",
  "Financial Statements (2 yr)",
  "Capability Statement Updated",
];

const STATE_BADGE = {
  GO: "bg-emerald-100 text-emerald-800 border-emerald-300",
  PREPARE: "bg-blue-100 text-blue-800 border-blue-300",
  DEFER: "bg-amber-100 text-amber-800 border-amber-300",
  DECLINE: "bg-slate-100 text-slate-600 border-slate-300",
};

export default function PackExport() {
  const [matches, setMatches] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readiness, setReadiness] = useState({});
  const [selectedApp, setSelectedApp] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [personaConfirmed, setPersonaConfirmed] = useState(false);
  const [readinessVerified, setReadinessVerified] = useState(false);
  const [gatePhrase, setGatePhrase] = useState("");

  useEffect(() => {
    Promise.all([
      base44.entities.GrantMatch.filter({ recommendation: "GO" }),
      base44.entities.GrantMatch.filter({ recommendation: "PREP" }),
      base44.entities.GrantMatch.filter({ recommendation: "PREPARE" }),
      base44.entities.GrantApplication.list("-created_date", 100),
    ]).then(([go, prep, prepare, apps]) => {
      const canonicalMatches = [...go, ...prep, ...prepare]
        .map(normalizeMatchRecord)
        .filter((match, index, all) => all.findIndex((item) => item.id === match.id) === index)
        .filter((match) => isDraftableState(match.advisory_state))
        .sort((a, b) => (b.total_score || 0) - (a.total_score || 0));

      setMatches(canonicalMatches);
      setApplications(apps);
      setLoading(false);
    });
  }, []);

  const getApp = (matchGrantId) => applications.find((app) => app.grant_id === matchGrantId);

  const readinessCount = Object.values(readiness).filter(Boolean).length;
  const remaining = READINESS_ITEMS.length - readinessCount;
  const gateState = {
    advisory_state: selectedApp
      ? matches.find((match) => match.grant_id === selectedApp.grant_id)?.advisory_state
      : matches[0]?.advisory_state,
    gate_phrase: gatePhrase,
    persona_confirmed: personaConfirmed,
    readiness_verified: readinessVerified,
  };
  const blockReason = getPackBlockReason(gateState);

  const generatePackage = async (match) => {
    const app = getApp(match.grant_id);
    const gate = {
      advisory_state: match.advisory_state,
      gate_phrase: gatePhrase,
      persona_confirmed: personaConfirmed,
      readiness_verified: readinessVerified,
    };

    if (!canGeneratePack(gate)) {
      toast.error(getPackBlockReason(gate));
      return;
    }

    if (!app) {
      toast.error("No application found for this grant. Start drafting in Co-Pilot first.");
      return;
    }

    setGenerating(true);
    try {
      const sections = app.sections || {};
      const content = [
        "# ZERO-DRAFT APPLICATION PACK, NOT SUBMISSION READY",
        "This export is a controlled planning artifact. Final submission authority remains with the human review body.",
        `# ${match.grant_title}`,
        `## Funder: ${match.funder}`,
        `## Deadline: ${match.deadline || "TBD"}`,
        `## Match Score: ${match.total_score}% (${match.advisory_state})`,
        "\n---\n",
        ...SECTION_KEYS.map((key) => (
          `## ${key.replace(/_/g, " ").toUpperCase()}\n\n${sections[key] || "[Section not drafted — complete in Co-Pilot]"}`
        )),
      ].join("\n\n");
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${match.grant_title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_zero_draft_package.txt`;
      a.click();
      toast.success("Zero-draft package exported");
    } catch(e) {
      toast.error("Export failed: " + e.message);
    }
    setGenerating(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Forms & Packaging</h1>
        <p className="text-slate-500 text-sm">Prepare controlled zero-draft packs for GO/PREPARE opportunities after human gate approval</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Grant List */}
        <div className="md:col-span-2 space-y-3">
          <h2 className="font-semibold text-slate-700 text-sm">GO/PREPARE Grants ({matches.length})</h2>
          {matches.map((match) => {
            const app = getApp(match.grant_id);
            const sectionCount = Object.keys(app?.sections || {}).length;
            const gated = canGeneratePack({
              advisory_state: match.advisory_state,
              gate_phrase: gatePhrase,
              persona_confirmed: personaConfirmed,
              readiness_verified: readinessVerified,
            });
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
                      <Badge className={`text-xs border ${STATE_BADGE[match.advisory_state] || "bg-slate-100 text-slate-600"}`}>
                        {match.advisory_state}
                      </Badge>
                      <span className="text-sm font-bold text-slate-600">{match.total_score}%</span>
                      {app ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          disabled={generating || !gated}
                          onClick={(e) => { e.stopPropagation(); generatePackage(match); }}
                        >
                          {gated ? <Package className="w-3 h-3" /> : <Lock className="w-3 h-3" />} Export
                        </Button>
                      ) : (
                        <Link to="/copilot" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                            Co-Pilot <ArrowRight className="w-3 h-3" />
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
              <p>No GO/PREPARE matches yet. Run assessment first.</p>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                Pack Gate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox checked={personaConfirmed} onCheckedChange={(value) => setPersonaConfirmed(Boolean(value))} />
                <span className="text-sm text-slate-700">Organization persona confirmed</span>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox checked={readinessVerified} onCheckedChange={(value) => setReadinessVerified(Boolean(value))} />
                <span className="text-sm text-slate-700">Readiness artifacts verified</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Required phrase</p>
                <Input
                  value={gatePhrase}
                  onChange={(event) => setGatePhrase(event.target.value)}
                  placeholder={PACK_GATE_PHRASE}
                />
              </div>
              <div className={`rounded-lg p-3 text-xs border ${blockReason ? "bg-white border-amber-200 text-amber-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
                {blockReason || "Pack gate satisfied. Export remains a zero-draft only."}
              </div>
            </CardContent>
          </Card>

          {/* Readiness Checklist */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Readiness Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {READINESS_ITEMS.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <Checkbox
                    checked={!!readiness[item]}
                    onCheckedChange={(value) => setReadiness((previous) => ({ ...previous, [item]: value }))}
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
                Package Generator
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedApp ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-700 font-medium">{selectedApp.grant_title}</p>
                  <div className="space-y-2">
                    {SECTION_KEYS.map((key) => (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        {selectedApp.sections?.[key] ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        )}
                        <span className={selectedApp.sections?.[key] ? "text-slate-700" : "text-slate-400"}>
                          {key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2 text-sm"
                    disabled={generating || Boolean(blockReason)}
                    onClick={() => {
                      const match = matches.find((item) => item.grant_id === selectedApp.grant_id);
                      if (match) generatePackage(match);
                    }}
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                    {generating ? "Generating..." : "Generate Zero-Draft Package"}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">Select a grant to generate a zero-draft package</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
