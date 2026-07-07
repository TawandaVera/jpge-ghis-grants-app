const TEXT_EXTENSIONS = new Set(['txt', 'md', 'markdown', 'csv']);
const BLOCKED_EXTENSIONS = new Set(['pdf', 'docx', 'doc']);

export const getFileExtension = (fileName = '') => {
  const parts = String(fileName).toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
};

export const isPlainTextUpload = (file) => {
  if (!file) return false;

  const extension = getFileExtension(file.name);
  if (TEXT_EXTENSIONS.has(extension)) return true;

  return typeof file.type === 'string' && file.type.startsWith('text/');
};

export const validateNarrativeUpload = (file) => {
  if (!file) {
    return {
      ok: false,
      reason: 'missing_file',
      message: 'Select a narrative file before uploading.',
    };
  }

  const extension = getFileExtension(file.name);

  if (BLOCKED_EXTENSIONS.has(extension)) {
    return {
      ok: false,
      reason: 'unsupported_binary_document',
      message: 'PDF and DOCX uploads need document text extraction before parsing. Please paste the text or upload a .txt file for now.',
    };
  }

  if (!isPlainTextUpload(file)) {
    return {
      ok: false,
      reason: 'unsupported_file_type',
      message: 'Only plain-text narrative uploads are currently supported. Please upload .txt or paste the text.',
    };
  }

  return {
    ok: true,
    reason: 'plain_text_supported',
    message: 'Plain text upload is supported.',
  };
};
