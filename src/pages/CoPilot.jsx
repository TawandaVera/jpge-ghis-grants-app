import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, CheckCircle2, AlertTriangle, Loader2, Wand2, RefreshCw, Save, ChevronRight, ExternalLink } from "lucide-react";
import FinalPackStage from "@/components/copilot/FinalPackStage";
import ContentQAPanel from "@/components/copilot/ContentQAPanel";
import Stage6Draft from "@/components/copilot/Stage6Draft";
import StageGuide from "@/components/copilot/StageGuide";
import { toast } from "sonner";
import { SECTION_KEYS, COPILOT_STAGES as STAGES } from "@/lib/grantConstants";

export default function CoPilot() {
  const [currentStage, setCurrentStage] = useState(1);
  const [narrativeText, setNarrativeText] = useState("");
  const [parsedBlocks, setParsedBlocks] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [hilPending, setHilPending] = useState(true);
  const [orgProfile, setOrgProfile] = useState(null);
  const [grants, setGrants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [sections, setSections] = useState({});
  const [drafting, setDrafting] = useState(null);
  const [editingBlock, setEditingBlock] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [savedNarratives, setSavedNarratives] = useState([]);
  const [sectionMap, setSectionMap] = useState({});
  const [highQuality, setHighQuality] = useState(true);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef();

  const toggleMapping = (sectionKey, blockName) => {
    setSectionMap(prev => {
      const current = prev[sectionKey] || [];
      const next = current.includes(blockName)
        ? current.filter(b => b !== blockName)
        : [...current, blockName];
      return { ...prev, [sectionKey]: next };
    });
  };

  useEffect(() => {
    loadAll();
    // If arriving from tracker/assessment with a pre-selected app, auto-advance to drafting
    const params = new URLSearchParams(window.location.search);
    const appId = params.get("app_id");
    if (appId) {
      setCurrentStage(3);
    }
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [profiles, g, m, a, narratives] = await Promise.all([
      base44.entities.OrgProfile.list(),
      base44.entities.Grant.list("-created_date", 100),
      base44.entities.GrantMatch.list("-total_score", 200),
      base44.entities.GrantApplication.list("-created_date", 100),
      base44.entities.MasterNarrative.list(),
    ]);
    setOrgProfile(profiles[0] || null);
    setGrants(g);
    setMatches(m.filter(mm => ["GO", "PREP"].includes(mm.recommendation)));
    setApplications(a);
    setSavedNarratives(narratives);
    if (narratives.length > 0) {
      const blocks = narratives.map(n => ({ section: n.section, content: n.content, approved: n.approved }));
      setParsedBlocks(blocks);
      setHilPending(false);
    }
    // Auto-select if coming from tracker/assessment
    const params = new URLSearchParams(window.location.search);
    const appId = params.get("app_id");
    if (appId) {
      const app = a.find(ap => ap.id === appId);
      if (app) {
        setSelectedApp(app);
        setSections(app.sections || {});
        const grant = g.find(gr => gr.id === app.grant_id);
        if (grant) setSelectedGrant({ id: grant.id, title: grant.title, funder: grant.funder, description: grant.description, eligibility: grant.eligibility, deadline: grant.deadline });
        setCurrentStage(6);
      }
    }
    setLoading(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setNarrativeText(ev.target.result);
    reader.readAsText(file);
  };

  const parseNarrative = async () => {
    if (!narrativeText.trim()) { toast.error("Please upload or paste narrative text"); return; }
    setParsing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Parse this organizational narrative into structured content blocks for grant writing.
        
NARRATIVE:
${narrativeText.substring(0, 4000)}

Extract 8-12 distinct content blocks. Each block should be a specific, reusable piece of organizational content such as:
- Mission Statement, Org Overview, Capacity Statement, Program Description, 
- Need Statement, Evaluation Plan, Budget Narrative, Sustainability Plan, 
- Past Performance, Partnerships, Innovation, Target Population, etc.`,
        response_json_schema: {
          type: "object",
          properties: {
            blocks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  section: { type: "string" },
                  content: { type: "string" },
                  verified: { type: "boolean" }
                }
              }
            }
          }
        }
      });
      setParsedBlocks(result.blocks || []);
      setHilPending(true);
      toast.success(`Parsed ${result.blocks?.length || 0} content blocks`);
    } catch(e) {
      toast.error("Parse failed: " + e.message);
    }
    setParsing(false);
  };

  const approveAndSave = async () => {
    for (const block of parsedBlocks) {
      await base44.entities.MasterNarrative.create({
        section: block.section,
        content: block.content,
        approved: true,
        version: "1.0.0"
      });
    }
    setHilPending(false);
    toast.success("Saved! Your story is ready to use.");
    setCurrentStage(2);
  };

  const saveBlock = async () => {
    if (editingBlock === null) return;
    const updated = [...parsedBlocks];
    updated[editingBlock] = { ...updated[editingBlock], content: editContent };
    setParsedBlocks(updated);
    setEditingBlock(null);
    toast.success("Block updated");
  };

  const draftSection = async (sectionKey) => {
    if (!selectedApp || !selectedGrant) { toast.error("Select an application first"); return; }
    setDrafting(sectionKey);
    try {
      // Load prior completed proposals as reusable context (skip current app)
      const priorProposals = applications
        .filter(a => a.id !== selectedApp?.id && a.proposal_text && a.proposal_text.length > 100)
        .slice(0, 2) // max 2 prior proposals to keep tokens manageable
        .map(a => `[PRIOR PROPOSAL — ${a.grant_title} / ${a.funder}]:\n${a.proposal_text.substring(0, 800)}`)
        .join("\n\n");

      // Prefer blocks the user explicitly mapped to this section; otherwise use all blocks
      const mappedNames = sectionMap[sectionKey] || [];
      const relevantBlocks = mappedNames.length > 0
        ? parsedBlocks.filter(b => mappedNames.includes(b.section))
        : parsedBlocks;
      const blockContext = relevantBlocks.length > 0
        ? relevantBlocks.map(b => `[${b.section}]:\n${b.content?.substring(0, 500)}`).join("\n\n")
        : "No master narrative blocks available — rely on org profile data below.";

      // Org profile context
      const orgCtx = orgProfile ? `
ORG NAME: ${orgProfile.org_name}
MISSION: ${orgProfile.mission}
FOCUS AREAS: ${(orgProfile.focus_areas || []).join(", ")}
GEOGRAPHIC COVERAGE: ${(orgProfile.geographic_coverage || []).join(", ")}
ANNUAL BUDGET: $${orgProfile.annual_budget?.toLocaleString() || "N/A"}
STAFF COUNT: ${orgProfile.staff_count || "N/A"}
EIN: ${orgProfile.ein || "N/A"} | UEI: ${orgProfile.duns_uei || "N/A"}
INDIRECT COST RATE: ${orgProfile.indirect_cost_rate || "N/A"}%
PAST PERFORMANCE: ${orgProfile.past_performance || "N/A"}
CERTIFICATIONS: ${(orgProfile.compliance_certifications || []).join(", ") || "N/A"}
CAPACITY NOTES: ${orgProfile.capacity_notes || "N/A"}`.trim()
        : "JPGE — health grant management organization.";

      // Match/assessment rationale if available
      const matchData = matches.find(mm => mm.grant_id === selectedGrant.id);
      const matchCtx = matchData ? `
ASSESSMENT SCORE: ${matchData.total_score}/100 (${matchData.recommendation})
MANDATE ALIGNMENT: ${matchData.mandate_alignment}/40
STRENGTHS: ${(matchData.strengths || []).join("; ")}
CONCERNS: ${(matchData.concerns || []).join("; ")}
AI RATIONALE: ${matchData.rationale || "N/A"}`.trim() : "";

      // Already-drafted sections for cross-referencing
      const draftedCtx = Object.entries(sections)
        .filter(([k, v]) => k !== sectionKey && v)
        .map(([k, v]) => `[ALREADY DRAFTED — ${k.replace(/_/g, " ").toUpperCase()}]:\n${v.substring(0, 400)}`)
        .join("\n\n");

      const sectionGuidance = {
        executive_summary: "Write a 200-300 word executive summary. Lead with the funding ask, then the problem, your approach, and expected outcomes. Do NOT use generic boilerplate.",
        needs_statement: "Write a 400-600 word needs statement using data and evidence. Reference specific communities, health disparities, or workforce gaps. Cite relevant statistics where possible.",
        goals_objectives: "Write 2-3 SMART goals with 2-3 measurable objectives each. Use action verbs. Tie directly to funder priorities.",
        methodology: "Describe the program model, activities, timeline, and partnerships. Be specific about what will happen, when, and how.",
        evaluation_plan: "Describe data collection methods, metrics, milestones, and how success will be measured. Reference logic model if applicable.",
        organizational_capacity: "DO NOT repeat org info already stated in other sections. Focus on unique capacity, credentials, past grants, partnerships, and why this org can execute this specific project.",
        budget_narrative: `Reference the org's indirect cost rate of ${orgProfile?.indirect_cost_rate || "N/A"}% and fringe rate of ${orgProfile?.fringe_rate || "N/A"}%. Justify major budget line items. Keep to requested award range.`,
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert grant writer for JPGE-GMS producing a FINAL, submission-ready proposal section.

SECTION TO WRITE: ${sectionKey.replace(/_/g, " ").toUpperCase()}
WRITING GUIDANCE: ${sectionGuidance[sectionKey] || "Write a compelling, evidence-based 300-500 word section."}

═══ GRANT OPPORTUNITY ═══
TITLE: ${selectedGrant.title}
FUNDER: ${selectedGrant.funder}
DESCRIPTION: ${selectedGrant.description || "N/A"}
ELIGIBILITY: ${selectedGrant.eligibility || "N/A"}
DEADLINE: ${selectedGrant.deadline || "N/A"}

═══ ORGANIZATION PROFILE (DO NOT ASK USER TO FILL THIS IN — DRAW FROM THIS DATA) ═══
${orgCtx}

${matchCtx ? `═══ ASSESSMENT INTELLIGENCE ═══\n${matchCtx}\n` : ""}
═══ MASTER NARRATIVE LIBRARY (DRAW FROM THESE BLOCKS) ═══
${blockContext}

${draftedCtx ? `═══ ALREADY DRAFTED SECTIONS (avoid repetition) ═══\n${draftedCtx}\n` : ""}${priorProposals ? `═══ PRIOR FUNDED PROPOSALS (reference for tone, structure, and language patterns) ═══\n${priorProposals}\n` : ""}
CRITICAL RULES:
1. Write in first person ("Our organization will..." or "We will...")
2. NEVER use placeholder text like [INSERT NAME] or [TBD]
3. Pull specific details from the org profile above — mission, certifications, geography, past performance
4. Tailor language to the specific funder's stated priorities
5. Write in the voice of the organization — professional, specific, evidence-based
6. This is a FINAL draft, not a template — it must be submission-ready
7. Target word count: 350-550 words for most sections`,
        response_json_schema: {
          type: "object",
          properties: { content: { type: "string" } }
        },
        ...(highQuality ? { model: "claude_sonnet_4_6" } : {})
      });

      const updatedSections = { ...sections, [sectionKey]: result.content };
      setSections(updatedSections);
      await base44.entities.GrantApplication.update(selectedApp.id, { sections: updatedSections });
      toast.success(`${sectionKey.replace(/_/g, " ")} drafted`);
    } catch(e) {
      toast.error("Draft failed: " + e.message);
    }
    setDrafting(null);
  };

  const progress = Math.round((currentStage / 8) * 100);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Step Navigation */}
      <div className="bg-slate-800 text-white sticky top-0 z-10 shadow-md">
        <div className="px-4 py-3 flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <span className="text-xs text-slate-400 font-semibold shrink-0 hidden sm:block">Write with AI:</span>
          {STAGES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentStage(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                currentStage === s.id
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              }`}
            >
              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold shrink-0 ${
                currentStage === s.id ? "bg-white text-emerald-600" : "bg-slate-700 text-slate-400"
              }`}>{s.id}</span>
              <span className="hidden md:inline">{s.label}</span>
            </button>
          ))}
          <div className="ml-auto shrink-0 flex items-center gap-3 pl-3 border-l border-slate-700">
            <button
              onClick={() => setHighQuality(q => !q)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              title="High-quality mode uses a premium AI model — better drafts, more integration credits per section"
            >
              <span className="hidden sm:inline">Best Quality</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${highQuality ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-400"}`}>
                {highQuality ? "ON" : "OFF"}
              </span>
            </button>
            <span className="text-xs text-slate-500">{currentStage}/8</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-slate-700">
          <div className="h-0.5 bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Stage 1: Master Narrative */}
        {currentStage === 1 && (
          <div className="p-6 max-w-6xl mx-auto space-y-5">
            <StageGuide stageId={1} />
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Step 1: Add Your Story</h2>
                <p className="text-slate-500 text-sm">Add your past write-ups so the AI can sound like you</p>
              </div>
              {hilPending && parsedBlocks.length > 0 && (
                <Badge className="bg-red-100 text-red-700 border border-red-200">Please Review</Badge>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Upload */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Add Your Write-Ups</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div
                      className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-600">Drop PDF, DOCX, or TXT</p>
                      <p className="text-xs text-slate-400">or click to browse</p>
                      <input ref={fileRef} type="file" accept=".txt,.docx,.pdf" className="hidden" onChange={handleFileUpload} />
                    </div>
                    <p className="text-xs text-slate-400 text-center">Or paste text</p>
                    <Textarea
                      placeholder="Paste your past write-ups here..."
                      value={narrativeText}
                      onChange={e => setNarrativeText(e.target.value)}
                      className="min-h-32 text-sm"
                    />
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={parseNarrative} disabled={parsing}>
                      {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                      {parsing ? "Reading..." : "Break It Down"}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Parsed Blocks */}
              <div>
                <ContentQAPanel parsedBlocks={parsedBlocks} onUpdateBlocks={setParsedBlocks} />
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {parsedBlocks.map((block, i) => (
                    <Card key={i} className="border-slate-200">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-medium text-sm text-slate-800">{block.section}</p>
                          <div className="flex items-center gap-1 shrink-0">
                            {block.verified && <Badge className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">Check This</Badge>}
                            <button
                              onClick={() => { setEditingBlock(i); setEditContent(block.content); }}
                              className="text-xs text-emerald-600 hover:underline"
                            >Edit</button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-3">{block.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                  {parsedBlocks.length === 0 && (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      Add your write-ups above and click "Break It Down"
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* HIL Checkpoint */}
            {hilPending && parsedBlocks.length > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <p className="font-semibold text-amber-800 mb-1">Quick Check Before Moving On</p>
                  <p className="text-sm text-amber-700 mb-3">Take a look at what we pulled out, then continue</p>
                  <div className="flex gap-2">
                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={approveAndSave}>Approve & Continue</Button>
                    <Button variant="outline" onClick={() => setHilPending(false)}>Edit</Button>
                    <Button variant="outline" onClick={parseNarrative} disabled={parsing}>
                      <RefreshCw className="w-4 h-4 mr-2" />Regenerate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Stage 2: Org Profile — managed in the dedicated Org Profile page */}
        {currentStage === 2 && (
          <div className="p-6 max-w-2xl mx-auto space-y-5">
            <StageGuide stageId={2} />
            <div>
              <h2 className="text-xl font-bold text-slate-900">Step 2: Your Org Info</h2>
              <p className="text-slate-500 text-sm">Make sure your organization's details are up to date</p>
            </div>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-5 space-y-3">
                <p className="text-blue-800 font-medium text-sm">Your Org Profile is managed in the dedicated Org Profile section.</p>
                {orgProfile ? (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-500">Org:</span> <span className="font-medium text-slate-800">{orgProfile.org_name}</span></div>
                    <div><span className="text-slate-500">EIN:</span> <span className="font-medium text-slate-800">{orgProfile.ein || "—"}</span></div>
                    <div><span className="text-slate-500">Indirect:</span> <span className="font-medium text-slate-800">{orgProfile.indirect_cost_rate ? `${orgProfile.indirect_cost_rate}%` : "—"}</span></div>
                    <div><span className="text-slate-500">Budget:</span> <span className="font-medium text-slate-800">{orgProfile.annual_budget ? `$${orgProfile.annual_budget.toLocaleString()}` : "—"}</span></div>
                    <div className="col-span-2 text-slate-600 text-xs mt-1 line-clamp-2">{orgProfile.mission}</div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No org profile set up yet.</p>
                )}
                <Link to="/org-profile" target="_blank">
                  <Button variant="outline" size="sm" className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-100">
                    <ExternalLink className="w-3.5 h-3.5" /> Open Org Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setCurrentStage(3)}>
              Looks Good — Next Step <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Stage 3: Opportunity Intake */}
        {currentStage === 3 && (
          <div className="p-6 max-w-4xl mx-auto space-y-5">
            <StageGuide stageId={3} />
            <div>
              <h2 className="text-xl font-bold text-slate-900">Step 3: Pick One</h2>
              <p className="text-slate-500 text-sm">Choose a good match to apply for — or pick up one you already started</p>
            </div>

            {/* Existing applications in writing stage */}
            {applications.filter(a => ["writing", "compliance_check", "review", "hil_review", "submission_ready"].includes(a.stage)).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Already Started</p>
                <div className="space-y-2">
                  {applications.filter(a => ["writing", "compliance_check", "review", "hil_review", "submission_ready"].includes(a.stage)).map(app => (
                    <Card
                      key={app.id}
                      className={`cursor-pointer transition-all border-2 ${selectedApp?.id === app.id ? "border-purple-400 bg-purple-50" : "border-transparent hover:border-purple-200"}`}
                      onClick={() => {
                        setSelectedApp(app);
                        setSections(app.sections || {});
                        const grant = grants.find(g => g.id === app.grant_id);
                        if (grant) setSelectedGrant({ id: grant.id, title: grant.title, funder: grant.funder, description: grant.description, eligibility: grant.eligibility, deadline: grant.deadline });
                      }}
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{app.grant_title}</p>
                          <p className="text-xs text-slate-500">{app.funder} · {Object.keys(app.sections || {}).length} parts written</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{
                            { discovery: "Found", assessment: "Scored", writing: "Writing", compliance_check: "Checking", budget: "Budget", review: "Reviewing", hil_review: "Final Review", submission_ready: "Ready", submitted: "Sent In", awarded: "Won!", declined: "Not This Time" }[app.stage] || app.stage?.replace(/_/g, " ")
                          }</Badge>
                          {selectedApp?.id === app.id && <CheckCircle2 className="w-5 h-5 text-purple-600" />}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Assessed GO/PREP grants */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Your Best Matches</p>
              {matches.length === 0 && <p className="text-slate-400 text-sm">No good matches yet. Score some matches first.</p>}
              <div className="space-y-2">
                {matches.map(m => {
                  const inPipeline = applications.find(a => a.grant_id === m.grant_id);
                  return (
                    <Card
                      key={m.id}
                      className={`cursor-pointer transition-all border-2 ${selectedGrant?.id === m.grant_id && !selectedApp ? "border-emerald-400 bg-emerald-50" : "border-transparent hover:border-emerald-200"}`}
                      onClick={() => {
                        const grant = grants.find(g => g.id === m.grant_id);
                        setSelectedGrant({ id: m.grant_id, title: m.grant_title, funder: m.funder, description: grant?.description, eligibility: grant?.eligibility, deadline: m.deadline });
                        if (inPipeline) { setSelectedApp(inPipeline); setSections(inPipeline.sections || {}); }
                        else { setSelectedApp(null); setSections({}); }
                      }}
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{m.grant_title}</p>
                          <p className="text-xs text-slate-500">{m.funder} · Due: {m.deadline}</p>
                          {m.rationale && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{m.rationale}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className="font-bold text-emerald-700 text-sm">{Math.round(m.total_score)}%</span>
                          <Badge className={`text-xs border ${m.recommendation === "GO" ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-blue-100 text-blue-800 border-blue-300"}`}>{m.recommendation === "GO" ? "Great Fit" : "Worth a Look"}</Badge>
                          {inPipeline && <Badge variant="outline" className="text-xs">On Your List</Badge>}
                          {selectedGrant?.id === m.grant_id && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {selectedGrant && (
              <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={async () => {
                if (!selectedApp) {
                  const app = await base44.entities.GrantApplication.create({
                    grant_id: selectedGrant.id,
                    grant_title: selectedGrant.title,
                    funder: selectedGrant.funder,
                    deadline: selectedGrant.deadline,
                    stage: "writing",
                  });
                  setSelectedApp(app);
                }
                setCurrentStage(6);
              }}>
                {selectedApp ? "Keep Writing" : "Start Writing"}: {selectedGrant.title} <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Stage 4: Application List — managed in the dedicated Track Progress page */}
        {currentStage === 4 && (
          <div className="p-6 max-w-2xl mx-auto space-y-5">
            <StageGuide stageId={4} />
            <div>
              <h2 className="text-xl font-bold text-slate-900">Step 4: Your List</h2>
              <p className="text-slate-500 text-sm">See where your applications stand</p>
            </div>
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-5 space-y-3">
                <p className="text-purple-800 font-medium text-sm">See all your applications and move them along on the Track Progress page.</p>
                <div className="space-y-2">
                  {applications.filter(a => !["awarded", "declined"].includes(a.stage)).slice(0, 4).map(app => (
                    <div key={app.id} className="flex items-center justify-between bg-white rounded-lg border px-3 py-2 text-sm">
                      <span className="text-slate-700 truncate flex-1 mr-2">{app.grant_title}</span>
                      <Badge variant="outline" className="text-xs shrink-0">{
                        { discovery: "Found", assessment: "Scored", writing: "Writing", compliance_check: "Checking", budget: "Budget", review: "Reviewing", hil_review: "Final Review", submission_ready: "Ready", submitted: "Sent In", awarded: "Won!", declined: "Not This Time" }[app.stage] || app.stage?.replace(/_/g, " ")
                      }</Badge>
                    </div>
                  ))}
                  {applications.length === 0 && <p className="text-slate-500 text-sm">Nothing yet. Finish Step 3 to add one.</p>}
                </div>
                <Link to="/pipeline" target="_blank">
                  <Button variant="outline" size="sm" className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-100">
                    <ExternalLink className="w-3.5 h-3.5" /> Open Track Progress
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setCurrentStage(5)}>
              Next Step <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Stage 5: Content Mapping */}
        {currentStage === 5 && (
          <div className="p-6 max-w-4xl mx-auto space-y-5">
            <StageGuide stageId={5} />
            <div>
              <h2 className="text-xl font-bold text-slate-900">Step 5: Match Content</h2>
              <p className="text-slate-500 text-sm">Match your stored content to each part of the application</p>
            </div>
            {parsedBlocks.length === 0 ? (
              <p className="text-slate-400">Finish Step 1 first to add your content.</p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">Tap your content pieces to match them to each part — this helps the AI write better.</p>

                {/* Form questions from the selected grant */}
                {selectedGrant && (() => {
                  const fullGrant = grants.find(g => g.id === selectedGrant.id);
                  const formQs = fullGrant?.application_form_questions || [];
                  if (!formQs.length) return null;
                  return (
                    <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/50">
                      <p className="text-xs font-semibold text-blue-700 mb-2">📋 Official Form Questions for: {selectedGrant.title}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {formQs.map((q, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-white border border-blue-200 text-blue-700 rounded-md">{q}</span>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {SECTION_KEYS.map(key => {
                  const fullGrant = selectedGrant ? grants.find(g => g.id === selectedGrant.id) : null;
                  const isRequiredByForm = fullGrant?.form_sections?.includes(key);
                  return (
                    <div key={key} className={`bg-white rounded-lg border p-4 ${isRequiredByForm ? "border-blue-300 ring-1 ring-blue-100" : ""}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-800">{key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</p>
                          {isRequiredByForm && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-semibold">Required by form</span>}
                        </div>
                        {(sectionMap[key]?.length || 0) > 0 && (
                          <Badge variant="outline" className="text-xs">{sectionMap[key].length} mapped</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {parsedBlocks.map((b, i) => {
                          const isMapped = (sectionMap[key] || []).includes(b.section);
                          return (
                            <button
                              key={i}
                              onClick={() => toggleMapping(key, b.section)}
                              className={`text-xs px-2 py-1 rounded border transition-colors ${
                                isMapped
                                  ? "border-emerald-400 bg-emerald-50 text-emerald-700 font-medium"
                                  : "border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-600"
                              }`}
                            >
                              {isMapped && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                              {b.section}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setCurrentStage(6)}>Let AI Write <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
        )}

        {/* Stage 6: Draft Generation */}
        {currentStage === 6 && (
          <Stage6Draft
            selectedGrant={selectedGrant}
            selectedApp={selectedApp}
            sections={sections}
            setSections={setSections}
            drafting={drafting}
            setDrafting={setDrafting}
            draftSection={draftSection}
            orgProfile={orgProfile}
            parsedBlocks={parsedBlocks}
            matches={matches}
            onSaveAndContinue={async () => {
              await base44.entities.GrantApplication.update(selectedApp.id, { sections });
              toast.success("All parts saved");
              setCurrentStage(7);
            }}
          />
        )}

        {/* Stage 7: Edit Guidance */}
        {currentStage === 7 && (
          <div className="p-6 max-w-4xl mx-auto space-y-5">
            <StageGuide stageId={7} />
            <div>
              <h2 className="text-xl font-bold text-slate-900">Step 7: Tips to Improve</h2>
              <p className="text-slate-500 text-sm">Simple suggestions to make your application stronger</p>
            </div>
            <EditGuidance sections={sections} grant={selectedGrant} orgProfile={orgProfile} />
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setCurrentStage(8)}>Finish Up <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
        )}

        {/* Stage 8: Final Pack & Export */}
        {currentStage === 8 && (
          <FinalPackStage
            sections={sections}
            selectedGrant={selectedGrant}
            selectedApp={selectedApp}
            orgProfile={orgProfile}
            onGoBack={() => setCurrentStage(7)}
          />
        )}
      </div>

      {/* Edit Block Dialog */}
      <Dialog open={editingBlock !== null} onOpenChange={() => setEditingBlock(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit: {parsedBlocks[editingBlock]?.section}</DialogTitle></DialogHeader>
          <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="min-h-48" />
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={saveBlock}>Save Changes</Button>
        </DialogContent>
      </Dialog>
    </div>
  );  
}

function EditGuidance({ sections, grant, orgProfile }) {
  const [guidance, setGuidance] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!Object.keys(sections).length) { toast.error("No sections drafted yet"); return; }
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Review this grant application and provide specific edit recommendations.

GRANT: ${grant?.title || "N/A"}
FUNDER: ${grant?.funder || "N/A"}

SECTIONS DRAFTED:
${Object.entries(sections).map(([k, v]) => `${k}: ${v?.substring(0, 300)}`).join("\n\n")}

Provide 3-5 specific, actionable edit recommendations to strengthen the application. Focus on clarity, specificity, funder alignment, and impact evidence.`,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  section: { type: "string" },
                  issue: { type: "string" },
                  recommendation: { type: "string" },
                  priority: { type: "string" }
                }
              }
            }
          }
        }
      });
      setGuidance(result.recommendations || []);
    } catch(e) {
      toast.error("Failed: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {!guidance ? (
        <Button onClick={generate} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {loading ? "Thinking..." : "Get Tips"}
        </Button>
      ) : (
        <div className="space-y-3">
          {guidance.map((g, i) => (
            <Card key={i} className={`border-l-4 ${g.priority === "high" ? "border-l-red-400" : g.priority === "medium" ? "border-l-amber-400" : "border-l-blue-400"}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">{g.section}</Badge>
                  <Badge className={`text-xs ${g.priority === "high" ? "bg-red-100 text-red-700" : g.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{g.priority}</Badge>
                </div>
                <p className="font-medium text-slate-800 text-sm mb-1">{g.issue}</p>
                <p className="text-slate-600 text-sm">{g.recommendation}</p>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" onClick={generate} disabled={loading} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Regenerate
          </Button>
        </div>
      )}
    </div>
  );
}