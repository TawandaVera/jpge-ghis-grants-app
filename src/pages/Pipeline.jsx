import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Kanban, List, Calendar, Clock, AlertTriangle } from "lucide-react";
import { differenceInDays } from "date-fns";

const STAGES = [
  { key: "discovery", label: "Discovery", color: "border-slate-300 bg-slate-50" },
  { key: "assessment", label: "Assessment", color: "border-blue-300 bg-blue-50" },
  { key: "matching", label: "Matching", color: "border-purple-300 bg-purple-50" },
  { key: "writing", label: "Writing", color: "border-yellow-300 bg-yellow-50" },
  { key: "compliance_check", label: "Compliance", color: "border-orange-300 bg-orange-50" },
  { key: "budget", label: "Budget", color: "border-cyan-300 bg-cyan-50" },
  { key: "review", label: "Review", color: "border-indigo-300 bg-indigo-50" },
  { key: "hil_review", label: "HIL Review", color: "border-red-300 bg-red-50" },
  { key: "submission_ready", label: "Submission Ready", color: "border-teal-300 bg-teal-50" },
  { key: "submitted", label: "Submitted", color: "border-emerald-300 bg-emerald-50" },
  { key: "awarded", label: "Awarded", color: "border-green-400 bg-green-50" },
  { key: "declined", label: "Declined", color: "border-gray-300 bg-gray-50" },
];

export default function Pipeline() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.GrantApplication.list("-created_date", 100).then(data => {
      setApps(data);
      setLoading(false);
    });
  }, []);

  const moveStage = async (app, newStage) => {
    await base44.entities.GrantApplication.update(app.id, { stage: newStage });
    const updated = await base44.entities.GrantApplication.list("-created_date", 100);
    setApps(updated);
  };

  const AppCard = ({ app }) => {
    const days = app.deadline ? differenceInDays(new Date(app.deadline), new Date()) : null;
    const isUrgent = days !== null && days >= 0 && days <= 14;
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow">
        <p className="font-medium text-sm text-slate-900 line-clamp-2 mb-1">{app.grant_title}</p>
        <p className="text-xs text-slate-500 mb-2">{app.funder}</p>
        {days !== null && (
          <div className={`flex items-center gap-1 text-xs ${isUrgent ? "text-red-600" : days < 0 ? "text-slate-400 line-through" : "text-slate-500"}`}>
            {isUrgent && <AlertTriangle className="w-3 h-3" />}
            <Clock className="w-3 h-3" />
            {days < 0 ? "Overdue" : `${days}d left`}
          </div>
        )}
      </div>
    );
  };

  const AppRow = ({ app }) => {
    const days = app.deadline ? differenceInDays(new Date(app.deadline), new Date()) : null;
    const stageInfo = STAGES.find(s => s.key === app.stage);
    const currentIdx = STAGES.findIndex(s => s.key === app.stage);

    return (
      <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-slate-200 hover:shadow-sm transition-shadow">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-slate-900 truncate">{app.grant_title}</p>
          <p className="text-xs text-slate-500">{app.funder}</p>
        </div>
        <Badge className="text-xs shrink-0" variant="outline">{stageInfo?.label}</Badge>
        {days !== null && (
          <span className={`text-xs shrink-0 ${days >= 0 && days <= 14 ? "text-red-600 font-medium" : days < 0 ? "text-slate-400" : "text-slate-500"}`}>
            {days < 0 ? "Overdue" : `${days}d`}
          </span>
        )}
        <div className="flex gap-1 shrink-0">
          {currentIdx > 0 && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => moveStage(app, STAGES[currentIdx - 1].key)}>←</Button>
          )}
          {currentIdx < STAGES.length - 1 && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700" onClick={() => moveStage(app, STAGES[currentIdx + 1].key)}>→</Button>
          )}
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-full space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pipeline</h1>
        <p className="text-slate-500 text-sm">{apps.length} applications across {STAGES.length} stages</p>
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban" className="gap-2"><Kanban className="w-4 h-4" />Kanban</TabsTrigger>
          <TabsTrigger value="list" className="gap-2"><List className="w-4 h-4" />List</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban">
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max pt-4">
              {STAGES.map(stage => {
                const stageApps = apps.filter(a => a.stage === stage.key);
                return (
                  <div key={stage.key} className={`w-56 rounded-xl border-2 ${stage.color} p-3 shrink-0`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium text-sm text-slate-700">{stage.label}</p>
                      <Badge variant="outline" className="text-xs">{stageApps.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {stageApps.map(app => <AppCard key={app.id} app={app} />)}
                      {stageApps.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Empty</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list">
          <div className="space-y-2 mt-4">
            {apps.map(app => <AppRow key={app.id} app={app} />)}
            {apps.length === 0 && <p className="text-center py-16 text-slate-400">No applications in pipeline.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}