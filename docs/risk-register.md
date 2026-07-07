# Risk register

| Risk | Severity | Current mitigation | Next action |
|---|---:|---|---|
| Anonymous access to private grant data | High | Security docs added | Review Base44 auth and route policies |
| LLM prompt exposure of sensitive fields | High | LLM boundary docs added | Add redaction and workspace settings |
| LLM-generated grant data without evidence | High | Evidence model added | Persist source evidence fields |
| Hard-coded assessment date | High | Runtime date utility added | Wire into `Assessment.jsx` |
| PDF/DOCX read as text | Medium | Upload guard added | Wire into `CoPilot.jsx` |
| Large PR #3 merge risk | Medium | PR converted to draft | Split or resolve blockers |
| Limited failure-path tests | Medium | Test strategy added | Add negative-path coverage |
