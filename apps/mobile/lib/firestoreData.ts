import {
  collection,
  getDocs,
  limit,
  query,
  where,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { firebaseDb } from './firebaseClient';

export interface MobileAppointment {
  id: string;
  date: string;
  time: string;
  doctor: string;
  reason: string;
  status: string;
}

export interface MobileRecord {
  id: string;
  date: string;
  weight: string;
  bp: string;
  hr: string;
  notes: string;
}

export interface MobileVaccine {
  id: string;
  name: string;
  scheduled: string;
  administered: string | null;
  status: 'COMPLETED' | 'PENDING';
}

export interface MobileChildProfile {
  id: string;
  childCode: string;
  childName: string;
  childBirth: string;
  order: number;
}

export interface MobileTip {
  id: string;
  title: string;
  category: string;
  content: string;
}

export interface MobileMotherProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  motherCode: string;
}

export interface MobileMotherProfileDetails extends MobileMotherProfile {
  county: string;
  facility: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  stage: string;
  pregnancyWeek: string;
  babyAgeMonths: string;
  childrenCount: number;
}

export interface MobileMilestone {
  id: string;
  title: string;
  week: string;
  status: string;
  details: string;
}

export interface MobileNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: string;
  read: boolean;
}

export interface MobileGrowthPoint {
  id: string;
  childId: string;
  date: string;
  weight: string;
  height: string;
  headCircumference: string;
}

export interface MobileTimelineItem {
  id: string;
  date: string;
  title: string;
  detail: string;
  type: 'APPOINTMENT' | 'MILESTONE' | 'VACCINE' | 'NOTIFICATION';
  status: string;
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

function readBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
}

function toDateValue(input: string): Date | null {
  if (!input.trim()) return null;
  const parsed = new Date(input);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return null;
}

function uniqueById<T extends { id: string }>(rows: T[]): T[] {
  const map = new Map<string, T>();
  for (const row of rows) {
    map.set(row.id, row);
  }
  return Array.from(map.values());
}

async function findByEmail(
  collectionNames: string[],
  email: string,
  fields: string[] = ['email', 'Email', 'userEmail', 'user_email']
): Promise<QueryDocumentSnapshot | null> {
  for (const collectionName of collectionNames) {
    for (const field of fields) {
      const snapshot = await getDocs(
        query(collection(firebaseDb, collectionName), where(field, '==', email), limit(1))
      );
      if (!snapshot.empty) return snapshot.docs[0];
    }
  }
  return null;
}

export async function fetchAppointments(email: string): Promise<MobileAppointment[]> {
  const collectionNames = ['appointments', 'Appointments'];
  const emailFields = ['motherEmail', 'email', 'userEmail', 'patientEmail'];

  for (const name of collectionNames) {
    for (const field of emailFields) {
      const snapshot = await getDocs(query(collection(firebaseDb, name), where(field, '==', email)));
      if (snapshot.empty) continue;

      return snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          date: readDate(data.date || data.appointmentDate || data.scheduledAt),
          time: readText(data.time || data.appointmentTime || data.slot, 'Time not set'),
          doctor: readText(data.doctorName || data.provider || data.doctor, 'Clinician not assigned'),
          reason: readText(data.reason || data.purpose || data.type, 'General consultation'),
          status: readText(data.status, 'PENDING').toUpperCase(),
        };
      });
    }
  }

  return [];
}

export async function fetchRecords(email: string): Promise<MobileRecord[]> {
  const collectionNames = ['anc_records', 'ancRecords', 'records'];
  const emailFields = ['motherEmail', 'email', 'userEmail', 'patientEmail'];

  for (const name of collectionNames) {
    for (const field of emailFields) {
      const snapshot = await getDocs(query(collection(firebaseDb, name), where(field, '==', email)));
      if (snapshot.empty) continue;

      return snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          date: readDate(data.date || data.visitDate || data.createdAt),
          weight: readText(data.weight || data.weightKg || data.motherWeight, 'Not recorded'),
          bp: readText(data.bp || data.bloodPressure || data.blood_pressure, 'Not recorded'),
          hr: readText(data.hr || data.fetalHeartRate || data.heartRate, 'Not recorded'),
          notes: readText(data.notes || data.observations || data.remarks, 'No clinical notes yet.'),
        };
      });
    }
  }

  return [];
}

export async function fetchImmunizationData(
  email: string,
  childId?: string
): Promise<{ children: MobileChildProfile[]; selectedChildId: string | null; vaccines: MobileVaccine[] }> {
  const children = await fetchChildrenProfiles(email);
  const selectedChild =
    children.find((item) => item.id === childId) ||
    children[0] ||
    null;

  if (!selectedChild) {
    return { children, selectedChildId: null, vaccines: [] };
  }

  const vaccineCollections = ['immunizations', 'vaccinations', 'vaccine_records'];
  const vaccines: MobileVaccine[] = [];

  for (const name of vaccineCollections) {
    const conditions = [
      query(collection(firebaseDb, name), where('childId', '==', selectedChild.id)),
      query(collection(firebaseDb, name), where('child_id', '==', selectedChild.id)),
      query(collection(firebaseDb, name), where('childCode', '==', selectedChild.childCode)),
      query(collection(firebaseDb, name), where('child_code', '==', selectedChild.childCode)),
    ];

    for (const condition of conditions) {
      const snap = await getDocs(condition);
      if (snap.empty) continue;

      for (const item of snap.docs) {
        const data = item.data();
        const status = readText(data.status, 'PENDING').toUpperCase() === 'COMPLETED' ? 'COMPLETED' : 'PENDING';
        vaccines.push({
          id: item.id,
          name: readText(data.name || data.vaccineName || data.title, 'Vaccine'),
          scheduled: readDate(data.scheduledDate || data.scheduled_for || data.schedule, 'Schedule not set'),
          administered: readDate(data.administeredDate || data.givenOn || data.completedAt, '' ) || null,
          status,
        });
      }
    }

    if (vaccines.length > 0) break;
  }

  return { children, selectedChildId: selectedChild.id, vaccines: uniqueById(vaccines) };
}

export async function fetchWellnessTips(email: string): Promise<MobileTip[]> {
  const collectionNames = ['wellness_tips', 'wellnessTips', 'notifications'];
  const tips: MobileTip[] = [];

  for (const name of collectionNames) {
    const snapshot = await getDocs(collection(firebaseDb, name));
    if (snapshot.empty) continue;

    for (const item of snapshot.docs) {
      const data = item.data();
      const audience = readText(data.audience || data.role || data.target || 'MOTHER').toUpperCase();
      const emailMatch = readText(data.email || data.userEmail || '').toLowerCase();
      const isForAll = audience === 'ALL' || audience === 'MOTHER' || !audience;
      const isForCurrentUser = emailMatch ? emailMatch === email : true;

      if (!isForAll || !isForCurrentUser) continue;

      tips.push({
        id: item.id,
        title: readText(data.title, 'Wellness Tip'),
        category: readText(data.category || data.type || 'WELLNESS').toUpperCase(),
        content: readText(data.message || data.content || data.body, 'No details provided.'),
      });
    }

    if (tips.length > 0) break;
  }

  return tips;
}

export async function fetchMotherProfile(email: string): Promise<MobileMotherProfile | null> {
  const doc = await findByEmail(['mothers', 'Mothers'], email);
  if (!doc) return null;

  const data = doc.data();
  const firstName = readText(data.firstName || data.first_name);
  const lastName = readText(data.lastName || data.last_name);
  const combinedName = `${firstName} ${lastName}`.trim();
  const fullName = readText(data.fullName || data.full_name || data.name, combinedName || 'Mother');

  return {
    id: doc.id,
    fullName,
    email: readText(data.email || data.Email, email),
    phone: readText(data.phone || data.phoneNumber || data.tel, 'Not provided'),
    motherCode: readText(data.motherCode || data.mother_code || data.code, 'Not set'),
  };
}

export async function fetchMotherProfileDetails(email: string): Promise<MobileMotherProfileDetails | null> {
  const doc = await findByEmail(['mothers', 'Mothers'], email);
  if (!doc) return null;

  const data = doc.data();
  const firstName = readText(data.firstName || data.first_name);
  const lastName = readText(data.lastName || data.last_name);
  const combinedName = `${firstName} ${lastName}`.trim();
  const fullName = readText(data.fullName || data.full_name || data.name, combinedName || 'Mother');
  const children = readChildrenFromMotherDoc(data.children || data.childProfiles);

  return {
    id: doc.id,
    fullName,
    email: readText(data.email || data.Email, email),
    phone: readText(data.phone || data.phoneNumber || data.tel, 'Not provided'),
    motherCode: readText(data.motherCode || data.mother_code || data.code, 'Not set'),
    county: readText(data.county, ''),
    facility: readText(data.facility || data.preferredFacility, ''),
    emergencyContactName: readText(data.emergencyContactName || data.emergency_name, ''),
    emergencyContactPhone: readText(data.emergencyContactPhone || data.emergency_phone, ''),
    stage: readText(data.stage || data.motherStage, 'PRENATAL').toUpperCase(),
    pregnancyWeek: readText(data.pregnancyWeek || data.week || data.currentWeek, ''),
    babyAgeMonths: readText(data.babyAgeMonths || data.baby_months || data.infantAgeMonths, ''),
    childrenCount: children.length,
  };
}

function readChildrenFromMotherDoc(value: unknown): MobileChildProfile[] {
  if (!Array.isArray(value)) return [];

  return value.map((item, index) => {
    const data = item as Record<string, unknown>;
    return {
      id: readText(data.id || data.childId, `embedded-${index + 1}`),
      childCode: readText(data.childCode || data.code, `CH${index + 1}`),
      childName: readText(data.fullName || data.name || data.childName, `Child ${index + 1}`),
      childBirth: readDate(data.birthDate || data.dob || data.dateOfBirth, 'Birth date not set'),
      order: Number.isFinite(Number(data.order)) ? Number(data.order) : index + 1,
    } as MobileChildProfile;
  });
}

export async function fetchChildrenProfiles(email: string): Promise<MobileChildProfile[]> {
  const normalizedEmail = email.trim().toLowerCase();
  const motherDoc = await findByEmail(['mothers', 'Mothers'], normalizedEmail);
  const motherId = motherDoc?.id || '';
  const motherData = motherDoc?.data() || {};
  const motherCode = readText((motherData as Record<string, unknown>).motherCode || (motherData as Record<string, unknown>).mother_code || (motherData as Record<string, unknown>).code, '');

  const rows: MobileChildProfile[] = [];
  const childCollections = ['children', 'Children'];
  for (const name of childCollections) {
    const conditions = [
      query(collection(firebaseDb, name), where('motherEmail', '==', normalizedEmail)),
      query(collection(firebaseDb, name), where('mother_email', '==', normalizedEmail)),
      query(collection(firebaseDb, name), where('email', '==', normalizedEmail)),
      ...(motherId
        ? [
            query(collection(firebaseDb, name), where('motherId', '==', motherId)),
            query(collection(firebaseDb, name), where('mother_id', '==', motherId)),
          ]
        : []),
      ...(motherCode
        ? [
            query(collection(firebaseDb, name), where('motherCode', '==', motherCode)),
            query(collection(firebaseDb, name), where('mother_code', '==', motherCode)),
          ]
        : []),
    ];

    for (const condition of conditions) {
      const snapshot = await getDocs(condition);
      if (snapshot.empty) continue;

      for (const docRow of snapshot.docs) {
        const data = docRow.data();
        rows.push({
          id: docRow.id,
          childCode: readText(data.childCode || data.code, docRow.id),
          childName: readText(data.fullName || data.name || data.childName, 'Child profile'),
          childBirth: readDate(data.birthDate || data.dob || data.dateOfBirth, 'Birth date not set'),
          order: Number.isFinite(Number(data.order)) ? Number(data.order) : rows.length + 1,
        });
      }
    }

    if (rows.length > 0) break;
  }

  const uniqueRows = uniqueById(rows);
  if (uniqueRows.length > 0) {
    return uniqueRows.sort((a, b) => a.order - b.order);
  }

  const embeddedChildren = readChildrenFromMotherDoc((motherData as Record<string, unknown>).children || (motherData as Record<string, unknown>).childProfiles);
  return embeddedChildren.sort((a, b) => a.order - b.order);
}

export async function fetchMilestones(email: string): Promise<MobileMilestone[]> {
  const collectionNames = ['milestones', 'pregnancy_milestones', 'motherMilestones'];
  const emailFields = ['motherEmail', 'email', 'userEmail', 'patientEmail'];

  for (const name of collectionNames) {
    for (const field of emailFields) {
      const snapshot = await getDocs(query(collection(firebaseDb, name), where(field, '==', email)));
      if (snapshot.empty) continue;

      return snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          title: readText(data.title || data.name || data.milestone, 'Milestone'),
          week: readText(data.week || data.pregnancyWeek || data.trimester, 'Not set'),
          status: readText(data.status || data.progress, 'PENDING').toUpperCase(),
          details: readText(data.details || data.description || data.notes, 'No details provided.'),
        };
      });
    }
  }

  return [];
}

export async function fetchNotifications(email: string): Promise<MobileNotification[]> {
  const collectionNames = ['notifications', 'Notifications', 'alerts'];
  const notifications: MobileNotification[] = [];

  for (const name of collectionNames) {
    const snapshot = await getDocs(collection(firebaseDb, name));
    if (snapshot.empty) continue;

    for (const item of snapshot.docs) {
      const data = item.data();
      const audience = readText(data.audience || data.role || data.target || 'MOTHER').toUpperCase();
      const emailMatch = readText(data.email || data.userEmail || data.motherEmail).toLowerCase();
      const isForMother = audience === 'MOTHER' || audience === 'ALL' || !audience;
      const belongsToMother = emailMatch ? emailMatch === email : true;
      if (!isForMother || !belongsToMother) continue;

      notifications.push({
        id: item.id,
        title: readText(data.title || data.subject, 'Notification'),
        message: readText(data.message || data.body || data.content, 'No details provided.'),
        date: readDate(data.date || data.createdAt || data.timestamp),
        type: readText(data.type || data.category, 'GENERAL').toUpperCase(),
        read: readBoolean(data.read || data.isRead, false),
      });
    }

    if (notifications.length > 0) break;
  }

  return notifications;
}

export async function fetchGrowthMonitoring(email: string, childId?: string): Promise<MobileGrowthPoint[]> {
  const motherDoc = await findByEmail(['mothers', 'Mothers'], email);
  const motherId = motherDoc?.id || null;
  const children = await fetchChildrenProfiles(email);
  const selectedChild = children.find((item) => item.id === childId) || children[0] || null;

  const collectionNames = ['growth_monitoring', 'growthMonitoring', 'child_growth'];

  for (const name of collectionNames) {
    const queries = [
      query(collection(firebaseDb, name), where('email', '==', email)),
      query(collection(firebaseDb, name), where('motherEmail', '==', email)),
      ...(selectedChild
        ? [
            query(collection(firebaseDb, name), where('childId', '==', selectedChild.id)),
            query(collection(firebaseDb, name), where('child_id', '==', selectedChild.id)),
            query(collection(firebaseDb, name), where('childCode', '==', selectedChild.childCode)),
            query(collection(firebaseDb, name), where('child_code', '==', selectedChild.childCode)),
          ]
        : []),
      ...(motherId
        ? [
            query(collection(firebaseDb, name), where('motherId', '==', motherId)),
            query(collection(firebaseDb, name), where('mother_id', '==', motherId)),
          ]
        : []),
    ];

    for (const condition of queries) {
      const snapshot = await getDocs(condition);
      if (snapshot.empty) continue;

      return snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          childId: readText(data.childId || data.child_id || data.childCode || data.child_code, ''),
          date: readDate(data.date || data.recordedAt || data.createdAt),
          weight: readText(data.weight || data.weightKg || data.childWeight, 'Not recorded'),
          height: readText(data.height || data.length || data.childHeight, 'Not recorded'),
          headCircumference: readText(data.headCircumference || data.hc || data.head_size, 'Not recorded'),
        };
      });
    }
  }

  return [];
}

export async function fetchTimeline(email: string): Promise<MobileTimelineItem[]> {
  const [appointments, milestones, notifications, immunization] = await Promise.all([
    fetchAppointments(email),
    fetchMilestones(email),
    fetchNotifications(email),
    fetchImmunizationData(email),
  ]);

  const rows: MobileTimelineItem[] = [];

  appointments.forEach((item) => {
    rows.push({
      id: `appt-${item.id}`,
      date: item.date,
      title: item.reason,
      detail: `${item.time} with ${item.doctor}`,
      type: 'APPOINTMENT',
      status: item.status,
    });
  });

  milestones.forEach((item) => {
    rows.push({
      id: `mile-${item.id}`,
      date: item.week,
      title: item.title,
      detail: item.details,
      type: 'MILESTONE',
      status: item.status,
    });
  });

  notifications.forEach((item) => {
    rows.push({
      id: `note-${item.id}`,
      date: item.date,
      title: item.title,
      detail: item.message,
      type: 'NOTIFICATION',
      status: item.read ? 'READ' : 'NEW',
    });
  });

  immunization.vaccines.forEach((item) => {
    rows.push({
      id: `vax-${item.id}`,
      date: item.administered || item.scheduled,
      title: item.name,
      detail: item.administered ? `Given on ${item.administered}` : `Due ${item.scheduled}`,
      type: 'VACCINE',
      status: item.status,
    });
  });

  return rows
    .sort((a, b) => {
      const bDate = toDateValue(b.date)?.getTime() || 0;
      const aDate = toDateValue(a.date)?.getTime() || 0;
      return bDate - aDate;
    })
    .slice(0, 40);
}
