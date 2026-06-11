// Shared constants used across CoPilot, PackExport, and Pipeline

export const SECTION_KEYS = [
  "executive_summary", "needs_statement", "goals_objectives",
  "methodology", "evaluation_plan", "organizational_capacity", "budget_narrative"
];

export const COPILOT_STAGES = [
  { id: 1, label: "Your Story", desc: "Add your past write-ups and mission so the AI sounds like you" },
  { id: 2, label: "Your Org Info", desc: "Check your organization's details" },
  { id: 3, label: "Pick One", desc: "Choose which opportunity to apply for" },
  { id: 4, label: "Your List", desc: "See where your applications stand" },
  { id: 5, label: "Match Content", desc: "Match your stored content to each part" },
  { id: 6, label: "Let AI Write", desc: "The AI writes each part for you" },
  { id: 7, label: "Tips to Improve", desc: "Get suggestions to make it stronger" },
  { id: 8, label: "Finish Up", desc: "Put it all together and download" },
];