import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Library, Lock, Search } from "lucide-react";
import LibraryItemCard from "@/components/forms/LibraryItemCard";
import LibraryItemDialog from "@/components/forms/LibraryItemDialog";
import StandardTemplatePanel from "@/components/forms/StandardTemplatePanel";
import { toast } from "sonner";

const KINDS = [
  { value: "all", label: "All types" },
  { value: "application_form", label: "Application forms" },
  { value: "budget_template", label: "Budget templates" },
  { value: "guidelines", label: "Guidelines" },
  { value: "checklist", label: "Checklists" },
  { value: "requirements", label: "Requirements pages" },
  { value: "documentation", label: "Documentation" },
  { value: "portal", label: "Portals" },
  { value: "page", label: "Pages" },
  { value: "other", label: "Other" },
];

const ACCESS_FILTERS = [
  { value: "all", label: "Any access" },
  { value: "public", label: "Public" },
  { value: "signin_required", label: "Sign-in required" },
  { value: "unknown", label: "Unconfirmed" },
];

export default function FormLibrary() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const [access, setAccess] = useState("all");
  const [stats, setStats] = useState({ total: 0, public: 0, signin: 0 });
  const [standard, setStandard] = useState(null);
  const [building, setBuilding] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const query = { status: "active" };
        if (kind !== "all") query.kind = kind;
        if (access !== "all") query.access = access;
        const term = search.trim();
        if (term) query.form_title = { $regex: term, $options: "i" };
        const page = await base44.entities.FormLibrary.filter(query, { sort: "-last_seen_at", limit: 60 });
        if (!cancelled) setItems(page?.items || []);
      } catch (e) {
        if (!cancelled) setItems([]);
      }
      if (!cancelled) setLoading(false);
    };
    const timer = setTimeout(run, search ? 300 : 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [search, kind, access, refreshKey]);

  useEffect(() => {
    base44.entities.FormLibrary.aggregate({ query: { status: "active" }, groupBy: "access" })
      .then(res => {
        const rows = res?.rows || [];
        const byAccess = Object.fromEntries(rows.map(r => [r.access, r.count || 0]));
        setStats({
          total: rows.reduce((sum, r) => sum + (r.count || 0), 0),
          public: byAccess.public || 0,
          signin: byAccess.signin_required || 0,
        });
      })
      .catch(() => {});

    base44.entities.FormTemplate.filter({ source_type: "standard" }, { sort: "-created_date", limit: 1 })
      .then(page => setStandard(page?.items?.[0] || null))
      .catch(() => {});
  }, [refreshKey]);

  const buildStandard = async () => {
    setBuilding(true);
    try {
      const res = await base44.functions.invoke("buildStandardTemplate", {});
      if (res.data?.error) throw new Error(res.data.error);
      setStandard(res.data.template);
      toast.success(res.data.refreshed ? "Standard template rebuilt from your library" : "Standard template built");
    } catch (e) {
      toast.error("Couldn't build the standard template: " + e.message);
    }
    setBuilding(false);
  };

  return (
    <div className="p-6 max-w-full space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Library className="w-6 h-6 text-emerald-600" /> Form Library
          </h1>
          <p className="text-slate-500 text-sm">
            Official forms and source pages captured across your opportunities · {stats.total} captured
          </p>
        </div>
      </div>

      <StandardTemplatePanel template={standard} onBuild={buildStandard} building={building} />

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <p className="text-xs text-slate-500">Captured</p>
          <p className="text-xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <p className="text-xs text-slate-500 flex items-center gap-1"><Globe className="w-3 h-3" /> Public</p>
          <p className="text-xl font-bold text-emerald-600">{stats.public}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <p className="text-xs text-slate-500 flex items-center gap-1"><Lock className="w-3 h-3" /> Sign-in required</p>
          <p className="text-xl font-bold text-amber-600">{stats.signin}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-56">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search forms and documents"
            className="pl-9"
          />
        </div>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {KINDS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={access} onValueChange={setAccess}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ACCESS_FILTERS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-slate-400">
        Public documents are copied into the library when they are openly downloadable. Anything behind a sign-in wall is recorded as a link only — never read or bypassed.
      </p>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-xl py-16 text-center">
          <Library className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Nothing captured yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            Build a form template from an application or a grant page and every official form it finds lands here.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map(item => (
            <LibraryItemCard key={item.id} item={item} onOpen={() => setSelected(item)} />
          ))}
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge variant="outline" className="text-xs">{items.length} shown</Badge>
        </div>
      )}

      <LibraryItemDialog item={selected} onOpenChange={(v) => { if (!v) setSelected(null); }} />
    </div>
  );
}