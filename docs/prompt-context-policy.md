# Prompt context policy

## Objective

Control which workspace fields can be included in LLM prompts for discovery, assessment, narrative parsing, and proposal drafting.

## Recommended default policy

```js
export const DEFAULT_PROMPT_CONTEXT_POLICY = {
  includePublicOrgProfile: true,
  includeMission: true,
  includeFocusAreas: true,
  includeGeography: true,
  includeEin: false,
  includeUei: false,
  includeBudget: false,
  includeStaffNames: false,
  includeStaffBios: false,
  includePriorProposalText: false,
  includeReviewerNotes: false,
};
```

## Required audit categories

Every LLM action should be able to state which data categories were included:

- Public organization profile.
- Staff capacity.
- Financial data.
- Prior proposal text.
- Reviewer notes.
- Source evidence.
- Grant opportunity data.

## Review gate

Before enabling production drafting, the workspace owner should approve the policy.
