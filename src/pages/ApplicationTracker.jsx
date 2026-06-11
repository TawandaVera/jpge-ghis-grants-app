import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardList, Plus, Clock, AlertTriangle, DollarSign, Pencil, X } from "lucide-react";
import { differenceInDays } from "date-fns";
import { toast } from "sonner";

const COLUMNS = [
  { key: "draft",     label: "Working On It",        dot: "bg-slate-400",   color: "border-slate-200 bg-slate-50/60" },
  { key: "review",    label: "Reviewing",           dot: "bg-blue-500",    color: "border-blue-200 bg-blue-50/50" },
  { key: "submitted", label: "Sent In",             dot: "bg-purple-500",  color: "border-purple-200 bg-purple-50/50" },
  { key: "awarded",   label: "We Got It!",          dot: "bg-emerald-500", color: "border-emerald-200 bg-emerald-50/50" },
  { key: "declined",  label: "Not This Time",       dot: "bg-red-400",     color: "border-red-200 bg-red-50/50" },
];

// Map GrantApplication.stage → tracker column
const toColumn = (stage) => {
  if (stage === "awarded")   return "awarded";
  if (stage === "declined")  return "declined";
  if (stage === "submitted") return "submitted";
  if (["review", "hil_review", "submission_ready", "compliance_check", "budget"].includes(stage)) return "review";
  return "draft";
};

// Map tracker column → GrantApplication.stage
const toStage = (col) => ({
  draft:     "discovery",
  review:    "review",
  submitted: "submitted",
  awarded:   "awarded",
  declined:  "declined",
}[col]);

export default function ApplicationTracker() {
  const [apps, setApps]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [editApp, setEditApp] = useState(null);   // app being edited/created
  const [isNew, setIsNew]     = useState(false);
  const [logApp, setLogApp]   = useState(null);   // app for status log
  const [logNote, setLogNote] = useState("");

  const load = () =>
    base44.entities.GrantApplication.list("-created_date", 200).then(d => {
      setApps(d);
      setLoading(false);
    });

  useEffect(() => { load(); }, []);

  const moveColumn = async (app, col) => {
    await base44.entities.GrantApplication.update(app.id, { stage: toStage(col) });
    load();
  };

  const saveEdit = async () => {
    if (!editApp.grant_title || !editApp.funder) {
      toast.error("Title and funder are required.");
      return;
    }
    if (isNew) {
      await base44.entities.GrantApplication.create({
        ...editApp,
        stage: toStage(editApp._col || "draft"),
      });
    } else {
      await base44.entities.GrantApplication.update(editApp.id, {
        grant_title: editApp.grant_title,
        funder: editApp.funder,
        deadline: editApp.deadline,
        award_amount: editApp.award_amount,
        notes: editApp.notes,
      });
    }
    toast.success(isNew ? "Application created" : "Application updated");
    setEditApp(null);
    load();
  };

  const logStatus = async () => {
    if (!logNote.trim()) return;
    const existing = logApp.notes || "";
    const timestamp = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    await base44.entities.GrantApplication.update(logApp.id, {
      notes: `[${timestamp}] ${logNote.trim()}\n${existing}`.trim(),
    });
    toast.success("Status logged");
    setLogApp(null);
    setLogNote("");
    load();
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-full space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald-600" /> My Applications
          </h1>
          <p className="text-slate-500 text-sm">Move each one along as you go · {apps.length} in your list</p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 gap-2"
          onClick={() => { setEditApp({ grant_title: "", funder: "", deadline: "", award_amount: "", notes: "", _col: "draft" }); setIsNew(true); }}
        >
          <Plus className="w-4 h-4" /> Add One
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {COLUMNS.map(col => {
            const colApps = apps.filter(a => toColumn(a.stage) === col.key);
            return (
              <div key={col.key} className={`w-64 rounded-xl border-2 ${col.color} p-3 shrink-0`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <p className="font-semibold text-sm text-slate-700">{col.label}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">{colApps.length}</Badge>
                    <button
                      onClick={() => { setEditApp({ grant_title: "", funder: "", deadline: "", award_amount: "", notes: "", _col: col.key }); setIsNew(true); }}
                      className="text-slate-400 hover:text-emerald-600 transition-colors"
                      title={`Add to ${col.label}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 min-h-24">
                  {colApps.map(app => (
                    <AppCard
                      key={app.id}
                      app={app}
                      currentCol={col.key}
                      onMove={moveColumn}
                      onEdit={() => { setEditApp({ ...app }); setIsNew(false); }}
                      onLog={() => { setLogApp(app); setLogNote(""); }}
                    />
                  ))}
                  {colApps.length === 0 && (
                    <div className="border-2 border-dashed border-slate-200 rounded-lg py-8 text-center text-xs text-slate-400">Empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit / Create Dialog */}
      <Dialog open={!!editApp} onOpenChange={() => setEditApp(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isNew ? "Add an Application" : "Edit Application"}</DialogTitle>
          </DialogHeader>
          {editApp && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 font-medium">Grant Title *</label>
                <Input value={editApp.grant_title} onChange={e => setEditApp({ ...editApp, grant_title: e.target.value })} placeholder="Grant title" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Funder *</label>
                <Input value={editApp.funder} onChange={e => setEditApp({ ...editApp, funder: e.target.value })} placeholder="Funding agency" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-medium">Deadline</label>
                  <Input type="date" value={editApp.deadline || ""} onChange={e => setEditApp({ ...editApp, deadline: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Award Amount ($)</label>
                  <Input type="number" value={editApp.award_amount || ""} onChange={e => setEditApp({ ...editApp, award_amount: Number(e.target.value) })} placeholder="0" />
                </div>
              </div>
              {isNew && (
                <div>
                  <label className="text-xs text-slate-500 font-medium">Where It Is Now</label>
                  <Select value={editApp._col} onValueChange={v => setEditApp({ ...editApp, _col: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COLUMNS.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <label className="text-xs text-slate-500 font-medium">Notes</label>
                <Textarea value={editApp.notes || ""} onChange={e => setEditApp({ ...editApp, notes: e.target.value })} placeholder="Any notes..." rows={3} />
              </div>
              <div className="flex gap-2 pt-1">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={saveEdit}>
                  {isNew ? "Create" : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => setEditApp(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Log Status Dialog */}
      <Dialog open={!!logApp} onOpenChange={() => setLogApp(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add a Quick Update</DialogTitle>
          </DialogHeader>
          {logApp && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 font-medium line-clamp-2">{logApp.grant_title}</p>
              <Textarea
                value={logNote}
                onChange={e => setLogNote(e.target.value)}
                placeholder="e.g. Submitted narrative draft for review..."
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={logStatus} disabled={!logNote.trim()}>
                  Save Update
                </Button>
                <Button variant="outline" onClick={() => setLogApp(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AppCard({ app, currentCol, onMove, onEdit, onLog }) {
  const days = app.deadline ? differenceInDays(new Date(app.deadline), new Date()) : null;
  const isUrgent = days !== null && days >= 0 && days <= 14;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between gap-1 mb-1">
        <p className="font-medium text-sm text-slate-900 line-clamp-2 leading-tight flex-1">{app.grant_title}</p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={onLog} title="Log status" className="text-slate-400 hover:text-emerald-600 transition-colors">
            <ClipboardList className="w-3.5 h-3.5" />
          </button>
          <button onClick={onEdit} title="Edit" className="text-slate-400 hover:text-blue-600 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-2">{app.funder}</p>

      <div className="flex items-center justify-between mb-2">
        {days !== null ? (
          <div className={`flex items-center gap-1 text-xs ${isUrgent ? "text-red-600 font-medium" : days < 0 ? "text-slate-400" : "text-slate-500"}`}>
            {isUrgent && <AlertTriangle className="w-3 h-3" />}
            <Clock className="w-3 h-3" />
            {days < 0 ? "Overdue" : `${days}d left`}
          </div>
        ) : <span />}
        {app.award_amount > 0 && (
          <span className="text-xs text-emerald-700 font-medium flex items-center gap-0.5">
            <DollarSign className="w-3 h-3" />{(app.award_amount / 1000).toFixed(0)}K
          </span>
        )}
      </div>

      <Select value={currentCol} onValueChange={v => onMove(app, v)}>
        <SelectTrigger className="h-6 text-xs py-0 px-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COLUMNS.map(c => (
            <SelectItem key={c.key} value={c.key} className="text-xs">{c.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}