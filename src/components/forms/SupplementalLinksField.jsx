import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";

const KINDS = [
  { value: "portal", label: "Application portal" },
  { value: "documentation", label: "Documentation" },
  { value: "requirements", label: "Requirements page" },
  { value: "document", label: "Form / document" },
  { value: "page", label: "Other page" },
];

export default function SupplementalLinksField({ links, onChange }) {
  const update = (index, patch) => onChange(links.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  const add = () => onChange([...links, { url: "", kind: "page" }]);
  const remove = (index) => onChange(links.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      {links.map((link, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input
            value={link.url}
            onChange={e => update(i, { url: e.target.value })}
            placeholder="https://funder.org/how-to-apply"
            className="flex-1"
          />
          <Select value={link.kind || "page"} onValueChange={v => update(i, { kind: v })}>
            <SelectTrigger className="w-40 shrink-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              {KINDS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={() => remove(i)}
            title="Remove this link"
            className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={add}>
        <Plus className="w-3.5 h-3.5" /> Add another official link
      </Button>
    </div>
  );
}