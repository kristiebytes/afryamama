'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { addDoc, collection, doc, getDocs, query, updateDoc, where, firebaseDb } from '@/lib/firebaseClient';

interface EmergencyRow {
  id: string;
  motherId: string;
  motherName: string;
  motherEmail: string;
  motherPhone: string;
  reason: string;
  stage: 'PRENATAL' | 'POSTNATAL';
  status: string;
  requestDate: string;
  requestTime: string;
  createdAt: string;
  primaryDoctorEmail: string;
  primaryDoctorUid: string;
  primaryDoctorName: string;
  assignedDoctorEmail: string;
  assignedDoctorUid: string;
  assignedDoctorName: string;
}

function readText(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  return fallback;
}

function toStatus(value: unknown): string {
  const status = readText(value, 'PENDING').toUpperCase();
  if (status === 'CONFIRMED' || status === 'COMPLETED' || status === 'CANCELLED' || status === 'REJECTED') return status;
  return 'PENDING';
}

function toDateLabel(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

function toTimeLabel(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '-';
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (value.includes(':')) return value;
  return '-';
}

function isEmergencyRequest(data: Record<string, unknown>): boolean {
  const source = readText(data.source, '').toUpperCase();
  const requestType = readText(data.requestType, '').toUpperCase();
  const reason = readText(data.reason || data.notes || data.type, '').toLowerCase();
  return source === 'MOTHER_EMERGENCY_REQUEST' || requestType === 'EMERGENCY' || reason.includes('emergency');
}

function getRecordPath(row: EmergencyRow): string {
  if (!row.motherId) return '/records';
  return row.stage === 'POSTNATAL' ? `/records/mother/${row.motherId}` : `/records/anc/${row.motherId}`;
}

function isUnresolvedStatus(status: string): boolean {
  return status === 'PENDING' || status === 'CONFIRMED';
}

export default function DoctorEmergencyPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rows, setRows] = useState<EmergencyRow[]>([]);
  const [doctorName, setDoctorName] = useState('Doctor');

  const userEmail = user?.email?.trim().toLowerCase() || '';

  async function resolveDoctorName(): Promise<string> {
    if (!user?.email) return user?.displayName || 'Doctor';

    try {
      const doctorSnap = await getDocs(query(collection(firebaseDb, 'doctors'), where('email', '==', user.email)));
      if (!doctorSnap.empty) {
        const doctorData = doctorSnap.docs[0].data() as Record<string, unknown>;
        const firstName = readText(doctorData.firstName || doctorData.first_name, '');
        const lastName = readText(doctorData.lastName || doctorData.last_name, '');
        const fullName = `${firstName} ${lastName}`.trim();
        return fullName || readText(doctorData.fullName || doctorData.name, user.displayName || 'Doctor');
      }
    } catch {
      return user.displayName || 'Doctor';
    }

    return user.displayName || 'Doctor';
  }

  async function loadEmergencyRequests() {
    if (!user?.uid || !user?.email) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [appointmentsSnap, resolvedDoctorName] = await Promise.all([
        getDocs(collection(firebaseDb, 'appointments')),
        resolveDoctorName(),
      ]);

      setDoctorName(resolvedDoctorName);

      const mappedRows: EmergencyRow[] = appointmentsSnap.docs
        .filter((docItem) => isEmergencyRequest(docItem.data() as Record<string, unknown>))
        .map((docItem) => {
          const data = docItem.data() as Record<string, unknown>;
          const stageRaw = readText(data.stage || data.appointmentStage || data.careStage, '').toUpperCase();
          const stage: 'PRENATAL' | 'POSTNATAL' = stageRaw === 'POSTNATAL' ? 'POSTNATAL' : 'PRENATAL';
          const dateSource = data.dateTime || data.appointmentDate || data.date || data.createdAt;
          const primaryDoctorEmail = readText(
            data.primaryDoctorEmail || data.assignedDoctorEmail || data.doctorEmail || data.doctor_email,
            ''
          ).toLowerCase();
          const primaryDoctorUid = readText(
            data.primaryDoctorUid || data.primaryDoctorId || data.assignedDoctorId || data.doctorUid || data.doctorId || data.doctor_uid,
            ''
          );
          const primaryDoctorName = readText(
            data.primaryDoctorName || data.assignedDoctorName || data.doctorName || data.provider || data.doctor,
            ''
          );
          const assignedDoctorEmail = readText(data.doctorEmail || data.doctor_email, '').toLowerCase() || primaryDoctorEmail;
          const assignedDoctorUid = readText(data.doctorUid || data.doctor_uid || data.doctorId, '') || primaryDoctorUid;
          const assignedDoctorName = readText(data.doctorName || data.provider || data.doctor, '') || primaryDoctorName;

          return {
            id: docItem.id,
            motherId: readText(data.motherId || data.mother_id, ''),
            motherName: readText(data.motherName || data.patientName || data.name, 'Mother'),
            motherEmail: readText(data.motherEmail || data.email || data.userEmail, '-'),
            motherPhone: readText(data.motherPhone || data.phone || data.contact, '-'),
            reason: readText(data.reason || data.notes || data.type, 'Emergency consultation request'),
            stage,
            status: toStatus(data.status),
            requestDate: toDateLabel(dateSource),
            requestTime: toTimeLabel(data.appointmentTime || dateSource),
            createdAt: readText(data.createdAt, ''),
            primaryDoctorEmail,
            primaryDoctorUid,
            primaryDoctorName,
            assignedDoctorEmail,
            assignedDoctorUid,
            assignedDoctorName,
          };
        })
        .filter((item) => {
          const isUnresolved = isUnresolvedStatus(item.status);
          if (isUnresolved) return true;

          const isAssignedToMe = item.assignedDoctorEmail === userEmail || item.assignedDoctorUid === user.uid;
          const amPrimaryDoctor = item.primaryDoctorEmail === userEmail || item.primaryDoctorUid === user.uid;
          return isAssignedToMe || amPrimaryDoctor;
        })
        .sort((a, b) => {
          const statusPriority = (status: string): number => {
            if (status === 'PENDING') return 0;
            if (status === 'CONFIRMED') return 1;
            if (status === 'COMPLETED') return 3;
            return 2;
          };
          const byStatus = statusPriority(a.status) - statusPriority(b.status);
          if (byStatus !== 0) return byStatus;
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        });

      setRows(mappedRows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmergencyRequests();
  }, [user?.uid, user?.email]);

  async function applyAction(row: EmergencyRow, action: 'TAKE' | 'CONTACTED' | 'RESOLVED') {
    if (!user?.uid || !user?.email) return;

    setSavingId(row.id);
    try {
      const patch: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };

      if (action === 'TAKE') {
        patch.doctorUid = user.uid;
        patch.doctorId = user.uid;
        patch.doctorEmail = user.email;
        patch.doctorName = doctorName;
        patch.emergencyAction = 'TAKEN';
        patch.emergencyAssignedAt = new Date().toISOString();

        const primaryChanged =
          Boolean(row.primaryDoctorEmail || row.primaryDoctorUid) &&
          row.primaryDoctorEmail !== userEmail &&
          row.primaryDoctorUid !== user.uid;

        if (primaryChanged && row.motherEmail && row.motherEmail !== '-') {
          await addDoc(collection(firebaseDb, 'notifications'), {
            title: 'Emergency doctor update',
            message: `Your emergency request is now being handled by ${doctorName}.`,
            audience: 'MOTHER',
            email: row.motherEmail.toLowerCase(),
            motherEmail: row.motherEmail.toLowerCase(),
            type: 'DOCTOR_CHANGE',
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      }

      if (action === 'CONTACTED') {
        patch.doctorUid = user.uid;
        patch.doctorId = user.uid;
        patch.doctorEmail = user.email;
        patch.doctorName = doctorName;
        patch.status = 'CONFIRMED';
        patch.emergencyAction = 'CONTACTED';
        patch.emergencyContactedAt = new Date().toISOString();
      }

      if (action === 'RESOLVED') {
        patch.doctorUid = user.uid;
        patch.doctorId = user.uid;
        patch.doctorEmail = user.email;
        patch.doctorName = doctorName;
        patch.status = 'COMPLETED';
        patch.emergencyAction = 'RESOLVED';
        patch.emergencyResolvedAt = new Date().toISOString();
      }

      await updateDoc(doc(firebaseDb, 'appointments', row.id), patch);
      await loadEmergencyRequests();
    } finally {
      setSavingId(null);
    }
  }

  const pendingCount = useMemo(() => rows.filter((row) => row.status === 'PENDING').length, [rows]);
  const mineCount = useMemo(
    () => rows.filter((row) => row.assignedDoctorEmail === userEmail || row.assignedDoctorUid === user?.uid).length,
    [rows, user?.uid, userEmail]
  );

  return (
    <main className="main-content">
      <div className="header-container">
        <div>
          <h1 className="page-title">Emergency Requests</h1>
          <p className="page-subtitle">Mothers emergency bookings from mobile app. Open a case, contact the mother, then record care.</p>
        </div>
      </div>

      <div className="card-grid">
        <div className="stat-card">
          <span className="stat-title">Open Emergency Requests</span>
          <div className="stat-value">{loading ? '...' : pendingCount}</div>
          <span className="stat-desc">Requests still waiting for doctor action</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Assigned To Me</span>
          <div className="stat-value">{loading ? '...' : mineCount}</div>
          <span className="stat-desc">Emergency requests owned by your account</span>
        </div>
      </div>

      <div className="table-wrapper" style={{ marginTop: 20 }}>
        <div className="table-header" style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Mother Emergency Queue</h2>
        </div>

        {loading ? (
          <div style={{ padding: 16 }}>Loading emergency requests...</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 16, color: '#64748b' }}>No emergency requests found for your queue.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Mother</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Contact</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Requested</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Reason</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isMine = row.assignedDoctorEmail === userEmail || row.assignedDoctorUid === user?.uid;
                  const isUnresolved = isUnresolvedStatus(row.status);
                  const canTakeCase = isUnresolved && !isMine;
                  const saving = savingId === row.id;
                  const statusClass =
                    row.status === 'PENDING'
                      ? 'badge-warning'
                      : row.status === 'COMPLETED'
                        ? 'badge-success'
                        : 'badge-info';

                  return (
                    <tr key={row.id}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600 }}>{row.motherName}</div>
                        <div style={{ color: '#64748b', fontSize: 12 }}>{row.stage}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div>{row.motherPhone}</div>
                        <div style={{ color: '#64748b', fontSize: 12 }}>{row.motherEmail}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div>{row.requestDate}</div>
                        <div style={{ color: '#64748b', fontSize: 12 }}>{row.requestTime}</div>
                      </td>
                      <td style={{ padding: '12px', maxWidth: 280 }}>{row.reason}</td>
                      <td style={{ padding: '12px' }}>
                        <span className={`status-badge ${statusClass}`}>{row.status}</span>
                        <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                          {row.assignedDoctorName ? `Handling doctor: ${row.assignedDoctorName}` : 'Unassigned'}
                        </div>
                        <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                          {row.primaryDoctorName ? `Primary doctor: ${row.primaryDoctorName}` : 'Primary doctor not set'}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {canTakeCase ? (
                            <button className="btn btn-outline-primary" disabled={saving} onClick={() => applyAction(row, 'TAKE')}>
                              {saving ? 'Saving...' : 'Take Case'}
                            </button>
                          ) : null}

                          <button className="btn btn-outline-secondary" disabled={saving || !isMine} onClick={() => applyAction(row, 'CONTACTED')}>
                            {saving ? 'Saving...' : 'Mark Contacted'}
                          </button>

                          <button className="btn btn-outline-success" disabled={saving || !isMine} onClick={() => applyAction(row, 'RESOLVED')}>
                            {saving ? 'Saving...' : 'Mark Resolved'}
                          </button>

                          <Link className="btn btn-outline-dark" href={getRecordPath(row)}>
                            Record Visit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
