import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, Filter, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import MasterSectionCard from "@/components/forms/MasterSectionCard";
import TailorFromMasterDialog from "@/components/forms/TailorFromMasterDialog";

export default function MasterApplication() {
  const [sections, setSections] = useState([]);
  const [stats, setStats] = useState({ sections: 0, prompts: 0, sources: 0, conflicts: 0 });
  const [loading, setLoading] = useState(true);
  const [integrating, setIntegrating] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const res = await base44.entities.MasterApplication.aggregate({
          query: { status: "active" },
          sum: ["prompt_count", "source_count", "conflict_count"],
        });
        const row = res?.rows?.[0] || {};
        const page = await base44.entities.MasterApplication.filter(
          { status: "active" },
          { sort: "section_key", limit: 100 },
        );
        if (!cancelled) {
          setStats({
            sections: row.count || 0,
            prompts: row.sum_prompt_count || 0,
            sources: row.sum_source_count || 0,
            conflicts: row.sum_conflict_count || 0,
          });
          setSections(page?.items || []);
        }
      } catch (e) {
        if (!cancelled) setSections([]);
      }
      if (!cancelled) setLoading(false);
    };
    run();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const integrate = async () => {
    setIntegrating(true);
    try {
      const res = await base44.functions.invoke("integrateFormLibrary", {});
      if (res.data?.error) throw new Error(res.data.error);
      const m = res.data.master || {};
      toast.success(`Integrated ${res.data.library_count} library item${res.data.library_count === 1 ? "" : "s"} · ${m.prompts || 0} prompts across ${m.sections || 0} sections`);
      if (res.data.standard_error) toast.error("Master updated, but the standard template didn't rebuild: " + res.data.standard_error);
      setRefreshKey(k => k + 1);
    } catch (e) {
      toast.error("Couldn't integrate the library: " + e.message);
    }
    setIntegrating(false);
  };

  return (
    <div className="p-6 max-w-full space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" /> Master Application
          </h1>
          <p className="text-slate-500 text-sm">
            Every section, prompt and requirement your library has ever captured, kept together so each new application starts from all of it.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={integrate} disabled={integrating}>
            {integrating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Integrate library
          </Button>
          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setTailoring(true)}
            disabled={!stats.sections}
          >
            <Filter className="w-4 h-4" /> Draft for an opportunity
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <p className="text-xs text-slate-500">Sections</p>
          <p className="text-xl font-bold text-slate-900">{stats.sections}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <p className="text-xs text-slate-500">Prompts kept</p>
          <p className="text-xl font-bold text-emerald-600">{stats.prompts}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <p className="text-xs text-slate-500">Source documents</p>
          <p className="text-xl font-bold text-slate-900">{stats.sources}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Conflicting sources
          </p>
          <p className="text-xl font-bold text-amber-600">{stats.conflicts}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : sections.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-xl py-16 text-center">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Nothing integrated yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            Integrate your form library and every captured section, prompt and requirement collects here.
          </p>
          <Button className="mt-4 gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={integrate} disabled={integrating}>
            {integrating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Integrate library
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map(section => <MasterSectionCard key={section.section_key} section={section} />)}
        </div>
      )}

      {!loading && sections.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge variant="outline" className="text-xs">{sections.length} sections in the master</Badge>
          {stats.conflicts > 0 && (
            <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">
              {stats.conflicts} prompts where sources disagree — kept side by side, never overwritten
            </Badge>
          )}
        </div>
      )}

      <TailorFromMasterDialog open={tailoring} onOpenChange={setTailoring} />
    </div>
  );
}