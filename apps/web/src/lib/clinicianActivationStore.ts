import { randomBytes } from 'crypto';

type ActivationEntry = {
  email: string;
  token: string;
  expiresAt: number;
};

const entriesByToken = new Map<string, ActivationEntry>();
const lastSentByEmail = new Map<string, number>();

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function createClinicianActivationToken(): string {
  return randomBytes(24).toString('hex');
}

export function canSendNewActivationLink(email: string): boolean {
  const normalized = normalizeEmail(email);
  const lastSentAt = lastSentByEmail.get(normalized);
  if (!lastSentAt) return true;
  return Date.now() - lastSentAt >= 30_000;
}

export function saveClinicianActivationToken(email: string, token: string, ttlMs = 24 * 60 * 60 * 1000) {
  const normalized = normalizeEmail(email);

  // Keep one valid token per clinician email.
  for (const [existingToken, entry] of entriesByToken.entries()) {
    if (entry.email === normalized) {
      entriesByToken.delete(existingToken);
    }
  }

  entriesByToken.set(token, {
    email: normalized,
    token,
    expiresAt: Date.now() + ttlMs,
  });
  lastSentByEmail.set(normalized, Date.now());
}

export function consumeClinicianActivationToken(token: string): { ok: true; email: string } | { ok: false } {
  const normalizedToken = token.trim();
  const entry = entriesByToken.get(normalizedToken);
  if (!entry) return { ok: false };

  if (Date.now() > entry.expiresAt) {
    entriesByToken.delete(normalizedToken);
    return { ok: false };
  }

  entriesByToken.delete(normalizedToken);
  return { ok: true, email: entry.email };
}
