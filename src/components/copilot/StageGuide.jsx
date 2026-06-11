import { useState } from "react";
import { Lightbulb, X, ChevronDown, ChevronUp } from "lucide-react";

const STAGE_GUIDES = {
  1: {
    emoji: "📄",
    title: "Upload your organization's story",
    what: "This is a reusable library of your organization's best content — mission, programs, past results, and strengths. The AI uses it automatically so you never have to repeat yourself.",
    steps: [
      "Paste or upload anything that describes your organization (annual report, past write-ups, website text — anything works).",
      "Click 'Break It Down' — the AI sorts it into neat, reusable pieces.",
      "Look them over, fix anything off, then click 'Approve & Continue'.",
    ],
    tip: "The more you add, the better every future application will be. Even a rough document works well.",
  },
  2: {
    emoji: "🏢",
    title: "Confirm your organization's profile",
    what: "Your org info powers everything the AI writes — name, tax ID, budget, mission, and areas you serve. Fill it in once and it's used everywhere.",
    steps: [
      "Click 'Open Org Profile' to check your details.",
      "Make sure your tax ID, cost rates, and mission are filled in.",
      "Come back and click 'Looks Good' when ready.",
    ],
    tip: "Your cost rates are used in the budget — make sure they're correct.",
  },
  3: {
    emoji: "🎯",
    title: "Select the opportunity to pursue",
    what: "Choose which opportunity to apply for. You'll only see your best matches — the ones worth your time.",
    steps: [
      "Look for a 'Great Fit' or 'Worth a Look' label.",
      "Tap one to see its score and why it fits.",
      "Click 'Start Writing', or pick one you already started to keep going.",
    ],
    tip: "Both 'Great Fit' and 'Worth a Look' are worth pursuing.",
  },
  4: {
    emoji: "📋",
    title: "See where your applications stand",
    what: "This shows every application and where it is — from writing to ready to send. Use it to stay on top of deadlines and what's next.",
    steps: [
      "Look over your applications and where each one is.",
      "Open the Track Progress page for a board view you can drag around.",
      "Click 'Next Step' to move on.",
    ],
    tip: "You can come back to any application you've started from Step 3.",
  },
  5: {
    emoji: "🗺️",
    title: "Match your content to each part",
    what: "Your content pieces are like puzzle pieces. Here you tell the AI which pieces go with which part of the application, so it has the right info when writing.",
    steps: [
      "For each part (like 'Needs Statement'), tap the content pieces that fit best.",
      "You can add more than one piece per part.",
      "Click 'Let AI Write' when done.",
    ],
    tip: "Skipping this is fine — the AI will choose for you in the next step.",
  },
  6: {
    emoji: "✍️",
    title: "Let the AI write your application",
    what: "The AI uses your org info, your content, and what the funder is looking for to write each part — made just for this funder.",
    steps: [
      "Click 'Draft All' to write everything at once (easiest).",
      "Or click 'AI Write' on one part at a time.",
      "Read each part, make any changes, then click 'Save All & Continue'.",
    ],
    tip: "Click 'Rewrite' on any part for a fresh version. Your changes save automatically.",
  },
  7: {
    emoji: "🔍",
    title: "Make your application stronger",
    what: "The AI reads your whole draft and points out exactly what to improve — weak spots, vague wording, or anything the funder wants that's missing.",
    steps: [
      "Click 'Get Tips' for a list of suggestions, sorted by importance.",
      "Red = fix before sending. Amber = important. Blue = nice to have.",
      "Go back to the writing step to make changes, then come back to re-check.",
    ],
    tip: "Always fix the red items first — these are the most common reasons applications get turned down.",
  },
  8: {
    emoji: "🚀",
    title: "Finish and download your application",
    what: "Your application is done! This puts all the parts together into a clean document you can download and send. A final AI check gives you a readiness score and a checklist.",
    steps: [
      "Run the 'Final Check' for a readiness score and any last reminders.",
      "Download as PDF or Word, depending on what's required.",
      "Go through the checklist before you send it in.",
    ],
    tip: "Downloading saves it to your library — future applications can learn from this one.",
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