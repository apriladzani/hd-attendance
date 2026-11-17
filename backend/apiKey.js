import crypto from 'crypto';

// API keys are read from API_KEYS (comma-separated) so keys can be rotated
// without downtime: add the new key, roll clients over, then remove the old one.
function loadApiKeys() {
  return String(process.env.API_KEYS || process.env.API_KEY || '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);
}

function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Paths under /api that stay public (no X-API-Key required).
const PUBLIC_PATHS = new Set(['/health']);

export function requireApiKey(req, res, next) {
  if (req.method === 'OPTIONS' || PUBLIC_PATHS.has(req.path)) return next();

  const keys = loadApiKeys();
  if (!keys.length) {
    // Fail closed: never expose the API when no key has been configured.
    return res.status(503).json({ error: 'API key belum dikonfigurasi di server (API_KEYS).' });
  }

  const provided = String(req.get('x-api-key') || '').trim();
  if (!provided) {
    return res.status(401).json({ error: 'Header X-API-Key diperlukan.' });
  }
  if (!keys.some((key) => safeEqual(provided, key))) {
    return res.status(401).json({ error: 'API key tidak valid.' });
  }
  next();
}

export function hasApiKeysConfigured() {
  return loadApiKeys().length > 0;
}
