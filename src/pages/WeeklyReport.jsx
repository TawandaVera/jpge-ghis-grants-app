import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, Users, Eye, Send, Trash2, Plus, Building2, MailPlus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function WeeklyReport() {
  const { toast } = useToast();
  const [tracked, setTracked] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubEmail, setNewSubEmail] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [trackedRes, subsRes, wsRes] = await Promise.all([
        base44.entities.WeeklyReportWorkspace.list(),
        base44.entities.WeeklyReportSubscriber.list(),
        base44.entities.Workspace.list(),
      ]);
      setTracked(trackedRes);
      setSubscribers(subsRes);
      setWorkspaces(wsRes);
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to load report data", description: e.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const trackedIds = new Set(tracked.map(t => t.workspace_id));
  const availableWorkspaces = workspaces.filter(w => !trackedIds.has(w.id));

  const addWorkspace = async () => {
    if (!selectedWorkspace) return;
    const ws = workspaces.find(w => w.id === selectedWorkspace);
    if (!ws) return;
    try {
      await base44.entities.WeeklyReportWorkspace.create({
        workspace_id: ws.id,
        owner_id: ws.owner_id,
        owner_name: ws.owner_name || ws.owner_email,
        owner_email: ws.owner_email,
        org_name: ws.org_name || "",
        is_active: true,
      });
      setSelectedWorkspace("");
      toast({ title: "Workspace added to weekly report" });
      loadData();
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to add workspace", description: e.message });
    }
  };

  const removeTracked = async (id) => {
    try {
      await base44.entities.WeeklyReportWorkspace.delete(id);
      toast({ title: "Workspace removed from report" });
      loadData();
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to remove", description: e.message });
    }
  };

  const toggleTracked = async (item) => {
    try {
      await base44.entities.WeeklyReportWorkspace.update(item.id, { is_active: !item.is_active });
      loadData();
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to update", description: e.message });
    }
  };

  const addSubscriber = async () => {
    if (!newSubName.trim() || !newSubEmail.trim()) return;
    try {
      await base44.entities.WeeklyReportSubscriber.create({
        name: newSubName.trim(),
        email: newSubEmail.trim(),
        is_active: true,
      });
      setNewSubName("");
      setNewSubEmail("");
      toast({ title: "Subscriber added" });
      loadData();
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to add subscriber", description: e.message });
    }
  };

  const removeSubscriber = async (id) => {
    try {
      await base44.entities.WeeklyReportSubscriber.delete(id);
      toast({ title: "Subscriber removed" });
      loadData();
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to remove", description: e.message });
    }
  };

  const toggleSubscriber = async (item) => {
    try {
      await base44.entities.WeeklyReportSubscriber.update(item.id, { is_active: !item.is_active });
      loadData();
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to update", description: e.message });
    }
  };

  const doPreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await base44.functions.invoke("generateWeeklyHQReport", { preview: true });
      setPreview(res.data || res);
    } catch (e) {
      toast({ variant: "destructive", title: "Preview failed", description: e.message });
    } finally {
      setPreviewLoading(false);
    }
  };

  const doSend = async () => {
    setSending(true);
    try {
      const res = await base44.functions.invoke("generateWeeklyHQReport", { preview: false });
      const data = res.data || res;
      if (data.failures && data.failures.length > 0) {
        toast({ variant: "destructive", title: `Sent ${data.sent}/${data.subscriber_count}`, description: `Failed: ${data.failures.join(", ")}` });
      } else {
        toast({ title: `Report sent to ${data.sent} subscriber(s)`, description: `Covering ${data.workspace_count} workspace(s)` });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Send failed", description: e.message });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Mail className="w-6 h-6 text-emerald-600" />
          Weekly HQ Progress Report
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Automatically compiles workspace activity into an executive brief emailed to JPGE HQ every Monday.
        </p>
      </div>

      {/* Action Bar */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-700">Report Status</p>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <Badge variant="secondary" className="gap-1"><Building2 className="w-3 h-3" />{tracked.filter(t => t.is_active).length} workspaces tracked</Badge>
                <Badge variant="secondary" className="gap-1"><Mail className="w-3 h-3" />{subscribers.filter(s => s.is_active).length} subscribers</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={doPreview} disabled={previewLoading || tracked.length === 0}>
                {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                Preview
              </Button>
              <Button onClick={doSend} disabled={sending || tracked.length === 0 || subscribers.length === 0}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Now
              </Button>
            </div>
          </div>
          {tracked.length === 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" /> Add at least one workspace below before sending or previewing.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {preview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Eye className="w-4 h-4" />Report Preview</CardTitle>
            <CardDescription>Week of {new Date().toLocaleDateString()} — this is what subscribers will receive</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs font-mono whitespace-pre-wrap bg-slate-50 border rounded-lg p-4 max-h-96 overflow-auto text-slate-700">{preview.preview || "No preview available."}</pre>
            {preview.failures && preview.failures.length > 0 && (
              <p className="text-xs text-red-500 mt-2">Failed deliveries: {preview.failures.join(", ")}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tracked Workspaces */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4" />Tracked Workspaces</CardTitle>
          <CardDescription>Workspaces included in the weekly report — add or remove to control coverage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tracked.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No workspaces tracked yet.</p>
          ) : (
            <div className="space-y-2">
              {tracked.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.owner_name}</p>
                    <p className="text-xs text-slate-500 truncate">{item.owner_email}{item.org_name ? ` · ${item.org_name}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleTracked(item)}
                      className={`text-xs px-2 py-1 rounded-md font-medium ${item.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}
                    >
                      {item.is_active ? "Active" : "Paused"}
                    </button>
                    <Button variant="ghost" size="icon" onClick={() => removeTracked(item.id)} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {availableWorkspaces.length > 0 && (
            <div className="flex gap-2 pt-2 border-t">
              <select
                value={selectedWorkspace}
                onChange={(e) => setSelectedWorkspace(e.target.value)}
                className="flex-1 text-sm border rounded-md px-3 py-2 bg-white"
              >
                <option value="">Select a workspace to add…</option>
                {availableWorkspaces.map(ws => (
                  <option key={ws.id} value={ws.id}>{ws.owner_name || ws.owner_email}</option>
                ))}
              </select>
              <Button onClick={addWorkspace} disabled={!selectedWorkspace} size="sm">
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>
          )}
          {availableWorkspaces.length === 0 && workspaces.length > 0 && (
            <p className="text-xs text-slate-400">All existing workspaces are already tracked.</p>
          )}
          {workspaces.length === 0 && (
            <p className="text-xs text-slate-400">No workspaces exist yet. Users will appear here once they create workspaces.</p>
          )}
        </CardContent>
      </Card>

      {/* Subscribers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><MailPlus className="w-4 h-4" />Report Recipients (JPGE HQ)</CardTitle>
          <CardDescription>
            Registered app users who receive the weekly email. Recipients must be registered users on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscribers.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No subscribers yet.</p>
          ) : (
            <div className="space-y-2">
              {subscribers.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500 truncate">{item.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleSubscriber(item)}
                      className={`text-xs px-2 py-1 rounded-md font-medium ${item.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}
                    >
                      {item.is_active ? "Active" : "Paused"}
                    </button>
                    <Button variant="ghost" size="icon" onClick={() => removeSubscriber(item.id)} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
            <div className="flex-1 space-y-2">
              <Input placeholder="Recipient name" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} />
              <Input placeholder="Email address (must be a registered user)" type="email" value={newSubEmail} onChange={(e) => setNewSubEmail(e.target.value)} />
            </div>
            <Button onClick={addSubscriber} disabled={!newSubName.trim() || !newSubEmail.trim()} size="sm" className="sm:self-end">
              <Plus className="w-4 h-4" /> Add Recipient
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 border rounded-lg p-3">
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <p>The report auto-sends every Monday at 9:00 AM (Phoenix time). Use "Send Now" for an immediate dispatch or "Preview" to review before sending. Only registered app users can receive emails.</p>
      </div>
    </div>
  );
}