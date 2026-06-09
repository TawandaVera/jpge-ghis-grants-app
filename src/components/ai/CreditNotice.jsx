import { AlertTriangle, PowerOff } from "lucide-react";

// Detects whether an error message looks like a credits/quota exhaustion.
export function isCreditError(message = "") {
  return /credit|quota|insufficient|limit reached|out of credits|429|payment required|402/i.test(message);
}

export default function CreditNotice({ mode, reason }) {
  if (mode === "disabled") {
    return (
      <div className="flex items-start gap-3 bg-slate-100 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-700">
        <PowerOff className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />
        <div>
          <p className="font-medium">AI Assistants are currently turned off.</p>
          <p className="text-slate-500 text-xs mt-0.5">
            {reason || "An admin has paused AI Assistants. The rest of the app works normally."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
      <div>
        <p className="font-medium">AI is temporarily unavailable (credits may be exhausted).</p>
        <p className="text-amber-700 text-xs mt-0.5">
          Your data and the rest of the app are unaffected. AI responses will resume once credits reset or are topped up.
        </p>
      </div>
    </div>
  );
}