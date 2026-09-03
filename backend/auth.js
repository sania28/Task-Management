const crypto = require('crypto');

const TOKEN_SECRET = process.env.TOKEN_SECRET || 'dev-secret-change-this-in-production';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// ---- Password hashing (scrypt, built into Node — no bcrypt dependency needed) ----

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(check, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// ---- Signed tokens (HMAC-SHA256, same shape/idea as a JWT, no jsonwebtoken dependency needed) ----

function base64url(input) {
  return Buffer.from(input).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(input) {
  input = input.replace(/-/g, '+').replace(/_/g, '/');
  while (input.length % 4) input += '=';
  return Buffer.from(input, 'base64').toString('utf8');
}

function issueToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = { ...payload, exp: Date.now() + TOKEN_TTL_MS };
  const headerPart = base64url(JSON.stringify(header));
  const bodyPart = base64url(JSON.stringify(body));
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${headerPart}.${bodyPart}`)
    .digest('hex');
  return `${headerPart}.${bodyPart}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerPart, bodyPart, signature] = parts;
  const expected = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${headerPart}.${bodyPart}`)
    .digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const payload = JSON.parse(base64urlDecode(bodyPart));
  if (payload.exp && Date.now() > payload.exp) return null;
  return payload;
}

module.exports = { hashPassword, verifyPassword, issueToken, verifyToken };
