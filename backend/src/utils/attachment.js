const ALLOWED_ATTACHMENT_PREFIXES = [
  'data:image/jpeg;base64,',
  'data:image/png;base64,',
  'data:image/webp;base64,',
  'data:image/gif;base64,',
  'data:application/pdf;base64,',
];

const MAX_ATTACHMENT_CHARS = 3 * 1024 * 1024;

function normalizeAttachment(name, data, options = {}) {
  const required = Boolean(options.required);
  const fallbackName = options.fallbackName || 'anexo';
  const attachmentName = String(name || '').trim().slice(0, 120);
  const attachmentData = String(data || '').trim();

  if (!attachmentData) {
    if (required) {
      const error = new Error('Anexo obrigatorio.');
      error.status = 400;
      throw error;
    }
    return { attachmentName: '', attachmentData: '' };
  }

  const hasAllowedPrefix = ALLOWED_ATTACHMENT_PREFIXES.some((prefix) => attachmentData.startsWith(prefix));
  if (!hasAllowedPrefix || attachmentData.length > MAX_ATTACHMENT_CHARS) {
    const error = new Error('Anexo invalido. Envie PNG, JPG, WEBP, GIF ou PDF de ate 2 MB.');
    error.status = 400;
    throw error;
  }

  return {
    attachmentName: attachmentName || fallbackName,
    attachmentData,
  };
}

module.exports = { normalizeAttachment };
