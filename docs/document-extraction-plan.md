# Document extraction plan

## Current state

Co-Pilot narrative upload should only read plain text until reliable PDF and DOCX extraction is implemented.

## Required behavior

- `.txt`, `.md`, `.markdown`, and other plain text files may be read with `FileReader.readAsText`.
- `.pdf`, `.doc`, and `.docx` must be blocked or routed through a proper extractor.
- The UI copy must match the actual supported behavior.

## Implementation options

### Option A: server-side extraction

Use a trusted backend function to extract text from PDF and DOCX files, then return plain text to the client. This is preferred for production because it allows centralized size limits, malware scanning, logging, and parser upgrades.

### Option B: client-side extraction

Use vetted browser-compatible extraction libraries. This is faster to prototype but increases bundle size and may have inconsistent results across documents.

## Acceptance criteria

- Uploading PDF/DOCX cannot produce unreadable binary text in the narrative parser.
- User receives a clear message when a file type is unsupported.
- Extracted text is displayed for review before it is sent to an LLM.
- Large files are size-limited.
- Failed extraction does not create narrative records.
