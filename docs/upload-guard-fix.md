# Upload guard fix

## Problem

The Co-Pilot upload UI can imply support for PDF and DOCX, but plain `FileReader.readAsText` is appropriate only for text files. Reading binary documents as text can send unreadable content into narrative parsing.

## Utility added

`src/lib/fileUploadGuard.js`

Provides:

- `getFileExtension(fileName)`
- `isPlainTextUpload(file)`
- `validateNarrativeUpload(file)`

## Behavior

- Allows `.txt`, `.md`, `.markdown`, `.csv`, and `text/*` files.
- Blocks `.pdf`, `.doc`, and `.docx` with a clear message.
- Blocks unknown non-text file types.

## Required page integration

See `docs/page-wiring-patches.md` for exact replacement code.
