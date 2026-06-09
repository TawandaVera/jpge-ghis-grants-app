import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2, Users, Download, RefreshCw, Search,
  FileJson, Shield, User, FolderOpen, DatabaseBackup
} from "lucide-react";
import { toast } from "sonner";

export default function AdminWorkspaces() {
  const [user, setUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [downloading, setDownloading] = useState(null); // workspace id or "all"
  const [stats, setStats] = useState({ total: 0, active: 0, totalGrants: 0, totalApps: 0 });

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const me = await base44.auth.me();
    setUser(me);
    if (me?.role !== "admin") { setLoading(false); return; }
    await loadWorkspaces();
  };

  const loadWorkspaces = async () => {
    setLoading(true);
    const data = await base44.entities.Workspace.list("-updated_date", 200);
    setWorkspaces(data);
    setStats({
      total: data.length,
      active: data.filter(w => w.status === "active").length,
      totalGrants: data.reduce((s, w) => s + (w.grant_count || 0), 0),
      totalApps: data.reduce((s, w) => s + (w.application_count || 0), 0),
    });
    setLoading(false);
  };

  const downloadAll = async () => {
    setDownloading("all");
    const res = await base44.functions.invoke("adminBackup", {});
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ghis-full-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Full backup downloaded");
    setDownloading(null);
  };

  const downloadUser = async (ws) => {
    setDownloading(ws.id);
    const res = await base44.functions.invoke("adminBackup", { target_user_id: ws.owner_id });
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const name = (ws.owner_email || ws.owner_id).replace(/[@.]/g, "_");
    a.download = `backup-${name}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Backup downloaded for ${ws.owner_email}`);
    setDownloading(null);
  };

  const filtered = workspaces.filter(w =>
    !search ||
    (w.owner_email || "").toLowerCase().includes(search.toLowerCase()) ||
    (w.owner_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (w.org_name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <Shield className="w-12 h-12 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-700">Admin Access Required</h2>
        <p className="text-slate-500 text-sm">This page is only accessible to administrators.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-xl"><Users className="w-6 h-6 text-amber-700" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Workspace Manager</h1>
            <p className="text-slate-500 text-sm">View all user workspaces and manage backups</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadWorkspaces} disabled={loading} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button onClick={downloadAll} disabled={downloading === "all"} className="bg-amber-600 hover:bg-amber-700 gap-2">
            {downloading === "all" ? <Loader2 className="w-4 h-4 animate-spin" /> : <DatabaseBackup className="w-4 h-4" />}
            Download Full Backup
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Workspaces", value: stats.total, color: "text-slate-700 bg-slate-50" },
          { label: "Active Users", value: stats.active, color: "text-emerald-700 bg-emerald-50" },
          { label: "Total Grants", value: stats.totalGrants, color: "text-blue-700 bg-blue-50" },
          { label: "Total Applications", value: stats.totalApps, color: "text-purple-700 bg-purple-50" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className={`p-4 rounded-xl ${color}`}>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs mt-0.5 opacity-70">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2"><FolderOpen className="w-4 h-4" /> All Workspaces</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search by name or email..." className="pl-9 h-8 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              {search ? "No workspaces match your search." : "No workspaces found. Users appear here after their first login."}
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map(ws => (
                <div key={ws.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 gap-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-indigo-100 rounded-lg shrink-0"><User className="w-4 h-4 text-indigo-600" /></div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">{ws.owner_name || ws.owner_email}</p>
                      <p className="text-xs text-slate-500 truncate">{ws.owner_email}</p>
                      {ws.org_name && <p className="text-xs text-slate-400">{ws.org_name}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm shrink-0">
                    <div className="text-center hidden md:block">
                      <p className="font-bold text-slate-800">{ws.grant_count || 0}</p>
                      <p className="text-xs text-slate-400">Grants</p>
                    </div>
                    <div className="text-center hidden md:block">
                      <p className="font-bold text-slate-800">{ws.application_count || 0}</p>
                      <p className="text-xs text-slate-400">Apps</p>
                    </div>
                    <Badge className={ws.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                      {ws.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      disabled={downloading === ws.id}
                      onClick={() => downloadUser(ws)}
                    >
                      {downloading === ws.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileJson className="w-3 h-3" />}
                      Backup
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-slate-400 text-center">
        "Download Full Backup" exports all users' data in a single JSON file. Individual backups include only that user's records.
      </p>
    </div>
  );
}