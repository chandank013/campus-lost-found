import crypto from 'crypto';

/**
 * Hash a private question answer: trims, lowercases, and creates SHA-256 hex digest.
 */
export function hashAnswer(answer) {
  if (!answer || typeof answer !== 'string') return null;
  const normalized = answer.trim().toLowerCase();
  if (!normalized) return null;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Verify provided answer against stored hash using constant-time comparison.
 */
export function verifyAnswer(providedAnswer, storedHash) {
  if (!providedAnswer || !storedHash || typeof providedAnswer !== 'string') return false;
  const normalized = providedAnswer.trim().toLowerCase();
  const providedHash = crypto.createHash('sha256').update(normalized).digest('hex');
  if (providedHash.length !== storedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(storedHash));
}

/**
 * Generate a user-friendly one-time manage code, e.g. "RET-7F2A"
 */
export function generateManageCode() {
  const bytes = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `RET-${bytes}`;
}

/**
 * Hash a manage code: trims, uppercases, and creates SHA-256 hex digest.
 */
export function hashCode(code) {
  if (!code || typeof code !== 'string') return null;
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Verify provided manage code against stored hash using constant-time comparison.
 */
export function verifyCode(providedCode, storedHash) {
  if (!providedCode || !storedHash || typeof providedCode !== 'string') return false;
  const normalized = providedCode.trim().toUpperCase();
  const providedHash = crypto.createHash('sha256').update(normalized).digest('hex');
  if (providedHash.length !== storedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(storedHash));
}
