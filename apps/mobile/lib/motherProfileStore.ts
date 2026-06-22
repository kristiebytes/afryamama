import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  setDoc,
  where,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { firebaseDb } from './firebaseClient';

export type MotherStage = 'PRENATAL' | 'POSTNATAL';
export type MultipleBirthType = 'SINGLE' | 'TWINS' | 'TRIPLETS';

export interface ChildProfile {
  childCode: string;
  fullName: string;
  sex: string;
  birthDate: string;
  birthWeightKg: string;
  multipleBirthType: MultipleBirthType;
  order: number;
}

export interface MotherProfile {
  email: string;
  motherCode: string;
  fullName: string;
  phone: string;
  stage: MotherStage;
  pregnancyWeek: string;
  babyAgeMonths: string;
  county: string;
  facility: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  children: ChildProfile[];
  createdAt: string;
}

const MEMORY_STORE = new Map<string, MotherProfile>();

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readText(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  return fallback;
}

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function readChildren(value: unknown): ChildProfile[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry, index) => {
      const item = entry as Record<string, unknown>;
      const order = Number.isFinite(Number(item.order)) ? Number(item.order) : index + 1;
      const multipleBirthType = readText(item.multipleBirthType, order === 1 ? 'SINGLE' : 'TWINS').toUpperCase();

      return {
        childCode: normalizeCode(readText(item.childCode || item.code, '')),
        fullName: readText(item.fullName || item.name || item.childName, ''),
        sex: readText(item.sex || item.gender, ''),
        birthDate: readText(item.birthDate || item.dob || item.dateOfBirth, ''),
        birthWeightKg: readText(item.birthWeightKg || item.birthWeight || item.weightAtBirth, ''),
        multipleBirthType:
          multipleBirthType === 'TRIPLETS' ? 'TRIPLETS' : multipleBirthType === 'TWINS' ? 'TWINS' : 'SINGLE',
        order,
      } as ChildProfile;
    })
    .filter((item) => item.fullName || item.childCode);
}

function parseCodeNumber(code: string): number {
  const match = normalizeCode(code).match(/^(?:M|CH)(\d+)$/);
  if (!match) return 0;
  return Number.parseInt(match[1], 10) || 0;
}

function formatMotherCode(sequence: number): string {
  return `M${String(sequence).padStart(3, '0')}`;
}

function formatChildCode(motherCode: string, order: number): string {
  const motherNumber = normalizeCode(motherCode).replace(/^M/, '');
  return order <= 1 ? `CH${motherNumber}` : `CH${motherNumber}-${order}`;
}

async function getNextMotherSequence(): Promise<number> {
  try {
    const snapshots = await Promise.all([
      getDocs(collection(firebaseDb, 'mothers')),
      getDocs(collection(firebaseDb, 'Mothers')),
    ]);

    const allDocs = snapshots.flatMap((snapshot) => snapshot.docs);
    const maxSequence = allDocs.reduce((maxValue, docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      const code = readText(data.motherCode || data.code || data.mother_code, '');
      const parsed = parseCodeNumber(code);
      return parsed > maxValue ? parsed : maxValue;
    }, 0);

    return maxSequence + 1;
  } catch {
    return Math.floor(Date.now() / 1000);
  }
}

async function generateMotherCode(): Promise<string> {
  const nextSequence = await getNextMotherSequence();
  return formatMotherCode(nextSequence);
}

async function findMotherDocByEmail(email: string): Promise<QueryDocumentSnapshot | null> {
  const collectionNames = ['mothers', 'Mothers'];
  const emailFields = ['email', 'Email', 'userEmail', 'user_email', 'motherEmail', 'mother_email'];

  for (const name of collectionNames) {
    for (const field of emailFields) {
      try {
        const snapshot = await getDocs(query(collection(firebaseDb, name), where(field, '==', email), limit(1)));
        if (!snapshot.empty) {
          return snapshot.docs[0];
        }
      } catch {
        // Continue checking alternative field names/collections.
      }
    }
  }

  return null;
}

export async function getMotherProfileByEmail(email: string): Promise<MotherProfile | null> {
  const key = normalizeEmail(email);

  if (MEMORY_STORE.has(key)) {
    return MEMORY_STORE.get(key) || null;
  }

  try {
    const docSnapshot = await findMotherDocByEmail(key);
    if (!docSnapshot) return null;

    const data = docSnapshot.data() as Record<string, unknown>;
    const profile: MotherProfile = {
      email: readText(data.email || data.Email || data.userEmail || data.user_email, key).toLowerCase(),
      motherCode: normalizeCode(readText(data.motherCode || data.code || data.mother_code, '')),
      fullName: readText(data.fullName || data.full_name || data.name, 'Mother'),
      phone: readText(data.phone || data.phoneNumber, ''),
      stage: readText(data.stage || data.motherStage, 'PRENATAL').toUpperCase() === 'POSTNATAL' ? 'POSTNATAL' : 'PRENATAL',
      pregnancyWeek: readText(data.pregnancyWeek || data.week || data.currentWeek, ''),
      babyAgeMonths: readText(data.babyAgeMonths || data.baby_months || data.infantAgeMonths, ''),
      county: readText(data.county, ''),
      facility: readText(data.facility || data.preferredFacility, ''),
      emergencyContactName: readText(data.emergencyContactName || data.emergency_name, ''),
      emergencyContactPhone: readText(data.emergencyContactPhone || data.emergency_phone, ''),
      children: readChildren(data.children || data.childProfiles),
      createdAt: readText(data.createdAt, ''),
    };

    MEMORY_STORE.set(key, profile);
    return profile;
  } catch {
    return null;
  }
}

export async function getMotherProfileByCode(motherCode: string): Promise<MotherProfile | null> {
  const code = normalizeCode(motherCode);
  if (!code) return null;

  const collectionNames = ['mothers', 'Mothers'];
  const codeFields = ['motherCode', 'mother_code', 'code'];

  for (const name of collectionNames) {
    for (const field of codeFields) {
      try {
        const snapshot = await getDocs(query(collection(firebaseDb, name), where(field, '==', code), limit(1)));
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data() as Record<string, unknown>;
          return {
            email: readText(data.email || data.Email || data.userEmail || data.user_email, '').toLowerCase(),
            motherCode: code,
            fullName: readText(data.fullName || data.full_name || data.name, 'Mother'),
            phone: readText(data.phone || data.phoneNumber, ''),
            stage: readText(data.stage || data.motherStage, 'PRENATAL').toUpperCase() === 'POSTNATAL' ? 'POSTNATAL' : 'PRENATAL',
            pregnancyWeek: readText(data.pregnancyWeek || data.week || data.currentWeek, ''),
            babyAgeMonths: readText(data.babyAgeMonths || data.baby_months || data.infantAgeMonths, ''),
            county: readText(data.county, ''),
            facility: readText(data.facility || data.preferredFacility, ''),
            emergencyContactName: readText(data.emergencyContactName || data.emergency_name, ''),
            emergencyContactPhone: readText(data.emergencyContactPhone || data.emergency_phone, ''),
            children: readChildren(data.children || data.childProfiles),
            createdAt: readText(data.createdAt, ''),
          };
        }
      } catch {
        // Continue checking alternatives.
      }
    }
  }

  return null;
}

export async function saveMotherProfile(profile: MotherProfile): Promise<MotherProfile> {
  const key = normalizeEmail(profile.email);
  const motherCode = normalizeCode(profile.motherCode) || (await generateMotherCode());
  const normalizedChildren = (profile.children || [])
    .map((child, index) => {
      const order = Number.isFinite(Number(child.order)) ? Number(child.order) : index + 1;
      return {
        childCode: normalizeCode(child.childCode) || formatChildCode(motherCode, order),
        fullName: child.fullName.trim(),
        sex: child.sex.trim(),
        birthDate: child.birthDate.trim(),
        birthWeightKg: child.birthWeightKg.trim(),
        multipleBirthType: child.multipleBirthType,
        order,
      } as ChildProfile;
    })
    .filter((child) => child.fullName);

  const payload = {
    ...profile,
    email: key,
    motherCode,
    children: normalizedChildren,
    updatedAt: new Date().toISOString(),
  };

  try {
    const docId = key.replace(/[^a-z0-9]/gi, '_');
    await setDoc(doc(firebaseDb, 'mothers', docId), payload, { merge: true });

    await Promise.all(
      normalizedChildren.map((child) => {
        const childDocId = child.childCode.toLowerCase().replace(/[^a-z0-9]/gi, '_');
        return setDoc(
          doc(firebaseDb, 'children', childDocId),
          {
            ...child,
            motherCode,
            motherEmail: key,
            motherName: profile.fullName,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      })
    );
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Failed to save profile in database: ${error.message}`
        : 'Failed to save profile in database.'
    );
  }

  MEMORY_STORE.set(key, payload);
  return payload;
}

export async function deleteMotherAccountByEmail(email: string): Promise<void> {
  const key = normalizeEmail(email);
  if (!key) return;

  const motherCode = MEMORY_STORE.get(key)?.motherCode || (await getMotherProfileByEmail(key))?.motherCode || '';

  const motherDocId = key.replace(/[^a-z0-9]/gi, '_');
  const docsToDelete = new Set<string>();
  docsToDelete.add(motherDocId);

  const collectionNames = ['mothers', 'Mothers'];
  const emailFields = ['email', 'Email', 'userEmail', 'user_email', 'motherEmail', 'mother_email'];

  try {
    for (const collectionName of collectionNames) {
      for (const emailField of emailFields) {
        const snapshot = await getDocs(
          query(collection(firebaseDb, collectionName), where(emailField, '==', key), limit(20))
        );
        snapshot.docs.forEach((item) => docsToDelete.add(item.id));
      }
    }

    await Promise.all(
      Array.from(docsToDelete).map((id) => deleteDoc(doc(firebaseDb, 'mothers', id)))
    );

    const childDocsToDelete = new Set<string>();
    const childEmailFields = ['motherEmail', 'mother_email', 'email'];

    for (const childEmailField of childEmailFields) {
      const childByEmail = await getDocs(
        query(collection(firebaseDb, 'children'), where(childEmailField, '==', key), limit(50))
      );
      childByEmail.docs.forEach((item) => childDocsToDelete.add(item.id));
    }

    if (motherCode) {
      const childCodeFields = ['motherCode', 'mother_code'];
      for (const childCodeField of childCodeFields) {
        const childByCode = await getDocs(
          query(collection(firebaseDb, 'children'), where(childCodeField, '==', motherCode), limit(50))
        );
        childByCode.docs.forEach((item) => childDocsToDelete.add(item.id));
      }
    }

    await Promise.all(
      Array.from(childDocsToDelete).map((id) => deleteDoc(doc(firebaseDb, 'children', id)))
    );

    MEMORY_STORE.delete(key);
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Failed to delete account in database: ${error.message}`
        : 'Failed to delete account in database.'
    );
  }
}
