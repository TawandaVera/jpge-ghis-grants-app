import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Kanban, List, Clock, AlertTriangle, Wand2 } from "lucide-react";
import { differenceInDays } from "date-fns";

// Simplified Kanban stages matching the copy app's working UX
const KANBAN_STAGES = [
  { key: "in_progress", label: "Working On It", dot: "bg-blue-500", color: "border-blue-200 bg-blue-50/50" },
  { key: "submitted", label: "Sent In", dot: "bg-purple-500", color: "border-purple-200 bg-purple-50/50" },
  { key: "pending_decision", label: "Waiting to Hear Back", dot: "bg-amber-500", color: "border-amber-200 bg-amber-50/50" },
  { key: "awarded", label: "We Got It!", dot: "bg-emerald-500", color: "border-emerald-200 bg-emerald-50/50" },
  { key: "declined", label: "Not This Time", dot: "bg-red-500", color: "border-red-200 bg-red-50/50" },
];

// Full lifecycle stages for list view / backward compat
const STAGES = [
  { key: "discovery", label: "Found It" },
  { key: "assessment", label: "Scored" },
  { key: "matching", label: "Matching" },
  { key: "writing", label: "Writing" },
  { key: "compliance_check", label: "Checking Rules" },
  { key: "budget", label: "Budget" },
  { key: "review", label: "Reviewing" },
  { key: "hil_review", label: "Final Review" },
  { key: "submission_ready", label: "Ready to Send" },
  { key: "submitted", label: "Sent In" },
  { key: "awarded", label: "We Got It!" },
  { key: "declined", label: "Not This Time" },
];

export default function Pipeline() {
  const navigate = useNavigate();
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

  // Map legacy stages to kanban buckets
  const toKanban = (stage) => {
    if (stage === "awarded") return "awarded";
    if (stage === "declined") return "declined";
    if (stage === "submitted") return "submitted";
    if (["hil_review", "review", "submission_ready"].includes(stage)) return "pending_decision";
    return "in_progress";
  };

  const moveKanban = async (app, newKanbanStage) => {
    const stageMap = {
      in_progress: "writing",
      submitted: "submitted",
      pending_decision: "hil_review",
      awarded: "awarded",
      declined: "declined",
    };
    await moveStage(app, stageMap[newKanbanStage]);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-full space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Track Progress</h1>
        <p className="text-slate-500 text-sm">Move cards along as you go · {apps.length} in progress</p>
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban" className="gap-2"><Kanban className="w-4 h-4" />Board</TabsTrigger>
          <TabsTrigger value="list" className="gap-2"><List className="w-4 h-4" />List</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban">
          <div className="overflow-x-auto pb-4 pt-4">
            <div className="flex gap-4 min-w-max">
              {KANBAN_STAGES.map(stage => {
                const stageApps = apps.filter(a => toKanban(a.stage) === stage.key);
                return (
                  <div key={stage.key} className={`w-64 rounded-xl border-2 ${stage.color} p-3 shrink-0`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
                        <p className="font-semibold text-sm text-slate-700">{stage.label}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{stageApps.length}</Badge>
                    </div>
                    <div className="space-y-2 min-h-24">
                      {stageApps.map(app => (
                        <KanbanCard key={app.id} app={app} currentKanban={stage.key} onMove={moveKanban} onDraft={async () => {
                          await base44.entities.GrantApplication.update(app.id, { stage: "writing" });
                          navigate(`/copilot?app_id=${app.id}`);
                        }} />
                      ))}
                      {stageApps.length === 0 && (
                        <div className="border-2 border-dashed border-slate-200 rounded-lg py-8 text-center text-xs text-slate-400">Empty</div>
                      )}
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
            {apps.length === 0 && (
              <p className="text-center py-16 text-slate-400">Nothing here yet.<br /><span className="text-sm">Add opportunities from the Score Matches page to start tracking them.</span></p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KanbanCard({ app, currentKanban, onMove, onDraft }) {
  const days = app.deadline ? differenceInDays(new Date(app.deadline), new Date()) : null;
  const isUrgent = days !== null && days >= 0 && days <= 14;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow">
      <p className="font-medium text-sm text-slate-900 line-clamp-2 mb-1">{app.grant_title}</p>
      <p className="text-xs text-slate-500 mb-2">{app.funder}</p>
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center gap-1 text-xs ${isUrgent ? "text-red-600 font-medium" : days < 0 ? "text-slate-400" : "text-slate-500"}`}>
          {isUrgent && <AlertTriangle className="w-3 h-3" />}
          {days !== null && <Clock className="w-3 h-3" />}
          {days !== null ? (days < 0 ? "Overdue" : `${days}d left`) : "—"}
        </div>
        {app.award_amount_min && <span className="text-xs text-emerald-700 font-medium">${(app.award_amount_min/1000).toFixed(0)}K</span>}
      </div>
      <button
        onClick={onDraft}
        className="w-full flex items-center justify-center gap-1.5 text-xs text-purple-700 border border-purple-200 rounded-md py-1 hover:bg-purple-50 transition-colors mb-2"
      >
        <Wand2 className="w-3 h-3" /> Write with AI
      </button>
      <Select value={currentKanban} onValueChange={v => onMove(app, v)}>
        <SelectTrigger className="h-6 text-xs py-0 px-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {["in_progress", "submitted", "pending_decision", "awarded", "declined"].map(k => (
            <SelectItem key={k} value={k} className="text-xs">
              {k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}