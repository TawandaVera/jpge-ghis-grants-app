import { useState } from "react";
import { Lightbulb, X, ChevronDown, ChevronUp } from "lucide-react";

const STAGE_GUIDES = {
  1: {
    emoji: "📄",
    title: "Upload your organization's story",
    what: "Your Master Narrative is like a big scrapbook of everything great about your organization — your mission, programs, past work, and capabilities. The AI reads it so it never asks you to repeat yourself.",
    steps: [
      "Paste or upload any document that describes your organization (annual report, previous grants, capability statement, website copy — anything works).",
      "Click 'Parse Narrative' — the AI will break it into reusable content blocks.",
      "Review the blocks, edit any that look off, then click 'Approve & Continue'.",
    ],
    tip: "The more you give here, the better every future proposal will be. Even a messy document is fine!",
  },
  2: {
    emoji: "🏢",
    title: "Check your organization's details",
    what: "This is your org's ID card — name, EIN, budget, mission, certifications. The AI uses this to fill in grant applications automatically so you never have to re-type the same information.",
    steps: [
      "Click 'Open Org Profile' to review your details.",
      "Make sure your EIN, UEI, indirect cost rate, and mission statement are filled in.",
      "Come back here and click 'Profile Confirmed' when you're ready.",
    ],
    tip: "Missing your indirect cost rate or UEI? Check your most recent federal award letter or your finance team's records.",
  },
  3: {
    emoji: "🎯",
    title: "Pick the grant you want to apply for",
    what: "Here you choose which funding opportunity to write a proposal for. Only grants the AI already assessed as a strong match (GO or PREP) are shown — so everything here is worth your time.",
    steps: [
      "Look for a grant with a GO badge (best match) or PREP badge (good match).",
      "Click on it to select it — you'll see the score and reason it was recommended.",
      "Hit 'Start Drafting' to begin. If you've already started, pick it from 'In-Progress Applications'.",
    ],
    tip: "GO = 80%+ match. PREP = 60–79% match. Both are worth applying for!",
  },
  4: {
    emoji: "📋",
    title: "Track where your applications stand",
    what: "Think of this as your grant to-do board. Every application you create moves through stages — from writing all the way to submitted. You can see all of them here.",
    steps: [
      "Review your active applications and their current stages.",
      "Use the Pipeline page for a full Kanban board view.",
      "Click 'Continue' to move on to mapping your content.",
    ],
    tip: "You can always come back to any in-progress application from Stage 3.",
  },
  5: {
    emoji: "🗺️",
    title: "Connect your story blocks to each section",
    what: "Your master narrative is broken into blocks (like puzzle pieces). This stage lets you tag which blocks belong to which grant section — so the AI knows exactly what to pull when writing.",
    steps: [
      "For each grant section (e.g. 'Needs Statement'), click the narrative blocks that are relevant.",
      "You can select multiple blocks per section.",
      "When done, click 'Continue to Draft Generation'.",
    ],
    tip: "Not sure which blocks fit? The AI will make smart guesses in Stage 6 even without your selections.",
  },
  6: {
    emoji: "✍️",
    title: "Let the AI write your proposal sections",
    what: "This is where the magic happens. The AI uses your org profile, master narrative, and the grant's requirements to write each section of your proposal — tailored specifically for this funder.",
    steps: [
      "Click 'Draft All Sections' to generate everything at once (recommended!).",
      "Or click 'AI Draft' on individual sections if you want to go one at a time.",
      "Read each section, edit anything you want to change, then click 'Save All & Continue'.",
    ],
    tip: "You can always click 'Redraft' on any section to get a fresh version. Your edits are auto-saved.",
  },
  7: {
    emoji: "🔍",
    title: "Get AI feedback to make your proposal stronger",
    what: "A second pair of AI eyes reads your full draft and tells you exactly what to fix — missing evidence, weak language, sections that don't match the funder's priorities.",
    steps: [
      "Click 'Generate Edit Guidance' to get a list of prioritized recommendations.",
      "Red = fix before submitting. Amber = important improvement. Blue = nice to have.",
      "Go back to Stage 6 to make changes, then return here to re-check.",
    ],
    tip: "High-priority (red) items are the ones most likely to cause rejection. Always address those first.",
  },
  8: {
    emoji: "🚀",
    title: "Package and export your finished proposal",
    what: "Your proposal is ready! This stage compiles everything into a clean document you can download and submit. You can also run one final AI review to catch any last issues.",
    steps: [
      "Run 'Final AI Review' to get a readiness score and submission checklist.",
      "Download as PDF (for printing/attaching) or Word .doc (for editing in Microsoft Word).",
      "Check off each item in the submission checklist before you send.",
    ],
    tip: "Exporting automatically saves your proposal to the library — so future grants can learn from this one.",
  },
  section_executive_summary: {
    emoji: "📌",
    title: "Executive Summary",
    what: "This is the first thing reviewers read — and sometimes the only thing. It should answer: Who are you? What problem are you solving? How much money do you need? What will you do with it?",
    tip: "Keep it to 200–300 words. Lead with impact, not your org's history.",
  },
  section_needs_statement: {
    emoji: "📊",
    title: "Needs Statement",
    what: "Prove to the funder that the problem is real, serious, and happening in your community. Use statistics, research, and local data to make it undeniable.",
    tip: "The best needs statements cite 2–3 specific data points (e.g. '43% of residents in X county lack access to...'). The AI will try to include these from your narrative.",
  },
  section_goals_objectives: {
    emoji: "🎯",
    title: "Goals & Objectives",
    what: "Goals are big-picture outcomes ('Improve health equity'). Objectives are specific, measurable steps to get there ('Train 50 community health workers by Month 6'). Funders want both.",
    tip: "Use the SMART formula: Specific, Measurable, Achievable, Relevant, Time-bound.",
  },
  section_methodology: {
    emoji: "⚙️",
    title: "Methodology",
    what: "How exactly will you do the work? Who will do it? When? This section is your detailed project plan — activities, timeline, partners, and tools.",
    tip: "Include a timeline or phased plan if possible. Funders want to see you've thought it through.",
  },
  section_evaluation_plan: {
    emoji: "📈",
    title: "Evaluation Plan",
    what: "How will you know if the project worked? Describe how you'll collect data, what you'll measure, and who will review the results.",
    tip: "Name specific metrics (e.g. 'Pre/post survey scores', 'Number of people served'). Even simple measurement plans are fine.",
  },
  section_organizational_capacity: {
    emoji: "🏅",
    title: "Organizational Capacity",
    what: "Convince the funder that YOUR organization — specifically — can deliver this project. Highlight credentials, past grants, key staff, and why you're uniquely qualified.",
    tip: "Avoid repeating what's in other sections. Focus on WHY you, not what you'll do.",
  },
  section_budget_narrative: {
    emoji: "💰",
    title: "Budget Narrative",
    what: "Explain every major expense — why you need it, how you calculated it, and how it connects to the project goals. This builds trust with the funder.",
    tip: "Justify your indirect cost rate and fringe benefits upfront. Reviewers will flag unexplained line items.",
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