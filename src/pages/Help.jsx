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
    summary: "Your home screen — see everything at a glance: what's a great fit, what needs your attention, and what's coming up.",
    steps: [
      "See all your matches sorted into Great Fit, Worth a Look, Maybe Later, and Skip.",
      "Spot anything that needs your review before it moves forward.",
      "Track total money won, how often you win, and upcoming due dates.",
      "Use the chart to see which topics your opportunities fall under.",
      "Download your matches as a spreadsheet anytime."
    ]
  },
  {
    icon: Search,
    color: "text-blue-500",
    bg: "bg-blue-50 border-blue-200",
    badge: "Step 1",
    badgeColor: "bg-blue-100 text-blue-700",
    title: "Find Funding",
    summary: "Find funding opportunities that fit your work — let the AI search for you, or add one yourself.",
    steps: [
      "Set simple filters: topic, money amount, location, and how soon it's due.",
      "Or just type what you're looking for in plain words (e.g., 'workforce grants in the Southwest under $500K').",
      "The AI searches real sources and brings back matching opportunities.",
      "See a quick log of what was found, skipped, or missed.",
      "Have one in mind already? Add it yourself with the 'Add' form.",
      "Click 'Score This' on any opportunity to see how good a fit it is."
    ]
  },
  {
    icon: BarChart3,
    color: "text-violet-500",
    bg: "bg-violet-50 border-violet-200",
    badge: "Step 2",
    badgeColor: "bg-violet-100 text-violet-700",
    title: "Score Matches",
    summary: "The AI gives each opportunity a simple score based on how well it fits your organization.",
    steps: [
      "Pick one or more opportunities and click 'Score' to let the AI rate them.",
      "Each one gets a score out of 100, based on topic fit, whether you can apply, time left, and location.",
      "You'll get a clear verdict: Great Fit, Worth a Look, Maybe Later, or Skip.",
      "See which topics line up best with your work in a simple chart.",
      "Add your own notes to any match.",
      "Add the good ones to your list to start working on them."
    ]
  },
  {
    icon: Kanban,
    color: "text-amber-500",
    bg: "bg-amber-50 border-amber-200",
    badge: "Step 3",
    badgeColor: "bg-amber-100 text-amber-700",
    title: "Track Progress",
    summary: "A simple board to see where each application stands — and move it along as you go.",
    steps: [
      "See each application as a card: Working On It → Sent In → Waiting to Hear Back → We Got It! or Not This Time.",
      "Switch between Board view and List view with the tabs.",
      "Click a card to move it forward or add notes.",
      "Anything due soon is highlighted so you don't miss it.",
      "Click 'Write with AI' on any card to jump straight into writing."
    ]
  },
  {
    icon: Bot,
    color: "text-sky-500",
    bg: "bg-sky-50 border-sky-200",
    badge: "Step 4",
    badgeColor: "bg-sky-100 text-sky-700",
    title: "Write with AI",
    summary: "A step-by-step helper that writes your full application for you, one part at a time.",
    steps: [
      "Pick the opportunity you want to apply for.",
      "The helper pulls in your organization's info automatically.",
      "Add your past write-ups and mission statements so the AI sounds like you.",
      "Check that the AI understands what the funder is asking for.",
      "Match your stored content to each part of the application.",
      "Let the AI write each part (summary, the need, goals, plan, and more). Edit anything you like.",
      "Run a quick check to catch anything missing.",
      "Get a final once-over with tips before you finish and download."
    ]
  },
  {
    icon: Package,
    color: "text-rose-500",
    bg: "bg-rose-50 border-rose-200",
    badge: "Step 5",
    badgeColor: "bg-rose-100 text-rose-700",
    title: "Finish & Download",
    summary: "Put it all together and download a clean, ready-to-send document.",
    steps: [
      "Your best opportunities with started applications show up on the left.",
      "Click one to see which parts are done and which still need work.",
      "Use the checklist on the right to make sure everything's ready.",
      "Click 'Build Document' to put all the parts together.",
      "Download it as a file — or grab a PDF from the last step of Write with AI.",
      "Your finished text is saved so the AI can reuse it next time."
    ]
  },
  {
    icon: BookOpen,
    color: "text-teal-500",
    bg: "bg-teal-50 border-teal-200",
    badge: "Reference",
    badgeColor: "bg-teal-100 text-teal-700",
    title: "Funding Library",
    summary: "A searchable library of every opportunity you've found, with all the details in one place.",
    steps: [
      "Browse everything you've found or added, with filters by status, topic, and funder.",
      "Click any one to see the full details: money amount, who can apply, topics, and due date.",
      "Look things up quickly while you write or review.",
      "Mark each as Open, Closed, or Coming Soon to keep your library tidy."
    ]
  },
  {
    icon: ClipboardList,
    color: "text-orange-500",
    bg: "bg-orange-50 border-orange-200",
    badge: "Reference",
    badgeColor: "bg-orange-100 text-orange-700",
    title: "My Applications",
    summary: "One place to see all your applications, where they stand, and how they turned out.",
    steps: [
      "See every application in one list: title, funder, stage, due date, and who's on it.",
      "Filter by stage to focus on what needs attention.",
      "Record how each one ended (Won, Not This Time, Withdrawn) and what you learned.",
      "See how much you won compared to the time and money you put in.",
      "Look back at past results to plan your next moves."
    ]
  },
  {
    icon: Building2,
    color: "text-indigo-500",
    bg: "bg-indigo-50 border-indigo-200",
    badge: "Setup",
    badgeColor: "bg-indigo-100 text-indigo-700",
    title: "About My Org",
    summary: "Tell us about your organization once — the AI uses it to score matches and write for you.",
    steps: [
      "Enter your organization's name, mission, tax ID, and website.",
      "List the topics you work on — this helps the AI find and score the right matches.",
      "Set the areas you serve so location matters in your scores.",
      "Add basic numbers: yearly budget, staff size, and your cost rates.",
      "List any certifications and a short note on your past results.",
      "Save it — the AI uses this everywhere automatically."
    ]
  },
  {
    icon: Sparkles,
    color: "text-purple-500",
    bg: "bg-purple-50 border-purple-200",
    badge: "AI Tools",
    badgeColor: "bg-purple-100 text-purple-700",
    title: "Ask AI",
    summary: "Chat with a helpful AI for advice, writing help, and reviewing items that need a decision.",
    steps: [
      "Pick a helper: the Advisor (advice, finding funding, writing help) or the Reviewer (helps you decide on items waiting for you).",
      "Ask the Advisor anything: 'Which ones should we focus on?', 'Help me improve this section.', 'How are we doing overall?'",
      "Use the Reviewer to go through items waiting for your okay and record your choices.",
      "Your chats are saved — scroll back anytime.",
      "The helpers can see and update your opportunities, applications, and notes."
    ]
  },
  {
    icon: FolderOpen,
    color: "text-slate-500",
    bg: "bg-slate-50 border-slate-200",
    badge: "Settings",
    badgeColor: "bg-slate-100 text-slate-700",
    title: "My Workspace",
    summary: "Manage your personal workspace settings, backups, and usage statistics.",
    steps: [
      "View your workspace details: organization name, owner email, and current status.",
      "See aggregate counts for grants and applications in your workspace.",
      "Make a backup of your data anytime.",
      "Update your workspace notes and status.",
      "Admins can view and manage everyone's workspaces from Admin → Users."
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
        <h1 className="text-2xl font-bold mb-2">Capital Intelligence Engine — How It Works</h1>
        <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
          The JPGE Capital Intelligence Engine helps you find the right funding and apply with confidence. It walks you through every step — from finding opportunities to sending in a polished application — and does the heavy lifting for you.
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