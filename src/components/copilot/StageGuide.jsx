import { useState } from "react";
import { Lightbulb, X, ChevronDown, ChevronUp } from "lucide-react";

const STAGE_GUIDES = {
  1: {
    emoji: "📄",
    title: "Upload your organization's story",
    what: "Your Master Narrative is a reusable library of your organization's strongest content — mission, programs, past performance, and capabilities. The AI draws from it automatically so you never repeat yourself across applications.",
    steps: [
      "Paste or upload any document describing your organization (annual report, prior proposals, capability statement, website copy — anything works).",
      "Click 'Parse Narrative' — the AI will break it into labeled, reusable content blocks.",
      "Review the blocks, edit any that look off, then click 'Approve & Continue'.",
    ],
    tip: "The richer your narrative, the better every future proposal will be. Even a rough document works well.",
  },
  2: {
    emoji: "🏢",
    title: "Confirm your organization's profile",
    what: "Your Org Profile is the data backbone for all AI-generated content — name, EIN, UEI, budget, mission, certifications, and coverage areas. Complete it once and the system uses it everywhere.",
    steps: [
      "Click 'Open Org Profile' to review your details.",
      "Ensure EIN, UEI, indirect cost rate, fringe rate, and mission statement are complete.",
      "Return here and click 'Profile Confirmed' when ready.",
    ],
    tip: "Your indirect cost rate and fringe rate are used directly in budget narratives — make sure they're accurate.",
  },
  3: {
    emoji: "🎯",
    title: "Select the opportunity to pursue",
    what: "Choose a funding opportunity to draft a proposal for. Only grants assessed as GO or PREP are shown — these are your strongest matches worth pursuing.",
    steps: [
      "Look for a GO badge (80%+ match) or PREP badge (60–79% match).",
      "Click to select — you'll see the score breakdown and alignment rationale.",
      "Click 'Start Drafting' to begin, or pick an existing in-progress application to continue.",
    ],
    tip: "GO = strong mandate alignment, clear eligibility fit, and sufficient deadline runway. Both GO and PREP are worth pursuing.",
  },
  4: {
    emoji: "📋",
    title: "Track your active applications",
    what: "Your pipeline board shows every application and its current stage — from drafting through submission. Use it to stay on top of deadlines and next actions.",
    steps: [
      "Review active applications and their stages.",
      "Open the full Pipeline page for a Kanban board view and drag-and-drop management.",
      "Click 'Continue' to proceed to content mapping.",
    ],
    tip: "You can return to any in-progress application at any time from Stage 3.",
  },
  5: {
    emoji: "🗺️",
    title: "Map your narrative to grant sections",
    what: "Your master narrative blocks are like puzzle pieces. This stage lets you tag which blocks belong to which proposal section — giving the AI precise context when writing.",
    steps: [
      "For each grant section (e.g. 'Needs Statement'), click the narrative blocks that are most relevant.",
      "You can assign multiple blocks per section.",
      "Click 'Continue to Draft Generation' when done.",
    ],
    tip: "Skipping this step is fine — the AI will make intelligent selections automatically in Stage 6.",
  },
  6: {
    emoji: "✍️",
    title: "Generate AI-drafted proposal sections",
    what: "The AI uses your org profile, master narrative, assessment intelligence, and the grant's requirements to write each section — tailored specifically to this funder's priorities.",
    steps: [
      "Click 'Draft All Sections' to generate everything at once (recommended).",
      "Or click 'AI Draft' on individual sections to go one at a time.",
      "Read each section, make any edits, then click 'Save All & Continue'.",
    ],
    tip: "Use 'Redraft' on any section to get a fresh version. All edits are auto-saved to the application.",
  },
  7: {
    emoji: "🔍",
    title: "Strengthen your proposal with AI feedback",
    what: "A second AI pass reviews your full draft and identifies exactly what to improve — weak evidence, missing funder alignment, vague language, or gaps between sections.",
    steps: [
      "Click 'Generate Edit Guidance' for prioritized recommendations.",
      "Red = must fix before submitting. Amber = important improvement. Blue = enhancement.",
      "Return to Stage 6 to apply changes, then come back to re-check.",
    ],
    tip: "Always resolve high-priority (red) items first — these are the most common reasons proposals are rejected.",
  },
  8: {
    emoji: "🚀",
    title: "Package and export your finished proposal",
    what: "Your proposal is complete. This stage compiles all sections into a clean, downloadable document ready for submission. A final AI review gives you a readiness score and submission checklist.",
    steps: [
      "Run 'Final AI Review' to get a readiness score and any last-minute flags.",
      "Download as PDF or Word .doc depending on submission requirements.",
      "Work through the submission checklist before sending.",
    ],
    tip: "Exporting saves the proposal to your library — future proposals can learn from this one's language and structure.",
  },
  section_executive_summary: {
    emoji: "📌",
    title: "Executive Summary",
    what: "The first thing reviewers read — and sometimes the only thing. Answer: Who are you? What problem are you solving? How much funding do you need? What will you achieve?",
    tip: "Keep it to 200–300 words. Lead with impact and the funding ask, not your org's history.",
  },
  section_needs_statement: {
    emoji: "📊",
    title: "Needs Statement",
    what: "Demonstrate that the problem is real, urgent, and present in the communities you serve. Use data, research, and local evidence to make it undeniable.",
    tip: "The strongest needs statements cite 2–3 specific data points tied to the funder's focus area. The AI will pull these from your narrative where possible.",
  },
  section_goals_objectives: {
    emoji: "🎯",
    title: "Goals & Objectives",
    what: "Goals describe big-picture outcomes. Objectives are specific, measurable steps to reach them. Funders want to see both — and they need to link directly to the stated problem.",
    tip: "Use the SMART formula: Specific, Measurable, Achievable, Relevant, Time-bound.",
  },
  section_methodology: {
    emoji: "⚙️",
    title: "Methodology",
    what: "Your detailed project plan — what you will do, how you will do it, who will do it, when, and with which partners. Funders want operational specificity here.",
    tip: "Include a phased timeline or milestones if possible. It shows you've thought through execution.",
  },
  section_evaluation_plan: {
    emoji: "📈",
    title: "Evaluation Plan",
    what: "Describe how you'll measure success — what data you'll collect, when, who will review it, and how results will be used. Even a simple evaluation plan is better than none.",
    tip: "Name specific metrics (e.g. 'Pre/post survey scores', 'Number of individuals served by Month 6').",
  },
  section_organizational_capacity: {
    emoji: "🏅",
    title: "Organizational Capacity",
    what: "Convince the funder that your organization — specifically — has the credentials, infrastructure, and experience to deliver. Highlight past awards, key staff, and partnerships.",
    tip: "Don't repeat what's covered in other sections. Focus on WHY you, not what you plan to do.",
  },
  section_budget_narrative: {
    emoji: "💰",
    title: "Budget Narrative",
    what: "Justify every major line item — why it's needed, how it was calculated, and how it ties to project activities. Transparency here builds reviewer confidence.",
    tip: "Explicitly state your indirect cost rate and fringe rate upfront. Unexplained rates are common rejection triggers.",
  },
};

export default function StageGuide({ stageId, sectionKey, compact = false }) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(!compact);

  const key = sectionKey ? `section_${sectionKey}` : stageId;
  const guide = STAGE_GUIDES[key];
  if (!guide || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl overflow-hidden">
      <div className="flex items-start gap-3 p-3.5">
        <span className="text-xl shrink-0 mt-0.5">{guide.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Guide</p>
            </div>
            <div className="flex items-center gap-1">
              {compact && (
                <button
                  onClick={() => setExpanded(e => !e)}
                  className="text-blue-400 hover:text-blue-600 p-0.5"
                >
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
              <button
                onClick={() => setDismissed(true)}
                className="text-blue-300 hover:text-blue-500 p-0.5"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-sm font-semibold text-slate-800 mt-0.5">{guide.title}</p>
          <p className="text-sm text-slate-600 mt-1">{guide.what}</p>

          {expanded && guide.steps && (
            <ol className="mt-2 space-y-1">
              {guide.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          )}

          {expanded && guide.tip && (
            <div className="mt-2.5 flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
              <span className="text-sm shrink-0">💡</span>
              <p className="text-xs text-amber-800">{guide.tip}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}