import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function MasterApplicationPanel({ refreshKey = 0, onIntegrated }) {
  const [stats, setStats] = useState(null);
  const [integrating, setIntegrating] = useState(false);

  const load = async () => {
    const res = await base44.entities.MasterApplication.aggregate({
      query: { status: "active" },
      sum: ["prompt_count", "source_count", "conflict_count"],
    });
    const row = res?.rows?.[0] || {};
    setStats({
      sections: row.count || 0,
      prompts: row.sum_prompt_count || 0,
      sources: row.sum_source_count || 0,
      conflicts: row.sum_conflict_count || 0,
    });
  };

  useEffect(() => {
    load().catch(() => setStats(null));
  }, [refreshKey]);

  const integrate = async () => {
    setIntegrating(true);
    try {
      const res = await base44.functions.invoke("integrateFormLibrary", {});
      if (res.data?.error) throw new Error(res.data.error);
      const m = res.data.master || {};
      toast.success(`Integrated ${res.data.library_count} library item${res.data.library_count === 1 ? "" : "s"} · ${m.prompts || 0} prompts across ${m.sections || 0} sections`);
      if (res.data.standard_error) toast.error("Master updated, but the standard template didn't rebuild: " + res.data.standard_error);
      await load();
      onIntegrated?.();
    } catch (e) {
      toast.error("Couldn't integrate the library: " + e.message);
    }
    setIntegrating(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-slate-900">Master Application</p>
            {stats && stats.sections > 0 ? (
              <p className="text-xs text-slate-500">
                {stats.sections} sections · {stats.prompts} prompts from {stats.sources} sources
                {stats.conflicts > 0 ? ` · ${stats.conflicts} conflicting` : ""}
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Everything your library captures collects here, so the next application starts with all of it.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-2" onClick={integrate} disabled={integrating}>
            {integrating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Integrate library
          </Button>
          <Button asChild size="sm" variant={stats?.sections ? "default" : "outline"} className={stats?.sections ? "gap-2 bg-emerald-600 hover:bg-emerald-700" : "gap-2"}>
            <Link to="/master-application">
              Open master <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}