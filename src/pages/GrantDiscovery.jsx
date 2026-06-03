import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Zap, ExternalLink, MapPin, Loader2, Plus, FileText, ShieldCheck } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";

const CLASS_LABELS = {
  health_equity: "Health Equity",
  digital_health: "Digital Health",
  workforce_development: "Workforce Dev",
  community_engagement: "Community",
  research: "Research",
  other: "Other",
};

const CLASS_COLORS = {
  health_equity: "bg-rose-100 text-rose-700",
  digital_health: "bg-blue-100 text-blue-700",
  workforce_development: "bg-amber-100 text-amber-700",
  community_engagement: "bg-green-100 text-green-700",
  research: "bg-purple-100 text-purple-700",
  other: "bg-slate-100 text-slate-700",
};

export default function GrantDiscovery() {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [auditLog, setAuditLog] = useState([]);

  // Scan parameters (per spec)
  const [scanClass, setScanClass] = useState("all");
  const [scanMinAmount, setScanMinAmount] = useState("25000");
  const [scanMaxAmount, setScanMaxAmount] = useState("2500000");
  const [scanDeadlineDays, setScanDeadlineDays] = useState("90");

  const [newGrant, setNewGrant] = useState({
    title: "", funder: "", deadline: "", award_amount_min: "", award_amount_max: "",
    category: "health_equity", status: "open", description: "", eligibility: "", source_url: ""
  });

  useEffect(() => { loadGrants(); }, []);

  const loadGrants = async () => {
    setLoading(true);
    const data = await base44.entities.Grant.list("-created_date", 200);
    setGrants(data);
    setLoading(false);
  };

  const runDiscovery = async () => {
    setDiscovering(true);
    setAuditLog([]);
    const runId = `run_${Date.now()}`;
    const log = (msg, type = "info") => setAuditLog(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);

    try {
      log(`Starting discovery run ${runId}`);
      log(`Scan parameters: class=${scanClass}, amount=$${Number(scanMinAmount).toLocaleString()}–$${Number(scanMaxAmount).toLocaleString()}, deadline=${scanDeadlineDays}d`);

      // Build exclusion set from existing grants (deduplication layer 1)
      const existing = await base44.entities.Grant.list("-created_date", 500);
      const existingTitles = new Set(existing.map(g => g.title?.toLowerCase().trim()));
      const existingFingerprints = new Set(existing.map(g => g.fingerprint).filter(Boolean));
      log(`Exclusion set built: ${existing.length} existing grants`);

      const classFilter = scanClass !== "all"
        ? `Focus specifically on the class: ${CLASS_LABELS[scanClass] || scanClass}.`
        : "Include grants across all classes: Health Equity, Digital Health, Workforce Development, Community Engagement, and Research.";

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the Grant Discovery Agent for GHIS LLC (Global Health Innovation Solutions), a health innovation consultancy serving 14 states.

TODAY'S DATE: 2026-05-11

TASK: Search the web RIGHT NOW for REAL, currently open grant opportunities. Do NOT invent or hallucinate grants. Only return grants you can confirm exist on grants.gov, agency websites, or foundation portals.

SCAN PARAMETERS:
- ${classFilter}
- Award range: $${scanMinAmount}–$${scanMaxAmount}
- Deadline: MUST be between 2026-05-11 and ${new Date(Date.now() + Number(scanDeadlineDays) * 86400000).toISOString().split("T")[0]} (within ${scanDeadlineDays} days)
- Eligible applicant types: LLCs, for-profit organizations, private sector entities

CRITICAL RULES:
1. REAL GRANTS ONLY — Search grants.gov, HRSA.gov, CDC.gov, SAMHSA.gov, RWJF.org, etc. right now.
2. SOURCE URL — Must be the actual direct URL to the grant announcement (e.g. https://grants.gov/search-results-detail/XXXX or https://www.hrsa.gov/grants/find-funding/...). Generic homepage URLs are NOT acceptable.
3. DEADLINE MUST BE REAL — The deadline field must be the actual published deadline. If you cannot confirm the deadline, mark needs_verification=true.
4. OPPORTUNITY NUMBER — Include the real Grants.gov opportunity number (e.g. HHS-2026-ACF-OPRE-YE-0123) when available.
5. LLC ELIGIBILITY — Verify the funder accepts LLCs / for-profit / private sector applicants. Many federal grants require nonprofits — flag those clearly in eligibility field.

DEDUPLICATION: Do NOT return any of these (already in our database):
${[...existingTitles].slice(0, 25).join(" | ")}

Return 5–8 confirmed real opportunities. If you cannot find enough REAL grants matching these criteria, return fewer — do NOT pad with invented ones.

For each, classify actionability:
- PASS: Real grant, direct URL confirmed, deadline within window, LLC-eligible
- NEEDS_VERIFICATION: Real grant found but URL or LLC eligibility needs manual confirmation
- REJECTED: Cannot confirm real source — DO NOT include these in the output`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            grants: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  funder: { type: "string" },
                  opportunity_number: { type: "string" },
                  description: { type: "string" },
                  focus_areas: { type: "array", items: { type: "string" } },
                  eligibility: { type: "string" },
                  award_amount_min: { type: "number" },
                  award_amount_max: { type: "number" },
                  deadline: { type: "string" },
                  category: { type: "string" },
                  geographic_scope: { type: "string" },
                  source_url: { type: "string" },
                  actionability: { type: "string" },
                  why_actionable: { type: "string" },
                  needs_verification: { type: "array", items: { type: "string" } }
                }
              }
            },
            rejected: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  rejection_reason: { type: "string" }
                }
              }
            },
            run_summary: {
              type: "object",
              properties: {
                sources_queried: { type: "number" },
                raw_candidates: { type: "number" },
                duplicates_rejected: { type: "number" },
                passed: { type: "number" }
              }
            }
          }
        }
      });

      const grantList = result.grants || [];
      const rejected = result.rejected || [];
      const summary = result.run_summary || {};

      log(`Raw candidates found: ${summary.raw_candidates || grantList.length + rejected.length}`);
      log(`Sources queried: ${summary.sources_queried || "multiple"}`);

      let created = 0;
      let deduped = 0;
      let qualityRejected = 0;
      const today = new Date("2026-05-11");
      const maxDeadline = new Date(today.getTime() + Number(scanDeadlineDays) * 86400000);

      for (const g of grantList) {
        // Layer 2: title similarity check
        const normalizedTitle = g.title?.toLowerCase().trim();
        if (existingTitles.has(normalizedTitle)) {
          log(`DUPLICATE (L2 title): ${g.title}`, "warn");
          deduped++;
          continue;
        }

        // Fingerprint (Layer 1)
        const fingerprint = btoa(`${g.funder?.toLowerCase()}_${g.title?.toLowerCase()}`).substring(0, 32);
        if (existingFingerprints.has(fingerprint)) {
          log(`DUPLICATE (L1 fingerprint): ${g.title}`, "warn");
          deduped++;
          continue;
        }

        // Layer 3: Quality checks — URL and deadline validation
        const url = g.source_url || "";
        const hasRealUrl = url.length > 10 && (
          url.includes("grants.gov") || url.includes(".gov") || url.includes(".org") || url.includes("https://")
        ) && !url.includes("example.com") && !url.endsWith(".gov") && !url.endsWith(".org");

        if (!hasRealUrl) {
          log(`⚠️ QUALITY FLAG (no direct URL): ${g.title} — URL: "${url}"`, "warn");
          // Still save but flag as needs_verification
          g.actionability = "NEEDS_VERIFICATION";
        }

        // Deadline validation
        if (g.deadline) {
          const deadline = new Date(g.deadline);
          if (isNaN(deadline.getTime())) {
            log(`❌ QUALITY REJECT (invalid date): ${g.title}`, "error");
            qualityRejected++;
            continue;
          }
          if (deadline < today) {
            log(`❌ QUALITY REJECT (past deadline ${g.deadline}): ${g.title}`, "error");
            qualityRejected++;
            continue;
          }
          if (deadline > maxDeadline) {
            log(`❌ QUALITY REJECT (deadline too far: ${g.deadline}, max: ${maxDeadline.toISOString().split("T")[0]}): ${g.title}`, "error");
            qualityRejected++;
            continue;
          }
        } else {
          log(`⚠️ QUALITY FLAG (no deadline): ${g.title}`, "warn");
          g.actionability = "NEEDS_VERIFICATION";
        }

        await base44.entities.Grant.create({
          ...g,
          status: "open",
          posted_date: new Date().toISOString().split("T")[0],
          fingerprint,
        });
        log(`✅ SAVED: ${g.title} | ${g.deadline} | ${g.actionability || "PASS"}`, "success");
        created++;
      }

      if (qualityRejected > 0) {
        log(`🚫 Quality filter blocked ${qualityRejected} grants (bad URL / invalid deadline)`, "warn");
      }

      for (const r of rejected) {
        log(`REJECTED — NON-ACTIONABLE: ${r.title}: ${r.rejection_reason}`, "error");
      }

      log(`Run complete: ${created} new grants added, ${deduped} duplicates blocked, ${rejected.length} rejected as non-actionable`, "success");
      toast.success(`Discovery complete: ${created} new grants added`);
      await loadGrants();
    } catch (e) {
      log(`ERROR: ${e.message}`, "error");
      toast.error("Discovery failed: " + e.message);
    }
    setDiscovering(false);
  };

  const addToApplication = async (grant) => {
    await base44.entities.GrantApplication.create({
      grant_id: grant.id,
      grant_title: grant.title,
      funder: grant.funder,
      deadline: grant.deadline,
      stage: "assessment"
    });
    toast.success("Added to applications workspace");
    setSelected(null);
  };

  const saveNewGrant = async () => {
    await base44.entities.Grant.create({
      ...newGrant,
      award_amount_min: Number(newGrant.award_amount_min),
      award_amount_max: Number(newGrant.award_amount_max),
      posted_date: new Date().toISOString().split("T")[0]
    });
    toast.success("Grant added");
    setShowAddForm(false);
    setNewGrant({ title: "", funder: "", deadline: "", award_amount_min: "", award_amount_max: "", category: "health_equity", status: "open", description: "", eligibility: "", source_url: "" });
    await loadGrants();
  };

  const filtered = grants.filter(g => {
    const matchSearch = !search || g.title?.toLowerCase().includes(search.toLowerCase()) || g.funder?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || g.category === categoryFilter;
    const matchStatus = statusFilter === "all" || g.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const logColors = { info: "text-slate-500", success: "text-emerald-600", warn: "text-amber-600", error: "text-red-600" };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Discovery Engine</h1>
          <p className="text-slate-500 text-sm">Scan, filter, and import grant opportunities · {grants.length} in database</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Manual Import
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => {
            const rows = [["Title", "Funder", "Category", "Deadline", "Award Min", "Award Max", "Status"]];
            grants.forEach(g => rows.push([g.title, g.funder, g.category || "", g.deadline || "", g.award_amount_min || "", g.award_amount_max || "", g.status]));
            const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "grants.csv"; a.click();
            toast.success("Exported");
          }}>
            Export
          </Button>
        </div>
      </div>

      {/* Scan Parameters Panel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-500" /> Scan Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Class</label>
              <Select value={scanClass} onValueChange={setScanClass}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="health_equity">Health Equity</SelectItem>
                  <SelectItem value="digital_health">Digital Health</SelectItem>
                  <SelectItem value="workforce_development">Workforce Dev</SelectItem>
                  <SelectItem value="community_engagement">Community</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Min Amount ($)</label>
              <Input value={scanMinAmount} onChange={e => setScanMinAmount(e.target.value)} type="number" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Max Amount ($)</label>
              <Input value={scanMaxAmount} onChange={e => setScanMaxAmount(e.target.value)} type="number" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Deadline (days)</label>
              <Input value={scanDeadlineDays} onChange={e => setScanDeadlineDays(e.target.value)} type="number" />
            </div>
          </div>
          <Button onClick={runDiscovery} disabled={discovering} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            {discovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {discovering ? "Scanning..." : "Run Discovery Scan"}
          </Button>
        </CardContent>
      </Card>

      {/* Audit Log */}
      {auditLog.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" /> Audit Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900 rounded-lg p-3 max-h-40 overflow-y-auto font-mono text-xs space-y-0.5">
              {auditLog.map((entry, i) => (
                <div key={i} className={`${logColors[entry.type] || "text-slate-400"}`}>
                  <span className="text-slate-600 mr-2">{entry.time}</span>{entry.msg}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search grants..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            <SelectItem value="health_equity">Health Equity</SelectItem>
            <SelectItem value="digital_health">Digital Health</SelectItem>
            <SelectItem value="workforce_development">Workforce Dev</SelectItem>
            <SelectItem value="community_engagement">Community</SelectItem>
            <SelectItem value="research">Research</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="forecasted">Forecasted</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <p className="self-center text-sm text-slate-500">{filtered.length} grants</p>
      </div>

      {/* Grant Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Funder</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Class</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Deadline</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Geo</th>
                <th className="px-4 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(grant => {
                const days = grant.deadline ? differenceInDays(new Date(grant.deadline), new Date()) : null;
                const isUrgent = days !== null && days >= 0 && days < 30;
                return (
                  <tr key={grant.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => setSelected(grant)}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 truncate max-w-52">{grant.title}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{grant.funder}</td>
                    <td className="px-4 py-3">
                      {grant.category && (
                        <Badge className={`text-xs ${CLASS_COLORS[grant.category] || "bg-slate-100 text-slate-700"}`}>
                          {CLASS_LABELS[grant.category] || grant.category}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell text-xs">
                      {grant.award_amount_min ? `$${(grant.award_amount_min/1000).toFixed(0)}K` : "—"}
                      {grant.award_amount_max ? `–$${(grant.award_amount_max/1000).toFixed(0)}K` : ""}
                    </td>
                    <td className={`px-4 py-3 text-xs whitespace-nowrap ${isUrgent ? "text-red-600 font-medium" : "text-slate-500"}`}>
                      {grant.deadline ? format(new Date(grant.deadline), "MMM d, yyyy") : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">{grant.geographic_scope || "—"}</td>
                    <td className="px-4 py-3">
                      {grant.source_url && (
                        <button className="text-slate-400 hover:text-slate-600" onClick={e => { e.stopPropagation(); window.open(grant.source_url, "_blank"); }}>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-slate-400">No grants found. Run a discovery scan to populate the database.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Grant Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-slate-500">Funder</p><p className="font-medium">{selected.funder}</p></div>
                <div><p className="text-xs text-slate-500">Opportunity #</p><p className="font-medium">{selected.opportunity_number || "—"}</p></div>
                <div><p className="text-xs text-slate-500">Award Range</p><p className="font-medium text-emerald-700">{selected.award_amount_min ? `$${selected.award_amount_min.toLocaleString()}` : "—"}{selected.award_amount_max ? ` – $${selected.award_amount_max.toLocaleString()}` : ""}</p></div>
                <div><p className="text-xs text-slate-500">Deadline</p><p className="font-medium">{selected.deadline ? format(new Date(selected.deadline), "MMMM d, yyyy") : "—"}</p></div>
              </div>
              {selected.description && <div><p className="text-xs text-slate-500 mb-1">Description</p><p className="text-sm text-slate-700">{selected.description}</p></div>}
              {selected.eligibility && <div><p className="text-xs text-slate-500 mb-1">Eligibility</p><p className="text-sm text-slate-700">{selected.eligibility}</p></div>}
              {selected.geographic_scope && <div className="flex items-center gap-2 text-sm text-slate-600"><MapPin className="w-4 h-4" />{selected.geographic_scope}</div>}
              <div className="flex gap-3 pt-2 flex-wrap">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => addToApplication(selected)}>
                  Add to Pipeline
                </Button>
                {selected.source_url && (
                  <Button variant="outline" className="gap-2" onClick={() => window.open(selected.source_url, "_blank")}>
                    <ExternalLink className="w-4 h-4" /> Source
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
                  onClick={() => window.open(`https://grantedai.com/grants?q=${encodeURIComponent(selected.title)}`, "_blank")}
                >
                  <ShieldCheck className="w-4 h-4" /> Verify on GrantedAI
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Manual Grant Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Import Grant Manually</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Grant title *" value={newGrant.title} onChange={e => setNewGrant(p => ({...p, title: e.target.value}))} />
            <Input placeholder="Funder *" value={newGrant.funder} onChange={e => setNewGrant(p => ({...p, funder: e.target.value}))} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Min award $" type="number" value={newGrant.award_amount_min} onChange={e => setNewGrant(p => ({...p, award_amount_min: e.target.value}))} />
              <Input placeholder="Max award $" type="number" value={newGrant.award_amount_max} onChange={e => setNewGrant(p => ({...p, award_amount_max: e.target.value}))} />
            </div>
            <Input type="date" value={newGrant.deadline} onChange={e => setNewGrant(p => ({...p, deadline: e.target.value}))} />
            <Select value={newGrant.category} onValueChange={v => setNewGrant(p => ({...p, category: v}))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="health_equity">Health Equity</SelectItem>
                <SelectItem value="digital_health">Digital Health</SelectItem>
                <SelectItem value="workforce_development">Workforce Dev</SelectItem>
                <SelectItem value="community_engagement">Community</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Source URL (direct application link)" value={newGrant.source_url} onChange={e => setNewGrant(p => ({...p, source_url: e.target.value}))} />
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={saveNewGrant} disabled={!newGrant.title || !newGrant.funder}>Import Grant</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}