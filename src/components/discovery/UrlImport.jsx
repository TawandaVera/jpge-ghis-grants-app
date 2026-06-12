import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link2, Loader2, Sparkles, CheckCircle2, PenLine, BookmarkPlus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// Paste a grant URL → AI reads the page and pulls out all details + requirements.
export default function UrlImport({ onSaved }) {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const lookUp = async () => {
    setLoading(true);
    setResult(null);
    try {
      const data = await base44.integrations.Core.InvokeLLM({
        prompt: `Visit and read this grant opportunity page RIGHT NOW: ${url}

Extract the complete details of this funding opportunity. Be accurate — only report what the page (or the funder's official site) actually says. Do NOT invent details.

Extract:
1. Grant title and funder name
2. Opportunity number (if any) and CFDA number (if any)
3. A clear 2-3 sentence description of what the grant funds
4. Eligibility — who can apply (nonprofits, LLCs, for-profits, government, etc.)
5. Award amounts (min and max if stated)
6. Application deadline (YYYY-MM-DD format)
7. Geographic scope
8. REQUIREMENTS — list every document, form, narrative section, attachment, or registration the applicant must submit (e.g. "SAM.gov registration", "Project narrative (10 pages max)", "Detailed budget with justification", "Letters of support")
9. Best matching category: health_equity, digital_health, workforce_development, community_engagement, research, or other

If you cannot access the page or confirm it is a real grant, set found=false.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            found: { type: "boolean" },
            title: { type: "string" },
            funder: { type: "string" },
            opportunity_number: { type: "string" },
            cfda_number: { type: "string" },
            description: { type: "string" },
            eligibility: { type: "string" },
            award_amount_min: { type: "number" },
            award_amount_max: { type: "number" },
            deadline: { type: "string" },
            geographic_scope: { type: "string" },
            requirements: { type: "array", items: { type: "string" } },
            category: { type: "string" },
            notes: { type: "string" }
          }
        }
      });

      if (!data.found || !data.title) {
        toast.error("Couldn't read that page. Check the link and try again.");
      } else {
        setResult(data);
      }
    } catch (e) {
      toast.error("Lookup failed: " + e.message);
    }
    setLoading(false);
  };

  const save = async (startApplication) => {
    setSaving(true);
    try {
      const grant = await base44.entities.Grant.create({
        title: result.title,
        funder: result.funder || "Unknown",
        opportunity_number: result.opportunity_number || "",
        cfda_number: result.cfda_number || "",
        description: result.description || "",
        eligibility: result.eligibility || "",
        requirements: result.requirements || [],
        award_amount_min: result.award_amount_min || 0,
        award_amount_max: result.award_amount_max || 0,
        deadline: result.deadline || "",
        geographic_scope: result.geographic_scope || "",
        category: ["health_equity", "digital_health", "workforce_development", "community_engagement", "research"].includes(result.category) ? result.category : "other",
        source_url: url,
        status: "open",
        posted_date: new Date().toISOString().split("T")[0],
      });

      if (startApplication) {
        await base44.entities.GrantApplication.create({
          grant_id: grant.id,
          grant_title: grant.title,
          funder: grant.funder,
          deadline: grant.deadline,
          stage: "writing",
        });
        toast.success("Saved! Taking you to the AI writer...");
        navigate("/copilot");
      } else {
        toast.success("Saved to your library");
        setResult(null);
        setUrl("");
        onSaved?.();
      }
    } catch (e) {
      toast.error("Save failed: " + e.message);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Found a grant somewhere else? Paste the link and the AI will read the page, pull out all the details and requirements, and get an application started for you.
      </p>
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="https://www.grants.gov/search-results-detail/..."
            className="pl-9"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && url.trim() && !loading && lookUp()}
          />
        </div>
        <Button onClick={lookUp} disabled={loading || !url.trim().startsWith("http")} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Reading the page..." : "Look It Up"}
        </Button>
      </div>

      {result && (
        <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">{result.title}</p>
              <p className="text-sm text-slate-500">{result.funder}</p>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 shrink-0">Found ✓</Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><p className="text-xs text-slate-500">Award</p><p className="font-medium text-emerald-700">{result.award_amount_min ? `$${(result.award_amount_min/1000).toFixed(0)}K` : "—"}{result.award_amount_max ? `–$${(result.award_amount_max/1000).toFixed(0)}K` : ""}</p></div>
            <div><p className="text-xs text-slate-500">Deadline</p><p className="font-medium">{result.deadline ? format(new Date(result.deadline), "MMM d, yyyy") : "—"}</p></div>
            <div><p className="text-xs text-slate-500">Opportunity #</p><p className="font-medium">{result.opportunity_number || "—"}</p></div>
            <div><p className="text-xs text-slate-500">Where</p><p className="font-medium">{result.geographic_scope || "—"}</p></div>
          </div>

          {result.description && <p className="text-sm text-slate-700">{result.description}</p>}
          {result.eligibility && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Who Can Apply</p>
              <p className="text-sm text-slate-700">{result.eligibility}</p>
            </div>
          )}

          {result.requirements?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1.5">What You'll Need to Submit</p>
              <ul className="space-y-1">
                {result.requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2 pt-1 flex-wrap">
            <Button onClick={() => save(true)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
              Save & Start My Application
            </Button>
            <Button variant="outline" onClick={() => save(false)} disabled={saving} className="gap-2">
              <BookmarkPlus className="w-4 h-4" /> Just Save It
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}