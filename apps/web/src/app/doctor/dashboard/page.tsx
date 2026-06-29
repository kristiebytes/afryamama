'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { collection, getDocs, limit, query, where, firebaseDb } from '@/lib/firebaseClient';

type DocSnapshotLike = {
  id: string;
  data(): Record<string, unknown>;
};

interface DashboardMetrics {
  activeMothers: number;
  activePregnancies: number;
  todaysAppointments: number;
  infantsMonitored: number;
}

interface AppointmentRow {
  id: string;
  motherName: string;
  contact: string;
  appointmentTime: string;
  reason: string;
  status: string;
  recordLink: string;
}

const emptyMetrics: DashboardMetrics = {
  activeMothers: 0,
  activePregnancies: 0,
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

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [doctorName, setDoctorName] = useState('Doctor');
  const [metrics, setMetrics] = useState<DashboardMetrics>(emptyMetrics);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [nameFilter, setNameFilter] = useState('');
  const [contactFilter, setContactFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
          const firstName = (doctorData.firstName || doctorData.first_name || '').toString().trim();
          const lastName = (doctorData.lastName || doctorData.last_name || '').toString().trim();
          const fullName = `${firstName} ${lastName}`.trim();
          setDoctorName(fullName || user.email || 'Doctor');
        } else {
          setDoctorName(user.email || 'Doctor');
        }

        const [mothersSnapshot, pregnanciesSnapshot, childrenSnapshot, allAppointmentsSnapshot] = await Promise.all([
          getDocs(collection(firebaseDb, 'mothers')),
          getDocs(collection(firebaseDb, 'pregnancies')),
          getDocs(collection(firebaseDb, 'children')),
          getDocs(collection(firebaseDb, 'appointments')),
        ]);

        const motherPhoneById = new Map<string, string>();
        const prenatalMotherIds = new Set<string>();
        mothersSnapshot.docs.forEach((docItem: DocSnapshotLike) => {
          const data = docItem.data() as Record<string, unknown>;
          const phone = (data.phone || data.contact || data.phoneNumber || '').toString().trim();
          if (phone) {
            motherPhoneById.set(docItem.id, phone);
          }

          const status = (data.status || data.maternalStatus || data.stage || '').toString().trim().toUpperCase();
          if (status.includes('PRENATAL') || status.includes('PREG')) {
            prenatalMotherIds.add(docItem.id);
          }
        });

        const pregnancyMotherIds = new Set<string>();
        pregnanciesSnapshot.docs.forEach((docItem: DocSnapshotLike) => {
          const data = docItem.data() as Record<string, unknown>;
          const motherId = (data.motherId || data.mother_id || '').toString().trim();
          const status = (data.status || '').toString().trim().toUpperCase();
          if (!motherId) return;
          if (!status || status === 'ACTIVE' || status === 'ONGOING' || status === 'PREGNANT') {
            pregnancyMotherIds.add(motherId);
          }
        });

        const activePregnancyCount = new Set<string>([
          ...pregnancyMotherIds,
          ...prenatalMotherIds,
        ]).size;

        const today = new Date();
        const todayKey = today.toISOString().slice(0, 10);

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

        const todaysAppointments = doctorAppointments.filter((docItem: DocSnapshotLike) => {
          const data = docItem.data() as Record<string, unknown>;
          const rawDate = (data.dateTime || data.appointmentTime || data.date || '').toString();
          if (!rawDate) return false;
          const parsed = new Date(rawDate);
          if (Number.isNaN(parsed.getTime())) return false;
          return parsed.toISOString().slice(0, 10) === todayKey;
        }).length;

        const rows: AppointmentRow[] = doctorAppointments.slice(0, 8).map((docItem: DocSnapshotLike) => {
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
            contact: motherPhoneById.get(motherId) || (data.phone || data.contact || data.motherPhone || '-').toString(),
            appointmentTime: toTimeLabel(data.dateTime || data.appointmentTime || data.date),
            reason: (data.reason || data.notes || 'Consultation').toString(),
            status: (data.status || 'Pending').toString(),
            recordLink: motherId ? `/records/mother/${motherId}` : '/records',
          };
        });

        setMetrics({
          activeMothers: mothersSnapshot.size,
          activePregnancies: activePregnancyCount,
          todaysAppointments,
          infantsMonitored: childrenSnapshot.size,
        });
        setAppointments(rows);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user?.email, user?.uid]);

  const welcomeName = useMemo(() => {
    if (!doctorName) return 'Doctor';
    return doctorName;
  }, [doctorName]);

  const filteredAppointments = useMemo(() => {
    const nameTerm = nameFilter.trim().toLowerCase();
    const contactTerm = contactFilter.trim().toLowerCase();
    const timeTerm = timeFilter.trim().toLowerCase();
    const reasonTerm = reasonFilter.trim().toLowerCase();
    const statusTerm = statusFilter.trim().toLowerCase();

    if (!nameTerm && !contactTerm && !timeTerm && !reasonTerm && !statusTerm) return appointments;

    return appointments.filter((item) => {
      const nameMatches = !nameTerm || item.motherName.toLowerCase().includes(nameTerm);
      const contactMatches = !contactTerm || item.contact.toLowerCase().includes(contactTerm);
      const timeMatches = !timeTerm || item.appointmentTime.toLowerCase().includes(timeTerm);
      const reasonMatches = !reasonTerm || item.reason.toLowerCase().includes(reasonTerm);
      const statusMatches = !statusTerm || item.status.toLowerCase().includes(statusTerm);
      return nameMatches && contactMatches && timeMatches && reasonMatches && statusMatches;
    });
  }, [appointments, nameFilter, contactFilter, timeFilter, reasonFilter, statusFilter]);

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
            <span className="stat-title">Active Pregnancies</span>
            <div className="stat-value">{loading ? '...' : metrics.activePregnancies.toLocaleString()}</div>
            <span className="stat-desc">
              Current pregnancy records
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
            <span>Upcoming Clinical Consultations</span>
            <button className="btn btn-secondary btn-compact">View All</button>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Mother Name</th>
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
                    <td colSpan={6}>Loading appointments from Firestore...</td>
                  </tr>
                ) : filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No appointments found for the selected filter.</td>
                  </tr>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>{appointment.motherName}</td>
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
