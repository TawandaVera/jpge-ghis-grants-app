import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Loader2, Wand2, Save, ChevronRight, Database, BookOpen, BarChart2, FileText } from "lucide-react";
import { toast } from "sonner";
import { SECTION_KEYS } from "@/lib/grantConstants";

export default function Stage6Draft({
  selectedGrant, selectedApp, sections, setSections,
  drafting, setDrafting, draftSection,
  orgProfile, parsedBlocks, matches,
  onSaveAndContinue
}) {
  const [draftingAll, setDraftingAll] = useState(false);
  const [draftAllProgress, setDraftAllProgress] = useState({ current: 0, total: 0, currentKey: null });

  const completedCount = SECTION_KEYS.filter(k => sections[k]).length;
  const matchData = matches.find(mm => mm.grant_id === selectedGrant?.id);

  // Context availability indicators
  const contextItems = [
    {
      label: "Org Profile",
      available: !!orgProfile,
      detail: orgProfile ? `${orgProfile.org_name}` : "Not set — go to Org Profile",
      icon: Database,
    },
    {
      label: "Master Narrative",
      available: parsedBlocks.length > 0,
      detail: parsedBlocks.length > 0 ? `${parsedBlocks.length} content blocks loaded` : "Not parsed — complete Stage 1",
      icon: BookOpen,
    },
    {
      label: "Assessment Data",
      available: !!matchData,
      detail: matchData ? `Score: ${Math.round(matchData.total_score)}% (${matchData.recommendation})` : "No assessment found",
      icon: BarChart2,
    },
    {
      label: "Prior Drafts",
      available: completedCount > 0,
      detail: completedCount > 0 ? `${completedCount}/${SECTION_KEYS.length} sections already drafted` : "No drafts yet",
      icon: FileText,
    },
  ];

  const draftAllSections = async () => {
    if (!selectedGrant || !selectedApp) { toast.error("Select an opportunity in Stage 3 first"); return; }
    const undrafted = SECTION_KEYS.filter(k => !sections[k]);
    if (undrafted.length === 0) { toast.info("All sections already drafted"); return; }

    setDraftingAll(true);
    setDraftAllProgress({ current: 0, total: undrafted.length, currentKey: null });

    for (let i = 0; i < undrafted.length; i++) {
      const key = undrafted[i];
      setDraftAllProgress({ current: i + 1, total: undrafted.length, currentKey: key });
      await draftSection(key);
    }

    setDraftingAll(false);
    setDraftAllProgress({ current: 0, total: 0, currentKey: null });
    toast.success(`All ${undrafted.length} sections drafted!`);
  };

  const isAnyDrafting = !!drafting || draftingAll;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Stage 6: Draft Generation</h2>
          <p className="text-slate-500 text-sm">
            {selectedGrant ? `Drafting: ${selectedGrant.title}` : "Select an opportunity in Stage 3 first"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{completedCount}/{SECTION_KEYS.length} drafted</span>
          <Badge variant="outline" className={completedCount === SECTION_KEYS.length ? "border-emerald-300 text-emerald-700" : "border-slate-300"}>
            {Math.round((completedCount / SECTION_KEYS.length) * 100)}%
          </Badge>
        </div>
      </div>

      {/* Context Status Panel */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Preloaded Context — AI draws from all of these automatically</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {contextItems.map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`flex items-start gap-2 rounded-lg p-2.5 border text-xs ${
                  item.available
                    ? "bg-white border-emerald-200"
                    : "bg-white border-amber-200 opacity-75"
                }`}
              >
                <div className={`mt-0.5 shrink-0 ${item.available ? "text-emerald-500" : "text-amber-400"}`}>
                  {item.available
                    ? <CheckCircle2 className="w-3.5 h-3.5" />
                    : <AlertTriangle className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0">
                  <p className={`font-semibold ${item.available ? "text-slate-700" : "text-slate-400"}`}>{item.label}</p>
                  <p className={`text-xs mt-0.5 truncate ${item.available ? "text-slate-500" : "text-amber-600"}`}>{item.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Draft All button lives here, next to context */}
        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-slate-500">
            {draftingAll
              ? `Drafting ${draftAllProgress.currentKey?.replace(/_/g, " ")}… (${draftAllProgress.current}/${draftAllProgress.total})`
              : SECTION_KEYS.filter(k => !sections[k]).length === 0
              ? "All sections drafted ✓"
              : `${SECTION_KEYS.filter(k => !sections[k]).length} sections remaining`}
          </p>
          <Button
            onClick={draftAllSections}
            disabled={isAnyDrafting || !selectedGrant || SECTION_KEYS.filter(k => !sections[k]).length === 0}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
            size="sm"
          >
            {draftingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            {draftingAll
              ? `Drafting ${draftAllProgress.current}/${draftAllProgress.total}…`
              : `Draft All ${SECTION_KEYS.filter(k => !sections[k]).length > 0 ? `(${SECTION_KEYS.filter(k => !sections[k]).length})` : ""} Sections`}
          </Button>
        </div>
      </div>

      {/* No grant warning */}
      {!selectedGrant && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800 text-sm">Please go to Stage 3 and select a grant opportunity first.</p>
        </div>
      )}

      {/* Progress bar when drafting all */}
      {draftingAll && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
          <div className="flex-1">
            <div className="h-1.5 bg-emerald-100 rounded-full">
              <div
                className="h-1.5 bg-emerald-500 rounded-full transition-all"
                style={{ width: `${(draftAllProgress.current / draftAllProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-emerald-700 mt-1">
              Writing: <span className="font-medium">{draftAllProgress.currentKey?.replace(/_/g, " ")}</span>
              {" "}— Using org profile, {parsedBlocks.length} narrative blocks{matchData ? ", assessment intelligence" : ""}
            </p>
          </div>
        </div>
      )}

      {/* Section cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {SECTION_KEYS.map(key => {
          const isDrafting = drafting === key || (draftingAll && draftAllProgress.currentKey === key);
          const isDone = !!sections[key];
          return (
            <Card key={key} className={`transition-all ${isDone ? "border-emerald-200" : ""}`}>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  {isDone
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 shrink-0" />}
                  <CardTitle className="text-sm capitalize">{key.replace(/_/g, " ")}</CardTitle>
                </div>
                <Button
                  size="sm"
                  variant={isDone ? "outline" : "default"}
                  disabled={!selectedGrant || isAnyDrafting}
                  onClick={() => draftSection(key)}
                  className={`h-7 text-xs gap-1 ${!isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                >
                  {isDrafting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  {isDrafting ? "Writing…" : isDone ? "Redraft" : "AI Draft"}
                </Button>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={sections[key] || ""}
                  onChange={e => setSections(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={selectedGrant ? "Click 'AI Draft' or 'Draft All' above to generate…" : "Select a grant first…"}
                  className="min-h-28 text-xs resize-none"
                  disabled={isDrafting}
                />
                {isDone && (
                  <p className="text-xs text-slate-400 mt-1 text-right">
                    {sections[key].split(" ").length} words
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Save & continue */}
      {selectedApp && (
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 gap-2"
          disabled={isAnyDrafting || completedCount === 0}
          onClick={onSaveAndContinue}
        >
          <Save className="w-4 h-4" /> Save All & Continue to Edit Guidance
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}