import jwt from 'jsonwebtoken';
import { getPlayerByCode } from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'medieval-conquest-secret-change-me';
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: JWT_SECRET not set — using insecure default. Set JWT_SECRET env var in production.');
}
export const ADMIN_KEY = process.env.ADMIN_KEY || 'admin-secret-change-me';

export function generatePlayerCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (getPlayerByCode(code));
  return code;
}

export function createToken(playerId) {
  return jwt.sign({ playerId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
