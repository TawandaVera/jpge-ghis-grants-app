import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ChipSelector from "@/components/grants/ChipSelector";
import { useToast } from "@/components/ui/use-toast";

const OUTCOME_AREAS = ["Health Equity", "Leadership Development", "Veterans", "Workforce Development", "Economic Mobility", "Food Security", "Climate Adaptation", "Digital Equity", "Housing", "Education"];
const POPULATIONS = ["Veterans", "Alumni", "Youth", "BIPOC Communities", "Women", "Immigrants", "Rural Communities", "People with Disabilities", "Seniors"];
const GEOGRAPHIES = ["National", "Regional", "State-Specific", "International", "Southwest", "Southeast", "Midwest", "Northeast", "West Coast"];
const FUNDING_TYPES = ["federal_grant", "family_foundation", "private_foundation", "hnwi", "major_gift", "corporate_giving"];

const FUNDING_LABELS = {
  federal_grant: "Federal Grant",
  family_foundation: "Family Foundation",
  private_foundation: "Private Foundation",
  hnwi: "HNWI",
  major_gift: "Major Gift",
  corporate_giving: "Corporate Giving"
};

const EMPTY = { name: "", description: "", outcome_area_filters: [], population_filters: [], geography_filters: [], funding_type_filters: [] };

export default function Tracks() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = new
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Track.list("-created_date");
    setTracks(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (t) => { setEditing(t); setForm({ ...t }); setDialogOpen(true); };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editing) {
      await base44.entities.Track.update(editing.id, form);
      toast({ title: "Track updated" });
    } else {
      await base44.entities.Track.create(form);
      toast({ title: "Track created" });
    }
    setSaving(false);
    setDialogOpen(false);
    load();
  };

  const remove = async (id) => {
    await base44.entities.Track.delete(id);
    toast({ title: "Track deleted" });
    load();
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const allTags = (t) => [
    ...(t.outcome_area_filters || []),
    ...(t.population_filters || []),
    ...(t.geography_filters || []),
    ...(t.funding_type_filters || []).map(v => FUNDING_LABELS[v] || v)
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tracks</h1>
          <p className="text-slate-500 text-sm">Save filter combinations to monitor specific funding areas</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={openNew}>
          <Plus className="w-4 h-4" /> New Track
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-slate-400 text-sm">Loading…</div>
      ) : tracks.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-400">
            <p className="text-sm">No tracks yet. Create one to save a filter combination.</p>
            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={openNew}>
              <Plus className="w-4 h-4" /> Create First Track
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tracks.map(t => (
            <Card key={t.id} className="border border-slate-200">
              <CardHeader className="pb-2 flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-800">{t.name}</CardTitle>
                  {t.description && <p className="text-sm text-slate-500 mt-0.5">{t.description}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 border-red-200 text-red-500 hover:bg-red-50" onClick={() => remove(t.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {allTags(t).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {allTags(t).map(tag => (
                      <Badge key={tag} className="text-xs bg-slate-100 text-slate-700 border-0">{tag}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No filters set</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Track" : "New Track"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Track Name *</label>
              <Input placeholder="e.g. Veterans + Southwest" value={form.name} onChange={e => set("name", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Description</label>
              <Textarea placeholder="What is this track monitoring?" value={form.description} onChange={e => set("description", e.target.value)} rows={2} className="text-sm" />
            </div>
            <ChipSelector label="Outcome Areas" options={OUTCOME_AREAS} value={form.outcome_area_filters} onChange={v => set("outcome_area_filters", v)} />
            <ChipSelector label="Populations Served" options={POPULATIONS} value={form.population_filters} onChange={v => set("population_filters", v)} />
            <ChipSelector label="Geographies" options={GEOGRAPHIES} value={form.geography_filters} onChange={v => set("geography_filters", v)} />
            <ChipSelector label="Funding Types" options={FUNDING_TYPES.map(v => FUNDING_LABELS[v] || v)} value={(form.funding_type_filters || []).map(v => FUNDING_LABELS[v] || v)} onChange={vals => set("funding_type_filters", vals.map(v => Object.keys(FUNDING_LABELS).find(k => FUNDING_LABELS[k] === v) || v))} />
            <div className="flex gap-2 pt-2">
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={save} disabled={saving || !form.name.trim()}>
                <Check className="w-4 h-4" /> {saving ? "Saving…" : "Save Track"}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}><X className="w-4 h-4" /></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}