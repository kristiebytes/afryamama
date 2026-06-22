import {
  collection,
  getDocs,
  limit,
  query,
  where,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { firebaseDb } from './firebaseClient';

export interface MotherAppointment {
  id: string;
  date: string;
  time: string;
  doctor: string;
  reason: string;
  status: 'PENDING' | 'COMPLETED';
}

export interface MotherRecord {
  id: string;
  date: string;
  weight: string;
  bp: string;
  hr: string;
  notes: string;
}

export interface MotherImmunizationProfile {
  childName: string;
  childBirth: string;
}

export interface MotherVaccine {
  id: string;
  name: string;
  scheduled: string;
  administered?: string;
  status: 'PENDING' | 'COMPLETED';
}

export interface MotherTip {
  id: string;
  title: string;
  category: string;
  content: string;
  bg: string;
  border: string;
  tagColor: string;
}

export interface MotherScheduleItem {
  id: string;
  day: string;
  slot: string;
  task: string;
}

export interface MotherMilestone {
  id: string;
  title: string;
  status: string;
}

export interface MotherNotification {
  id: string;
  title: string;
  body: string;
}

export interface MotherGrowthRow {
  id: string;
  month: string;
  weight: string;
  height: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readText(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  return fallback;
}

function readDate(value: unknown, fallback = 'Not set'): string {
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleDateString();
    return value;
  }

  if (value && typeof value === 'object' && 'toDate' in (value as Record<string, unknown>)) {
    try {
      return (value as { toDate: () => Date }).toDate().toLocaleDateString();
    } catch {
      return fallback;
    }
  }

  return fallback;
}

async function findByEmail(
  collectionNames: string[],
  email: string,
  fields: string[] = ['email', 'Email', 'userEmail', 'user_email', 'motherEmail', 'mother_email']
): Promise<QueryDocumentSnapshot | null> {
  for (const collectionName of collectionNames) {
    for (const field of fields) {
      try {
        const snapshot = await getDocs(
          query(collection(firebaseDb, collectionName), where(field, '==', email), limit(1))
        );
        if (!snapshot.empty) return snapshot.docs[0];
      } catch {
        // Continue checking alternatives.
      }
    }
  }

  return null;
}

export async function getMotherAppointments(email: string): Promise<MotherAppointment[]> {
  const key = normalizeEmail(email);
  const collectionNames = ['appointments', 'Appointments'];
  const emailFields = ['motherEmail', 'email', 'userEmail', 'patientEmail'];

  for (const name of collectionNames) {
    for (const field of emailFields) {
      try {
        const snapshot = await getDocs(query(collection(firebaseDb, name), where(field, '==', key)));
        if (snapshot.empty) continue;

        return snapshot.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            date: readDate(data.date || data.appointmentDate || data.scheduledAt),
            time: readText(data.time || data.appointmentTime || data.slot, 'Time not set'),
            doctor: readText(data.doctorName || data.provider || data.doctor, 'Clinician not assigned'),
            reason: readText(data.reason || data.purpose || data.type, 'General consultation'),
            status: readText(data.status, 'PENDING').toUpperCase() === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
          };
        });
      } catch {
        // Continue checking alternatives.
      }
    }
  }

  return [];
}

export async function getMotherRecords(email: string): Promise<MotherRecord[]> {
  const key = normalizeEmail(email);
  const collectionNames = ['anc_records', 'ancRecords', 'records'];
  const emailFields = ['motherEmail', 'email', 'userEmail', 'patientEmail'];

  for (const name of collectionNames) {
    for (const field of emailFields) {
      try {
        const snapshot = await getDocs(query(collection(firebaseDb, name), where(field, '==', key)));
        if (snapshot.empty) continue;

        return snapshot.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            date: readDate(data.date || data.visitDate || data.createdAt),
            weight: readText(data.weight || data.weightKg || data.motherWeight, 'Not recorded'),
            bp: readText(data.bp || data.bloodPressure || data.blood_pressure, 'Not recorded'),
            hr: readText(data.hr || data.fetalHeartRate || data.heartRate, 'Not recorded'),
            notes: readText(data.notes || data.observations || data.remarks, 'No notes available.'),
          };
        });
      } catch {
        // Continue checking alternatives.
      }
    }
  }

  return [];
}

export async function getMotherImmunizationProfile(email: string): Promise<MotherImmunizationProfile | null> {
  const key = normalizeEmail(email);
  const motherDoc = await findByEmail(['mothers', 'Mothers'], key);
  const motherId = motherDoc?.id;

  const childCollections = ['children', 'Children'];
  for (const name of childCollections) {
    const conditions = motherId
      ? [
          query(collection(firebaseDb, name), where('motherId', '==', motherId), limit(1)),
          query(collection(firebaseDb, name), where('mother_id', '==', motherId), limit(1)),
        ]
      : [];

    for (const condition of conditions) {
      try {
        const snapshot = await getDocs(condition);
        if (snapshot.empty) continue;
        const data = snapshot.docs[0].data();
        return {
          childName: readText(data.name || data.childName || data.full_name, 'Child profile not set'),
          childBirth: readDate(data.dob || data.dateOfBirth || data.birthDate, 'Birth details not available'),
        };
      } catch {
        // Continue checking alternatives.
      }
    }
  }

  return null;
}

export async function getMotherVaccines(email: string): Promise<MotherVaccine[]> {
  const key = normalizeEmail(email);
  const motherDoc = await findByEmail(['mothers', 'Mothers'], key);
  const motherId = motherDoc?.id;
  const vaccineCollections = ['immunizations', 'vaccinations', 'vaccine_records'];

  for (const name of vaccineCollections) {
    const conditions = [
      query(collection(firebaseDb, name), where('motherEmail', '==', key)),
      query(collection(firebaseDb, name), where('email', '==', key)),
      ...(motherId
        ? [
            query(collection(firebaseDb, name), where('motherId', '==', motherId)),
            query(collection(firebaseDb, name), where('mother_id', '==', motherId)),
          ]
        : []),
    ];

    for (const condition of conditions) {
      try {
        const snapshot = await getDocs(condition);
        if (snapshot.empty) continue;

        return snapshot.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            name: readText(data.name || data.vaccineName || data.title, 'Vaccine'),
            scheduled: readDate(data.scheduledDate || data.scheduled_for || data.schedule, 'Not set'),
            administered: readDate(data.administeredDate || data.givenOn || data.completedAt, ''),
            status: readText(data.status, 'PENDING').toUpperCase() === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
          };
        });
      } catch {
        // Continue checking alternatives.
      }
    }
  }

  return [];
}

export async function getMotherTips(email: string): Promise<MotherTip[]> {
  const key = normalizeEmail(email);
  const collectionNames = ['wellness_tips', 'wellnessTips', 'notifications'];
  const tips: MotherTip[] = [];

  for (const name of collectionNames) {
    try {
      const snapshot = await getDocs(collection(firebaseDb, name));
      if (snapshot.empty) continue;

      for (const item of snapshot.docs) {
        const data = item.data();
        const audience = readText(data.audience || data.role || data.target || 'MOTHER').toUpperCase();
        const emailMatch = readText(data.email || data.userEmail || data.motherEmail).toLowerCase();
        const isForAllMothers = audience === 'MOTHER' || audience === 'ALL' || !audience;
        const isForUser = emailMatch ? emailMatch === key : true;
        if (!isForAllMothers || !isForUser) continue;

        tips.push({
          id: item.id,
          title: readText(data.title, 'Wellness Tip'),
          category: readText(data.category || data.type, 'MOTHER CARE').toUpperCase(),
          content: readText(data.message || data.content || data.body, 'No details provided.'),
          bg: '#eff6ff',
          border: '#bfdbfe',
          tagColor: '#2563eb',
        });
      }

      if (tips.length > 0) break;
    } catch {
      // Continue checking alternatives.
    }
  }

  return tips;
}

export async function getMotherSchedule(email: string): Promise<MotherScheduleItem[]> {
  const key = normalizeEmail(email);
  const collectionNames = ['schedules', 'mother_schedules', 'care_schedule'];
  const emailFields = ['motherEmail', 'email', 'userEmail', 'patientEmail'];

  for (const name of collectionNames) {
    for (const field of emailFields) {
      try {
        const snapshot = await getDocs(query(collection(firebaseDb, name), where(field, '==', key)));
        if (snapshot.empty) continue;

        return snapshot.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            day: readText(data.day || data.weekday || data.dateLabel, 'Day not set'),
            slot: readText(data.slot || data.time || data.window, 'Time not set'),
            task: readText(data.task || data.title || data.activity, 'Care activity'),
          };
        });
      } catch {
        // Continue checking alternatives.
      }
    }
  }

  return [];
}

export async function getMotherMilestones(email: string): Promise<MotherMilestone[]> {
  const key = normalizeEmail(email);
  const collectionNames = ['milestones', 'mother_milestones', 'pregnancy_milestones'];
  const emailFields = ['motherEmail', 'email', 'userEmail', 'patientEmail'];

  for (const name of collectionNames) {
    for (const field of emailFields) {
      try {
        const snapshot = await getDocs(query(collection(firebaseDb, name), where(field, '==', key)));
        if (snapshot.empty) continue;

        return snapshot.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            title: readText(data.title || data.name || data.milestone, 'Milestone'),
            status: readText(data.status || data.progress, 'PENDING'),
          };
        });
      } catch {
        // Continue checking alternatives.
      }
    }
  }

  return [];
}

export async function getMotherNotifications(email: string): Promise<MotherNotification[]> {
  const key = normalizeEmail(email);
  const collectionNames = ['notifications', 'Notifications', 'alerts'];
  const rows: MotherNotification[] = [];

  for (const name of collectionNames) {
    try {
      const snapshot = await getDocs(collection(firebaseDb, name));
      if (snapshot.empty) continue;

      for (const item of snapshot.docs) {
        const data = item.data();
        const audience = readText(data.audience || data.role || data.target || 'MOTHER').toUpperCase();
        const emailMatch = readText(data.email || data.userEmail || data.motherEmail).toLowerCase();
        const isForMother = audience === 'MOTHER' || audience === 'ALL' || !audience;
        const isForUser = emailMatch ? emailMatch === key : true;
        if (!isForMother || !isForUser) continue;

        rows.push({
          id: item.id,
          title: readText(data.title || data.subject, 'Notification'),
          body: readText(data.message || data.body || data.content, 'No details provided.'),
        });
      }

      if (rows.length > 0) break;
    } catch {
      // Continue checking alternatives.
    }
  }

  return rows;
}

export async function getMotherGrowthRows(email: string): Promise<MotherGrowthRow[]> {
  const key = normalizeEmail(email);
  const motherDoc = await findByEmail(['mothers', 'Mothers'], key);
  const motherId = motherDoc?.id;
  const collectionNames = ['growth_monitoring', 'growthMonitoring', 'child_growth'];

  for (const name of collectionNames) {
    const conditions = [
      query(collection(firebaseDb, name), where('motherEmail', '==', key)),
      query(collection(firebaseDb, name), where('email', '==', key)),
      ...(motherId
        ? [
            query(collection(firebaseDb, name), where('motherId', '==', motherId)),
            query(collection(firebaseDb, name), where('mother_id', '==', motherId)),
          ]
        : []),
    ];

    for (const condition of conditions) {
      try {
        const snapshot = await getDocs(condition);
        if (snapshot.empty) continue;

        return snapshot.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            month: readText(data.month || data.label || data.period, readDate(data.date || data.recordedAt, 'Entry')),
            weight: readText(data.weight || data.weightKg || data.childWeight, 'Not recorded'),
            height: readText(data.height || data.length || data.childHeight, 'Not recorded'),
          };
        });
      } catch {
        // Continue checking alternatives.
      }
    }
  }

  return [];
}
