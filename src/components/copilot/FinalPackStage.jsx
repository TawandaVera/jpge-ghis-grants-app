import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Download, Wand2, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { SECTION_KEYS } from "@/lib/grantConstants";

export default function FinalPackStage({ sections, selectedGrant, selectedApp, orgProfile }) {
  const [compiling, setCompiling] = useState(false);
  const [finalDoc, setFinalDoc] = useState(null);

  const completedSections = SECTION_KEYS.filter(k => sections[k]);
  const missingSections = SECTION_KEYS.filter(k => !sections[k]);
  const readinessPct = Math.round((completedSections.length / SECTION_KEYS.length) * 100);

  const compileAndExport = () => {
    if (!selectedGrant) { toast.error("No grant selected"); return; }
    const lines = [];
    lines.push(`GRANT PROPOSAL — SUBMISSION PACKAGE`);
    lines.push(`${"=".repeat(60)}`);
    lines.push(`OPPORTUNITY: ${selectedGrant.title}`);
    lines.push(`FUNDER: ${selectedGrant.funder}`);
    lines.push(`DEADLINE: ${selectedGrant.deadline || "N/A"}`);
    if (orgProfile) {
      lines.push(`APPLICANT: ${orgProfile.org_name}`);
      lines.push(`EIN: ${orgProfile.ein || "N/A"} | UEI: ${orgProfile.duns_uei || "N/A"}`);
    }
    lines.push(`GENERATED: ${new Date().toLocaleDateString()}`);
    lines.push(`${"=".repeat(60)}\n`);

    SECTION_KEYS.forEach(key => {
      if (sections[key]) {
        lines.push(`\n${"─".repeat(60)}`);
        lines.push(key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()).toUpperCase());
        lines.push(`${"─".repeat(60)}`);
        lines.push(sections[key]);
      }
    });

    lines.push(`\n${"=".repeat(60)}`);
    lines.push(`END OF PROPOSAL — ${completedSections.length}/${SECTION_KEYS.length} SECTIONS`);

    const text = lines.join("\n");
    setFinalDoc(text);

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(selectedGrant.title || "proposal").replace(/[^a-z0-9]/gi, "_").toLowerCase()}_proposal.txt`;
    a.click();
    toast.success("Proposal exported!");
  };

  const generateFinalReview = async () => {
    if (completedSections.length === 0) { toast.error("No sections drafted yet"); return; }
    setCompiling(true);
    try {
      const sectionsText = SECTION_KEYS.filter(k => sections[k])
        .map(k => `## ${k.replace(/_/g, " ").toUpperCase()}\n${sections[k]}`)
        .join("\n\n");

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior grant reviewer. Perform a final pre-submission review of this grant proposal.

GRANT: ${selectedGrant?.title || "N/A"}
FUNDER: ${selectedGrant?.funder || "N/A"}
ORG: ${orgProfile?.org_name || "GHIS LLC"}

FULL PROPOSAL DRAFT:
${sectionsText}

Provide:
1. OVERALL READINESS SCORE (0-100)
2. TOP 3 STRENGTHS of this proposal
3. TOP 3 CRITICAL GAPS or weaknesses that must be fixed before submission
4. SUBMISSION CHECKLIST — list of items to verify before submitting (compliance, attachments, forms, portal registration)
5. FUNDER ALIGNMENT SCORE (how well this proposal matches the funder's stated priorities, 0-10)
6. ONE-PARAGRAPH EXECUTIVE NOTE for CEO sign-off`,
        response_json_schema: {
          type: "object",
          properties: {
            readiness_score: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            critical_gaps: { type: "array", items: { type: "string" } },
            submission_checklist: { type: "array", items: { type: "string" } },
            funder_alignment_score: { type: "number" },
            executive_note: { type: "string" }
          }
        }
      });
      setFinalDoc(result);
      toast.success("Final review complete");
    } catch (e) {
      toast.error("Review failed: " + e.message);
    }
    setCompiling(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Stage 8: Final Pack & Submission</h2>
        <p className="text-slate-500 text-sm">Review readiness, run a final AI check, and export your proposal</p>
      </div>

      {/* Readiness meter */}
      <Card className={`border-2 ${readinessPct === 100 ? "border-emerald-300 bg-emerald-50" : readinessPct >= 70 ? "border-blue-300 bg-blue-50" : "border-amber-300 bg-amber-50"}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-800">Proposal Readiness</span>
            <span className={`text-2xl font-bold ${readinessPct === 100 ? "text-emerald-700" : readinessPct >= 70 ? "text-blue-700" : "text-amber-700"}`}>{readinessPct}%</span>
          </div>
          <div className="h-2 bg-white rounded-full border mb-3">
            <div className="h-2 rounded-full transition-all bg-emerald-500" style={{ width: `${readinessPct}%` }} />
          </div>
          <div className="grid grid-cols-1 gap-1">
            {SECTION_KEYS.map(key => (
              <div key={key} className="flex items-center gap-2 text-sm">
                {sections[key]
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                <span className={sections[key] ? "text-slate-700" : "text-slate-400"}>
                  {key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                </span>
                {sections[key] && (
                  <span className="text-xs text-slate-400 ml-auto">{sections[key].split(" ").length} words</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={generateFinalReview}
          disabled={compiling || completedSections.length === 0}
          className="gap-2 bg-purple-600 hover:bg-purple-700"
        >
          {compiling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {compiling ? "Reviewing..." : "Run Final AI Review"}
        </Button>
        <Button
          onClick={compileAndExport}
          disabled={completedSections.length === 0}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          <Download className="w-4 h-4" /> Export Full Proposal (.txt)
        </Button>
      </div>

      {/* Final review results */}
      {finalDoc && typeof finalDoc === "object" && (
        <div className="space-y-4">
          <Card className="border-purple-200">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-purple-500" /> Final Review Results</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="text-center bg-purple-50 rounded-lg p-3 flex-1">
                  <p className="text-2xl font-bold text-purple-700">{finalDoc.readiness_score || "—"}</p>
                  <p className="text-xs text-slate-500">Readiness Score</p>
                </div>
                <div className="text-center bg-emerald-50 rounded-lg p-3 flex-1">
                  <p className="text-2xl font-bold text-emerald-700">{finalDoc.funder_alignment_score || "—"}/10</p>
                  <p className="text-xs text-slate-500">Funder Alignment</p>
                </div>
              </div>

              {finalDoc.executive_note && (
                <div className="bg-slate-50 border rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-500 mb-1">EXECUTIVE NOTE</p>
                  <p className="text-sm text-slate-700">{finalDoc.executive_note}</p>
                </div>
              )}

              {finalDoc.strengths?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-emerald-700 mb-1">✓ Strengths</p>
                  <ul className="space-y-1">{finalDoc.strengths.map((s, i) => <li key={i} className="text-sm text-slate-600 flex gap-2"><span className="text-emerald-500">•</span>{s}</li>)}</ul>
                </div>
              )}

              {finalDoc.critical_gaps?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-600 mb-1">⚠ Critical Gaps — Fix Before Submission</p>
                  <ul className="space-y-1">{finalDoc.critical_gaps.map((s, i) => <li key={i} className="text-sm text-slate-600 flex gap-2"><span className="text-red-400">→</span>{s}</li>)}</ul>
                </div>
              )}

              {finalDoc.submission_checklist?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">📋 Submission Checklist</p>
                  <ul className="space-y-1">{finalDoc.submission_checklist.map((s, i) => (
                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                      <input type="checkbox" className="mt-0.5 accent-emerald-600" />
                      {s}
                    </li>
                  ))}</ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Button onClick={compileAndExport} className="gap-2 bg-emerald-600 hover:bg-emerald-700 w-full">
            <Download className="w-4 h-4" /> Download Final Proposal
          </Button>
        </div>
      )}
    </div>
  );
}