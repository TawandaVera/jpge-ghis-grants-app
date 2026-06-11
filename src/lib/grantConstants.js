// Shared constants used across CoPilot, PackExport, and Pipeline

export const SECTION_KEYS = [
  "executive_summary", "needs_statement", "goals_objectives",
  "methodology", "evaluation_plan", "organizational_capacity", "budget_narrative"
];

export const COPILOT_STAGES = [
  { id: 1, label: "Add Your Writing", desc: "Share past writing about your organization" },
  { id: 2, label: "Your Organization", desc: "Check your organization's info" },
  { id: 3, label: "Pick One to Apply For", desc: "Choose a good match to write" },
  { id: 4, label: "Your Applications", desc: "See what you're working on" },
  { id: 5, label: "Match Your Writing", desc: "Attach your writing to each part" },
  { id: 6, label: "Write the Draft", desc: "The AI writes each part for you" },
  { id: 7, label: "Make It Stronger", desc: "Tips to improve your application" },
  { id: 8, label: "Finish & Download", desc: "Put it together and download" },
];