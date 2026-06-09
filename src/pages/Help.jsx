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
    title: "Overview",
    summary: "Your command center — a real-time dashboard showing pipeline health, key metrics, and pending actions.",
    steps: [
      "See your full grant pipeline at a glance: GO, PREP, DEF, and DECLINE recommendations.",
      "Monitor pending HIL (Human-in-the-Loop) checkpoints that require your review.",
      "Track total awarded funds, success rates, and upcoming deadlines.",
      "Use the category breakdown chart to spot alignment trends across your focus areas.",
      "Export your match data to CSV directly from this page."
    ]
  },
  {
    icon: Search,
    color: "text-blue-500",
    bg: "bg-blue-50 border-blue-200",
    badge: "Step 1",
    badgeColor: "bg-blue-100 text-blue-700",
    title: "Discovery",
    summary: "Find and import relevant grant opportunities using AI-powered search or manual entry.",
    steps: [
      "Use the Guided Search panel to set filters: focus area, award range, geographic scope, and deadline window.",
      "Or type a free-form natural language query (e.g., 'workforce development grants in the Southwest under $500K').",
      "The AI scans real-world sources and returns structured grant records.",
      "Review the audit log to see what was found, skipped (duplicate), or failed.",
      "Manually add grants using the 'Add Grant' form if you have a specific opportunity in mind.",
      "Click 'Push to Assessment' on any grant to begin the scoring process."
    ]
  },
  {
    icon: BarChart3,
    color: "text-violet-500",
    bg: "bg-violet-50 border-violet-200",
    badge: "Step 2",
    badgeColor: "bg-violet-100 text-violet-700",
    title: "Assessment",
    summary: "AI scores each grant opportunity against your organization's profile using the SOP4 framework.",
    steps: [
      "Select one or more grants and click 'Assess' to run the AI scoring engine.",
      "Each grant receives a composite score (0–100) across four dimensions: Mandate Alignment (40%), Eligibility Fit (30%), Deadline Feasibility (20%), and Geographic Match (10%).",
      "The engine assigns a recommendation: GO (≥80), PREP (≥60), DEF (≥40), or DECLINE (<40).",
      "Review the Mandate Heatmap to visualize alignment across your focus areas.",
      "Add your own human feedback notes to any assessment.",
      "Approve promising grants to advance them into the Grant Pipeline."
    ]
  },
  {
    icon: Kanban,
    color: "text-amber-500",
    bg: "bg-amber-50 border-amber-200",
    badge: "Step 3",
    badgeColor: "bg-amber-100 text-amber-700",
    title: "Grant Pipeline",
    summary: "A visual Kanban board for tracking every active application through its lifecycle stages.",
    steps: [
      "View all active applications as cards organized by stage: Discovery → Assessment → Matching → Writing → Compliance → Budget → Review → HIL Review → Submission Ready → Submitted.",
      "Switch between Kanban view and List view using the tabs.",
      "Click any card to update its stage or add notes.",
      "Cards flagged with upcoming deadlines are highlighted in amber/red.",
      "Use 'Start Drafting' on any application to jump directly into the Co-Pilot."
    ]
  },
  {
    icon: Bot,
    color: "text-sky-500",
    bg: "bg-sky-50 border-sky-200",
    badge: "Step 4",
    badgeColor: "bg-sky-100 text-sky-700",
    title: "Co-Pilot",
    summary: "An 8-stage AI writing assistant that drafts your full grant proposal section by section.",
    steps: [
      "Stage 1 — Select a grant opportunity you want to apply for.",
      "Stage 2 — Load your Org Profile data as context for the AI.",
      "Stage 3 — Ingest your Master Narrative (past proposals, mission statements, capacity statements).",
      "Stage 4 — Review and confirm the AI's understanding of the grant requirements.",
      "Stage 5 — Map narrative blocks to specific proposal sections.",
      "Stage 6 — Generate AI drafts for each section (Executive Summary, Needs Statement, Goals, Methodology, Evaluation, Capacity, Budget Narrative). Edit any section inline.",
      "Stage 7 — Run a Compliance Check to flag any missing requirements.",
      "Stage 8 — Get an editorial review with alignment scores and gap analysis before moving to Pack & Export."
    ]
  },
  {
    icon: Package,
    color: "text-rose-500",
    bg: "bg-rose-50 border-rose-200",
    badge: "Step 5",
    badgeColor: "bg-rose-100 text-rose-700",
    title: "Pack & Export",
    summary: "Assemble and export your final grant package as a formatted document ready for submission.",
    steps: [
      "All GO and PREP grants with drafted applications appear in the left panel.",
      "Click any grant to see which sections are complete vs. missing.",
      "Use the Readiness Checklist on the right to confirm all pre-submission items are done (Org Profile, Narratives, Budget, Compliance, etc.).",
      "Click 'Generate Package' to compile all sections into a formatted export file.",
      "Download the package as a .txt file — or use Co-Pilot's Stage 8 for PDF/RTF export.",
      "The full proposal text is saved back to the application record for future AI context."
    ]
  },
  {
    icon: BookOpen,
    color: "text-teal-500",
    bg: "bg-teal-50 border-teal-200",
    badge: "Reference",
    badgeColor: "bg-teal-100 text-teal-700",
    title: "Grant Dossier",
    summary: "A searchable library of all grant opportunities in your database with full detail views.",
    steps: [
      "Browse all grants ever discovered or imported, with filters by status, category, and funder.",
      "Click any grant to see the full dossier: award range, CFDA number, eligibility, focus areas, and deadline.",
      "Use the dossier to quickly look up grant details while writing or reviewing applications.",
      "Mark grants as Open, Closed, or Forecasted to keep your database current."
    ]
  },
  {
    icon: ClipboardList,
    color: "text-orange-500",
    bg: "bg-orange-50 border-orange-200",
    badge: "Reference",
    badgeColor: "bg-orange-100 text-orange-700",
    title: "Application Tracker",
    summary: "A consolidated view of all grant applications and their current stages with outcome tracking.",
    steps: [
      "See every application in one table: grant title, funder, stage, deadline, and assigned team member.",
      "Filter by stage to focus on applications needing attention.",
      "Record final outcomes (Awarded, Declined, Withdrawn) and capture lessons learned.",
      "Track ROI by comparing award amounts against hours and cost invested.",
      "View historical performance data to inform future grant strategy."
    ]
  },
  {
    icon: Building2,
    color: "text-indigo-500",
    bg: "bg-indigo-50 border-indigo-200",
    badge: "Setup",
    badgeColor: "bg-indigo-100 text-indigo-700",
    title: "Org Profile",
    summary: "Your organization's master profile — the foundation that powers AI scoring and proposal writing.",
    steps: [
      "Enter your organization's name, mission, EIN, UEI (SAM.gov), and website.",
      "Define your focus areas (e.g., health equity, digital health, workforce development) — these drive mandate alignment scoring.",
      "Set your geographic coverage (states/regions served) for geographic match scoring.",
      "Input financial data: annual budget, staff count, indirect cost rate, and fringe benefit rate.",
      "List your compliance certifications and summarize past grant performance.",
      "Save your profile — the AI uses this data automatically in Assessment and Co-Pilot."
    ]
  },
  {
    icon: Sparkles,
    color: "text-purple-500",
    bg: "bg-purple-50 border-purple-200",
    badge: "AI Tools",
    badgeColor: "bg-purple-100 text-purple-700",
    title: "AI Assistant",
    summary: "Chat directly with specialized AI agents for grant strategy, writing help, and HIL review.",
    steps: [
      "Choose between two agents: Grant Advisor (strategy, discovery, pipeline, writing guidance) or HIL Reviewer (human-in-the-loop checkpoint decisions).",
      "Ask the Grant Advisor anything: 'Which grants should we prioritize this quarter?', 'Help me improve the needs statement for this application.', 'What's our current pipeline score?'",
      "Use the HIL Reviewer to work through pending checkpoints, review AI-generated content, and record decisions.",
      "Conversations are persistent — scroll back through prior exchanges at any time.",
      "The agents have full read/write access to your grants, applications, narratives, and checkpoints."
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
      "Trigger a manual backup to snapshot your current data.",
      "Update workspace notes and status (Active, Paused, Archived).",
      "Admins can view and manage all workspaces from Admin → Users."
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
          <span className="text-white font-bold text-xl">-GMS</span>
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 ml-2">User Guide</Badge>
        </div>
        <h1 className="text-2xl font-bold mb-2">Grant Management System — How It Works</h1>
        <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
          JPGE-GMS is an end-to-end AI-powered grant management platform. It guides your team through every phase of the grant lifecycle — from discovering opportunities to submitting polished proposals — using intelligent automation, human-in-the-loop review, and structured workflows.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> AI-powered discovery & scoring</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Automated proposal drafting</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Human-in-the-loop oversight</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Full lifecycle tracking</span>
        </div>
      </div>

      {/* Workflow summary bar */}
      <div className="hidden md:flex items-center gap-1 overflow-x-auto pb-1">
        {["Overview", "Discovery", "Assessment", "Pipeline", "Co-Pilot", "Pack & Export"].map((label, i) => (
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
        JPGE-GMS · Grant Management System · For support, contact your system administrator.
      </p>
    </div>
  );
}