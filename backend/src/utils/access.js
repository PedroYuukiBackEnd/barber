function normalizeAccess(value) {
  return String(value || '').trim();
}

function normalizeAccessKey(value) {
  return normalizeAccess(value).toLowerCase();
}

module.exports = { normalizeAccess, normalizeAccessKey };
