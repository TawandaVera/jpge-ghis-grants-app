import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Search, BarChart3, Kanban, Bot, Package,
  BookOpen, ClipboardList, Building2, Sparkles, FolderOpen,
  ChevronDown, ChevronRight, CheckCircle2, ArrowRight
} from "lucide-react";

const SECTIONS = [
  {
    icon: LayoutDashboard,
    color: "text-emerald-500",
    bg: "bg-emerald-50 border-emerald-200",
    badge: "Start Here",
    badgeColor: "bg-emerald-100 text-emerald-700",
    title: "Home",
    summary: "Your dashboard — see what's urgent, what fits best, and what to do next.",
    steps: [
      "Open the app. Your dashboard loads automatically.",
      "Look at the 'This Week's Best Moves' card — these are the top opportunities to act on right now.",
      "Check the colored stat cards to see how many opportunities you've found, scored, and applied for.",
      "If a yellow alert appears at the top, something needs your attention — click 'Review Now' to handle it.",
      "Scroll down to see charts showing deadlines and how your matches scored.",
      "Click any step in the workflow bar (Find Funding → Score Matches → …) to jump to that section."
    ]
  },
  {
    icon: Search,
    color: "text-blue-500",
    bg: "bg-blue-50 border-blue-200",
    badge: "Step 1",
    badgeColor: "bg-blue-100 text-blue-700",
    title: "Find Funding",
    summary: "Search for grants that match your work — by keyword, filters, quick presets, or a link you already have.",
    steps: [
      "Click 'Find Funding' in the left menu.",
      "You'll see four tabs at the top: '⚡ Quick Presets', '🔧 Filter & Search', '✏️ Just Type It', and '🔗 Paste a Link'.",
      "Quick Presets tab: click any preset card (e.g. 'Health Equity — Foundation Only') to auto-fill the filters, then click 'Search Now'.",
      "Filter & Search tab: set your own topic, funder type, applicant type, and deadline window. Click 'More Options' to set dollar amounts and geography.",
      "Just Type It tab: describe exactly what you want in plain English (e.g. 'SBIR grants for telehealth startups in the Southwest'). Click 'Search Now'.",
      "Paste a Link tab: paste a grant URL and click 'Look It Up'. The AI reads the page and shows you all the details and requirements.",
      "Watch the Activity Log at the bottom — it shows each opportunity as it's found.",
      "When the search finishes, a notification appears. Click 'Score them →' to go rate what was found.",
      "To add a grant manually, click the '+ Add Manually' button and fill in the form."
    ]
  },
  {
    icon: BarChart3,
    color: "text-violet-500",
    bg: "bg-violet-50 border-violet-200",
    badge: "Step 2",
    badgeColor: "bg-violet-100 text-violet-700",
    title: "Score Matches",
    summary: "Let the AI rate each opportunity so you know which ones are worth your time.",
    steps: [
      "Click 'Score Matches' in the left menu.",
      "Click the green 'Score Next 20' button. The AI scores each opportunity out of 100.",
      "Wait about 30–60 seconds while it works. A summary appears when done.",
      "Look at the Verdict column: 'Great Fit' = go for it, 'Worth a Look' = consider it, 'Maybe Later' = low priority, 'Skip' = not a match.",
      "Click any row to open the full score breakdown — see exactly why it scored that way and what to do next.",
      "Check the box next to one or more 'Great Fit' or 'Worth a Look' rows, then click 'Add to My List' to start working on them.",
      "Click 'Topic Strength' tab to see which subjects your opportunities align with most."
    ]
  },
  {
    icon: Kanban,
    color: "text-amber-500",
    bg: "bg-amber-50 border-amber-200",
    badge: "Step 3",
    badgeColor: "bg-amber-100 text-amber-700",
    title: "Track Progress",
    summary: "See where every application stands and move each one forward as you go.",
    steps: [
      "Click 'Track Progress' in the left menu.",
      "You'll see a board with columns: Working On It → Sent In → Waiting to Hear Back → We Got It! / Not This Time.",
      "Each application appears as a card showing the grant name, funder, and days until the deadline.",
      "Cards with a red warning have a deadline under 14 days — act on those first.",
      "To move a card, use the dropdown at the bottom of the card to change its column.",
      "Click 'Write with AI' on any card to jump straight into drafting that application.",
      "Switch to 'List' view using the tabs at the top if you prefer a simple list over the board."
    ]
  },
  {
    icon: Bot,
    color: "text-sky-500",
    bg: "bg-sky-50 border-sky-200",
    badge: "Step 4",
    badgeColor: "bg-sky-100 text-sky-700",
    title: "Write with AI",
    summary: "The AI writes your full grant application for you, one section at a time.",
    steps: [
      "Click 'Write with AI' in the left menu (or from any application card).",
      "Step 1 — Your Story: paste or upload any past write-ups or mission statements. Click 'Break It Down'. The AI pulls out reusable content pieces. Review them, then click 'Approve & Continue'.",
      "Step 2 — Your Org Info: check that your organization's details are filled in. Click 'Open Org Profile' to update if needed, then click 'Looks Good — Next Step'.",
      "Step 3 — Pick One: select the opportunity you want to apply for from your list. Click 'Start Writing' (or 'Keep Writing' if you've already started).",
      "Step 4 — Your List: review where each of your applications stands. Click 'Open Track Progress' to manage them, then click 'Next Step' to continue.",
      "Step 5 — Match Content: for each section of the application, tap the content pieces from Step 1 that belong there. This helps the AI write a more targeted draft.",
      "Step 6 — Let AI Write: click the 'Draft' button next to each section (Executive Summary, Needs Statement, Goals, etc.). The AI writes it. Read it, edit if needed.",
      "Step 7 — Tips to Improve: click 'Get Tips' for the AI's suggestions on making the application stronger. Click 'Regenerate' to get a fresh set of tips.",
      "Step 8 — Finish Up: click 'Download PDF' or 'Download Word' to save your finished application. Your text is also saved automatically for future use."
    ]
  },
  {
    icon: Package,
    color: "text-rose-500",
    bg: "bg-rose-50 border-rose-200",
    badge: "Step 5",
    badgeColor: "bg-rose-100 text-rose-700",
    title: "Finish & Download",
    summary: "Review readiness and download a clean document for any application you've started.",
    steps: [
      "Click 'Finish & Download' in the left menu.",
      "Your in-progress applications appear on the left. Click one to open it.",
      "A progress bar shows how many sections are complete.",
      "Use the checklist on the right to confirm all pre-submission items are done.",
      "Click 'Build & Download Document' to combine all sections into one file.",
      "Your finished text is also saved automatically so the AI can reference it for future applications."
    ]
  },
  {
    icon: BookOpen,
    color: "text-teal-500",
    bg: "bg-teal-50 border-teal-200",
    badge: "Reference",
    badgeColor: "bg-teal-100 text-teal-700",
    title: "Funding Library",
    summary: "Browse and search every grant opportunity you've found or added.",
    steps: [
      "Click 'Funding Library' in the left menu.",
      "Use the search bar or filter dropdowns to find a specific grant by name, funder, or topic.",
      "Click any row to see the full details: award amount, eligibility, deadline, requirements, and the source link.",
      "Click the shield icon on any row to verify the grant at Grants.gov.",
      "Use the Status filter to show only Open, Closed, or Coming Soon grants."
    ]
  },
  {
    icon: ClipboardList,
    color: "text-orange-500",
    bg: "bg-orange-50 border-orange-200",
    badge: "Reference",
    badgeColor: "bg-orange-100 text-orange-700",
    title: "My Applications",
    summary: "A full list of every application you're working on or have completed.",
    steps: [
      "Click 'My Applications' in the left menu.",
      "See every application as a card with its name, funder, deadline, and current status.",
      "Click the '+' button in any column to add a new application manually.",
      "Use the dropdown on each card to move it to a new status (e.g., from 'Working On It' to 'Sent In').",
      "Click the pencil icon to edit a card's details or add notes.",
      "Click the clipboard icon to log a quick update (e.g., 'Submitted narrative for review')."
    ]
  },
  {
    icon: Building2,
    color: "text-indigo-500",
    bg: "bg-indigo-50 border-indigo-200",
    badge: "Setup",
    badgeColor: "bg-indigo-100 text-indigo-700",
    title: "About My Org",
    summary: "Fill this in once — the AI uses it everywhere to write and score for you.",
    steps: [
      "Click 'About My Org' in the left menu.",
      "Enter your organization's name, mission statement, and website.",
      "Add your Tax ID (EIN) and SAM.gov UEI number if you have them.",
      "Select the topics your org works on (e.g., Health Equity, Workforce Development).",
      "Enter your yearly budget, number of staff, and cost rates (fringe and indirect).",
      "Add a short note about past grants you've won and any certifications you hold.",
      "Click 'Save Profile'. The AI will use this info automatically in every search and application."
    ]
  },
  {
    icon: Sparkles,
    color: "text-purple-500",
    bg: "bg-purple-50 border-purple-200",
    badge: "AI Tools",
    badgeColor: "bg-purple-100 text-purple-700",
    title: "Ask AI",
    summary: "Chat directly with an AI that knows your data and can answer questions or give advice.",
    steps: [
      "Click 'Ask AI' in the left menu.",
      "Choose a helper: 'Advisor' for funding strategy and writing advice, or 'Reviewer' for help with decisions.",
      "Click 'New Chat' to start a fresh conversation.",
      "Type your question and press Enter. Example: 'Which grants should I focus on this week?' or 'Help me improve my needs statement.'",
      "The AI can see your opportunities, scores, and applications — so its answers are specific to you.",
      "Your past chats are saved in the left panel. Click any one to pick up where you left off."
    ]
  },
  {
    icon: FolderOpen,
    color: "text-slate-500",
    bg: "bg-slate-50 border-slate-200",
    badge: "Settings",
    badgeColor: "bg-slate-100 text-slate-700",
    title: "My Workspace",
    summary: "View your account details and back up your data.",
    steps: [
      "Click 'My Workspace' in the left menu.",
      "See your organization name, account email, and workspace status.",
      "Click 'Create Backup' to download a copy of your data at any time.",
      "Update your workspace notes or status using the edit options on the page.",
      "If you're an admin, click 'Admin: Users' in the menu to view and manage all workspaces."
    ]
  }
];

export default function Help() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-emerald-400 font-bold text-xl">JPGE</span>
          <span className="text-white font-bold text-xl">CIE</span>
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 ml-2">User Guide</Badge>
        </div>
        <h1 className="text-2xl font-bold mb-2">How to Use This Platform</h1>
        <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
          Click any section below to see a step-by-step walkthrough. Each guide tells you exactly what to click, what you'll see, and what to do next — no jargon.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Finds and scores funding for you</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Writes your applications</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> You stay in control</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Tracks everything start to finish</span>
        </div>
      </div>

      {/* Workflow summary bar */}
      <div className="hidden md:flex items-center gap-1 overflow-x-auto pb-1">
        {["Home", "Find Funding", "Score Matches", "Track Progress", "Write with AI", "Finish & Download"].map((label, i) => (
          <div key={label} className="flex items-center gap-1 shrink-0">
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">{label}</span>
            {i < 5 && <ArrowRight className="w-3 h-3 text-slate-400" />}
          </div>
        ))}
        <span className="text-xs text-slate-400 ml-1">+ supporting tools</span>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isOpen = expanded === section.title;
          return (
            <Card
              key={section.title}
              className={`border cursor-pointer transition-all ${isOpen ? section.bg : "hover:border-slate-300"}`}
              onClick={() => setExpanded(isOpen ? null : section.title)}
            >
              <CardHeader className="py-4 px-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg bg-white border ${isOpen ? "shadow-sm" : ""}`}>
                      <Icon className={`w-4 h-4 ${section.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-xs ${section.badgeColor} border-0`}>{section.badge}</Badge>
                        <CardTitle className="text-sm font-semibold text-slate-800">{section.title}</CardTitle>
                      </div>
                      {!isOpen && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{section.summary}</p>
                      )}
                    </div>
                  </div>
                  {isOpen
                    ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  }
                </div>
              </CardHeader>
              {isOpen && (
                <CardContent className="pt-0 px-5 pb-5">
                  <p className="text-sm text-slate-600 mb-4">{section.summary}</p>
                  <ol className="space-y-2.5">
                    {section.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${section.color.replace("text-", "bg-")}`}>
                          {i + 1}
                        </span>
                        <span className="text-slate-700 leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-400 pb-4">
        JPGE Capital Intelligence Engine · For support, contact your system administrator.
      </p>
    </div>
  );
}