import { 
  User, Mother, Doctor, Child, Pregnancy, Appointment, 
  MaternalRecord, GrowthRecord, Immunization, WellnessTip, Notification 
} from '@afryamama/types';

export const mockUsers: User[] = [
  {
    id: 'u-mother-1',
    email: 'mother@afryamama.org',
    role: 'MOTHER',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'u-doctor-1',
    email: 'doctor@afryamama.org',
    role: 'DOCTOR',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'u-admin-1',
    email: 'admin@afryamama.org',
    role: 'ADMIN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const mockMothers: Mother[] = [
  {
    id: 'm-1',
    userId: 'u-mother-1',
    name: 'Amina Omondi',
    phone: '+254712345678',
    dateOfBirth: '1995-08-15T00:00:00Z',
    location: 'Nairobi',
    bloodGroup: 'O+',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const mockDoctors: Doctor[] = [
  {
    id: 'd-1',
    userId: 'u-doctor-1',
    name: 'Dr. Jane Mwangi',
    phone: '+254722334455',
    specialization: 'Obstetrician/Gynecologist',
    hospital: 'Kenyatta National Hospital',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const mockChildren: Child[] = [
  {
    id: 'c-1',
    motherId: 'm-1',
    name: 'Baby Baraka',
    dateOfBirth: '2025-10-01T00:00:00Z',
    gender: 'Male',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const mockPregnancies: Pregnancy[] = [
  {
    id: 'p-1',
    motherId: 'm-1',
    startDate: '2025-01-15T00:00:00Z',
    estimatedDueDate: '2025-10-22T00:00:00Z',
    status: 'ACTIVE',
    notes: 'First pregnancy, monitor blood pressure.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const mockAppointments: Appointment[] = [
  {
    id: 'a-1',
    motherId: 'm-1',
    doctorId: 'd-1',
    dateTime: '2026-06-25T10:00:00Z',
    reason: 'Routine prenatal checkup',
    status: 'PENDING',
    notes: 'Bring ultrasound reports.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const mockMaternalRecords: MaternalRecord[] = [
  {
    id: 'mr-1',
    pregnancyId: 'p-1',
    weight: 72.5,
    bloodPressure: '120/80',
    heartRate: 78,
    checkupDate: '2026-06-10T09:00:00Z',
    clinicalNotes: 'Maternal health normal. Fetal heartbeat detected at 140 bpm.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const mockGrowthRecords: GrowthRecord[] = [
  {
    id: 'gr-1',
    childId: 'c-1',
    weight: 8.2,
    height: 68,
    recordedDate: '2026-05-15T00:00:00Z',
    notes: 'Healthy weight and height progression.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const mockImmunizations: Immunization[] = [
  {
    id: 'i-1',
    childId: 'c-1',
    vaccineName: 'BCG',
    scheduledDate: '2025-10-01T00:00:00Z',
    dateAdministered: '2025-10-02T00:00:00Z',
    status: 'COMPLETED',
    notes: 'Administered at birth.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'i-2',
    childId: 'c-1',
    vaccineName: 'OPV 0',
    scheduledDate: '2025-10-01T00:00:00Z',
    dateAdministered: '2025-10-02T00:00:00Z',
    status: 'COMPLETED',
    notes: 'Administered at birth.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'i-3',
    childId: 'c-1',
    vaccineName: 'Pentavalent 1',
    scheduledDate: '2025-11-12T00:00:00Z',
    dateAdministered: undefined,
    status: 'PENDING',
    notes: 'Schedule for 6 weeks checkup.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const mockWellnessTips: WellnessTip[] = [
  {
    id: 'wt-1',
    title: 'Importance of Folic Acid',
    content: 'Folic acid helps prevent neural tube defects. It is recommended to take 400 mcg daily before conception and during early pregnancy.',
    targetAudience: 'PREGNANT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'wt-2',
    title: 'Exlusive Breastfeeding',
    content: 'Exclusive breastfeeding is recommended for the first 6 months of a child’s life to provide optimal nutrition and antibodies.',
    targetAudience: 'MOTHER',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'wt-3',
    title: 'Stay Hydrated',
    content: 'Expectant mothers should drink at least 8-10 glasses of water daily to support placental function and fetal circulation.',
    targetAudience: 'ALL',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const mockNotifications: Notification[] = [
  {
    id: 'n-1',
    userId: 'u-mother-1',
    title: 'Upcoming Appointment',
    message: 'You have an appointment scheduled with Dr. Jane Mwangi on June 25 at 10:00 AM.',
    read: false,
    createdAt: new Date().toISOString()
  }
];
