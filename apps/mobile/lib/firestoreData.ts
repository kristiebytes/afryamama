import {
  addDoc,
  collection,
  doc,
  getDoc,
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
  stage?: 'PRENATAL' | 'POSTNATAL' | 'ALL';
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
  assignedDoctorId: string;
  assignedDoctorName: string;
  assignedDoctorFacility: string;
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
  stage?: 'PRENATAL' | 'POSTNATAL' | 'ALL';
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

export interface MobileQuickAction {
  id: string;
  screen: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
  stage: 'PRENATAL' | 'POSTNATAL' | 'ALL';
  enabled: boolean;
  order: number;
}

export interface MobileDoctorMatch {
  doctorId: string;
  doctorName: string;
  facility: string;
}

interface AutoAppointmentPlanItem {
  key: string;
  stage: 'PRENATAL' | 'POSTNATAL';
  reason: string;
  dateTimeIso: string;
  appointmentTime: string;
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

function toDisplayDate(value: unknown, fallback = 'Date not set'): string {
  const formatYmd = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return formatYmd(parsed);
    }
    return value;
  }

  if (value && typeof value === 'object' && 'toDate' in (value as Record<string, unknown>)) {
    try {
      const parsed = (value as { toDate: () => Date }).toDate();
      return formatYmd(parsed);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function toDisplayTime(primary: unknown, secondaryDateTime?: unknown): string {
  const primaryText = readText(primary, '');
  if (primaryText) {
    const parsedPrimary = new Date(primaryText);
    if (!Number.isNaN(parsedPrimary.getTime())) {
      return parsedPrimary.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    if (primaryText.includes(':')) {
      return primaryText;
    }
  }

  if (typeof secondaryDateTime === 'string' && secondaryDateTime.trim()) {
    const parsedSecondary = new Date(secondaryDateTime);
    if (!Number.isNaN(parsedSecondary.getTime())) {
      return parsedSecondary.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  return 'Time not set';
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

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeFacilityKey(value: string): string {
  return normalizeText(value).replace(/[^a-z0-9]/g, '');
}

function cleanAppointmentReason(value: string): string {
  return value.replace(/\s*\(MCH booklet\)\s*/gi, '').trim();
}

function parseIntSafe(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function buildPrenatalAutoPlan(currentWeekRaw: string): AutoAppointmentPlanItem[] {
  const currentWeek = parseIntSafe(currentWeekRaw);
  const checkpoints = [12, 20, 26, 30, 34, 36, 38, 40];

  return checkpoints
    .filter((week) => week >= currentWeek)
    .map((week) => {
      const date = new Date();
      const daysAhead = Math.max(week - currentWeek, 0) * 7;
      date.setDate(date.getDate() + daysAhead);
      date.setHours(9, 0, 0, 0);

      return {
        key: `PRENATAL_W${week}`,
        stage: 'PRENATAL' as const,
        reason: `ANC week ${week} review`,
        dateTimeIso: date.toISOString(),
        appointmentTime: '09:00',
      };
    });
}

function buildPostnatalAutoPlan(currentMonthsRaw: string): AutoAppointmentPlanItem[] {
  const currentMonths = parseIntSafe(currentMonthsRaw);
  const checkpoints = [
    { month: 0, label: 'Birth and immediate postnatal check' },
    { month: 1, label: 'Month 1 postnatal review' },
    { month: 2, label: 'Month 2 growth and immunization review' },
    { month: 3, label: 'Month 3 mother and baby follow-up' },
    { month: 6, label: 'Month 6 comprehensive postnatal review' },
  ];

  return checkpoints
    .filter((item) => item.month >= currentMonths)
    .map((item) => {
      const date = new Date();
      const monthsAhead = Math.max(item.month - currentMonths, 0);
      date.setMonth(date.getMonth() + monthsAhead);
      date.setHours(9, 0, 0, 0);

      return {
        key: `POSTNATAL_M${item.month}`,
        stage: 'POSTNATAL' as const,
        reason: item.label,
        dateTimeIso: date.toISOString(),
        appointmentTime: '09:00',
      };
    });
}

async function resolveDoctorForAutoAppointments(profile: MobileMotherProfileDetails): Promise<{ doctorId: string; doctorName: string; doctorEmail: string }> {
  const assignedDoctorName = readText(profile.assignedDoctorName, '');
  const assignedDoctorId = readText(profile.assignedDoctorId, '');

  const readDoctorFromDoc = async (collectionName: 'doctors' | 'Doctors', doctorId: string) => {
    const snap = await getDoc(doc(firebaseDb, collectionName, doctorId));
    if (!snap.exists()) return null;

    const data = snap.data();
    const doctorName = readText(data.fullName || data.name || data.displayName || data.doctorName || data.doctor_name, assignedDoctorName || 'Doctor');
    const doctorEmail = readText(data.email || data.Email || data.userEmail || data.user_email, '');
    return { doctorId: snap.id, doctorName, doctorEmail };
  };

  if (assignedDoctorId) {
    try {
      const direct = await readDoctorFromDoc('doctors', assignedDoctorId);
      if (direct) return direct;
    } catch {
      // Try alternate collection.
    }

    try {
      const alt = await readDoctorFromDoc('Doctors', assignedDoctorId);
      if (alt) return alt;
    } catch {
      // Continue with fallback lookup.
    }
  }

  const facility = readText(profile.facility || profile.assignedDoctorFacility, '');
  if (facility) {
    try {
      const fallbackDoctor = await fetchDoctorByFacility(facility, assignedDoctorId);
      if (fallbackDoctor) {
        const direct = await resolveDoctorForAutoAppointments({
          ...profile,
          assignedDoctorId: fallbackDoctor.doctorId,
          assignedDoctorName: fallbackDoctor.doctorName,
        });
        return direct;
      }
    } catch {
      // Keep fallback below.
    }
  }

  return {
    doctorId: assignedDoctorId,
    doctorName: assignedDoctorName || 'Doctor',
    doctorEmail: '',
  };
}

async function ensureAutoMchAppointments(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return;

  const profile = await fetchMotherProfileDetails(normalizedEmail);
  if (!profile) return;

  const stage = readText(profile.stage, 'PRENATAL').toUpperCase() === 'POSTNATAL' ? 'POSTNATAL' : 'PRENATAL';
  const plan = stage === 'POSTNATAL'
    ? buildPostnatalAutoPlan(profile.babyAgeMonths)
    : buildPrenatalAutoPlan(profile.pregnancyWeek);
  if (plan.length === 0) return;

  const snapshot = await getDocs(query(collection(firebaseDb, 'appointments'), where('motherEmail', '==', normalizedEmail)));
  const existingKeys = new Set(
    snapshot.docs.map((item) => {
      const data = item.data();
      const rawKey = readText(data.generatedKey, '');
      if (rawKey) return rawKey;
      const reason = readText(data.reason || data.purpose || data.type, '');
      const itemStage = readText(data.stage || data.appointmentStage || data.careStage, '').toUpperCase();
      return `${itemStage}|${reason}`;
    })
  );

  const doctor = await resolveDoctorForAutoAppointments(profile);

  for (const item of plan) {
    const generatedKey = `MCH_AUTO|${item.key}`;
    const fallbackKey = `${item.stage}|${item.reason}`;
    if (existingKeys.has(generatedKey) || existingKeys.has(fallbackKey)) continue;

    await addDoc(collection(firebaseDb, 'appointments'), {
      source: 'MCH_AUTO',
      generatedKey,
      stage: item.stage,
      status: 'PENDING',
      reason: item.reason,
      dateTime: item.dateTimeIso,
      appointmentDate: item.dateTimeIso,
      appointmentTime: item.appointmentTime,
      motherId: profile.id,
      motherName: profile.fullName,
      motherEmail: normalizedEmail,
      motherPhone: profile.phone,
      doctorId: doctor.doctorId,
      doctorUid: doctor.doctorId,
      doctorName: doctor.doctorName,
      doctorEmail: doctor.doctorEmail,
      createdAt: new Date().toISOString(),
    });
  }
}

function readDoctorFacilityCandidates(data: Record<string, unknown>): string[] {
  const values: string[] = [];

  const pushIfText = (input: unknown) => {
    const text = readText(input, '');
    if (text) values.push(text);
  };

  pushIfText(data.facility);
  pushIfText(data.preferredFacility);
  pushIfText(data.hospital);
  pushIfText(data.clinic);
  pushIfText(data.facilityName);
  pushIfText(data.facility_name);
  pushIfText(data.hospitalName);
  pushIfText(data.hospital_name);
  pushIfText(data.workstation);
  pushIfText(data.station);

  if (Array.isArray(data.facilities)) {
    data.facilities.forEach((entry) => pushIfText(entry));
  }

  if (Array.isArray(data.clinics)) {
    data.clinics.forEach((entry) => pushIfText(entry));
  }

  return Array.from(new Set(values));
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
  try {
    await ensureAutoMchAppointments(email);
  } catch {
    // Loading appointments should continue even if auto-generation fails.
  }

  const collectionNames = ['appointments', 'Appointments'];
  const emailFields = ['motherEmail', 'email', 'userEmail', 'patientEmail'];

  for (const name of collectionNames) {
    for (const field of emailFields) {
      const snapshot = await getDocs(query(collection(firebaseDb, name), where(field, '==', email)));
      if (snapshot.empty) continue;

      return snapshot.docs.map((item) => {
        const data = item.data();
        const dateTimeSource = data.dateTime || data.appointmentDate || data.date || data.scheduledAt;
        const rawStage = readText(data.stage || data.appointmentStage || data.careStage || data.targetStage, '').toUpperCase();
        const stage: 'PRENATAL' | 'POSTNATAL' | 'ALL' | undefined =
          rawStage === 'PRENATAL' || rawStage === 'POSTNATAL' || rawStage === 'ALL' ? rawStage : undefined;

        return {
          id: item.id,
          date: toDisplayDate(dateTimeSource),
          time: toDisplayTime(data.time || data.appointmentTime || data.slot, dateTimeSource),
          doctor: readText(data.doctorName || data.provider || data.doctor, 'Clinician not assigned'),
          reason: cleanAppointmentReason(readText(data.reason || data.purpose || data.type, 'General consultation')),
          status: readText(data.status, 'PENDING').toUpperCase(),
          stage,
        };
      });
    }
  }

  return [];
}

export async function requestEmergencyAppointment(
  email: string,
  payload: { preferredDate: string; preferredTime: string; reason: string }
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw new Error('Mother email is required.');

  const motherProfile = await fetchMotherProfileDetails(normalizedEmail);
  const nowIso = new Date().toISOString();
  const assignedDoctorId = readText(motherProfile?.assignedDoctorId, '');
  const assignedDoctorName = readText(motherProfile?.assignedDoctorName, '');
  const assignedDoctorFacility = readText(motherProfile?.assignedDoctorFacility, '');
  let assignedDoctorEmail = '';

  if (assignedDoctorId) {
    const doctorCollections = ['doctors', 'Doctors'];
    for (const collectionName of doctorCollections) {
      try {
        const doctorSnap = await getDoc(doc(firebaseDb, collectionName, assignedDoctorId));
        if (!doctorSnap.exists()) continue;
        const doctorData = doctorSnap.data();
        assignedDoctorEmail = readText(
          doctorData.email || doctorData.Email || doctorData.userEmail || doctorData.user_email,
          ''
        ).toLowerCase();
        if (assignedDoctorEmail) break;
      } catch {
        // Continue checking other doctor collection variants.
      }
    }
  }

  await addDoc(collection(firebaseDb, 'appointments'), {
    source: 'MOTHER_EMERGENCY_REQUEST',
    status: 'PENDING',
    stage: readText(motherProfile?.stage || '', 'PRENATAL').toUpperCase() === 'POSTNATAL' ? 'POSTNATAL' : 'PRENATAL',
    reason: `Emergency request: ${payload.reason.trim()}`,
    requestType: 'EMERGENCY',
    appointmentDate: payload.preferredDate,
    appointmentTime: payload.preferredTime,
    dateTime: `${payload.preferredDate}T${payload.preferredTime}:00`,
    motherId: readText(motherProfile?.id, ''),
    motherName: readText(motherProfile?.fullName, ''),
    motherEmail: normalizedEmail,
    motherPhone: readText(motherProfile?.phone, ''),
    primaryDoctorId: assignedDoctorId,
    primaryDoctorUid: assignedDoctorId,
    primaryDoctorName: assignedDoctorName,
    primaryDoctorFacility: assignedDoctorFacility,
    primaryDoctorEmail: assignedDoctorEmail,
    doctorId: assignedDoctorId,
    doctorUid: assignedDoctorId,
    doctorName: assignedDoctorName,
    doctorEmail: assignedDoctorEmail,
    createdAt: nowIso,
    updatedAt: nowIso,
  });
}

export async function fetchRecords(email: string): Promise<MobileRecord[]> {
  const collectionNames = ['maternalRecords', 'anc_records', 'ancRecords', 'records'];
  const emailFields = ['motherEmail', 'email', 'userEmail', 'patientEmail'];

  const mapRecord = (item: QueryDocumentSnapshot): MobileRecord => {
    const data = item.data();
    const recordType = readText(data.visitType || data.recordType || data.type, '').toUpperCase();
    const typePrefix = recordType === 'PNC' || recordType.includes('POSTNATAL')
      ? 'PNC'
      : recordType.includes('ANC') || recordType.includes('ANTENATAL')
        ? 'ANC'
        : '';

    const baseNotes = readText(data.notes || data.clinicalObservations || data.observations || data.remarks, 'No clinical notes yet.');

    return {
      id: item.id,
      date: toDisplayDate(data.checkupDate || data.date || data.visitDate || data.createdAt),
      weight: readText(data.weight || data.weightKg || data.motherWeight, 'Not recorded'),
      bp: readText(data.bp || data.bloodPressure || data.blood_pressure, 'Not recorded'),
      hr: readText(data.hr || data.fhr || data.fetalHeartRate || data.heartRate, 'Not recorded'),
      notes: typePrefix ? `[${typePrefix}] ${baseNotes}` : baseNotes,
    };
  };

  for (const name of collectionNames) {
    for (const field of emailFields) {
      const snapshot = await getDocs(query(collection(firebaseDb, name), where(field, '==', email)));
      if (snapshot.empty) continue;

      return snapshot.docs.map(mapRecord);
    }
  }

  const motherProfile = await fetchMotherProfileDetails(email);
  if (motherProfile?.id) {
    const idFields = ['motherId', 'mother_id'];
    const idCollectionNames = ['maternalRecords', 'anc_records', 'ancRecords', 'records'];

    for (const name of idCollectionNames) {
      for (const field of idFields) {
        const snapshot = await getDocs(query(collection(firebaseDb, name), where(field, '==', motherProfile.id)));
        if (snapshot.empty) continue;
        return snapshot.docs.map(mapRecord);
      }
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
  const collectionNames = [
    'mch_booklet_tips',
    'mchBookletTips',
    'wellness_tips',
    'wellnessTips',
    'notifications',
  ];
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
        category: readText(data.category || data.type || (name.includes('mch') ? 'MCH BOOKLET' : 'WELLNESS')).toUpperCase(),
        content: readText(data.message || data.content || data.body, 'No details provided.'),
      });
    }

    if (tips.length > 0) break;
  }

  if (tips.length === 0) {
    return [
      {
        id: 'mch-1',
        title: 'Attend every scheduled ANC/PNC visit',
        category: 'MCH BOOKLET',
        content: 'Use your clinic schedule and keep all maternal and child health visits to detect issues early.',
      },
      {
        id: 'mch-2',
        title: 'Watch danger signs and seek help fast',
        category: 'MCH BOOKLET',
        content: 'Severe headache, bleeding, fever, swelling, or reduced baby movement requires immediate facility review.',
      },
      {
        id: 'mch-3',
        title: 'Breastfeeding and nutrition guidance',
        category: 'MCH BOOKLET',
        content: 'Practice exclusive breastfeeding for 6 months and maintain a balanced, iron-rich diet for recovery and growth.',
      },
    ];
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
    assignedDoctorId: readText(data.assignedDoctorId || data.doctorId, ''),
    assignedDoctorName: readText(data.assignedDoctorName || data.doctorName || data.assignedDoctor, ''),
    assignedDoctorFacility: readText(data.assignedDoctorFacility || data.doctorFacility, ''),
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
        const rawStage = readText(data.stage || data.targetStage || data.phase, '').toUpperCase();
        const stage: 'PRENATAL' | 'POSTNATAL' | 'ALL' | undefined =
          rawStage === 'PRENATAL' || rawStage === 'POSTNATAL' || rawStage === 'ALL' ? rawStage : undefined;

        return {
          id: item.id,
          title: readText(data.title || data.name || data.milestone, 'Milestone'),
          week: readText(data.week || data.pregnancyWeek || data.trimester, 'Not set'),
          status: readText(data.status || data.progress, 'PENDING').toUpperCase(),
          details: readText(data.details || data.description || data.notes, 'No details provided.'),
          stage,
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

export async function fetchDoctorByFacility(
  facility: string,
  assignedDoctorId?: string
): Promise<MobileDoctorMatch | null> {
  const target = normalizeText(facility);
  const targetKey = normalizeFacilityKey(facility);
  const collections = ['doctors', 'Doctors'];

  if (assignedDoctorId) {
    for (const collectionName of collections) {
      const doctorSnap = await getDoc(doc(firebaseDb, collectionName, assignedDoctorId));
      if (!doctorSnap.exists()) continue;

      const data = doctorSnap.data();
      const resolvedName = readText(
        data.fullName || data.name || data.displayName || data.doctorName || data.doctor_name,
        ''
      );
      if (!resolvedName) continue;

      return {
        doctorId: doctorSnap.id,
        doctorName: resolvedName,
        facility: readText(data.facility || data.hospital || data.clinic, facility || 'Not set'),
      };
    }
  }

  if (!target) return null;

  const matches: MobileDoctorMatch[] = [];

  for (const collectionName of collections) {
    const exactQueries = [
      query(collection(firebaseDb, collectionName), where('facility', '==', facility.trim())),
      query(collection(firebaseDb, collectionName), where('preferredFacility', '==', facility.trim())),
      query(collection(firebaseDb, collectionName), where('hospital', '==', facility.trim())),
      query(collection(firebaseDb, collectionName), where('clinic', '==', facility.trim())),
    ];

    for (const condition of exactQueries) {
      try {
        const exactSnap = await getDocs(condition);
        exactSnap.docs.forEach((docItem) => {
          const data = docItem.data();
          const resolvedName = readText(
            data.fullName || data.name || data.displayName || data.doctorName || data.doctor_name,
            ''
          );
          if (!resolvedName) return;

          matches.push({
            doctorId: docItem.id,
            doctorName: resolvedName,
            facility: readText(data.facility || data.preferredFacility || data.hospital || data.clinic, facility || 'Not set'),
          });
        });
      } catch {
        // Continue to broader scan.
      }
    }

    if (matches.length > 0) break;

    const snapshot = await getDocs(collection(firebaseDb, collectionName));
    if (snapshot.empty) continue;

    snapshot.docs.forEach((docItem) => {
      const data = docItem.data() as Record<string, unknown>;
      const facilities = readDoctorFacilityCandidates(data);
      const hasMatch = facilities.some((doctorFacility) => {
        const normalizedFacility = normalizeText(doctorFacility);
        const normalizedFacilityKey = normalizeFacilityKey(doctorFacility);
        if (!normalizedFacility || !normalizedFacilityKey) return false;

        return (
          normalizedFacility === target ||
          normalizedFacility.includes(target) ||
          target.includes(normalizedFacility) ||
          normalizedFacilityKey === targetKey
        );
      });

      if (!hasMatch) return;

      const resolvedName = readText(
        data.fullName || data.name || data.displayName || data.doctorName || data.doctor_name,
        ''
      );
      if (!resolvedName) return;

      matches.push({
        doctorId: docItem.id,
        doctorName: resolvedName,
        facility: facilities[0] || readText(data.facility || data.hospital || data.clinic, facility),
      });
    });

    if (matches.length > 0) break;
  }

  if (matches.length === 0) return null;
  return matches.sort((a, b) => a.doctorName.localeCompare(b.doctorName))[0];
}

export async function fetchQuickActions(stage: 'PRENATAL' | 'POSTNATAL'): Promise<MobileQuickAction[]> {
  const collections = ['quick_actions', 'quickActions', 'app_quick_actions'];

  for (const collectionName of collections) {
    const snapshot = await getDocs(collection(firebaseDb, collectionName));
    if (snapshot.empty) continue;

    const rows: MobileQuickAction[] = snapshot.docs.map((docItem, index) => {
      const data = docItem.data();
      const normalizedStage = readText(data.stage || data.targetStage || 'ALL', 'ALL').toUpperCase();
      const stageValue: 'PRENATAL' | 'POSTNATAL' | 'ALL' =
        normalizedStage === 'PRENATAL' || normalizedStage === 'POSTNATAL' ? normalizedStage : 'ALL';

      return {
        id: docItem.id,
        screen: readText(data.screen || data.route, 'PROFILE').toUpperCase(),
        title: readText(data.title, 'Action'),
        desc: readText(data.description || data.desc, ''),
        icon: readText(data.icon, '✨'),
        color: readText(data.color, '#38bdf8'),
        stage: stageValue,
        enabled: data.enabled === false ? false : true,
        order: Number.isFinite(Number(data.order)) ? Number(data.order) : index,
      };
    });

    const filtered = rows
      .filter((item) => item.enabled)
      .filter((item) => item.stage === 'ALL' || item.stage === stage)
      .sort((a, b) => a.order - b.order);

    if (filtered.length > 0) return filtered;
  }

  return [];
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
