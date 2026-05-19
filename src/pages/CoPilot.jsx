import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, CheckCircle2, AlertTriangle, Loader2, Wand2, RefreshCw, Save, ChevronRight, ChevronLeft, ExternalLink, Lock } from "lucide-react";
import { toast } from "sonner";
import { SECTION_KEYS, COPILOT_STAGES as STAGES } from "@/lib/grantConstants";
import { isDraftableState, normalizeMatchRecord } from "@/lib/grants/governance";

const STATE_BADGE = {
  GO: "bg-emerald-100 text-emerald-800 border-emerald-300",
  PREPARE: "bg-blue-100 text-blue-800 border-blue-300",
};

function allSectionsDrafted(sections) {
  return SECTION_KEYS.every((key) => Boolean(sections[key]?.trim()));
}

function countDraftedSections(sections) {
  return SECTION_KEYS.filter((key) => Boolean(sections[key]?.trim())).length;
}

export default function CoPilot() {
  const [currentStage, setCurrentStage] = useState(1);
  const [narrativeText, setNarrativeText] = useState("");
  const [parsedBlocks, setParsedBlocks] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [hilPending, setHilPending] = useState(true);
  const [personaConfirmed, setPersonaConfirmed] = useState(false);
  const [orgProfile, setOrgProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [sections, setSections] = useState({});
  const [drafting, setDrafting] = useState(null);
  const [savedNarratives, setSavedNarratives] = useState([]);
  const [editGuidanceComplete, setEditGuidanceComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [profiles, goMatches, prepMatches, prepareMatches, applicationsData, narratives] = await Promise.all([
      base44.entities.OrgProfile.list(),
      base44.entities.GrantMatch.filter({ recommendation: "GO" }),
      base44.entities.GrantMatch.filter({ recommendation: "PREP" }),
      base44.entities.GrantMatch.filter({ recommendation: "PREPARE" }),
      base44.entities.GrantApplication.list("-created_date", 50),
      base44.entities.MasterNarrative.list(),
    ]);

    const canonicalMatches = [...goMatches, ...prepMatches, ...prepareMatches]
      .map(normalizeMatchRecord)
      .filter((match, index, all) => all.findIndex((item) => item.id === match.id) === index)
      .filter((match) => isDraftableState(match.advisory_state));

    setOrgProfile(profiles[0] || null);
    setMatches(canonicalMatches);
    setApplications(applicationsData);
    setSavedNarratives(narratives);
    if (narratives.length > 0) {
      const blocks = narratives.map((n) => ({ section: n.section, content: n.content, approved: n.approved }));
      setParsedBlocks(blocks);
      setHilPending(false);
    }
    setLoading(false);
  };

  const stageComplete = {
    1: parsedBlocks.length > 0 && !hilPending,
    2: personaConfirmed,
    3: Boolean(selectedGrant && selectedApp),
    4: Boolean(selectedApp),
    5: parsedBlocks.length > 0 && Boolean(selectedApp),
    6: allSectionsDrafted(sections),
    7: editGuidanceComplete,
    8: false,
  };

  const getFirstIncompleteStage = () => {
    for (let stage = 1; stage <= 7; stage += 1) {
      if (!stageComplete[stage]) return stage;
    }
    return 8;
  };

  const maxUnlockedStage = Math.max(currentStage, getFirstIncompleteStage());
  const draftedCount = countDraftedSections(sections);
  const progress = Math.round(((Math.min(maxUnlockedStage, 8)) / 8) * 100);

  const getStageBlockReason = (stageId) => {
    if (stageId <= maxUnlockedStage) return null;
    if (!stageComplete[1]) return "Stage 1 must be completed by approving the parsed master narrative blocks.";
    if (!stageComplete[2]) return "Stage 2 must be completed by confirming the organization persona.";
    if (!stageComplete[3]) return "Stage 3 must be completed by selecting a GO or PREPARE opportunity and creating an application record.";
    if (!stageComplete[4]) return "Stage 4 must be acknowledged before content mapping.";
    if (!stageComplete[5]) return "Stage 5 must be completed by confirming content mapping inputs.";
    if (!stageComplete[6]) return "Stage 6 must be completed by drafting all required sections.";
    if (!stageComplete[7]) return "Stage 7 must be completed by generating edit guidance.";
    return "This stage is locked until earlier workflow steps are complete.";
  };

  const goToStage = (stageId) => {
    const blockReason = getStageBlockReason(stageId);
    if (blockReason) {
      toast.error(blockReason);
      return;
    }
    setCurrentStage(stageId);
  };

  const goBack = () => setCurrentStage((stage) => Math.max(stage - 1, 1));

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

Extract 8-12 distinct reusable content blocks. Do not invent organizational facts. Flag uncertain or unsupported claims as needing verification.`,
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

  const findSelectedMatch = () => selectedMatch || matches.find((match) => match.grant_id === selectedGrant?.id);

  const createOrSelectApplication = async () => {
    if (!selectedGrant) {
      toast.error("Select a GO or PREPARE opportunity first.");
      return null;
    }

    if (selectedApp) return selectedApp;

    const app = await base44.entities.GrantApplication.create({
      grant_id: selectedGrant.id,
      grant_title: selectedGrant.title,
      funder: selectedGrant.funder,
      deadline: selectedMatch?.deadline,
      stage: "writing",
    });
    setSelectedApp(app);
    setApplications((previous) => [app, ...previous]);
    return app;
  };

  const continueFromStage3 = async () => {
    const app = await createOrSelectApplication();
    if (!app) return;
    setCurrentStage(4);
  };

  const draftSection = async (sectionKey) => {
    const activeMatch = findSelectedMatch();
    if (!selectedApp || !selectedGrant) { toast.error("Select an application first"); return; }
    if (!personaConfirmed) { toast.error("Confirm the organization persona before drafting."); return; }
    if (!activeMatch || !isDraftableState(activeMatch.advisory_state)) {
      toast.error("Drafting is blocked because this opportunity is not in GO or PREPARE state.");
      return;
    }

    setDrafting(sectionKey);
    try {
      const blockContext = parsedBlocks.map((b) => `[${b.section}]: ${b.content?.substring(0, 300)}`).join("\n\n");
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a governed grant writing assistant for GHIS LLC.

Write a ZERO-DRAFT, NOT SUBMISSION READY "${sectionKey.replace(/_/g, " ").toUpperCase()}" section.

GRANT: ${selectedGrant.title}
FUNDER: ${selectedGrant.funder}
ADVISORY STATE: ${activeMatch.advisory_state}

MASTER NARRATIVE BLOCKS:
${blockContext}

ORG PROFILE: ${orgProfile ? `${orgProfile.org_name}: ${orgProfile.mission}` : "GHIS LLC, health innovation consultancy"}

Rules:
- Do not invent facts.
- Use only provided organizational context.
- Mark unsupported facts as [NEEDS VERIFICATION].
- Produce an editable 300-500 word zero-draft section.`,
        response_json_schema: {
          type: "object",
          properties: { content: { type: "string" } }
        }
      });
      const nextSections = { ...sections, [sectionKey]: result.content };
      setSections(nextSections);
      await base44.entities.GrantApplication.update(selectedApp.id, { sections: nextSections });
      toast.success(`${sectionKey.replace(/_/g, " ")} zero-draft created`);
    } catch(e) {
      toast.error("Draft failed: " + e.message);
    }
    setDrafting(null);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-64 bg-slate-800 text-white flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-slate-700">
          <p className="font-semibold text-sm">Grant Co-Pilot</p>
          <p className="text-xs text-slate-400 mt-0.5">8-Stage Governed Workflow</p>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {STAGES.map((stage) => {
            const locked = Boolean(getStageBlockReason(stage.id));
            const complete = Boolean(stageComplete[stage.id]);
            return (
              <button
                key={stage.id}
                onClick={() => goToStage(stage.id)}
                disabled={locked}
                title={locked ? getStageBlockReason(stage.id) : stage.desc}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  currentStage === stage.id
                    ? "bg-emerald-600 text-white"
                    : locked
                      ? "text-slate-600 cursor-not-allowed"
                      : "text-slate-400 hover:bg-slate-700"
                }`}
              >
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center shrink-0 font-bold ${
                  currentStage === stage.id
                    ? "bg-white text-emerald-600"
                    : complete
                      ? "bg-emerald-700 text-white"
                      : "bg-slate-700 text-slate-400"
                }`}>{complete ? "✓" : stage.id}</span>
                <span className="flex-1">{stage.label}</span>
                {locked && <Lock className="w-3 h-3" />}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Unlocked {Math.min(maxUnlockedStage, 8)}/8</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full">
            <div className="h-1.5 bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {currentStage === 1 && (
          <div className="p-6 max-w-6xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Stage 1: Master Narrative Ingestion</h2>
                <p className="text-slate-500 text-sm">Upload, parse, and approve reusable organizational narrative blocks before proceeding.</p>
              </div>
              {hilPending && parsedBlocks.length > 0 && (
                <Badge className="bg-red-100 text-red-700 border border-red-200">HIL Required</Badge>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Upload Master Narrative</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div
                    className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">Drop TXT, DOCX, or PDF text extract</p>
                    <p className="text-xs text-slate-400">or click to browse</p>
                    <input ref={fileRef} type="file" accept=".txt,.docx,.pdf" className="hidden" onChange={handleFileUpload} />
                  </div>
                  <Textarea
                    placeholder="Paste your master narrative here..."
                    value={narrativeText}
                    onChange={(e) => setNarrativeText(e.target.value)}
                    className="min-h-32 text-sm"
                  />
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={parseNarrative} disabled={parsing}>
                    {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {parsing ? "Parsing..." : "Parse Narrative"}
                  </Button>
                </CardContent>
              </Card>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800">Parsed Content Blocks</h3>
                  {parsedBlocks.length > 0 && <Badge variant="outline">{parsedBlocks.length} blocks</Badge>}
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {parsedBlocks.map((block, index) => (
                    <Card key={`${block.section}-${index}`} className="border-slate-200">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-medium text-sm text-slate-800">{block.section}</p>
                          {block.verified && <Badge className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">VERIFY</Badge>}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-3">{block.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                  {parsedBlocks.length === 0 && (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      Upload or paste narrative and click Parse Narrative
                    </div>
                  )}
                </div>
              </div>
            </div>

            {hilPending && parsedBlocks.length > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <p className="font-semibold text-amber-800 mb-1">Human-in-the-Loop Checkpoint</p>
                  <p className="text-sm text-amber-700 mb-3">Review parsed blocks before proceeding to Stage 2.</p>
                  <div className="flex gap-2">
                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={approveAndSave}>Approve & Continue</Button>
                    <Button variant="outline" onClick={parseNarrative} disabled={parsing}>
                      <RefreshCw className="w-4 h-4 mr-2" />Regenerate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {currentStage === 2 && (
          <div className="p-6 max-w-2xl mx-auto space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Stage 2: Org Profile and Persona Confirmation</h2>
              <p className="text-slate-500 text-sm">Confirm the organization persona before opportunity intake and zero-draft generation.</p>
            </div>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-5 space-y-3">
                {orgProfile ? (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-500">Org:</span> <span className="font-medium text-slate-800">{orgProfile.org_name}</span></div>
                    <div><span className="text-slate-500">EIN:</span> <span className="font-medium text-slate-800">{orgProfile.ein || "-"}</span></div>
                    <div><span className="text-slate-500">Indirect:</span> <span className="font-medium text-slate-800">{orgProfile.indirect_cost_rate ? `${orgProfile.indirect_cost_rate}%` : "-"}</span></div>
                    <div><span className="text-slate-500">Budget:</span> <span className="font-medium text-slate-800">{orgProfile.annual_budget ? `$${orgProfile.annual_budget.toLocaleString()}` : "-"}</span></div>
                    <div className="col-span-2 text-slate-600 text-xs mt-1 line-clamp-2">{orgProfile.mission}</div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No org profile set up yet.</p>
                )}
                <div className="flex items-center gap-3 pt-2">
                  <Checkbox checked={personaConfirmed} onCheckedChange={(value) => setPersonaConfirmed(Boolean(value))} />
                  <span className="text-sm text-blue-800 font-medium">I confirm this organization persona for zero-draft generation.</span>
                </div>
                <Link to="/org-profile" target="_blank">
                  <Button variant="outline" size="sm" className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-100">
                    <ExternalLink className="w-3.5 h-3.5" /> Open Org Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <StageActions
              currentStage={currentStage}
              onBack={goBack}
              onContinue={() => setCurrentStage(3)}
              continueDisabled={!stageComplete[2]}
              continueLabel="Continue to Opportunity Intake"
            />
          </div>
        )}

        {currentStage === 3 && (
          <div className="p-6 max-w-4xl mx-auto space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Stage 3: Opportunity Intake</h2>
              <p className="text-slate-500 text-sm">Select one GO or PREPARE opportunity, then create or reuse its application workspace.</p>
            </div>
            <div className="space-y-3">
              {matches.length === 0 && <p className="text-slate-400 text-sm">No GO/PREPARE matches yet. Run assessment first.</p>}
              {matches.map((match) => (
                <Card
                  key={match.id}
                  className={`cursor-pointer transition-all ${selectedGrant?.id === match.grant_id ? "border-emerald-400 bg-emerald-50" : "hover:shadow-md"}`}
                  onClick={() => {
                    setSelectedMatch(match);
                    setSelectedGrant({ id: match.grant_id, title: match.grant_title, funder: match.funder });
                    const existingApp = applications.find((app) => app.grant_id === match.grant_id);
                    if (existingApp) { setSelectedApp(existingApp); setSections(existingApp.sections || {}); }
                  }}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{match.grant_title}</p>
                      <p className="text-sm text-slate-500">{match.funder} · Deadline: {match.deadline}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-700">{match.total_score}%</span>
                      <Badge className={`text-xs border ${STATE_BADGE[match.advisory_state] || "bg-slate-100 text-slate-700"}`}>{match.advisory_state}</Badge>
                      {selectedGrant?.id === match.grant_id && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <StageActions
              currentStage={currentStage}
              onBack={goBack}
              onContinue={continueFromStage3}
              continueDisabled={!selectedGrant}
              continueLabel={selectedApp ? "Continue to Pipeline Board" : "Create Application and Continue"}
            />
          </div>
        )}

        {currentStage === 4 && (
          <SimpleLinkedStage
            title="Stage 4: Pipeline Board"
            description="Confirm the selected application is now in the pipeline workspace before content mapping."
            link="/pipeline"
            linkLabel="Open Full Pipeline"
            currentStage={currentStage}
            onBack={goBack}
            onContinue={() => setCurrentStage(5)}
            continueDisabled={!stageComplete[4]}
            continueLabel="Continue to Content Mapping"
          />
        )}

        {currentStage === 5 && (
          <div className="p-6 max-w-4xl mx-auto space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Stage 5: Content Mapping</h2>
              <p className="text-slate-500 text-sm">Confirm that approved master narrative blocks are available for the selected application.</p>
            </div>
            {parsedBlocks.length === 0 ? (
              <p className="text-slate-400">Complete Stage 1 first to parse your master narrative.</p>
            ) : (
              <div className="space-y-3">
                {SECTION_KEYS.map((key) => (
                  <div key={key} className="bg-white rounded-lg border p-4">
                    <p className="font-medium text-slate-800 mb-2">{key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}</p>
                    <div className="flex flex-wrap gap-2">
                      {parsedBlocks.map((block, index) => (
                        <button
                          key={`${block.section}-${index}`}
                          type="button"
                          className="text-xs px-2 py-1 rounded border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-600 transition-colors"
                        >
                          {block.section}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <StageActions
              currentStage={currentStage}
              onBack={goBack}
              onContinue={() => setCurrentStage(6)}
              continueDisabled={!stageComplete[5]}
              continueLabel="Continue to Draft Generation"
            />
          </div>
        )}

        {currentStage === 6 && (
          <div className="p-6 max-w-5xl mx-auto space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Stage 6: Zero-Draft Generation</h2>
                <p className="text-slate-500 text-sm">{selectedGrant ? `Drafting: ${selectedGrant.title}` : "Select an opportunity in Stage 3 first"}</p>
              </div>
              <Badge className={allSectionsDrafted(sections) ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-amber-100 text-amber-800 border border-amber-300"}>
                {draftedCount}/{SECTION_KEYS.length} sections drafted
              </Badge>
            </div>
            {!selectedGrant && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">Please go to Stage 3 and select a GO or PREPARE grant opportunity first.</p>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              {SECTION_KEYS.map((key) => (
                <Card key={key}>
                  <CardHeader className="pb-2 flex-row items-center justify-between">
                    <CardTitle className="text-sm capitalize">{key.replace(/_/g, " ")}</CardTitle>
                    <div className="flex gap-2">
                      {sections[key] && <div className="w-2 h-2 bg-emerald-400 rounded-full mt-1" />}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!selectedGrant || !personaConfirmed || drafting === key}
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
                      onChange={(e) => setSections((previous) => ({ ...previous, [key]: e.target.value }))}
                      placeholder="Click AI Draft to generate or write manually..."
                      className="min-h-28 text-xs resize-none"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
            {selectedApp && (
              <StageActions
                currentStage={currentStage}
                onBack={goBack}
                onContinue={async () => {
                  await base44.entities.GrantApplication.update(selectedApp.id, { sections });
                  toast.success("All sections saved as zero-draft content");
                  setCurrentStage(7);
                }}
                continueDisabled={!stageComplete[6]}
                continueLabel="Save All and Continue to Edit Guidance"
                continueIcon={<Save className="w-4 h-4" />}
              />
            )}
          </div>
        )}

        {currentStage === 7 && (
          <div className="p-6 max-w-4xl mx-auto space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Stage 7: Edit Guidance</h2>
              <p className="text-slate-500 text-sm">Generate and review zero-draft recommendations before Pack Gate.</p>
            </div>
            <EditGuidance sections={sections} grant={selectedGrant} onGuidanceGenerated={() => setEditGuidanceComplete(true)} />
            <StageActions
              currentStage={currentStage}
              onBack={goBack}
              onContinue={() => setCurrentStage(8)}
              continueDisabled={!stageComplete[7]}
              continueLabel="Proceed to Pack Gate"
            />
          </div>
        )}

        {currentStage === 8 && (
          <div className="p-6 max-w-2xl mx-auto space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Stage 8: Pack Gate</h2>
              <p className="text-slate-500 text-sm">Export is handled in Pack & Export only after the exact phrase is confirmed.</p>
            </div>
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-5 space-y-3">
                <p className="text-emerald-800 font-medium text-sm">Generated sections remain zero-draft content and are not submission-ready.</p>
                <div className="space-y-2">
                  {SECTION_KEYS.map((key) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      {sections[key]
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        : <AlertTriangle className="w-4 h-4 text-slate-300 shrink-0" />}
                      <span className={sections[key] ? "text-slate-700" : "text-slate-400"}>
                        {key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                      </span>
                      {sections[key] && <span className="text-xs text-slate-400 ml-auto">{sections[key].length} chars</span>}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={goBack} className="gap-2">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </Button>
                  <Link to="/pack" className="flex-1">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2 w-full">
                      <ExternalLink className="w-4 h-4" /> Go to Pack & Export
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function StageActions({ currentStage, onBack, onContinue, continueDisabled, continueLabel, continueIcon }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <Button variant="outline" onClick={onBack} disabled={currentStage === 1} className="gap-2">
        <ChevronLeft className="w-4 h-4" /> Back
      </Button>
      <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={onContinue} disabled={continueDisabled}>
        {continueIcon}
        {continueLabel} <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

function SimpleLinkedStage({ title, description, link, linkLabel, currentStage, onBack, onContinue, continueDisabled, continueLabel }) {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="text-slate-500 text-sm">{description}</p>
      </div>
      <Card>
        <CardContent className="p-5 space-y-3">
          <Link to={link} target="_blank">
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="w-3.5 h-3.5" /> {linkLabel}
            </Button>
          </Link>
        </CardContent>
      </Card>
      <StageActions
        currentStage={currentStage}
        onBack={onBack}
        onContinue={onContinue}
        continueDisabled={continueDisabled}
        continueLabel={continueLabel}
      />
    </div>
  );
}

function EditGuidance({ sections, grant, onGuidanceGenerated }) {
  const [guidance, setGuidance] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!Object.keys(sections).length) { toast.error("No sections drafted yet"); return; }
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Review this zero-draft grant application and provide specific edit recommendations.

GRANT: ${grant?.title || "N/A"}
FUNDER: ${grant?.funder || "N/A"}

SECTIONS DRAFTED:
${Object.entries(sections).map(([key, value]) => `${key}: ${value?.substring(0, 300)}`).join("\n\n")}

Provide 3-5 specific recommendations. Do not mark content as submission-ready.`,
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
      onGuidanceGenerated?.();
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
          {guidance.map((item, index) => (
            <Card key={`${item.section}-${index}`} className={`border-l-4 ${item.priority === "high" ? "border-l-red-400" : item.priority === "medium" ? "border-l-amber-400" : "border-l-blue-400"}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">{item.section}</Badge>
                  <Badge className={`text-xs ${item.priority === "high" ? "bg-red-100 text-red-700" : item.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{item.priority}</Badge>
                </div>
                <p className="font-medium text-slate-800 text-sm mb-1">{item.issue}</p>
                <p className="text-slate-600 text-sm">{item.recommendation}</p>
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
