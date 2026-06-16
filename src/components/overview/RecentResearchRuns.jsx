import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { FlaskConical, CheckCircle2, Loader2, AlertTriangle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG = {
  complete: { label: "Complete", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  running:  { label: "Running",  icon: Loader2,      color: "text-blue-600",    bg: "bg-blue-50 border-blue-200",    spin: true },
  pending:  { label: "Pending",  icon: Clock,        color: "text-amber-600",   bg: "bg-amber-50 border-amber-200" },
  failed:   { label: "Failed",   icon: AlertTriangle, color: "text-red-500",    bg: "bg-red-50 border-red-200" },
};

export default function RecentResearchRuns({ runs = [], grants = [] }) {
  if (runs.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-purple-500" /> Donor Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-sm text-slate-400 mb-2">No research runs yet.</p>
            <Link to="/dossier">
              <span className="text-xs text-purple-600 hover:underline">Open Funding Library to investigate a donor →</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const grantMap = {};
  grants.forEach(g => { grantMap[g.id] = g; });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-purple-500" /> Donor Intelligence
          </span>
          <Link to="/dossier">
            <span className="text-xs text-purple-600 font-normal hover:underline">View all →</span>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {runs.map(run => {
          const grant = grantMap[run.grant_id];
          const cfg = STATUS_CONFIG[run.status] || STATUS_CONFIG.pending;
          const StatusIcon = cfg.icon;
          const signals = (run.cause_signals || []).slice(0, 3);
          const individualsCount = (run.linked_individuals || []).length;

          return (
            <div
              key={run.id}
              className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0"
            >
              {/* Status icon */}
              <div className={`mt-0.5 p-1.5 rounded-lg border ${cfg.bg} shrink-0`}>
                <StatusIcon className={`w-3.5 h-3.5 ${cfg.color} ${cfg.spin ? "animate-spin" : ""}`} />
              </div>

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {grant?.funder || grant?.title || "Unknown Funder"}
                  </p>
                  <Badge className={`text-xs border-0 px-1.5 py-0 ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </Badge>
                </div>
                {grant?.title && (
                  <p className="text-xs text-slate-400 truncate mt-0.5">{grant.title}</p>
                )}

                {/* Cause signals */}
                {signals.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {signals.map((s, i) => (
                      <span key={i} className="text-xs bg-purple-50 text-purple-700 border border-purple-100 rounded-full px-2 py-0.5">
                        {s}
                      </span>
                    ))}
                    {(run.cause_signals || []).length > 3 && (
                      <span className="text-xs text-slate-400">+{(run.cause_signals || []).length - 3} more</span>
                    )}
                  </div>
                )}
              </div>

              {/* Right: individuals + timestamp */}
              <div className="shrink-0 text-right">
                {run.status === "complete" && individualsCount > 0 && (
                  <p className="text-xs font-semibold text-slate-700">{individualsCount} {individualsCount === 1 ? "person" : "people"}</p>
                )}
                {run.status === "complete" && run.confidence_score != null && (
                  <p className="text-xs text-slate-400">{run.confidence_score}% confidence</p>
                )}
                {run.run_date && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDistanceToNow(new Date(run.run_date), { addSuffix: true })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}