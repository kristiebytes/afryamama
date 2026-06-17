// Roles
export type Role = 'MOTHER' | 'DOCTOR' | 'ADMIN';

// Enums
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type ImmunizationStatus = 'PENDING' | 'COMPLETED';
export type PregnancyStatus = 'ACTIVE' | 'COMPLETED' | 'MISCARRIAGE';

// Core Models
export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Mother {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  dateOfBirth?: string;
  location?: string;
  bloodGroup?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Doctor {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  specialization?: string;
  hospital?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Child {
  id: string;
  motherId: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  createdAt: string;
  updatedAt: string;
  mother?: Mother;
}

export interface Pregnancy {
  id: string;
  motherId: string;
  startDate: string;
  estimatedDueDate: string;
  status: PregnancyStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  mother?: Mother;
}

export interface Appointment {
  id: string;
  motherId: string;
  doctorId: string;
  dateTime: string;
  reason: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  mother?: Mother;
  doctor?: Doctor;
}

export interface MaternalRecord {
  id: string;
  pregnancyId: string;
  weight?: number;
  bloodPressure?: string;
  heartRate?: number;
  checkupDate: string;
  clinicalNotes?: string;
  createdAt: string;
  updatedAt: string;
  pregnancy?: Pregnancy;
}

export interface GrowthRecord {
  id: string;
  childId: string;
  weight: number;
  height: number;
  recordedDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  child?: Child;
}

export interface Immunization {
  id: string;
  childId: string;
  vaccineName: string;
  scheduledDate: string;
  dateAdministered?: string;
  status: ImmunizationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  child?: Child;
}

export interface WellnessTip {
  id: string;
  title: string;
  content: string;
  targetAudience: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// Authentication Payloads
export interface LoginRequest {
  email: string;
  password?: string; // Optional if doing SSO, otherwise required
}

export interface LoginResponse {
  token: string;
  user: User;
  profile?: Mother | Doctor;
}

export interface RegisterRequest {
  email: string;
  passwordHash?: string; // Client typically sends password plain text, which server hashes
  password?: string;
  role: Role;
  name: string;
  phone?: string;
  // Mother fields
  dateOfBirth?: string;
  location?: string;
  bloodGroup?: string;
  // Doctor fields
  specialization?: string;
  hospital?: string;
}
export interface HealthResponse {
  status: string;
  database: string;
  timestamp: string;
  uptime: number;
}
