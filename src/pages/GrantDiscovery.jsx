import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Zap, ExternalLink, MapPin, Loader2, Plus, FileText, ShieldCheck, SlidersHorizontal, Sparkles, Filter, X, Layers } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import ChipSelector from "@/components/grants/ChipSelector";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import UrlImport from "@/components/discovery/UrlImport";

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

const PRESETS = [
  { label: "Private Foundation — Digital Equity", icon: "🏛️", values: { scanClass: "digital_health", scanFunderType: "private_foundation", scanApplicantType: "all", scanKeywords: "digital equity broadband access technology", scanLowHanging: false } },
  { label: "Entrepreneur / For-Profit Friendly", icon: "🚀", values: { scanClass: "all", scanFunderType: "all", scanApplicantType: "for_profit", scanKeywords: "small business entrepreneur startup innovation", scanLowHanging: true } },
  { label: "Research Grants (Any Funder)", icon: "🔬", values: { scanClass: "research", scanFunderType: "all", scanApplicantType: "all", scanKeywords: "research evidence-based clinical community health", scanLowHanging: false } },
  { label: "Low-Hanging Fruit — Quick Wins", icon: "🍎", values: { scanClass: "all", scanFunderType: "all", scanApplicantType: "all", scanKeywords: "capacity building technical assistance small grants", scanLowHanging: true } },
  { label: "Health Equity — Foundation Only", icon: "❤️", values: { scanClass: "health_equity", scanFunderType: "private_foundation", scanApplicantType: "all", scanKeywords: "health equity underserved SDOH disparities", scanLowHanging: false } },
  { label: "Workforce Dev — Federal", icon: "👷", values: { scanClass: "workforce_development", scanFunderType: "federal", scanApplicantType: "all", scanKeywords: "workforce training jobs skills development", scanLowHanging: false } },
  { label: "SBIR/STTR — Innovation Money for LLCs", icon: "💡", values: { scanClass: "all", scanFunderType: "federal", scanApplicantType: "for_profit", scanKeywords: "SBIR STTR small business innovation research health technology telehealth", scanLowHanging: false } },
  { label: "State Economic Development", icon: "🏗️", values: { scanClass: "all", scanFunderType: "state", scanApplicantType: "for_profit", scanKeywords: "economic development small business growth incentive matching grants", scanLowHanging: true } },
];

export default function GrantDiscovery() {
  const navigate = useNavigate();
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [auditLog, setAuditLog] = useState([]);
  const [scanTab, setScanTab] = useState("presets");

  // Scan parameters
  const [scanClass, setScanClass] = useState("all");
  const [scanMinAmount, setScanMinAmount] = useState("25000");
  const [scanMaxAmount, setScanMaxAmount] = useState("2500000");
  const [scanDeadlineDays, setScanDeadlineDays] = useState("90");
  const [scanFunderType, setScanFunderType] = useState("all");
  const [scanApplicantType, setScanApplicantType] = useState("all");
  const [scanGeo, setScanGeo] = useState("");
  const [scanKeywords, setScanKeywords] = useState("");
  const [scanLowHanging, setScanLowHanging] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customSearchText, setCustomSearchText] = useState("");

  // CIE scan dimensions
  const [scanOutcomeAreas, setScanOutcomeAreas] = useState([]);
  const [scanPopulations, setScanPopulations] = useState([]);
  const [scanGeographies, setScanGeographies] = useState([]);

  const [newGrant, setNewGrant] = useState({
    title: "", funder: "", deadline: "", award_amount_min: "", award_amount_max: "",
    category: "health_equity", status: "open", description: "", eligibility: "", source_url: ""
  });

  // Tag filters (Step 1)
  const [filterOutcomeAreas, setFilterOutcomeAreas] = useState([]);
  const [filterPopulations, setFilterPopulations] = useState([]);
  const [filterGeographies, setFilterGeographies] = useState([]);
  const [filterFundingTypes, setFilterFundingTypes] = useState([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Track View (Step 3)
  const [trackViewOn, setTrackViewOn] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState("");

  useEffect(() => { loadGrants(); loadTracks(); }, []);

  const loadTracks = async () => {
    const data = await base44.entities.Track.list("-created_date");
    setTracks(data);
  };

  const applyTrack = (trackId) => {
    setSelectedTrackId(trackId);
    const t = tracks.find(t => t.id === trackId);
    if (!t) return;
    setFilterOutcomeAreas(t.outcome_area_filters || []);
    setFilterPopulations(t.population_filters || []);
    setFilterGeographies(t.geography_filters || []);
    setFilterFundingTypes(t.funding_type_filters || []);
  };

  const clearAllFilters = () => {
    setFilterOutcomeAreas([]);
    setFilterPopulations([]);
    setFilterGeographies([]);
    setFilterFundingTypes([]);
    setSelectedTrackId("");
  };

  const hasTagFilters = filterOutcomeAreas.length > 0 || filterPopulations.length > 0 || filterGeographies.length > 0 || filterFundingTypes.length > 0;

  const loadGrants = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Grant.list("-created_date", 200);
      setGrants(data);
    } catch (e) {
      toast.error("Couldn't load grants: " + e.message);
    }
    setLoading(false);
  };

  const applyPreset = (preset) => {
    setScanClass(preset.values.scanClass);
    setScanFunderType(preset.values.scanFunderType);
    setScanApplicantType(preset.values.scanApplicantType);
    setScanKeywords(preset.values.scanKeywords);
    setScanLowHanging(preset.values.scanLowHanging);
  };

  const runDiscovery = async () => {
    setDiscovering(true);
    setAuditLog([]);
    const runId = `run_${Date.now()}`;
    const log = (msg, type = "info") => setAuditLog(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);

    try {
      log(`Starting discovery run ${runId}`);

      const existing = await base44.entities.Grant.list("-created_date", 500);
      const existingTitles = new Set(existing.map(g => g.title?.toLowerCase().trim()));
      const existingFingerprints = new Set(existing.map(g => g.fingerprint).filter(Boolean));
      log(`Exclusion set built: ${existing.length} existing grants`);

      let prompt;

      if (scanTab === "freeform") {
        log(`Mode: Custom Search — "${customSearchText.substring(0, 80)}..."`);
        const lowHangingNote = scanLowHanging ? "\n\nLOW-HANGING FRUIT MODE: Prioritize simple applications, smaller awards (under $150K), rolling deadlines, local/regional funders, and first-time grantee-friendly foundations." : "";
        prompt = `You are the Grant Discovery Agent for GHIS LLC (Global Health Innovation Solutions), a health innovation consultancy serving 14 states.

TODAY'S DATE: ${new Date().toISOString().split("T")[0]}

TASK: Search the web RIGHT NOW for REAL, currently open grant opportunities matching this specific request:

"${customSearchText}"
${lowHangingNote}

CRITICAL RULES:
1. REAL GRANTS ONLY — Search grants.gov, HRSA.gov, CDC.gov, foundation directories, etc. right now. Do NOT hallucinate.
2. SOURCE URL — Must be the actual direct URL to the grant announcement. No generic homepage URLs.
3. DEADLINE MUST BE REAL — Include the actual published deadline. If uncertain, mark needs_verification=true.
4. OPPORTUNITY NUMBER — Include the Grants.gov opportunity number when available.
5. APPLICANT ELIGIBILITY — Clearly state whether LLCs, for-profits, nonprofits, or all entity types are accepted.

DEDUPLICATION: Do NOT return any of these (already in our database):
${[...existingTitles].slice(0, 25).join(" | ")}

Return 5–8 confirmed real opportunities. Return fewer if you cannot find enough — do NOT pad with invented ones.

For each, classify actionability:
- PASS: Real grant, direct URL confirmed, deadline future-dated
- NEEDS_VERIFICATION: Real grant found but URL or eligibility needs manual confirmation
- REJECTED: Cannot confirm real source — DO NOT include these in output`;
      } else {
        log(`Scan: class=${scanClass}, funder=${scanFunderType}, applicant=${scanApplicantType}, deadline=${scanDeadlineDays}d${scanLowHanging ? ", LOW-HANGING" : ""}${scanKeywords ? `, kw="${scanKeywords}"` : ""}`);

        const classFilter = scanClass !== "all"
          ? `Focus specifically on the class: ${CLASS_LABELS[scanClass] || scanClass}.`
          : "Include grants across all classes: Health Equity, Digital Health, Workforce Development, Community Engagement, and Research.";

        const funderTypeFilter = scanFunderType === "federal" ? "FEDERAL FUNDERS ONLY (e.g. HHS, HRSA, CDC, NIH, SAMHSA, DOL, NSF)."
          : scanFunderType === "private_foundation" ? "PRIVATE FOUNDATIONS ONLY (e.g. Robert Wood Johnson, W.K. Kellogg, Gates, Bloomberg, Annie E. Casey, Ford Foundation, etc.). NO federal grants."
          : scanFunderType === "state" ? "STATE GOVERNMENT FUNDERS ONLY."
          : scanFunderType === "corporate" ? "CORPORATE FOUNDATIONS AND CORPORATE CSR GRANTS ONLY."
          : "Include all funder types: federal, private foundation, state, and corporate.";

        const applicantFilter = scanApplicantType === "for_profit" ? "CRITICAL: Only return grants that EXPLICITLY accept for-profit companies, LLCs, or private sector applicants. Skip all nonprofit-only opportunities."
          : scanApplicantType === "nonprofit" ? "Focus on grants open to nonprofits and 501(c)(3) organizations."
          : "Include grants for all applicant types.";

        const lowHangingFilter = scanLowHanging ? `\nLOW-HANGING FRUIT MODE: Prioritize grants that are:\n- Simple application process (letter of inquiry, short application, rolling deadline)\n- Smaller award amounts (under $150K) — easier competition\n- Local/regional funders (less national competition)\n- Capacity-building, planning grants, or seed grants\n- Foundations with history of first-time grantees` : "";

        const keywordFilter = scanKeywords ? `\nKEYWORD FOCUS: Prioritize grants specifically related to: ${scanKeywords}` : "";
        const geoFilter = scanGeo ? `\nGEOGRAPHIC SCOPE: Focus on grants available in or targeting: ${scanGeo}` : "";
        const outcomeFilter = scanOutcomeAreas.length > 0 ? `\nOUTCOME AREAS: Prioritize grants that align with these outcome areas: ${scanOutcomeAreas.join(", ")}` : "";
        const populationFilter = scanPopulations.length > 0 ? `\nPOPULATIONS SERVED: Prioritize grants targeting these populations: ${scanPopulations.join(", ")}` : "";
        const geographyFilter = scanGeographies.length > 0 ? `\nGEOGRAPHIC FOCUS AREAS: Prioritize grants targeting these regions: ${scanGeographies.join(", ")}` : "";

        prompt = `You are the Grant Discovery Agent for GHIS LLC (Global Health Innovation Solutions), a health innovation consultancy serving 14 states.

TODAY'S DATE: ${new Date().toISOString().split("T")[0]}

TASK: Search the web RIGHT NOW for REAL, currently open grant opportunities. Do NOT invent or hallucinate grants.

SCAN PARAMETERS:
- ${classFilter}
- FUNDER TYPE: ${funderTypeFilter}
- APPLICANT TYPE: ${applicantFilter}
- Award range: $${scanMinAmount}–$${scanMaxAmount}
- Deadline: MUST be between ${new Date().toISOString().split("T")[0]} and ${new Date(Date.now() + Number(scanDeadlineDays) * 86400000).toISOString().split("T")[0]} (within ${scanDeadlineDays} days)
${keywordFilter}${geoFilter}${outcomeFilter}${populationFilter}${geographyFilter}${lowHangingFilter}

CRITICAL RULES:
1. REAL GRANTS ONLY — Search grants.gov, HRSA.gov, CDC.gov, SAMHSA.gov, RWJF.org, foundation directories, etc. right now.
2. SOURCE URL — Must be the actual direct URL to the grant announcement. Generic homepage URLs are NOT acceptable.
3. DEADLINE MUST BE REAL — The deadline field must be the actual published deadline. If you cannot confirm the deadline, mark needs_verification=true.
4. OPPORTUNITY NUMBER — Include the real Grants.gov opportunity number when available.
5. APPLICANT ELIGIBILITY — Clearly state whether LLCs, for-profits, nonprofits, or all entity types are accepted.

DEDUPLICATION: Do NOT return any of these (already in our database):
${[...existingTitles].slice(0, 25).join(" | ")}

Return 5–8 confirmed real opportunities. Return fewer if you cannot find enough — do NOT pad with invented ones.

For each, classify actionability:
- PASS: Real grant, direct URL confirmed, deadline within window
- NEEDS_VERIFICATION: Real grant found but URL or eligibility needs manual confirmation
- REJECTED: Cannot confirm real source — DO NOT include these in the output`;
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
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

      let deduped = 0;
      let qualityRejected = 0;
      const today = new Date();
      const toCreate = [];

      for (const g of grantList) {
        const normalizedTitle = g.title?.toLowerCase().trim();
        if (existingTitles.has(normalizedTitle)) {
          log(`DUPLICATE (title): ${g.title}`, "warn");
          deduped++;
          continue;
        }

        const fingerprint = btoa(`${g.funder?.toLowerCase()}_${g.title?.toLowerCase()}`).substring(0, 32);
        if (existingFingerprints.has(fingerprint)) {
          log(`DUPLICATE (fingerprint): ${g.title}`, "warn");
          deduped++;
          continue;
        }

        const url = g.source_url || "";
        const hasRealUrl = url.length > 10 && (
          url.includes("grants.gov") || url.includes(".gov") || url.includes(".org") || url.includes("https://")
        ) && !url.includes("example.com") && !url.endsWith(".gov") && !url.endsWith(".org");

        if (!hasRealUrl) {
          log(`⚠️ QUALITY FLAG (no direct URL): ${g.title}`, "warn");
          g.actionability = "NEEDS_VERIFICATION";
        }

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
        } else {
          log(`⚠️ QUALITY FLAG (no deadline): ${g.title}`, "warn");
          g.actionability = "NEEDS_VERIFICATION";
        }

        toCreate.push({
          ...g,
          status: "open",
          posted_date: new Date().toISOString().split("T")[0],
          fingerprint,
        });
        log(`✅ PASSED: ${g.title} | ${g.deadline} | ${g.actionability || "PASS"}`, "success");
      }

      if (toCreate.length > 0) await base44.entities.Grant.bulkCreate(toCreate);
      const created = toCreate.length;

      if (qualityRejected > 0) log(`🚫 Quality filter blocked ${qualityRejected} grants`, "warn");
      for (const r of rejected) log(`REJECTED: ${r.title}: ${r.rejection_reason}`, "error");

      log(`Run complete: ${created} new grants added, ${deduped} duplicates blocked`, "success");
      if (created > 0) {
        toast.success(`Found ${created} new opportunities!`, {
          action: { label: "Score them →", onClick: () => navigate("/assessment") },
          duration: 8000,
        });
      } else {
        toast.info("No new opportunities found this time. Try different filters.");
      }
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
    setNewGrant({ title: "", funder: "", deadline: "", award_amount_min: "", award_amount_max: "", status: "open", description: "", eligibility: "", source_url: "", outcome_areas: [], populations_served: [], geographies: [], funding_type: null });
    await loadGrants();
  };

  const filtered = grants.filter(g => {
    const matchSearch = !search || g.title?.toLowerCase().includes(search.toLowerCase()) || g.funder?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || g.category === categoryFilter;
    const matchStatus = statusFilter === "all" || g.status === statusFilter;
    // AND across dimensions, OR within dimension
    const matchOutcome = filterOutcomeAreas.length === 0 || (g.outcome_areas || []).some(v => filterOutcomeAreas.includes(v));
    const matchPop = filterPopulations.length === 0 || (g.populations_served || []).some(v => filterPopulations.includes(v));
    const matchGeo = filterGeographies.length === 0 || (g.geographies || []).some(v => filterGeographies.includes(v));
    const matchFunding = filterFundingTypes.length === 0 || filterFundingTypes.includes(g.funding_type);
    return matchSearch && matchCat && matchStatus && matchOutcome && matchPop && matchGeo && matchFunding;
  });

  const logColors = { info: "text-slate-500", success: "text-emerald-600", warn: "text-amber-600", error: "text-red-600" };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Find Funding</h1>
          <p className="text-slate-500 text-sm">Search for funding that fits your work · {grants.length} found so far</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add My Own
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => {
            const rows = [["Title", "Funder", "Category", "Deadline", "Award Min", "Award Max", "Status"]];
            grants.forEach(g => rows.push([g.title, g.funder, g.category || "", g.deadline || "", g.award_amount_min || "", g.award_amount_max || "", g.status]));
            const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
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
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-500" /> What Are You Looking For?
            </CardTitle>
            {scanTab === "filters" && (
              <button
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-md px-2.5 py-1 bg-white"
                onClick={() => setShowAdvanced(v => !v)}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {showAdvanced ? "Fewer Options" : "More Options"}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Tab switcher */}
          <div className="flex flex-wrap border border-slate-200 rounded-lg p-1 bg-slate-50 w-fit gap-1">
            <button
              onClick={() => setScanTab("presets")}
              className={`px-4 py-1.5 text-xs rounded-md font-medium transition-colors ${scanTab === "presets" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              ⚡ Quick Presets
            </button>
            <button
              onClick={() => setScanTab("filters")}
              className={`px-4 py-1.5 text-xs rounded-md font-medium transition-colors ${scanTab === "filters" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              🔧 Filter & Search
            </button>
            <button
              onClick={() => setScanTab("freeform")}
              className={`px-4 py-1.5 text-xs rounded-md font-medium transition-colors ${scanTab === "freeform" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              ✏️ Just Type It
            </button>
            <button
              onClick={() => setScanTab("url")}
              className={`px-4 py-1.5 text-xs rounded-md font-medium transition-colors ${scanTab === "url" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              🔗 Paste a Link
            </button>
          </div>

          {/* ── QUICK PRESETS TAB ── */}
          {scanTab === "presets" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">Choose a preset to instantly configure a search — then hit Search Now.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESETS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => { applyPreset(p); setScanTab("filters"); }}
                    className="flex items-center gap-3 text-left px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
                  >
                    <span className="text-2xl">{p.icon}</span>
                    <span className="text-sm font-medium">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── GUIDED FILTERS TAB ── */}
          {scanTab === "filters" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Class / Topic</label>
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
                  <label className="text-xs text-slate-500 mb-1 block">Funder Type</label>
                  <Select value={scanFunderType} onValueChange={setScanFunderType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Funders</SelectItem>
                      <SelectItem value="federal">Federal Only</SelectItem>
                      <SelectItem value="private_foundation">Private Foundation</SelectItem>
                      <SelectItem value="state">State Government</SelectItem>
                      <SelectItem value="corporate">Corporate / CSR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Applicant Type</label>
                  <Select value={scanApplicantType} onValueChange={setScanApplicantType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Applicants</SelectItem>
                      <SelectItem value="for_profit">For-Profit / LLC</SelectItem>
                      <SelectItem value="nonprofit">Nonprofit / 501c3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Deadline Window (days)</label>
                  <Input value={scanDeadlineDays} onChange={e => setScanDeadlineDays(e.target.value)} type="number" />
                </div>
              </div>

              {/* CIE Dimensions — always visible */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <ChipSelector
                  label="Outcome Areas"
                  options={["Health Equity","Leadership Development","Veterans","Workforce Development","Economic Mobility","Food Security","Climate Adaptation","Digital Equity","Housing","Education"]}
                  value={scanOutcomeAreas}
                  onChange={setScanOutcomeAreas}
                />
                <ChipSelector
                  label="Populations Served"
                  options={["Veterans","Alumni","Youth","BIPOC Communities","Women","Immigrants","Rural Communities","People with Disabilities","Seniors"]}
                  value={scanPopulations}
                  onChange={setScanPopulations}
                />
                <ChipSelector
                  label="Geographies"
                  options={["National","Regional","State-Specific","International","Southwest","Southeast","Midwest","Northeast","West Coast"]}
                  value={scanGeographies}
                  onChange={setScanGeographies}
                />
              </div>

              {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Min Amount ($)</label>
                    <Input value={scanMinAmount} onChange={e => setScanMinAmount(e.target.value)} type="number" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Max Amount ($)</label>
                    <Input value={scanMaxAmount} onChange={e => setScanMaxAmount(e.target.value)} type="number" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Additional Geographic Notes</label>
                    <Input value={scanGeo} onChange={e => setScanGeo(e.target.value)} placeholder="e.g. Southeast US, Texas, rural..." />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-xs text-slate-500 mb-1 block">Keyword Focus</label>
                    <Textarea
                      value={scanKeywords}
                      onChange={e => setScanKeywords(e.target.value)}
                      placeholder="e.g. digital equity, broadband, telehealth, SDOH, maternal health, workforce training..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                  <input
                    type="checkbox"
                    checked={scanLowHanging}
                    onChange={e => setScanLowHanging(e.target.checked)}
                    className="rounded border-slate-300 accent-emerald-600"
                  />
                  <span className="text-slate-700 font-medium">🍎 Low-hanging fruit mode</span>
                  <span className="text-xs text-slate-400">(prioritize simple apps, small awards, less competition)</span>
                </label>
                <Button onClick={runDiscovery} disabled={discovering} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                  {discovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {discovering ? "Searching..." : "Search Now"}
                </Button>
              </div>
            </div>
          )}

          {/* ── CUSTOM SEARCH TAB ── */}
          {scanTab === "freeform" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Describe exactly what you're looking for in plain English. Useful for niche areas, cross-sector topics, or anything not covered by the guided filters. The AI will search the web based on your description.
              </p>
              <Textarea
                value={customSearchText}
                onChange={e => setCustomSearchText(e.target.value)}
                placeholder={"Examples:\n• Find private foundation grants for digital literacy programs targeting rural communities in the Southeast, $50K–$200K, open to LLCs\n• Search for entrepreneurship and small business innovation grants in health tech with rolling deadlines\n• Federal SBIR/STTR opportunities related to maternal health or telehealth for Q3 2026\n• Environmental justice or climate resilience grants open to for-profit consultancies\n• HBCU partnerships, minority business grants, or DEI-focused corporate foundations"}
                rows={7}
                className="text-sm"
              />
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                  <input
                    type="checkbox"
                    checked={scanLowHanging}
                    onChange={e => setScanLowHanging(e.target.checked)}
                    className="rounded border-slate-300 accent-emerald-600"
                  />
                  <span className="text-slate-700 font-medium">🍎 Low-hanging fruit mode</span>
                  <span className="text-xs text-slate-400">(prefer simple apps & smaller awards)</span>
                </label>
                <Button
                  onClick={runDiscovery}
                  disabled={discovering || !customSearchText.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2 ml-auto"
                >
                  {discovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {discovering ? "Searching..." : "Search Now"}
                </Button>
              </div>
            </div>
          )}

          {/* ── PASTE A LINK TAB ── */}
          {scanTab === "url" && <UrlImport onSaved={loadGrants} />}

        </CardContent>
      </Card>

      {/* Audit Log */}
      {auditLog.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" /> Search Activity
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

      {/* Track View Toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => { setTrackViewOn(v => !v); if (trackViewOn) { setSelectedTrackId(""); clearAllFilters(); } }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${trackViewOn ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400"}`}
        >
          <Layers className="w-4 h-4" /> Track View
        </button>
        {trackViewOn && (
          <Select value={selectedTrackId} onValueChange={applyTrack}>
            <SelectTrigger className="w-56 bg-white"><SelectValue placeholder="Select a Track…" /></SelectTrigger>
            <SelectContent>
              {tracks.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {trackViewOn && selectedTrackId && (
          <span className="text-xs text-slate-500">Filters pre-loaded from track — refine below if needed.</span>
        )}
      </div>

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
        <button
          onClick={() => setShowFilterPanel(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${showFilterPanel || hasTagFilters ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters {hasTagFilters && `(${filterOutcomeAreas.length + filterPopulations.length + filterGeographies.length + filterFundingTypes.length})`}
        </button>
        {hasTagFilters && (
          <button onClick={clearAllFilters} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
            <X className="w-3 h-3" /> Clear All
          </button>
        )}
        <p className="self-center text-sm text-slate-500 ml-auto">{filtered.length} grants</p>
      </div>

      {/* Collapsible Filter Panel */}
      {showFilterPanel && (
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="pt-4 space-y-4">
            <ChipSelector
              label="Outcome Areas"
              options={["Health Equity","Leadership Development","Veterans","Workforce Development","Economic Mobility","Food Security","Climate Adaptation","Digital Equity","Housing","Education"]}
              value={filterOutcomeAreas}
              onChange={setFilterOutcomeAreas}
            />
            <ChipSelector
              label="Populations Served"
              options={["Veterans","Alumni","Youth","BIPOC Communities","Women","Immigrants","Rural Communities","People with Disabilities","Seniors"]}
              value={filterPopulations}
              onChange={setFilterPopulations}
            />
            <ChipSelector
              label="Geographies"
              options={["National","Regional","State-Specific","International","Southwest","Southeast","Midwest","Northeast","West Coast"]}
              value={filterGeographies}
              onChange={setFilterGeographies}
            />
            <ChipSelector
              label="Funding Type"
              options={["federal_grant","family_foundation","private_foundation","hnwi","major_gift","corporate_giving"]}
              value={filterFundingTypes}
              onChange={setFilterFundingTypes}
            />
          </CardContent>
        </Card>
      )}

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
                      {((grant.outcome_areas?.length > 0) || (grant.populations_served?.length > 0) || (grant.geographies?.length > 0)) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(grant.outcome_areas || []).slice(0, 2).map(t => <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100">{t}</span>)}
                          {(grant.populations_served || []).slice(0, 1).map(t => <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-100">{t}</span>)}
                          {(grant.geographies || []).slice(0, 1).map(t => <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200">{t}</span>)}
                        </div>
                      )}
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
                <tr><td colSpan={7} className="px-4 py-16 text-center text-slate-400">Nothing here yet. Run a search above to find funding.</td></tr>
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
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <ChipSelector label="Outcome Areas" options={["Health Equity","Leadership Development","Veterans","Workforce Development","Economic Mobility","Food Security","Climate Adaptation","Digital Equity","Housing","Education"]} value={selected.outcome_areas || []} onChange={async v => { await base44.entities.Grant.update(selected.id, { outcome_areas: v }); setSelected(s => ({...s, outcome_areas: v})); }} />
                <ChipSelector label="Populations Served" options={["Veterans","Alumni","Youth","BIPOC Communities","Women","Immigrants","Rural Communities","People with Disabilities","Seniors"]} value={selected.populations_served || []} onChange={async v => { await base44.entities.Grant.update(selected.id, { populations_served: v }); setSelected(s => ({...s, populations_served: v})); }} />
                <ChipSelector label="Geographies" options={["National","Regional","State-Specific","International","Southwest","Southeast","Midwest","Northeast","West Coast"]} value={selected.geographies || []} onChange={async v => { await base44.entities.Grant.update(selected.id, { geographies: v }); setSelected(s => ({...s, geographies: v})); }} />
                <ChipSelector label="Funding Type" options={["federal_grant","family_foundation","private_foundation","hnwi","major_gift","corporate_giving"]} value={selected.funding_type ? [selected.funding_type] : []} onChange={async v => { const val = v[v.length - 1] || null; await base44.entities.Grant.update(selected.id, { funding_type: val }); setSelected(s => ({...s, funding_type: val})); }} single />
              </div>
              <div className="flex gap-3 pt-2 flex-wrap">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => addToApplication(selected)}>
                  Add to My List
                </Button>
                {selected.source_url && (
                  <Button variant="outline" className="gap-2" onClick={() => window.open(selected.source_url, "_blank")}>
                    <ExternalLink className="w-4 h-4" /> Source
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
                  onClick={() => window.open(`https://www.grants.gov/search-grants?query=${encodeURIComponent(selected.title)}`, "_blank")}
                >
                  <ShieldCheck className="w-4 h-4" /> Verify on Grants.gov
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Manual Grant Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Your Own</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Grant title *" value={newGrant.title} onChange={e => setNewGrant(p => ({...p, title: e.target.value}))} />
            <Input placeholder="Funder *" value={newGrant.funder} onChange={e => setNewGrant(p => ({...p, funder: e.target.value}))} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Min award $" type="number" value={newGrant.award_amount_min} onChange={e => setNewGrant(p => ({...p, award_amount_min: e.target.value}))} />
              <Input placeholder="Max award $" type="number" value={newGrant.award_amount_max} onChange={e => setNewGrant(p => ({...p, award_amount_max: e.target.value}))} />
            </div>
            <Input type="date" value={newGrant.deadline} onChange={e => setNewGrant(p => ({...p, deadline: e.target.value}))} />
            <ChipSelector label="Outcome Areas" options={["Health Equity","Leadership Development","Veterans","Workforce Development","Economic Mobility","Food Security","Climate Adaptation","Digital Equity","Housing","Education"]} value={newGrant.outcome_areas || []} onChange={v => setNewGrant(p => ({...p, outcome_areas: v}))} />
            <ChipSelector label="Populations Served" options={["Veterans","Alumni","Youth","BIPOC Communities","Women","Immigrants","Rural Communities","People with Disabilities","Seniors"]} value={newGrant.populations_served || []} onChange={v => setNewGrant(p => ({...p, populations_served: v}))} />
            <ChipSelector label="Geographies" options={["National","Regional","State-Specific","International","Southwest","Southeast","Midwest","Northeast","West Coast"]} value={newGrant.geographies || []} onChange={v => setNewGrant(p => ({...p, geographies: v}))} />
            <ChipSelector label="Funding Type" options={["federal_grant","family_foundation","private_foundation","hnwi","major_gift","corporate_giving"]} value={newGrant.funding_type ? [newGrant.funding_type] : []} onChange={v => setNewGrant(p => ({...p, funding_type: v[v.length - 1] || null}))} single />
            <Input placeholder="Source URL (direct application link)" value={newGrant.source_url} onChange={e => setNewGrant(p => ({...p, source_url: e.target.value}))} />
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={saveNewGrant} disabled={!newGrant.title || !newGrant.funder}>Add It</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}