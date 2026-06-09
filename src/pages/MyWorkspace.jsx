import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FolderOpen, RefreshCw, FileJson, TrendingUp, BookOpen, ClipboardList, User } from "lucide-react";
import { toast } from "sonner";

export default function MyWorkspace() {
  const [user, setUser] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadWorkspace();
  }, []);

  const loadWorkspace = async () => {
    setLoading(true);
    const me = await base44.auth.me();
    setUser(me);
    const res = await base44.functions.invoke("syncWorkspace", {});
    setWorkspace(res.data.workspace);
    setStats({ grant_count: res.data.grant_count, application_count: res.data.application_count, match_count: res.data.match_count });
    setLoading(false);
  };

  const sync = async () => {
    setSyncing(true);
    const res = await base44.functions.invoke("syncWorkspace", {});
    setWorkspace(res.data.workspace);
    setStats({ grant_count: res.data.grant_count, application_count: res.data.application_count, match_count: res.data.match_count });
    toast.success("Workspace synced");
    setSyncing(false);
  };

  const downloadMyData = async () => {
    setDownloading(true);
    // Fetch all personal data
    const [grants, applications, matches, narratives, orgProfiles, outcomes] = await Promise.all([
      base44.entities.Grant.filter({ created_by_id: user.id }),
      base44.entities.GrantApplication.filter({ created_by_id: user.id }),
      base44.entities.GrantMatch.filter({ created_by_id: user.id }),
      base44.entities.MasterNarrative.list(),
      base44.entities.OrgProfile.list(),
      base44.entities.GrantOutcome.filter({ created_by_id: user.id }),
    ]);

    const backup = {
      exported_at: new Date().toISOString(),
      user: { id: user.id, email: user.email, name: user.full_name },
      data: { grants, grant_applications: applications, grant_matches: matches, master_narratives: narratives, org_profiles: orgProfiles, grant_outcomes: outcomes },
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-workspace-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Your data downloaded successfully");
    setDownloading(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-xl"><FolderOpen className="w-6 h-6 text-indigo-700" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Workspace</h1>
            <p className="text-slate-500 text-sm">Your personal data space — all your grant work in one place</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={sync} disabled={syncing} className="gap-2">
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Sync
          </Button>
          <Button onClick={downloadMyData} disabled={downloading} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4" />} Download My Data
          </Button>
        </div>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" /> Account</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
          <div><p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Name</p><p className="font-medium">{user?.full_name || "—"}</p></div>
          <div><p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Email</p><p className="font-medium">{user?.email}</p></div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Role</p>
            <Badge className={user?.role === "admin" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}>
              {user?.role || "user"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Grants Discovered", value: stats?.grant_count ?? 0, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
          { label: "Applications", value: stats?.application_count ?? 0, icon: ClipboardList, color: "text-blue-600 bg-blue-50" },
          { label: "Assessments", value: stats?.match_count ?? 0, icon: BookOpen, color: "text-purple-600 bg-purple-50" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${color}`}><Icon className="w-5 h-5" /></div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workspace Status */}
      <Card>
        <CardHeader><CardTitle className="text-base">Workspace Status</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-slate-600">Status</span>
            <Badge className={workspace?.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}>
              {workspace?.status || "active"}
            </Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-slate-600">Workspace ID</span>
            <span className="font-mono text-xs text-slate-400">{workspace?.id || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-slate-600">Last Synced</span>
            <span className="text-slate-500">{workspace?.updated_date ? new Date(workspace.updated_date).toLocaleString() : "Just now"}</span>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-slate-400 text-center">Your data is automatically saved to the platform. Use "Download My Data" to get a local JSON backup at any time.</p>
    </div>
  );
}