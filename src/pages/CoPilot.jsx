import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, CheckCircle2, AlertTriangle, Loader2, Wand2, RefreshCw, Edit3, Save, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const STAGES = [
  { id: 1, label: "Master Narrative", desc: "Upload and parse your organization's master narrative" },
  { id: 2, label: "Org Profile", desc: "Review and update organization profile" },
  { id: 3, label: "Opportunity Intake", desc: "Select grant opportunity and intake requirements" },
  { id: 4, label: "Pipeline Board", desc: "Assign to pipeline and set priorities" },
  { id: 5, label: "Content Mapping", desc: "Map master narrative blocks to grant sections" },
  { id: 6, label: "Draft Generation", desc: "AI generates tailored grant narrative sections" },
  { id: 7, label: "Edit Guidance", desc: "Review AI edit recommendations" },
  { id: 8, label: "Final Pack", desc: "Compile and export final application package" },
];

const SECTION_KEYS = [
  "executive_summary", "needs_statement", "goals_objectives",
  "methodology", "evaluation_plan", "organizational_capacity", "budget_narrative"
];

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
  const [loading, setLoading] = useState(true);
  const fileRef = useRef();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [profiles, g, m, a, narratives] = await Promise.all([
      base44.entities.OrgProfile.list(),
      base44.entities.Grant.list("-created_date", 100),
      base44.entities.GrantMatch.filter({ recommendation: "GO" }),
      base44.entities.GrantApplication.list("-created_date", 50),
      base44.entities.MasterNarrative.list(),
    ]);
    setOrgProfile(profiles[0] || null);
    setGrants(g);
    setMatches(m);
    setApplications(a);
    setSavedNarratives(narratives);
    if (narratives.length > 0) {
      const blocks = narratives.map(n => ({ section: n.section, content: n.content, approved: n.approved }));
      setParsedBlocks(blocks);
      setHilPending(false);
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
        version: 1
      });
    }
    setHilPending(false);
    toast.success("Master narrative approved and saved");
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
      const blockContext = parsedBlocks.map(b => `[${b.section}]: ${b.content?.substring(0, 300)}`).join("\n\n");
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional grant writer for GHIS LLC.

Write the "${sectionKey.replace(/_/g, " ").toUpperCase()}" section for this grant:

GRANT: ${selectedGrant.title}
FUNDER: ${selectedGrant.funder}

MASTER NARRATIVE BLOCKS (use these as source material):
${blockContext}

ORG PROFILE: ${orgProfile ? `${orgProfile.org_name}: ${orgProfile.mission}` : "GHIS LLC — health innovation consultancy"}

Write a compelling, specific 300-500 word section. Use evidence from the narrative blocks. Tailor specifically to this funder's priorities.`,
        response_json_schema: {
          type: "object",
          properties: { content: { type: "string" } }
        }
      });
      setSections(prev => ({ ...prev, [sectionKey]: result.content }));
      await base44.entities.GrantApplication.update(selectedApp.id, {
        sections: { ...sections, [sectionKey]: result.content }
      });
      toast.success(`${sectionKey.replace(/_/g, " ")} drafted`);
    } catch(e) {
      toast.error("Draft failed: " + e.message);
    }
    setDrafting(null);
  };

  const progress = Math.round((currentStage / 8) * 100);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Stage Sidebar */}
      <div className="w-64 bg-slate-800 text-white flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-slate-700">
          <p className="font-semibold text-sm">Grant Co-Pilot</p>
          <p className="text-xs text-slate-400 mt-0.5">8-Stage Workflow</p>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {STAGES.map(s => (
            <button
              key={s.id}
              onClick={() => setCurrentStage(s.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                currentStage === s.id ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-slate-700"
              }`}
            >
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center shrink-0 font-bold ${
                currentStage === s.id ? "bg-white text-emerald-600" : "bg-slate-700 text-slate-400"
              }`}>{s.id}</span>
              {s.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Stage {currentStage}/8</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full">
            <div className="h-1.5 bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Stage 1: Master Narrative */}
        {currentStage === 1 && (
          <div className="p-6 max-w-6xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Stage 1: Master Narrative Ingestion</h2>
                <p className="text-slate-500 text-sm">Upload and parse your organization's master narrative</p>
              </div>
              {hilPending && parsedBlocks.length > 0 && (
                <Badge className="bg-red-100 text-red-700 border border-red-200">HIL Required</Badge>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Upload */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Upload Master Narrative</CardTitle></CardHeader>
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
                      placeholder="Paste your master narrative here..."
                      value={narrativeText}
                      onChange={e => setNarrativeText(e.target.value)}
                      className="min-h-32 text-sm"
                    />
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={parseNarrative} disabled={parsing}>
                      {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                      {parsing ? "Parsing..." : "Parse Narrative"}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Parsed Blocks */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800">Parsed Content Blocks</h3>
                  {parsedBlocks.length > 0 && <Badge variant="outline">{parsedBlocks.length} blocks</Badge>}
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {parsedBlocks.map((block, i) => (
                    <Card key={i} className="border-slate-200">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-medium text-sm text-slate-800">{block.section}</p>
                          <div className="flex items-center gap-1 shrink-0">
                            {block.verified && <Badge className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">VERIFY</Badge>}
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
                      Upload or paste narrative and click "Parse Narrative"
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* HIL Checkpoint */}
            {hilPending && parsedBlocks.length > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <p className="font-semibold text-amber-800 mb-1">Human-in-the-Loop Checkpoint</p>
                  <p className="text-sm text-amber-700 mb-3">Review parsed blocks before proceeding to Stage 2</p>
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

        {/* Stage 2: Org Profile */}
        {currentStage === 2 && (
          <div className="p-6 max-w-4xl mx-auto space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Stage 2: Org Profile</h2>
              <p className="text-slate-500 text-sm">Review and confirm organizational profile used in applications</p>
            </div>
            {orgProfile ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { label: "Organization", value: orgProfile.org_name },
                  { label: "EIN", value: orgProfile.ein || "—" },
                  { label: "SAM UEI", value: orgProfile.duns_uei || "—" },
                  { label: "Annual Budget", value: orgProfile.annual_budget ? `$${orgProfile.annual_budget.toLocaleString()}` : "—" },
                  { label: "Indirect Cost Rate", value: orgProfile.indirect_cost_rate ? `${orgProfile.indirect_cost_rate}%` : "—" },
                  { label: "Fringe Rate", value: orgProfile.fringe_rate ? `${orgProfile.fringe_rate}%` : "—" },
                ].map(f => (
                  <div key={f.label} className="bg-white rounded-lg border p-3">
                    <p className="text-xs text-slate-400 uppercase font-medium">{f.label}</p>
                    <p className="font-semibold text-slate-800 mt-1">{f.value}</p>
                  </div>
                ))}
                <div className="md:col-span-2 bg-white rounded-lg border p-3">
                  <p className="text-xs text-slate-400 uppercase font-medium">Mission</p>
                  <p className="text-slate-700 mt-1 text-sm">{orgProfile.mission}</p>
                </div>
                <div className="md:col-span-2 bg-white rounded-lg border p-3">
                  <p className="text-xs text-slate-400 uppercase font-medium">Focus Areas</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(orgProfile.focus_areas || []).map(f => (
                      <Badge key={f} variant="outline" className="text-xs">{f.replace(/_/g, " ")}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500">No org profile found. Please set up your Org Profile first.</p>
            )}
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setCurrentStage(3)}>Confirmed — Continue to Stage 3 <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
        )}

        {/* Stage 3: Opportunity Intake */}
        {currentStage === 3 && (
          <div className="p-6 max-w-4xl mx-auto space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Stage 3: Opportunity Intake</h2>
              <p className="text-slate-500 text-sm">Select a GO/PREP grant opportunity to build an application for</p>
            </div>
            <div className="space-y-3">
              {matches.length === 0 && <p className="text-slate-400 text-sm">No GO matches yet. Run assessment first.</p>}
              {matches.map(m => (
                <Card
                  key={m.id}
                  className={`cursor-pointer transition-all ${selectedGrant?.id === m.grant_id ? "border-emerald-400 bg-emerald-50" : "hover:shadow-md"}`}
                  onClick={() => {
                    setSelectedGrant({ id: m.grant_id, title: m.grant_title, funder: m.funder });
                    const existingApp = applications.find(a => a.grant_id === m.grant_id);
                    if (existingApp) { setSelectedApp(existingApp); setSections(existingApp.sections || {}); }
                  }}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{m.grant_title}</p>
                      <p className="text-sm text-slate-500">{m.funder} · Deadline: {m.deadline}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-700">{m.total_score}%</span>
                      <Badge className={`text-xs border ${m.recommendation === "GO" ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-blue-100 text-blue-800 border-blue-300"}`}>{m.recommendation}</Badge>
                      {selectedGrant?.id === m.grant_id && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {selectedGrant && (
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={async () => {
                if (!selectedApp) {
                  const app = await base44.entities.GrantApplication.create({
                    grant_id: selectedGrant.id,
                    grant_title: selectedGrant.title,
                    funder: selectedGrant.funder,
                    stage: "writing",
                  });
                  setSelectedApp(app);
                }
                setCurrentStage(6);
              }}>
                Proceed with {selectedGrant.title} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        )}

        {/* Stage 4: Pipeline Board */}
        {currentStage === 4 && (
          <div className="p-6 max-w-4xl mx-auto space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Stage 4: Pipeline Board</h2>
              <p className="text-slate-500 text-sm">Active applications in the writing pipeline</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {applications.filter(a => !["awarded", "declined"].includes(a.stage)).map(app => (
                <Card key={app.id} className="cursor-pointer hover:shadow-md" onClick={() => { setSelectedApp(app); setSections(app.sections || {}); }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{app.grant_title}</p>
                        <p className="text-xs text-slate-500">{app.funder}</p>
                      </div>
                      <Badge className="text-xs bg-slate-100 text-slate-700">{app.stage?.replace(/_/g, " ")}</Badge>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-slate-400">{Object.keys(app.sections || {}).length}/{SECTION_KEYS.length} sections complete</p>
                      <div className="h-1.5 bg-slate-100 rounded-full mt-1">
                        <div className="h-1.5 bg-emerald-500 rounded-full" style={{ width: `${(Object.keys(app.sections || {}).length / SECTION_KEYS.length) * 100}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {applications.length === 0 && <p className="text-slate-400 text-sm col-span-2 py-8 text-center">No applications in pipeline. Complete Stage 3 first.</p>}
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setCurrentStage(5)}>Continue to Content Mapping <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
        )}

        {/* Stage 5: Content Mapping */}
        {currentStage === 5 && (
          <div className="p-6 max-w-4xl mx-auto space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Stage 5: Content Mapping</h2>
              <p className="text-slate-500 text-sm">Map master narrative blocks to grant application sections</p>
            </div>
            {parsedBlocks.length === 0 ? (
              <p className="text-slate-400">Complete Stage 1 first to parse your master narrative.</p>
            ) : (
              <div className="space-y-3">
                {SECTION_KEYS.map(key => (
                  <div key={key} className="bg-white rounded-lg border p-4">
                    <p className="font-medium text-slate-800 mb-2">{key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</p>
                    <div className="flex flex-wrap gap-2">
                      {parsedBlocks.map((b, i) => (
                        <button
                          key={i}
                          className="text-xs px-2 py-1 rounded border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-600 transition-colors"
                        >
                          {b.section}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setCurrentStage(6)}>Continue to Draft Generation <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
        )}

        {/* Stage 6: Draft Generation */}
        {currentStage === 6 && (
          <div className="p-6 max-w-5xl mx-auto space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Stage 6: Draft Generation</h2>
                <p className="text-slate-500 text-sm">{selectedGrant ? `Drafting: ${selectedGrant.title}` : "Select an opportunity in Stage 3 first"}</p>
              </div>
            </div>
            {!selectedGrant && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">Please go to Stage 3 and select a grant opportunity first.</p>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              {SECTION_KEYS.map(key => (
                <Card key={key}>
                  <CardHeader className="pb-2 flex-row items-center justify-between">
                    <CardTitle className="text-sm capitalize">{key.replace(/_/g, " ")}</CardTitle>
                    <div className="flex gap-2">
                      {sections[key] && <div className="w-2 h-2 bg-emerald-400 rounded-full mt-1" />}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!selectedGrant || drafting === key}
                        onClick={() => draftSection(key)}
                        className="h-7 text-xs gap-1"
                      >
                        {drafting === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                        {drafting === key ? "Drafting..." : "AI Draft"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={sections[key] || ""}
                      onChange={e => setSections(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder="Click AI Draft to generate or write manually..."
                      className="min-h-28 text-xs resize-none"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
            {selectedApp && (
              <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={async () => {
                await base44.entities.GrantApplication.update(selectedApp.id, { sections });
                toast.success("All sections saved");
                setCurrentStage(7);
              }}>
                <Save className="w-4 h-4" /> Save All & Continue
              </Button>
            )}
          </div>
        )}

        {/* Stage 7: Edit Guidance */}
        {currentStage === 7 && (
          <div className="p-6 max-w-4xl mx-auto space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Stage 7: Edit Guidance</h2>
              <p className="text-slate-500 text-sm">AI-generated recommendations to strengthen your application</p>
            </div>
            <EditGuidance sections={sections} grant={selectedGrant} orgProfile={orgProfile} />
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setCurrentStage(8)}>Proceed to Final Pack <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
        )}

        {/* Stage 8: Final Pack */}
        {currentStage === 8 && (
          <div className="p-6 max-w-4xl mx-auto space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Stage 8: Final Pack</h2>
              <p className="text-slate-500 text-sm">Review and export your completed application package</p>
            </div>
            <div className="space-y-3">
              {SECTION_KEYS.map(key => (
                <Card key={key} className={sections[key] ? "border-emerald-200" : "border-slate-200 opacity-60"}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {sections[key] ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-slate-300" />}
                      <span className="text-sm font-medium text-slate-800 capitalize">{key.replace(/_/g, " ")}</span>
                    </div>
                    <span className="text-xs text-slate-400">{sections[key] ? `${sections[key].length} chars` : "Not written"}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 gap-2 w-full"
              onClick={() => {
                const content = SECTION_KEYS.map(k => `## ${k.replace(/_/g, " ").toUpperCase()}\n\n${sections[k] || "[Not written]"}`).join("\n\n---\n\n");
                const blob = new Blob([content], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `${selectedGrant?.title || "grant"}-application.txt`; a.click();
                toast.success("Application package exported");
              }}
            >
              Export Final Application Package
            </Button>
          </div>
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
          {loading ? "Generating..." : "Generate Edit Guidance"}
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