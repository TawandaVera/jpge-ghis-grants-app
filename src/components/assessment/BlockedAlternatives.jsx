import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ArrowRight } from "lucide-react";
import { recLabel } from "@/lib/friendlyLabels";

const REC_BADGE = {
  GO: "bg-emerald-100 text-emerald-800 border-emerald-300",
  PREP: "bg-blue-100 text-blue-800 border-blue-300",
};

const TAG_FIELDS = ["outcome_areas", "populations_served", "geographies", "focus_areas"];

function tagSet(grant) {
  const tags = new Set();
  for (const f of TAG_FIELDS) {
    for (const t of grant?.[f] || []) tags.add(String(t).toLowerCase());
  }
  if (grant?.funding_type) tags.add(String(grant.funding_type).toLowerCase());
  if (grant?.category) tags.add(String(grant.category).toLowerCase());
  return tags;
}

function sharedTagCount(a, b) {
  const sa = tagSet(a), sb = tagSet(b);
  let n = 0;
  for (const t of sa) if (sb.has(t)) n++;
  return n;
}

// A match is "blocked" if the assessment flagged it, or if a DECLINE verdict
// mentions referral/invitation/restricted-eligibility language (covers legacy records).
export function isBlockedMatch(match) {
  if (!match) return false;
  if (match.is_blocked === true) return true;
  if (match.recommendation !== "DECLINE") return false;
  const text = [
    ...(match.concerns || []),
    match.rationale || "",
    ...(match.gap_analysis || []),
  ].join(" ").toLowerCase();
  return /referr|invitation|invite|by invitation|limited submission|restricted|not eligible|cannot submit|can't submit|ineligible|unsolicited/.test(text);
}

// "Best scored nearby": highest-scoring GO/PREP grants sharing the most tags overall.
export function findAlternatives(blockedGrant, grants, matches, limit = 4) {
  if (!blockedGrant) return [];
  const matchByGrant = new Map(matches.map((m) => [m.grant_id, m]));
  return grants
    .filter((g) => g.id !== blockedGrant.id)
    .map((g) => {
      const m = matchByGrant.get(g.id);
      if (!m || !["GO", "PREP"].includes(m.recommendation)) return null;
      if (isBlockedMatch(m)) return null;
      return { grant: g, match: m, shared: sharedTagCount(blockedGrant, g) };
    })
    .filter(Boolean)
    .sort((a, b) => b.shared - a.shared || b.match.total_score - a.match.total_score)
    .slice(0, limit);
}

export default function BlockedAlternatives({ blockedGrant, grants, matches, onSelect }) {
  const alternatives = useMemo(
    () => findAlternatives(blockedGrant, grants, matches),
    [blockedGrant, grants, matches]
  );

  if (!alternatives.length) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <p className="flex items-center gap-2 font-medium">
          <Lightbulb className="w-4 h-4" /> No similar open grants found right now
        </p>
        <p className="text-xs mt-1 text-amber-700">
          Try running discovery again, or check back as new opportunities are added.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800 mb-3">
        <Lightbulb className="w-4 h-4" /> Similar grants you CAN apply to
      </p>
      <div className="space-y-2">
        {alternatives.map(({ grant, match, shared }) => (
          <button
            key={grant.id}
            onClick={() => onSelect?.(grant, match)}
            className="w-full text-left flex items-center justify-between gap-3 rounded-md border border-emerald-200 bg-white px-3 py-2 hover:bg-emerald-50 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{grant.title}</p>
              <p className="text-xs text-slate-500 truncate">
                {grant.funder} · {shared} shared tag{shared === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-semibold text-slate-700">
                {Math.round(match.total_score)}%
              </span>
              <Badge className={`text-xs border ${REC_BADGE[match.recommendation]}`}>
                {recLabel(match.recommendation)}
              </Badge>
              <ArrowRight className="w-4 h-4 text-emerald-600" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}