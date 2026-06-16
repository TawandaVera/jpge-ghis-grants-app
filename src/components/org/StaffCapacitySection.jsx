import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Plus, X, Pencil, Star, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const DEPARTMENTS = ["Leadership", "Programs", "Finance", "Research", "Communications", "Operations", "Clinical", "Technology", "Other"];
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contractor", "Volunteer"];
const FOCUS_AREAS = ["Health Equity", "Digital Health", "Workforce Development", "Community Engagement", "Research", "Finance & Compliance", "Leadership", "Clinical Services", "Policy & Advocacy", "Technology & Data"];
const GRANT_ROLES = ["Principal Investigator", "Co-Investigator", "Project Director", "Program Manager", "Evaluator", "Budget Manager", "Community Liaison", "Subject Matter Expert", "Support Staff"];

const EMPTY_STAFF = {
  full_name: "", title: "", department: "Programs", employment_type: "Full-time",
  fte: 1.0, education: "", years_experience: "", bio: "",
  core_competencies: [], certifications: [], focus_areas: [], languages: [], grant_roles: [],
  availability_note: "", is_key_personnel: false
};

function ChipInput({ label, values = [], onChange, placeholder }) {
  const [val, setVal] = useState("");
  const add = () => {
    if (!val.trim() || values.includes(val.trim())) return;
    onChange([...values, val.trim()]);
    setVal("");
  };
  return (
    <div>
      <Label className="text-xs text-slate-600">{label}</Label>
      <div className="flex flex-wrap gap-1.5 mt-1 mb-1.5">
        {values.map((v, i) => (
          <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full flex items-center gap-1">
            {v}
            <button onClick={() => onChange(values.filter((_, j) => j !== i))} className="hover:text-red-500"><X className="w-2.5 h-2.5" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input className="h-7 text-xs" placeholder={placeholder} value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())} />
        <Button variant="outline" size="sm" className="h-7 px-2" onClick={add}><Plus className="w-3 h-3" /></Button>
      </div>
    </div>
  );
}

function MultiSelect({ label, options, values = [], onChange }) {
  const toggle = (opt) => onChange(values.includes(opt) ? values.filter(v => v !== opt) : [...values, opt]);
  return (
    <div>
      <Label className="text-xs text-slate-600">{label}</Label>
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {options.map(opt => (
          <button key={opt} onClick={() => toggle(opt)}
            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${values.includes(opt) ? "bg-emerald-600 text-white border-emerald-600" : "border-slate-200 text-slate-600 hover:border-emerald-400"}`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function StaffDialog({ open, onClose, staff, onSave }) {
  const [form, setForm] = useState(staff || EMPTY_STAFF);
  const [saving, setSaving] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.full_name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{staff?.id ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          {/* Identity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 md:col-span-1">
              <Label>Full Name *</Label>
              <Input className="mt-1" value={form.full_name} onChange={e => f("full_name", e.target.value)} />
            </div>
            <div>
              <Label>Job Title</Label>
              <Input className="mt-1" value={form.title} onChange={e => f("title", e.target.value)} />
            </div>
            <div>
              <Label>Department</Label>
              <Select value={form.department} onValueChange={v => f("department", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Employment Type</Label>
              <Select value={form.employment_type} onValueChange={v => f("employment_type", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{EMPLOYMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>FTE (0.0–1.0)</Label>
              <Input className="mt-1" type="number" min="0" max="1" step="0.1" value={form.fte} onChange={e => f("fte", parseFloat(e.target.value))} />
            </div>
            <div>
              <Label>Highest Education / Credential</Label>
              <Input className="mt-1" placeholder="e.g. MPH, MBA, PhD" value={form.education} onChange={e => f("education", e.target.value)} />
            </div>
            <div>
              <Label>Years of Experience</Label>
              <Input className="mt-1" type="number" value={form.years_experience} onChange={e => f("years_experience", Number(e.target.value))} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => f("is_key_personnel", !form.is_key_personnel)}
              className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border transition-colors ${form.is_key_personnel ? "bg-amber-50 border-amber-400 text-amber-700" : "border-slate-200 text-slate-600"}`}>
              <Star className={`w-3.5 h-3.5 ${form.is_key_personnel ? "fill-amber-400 text-amber-400" : ""}`} />
              Key Personnel (named in proposals)
            </button>
          </div>

          {/* Competencies */}
          <div className="space-y-4 border-t pt-4">
            <p className="text-sm font-semibold text-slate-700">Competencies & Expertise</p>
            <ChipInput label="Core Competencies" values={form.core_competencies} onChange={v => f("core_competencies", v)} placeholder="e.g. Grant Writing, Data Analysis..." />
            <ChipInput label="Professional Certifications" values={form.certifications} onChange={v => f("certifications", v)} placeholder="e.g. PMP, CPA, CPHQ..." />
            <ChipInput label="Languages" values={form.languages} onChange={v => f("languages", v)} placeholder="e.g. Spanish, French..." />
            <MultiSelect label="Domain Focus Areas" options={FOCUS_AREAS} values={form.focus_areas} onChange={v => f("focus_areas", v)} />
          </div>

          {/* Grant Roles */}
          <div className="space-y-3 border-t pt-4">
            <p className="text-sm font-semibold text-slate-700">Grant Project Roles</p>
            <MultiSelect label="Eligible Roles on Grant Projects" options={GRANT_ROLES} values={form.grant_roles} onChange={v => f("grant_roles", v)} />
            <div>
              <Label>Availability / Constraints</Label>
              <Input className="mt-1" placeholder="e.g. Available Q3, currently at 80% capacity..." value={form.availability_note} onChange={e => f("availability_note", e.target.value)} />
            </div>
          </div>

          {/* Bio */}
          <div className="border-t pt-4">
            <Label>Professional Bio <span className="text-slate-400 font-normal">(used in proposals)</span></Label>
            <Textarea className="mt-1" rows={3} placeholder="Short bio highlighting relevant experience and qualifications for grant proposals..." value={form.bio} onChange={e => f("bio", e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? "Saving..." : "Save Staff Member"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffCapacitySection() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    base44.entities.StaffMember.list().then(data => {
      setStaff(data);
      setLoading(false);
    });
  }, []);

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (s) => { setEditing(s); setDialogOpen(true); };

  const handleSave = async (form) => {
    if (form.id) {
      const updated = await base44.entities.StaffMember.update(form.id, form);
      setStaff(prev => prev.map(s => s.id === updated.id ? updated : s));
      toast.success("Staff member updated");
    } else {
      const created = await base44.entities.StaffMember.create(form);
      setStaff(prev => [...prev, created]);
      toast.success("Staff member added");
    }
  };

  const handleDelete = async (id) => {
    await base44.entities.StaffMember.delete(id);
    setStaff(prev => prev.filter(s => s.id !== id));
    toast.success("Removed");
  };

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const byDept = staff.reduce((acc, s) => {
    const d = s.department || "Other";
    if (!acc[d]) acc[d] = [];
    acc[d].push(s);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          <CardTitle className="text-base">Human Resources & Staff Capacity</CardTitle>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{staff.length} staff · {staff.filter(s => s.is_key_personnel).length} key personnel</span>
          <Button size="sm" onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700 gap-1">
            <Plus className="w-4 h-4" /> Add Staff
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : staff.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm font-medium">No staff added yet</p>
            <p className="text-slate-400 text-xs mt-1">Add staff members to help AI assign qualified personnel to proposals</p>
            <Button size="sm" variant="outline" onClick={openAdd} className="mt-3 gap-1"><Plus className="w-3 h-3" /> Add First Staff Member</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(byDept).map(([dept, members]) => (
              <div key={dept}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{dept}</p>
                <div className="space-y-2">
                  {members.map(s => (
                    <div key={s.id} className="border rounded-lg overflow-hidden">
                      {/* Row header */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors">
                        <button className="flex items-center gap-3 flex-1 text-left" onClick={() => toggleExpand(s.id)}>
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm shrink-0">
                            {s.full_name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-800">{s.full_name}</span>
                              {s.is_key_personnel && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                            </div>
                            <p className="text-xs text-slate-500">{s.title} · {s.employment_type} {s.fte && s.fte < 1 ? `(${(s.fte * 100).toFixed(0)}% FTE)` : ""}</p>
                          </div>
                        </button>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {(s.focus_areas || []).slice(0, 2).map((f, i) => (
                            <Badge key={i} className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 hidden sm:flex">{f}</Badge>
                          ))}
                          <button onClick={() => openEdit(s)} className="p-1 hover:text-emerald-600"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(s.id)} className="p-1 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => toggleExpand(s.id)} className="p-1 text-slate-400">
                            {expanded[s.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      {/* Expanded detail */}
                      {expanded[s.id] && (
                        <div className="px-4 py-3 border-t bg-white grid sm:grid-cols-2 gap-4 text-sm">
                          {s.education && <div><span className="text-xs text-slate-400 block">Education</span>{s.education}{s.years_experience ? ` · ${s.years_experience} yrs exp.` : ""}</div>}
                          {s.core_competencies?.length > 0 && (
                            <div className="sm:col-span-2">
                              <span className="text-xs text-slate-400 block mb-1">Core Competencies</span>
                              <div className="flex flex-wrap gap-1">{s.core_competencies.map((c, i) => <span key={i} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{c}</span>)}</div>
                            </div>
                          )}
                          {s.grant_roles?.length > 0 && (
                            <div className="sm:col-span-2">
                              <span className="text-xs text-slate-400 block mb-1">Grant Roles</span>
                              <div className="flex flex-wrap gap-1">{s.grant_roles.map((r, i) => <span key={i} className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">{r}</span>)}</div>
                            </div>
                          )}
                          {s.certifications?.length > 0 && (
                            <div>
                              <span className="text-xs text-slate-400 block mb-1">Certifications</span>
                              <div className="flex flex-wrap gap-1">{s.certifications.map((c, i) => <span key={i} className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">{c}</span>)}</div>
                            </div>
                          )}
                          {s.languages?.length > 0 && (
                            <div>
                              <span className="text-xs text-slate-400 block mb-1">Languages</span>
                              <div className="flex flex-wrap gap-1">{s.languages.map((l, i) => <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{l}</span>)}</div>
                            </div>
                          )}
                          {s.availability_note && <div className="sm:col-span-2"><span className="text-xs text-slate-400 block">Availability</span>{s.availability_note}</div>}
                          {s.bio && <div className="sm:col-span-2"><span className="text-xs text-slate-400 block">Bio</span><p className="text-slate-600 text-xs leading-relaxed">{s.bio}</p></div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <StaffDialog open={dialogOpen} onClose={() => setDialogOpen(false)} staff={editing} onSave={handleSave} />
    </Card>
  );
}