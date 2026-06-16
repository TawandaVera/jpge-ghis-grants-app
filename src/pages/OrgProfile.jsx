import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, Save, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import StaffCapacitySection from "@/components/org/StaffCapacitySection";

const GHIS_DEFAULTS = {
  org_name: "GHIS LLC",
  mission: "Global Health Innovation Solutions — advancing health equity, digital health innovation, workforce development, and community engagement across underserved communities.",
  focus_areas: ["health_equity", "digital_health", "workforce_development", "community_engagement"],
  geographic_coverage: ["Alabama", "California", "Florida", "Georgia", "Illinois", "Maryland", "Michigan", "New York", "North Carolina", "Ohio", "Pennsylvania", "Texas", "Virginia", "Washington"],
  annual_budget: 3200000,
  indirect_cost_rate: 26,
  fringe_rate: 30,
  compliance_certifications: ["SAM.gov Registered", "Nonprofit 501(c)(3)", "HHS Audit Compliant"],
  contact_name: "GHIS Leadership",
  contact_email: "grants@ghisllc.org",
  website: "https://ghisllc.org"
};

export default function OrgProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(GHIS_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newFocus, setNewFocus] = useState("");
  const [newState, setNewState] = useState("");
  const [newCert, setNewCert] = useState("");

  useEffect(() => {
    base44.entities.OrgProfile.list().then(data => {
      if (data.length > 0) { setProfile(data[0]); setForm(data[0]); }
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    if (profile) {
      await base44.entities.OrgProfile.update(profile.id, form);
    } else {
      const created = await base44.entities.OrgProfile.create(form);
      setProfile(created);
    }
    toast.success("Org profile saved");
    setSaving(false);
  };

  const addItem = (field, val, clear) => {
    if (!val.trim()) return;
    setForm(p => ({ ...p, [field]: [...(p[field] || []), val.trim()] }));
    clear("");
  };

  const removeItem = (field, idx) => {
    setForm(p => ({ ...p, [field]: p[field].filter((_, i) => i !== idx) }));
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl"><Building2 className="w-6 h-6 text-emerald-700" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Organization Profile</h1>
            <p className="text-slate-500 text-sm">Used by AI agents for scoring and writing</p>
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile
        </Button>
      </div>

      <div className="grid gap-5">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle className="text-base">Organization Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Organization Name</Label><Input value={form.org_name || ""} onChange={e => setForm(p => ({...p, org_name: e.target.value}))} className="mt-1" /></div>
              <div><Label>Website</Label><Input value={form.website || ""} onChange={e => setForm(p => ({...p, website: e.target.value}))} className="mt-1" /></div>
              <div><Label>Contact Name</Label><Input value={form.contact_name || ""} onChange={e => setForm(p => ({...p, contact_name: e.target.value}))} className="mt-1" /></div>
              <div><Label>Contact Email</Label><Input value={form.contact_email || ""} onChange={e => setForm(p => ({...p, contact_email: e.target.value}))} className="mt-1" /></div>
              <div><Label>EIN / Tax ID</Label><Input value={form.ein || ""} onChange={e => setForm(p => ({...p, ein: e.target.value}))} className="mt-1" /></div>
              <div><Label>SAM.gov UEI</Label><Input value={form.duns_uei || ""} onChange={e => setForm(p => ({...p, duns_uei: e.target.value}))} className="mt-1" /></div>
            </div>
            <div><Label>Mission Statement</Label><Textarea value={form.mission || ""} onChange={e => setForm(p => ({...p, mission: e.target.value}))} className="mt-1" rows={3} /></div>
          </CardContent>
        </Card>

        {/* Financial */}
        <Card>
          <CardHeader><CardTitle className="text-base">Financial & Rates</CardTitle></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div><Label>Annual Budget ($)</Label><Input type="number" value={form.annual_budget || ""} onChange={e => setForm(p => ({...p, annual_budget: Number(e.target.value)}))} className="mt-1" /></div>
              <div><Label>Indirect Cost Rate (%)</Label><Input type="number" value={form.indirect_cost_rate || ""} onChange={e => setForm(p => ({...p, indirect_cost_rate: Number(e.target.value)}))} className="mt-1" /></div>
              <div><Label>Fringe Benefit Rate (%)</Label><Input type="number" value={form.fringe_rate || ""} onChange={e => setForm(p => ({...p, fringe_rate: Number(e.target.value)}))} className="mt-1" /></div>
              <div><Label>Staff Count</Label><Input type="number" value={form.staff_count || ""} onChange={e => setForm(p => ({...p, staff_count: Number(e.target.value)}))} className="mt-1" /></div>
            </div>
          </CardContent>
        </Card>

        {/* Focus Areas */}
        <Card>
          <CardHeader><CardTitle className="text-base">Focus Areas</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {(form.focus_areas || []).map((f, i) => (
                <Badge key={i} className="bg-emerald-100 text-emerald-800 gap-1">
                  {f.replace(/_/g, " ")}
                  <button onClick={() => removeItem("focus_areas", i)}><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Add focus area..." value={newFocus} onChange={e => setNewFocus(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem("focus_areas", newFocus, setNewFocus)} />
              <Button variant="outline" onClick={() => addItem("focus_areas", newFocus, setNewFocus)}><Plus className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* Geographic Coverage */}
        <Card>
          <CardHeader><CardTitle className="text-base">Geographic Coverage</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {(form.geographic_coverage || []).map((s, i) => (
                <Badge key={i} variant="outline" className="gap-1">
                  {s}
                  <button onClick={() => removeItem("geographic_coverage", i)}><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Add state..." value={newState} onChange={e => setNewState(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem("geographic_coverage", newState, setNewState)} />
              <Button variant="outline" onClick={() => addItem("geographic_coverage", newState, setNewState)}><Plus className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* Compliance */}
        <Card>
          <CardHeader><CardTitle className="text-base">Compliance & Certifications</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {(form.compliance_certifications || []).map((c, i) => (
                <Badge key={i} className="bg-blue-100 text-blue-800 gap-1">
                  {c}
                  <button onClick={() => removeItem("compliance_certifications", i)}><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Add certification..." value={newCert} onChange={e => setNewCert(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem("compliance_certifications", newCert, setNewCert)} />
              <Button variant="outline" onClick={() => addItem("compliance_certifications", newCert, setNewCert)}><Plus className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* Staff & HR Capacity */}
        <StaffCapacitySection />

        {/* Past Performance */}
        <Card>
          <CardHeader><CardTitle className="text-base">Past Performance & Capacity</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Past Performance Summary</Label><Textarea value={form.past_performance || ""} onChange={e => setForm(p => ({...p, past_performance: e.target.value}))} className="mt-1" rows={3} placeholder="Summarize key past grants, outcomes, and impact..." /></div>
            <div><Label>Current Capacity Notes</Label><Textarea value={form.capacity_notes || ""} onChange={e => setForm(p => ({...p, capacity_notes: e.target.value}))} className="mt-1" rows={2} placeholder="Note any current constraints or bandwidth..." /></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}