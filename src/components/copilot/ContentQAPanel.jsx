import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Wand2, Loader2, CheckCircle2, AlertTriangle, Trash2, Merge, X } from "lucide-react";
import { toast } from "sonner";

function similarity(a = "", b = "") {
  // Simple word-overlap Jaccard similarity
  const setA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 4));
  const setB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 4));
  if (!setA.size || !setB.size) return 0;
  const intersection = [...setA].filter(w => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

export default function ContentQAPanel({ parsedBlocks, onUpdateBlocks }) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [issues, setIssues] = useState(null);
  const [aiFlags, setAiFlags] = useState([]);

  const runQA = async () => {
    setRunning(true);
    setIssues(null);
    setAiFlags([]);

    const found = [];

    // 1. Exact section-name duplicates
    const nameSeen = {};
    parsedBlocks.forEach((b, i) => {
      const key = b.section?.trim().toLowerCase();
      if (!key) return;
      if (nameSeen[key] !== undefined) {
        found.push({ type: "duplicate_name", severity: "high", indices: [nameSeen[key], i], label: `Duplicate section: "${b.section}"`, description: "Two blocks share the exact same section name." });
      } else {
        nameSeen[key] = i;
      }
    });

    // 2. Near-duplicate content (Jaccard > 0.55)
    for (let i = 0; i < parsedBlocks.length; i++) {
      for (let j = i + 1; j < parsedBlocks.length; j++) {
        const sim = similarity(parsedBlocks[i].content, parsedBlocks[j].content);
        if (sim > 0.55) {
          const alreadyFlagged = found.some(f => f.type === "near_duplicate" && f.indices.includes(i) && f.indices.includes(j));
          if (!alreadyFlagged) {
            found.push({ type: "near_duplicate", severity: "medium", indices: [i, j], label: `Near-duplicate content (${Math.round(sim * 100)}% overlap)`, description: `"${parsedBlocks[i].section}" and "${parsedBlocks[j].section}" share most of the same text.` });
          }
        }
      }
    }

    // 3. Empty / very short blocks
    parsedBlocks.forEach((b, i) => {
      if (!b.content || b.content.trim().length < 80) {
        found.push({ type: "too_short", severity: "medium", indices: [i], label: `Too short: "${b.section}"`, description: "This block is under 80 characters — likely a stub or header only." });
      }
    });

    // 4. AI quality check on all blocks
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a grant writing quality analyst. Review these content blocks from a master narrative library and identify any issues.

BLOCKS:
${parsedBlocks.map((b, i) => `[${i}] ${b.section}:\n${b.content?.substring(0, 300) || "(empty)"}`).join("\n\n---\n\n")}

Identify blocks that are:
- Redundant or overlapping in purpose with another block
- Generic boilerplate with no specific organizational details
- Missing key specifics (no data, no names, no outcomes)
- Mislabelled (content doesn't match the section name)

Return only real issues, not style preferences. Be concise.`,
        response_json_schema: {
          type: "object",
          properties: {
            flags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  index: { type: "number" },
                  issue_type: { type: "string" },
                  description: { type: "string" }
                }
              }
            }
          }
        }
      });
      setAiFlags(result.flags || []);
    } catch (e) {
      // AI check is best-effort; don't block showing structural issues
    }

    setIssues(found);
    setRunning(false);
    setOpen(true);

    if (found.length === 0) {
      toast.success("All clear — no duplicates or issues found");
    } else {
      toast.warning(`Found ${found.length} issue${found.length > 1 ? "s" : ""} to review`);
    }
  };

  const removeBlock = (idx) => {
    const updated = parsedBlocks.filter((_, i) => i !== idx);
    onUpdateBlocks(updated);
    // Remove any issues referencing this index
    setIssues(prev => prev
      .filter(iss => !iss.indices.includes(idx))
      .map(iss => ({ ...iss, indices: iss.indices.map(i => i > idx ? i - 1 : i) }))
    );
    setAiFlags(prev => prev
      .filter(f => f.index !== idx)
      .map(f => ({ ...f, index: f.index > idx ? f.index - 1 : f.index }))
    );
    toast.success("Block removed");
  };

  const mergeBlocks = (idxA, idxB) => {
    const a = parsedBlocks[idxA];
    const b = parsedBlocks[idxB];
    const merged = {
      ...a,
      content: `${a.content?.trim()}\n\n${b.content?.trim()}`,
    };
    const updated = parsedBlocks.filter((_, i) => i !== idxA && i !== idxB);
    updated.splice(Math.min(idxA, idxB), 0, merged);
    onUpdateBlocks(updated);
    setIssues(prev => prev.filter(iss => !(iss.indices.includes(idxA) && iss.indices.includes(idxB))));
    toast.success(`Merged into "${merged.section}"`);
  };

  const totalIssues = (issues?.length || 0) + aiFlags.length;

  return (
    <div className="mb-2">
      {/* Trigger */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-800">Your Content, Sorted</h3>
          {parsedBlocks.length > 0 && <Badge variant="outline">{parsedBlocks.length} pieces</Badge>}
        </div>
        {parsedBlocks.length > 0 && (
          <Button size="sm" variant="outline" onClick={runQA} disabled={running} className="gap-1.5 text-xs">
            {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            {running ? "Checking..." : "Clean Up & QA"}
            {totalIssues > 0 && !running && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">{totalIssues}</span>
            )}
          </Button>
        )}
      </div>

      {/* Results panel */}
      {open && issues !== null && (
        <div className="mb-4 border border-amber-200 rounded-xl bg-amber-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-amber-200 bg-amber-100/60">
            <div className="flex items-center gap-2">
              {totalIssues === 0
                ? <><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold text-emerald-700">All clear — no issues found</span></>
                : <><AlertTriangle className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold text-amber-800">{totalIssues} issue{totalIssues > 1 ? "s" : ""} found</span></>
              }
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>

          {totalIssues > 0 && (
            <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
              {/* Structural issues */}
              {issues.map((iss, i) => (
                <div key={i} className={`rounded-lg border p-3 bg-white ${iss.severity === "high" ? "border-red-200" : "border-amber-200"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge className={`text-[10px] ${iss.severity === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                          {iss.type === "duplicate_name" ? "Exact Duplicate" : iss.type === "near_duplicate" ? "Near-Duplicate" : "Too Short"}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-slate-800">{iss.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{iss.description}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {(iss.type === "duplicate_name" || iss.type === "near_duplicate") && iss.indices.length === 2 && (
                        <button
                          onClick={() => mergeBlocks(iss.indices[0], iss.indices[1])}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <Merge className="w-3 h-3" /> Merge
                        </button>
                      )}
                      <button
                        onClick={() => removeBlock(iss.indices[iss.indices.length - 1])}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* AI quality flags */}
              {aiFlags.map((flag, i) => {
                const block = parsedBlocks[flag.index];
                if (!block) return null;
                return (
                  <div key={`ai-${i}`} className="rounded-lg border border-slate-200 p-3 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge className="text-[10px] bg-slate-100 text-slate-600">AI Review</Badge>
                          <span className="text-xs text-slate-500">"{block.section}"</span>
                        </div>
                        <p className="text-xs text-slate-600">{flag.description}</p>
                      </div>
                      <button
                        onClick={() => removeBlock(flag.index)}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 shrink-0"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}