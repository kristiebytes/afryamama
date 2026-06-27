'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { addDoc, collection, getDocs, limit, query, where, firebaseDb } from '@/lib/firebaseClient';

type DocSnapshotLike = {
  id: string;
  data(): Record<string, unknown>;
};

interface DashboardMetrics {
  activeMothers: number;
  todaysAppointments: number;
  infantsMonitored: number;
}

interface AppointmentRow {
  id: string;
  motherName: string;
  age: string;
  contact: string;
  appointmentTime: string;
  reason: string;
  status: string;
  recordLink: string;
}

interface MotherOption {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  stage: 'PRENATAL' | 'POSTNATAL';
  pregnancyWeek: number | null;
  babyAgeMonths: number | null;
}

const emptyMetrics: DashboardMetrics = {
  activeMothers: 0,
  todaysAppointments: 0,
  infantsMonitored: 0,
};

function toTimeLabel(value: unknown): string {
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    if (value.includes(':')) {
      return value;
    }
  }
  return '-';
}

function getStatusBadgeClass(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'pending') return 'badge-warning';
  if (normalized === 'cancelled' || normalized === 'rejected') return 'badge-danger';
  return 'badge-success';
}

function toAgeLabel(value: unknown): string {
  if (typeof value !== 'string') return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';

  const now = new Date();
  let age = now.getFullYear() - parsed.getFullYear();
  const monthDiff = now.getMonth() - parsed.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < parsed.getDate())) {
    age -= 1;
  }
  return age >= 0 ? String(age) : '-';
}

function isTodayAppointment(value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim()) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;

  const now = new Date();
  return parsed.toDateString() === now.toDateString();
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [doctorName, setDoctorName] = useState('Doctor');
  const [metrics, setMetrics] = useState<DashboardMetrics>(emptyMetrics);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [nameFilter, setNameFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [contactFilter, setContactFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [doctorDocId, setDoctorDocId] = useState('');
  const [motherOptions, setMotherOptions] = useState<MotherOption[]>([]);
  const [selectedMotherId, setSelectedMotherId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('09:00');
  const [appointmentReason, setAppointmentReason] = useState('Routine clinic review');
  const [appointmentStage, setAppointmentStage] = useState<'PRENATAL' | 'POSTNATAL'>('PRENATAL');
  const [creating, setCreating] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const selectedMother = useMemo(
    () => motherOptions.find((item) => item.id === selectedMotherId) || null,
    [motherOptions, selectedMotherId]
  );


  async function createSingleAppointment() {
    if (!user?.email || !selectedMother) {
      setActionMessage('Select a mother first.');
      return;
    }

    if (!appointmentDate.trim()) {
      setActionMessage('Choose appointment date.');
      return;
    }

    setCreating(true);
    setActionMessage('');

    try {
      const dateTimeIso = new Date(`${appointmentDate}T${appointmentTime || '09:00'}:00`).toISOString();
      await addDoc(collection(firebaseDb, 'appointments'), {
        motherId: selectedMother.id,
        motherName: selectedMother.fullName,
        motherEmail: selectedMother.email,
        motherPhone: selectedMother.phone,
        doctorId: doctorDocId || user.uid,
        doctorUid: user.uid,
        doctorEmail: user.email,
        doctorName,
        stage: appointmentStage,
        reason: appointmentReason || 'Routine clinic review',
        status: 'PENDING',
        dateTime: dateTimeIso,
        appointmentDate: dateTimeIso,
        appointmentTime: appointmentTime || '09:00',
        createdAt: new Date().toISOString(),
        source: 'DOCTOR_MANUAL',
      });

      setActionMessage('Appointment created successfully.');
    } catch {
      setActionMessage('Could not create appointment.');
    } finally {
      setCreating(false);
    }
  }


  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        const doctorsSnapshot = await getDocs(
          query(collection(firebaseDb, 'doctors'), where('email', '==', user.email), limit(1))
        );

        if (!doctorsSnapshot.empty) {
          const doctorData = doctorsSnapshot.docs[0].data() as Record<string, unknown>;
          setDoctorDocId(doctorsSnapshot.docs[0].id);
          const firstName = (doctorData.firstName || doctorData.first_name || '').toString().trim();
          const lastName = (doctorData.lastName || doctorData.last_name || '').toString().trim();
          const fullName = `${firstName} ${lastName}`.trim();
          setDoctorName(fullName || user.displayName || user.email || 'Doctor');
        } else {
          setDoctorName(user.displayName || user.email || 'Doctor');
        }

        const [mothersSnapshot, childrenSnapshot, allAppointmentsSnapshot] = await Promise.all([
          getDocs(collection(firebaseDb, 'mothers')),
          getDocs(collection(firebaseDb, 'children')),
          getDocs(collection(firebaseDb, 'appointments')),
        ]);

        const motherAgeById = new Map<string, string>();
        const mappedMothers: MotherOption[] = mothersSnapshot.docs.map((docItem: DocSnapshotLike) => {
          const data = docItem.data() as Record<string, unknown>;
          const firstName = (data.firstName || data.first_name || '').toString().trim();
          const lastName = (data.lastName || data.last_name || '').toString().trim();
          const fullName =
            `${firstName} ${lastName}`.trim() ||
            (data.fullName || data.name || data.motherName || 'Mother').toString();

          const stageRaw = (data.stage || data.motherStage || 'PRENATAL').toString().toUpperCase();
          const stage: 'PRENATAL' | 'POSTNATAL' = stageRaw === 'POSTNATAL' ? 'POSTNATAL' : 'PRENATAL';
          const pregnancyWeek = Number.parseInt((data.pregnancyWeek || data.week || '').toString(), 10);
          const babyAgeMonths = Number.parseInt((data.babyAgeMonths || data.infantAgeMonths || '').toString(), 10);

          return {
            id: docItem.id,
            fullName,
            email: (data.email || data.Email || data.userEmail || '').toString(),
            phone: (data.phone || data.phoneNumber || data.contact || '-').toString(),
            stage,
            pregnancyWeek: Number.isNaN(pregnancyWeek) ? null : pregnancyWeek,
            babyAgeMonths: Number.isNaN(babyAgeMonths) ? null : babyAgeMonths,
          };
        });

        setMotherOptions(mappedMothers);
        if (!selectedMotherId && mappedMothers.length > 0) {
          setSelectedMotherId(mappedMothers[0].id);
          setAppointmentStage(mappedMothers[0].stage);
        }

        mothersSnapshot.docs.forEach((docItem: DocSnapshotLike) => {
          const data = docItem.data() as Record<string, unknown>;
          motherAgeById.set(docItem.id, toAgeLabel(data.dateOfBirth || data.dob));
        });

        const doctorAppointments = allAppointmentsSnapshot.docs.filter((docItem: DocSnapshotLike) => {
          const data = docItem.data() as Record<string, unknown>;
          const candidateEmails = [
            data.doctorEmail,
            data.doctor_email,
            data.email,
          ]
            .filter((value): value is string => typeof value === 'string')
            .map((value) => value.trim().toLowerCase());

          const candidateUids = [
            data.doctorUid,
            data.doctor_uid,
            data.doctorId,
          ]
            .filter((value): value is string => typeof value === 'string')
            .map((value) => value.trim());

          return candidateEmails.includes(user.email!.trim().toLowerCase()) || candidateUids.includes(user.uid);
        });

        const todaysDoctorAppointments = doctorAppointments.filter((docItem: DocSnapshotLike) => {
          const data = docItem.data() as Record<string, unknown>;
          return isTodayAppointment(data.dateTime || data.appointmentDate || data.date || data.scheduledAt || data.appointmentTime);
        });

        const todaysAppointments = todaysDoctorAppointments.length;

        const rows: AppointmentRow[] = todaysDoctorAppointments.slice(0, 8).map((docItem: DocSnapshotLike) => {
          const data = docItem.data() as Record<string, unknown>;
          const firstName = (data.motherFirstName || data.firstName || '').toString().trim();
          const lastName = (data.motherLastName || data.lastName || '').toString().trim();
          const motherName =
            `${firstName} ${lastName}`.trim() ||
            (data.motherName || data.patientName || data.name || 'Mother').toString();
          const motherId = (data.motherId || data.mother_id || '').toString().trim();

          return {
            id: docItem.id,
            motherName,
            age: motherAgeById.get(motherId) || '-',
            contact: (data.phone || data.contact || data.motherPhone || '-').toString(),
            appointmentTime: toTimeLabel(data.dateTime || data.appointmentTime || data.date),
            reason: (data.reason || data.notes || 'Consultation').toString(),
            status: (data.status || 'Pending').toString(),
            recordLink: motherId ? `/records/mother/${motherId}` : '/records',
          };
        });

        setMetrics({
          activeMothers: mothersSnapshot.size,
          todaysAppointments,
          infantsMonitored: childrenSnapshot.size,
        });
        setAppointments(rows);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user?.email, user?.uid, user?.displayName, selectedMotherId]);

  const welcomeName = useMemo(() => {
    if (!doctorName) return 'Doctor';
    return doctorName;
  }, [doctorName]);

  const filteredAppointments = useMemo(() => {
    const nameTerm = nameFilter.trim().toLowerCase();
    const ageTerm = ageFilter.trim().toLowerCase();
    const contactTerm = contactFilter.trim().toLowerCase();
    const timeTerm = timeFilter.trim().toLowerCase();
    const reasonTerm = reasonFilter.trim().toLowerCase();
    const statusTerm = statusFilter.trim().toLowerCase();

    if (!nameTerm && !ageTerm && !contactTerm && !timeTerm && !reasonTerm && !statusTerm) return appointments;

    return appointments.filter((item) => {
      const nameMatches = !nameTerm || item.motherName.toLowerCase().includes(nameTerm);
      const ageMatches = !ageTerm || item.age.toLowerCase().includes(ageTerm);
      const contactMatches = !contactTerm || item.contact.toLowerCase().includes(contactTerm);
      const timeMatches = !timeTerm || item.appointmentTime.toLowerCase().includes(timeTerm);
      const reasonMatches = !reasonTerm || item.reason.toLowerCase().includes(reasonTerm);
      const statusMatches = !statusTerm || item.status.toLowerCase().includes(statusTerm);
      return nameMatches && ageMatches && contactMatches && timeMatches && reasonMatches && statusMatches;
    });
  }, [appointments, nameFilter, ageFilter, contactFilter, timeFilter, reasonFilter, statusFilter]);

  return (
    <main className="main-content">
        <div className="header-container">
          <div>
            <h1 className="page-title">Clinician Dashboard</h1>
            <p className="page-subtitle">Welcome back, Dr. {welcomeName}. Here is your clinic overview for today.</p>
          </div>
        </div>

        <div className="card-grid">
          <div className="stat-card">
            <span className="stat-title">Active Mothers</span>
            <div className="stat-value">{loading ? '...' : metrics.activeMothers.toLocaleString()}</div>
            <span className="stat-desc">
              Mothers loaded from Firestore
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-title">Today's Appointments</span>
            <div className="stat-value">{loading ? '...' : metrics.todaysAppointments.toLocaleString()}</div>
            <span className="stat-desc">
              For your account today
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-title">Infants Monitored</span>
            <div className="stat-value">{loading ? '...' : metrics.infantsMonitored.toLocaleString()}</div>
            <span className="stat-desc">
              Children loaded from Firestore
            </span>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <span>Create Appointments (Doctor Side)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 12 }}>
            <label>
              <div className="text-muted">Mother</div>
              <select
                className="table-filter-input"
                value={selectedMotherId}
                onChange={(event) => {
                  const nextId = event.target.value;
                  setSelectedMotherId(nextId);
                  const nextMother = motherOptions.find((item) => item.id === nextId);
                  if (nextMother) {
                    setAppointmentStage(nextMother.stage);
                  }
                }}
              >
                {motherOptions.map((mother) => (
                  <option key={mother.id} value={mother.id}>
                    {mother.fullName} ({mother.stage})
                  </option>
                ))}
              </select>
            </label>

            <label>
              <div className="text-muted">Stage</div>
              <select
                className="table-filter-input"
                value={appointmentStage}
                onChange={(event) => setAppointmentStage(event.target.value as 'PRENATAL' | 'POSTNATAL')}
              >
                <option value="PRENATAL">Prenatal</option>
                <option value="POSTNATAL">Postnatal</option>
              </select>
            </label>

            <label>
              <div className="text-muted">Date</div>
              <input className="table-filter-input" type="date" value={appointmentDate} onChange={(event) => setAppointmentDate(event.target.value)} />
            </label>

            <label>
              <div className="text-muted">Time</div>
              <input className="table-filter-input" type="time" value={appointmentTime} onChange={(event) => setAppointmentTime(event.target.value)} />
            </label>

            <label style={{ gridColumn: '1 / -1' }}>
              <div className="text-muted">Reason</div>
              <input className="table-filter-input" value={appointmentReason} onChange={(event) => setAppointmentReason(event.target.value)} placeholder="Reason for appointment" />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-compact" onClick={createSingleAppointment} disabled={creating || !selectedMotherId}>
              {creating ? 'Creating...' : 'Create Appointment'}
            </button>
          </div>

          {selectedMother ? (
            <p className="page-subtitle" style={{ marginBottom: 10 }}>
              {selectedMother.stage === 'POSTNATAL'
                ? `Postnatal schedule will use baby age (${selectedMother.babyAgeMonths ?? 0} months) to generate appointments.`
                : `Prenatal schedule will use pregnancy week (${selectedMother.pregnancyWeek ?? 0}) to generate appointments.`}
            </p>
          ) : null}

          {actionMessage ? <p className="page-subtitle" style={{ marginBottom: 12 }}>{actionMessage}</p> : null}
        </div>

        <div className="content-card">
          <div className="card-header">
            <span>Upcoming Clinical Consultations</span>
            <button className="btn btn-secondary btn-compact">View All</button>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Mother Name</th>
                  <th>Age</th>
                  <th>Contact</th>
                  <th>Appointment Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
                <tr className="table-filter-row">
                  <th>
                    <input id="doctor-filter-name" className="table-filter-input" value={nameFilter} onChange={(event) => setNameFilter(event.target.value)} placeholder="Search name" />
                  </th>
                  <th>
                    <input id="doctor-filter-age" className="table-filter-input" value={ageFilter} onChange={(event) => setAgeFilter(event.target.value)} placeholder="Age" />
                  </th>
                  <th>
                    <input id="doctor-filter-contact" className="table-filter-input" value={contactFilter} onChange={(event) => setContactFilter(event.target.value)} placeholder="Contact" />
                  </th>
                  <th>
                    <input id="doctor-filter-time" className="table-filter-input" value={timeFilter} onChange={(event) => setTimeFilter(event.target.value)} placeholder="Time" />
                  </th>
                  <th>
                    <input id="doctor-filter-reason" className="table-filter-input" value={reasonFilter} onChange={(event) => setReasonFilter(event.target.value)} placeholder="Reason" />
                  </th>
                  <th>
                    <input id="doctor-filter-status" className="table-filter-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} placeholder="Status" />
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>Loading appointments from Firestore...</td>
                  </tr>
                ) : filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No appointments found for the selected filter.</td>
                  </tr>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>{appointment.motherName}</td>
                      <td>{appointment.age}</td>
                      <td>{appointment.contact}</td>
                      <td>{appointment.appointmentTime}</td>
                      <td>{appointment.reason}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td>
                        <Link href={appointment.recordLink} className="btn btn-primary btn-compact">
                          Open File
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
  );
}
