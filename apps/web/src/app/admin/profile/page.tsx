'use client';

import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import { firebaseDb } from '@/lib/firebaseClient';

interface AdminProfileModel {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
}

const defaultProfile: AdminProfileModel = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  title: '',
};

export default function AdminProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<AdminProfileModel>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [documentPath, setDocumentPath] = useState<{ collectionName: string; docId: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      const canonicalCollection = 'Admins';
      const canonicalDocId = user.uid || user.email || 'admin-profile';
      const canonicalRef = doc(firebaseDb, canonicalCollection, canonicalDocId);
      const canonicalDoc = await getDoc(canonicalRef);

      if (canonicalDoc.exists()) {
        const data = canonicalDoc.data();
        setProfile({
          firstName: data.firstName || data.first_name || '',
          lastName: data.lastName || data.last_name || '',
          email: data.email || user.email,
          phone: data.phone || '',
          title: data.title || data.role || data.Role || 'ADMIN',
        });
        setDocumentPath({ collectionName: canonicalCollection, docId: canonicalDocId });
        setLoading(false);
        return;
      }

      const collections = ['Admins', 'admins'];
      let matchedData: Record<string, unknown> | null = null;
      let matchedPath: { collectionName: string; docId: string } | null = null;

      for (const name of collections) {
        const candidate = await getDocs(
          query(collection(firebaseDb, name), where('email', '==', user.email), limit(1))
        );
        if (!candidate.empty) {
          matchedData = candidate.docs[0].data() as Record<string, unknown>;
          matchedPath = { collectionName: name, docId: candidate.docs[0].id };
          break;
        }
      }

      if (!matchedData || !matchedPath) {
        setProfile((prev) => ({ ...prev, email: user.email || prev.email, title: prev.title || 'ADMIN' }));
        setDocumentPath({ collectionName: canonicalCollection, docId: canonicalDocId });
        setLoading(false);
        return;
      }

      setProfile({
        firstName: matchedData.firstName || matchedData.first_name || '',
        lastName: matchedData.lastName || matchedData.last_name || '',
        email: matchedData.email || user.email,
        phone: matchedData.phone || '',
        title: matchedData.title || matchedData.role || matchedData.Role || 'ADMIN',
      });
      setDocumentPath(matchedPath);
      setLoading(false);
    }

    loadProfile();
  }, [user?.email, user?.uid]);

  async function saveProfile() {
    if (!user?.email) {
      setSaveError('You must be logged in to update profile.');
      setSaveMessage(null);
      return;
    }

    const targetCollection = documentPath?.collectionName || 'Admins';
    const targetDocId = documentPath?.docId || user.uid || user.email;
    const isNewDocument = !documentPath;

    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const payload: Record<string, unknown> = {
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        email: user.email,
        phone: profile.phone.trim(),
        title: profile.title.trim(),
        role: 'ADMIN',
        updatedAt: serverTimestamp(),
        uid: user.uid,
      };

      if (isNewDocument) {
        payload.createdAt = serverTimestamp();
      }

      await setDoc(doc(firebaseDb, targetCollection, targetDocId), payload, { merge: true });

      setSaveMessage('Profile updated successfully.');
    } catch {
      setSaveError('Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function onFieldChange(field: keyof AdminProfileModel, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
    if (saveMessage) setSaveMessage(null);
    if (saveError) setSaveError(null);
  }

  return (
    <main className="main-content">
      <div className="header-container">
        <div>
          <h1 className="page-title">Admin Profile</h1>
          <p className="page-subtitle">Integrated from your legacy admin profile module.</p>
        </div>
      </div>

      <div className="content-card" style={{ maxWidth: '760px' }}>
        <div className="card-header">
          <span>Profile Details</span>
        </div>

        <div className="grid-two-cols">
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input
              className="form-input"
              value={loading ? 'Loading...' : profile.firstName}
              onChange={(event) => onFieldChange('firstName', event.target.value)}
              readOnly={loading}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input
              className="form-input"
              value={loading ? 'Loading...' : profile.lastName}
              onChange={(event) => onFieldChange('lastName', event.target.value)}
              readOnly={loading}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={loading ? 'Loading...' : profile.email} readOnly />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              className="form-input"
              value={loading ? 'Loading...' : profile.phone}
              onChange={(event) => onFieldChange('phone', event.target.value)}
              readOnly={loading}
            />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Role</label>
            <input
              className="form-input"
              value={loading ? 'Loading...' : profile.title}
              onChange={(event) => onFieldChange('title', event.target.value)}
              readOnly={loading}
            />
          </div>
        </div>

        <div className="action-row">
          <button className="btn btn-primary" onClick={saveProfile} disabled={loading || saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>

          {saveMessage ? <span style={{ color: 'var(--success)' }}>{saveMessage}</span> : null}
          {saveError ? <span style={{ color: 'var(--danger)' }}>{saveError}</span> : null}
        </div>
      </div>
    </main>
  );
}
