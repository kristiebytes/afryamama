'use client';

import React, { useEffect, useState } from 'react';
import { collection, doc, getDocs, limit, query, updateDoc, where } from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import { firebaseDb } from '@/lib/firebaseClient';

interface DoctorProfileModel {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  facility: string;
  gender: string;
}

const emptyProfile: DoctorProfileModel = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  facility: '',
  gender: 'Female',
};

export default function DoctorProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<DoctorProfileModel>(emptyProfile);
  const [doctorDocId, setDoctorDocId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!user?.email) return;

      const snapshot = await getDocs(
        query(collection(firebaseDb, 'doctors'), where('email', '==', user.email), limit(1))
      );

      if (snapshot.empty) {
        setProfile((prev) => ({ ...prev, email: user.email || '' }));
        return;
      }

      const row = snapshot.docs[0];
      const data = row.data();
      setDoctorDocId(row.id);
      setProfile({
        firstName: data.firstName || data.first_name || '',
        lastName: data.lastName || data.last_name || '',
        email: data.email || user.email || '',
        phone: data.phone || '',
        facility: data.facility || '',
        gender: data.gender || 'Female',
      });
    }

    loadProfile();
  }, [user?.email]);

  const toggleEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    if (!doctorDocId) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    await updateDoc(doc(firebaseDb, 'doctors', doctorDocId), {
      firstName: profile.firstName.trim(),
      lastName: profile.lastName.trim(),
      phone: profile.phone.trim(),
      facility: profile.facility.trim(),
      gender: profile.gender,
      updatedAt: new Date().toISOString(),
    });
    setSaving(false);
    setIsEditing(false);
  };

  return (
    <main className="main-content">
      <div className="header-container">
        <div>
          <h1 className="page-title">Doctor Profile</h1>
          <p className="page-subtitle">Integrated from your legacy doctor profile module.</p>
        </div>
      </div>

      <div className="content-card" style={{ maxWidth: '760px' }}>
        <form onSubmit={toggleEdit}>
          <div className="grid-two-cols">
            <div className="form-group">
              <label className="form-label" htmlFor="doc-first">First Name</label>
              <input
                id="doc-first"
                className="form-input"
                value={profile.firstName}
                disabled={!isEditing}
                onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="doc-last">Last Name</label>
              <input
                id="doc-last"
                className="form-input"
                value={profile.lastName}
                disabled={!isEditing}
                onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="doc-email">Email Address</label>
            <input id="doc-email" className="form-input" value={profile.email} disabled />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="doc-phone">Phone Number</label>
            <input
              id="doc-phone"
              className="form-input"
              value={profile.phone}
              disabled={!isEditing}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="doc-facility">Facility Name</label>
            <input
              id="doc-facility"
              className="form-input"
              value={profile.facility}
              disabled={!isEditing}
              onChange={(e) => setProfile((p) => ({ ...p, facility: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="doc-gender">Gender</label>
            <select
              id="doc-gender"
              className="form-input"
              value={profile.gender}
              disabled={!isEditing}
              onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))}
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
          </div>

          <button className={`btn ${isEditing ? 'btn-accent' : 'btn-primary'}`} type="submit" disabled={saving}>
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Profile'}
          </button>
        </form>
      </div>
    </main>
  );
}
