# Engineering Decision Record 001

## Decision

Add runtime-date and upload-validation utilities before directly changing page-level workflow code.

## Context

The assessment workflow contains date-sensitive scoring. The Co-Pilot upload workflow can imply support for binary document formats that are not safely parsed by `FileReader.readAsText`.

## Decision drivers

- Avoid hard-coded dates.
- Avoid silent binary document misreads.
- Keep utilities independently testable.
- Keep the first hardening branch low conflict.

## Consequences

- Utilities and tests are available now.
- Page wiring remains a follow-up task.
- Documentation clearly identifies the remaining integration work.
