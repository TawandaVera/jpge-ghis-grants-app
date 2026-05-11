// Shared constants used across CoPilot, PackExport, and Pipeline

export const SECTION_KEYS = [
  "executive_summary", "needs_statement", "goals_objectives",
  "methodology", "evaluation_plan", "organizational_capacity", "budget_narrative"
];

export const COPILOT_STAGES = [
  { id: 1, label: "Master Narrative", desc: "Upload and parse your organization's master narrative" },
  { id: 2, label: "Org Profile", desc: "Review and update organization profile" },
  { id: 3, label: "Opportunity Intake", desc: "Select grant opportunity and intake requirements" },
  { id: 4, label: "Pipeline Board", desc: "Assign to pipeline and set priorities" },
  { id: 5, label: "Content Mapping", desc: "Map master narrative blocks to grant sections" },
  { id: 6, label: "Draft Generation", desc: "AI generates tailored grant narrative sections" },
  { id: 7, label: "Edit Guidance", desc: "Review AI edit recommendations" },
  { id: 8, label: "Final Pack", desc: "Compile and export final application package" },
];