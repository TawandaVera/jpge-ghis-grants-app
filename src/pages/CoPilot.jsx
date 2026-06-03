import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, CheckCircle2, AlertTriangle, Loader2, Wand2, RefreshCw, Save, ChevronRight, ExternalLink } from "lucide-react";
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

        {/* Stage 2: Org Profile — managed in the dedicated Org Profile page */}
        {currentStage === 2 && (
          <div className="p-6 max-w-2xl mx-auto space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Stage 2: Org Profile</h2>
              <p className="text-slate-500 text-sm">Review and update your organizational profile before drafting</p>
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
              Profile Confirmed — Continue to Stage 3 <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
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

        {/* Stage 4: Pipeline Board — managed in the dedicated Pipeline page */}
        {currentStage === 4 && (
          <div className="p-6 max-w-2xl mx-auto space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Stage 4: Pipeline Board</h2>
              <p className="text-slate-500 text-sm">Track and manage your applications in the pipeline</p>
            </div>
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-5 space-y-3">
                <p className="text-purple-800 font-medium text-sm">Application pipeline management lives in the dedicated Pipeline page.</p>
                <div className="space-y-2">
                  {applications.filter(a => !["awarded", "declined"].includes(a.stage)).slice(0, 4).map(app => (
                    <div key={app.id} className="flex items-center justify-between bg-white rounded-lg border px-3 py-2 text-sm">
                      <span className="text-slate-700 truncate flex-1 mr-2">{app.grant_title}</span>
                      <Badge variant="outline" className="text-xs shrink-0">{app.stage?.replace(/_/g, " ")}</Badge>
                    </div>
                  ))}
                  {applications.length === 0 && <p className="text-slate-500 text-sm">No applications yet. Complete Stage 3 to create one.</p>}
                </div>
                <Link to="/pipeline" target="_blank">
                  <Button variant="outline" size="sm" className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-100">
                    <ExternalLink className="w-3.5 h-3.5" /> Open Full Pipeline
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setCurrentStage(5)}>
              Continue to Content Mapping <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
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

        {/* Stage 8: Final Pack — managed in the dedicated Pack & Export page */}
        {currentStage === 8 && (
          <div className="p-6 max-w-2xl mx-auto space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Stage 8: Final Pack & Export</h2>
              <p className="text-slate-500 text-sm">Review readiness checklist and generate your submission package</p>
            </div>
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-5 space-y-3">
                <p className="text-emerald-800 font-medium text-sm">Package generation and export is handled in the Pack & Export section.</p>
                <div className="space-y-2">
                  {SECTION_KEYS.map(key => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      {sections[key]
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        : <AlertTriangle className="w-4 h-4 text-slate-300 shrink-0" />}
                      <span className={sections[key] ? "text-slate-700" : "text-slate-400"}>
                        {key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                      {sections[key] && <span className="text-xs text-slate-400 ml-auto">{sections[key].length} chars</span>}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  {SECTION_KEYS.filter(k => sections[k]).length}/{SECTION_KEYS.length} sections complete
                </p>
                <Link to="/pack">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2 w-full">
                    <ExternalLink className="w-4 h-4" /> Go to Pack & Export
                  </Button>
                </Link>
              </CardContent>
            </Card>
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