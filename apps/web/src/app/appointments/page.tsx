'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { addDoc, collection, doc, getDocs, limit, query, updateDoc, where, firebaseDb } from '@/lib/firebaseClient';

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

interface AppointmentRow {
  id: string;
  motherId: string;
  childId: string;
  name: string;
  reason: string;
  time: string;
  status: AppointmentStatus;
  stage: 'PRENATAL' | 'POSTNATAL';
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

function mapMotherDocToOption(docId: string, data: Record<string, unknown>): MotherOption {
  const firstName = (data.firstName || data.first_name || '').toString().trim();
  const lastName = (data.lastName || data.last_name || '').toString().trim();
  const fullName = `${firstName} ${lastName}`.trim() || (data.fullName || data.name || data.motherName || 'Mother').toString();
  const stageRaw = (data.stage || data.motherStage || 'PRENATAL').toString().toUpperCase();
  const stage: 'PRENATAL' | 'POSTNATAL' = stageRaw === 'POSTNATAL' ? 'POSTNATAL' : 'PRENATAL';
  const pregnancyWeek = Number.parseInt((data.pregnancyWeek || data.week || '').toString(), 10);
  const babyAgeMonths = Number.parseInt((data.babyAgeMonths || data.infantAgeMonths || '').toString(), 10);

  return {
    id: docId,
    fullName,
    email: (data.email || data.Email || data.userEmail || '').toString(),
    phone: (data.phone || data.phoneNumber || data.contact || '-').toString(),
    stage,
    pregnancyWeek: Number.isNaN(pregnancyWeek) ? null : pregnancyWeek,
    babyAgeMonths: Number.isNaN(babyAgeMonths) ? null : babyAgeMonths,
  };
}

function toDateTimeLabel(value: unknown): string {
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString([], {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return value;
  }
  return '-';
}

function toStatus(value: unknown): AppointmentStatus {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : 'PENDING';
  if (normalized === 'CONFIRMED' || normalized === 'CANCELLED' || normalized === 'COMPLETED') return normalized;
  return 'PENDING';
}

function isTodayAppointment(value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim()) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;

  const now = new Date();
  return parsed.toDateString() === now.toDateString();
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [doctorName, setDoctorName] = useState('Doctor');
  const [doctorDocId, setDoctorDocId] = useState('');
  const [motherOptions, setMotherOptions] = useState<MotherOption[]>([]);
  const [selectedMotherId, setSelectedMotherId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('09:00');
  const [appointmentReason, setAppointmentReason] = useState('Routine clinic review');
  const [appointmentStage, setAppointmentStage] = useState<'PRENATAL' | 'POSTNATAL'>('PRENATAL');
  const [creating, setCreating] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const selectedMother = motherOptions.find((item) => item.id === selectedMotherId) || null;


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

  function getRecordVisitPath(appt: AppointmentRow): string {
    const reason = appt.reason.toLowerCase();
    const likelyChildVisit =
      Boolean(appt.childId) ||
      reason.includes('child') ||
      reason.includes('vaccine') ||
      reason.includes('immunization') ||
      reason.includes('growth');

    if (likelyChildVisit) {
      return appt.childId ? `/records/child/${appt.childId}` : '/records';
    }

    if (appt.stage === 'POSTNATAL') {
      return appt.motherId ? `/records/mother/${appt.motherId}` : '/records';
    }

    return appt.motherId ? `/records/anc/${appt.motherId}` : '/records';
  }


  useEffect(() => {
    let isMounted = true;

    async function loadAppointments() {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        const [doctorsSnapshot, appointmentsSnapshot, mothersSnapshot, mothersCapsSnapshot] = await Promise.all([
          getDocs(query(collection(firebaseDb, 'doctors'), where('email', '==', user.email), where('role', '==', 'DOCTOR'), where('active', '==', true), where('approved', '==', true), where('registrationStatus', '==', 'COMPLETE'), limit(1))),
          getDocs(collection(firebaseDb, 'appointments')),
          getDocs(collection(firebaseDb, 'mothers')),
          getDocs(collection(firebaseDb, 'Mothers')),
        ]);

        if (!doctorsSnapshot.empty) {
          const doctorData = doctorsSnapshot.docs[0].data() as Record<string, unknown>;
          setDoctorDocId(doctorsSnapshot.docs[0].id);
          const firstName = (doctorData.firstName || doctorData.first_name || '').toString().trim();
          const lastName = (doctorData.lastName || doctorData.last_name || '').toString().trim();
          const fullName = `${firstName} ${lastName}`.trim();
          setDoctorName(fullName || (doctorData.name || doctorData.fullName || user.displayName || 'Doctor').toString());
        }

        const motherNameById = new Map<string, string>();
        const motherByKey = new Map<string, MotherOption>();
        const allMotherDocs = [...mothersSnapshot.docs, ...mothersCapsSnapshot.docs];

        allMotherDocs.forEach((docItem) => {
          const data = docItem.data() as Record<string, unknown>;
          const mapped = mapMotherDocToOption(docItem.id, data);
          const key = mapped.email.trim().toLowerCase() || docItem.id;
          const existing = motherByKey.get(key);

          if (!existing) {
            motherByKey.set(key, mapped);
            return;
          }

          const existingNameScore = existing.fullName === 'Mother' ? 0 : 1;
          const nextNameScore = mapped.fullName === 'Mother' ? 0 : 1;
          const existingPhoneScore = existing.phone === '-' ? 0 : 1;
          const nextPhoneScore = mapped.phone === '-' ? 0 : 1;
          const existingScore = existingNameScore + existingPhoneScore;
          const nextScore = nextNameScore + nextPhoneScore;

          if (nextScore > existingScore) {
            motherByKey.set(key, mapped);
          }
        });

        const mappedMothers = Array.from(motherByKey.values()).sort((a, b) => a.fullName.localeCompare(b.fullName));

        if (isMounted) {
          setMotherOptions(mappedMothers);
          if (mappedMothers.length > 0) {
            setSelectedMotherId((prev) => prev || mappedMothers[0].id);
            setAppointmentStage((prev) => {
              if (prev) return prev;
              return mappedMothers[0].stage;
            });
          }
        }

        allMotherDocs.forEach((docItem) => {
          const data = docItem.data() as Record<string, unknown>;
          const firstName = (data.firstName || data.first_name || '').toString().trim();
          const lastName = (data.lastName || data.last_name || '').toString().trim();
          const fullName = `${firstName} ${lastName}`.trim();
          motherNameById.set(docItem.id, fullName || (data.full_name || data.name || 'Mother').toString());
        });

        const rows: AppointmentRow[] = appointmentsSnapshot.docs
          .filter((docItem) => {
            const data = docItem.data() as Record<string, unknown>;

            const candidateEmails = [data.doctorEmail, data.doctor_email, data.email]
              .filter((value): value is string => typeof value === 'string')
              .map((value) => value.trim().toLowerCase());

            const candidateUids = [data.doctorUid, data.doctor_uid, data.doctorId]
              .filter((value): value is string => typeof value === 'string')
              .map((value) => value.trim());

            const dateValue =
              data.dateTime ||
              data.appointmentDate ||
              data.date ||
              data.scheduledAt ||
              data.appointmentTime;

            const isForToday = isTodayAppointment(dateValue);

            return (candidateEmails.includes(user.email!.trim().toLowerCase()) || candidateUids.includes(user.uid)) && isForToday;
          })
          .map((docItem) => {
            const data = docItem.data() as Record<string, unknown>;
            const motherId = (data.motherId || data.mother_id || '').toString();
            const childId = (data.childId || data.child_id || '').toString();
            const firstName = (data.motherFirstName || data.firstName || '').toString().trim();
            const lastName = (data.motherLastName || data.lastName || '').toString().trim();
            const inlineName = `${firstName} ${lastName}`.trim();

            return {
              id: docItem.id,
              motherId,
              childId,
              name:
                inlineName ||
                (data.motherName || data.patientName || '').toString() ||
                motherNameById.get(motherId) ||
                'Mother',
              reason: (data.reason || data.notes || data.appointmentType || 'Consultation').toString(),
              time: toDateTimeLabel(data.dateTime || data.appointmentTime || data.date),
              status: toStatus(data.status),
              stage: ((data.stage || data.appointmentStage || data.careStage || 'PRENATAL').toString().toUpperCase() === 'POSTNATAL' ? 'POSTNATAL' : 'PRENATAL'),
            };
          });

        if (isMounted) {
          setAppointments(rows);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAppointments();

    return () => {
      isMounted = false;
    };
  }, [user?.email, user?.uid, user?.displayName]);

  const handleStatusChange = async (id: string, nextStatus: Exclude<AppointmentStatus, 'PENDING'>) => {
    setSavingId(id);
    try {
      await updateDoc(doc(firebaseDb, 'appointments', id), {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });

      setAppointments((prev) => prev.map((appt) => (appt.id === id ? { ...appt, status: nextStatus } : appt)));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="main-content">
        <div className="header-container">
          <div>
            <h1 className="page-title">Appointments Scheduler</h1>
            <p className="page-subtitle">Schedule clinical consultations, track antenatal care (ANC) visits, and infant checkups.</p>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <span>Create Appointments</span>
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
                  if (nextMother) setAppointmentStage(nextMother.stage);
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
              <select className="table-filter-input" value={appointmentStage} onChange={(event) => setAppointmentStage(event.target.value as 'PRENATAL' | 'POSTNATAL')}>
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
                ? `Postnatal schedule uses baby age (${selectedMother.babyAgeMonths ?? 0} months).`
                : `Prenatal schedule uses pregnancy week (${selectedMother.pregnancyWeek ?? 0}).`}
            </p>
          ) : null}

          {actionMessage ? <p className="page-subtitle" style={{ marginBottom: 12 }}>{actionMessage}</p> : null}
        </div>

        <div className="content-card">
          <div className="card-header">
            <span>Consultation Schedule</span>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Reason for Consultation</th>
                  <th>Scheduled Date & Time</th>
                  <th>Status</th>
                  <th>Control Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5}>Loading appointments from Firestore...</td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No appointments found for this doctor.</td>
                  </tr>
                ) : (
                  appointments.map((appt) => (
                    <tr key={appt.id}>
                      <td style={{ fontWeight: '600' }}>{appt.name}</td>
                      <td>{appt.reason}</td>
                      <td>{appt.time}</td>
                      <td>
                        <span className={`badge ${
                          appt.status === 'CONFIRMED' ? 'badge-success' :
                          appt.status === 'PENDING' ? 'badge-warning' :
                          appt.status === 'COMPLETED' ? 'badge-success' : 'badge-danger'
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <Link
                            href={appt.motherId ? `/records/mother/${appt.motherId}` : '/records'}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            View Mother
                          </Link>

                          <Link
                            href={getRecordVisitPath(appt)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            Record Visit
                          </Link>

                          {appt.status === 'PENDING' && (
                            <>
                              <button
                                className="btn btn-primary"
                                style={{ padding: '4px 10px', fontSize: '11px' }}
                                onClick={() => handleStatusChange(appt.id, 'CONFIRMED')}
                                disabled={savingId === appt.id}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--danger)' }}
                                onClick={() => handleStatusChange(appt.id, 'CANCELLED')}
                                disabled={savingId === appt.id}
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {appt.status === 'CONFIRMED' && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => handleStatusChange(appt.id, 'COMPLETED')}
                              disabled={savingId === appt.id}
                            >
                              Mark Completed
                            </button>
                          )}
                        </div>
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
