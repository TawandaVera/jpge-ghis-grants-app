import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const GUIDE_CONTENT = `
JPGE Capital Intelligence Engine (CIE) — Complete Function Guide & User Manual
Version: 2.0 | Last Updated: Auto-generated

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The JPGE Capital Intelligence Engine is an end-to-end grant intelligence platform for nonprofits and mission-driven organizations. It automates grant discovery, AI-powered scoring, proposal writing, donor intelligence research, and application lifecycle tracking.

This document is the exhaustive reference for every feature, function, and workflow in the platform.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE OF CONTENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. HOME DASHBOARD
2. FIND FUNDING (Grant Discovery)
3. SCORE MATCHES (AI Assessment)
4. TRACK PROGRESS (Pipeline)
5. WRITE WITH AI (CoPilot)
6. FINISH & DOWNLOAD (Pack Export)
7. FUNDING LIBRARY (Grant Dossier)
   7a. Donor Intelligence / Donor Research
   7b. Schedule Follow-Up Meetings
   7c. Export Research to Google Doc
8. MY APPLICATIONS (Application Tracker)
9. ABOUT MY ORG (Org Profile)
10. ASK AI (AI Assistant)
11. TRACKS (Saved Filter Sets)
12. MY WORKSPACE
13. ADMIN: USERS & WORKSPACES
14. HELP PAGE
15. AUTOMATED BACKGROUND FUNCTIONS
16. AI AGENTS & HUMAN-IN-THE-LOOP (HIL)
17. DATA ENTITIES REFERENCE
18. TIPS & BEST PRACTICES

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. HOME DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Location: Click "Home" (dashboard icon) in the left sidebar, or navigate to "/"

PURPOSE:
The Home dashboard is your command center. It surfaces the most actionable items across all modules so you always know what to do next.

FEATURES & HOW TO USE EACH ONE:

1.1 Workflow Navigation Bar
  - A horizontal bar at the top shows the 5-step workflow: Find Funding → Score Matches → Track Progress → Write with AI → Finish & Download.
  - Click any step to jump directly to that module.
  - Steps highlight to indicate where you currently are.

1.2 Urgent Alert Banner
  - A yellow warning banner appears when Human-in-the-Loop (HIL) checkpoints are pending.
  - It shows the number of pending reviews.
  - Click "Review Now" to go directly to the pending approvals.
  - The banner disappears automatically when all pending items are resolved.

1.3 "This Week's Best Moves" Card
  - Powered by the AI Advisor agent — displays 3–5 prioritized actions for the current week.
  - Actions are ranked by urgency (deadline proximity) and opportunity quality (match score).
  - Click any action item to navigate to the relevant module.
  - Refreshes each session based on current data.

1.4 Key Metric Cards (row of 4)
  - Opportunities Found: total grants in your discovery database.
  - AI-Scored: number of grants that have received a match score.
  - Applied For: applications you've created (not necessarily submitted).
  - Funded: count of awarded applications logged in outcomes.
  - Click any card to navigate to the corresponding module.

1.5 Deadline Calendar Strip
  - Shows upcoming grant deadlines color-coded by urgency (red = ≤14 days, amber = ≤30 days, green = >30 days).
  - Scroll horizontally to see further-out deadlines.
  - Click any deadline chip to open that grant in the Funding Library.

1.6 Topic Distribution Chart (bar chart)
  - Shows how your scored matches distribute across grant categories (Health Equity, Digital Health, etc.).
  - Hover over any bar to see the count.
  - Useful for spotting imbalances in your grant mix.

1.7 Score Distribution Chart (pie chart)
  - Shows the breakdown of GO / PREP / DEF / DECLINE verdicts across all scored matches.
  - Helps you understand your overall pipeline quality at a glance.

1.8 Recent Activity Feed
  - Lists the 5 most recently created or updated applications.
  - Each row shows the grant name, funder, stage, and last-updated time.
  - Click "View All" to go to My Applications.

1.9 Donor Intelligence Summary
  - Shows recent research runs from the Donor Intelligence module.
  - Displays status (complete/running/pending/failed) and a snippet of findings.
  - Click any row to navigate to the Funding Library where that grant's research lives.

1.10 Export CSV Button
  - Located in the top-right area of the metrics section.
  - Exports all grant match data (name, funder, score, verdict, deadline) to a .csv file.
  - Opens in Excel, Google Sheets, or any spreadsheet tool.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. FIND FUNDING (Grant Discovery)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Location: "Find Funding" in the left sidebar → /discovery

PURPOSE:
Search for new grant opportunities via AI-powered web search, preset filters, plain-English queries, or by pasting a direct URL. All results are saved to your grant database for scoring.

TABS & FUNCTIONS:

2.1 ⚡ Quick Presets Tab
  - Pre-configured search profiles for common funding scenarios.
  - Available presets include: "Health Equity — Foundation Only", "Veterans Services", "Digital Health Innovation", "Workforce Development — Federal", "BIPOC-Led Programs", "Rural Communities", and more.
  - Click any preset card → filters auto-populate → click "Search Now".
  - The AI runs a targeted search using your org profile as additional context.
  - Results appear in the Activity Log at the bottom.

2.2 🔧 Filter & Search Tab
  - Manual filter controls: Topic/keywords, Funder type (federal / family foundation / private foundation / HNWI / major gift / corporate), Applicant type, Deadline window (days from today).
  - "More Options" expands to reveal: minimum/maximum award amount, geographic scope.
  - Click "Search Now" to execute. The search runs in the background — you can navigate away.
  - A success notification appears when results are ready.

2.3 ✏️ Just Type It Tab
  - Plain-English natural language search.
  - Examples: "SBIR grants for telehealth in the Southwest", "Foundation grants for food security in urban areas", "Federal funding for veteran employment programs".
  - The AI interprets your intent, constructs a search query, and fetches matching opportunities.
  - Results are saved identically to filtered searches.

2.4 🔗 Paste a Link Tab (URL Import)
  - Paste any grant opportunity URL (Grants.gov, foundation websites, opportunity portals).
  - Click "Look It Up". The AI fetches the page, extracts all details: title, funder, amount, deadline, eligibility, requirements, focus areas.
  - The grant is added directly to your database, pre-populated with extracted data.
  - You are redirected to the grant's detail view.

2.5 + Add Manually Button
  - Opens a form to create a grant record by hand.
  - Fields: Title, Funder, Deadline, Award Amount (min/max), Description, Focus Areas, Eligibility, Category, Status, Geographic Scope, Source URL.
  - Use this for opportunities you found outside the platform (email tips, word of mouth, etc.).

2.6 Activity Log
  - Scrollable log at the bottom of the page.
  - Shows real-time status of each search: "Searching…", "Found 12 opportunities", "Saved to database", error messages.
  - Persists for the current session.

2.7 Auto-Tagging (Background)
  - Every newly imported grant is automatically analyzed by the AI to tag it with outcome areas, populations served, and geographic tags.
  - This happens silently in the background via the autoTagGrants function.
  - Tagged grants are more accurately matched when scored.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. SCORE MATCHES (AI Assessment)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Location: "Score Matches" in the left sidebar → /assessment

PURPOSE:
Let the AI score and rank every discovered grant opportunity against your organization's profile. Get a clear GO / PREP / DEF / DECLINE verdict for each one.

FEATURES:

3.1 Score Next 20 Button
  - Scores up to 20 unscored grants in a single batch.
  - The AI evaluates each grant across 4 dimensions (see below) and writes a rationale.
  - Takes approximately 30–90 seconds depending on batch size.
  - Run multiple times to score all discovered grants.

3.2 Scoring Dimensions (4 factors)
  - Mandate Alignment (40% weight): How well the grant's focus areas match your org's mission and programs.
  - Eligibility Fit (30% weight): Whether your org type, size, geography, and credentials qualify.
  - Deadline Feasibility (20% weight): How much time is available relative to application complexity.
  - Geographic Match (10% weight): Overlap between grant geography and your org's service area.
  - Total score = weighted sum (0–100).

3.3 Verdict System
  - GO (≥80): Strong match — prioritize immediately.
  - PREP (≥60): Solid match — start preparing.
  - DEF (≥40): Possible match — defer unless bandwidth allows.
  - DECLINE (<40): Poor match — skip.

3.4 Results Table
  - Columns: Grant Name, Funder, Score, Verdict, Deadline, Actions.
  - Click any row to open the full score breakdown dialog.
  - The dialog shows: rationale text, strengths list, concerns list, and human feedback field.

3.5 Human Feedback Field
  - Inside the score detail dialog, type notes about why you agree or disagree with the AI's verdict.
  - Feedback is saved to the GrantMatch record and visible to the AI in future drafting.

3.6 Add to My List
  - Check the box next to any scored grant → "Add to My List" button appears.
  - Creates a GrantApplication record and adds the grant to your pipeline in the "discovery" stage.

3.7 Topic Strength Tab
  - A bar chart tab showing score distribution by grant category.
  - Helps you identify which topic areas your org scores best in.

3.8 Status Filter
  - Filter the table by verdict (All / GO / PREP / DEF / DECLINE) using tabs at the top.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. TRACK PROGRESS (Pipeline)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Location: "Track Progress" in the left sidebar → /pipeline

PURPOSE:
Manage your active grant applications in a visual Kanban board. Move applications through stages and see deadlines at a glance.

FEATURES:

4.1 Board View (Default)
  - Columns correspond to application stages:
    - Working On It (writing/assessment/compliance/budget/review)
    - Sent In (submitted)
    - Waiting to Hear Back (pending decision)
    - We Got It! (awarded) and Not This Time (declined)
  - Each card shows: grant title, funder, deadline, and days remaining.
  - Cards with red borders have deadlines within 14 days — act first.

4.2 List View
  - Toggle to a flat table view using the "List" tab.
  - Same data in a more compact format — sortable by deadline or stage.

4.3 Move Cards
  - On any card, use the stage dropdown to change its column.
  - The application record updates instantly.

4.4 Write with AI Button
  - Each card has a "Write with AI" shortcut button.
  - Clicking it navigates to the CoPilot module pre-loaded with that application.

4.5 New Application Button (+)
  - In the board header or any column header, click "+" to create a new application manually.
  - Requires: grant title, funder, deadline, stage.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. WRITE WITH AI (CoPilot)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Location: "Write with AI" in the left sidebar → /copilot

PURPOSE:
An 8-step guided workflow that uses AI to write your complete grant application. Each step builds on the previous one for maximum accuracy and funder alignment.

STEPS IN DETAIL:

5.1 Step 1 — Your Story (Master Narrative)
  - Paste or upload any existing write-up: annual reports, previous proposals, mission statements, program descriptions.
  - Click "Break It Down". The AI extracts reusable content blocks (org history, mission, programs, capacity, impact data, etc.).
  - Each block is labeled and classified as AUTO_FILL, ADAPT, CUSTOM_WRITE, or MISSING_INFO.
  - Review each block — edit, approve, or delete.
  - Click "Approve & Continue" to save to your Master Narrative library.
  - Content QA Tool: A built-in audit runs automatically to flag duplicates, stubs, and quality issues.

5.2 Step 2 — Your Org Info
  - Displays your saved Org Profile summary.
  - Click "Open Org Profile" to update any details (budget, EIN, indirect rate, etc.).
  - Click "Looks Good — Next Step" once confirmed.

5.3 Step 3 — Pick One (Select Application)
  - Browse your scored grant matches.
  - Select the one you want to write for.
  - Click "Start Writing" to create a new application record, or "Keep Writing" to resume an existing one.

5.4 Step 4 — Your List (Pipeline Check)
  - Shows all your current applications in a list.
  - Click "Open Track Progress" to manage stages.
  - Click "Next Step" to proceed.

5.5 Step 5 — Match Content (Section Mapping)
  - For each application section (Executive Summary, Needs Statement, Goals & Objectives, Methodology, Evaluation Plan, Organizational Capacity, Budget Narrative), select which Master Narrative blocks are most relevant.
  - The AI uses these mappings to write in a targeted, coherent voice.
  - Tagging more blocks = higher-quality draft.

5.6 Step 6 — Let AI Write (Draft Generation)
  - Individual Section Drafting: Click "Draft" next to any section. The AI writes it using your org profile + selected narrative blocks + grant requirements.
  - Bulk Draft: Click "Draft All" to generate every section simultaneously (takes 60–120 seconds).
  - Progress bar shows completion percentage.
  - Each draft is editable in a rich text area — make changes and save.
  - Click "Save All" to persist all drafts.

5.7 Step 7 — Tips to Improve (Quality Optimization)
  - Click "Get Tips" to run an AI critique pass on your entire application.
  - The AI flags: weak language, missing specifics, alignment gaps, compliance risks, budget inconsistencies.
  - Tips appear as numbered callouts — click any tip to jump to that section.
  - Click "Regenerate" for a fresh set of tips.
  - Edit sections directly based on tips, then re-run for updated feedback.

5.8 Step 8 — Finish Up (Export)
  - Click "Download PDF" or "Download Word" to export the compiled application.
  - Full proposal text is also saved to the application record for AI context in future drafts.
  - Exported documents include: all drafted sections, funder name, deadline, and organization letterhead info.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. FINISH & DOWNLOAD (Pack Export)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Location: "Finish & Download" in the left sidebar → /pack

PURPOSE:
Final review and document generation for any application you've worked on in the CoPilot.

FEATURES:

6.1 Application List
  - Left panel shows all in-progress applications.
  - Click any application to load it into the review panel.

6.2 Completion Progress Bar
  - Visual indicator showing how many of the 7 standard sections have content.
  - Red = less than 50% complete, amber = 50–79%, green = 80%+.

6.3 Section Preview
  - View all drafted sections in a read-only format.
  - Click any section header to expand/collapse.

6.4 Pre-Submission Checklist
  - A checklist of action items: narrative complete, budget attached, certifications verified, SAM.gov active, etc.
  - Check items off manually as you complete them.

6.5 Build & Download Document
  - Click "Build & Download Document" to compile all sections into a single formatted document.
  - Choose PDF or Word format.
  - The document is also saved to the application record as proposal_text for future AI context.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. FUNDING LIBRARY (Grant Dossier)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Location: "Funding Library" in the left sidebar → /dossier

PURPOSE:
A full reference library of every grant in your database. Deep-dive into any opportunity: get AI strategy dossiers, verify sources, research foundation principals, and schedule donor outreach.

FEATURES:

7.1 Grant Library Grid
  - Displays all grants as cards sorted by deadline.
  - Each card shows: title, funder, score badge (GO/PREP/DEF), deadline, award range, and category tags.
  - Filter tabs at the top: Show All / Great Fit (GO) / Worth a Look (PREP+DEF).
  - Search bar filters by title, funder, or description.

7.2 Build a Game Plan (AI Dossier)
  - Click any grant card → opens the detail dialog.
  - Click "Build a Game Plan" button.
  - The AI generates a structured dossier containing:
    - Executive Brief: 2-paragraph summary of the opportunity and why it fits.
    - Fit Rationale: specific reasons this grant aligns with your org.
    - Key Risks: potential problems or disqualifying factors.
    - Application Strategy: numbered step-by-step action plan for this specific grant.
    - Key Deadlines & Requirements: extracted from the grant record.
  - The dossier is displayed in the dialog and can be scrolled or printed.

7.3 Verify on GrantedAI
  - Button in the detail dialog.
  - Opens GrantedAI's grant database in a new browser tab to cross-check details.
  - Useful for validating amounts, deadlines, and eligibility before investing time.

7.4 Application Status Logging
  - In the detail dialog, a dropdown shows the current application stage for this grant (if one exists).
  - Update the stage directly from the dialog without navigating to the Pipeline.

7a. DONOR INTELLIGENCE (Donor Research)

  WHEN IT APPEARS:
  The "Donor Research" button (purple) appears in the grant detail dialog for: family_foundation, private_foundation, and hnwi funding types only.

  7a.1 Trigger Research Run
    - Click "Donor Research" button in the detail dialog → scrolls to the Donor Intelligence panel at the bottom of the page.
    - In the panel, click "Investigate people behind this grant".
    - The system runs an AI research pass using the funder name and grant context.
    - Status shows as "Running…" while it works (typically 15–45 seconds).
    - DO NOT close the page — wait for "Complete" status.

  7a.2 Research Output — People Tab
    - Lists every identified individual: board members, trustees, executives, program officers, and known principals.
    - Each person record includes: Name, Role/Title, Confidence Label (HIGH/MEDIUM/LOW), Linked Causes.
    - Confidence labels indicate how certain the AI is about the person's connection to the foundation.
    - HIGH = confirmed from multiple sources; MEDIUM = probable; LOW = possible.

  7a.3 Research Output — Cause Signals Tab
    - Shows recurring cause themes the foundation/funder has historically supported.
    - Examples: "Rural health equity", "STEM workforce development", "Environmental justice".
    - Use these signals to align your proposal language with the funder's known interests.

  7a.4 Research Output — Evidence Trail Tab
    - A chronological log of sources, grants awarded, news mentions, and public filings that informed the research.
    - Each evidence item shows: source type, date, and a brief summary.
    - Use this to verify findings before outreach.

  7a.5 Research Output — Outreach Opportunities Tab
    - AI-generated outreach angles for each identified person.
    - Each suggestion includes: person name, recommended angle (e.g., "Shared interest in health equity for rural veterans"), and rationale.
    - Click the calendar icon (📅) next to any person or opportunity to schedule a follow-up meeting.

  7a.6 Research History
    - All past research runs for a grant are saved and listed in the Donor Intelligence panel.
    - Each past run shows: date, status, number of individuals found, and confidence score.
    - Click any past run to re-open its full results without re-running the research.

7b. SCHEDULE FOLLOW-UP MEETINGS

  REQUIREMENT: Must connect Google Calendar first (prompted on first use).

  7b.1 Opening the Scheduling Modal
    - From the People tab or Outreach Opportunities tab in a research run, click the 📅 calendar icon next to any individual.
    - A modal opens pre-filled with the person's name, role, and the funder's name.

  7b.2 Connect Google Calendar
    - If Google Calendar is not yet connected, a "Connect Google Calendar" prompt appears.
    - Click it to authorize — a one-time OAuth flow opens in a popup.
    - After authorizing, the modal is ready to use.

  7b.3 Fill In Meeting Details
    - Date: pick from the date picker (today or future dates only).
    - Time: select from the dropdown (30-minute increments, 8am–6pm).
    - Duration: 30 / 60 / 90 minutes.
    - Notes: optional context for the meeting description (e.g., "Discuss alignment with health equity programs, reference our Veterans initiative").

  7b.4 Create the Event
    - Click "Schedule Meeting". The event is added to your Google Calendar instantly.
    - A success confirmation appears with the event title and date.
    - The event title format: "Follow-up: [Person Name] — [Funder Name]".
    - The event description includes the person's role, grant context, and your notes.

7c. EXPORT RESEARCH TO GOOGLE DOC

  REQUIREMENT: Must connect Google account with Docs access (prompted on first use).

  7c.1 Export from Research Run Detail
    - In any completed research run, click the document icon (📄) in the top-right of the run panel, or the "Export to Doc" button.

  7c.2 Export from Grant Detail Dialog
    - Inside the grant detail dialog, after a research run is complete, an "Export to Doc" button appears.

  7c.3 What Gets Exported
    - A formatted Google Doc is created with:
      - Title: "Donor Intelligence Report — [Funder Name]"
      - Section 1: Key Individuals (name, role, confidence, linked causes)
      - Section 2: Cause Signals
      - Section 3: Evidence Trail (source, date, summary)
      - Section 4: Outreach Opportunities (person, angle, rationale)
    - A link to the created Google Doc appears — click to open it directly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. MY APPLICATIONS (Application Tracker)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Location: "My Applications" in the left sidebar → /tracker

PURPOSE:
A comprehensive list view of every application in your system. Manage status, log notes, and monitor deadlines.

FEATURES:

8.1 Application List
  - All GrantApplication records displayed as cards.
  - Sorted by deadline (soonest first).
  - Each card: grant title, funder name, deadline, current stage badge, award amount, and action buttons.

8.2 Stage Management
  - Dropdown on each card to move the application to a new stage.
  - Stages: discovery → assessment → matching → writing → compliance_check → budget → review → hil_review → submission_ready → submitted → awarded / declined.

8.3 Edit Application Details
  - Click the pencil icon to open an edit panel.
  - Edit: notes, assigned staff, award amount (once known), deadline.

8.4 Notes Log
  - Click the clipboard icon to add a timestamped note to an application.
  - Notes are appended chronologically — useful for audit trails ("Submitted narrative 6/1", "Received funder response 6/10").

8.5 New Application (+)
  - Click "+" in the header to create a new GrantApplication record manually.
  - Required fields: grant title, funder, deadline.

8.6 Outcome Logging
  - Once an application reaches "awarded" or "declined", a GrantOutcome record can be logged.
  - Fill in: award amount, requested amount, submission date, decision date, decline reason (if declined), lessons learned, and hours spent.
  - ROI is calculated automatically: (award amount ÷ cost to prepare) × 100.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. ABOUT MY ORG (Org Profile)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Location: "About My Org" in the left sidebar → /org-profile

PURPOSE:
The single source of truth for your organization's identity. The AI reads this profile in every scoring, drafting, and research action.

FIELDS & HOW TO USE THEM:

9.1 Basic Identity
  - Org Name: Your legal organization name.
  - Mission Statement: 1–3 sentences. Crucial — the AI uses this for mandate alignment scoring.
  - Website URL.
  - Contact Name & Email.

9.2 Financial Details
  - Annual Budget: Used to assess grant size fit.
  - Indirect Cost Rate (%): Used in budget generation.
  - Fringe Benefit Rate (%): Used in personnel cost calculations.

9.3 Compliance & Legal
  - EIN / Tax ID: Required for federal grant eligibility checks.
  - SAM.gov UEI: Required for most federal grants.
  - Compliance Certifications: e.g., "NICRA", "ISO 9001", "CARF Accreditation". Add as individual tags.

9.4 Geographic Coverage
  - List all states or regions where your org delivers programs.
  - Used for geographic match scoring.

9.5 Focus Areas
  - Topic tags: Health Equity, Digital Health, Workforce Development, Community Engagement, Research, etc.
  - Add as many as apply. Used for mandate alignment scoring.

9.6 Staff Count
  - Number of current staff. Used to assess organizational capacity in proposals.

9.7 Past Performance
  - Text field: summarize past grant wins, major funded projects, and performance track record.
  - Directly used in Organizational Capacity sections of proposals.

9.8 Capacity Notes
  - Any current constraints or strengths: "Currently at capacity in Q3", "New grants manager hired", etc.

9.9 Staff Capacity Section (embedded)
  - Manage StaffMember records directly from the Org Profile page.
  - Each staff member has: Full Name, Title, Department, Employment Type, FTE, Education, Years of Experience, Core Competencies, Certifications, Focus Areas, Languages, Bio, Grant Roles, and Key Personnel flag.
  - Key Personnel are flagged for use in proposal staffing sections.
  - The AI references staff bios and competencies when writing Organizational Capacity sections.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. ASK AI (AI Assistant)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Location: "Ask AI" in the left sidebar → /ai-assistant

PURPOSE:
Direct conversational access to AI agents that know your data. Ask strategy questions, get writing help, and request analysis — all in natural language.

AGENTS:

10.1 Grant Advisor
  - Best for: funding strategy, opportunity prioritization, proposal advice, deadline planning.
  - Example questions: "Which 3 grants should I focus on this month?", "What's missing from my needs statement?", "How do I improve my mandate alignment score?"
  - Has full read access to your grants, matches, applications, org profile, and master narratives.

10.2 HIL Reviewer
  - Best for: review decisions on application quality, compliance checks, and strategic go/no-go calls.
  - Example questions: "Is this application ready to submit?", "Flag any compliance risks in my current draft."
  - Designed to simulate a program officer review.

10.3 Grant Recommender
  - Best for: getting personalized grant suggestions based on your profile and history.
  - Ask: "Find me 5 new grants for our veterans workforce program."

10.4 How to Use
  - Click "New Chat" to start a fresh conversation (prior conversations are auto-saved).
  - Select the agent from the top of the chat interface.
  - Type your question and press Enter or click Send.
  - The AI streams its response in real-time.
  - Past conversations appear in the left panel — click any to resume.
  - You can attach files (drag & drop) for the AI to reference.

10.5 AI Settings (Admin)
  - Admins can disable all AI assistants via the AISettings entity.
  - When disabled, a customizable message is shown to all users.
  - This is useful for conserving integration credits during low-use periods.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11. TRACKS (Saved Filter Sets)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Location: "Tracks" in the left sidebar → /tracks

PURPOSE:
Create named filter profiles for different program areas. Load a Track in Find Funding to instantly pre-fill all search filters for that program area.

HOW TO USE:

11.1 Create a Track
  - Click "New Track".
  - Name it (e.g., "Veterans Employment — Federal", "Health Equity — Foundations", "BIPOC Youth — Any").
  - Set filters: Outcome Areas, Populations Served, Geographies, Funding Types.
  - Click Save.

11.2 Use a Track in Find Funding
  - Go to Find Funding → Tracks tab (if shown in the UI) or open a saved track.
  - The filters auto-populate based on the track.
  - Click "Search Now" to run a targeted search.

11.3 Edit or Delete a Track
  - Click the edit icon on any track card to update its filters.
  - Click the trash icon to delete (no confirmation prompt — be careful).

11.4 When to Use Tracks
  - When your org runs multiple distinct programs with different funding needs.
  - When you want to run the same search on a regular basis without re-entering filters.
  - When different staff members manage different program tracks.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
12. MY WORKSPACE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Location: "My Workspace" in the left sidebar → /my-workspace

PURPOSE:
View your workspace metadata, create data backups, and monitor system health.

FEATURES:

12.1 Workspace Details
  - Shows: organization name, account email, workspace status (active/paused/archived).
  - Displays grant count and application count for this workspace.

12.2 Create Backup
  - Click "Create Backup" to trigger a data export.
  - A snapshot of all your grants, matches, applications, narratives, and outcomes is packaged.
  - Download the file to store offline.

12.3 Workspace Notes
  - A text field for admin notes about this workspace (e.g., "Fiscal year ends June 30").
  - Editable and saved to the Workspace record.

12.4 Status
  - Change workspace status: active (default), paused, or archived.
  - Paused workspaces may have reduced automation activity.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
13. ADMIN: USERS & WORKSPACES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Location: "Admin: Users" in the left sidebar → /admin/workspaces (admin role required)

PURPOSE:
Platform-level administration for managing multiple users and their workspaces.

FEATURES:

13.1 Workspace List
  - See all registered workspaces: org name, owner email, status, grant count, application count, last backup date.
  - Filter by status (active/paused/archived).

13.2 Workspace Actions
  - View: open any workspace's data in detail view.
  - Edit Notes: add admin notes to any workspace record.
  - Change Status: pause or archive a workspace.

13.3 Invite Users
  - Use the invite function to add new users by email address.
  - Assign role: "user" (standard access) or "admin" (full access including this admin panel).
  - Invited users receive an email with a sign-in link.

13.4 Admin Backup (Automated)
  - The adminBackup function runs on a schedule to generate platform-wide data snapshots.
  - Backup records are stored in the Workspace entity's last_backup_date field.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
14. HELP PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Location: "Help" at the bottom of the left sidebar → /help

PURPOSE:
Interactive in-app documentation with step-by-step guides for every module.

FEATURES:
  - Collapsible section cards — click any to expand its step-by-step guide.
  - Workflow progress bar shows the 5 primary steps in sequence.
  - "Open Full User Guide" link → opens this Google Doc in a new tab.
  - The linked Google Doc (this document) is the exhaustive reference you're reading now.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
15. AUTOMATED BACKGROUND FUNCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These functions run automatically. Users do not trigger them — they happen in the background.

15.1 autoTagGrants
  - Trigger: when a new Grant record is created.
  - What it does: analyzes the grant's description and auto-assigns outcome areas, populations served, funding type, and geographic tags.
  - Why it matters: ensures accurate match scoring by keeping grant metadata complete.

15.2 deadlineAlerts
  - Trigger: daily at 9am.
  - What it does: scans all open applications for upcoming deadlines. Sends email alerts for grants due in 7 days, 3 days, and tomorrow.
  - Who receives alerts: the user assigned to each application, and all admins.

15.3 dailyDigest
  - Trigger: daily at 8am.
  - What it does: generates a morning briefing email summarizing: new grants found, pending reviews, upcoming deadlines, and recommended next actions.
  - Who receives it: all active users.

15.4 onApplicationChange
  - Trigger: when a GrantApplication record is updated.
  - What it does: detects stage changes and creates HIL checkpoints when required stages are reached (e.g., hil_review stage). Notifies the relevant reviewer.

15.5 onWorkspaceSync / syncWorkspace
  - Trigger: when a Workspace record changes, or on a schedule.
  - What it does: syncs workspace metadata (grant count, application count, last activity) to the Workspace record for admin visibility.

15.6 adminBackup
  - Trigger: weekly (configurable by admin).
  - What it does: creates a full snapshot of all entity data for the workspace. Stores timestamp in last_backup_date.

15.7 fetchGrantForms
  - Trigger: manual or scheduled.
  - What it does: fetches the official application form questions from a grant's source URL. Saves them to the Grant record's application_form_questions field.
  - Used by the CoPilot to align drafted sections with the actual form structure.

15.8 researchGrantDonors
  - Trigger: manual (user clicks "Investigate people behind this grant").
  - What it does: uses AI with web search to identify board members, trustees, and principals of a foundation. Extracts cause affinities, confidence scores, and outreach opportunities. Saves results to a ResearchRun record.

15.9 exportResearchRunToDoc
  - Trigger: manual (user clicks "Export to Doc").
  - What it does: formats the ResearchRun data into a structured Google Doc using the Google Docs API. Returns a doc URL.

15.10 scheduleFollowUpMeeting
  - Trigger: manual (user submits the scheduling modal).
  - What it does: creates a Google Calendar event for a donor follow-up meeting using the user's connected Google Calendar account. Returns the created event details.

15.11 generateAppGuideDoc (this function)
  - Trigger: automated on a weekly schedule, or run manually by an admin.
  - What it does: generates (or updates) this Google Doc with the complete platform user guide. Stores the doc URL in the AppGuide entity for display on the Help page.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
16. AI AGENTS & HUMAN-IN-THE-LOOP (HIL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

16.1 AI Agents Overview
  - The platform uses multiple specialized AI agents working in concert.
  - Grant Advisor: strategy, prioritization, writing advice.
  - HIL Reviewer: compliance review, go/no-go decisions, quality gates.
  - Grant Recommender: opportunity discovery and personalized suggestions.
  - Master Orchestrator: coordinates multi-step workflows across agents.

16.2 Human-in-the-Loop (HIL) System
  - The HIL system ensures humans remain in control of critical decisions.
  - Three tiers of checkpoints:
    - Tier 1 (Blocking): Human must explicitly approve before the workflow proceeds. No timeout.
    - Tier 2 (48-Hour): If no human action in 48 hours, the checkpoint is auto-escalated to an admin.
    - Tier 3 (Auto-Approve): Low-stakes decisions that auto-approve after a review window.
  - HIL checkpoints appear as alerts on the Home dashboard.
  - Go to the HIL checkpoint directly from the alert banner.
  - Decision options: Approve, Edit & Approve, Regenerate, Flag, Pause, Block.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
17. DATA ENTITIES REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These are the core data structures. Understanding them helps you navigate exports, backups, and API integrations.

Grant: A funding opportunity. Fields: title, funder, deadline, award amounts, description, focus areas, eligibility, category, funding type, outcome areas, populations served, geographies.

GrantMatch: AI scoring result for one Grant. Fields: total_score, mandate_alignment, eligibility_fit, deadline_feasibility, geographic_match, recommendation (GO/PREP/DEF/DECLINE), rationale, strengths, concerns, human_feedback, status.

GrantApplication: An active application for one Grant. Fields: grant_id, stage, sections (all 7 proposal sections), proposal_text, budget, compliance_score, assigned_to, notes, award_amount.

ResearchRun: Results of a donor intelligence research pass. Fields: grant_id, status, linked_individuals (array), cause_signals (array), evidence_trail (array), confidence_score, raw_output.

OrgProfile: Your organization's profile. Fields: org_name, mission, focus_areas, geographic_coverage, annual_budget, staff_count, EIN, UEI, indirect_cost_rate, fringe_rate, past_performance, capacity_notes.

StaffMember: Individual staff capacity records. Fields: full_name, title, department, employment_type, FTE, education, years_experience, core_competencies, certifications, focus_areas, languages, bio, grant_roles, is_key_personnel.

MasterNarrative: Reusable content blocks for proposals. Fields: section, content, version, is_current, classification (AUTO_FILL/ADAPT/CUSTOM_WRITE/MISSING_INFO), approved.

HILCheckpoint: Human review gates. Fields: application_id, stage, tier (1/2/3), action_required, context, decision, expires_at.

GrantOutcome: Final results for submitted applications. Fields: outcome (awarded/declined/withdrawn), award_amount, requested_amount, submission_date, decision_date, lessons_learned, prep_hours, ROI.

Track: Saved filter sets for discovery. Fields: name, outcome_area_filters, population_filters, geography_filters, funding_type_filters.

Workspace: Workspace metadata. Fields: owner_id, org_name, status, grant_count, application_count, last_backup_date.

AppGuide: Stores this guide's Google Doc URL for display on the Help page.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
18. TIPS & BEST PRACTICES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

18.1 Complete Your Org Profile First
  - Fill in your mission statement, focus areas, EIN/UEI, and geographic coverage before running any searches or scoring.
  - Everything the AI does is calibrated against your profile — incomplete profiles produce generic results.

18.2 Upload Past Proposals Early
  - In Step 1 of Write with AI, upload every past proposal or report you have.
  - The richer your Master Narrative library, the better every future draft will be.

18.3 Score Before You Pursue
  - Always run AI scoring before committing to a grant.
  - A GO score ≥80 is a strong signal; a DECLINE score <40 means it's rarely worth the effort.

18.4 Use Tracks for Repeatable Searches
  - If you search for similar grants every month, create a Track for it.
  - Run the same Track search monthly to catch new postings without re-entering filters.

18.5 Leverage Donor Intelligence for Foundations
  - For any family or private foundation grant, always run Donor Intelligence before writing.
  - Knowing the principals' cause affinities lets you frame your proposal in their language.

18.6 Export to Google Doc Before Meetings
  - After a donor research run, export to Google Doc and share it with your team before any stakeholder meeting.
  - Use the schedule meeting feature to put donor introductions on the calendar immediately.

18.7 Monitor the HIL Queue
  - Check the Home dashboard daily for pending HIL reviews.
  - Tier 1 reviews block the AI workflow — they must be resolved for the application to proceed.

18.8 Tag Key Personnel
  - In the Org Profile → Staff section, mark your most credentialed staff as "Key Personnel".
  - The AI will feature them by name in proposal staffing sections.

18.9 Log Outcomes
  - After every submission, log the outcome in My Applications — even declined ones.
  - ROI tracking and pattern analysis require outcome data.

18.10 Back Up Regularly
  - Click "Create Backup" in My Workspace at least monthly.
  - Store the file in a shared team drive for redundancy.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
END OF DOCUMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JPGE Capital Intelligence Engine · This document is auto-generated and updated automatically.
`;

function insertText(index, text) {
  return { insertText: { location: { index }, text } };
}

function styleHeading(startIndex, endIndex, headingStyle) {
  return {
    updateParagraphStyle: {
      range: { startIndex, endIndex },
      paragraphStyle: { namedStyleType: headingStyle },
      fields: "namedStyleType"
    }
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Check if there's an existing guide doc to update
    const existing = await base44.asServiceRole.entities.AppGuide.list();

    // Get Google Docs access token
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('googledocs');
      accessToken = conn.accessToken;
    } catch (e) {
      return Response.json({ error: 'Google Docs connector not connected. Please connect it in the app settings.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const docTitle = `JPGE CIE — Complete User Guide & Function Reference (Auto-Updated ${now.slice(0, 10)})`;

    let docId;
    let docUrl;

    if (existing.length > 0 && existing[0].doc_id) {
      // Update existing doc — clear and rewrite
      docId = existing[0].doc_id;
      docUrl = existing[0].doc_url;

      // Get current doc length to clear it
      const docRes = await fetch(`https://docs.googleapis.com/v1/documents/${docId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const docData = await docRes.json();
      const bodyLength = docData.body?.content?.reduce((acc, el) => {
        if (el.endIndex) return Math.max(acc, el.endIndex);
        return acc;
      }, 1) || 1;

      const clearRequests = [];
      if (bodyLength > 2) {
        clearRequests.push({
          deleteContentRange: { range: { startIndex: 1, endIndex: bodyLength - 1 } }
        });
      }
      clearRequests.push(insertText(1, GUIDE_CONTENT));

      await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: clearRequests })
      });

      // Update stored record
      await base44.asServiceRole.entities.AppGuide.update(existing[0].id, {
        generated_at: now,
        version: now.slice(0, 10)
      });

    } else {
      // Create new doc
      const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: docTitle })
      });
      const created = await createRes.json();
      docId = created.documentId;
      docUrl = `https://docs.google.com/document/d/${docId}/edit`;

      // Insert content
      await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [insertText(1, GUIDE_CONTENT)] })
      });

      // Save to entity
      if (existing.length > 0) {
        await base44.asServiceRole.entities.AppGuide.update(existing[0].id, {
          doc_id: docId,
          doc_url: docUrl,
          generated_at: now,
          version: now.slice(0, 10)
        });
      } else {
        await base44.asServiceRole.entities.AppGuide.create({
          doc_id: docId,
          doc_url: docUrl,
          generated_at: now,
          version: now.slice(0, 10)
        });
      }
    }

    return Response.json({ success: true, doc_url: docUrl, doc_id: docId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});