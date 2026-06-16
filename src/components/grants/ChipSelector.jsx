import { cn } from "@/lib/utils";

export default function ChipSelector({ label, options, value = [], onChange, single = false, highlighted = [] }) {
  const selected = single ? (value ? [value] : []) : (value || []);

  const toggle = (opt) => {
    if (!onChange) return;
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
        {options.map(opt => {
          const isSelected = selected.includes(opt);
          const isHighlighted = highlighted.includes(opt) && !isSelected;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              disabled={!onChange}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                isSelected
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : isHighlighted
                  ? "bg-amber-50 text-amber-700 border-amber-400 ring-1 ring-amber-300"
                  : onChange
                  ? "bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-700"
                  : "bg-white text-slate-400 border-slate-200 cursor-default"
              )}
            >
              {isHighlighted && <span className="mr-1">✦</span>}{opt}
            </button>
          );
        })}
      </div>
      {highlighted.length > 0 && (
        <p className="text-[10px] text-amber-600 mt-1.5">✦ Matches your active filters</p>
      )}
    </div>
  );
}