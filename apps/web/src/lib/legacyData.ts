export interface UserRow {
  name: string;
  email: string;
}

export interface NotificationRow {
  id: string;
  category: 'Prenatal' | 'Postnatal';
  title: string;
  message: string;
  date: string;
}

export const doctorProfile = {
  firstName: 'Jane',
  lastName: 'Mwangi',
  email: 'doctor@afryamama.org',
  phone: '+254700123456',
  facility: 'Kasarani Health Centre',
  gender: 'Female',
};

export const adminProfile = {
  firstName: 'System',
  lastName: 'Administrator',
  email: 'admin@afryamama.org',
  phone: '+254700000001',
  title: 'Head of Operations',
};

export const usersByRole: Record<'mother' | 'doctor', UserRow[]> = {
  mother: [
    { name: 'Amina Omondi', email: 'amina@afryamama.org' },
    { name: 'Sarah Kamau', email: 'sarah@afryamama.org' },
    { name: 'Fatima Yusuf', email: 'fatima@afryamama.org' },
  ],
  doctor: [
    { name: 'Dr. Jane Mwangi', email: 'doctor@afryamama.org' },
    { name: 'Dr. Victor Kimani', email: 'vkimani@afryamama.org' },
  ],
};

export const reportTemplates = [
  {
    title: 'Maternal Health',
    items: ['Total mothers registered', 'Active pregnancies', 'ANC attendance'],
  },
  {
    title: 'Child Health',
    items: ['Total children registered', 'Growth monitoring coverage'],
  },
  {
    title: 'Immunization',
    items: ['Vaccines administered', 'Upcoming schedule adherence'],
  },
  {
    title: 'Appointments',
    items: ['Total ANC visits', 'Total PNC visits'],
  },
];

export const defaultNotifications: NotificationRow[] = [
  {
    id: 'n-1',
    category: 'Prenatal',
    title: 'Attend Your ANC Visit',
    message: 'Remember to attend your scheduled ANC visit this week.',
    date: '2026-06-10',
  },
  {
    id: 'n-2',
    category: 'Postnatal',
    title: 'Exclusive Breastfeeding Tip',
    message: 'Exclusive breastfeeding is recommended for the first six months.',
    date: '2026-06-12',
  },
];

export const childRecords = {
  'm-1': {
    childName: 'Baby Baraka',
    motherName: 'Amina Omondi',
    dob: '2025-10-01',
    sex: 'Male',
    birthWeight: '3.2 kg',
    ageWeeks: 37,
    ageMonths: 8,
  },
};

export const motherRecords = {
  'm-1': {
    motherName: 'Amina Omondi',
    motherId: 'm-1',
    dob: '1998-04-16',
    deliveryDate: '2025-10-01',
    gravidaPara: 'G2P2',
    pncVisits: 4,
    postpartumWeeks: 37,
  },
};
