import { cn } from "@/lib/utils";

export default function ChipSelector({ label, options, value = [], onChange, single = false }) {
  const selected = single ? (value ? [value] : []) : (value || []);

  const toggle = (opt) => {
    if (single) {
      onChange(selected.includes(opt) ? null : opt);
    } else {
      onChange(selected.includes(opt)
        ? selected.filter(v => v !== opt)
        : [...selected, opt]
      );
    }
  };

  return (
    <div>
      {label && <p className="text-xs text-slate-500 mb-2">{label}</p>}
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
              selected.includes(opt)
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-700"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}