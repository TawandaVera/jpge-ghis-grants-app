# Source verification rules

## Direct URL rule

A valid grant record should point to the specific opportunity announcement, program page, NOFO, RFP, or funder application page. A generic funder homepage should be flagged as `needs_review`.

## Deadline rule

A normalized deadline must be traceable to source text. If deadline text is missing or ambiguous, mark the opportunity as `needs_review`.

## Eligibility rule

If applicant type affects scoring, eligibility text must be stored. For-profit or LLC eligibility should not be inferred from funder type alone.

## Amount rule

Award amount should preserve both raw text and normalized numeric fields when possible.

## Review rule

Final application packaging should not proceed until source evidence is verified or explicitly waived by an authorized reviewer.
