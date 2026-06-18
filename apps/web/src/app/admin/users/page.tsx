'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebaseClient';

interface UserRow {
  name: string;
  email: string;
}

export default function AdminUsersPage() {
  const [role, setRole] = useState<'mother' | 'doctor'>('mother');
  const [mothers, setMothers] = useState<UserRow[]>([]);
  const [doctors, setDoctors] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctorFirstName, setDoctorFirstName] = useState('');
  const [doctorLastName, setDoctorLastName] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('');
  const [doctorMessage, setDoctorMessage] = useState<string | null>(null);
  const [doctorError, setDoctorError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        const [motherSnapshot, doctorSnapshot] = await Promise.all([
          getDocs(collection(firebaseDb, 'mothers')),
          getDocs(collection(firebaseDb, 'doctors')),
        ]);

        const motherRows: UserRow[] = motherSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            name: data.full_name || data.name || 'Unknown Mother',
            email: data.email || '-',
          };
        });

        const doctorRows: UserRow[] = doctorSnapshot.docs.map((doc) => {
          const data = doc.data();
          const firstName = data.firstName || data.first_name || '';
          const lastName = data.lastName || data.last_name || '';
          const fullName = `${firstName} ${lastName}`.trim();
          return {
            name: fullName || data.name || 'Unknown Doctor',
            email: data.email || '-',
          };
        });

        setMothers(motherRows);
        setDoctors(doctorRows);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  const rows = useMemo(() => (role === 'mother' ? mothers : doctors), [doctors, mothers, role]);

  async function addClinician() {
    if (!doctorFirstName.trim() || !doctorLastName.trim() || !doctorEmail.trim()) {
      setDoctorError('First name, last name, and email are required.');
      setDoctorMessage(null);
      return;
    }

    setSaving(true);
    setDoctorError(null);
    setDoctorMessage(null);

    try {
      await addDoc(collection(firebaseDb, 'doctors'), {
        firstName: doctorFirstName.trim(),
        lastName: doctorLastName.trim(),
        email: doctorEmail.trim().toLowerCase(),
        phone: doctorPhone.trim(),
        role: 'DOCTOR',
        createdAt: serverTimestamp(),
        status: 'Active',
      });

      setDoctors((prev) => [
        {
          name: `${doctorFirstName.trim()} ${doctorLastName.trim()}`.trim(),
          email: doctorEmail.trim().toLowerCase(),
        },
        ...prev,
      ]);

      setDoctorFirstName('');
      setDoctorLastName('');
      setDoctorEmail('');
      setDoctorPhone('');
      setDoctorMessage('Clinician added successfully.');
    } catch {
      setDoctorError('Could not add clinician. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="main-content">
      <div className="header-container">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Integrated from your legacy admin users module.</p>
        </div>
      </div>

      <div className="content-card">
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button
            className={`btn ${role === 'mother' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setRole('mother')}
          >
            Mothers
          </button>
          <button
            className={`btn ${role === 'doctor' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setRole('doctor')}
          >
            Doctors
          </button>
        </div>

        {role === 'doctor' ? (
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '12px' }}>Add Clinician</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <input
                className="form-input"
                placeholder="First name"
                value={doctorFirstName}
                onChange={(event) => setDoctorFirstName(event.target.value)}
              />
              <input
                className="form-input"
                placeholder="Last name"
                value={doctorLastName}
                onChange={(event) => setDoctorLastName(event.target.value)}
              />
              <input
                className="form-input"
                placeholder="Email"
                type="email"
                value={doctorEmail}
                onChange={(event) => setDoctorEmail(event.target.value)}
              />
              <input
                className="form-input"
                placeholder="Phone (optional)"
                value={doctorPhone}
                onChange={(event) => setDoctorPhone(event.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button className="btn btn-primary" onClick={addClinician} disabled={saving}>
                {saving ? 'Adding...' : 'Add Clinician'}
              </button>
              {doctorMessage ? <span style={{ color: 'var(--success)' }}>{doctorMessage}</span> : null}
              {doctorError ? <span style={{ color: 'var(--danger)' }}>{doctorError}</span> : null}
            </div>
          </div>
        ) : null}

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={2}>Loading users from Firestore...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={2}>No users found.</td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={`${row.email}-${index}`}>
                    <td style={{ fontWeight: '600' }}>{row.name}</td>
                    <td>{row.email}</td>
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
