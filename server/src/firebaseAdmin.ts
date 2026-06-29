import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getPrivateKey(): string {
  return readRequiredEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');
}

function ensureFirebaseAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  return initializeApp({
    credential: cert({
      projectId: readRequiredEnv('FIREBASE_PROJECT_ID'),
      clientEmail: readRequiredEnv('FIREBASE_CLIENT_EMAIL'),
      privateKey: getPrivateKey(),
    }),
  });
}

export function getFirebaseAdminAuth() {
  const app = ensureFirebaseAdminApp();
  return getAuth(app);
}

export function getFirebaseAdminDb() {
  const app = ensureFirebaseAdminApp();
  return getFirestore(app);
}
