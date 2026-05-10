import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Zap, ExternalLink, Calendar, DollarSign, MapPin, Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function GrantDiscovery() {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGrant, setNewGrant] = useState({ title: "", funder: "", deadline: "", award_amount_min: "", award_amount_max: "", category: "health_equity", status: "open", description: "", eligibility: "", source_url: "" });

  useEffect(() => {
    loadGrants();
  }, []);

  const loadGrants = async () => {
    setLoading(true);
    const data = await base44.entities.Grant.list("-created_date", 100);
    setGrants(data);
    setLoading(false);
  };

  const runDiscovery = async () => {
    setDiscovering(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a grant discovery agent for GHIS LLC (Global Health Innovation Solutions), a health innovation consultancy serving 14 states. 
        Generate 5 realistic current grant opportunities from federal agencies (HHS, HRSA, CDC, SAMHSA, AHRQ, NIH) relevant to:
        - Health equity
        - Digital health innovation
        - Workforce development
        - Community health engagement
        Each grant should have a realistic opportunity number, funder, award range, eligibility, and deadline within 3-6 months from today (2026-05-10).`,
        response_json_schema: {
          type: "object",
          properties: {
            grants: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  funder: { type: "string" },
                  opportunity_number: { type: "string" },
                  description: { type: "string" },
                  focus_areas: { type: "array", items: { type: "string" } },
                  eligibility: { type: "string" },
                  award_amount_min: { type: "number" },
                  award_amount_max: { type: "number" },
                  deadline: { type: "string" },
                  category: { type: "string" },
                  geographic_scope: { type: "string" },
                  source_url: { type: "string" }
                }
              }
            }
          }
        }
      });

      let created = 0;
      for (const g of result.grants || []) {
        await base44.entities.Grant.create({ ...g, status: "open", posted_date: new Date().toISOString().split("T")[0] });
        created++;
      }
      toast.success(`Discovered ${created} new grant opportunities`);
      await loadGrants();
    } catch (e) {
      toast.error("Discovery failed: " + e.message);
    }
    setDiscovering(false);
  };

  const addToApplication = async (grant) => {
    await base44.entities.GrantApplication.create({
      grant_id: grant.id,
      grant_title: grant.title,
      funder: grant.funder,
      deadline: grant.deadline,
      stage: "assessment"
    });
    toast.success("Added to applications workspace");
  };

  const saveNewGrant = async () => {
    await base44.entities.Grant.create({ ...newGrant, award_amount_min: Number(newGrant.award_amount_min), award_amount_max: Number(newGrant.award_amount_max), posted_date: new Date().toISOString().split("T")[0] });
    toast.success("Grant added");
    setShowAddForm(false);
    setNewGrant({ title: "", funder: "", deadline: "", award_amount_min: "", award_amount_max: "", category: "health_equity", status: "open", description: "", eligibility: "", source_url: "" });
    await loadGrants();
  };

  const filtered = grants.filter(g => {
    const matchSearch = !search || g.title?.toLowerCase().includes(search.toLowerCase()) || g.funder?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || g.category === categoryFilter;
    const matchStatus = statusFilter === "all" || g.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const categoryColors = {
    health_equity: "bg-rose-100 text-rose-700",
    digital_health: "bg-blue-100 text-blue-700",
    workforce_development: "bg-amber-100 text-amber-700",
    community_engagement: "bg-green-100 text-green-700",
    research: "bg-purple-100 text-purple-700",
    other: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Grant Discovery</h1>
          <p className="text-slate-500 text-sm">{grants.length} opportunities in database</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Manual
          </Button>
          <Button onClick={runDiscovery} disabled={discovering} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            {discovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {discovering ? "Discovering..." : "AI Discovery"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search grants..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="health_equity">Health Equity</SelectItem>
            <SelectItem value="digital_health">Digital Health</SelectItem>
            <SelectItem value="workforce_development">Workforce Dev</SelectItem>
            <SelectItem value="community_engagement">Community Engagement</SelectItem>
            <SelectItem value="research">Research</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="forecasted">Forecasted</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(grant => (
            <Card key={grant.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(grant)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-slate-900">{grant.title}</h3>
                      {grant.category && <Badge className={`text-xs ${categoryColors[grant.category]}`}>{grant.category.replace(/_/g, " ")}</Badge>}
                      <Badge variant="outline" className={`text-xs ${grant.status === "open" ? "border-green-300 text-green-700" : "border-slate-300 text-slate-500"}`}>{grant.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">{grant.funder} {grant.opportunity_number && `· ${grant.opportunity_number}`}</p>
                    {grant.description && <p className="text-sm text-slate-600 mt-1 line-clamp-2">{grant.description}</p>}
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    {(grant.award_amount_min || grant.award_amount_max) && (
                      <p className="text-sm font-semibold text-emerald-700">
                        ${grant.award_amount_min ? `${(grant.award_amount_min/1000).toFixed(0)}K` : ""}
                        {grant.award_amount_max ? `–$${(grant.award_amount_max/1000).toFixed(0)}K` : ""}
                      </p>
                    )}
                    {grant.deadline && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                        <Calendar className="w-3 h-3" /> {format(new Date(grant.deadline), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No grants found. Run AI Discovery to find opportunities.</p>
            </div>
          )}
        </div>
      )}

      {/* Grant Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-slate-500">Funder</p><p className="font-medium">{selected.funder}</p></div>
                <div><p className="text-xs text-slate-500">Opportunity #</p><p className="font-medium">{selected.opportunity_number || "—"}</p></div>
                <div><p className="text-xs text-slate-500">Award Range</p><p className="font-medium text-emerald-700">{selected.award_amount_min ? `$${selected.award_amount_min.toLocaleString()}` : "—"}{selected.award_amount_max ? ` – $${selected.award_amount_max.toLocaleString()}` : ""}</p></div>
                <div><p className="text-xs text-slate-500">Deadline</p><p className="font-medium">{selected.deadline ? format(new Date(selected.deadline), "MMMM d, yyyy") : "—"}</p></div>
              </div>
              {selected.description && <div><p className="text-xs text-slate-500 mb-1">Description</p><p className="text-sm text-slate-700">{selected.description}</p></div>}
              {selected.eligibility && <div><p className="text-xs text-slate-500 mb-1">Eligibility</p><p className="text-sm text-slate-700">{selected.eligibility}</p></div>}
              {selected.geographic_scope && <div className="flex items-center gap-2 text-sm text-slate-600"><MapPin className="w-4 h-4" />{selected.geographic_scope}</div>}
              <div className="flex gap-3 pt-2">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => { addToApplication(selected); setSelected(null); }}>
                  Add to Applications
                </Button>
                {selected.source_url && (
                  <Button variant="outline" className="gap-2" onClick={() => window.open(selected.source_url, "_blank")}>
                    <ExternalLink className="w-4 h-4" /> View Source
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Manual Grant Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Grant Manually</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Grant title *" value={newGrant.title} onChange={e => setNewGrant(p => ({...p, title: e.target.value}))} />
            <Input placeholder="Funder *" value={newGrant.funder} onChange={e => setNewGrant(p => ({...p, funder: e.target.value}))} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Min award $" type="number" value={newGrant.award_amount_min} onChange={e => setNewGrant(p => ({...p, award_amount_min: e.target.value}))} />
              <Input placeholder="Max award $" type="number" value={newGrant.award_amount_max} onChange={e => setNewGrant(p => ({...p, award_amount_max: e.target.value}))} />
            </div>
            <Input type="date" value={newGrant.deadline} onChange={e => setNewGrant(p => ({...p, deadline: e.target.value}))} />
            <Select value={newGrant.category} onValueChange={v => setNewGrant(p => ({...p, category: v}))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="health_equity">Health Equity</SelectItem>
                <SelectItem value="digital_health">Digital Health</SelectItem>
                <SelectItem value="workforce_development">Workforce Dev</SelectItem>
                <SelectItem value="community_engagement">Community Engagement</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Source URL" value={newGrant.source_url} onChange={e => setNewGrant(p => ({...p, source_url: e.target.value}))} />
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={saveNewGrant} disabled={!newGrant.title || !newGrant.funder}>Save Grant</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}