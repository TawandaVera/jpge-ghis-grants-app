# Field redaction policy

## Default stance

Sensitive fields should be excluded from LLM prompts unless an administrator explicitly permits their use for a workspace.

## Always review before inclusion

- EIN.
- UEI.
- Staff biographies.
- Staff education details.
- Budget line items.
- Prior proposal text.
- Client-specific funder strategy.
- Reviewer notes.

## Usually safe after review

- Organization mission.
- High-level focus areas.
- Public program descriptions.
- Public past performance summaries.
- Published grant opportunity information.

## Implementation recommendation

Create a prompt context builder that accepts a policy object:

```js
const policy = {
  includeEin: false,
  includeUei: false,
  includeStaffBio: false,
  includeBudget: false,
  includePriorProposalText: false,
};
```

The builder should produce redacted prompt context and an audit-friendly list of included data categories.
