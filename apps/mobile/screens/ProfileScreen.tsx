import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { getAuth, signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { firebaseDb as db } from '../lib/firebaseClient';
import { assignDoctorForFacility, reserveDoctorForMother } from '../lib/motherProfileStore';

// ── TYPES ─────────────────────────────────────
type Stage = 'PRENATAL' | 'POSTNATAL';

type ChildProfile = {
  childCode:  string;
  fullName:   string;
  sex:        string;
  birthDate:  string;
  familyLinkId?: string;
};

type MotherProfile = {
  fullName:              string;
  email:                 string;
  phone:                 string;
  motherCode:            string;
  stage:                 Stage;
  pregnancyWeek:         string;
  babyAgeMonths:         string;
  county:                string;
  facility:              string;
  emergencyContactName:  string;
  emergencyContactPhone: string;
  assignedDoctorId?:     string;
  assignedDoctorName?:   string;
  assignedDoctorFacility?: string;
  doctorSwitchStatus?:   string;
  doctorSwitchRequestedAt?: any;
  children?:             ChildProfile[];
  createdAt?:            any;
};

// ── REUSABLE COMPONENTS ───────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'Not set'}</Text>
    </View>
  );
}

function FieldInput({
  label, value, onChange, keyboardType, locked,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: any;
  locked?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}{locked ? ' (locked)' : ''}</Text>
      <TextInput
        style={[styles.input, locked && styles.inputLocked]}
        value={value}
        onChangeText={onChange}
        editable={!locked}
        keyboardType={keyboardType ?? 'default'}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
}

// ── SCREEN ────────────────────────────────────
interface Props {
  email:   string;
  onBack?: () => void;
}

export default function ProfileScreen({ email, onBack }: Props) {
  const auth     = getAuth();
  const motherId = auth.currentUser?.uid ?? '';

  const [profile,  setProfile]  = useState<MotherProfile | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // editable fields
  const [fullName,              setFullName]              = useState('');
  const [phone,                 setPhone]                 = useState('');
  const [stage,                 setStage]                 = useState<Stage>('PRENATAL');
  const [pregnancyWeek,         setPregnancyWeek]         = useState('');
  const [babyAgeMonths,         setBabyAgeMonths]         = useState('');
  const [county,                setCounty]                = useState('');
  const [facility,              setFacility]              = useState('');
  const [emergencyContactName,  setEmergencyContactName]  = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [assignedDoctorName,    setAssignedDoctorName]    = useState('');
  const [assignedDoctorFacility,setAssignedDoctorFacility]= useState('');
  const [requestLoading,        setRequestLoading]        = useState(false);
  const [requestInfo,           setRequestInfo]           = useState<string | null>(null);

  // ── READ ──────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        let data: MotherProfile | null = null;

        const uidCandidates = [doc(db, 'mothers', motherId), doc(db, 'Mothers', motherId)];
        for (const ref of uidCandidates) {
          const snap = await getDoc(ref);
          if (!snap.exists()) continue;
          data = snap.data() as MotherProfile;
          break;
        }

        if (!data) {
          const normalizedEmail = (email || auth.currentUser?.email || '').trim().toLowerCase();
          if (normalizedEmail) {
            const collectionNames = ['mothers', 'Mothers'];
            const emailFields = ['email', 'Email', 'userEmail', 'user_email', 'motherEmail', 'mother_email'];

            for (const collectionName of collectionNames) {
              let found = false;
              for (const emailField of emailFields) {
                try {
                  const snap = await getDocs(
                    query(collection(db, collectionName), where(emailField, '==', normalizedEmail), limit(1))
                  );
                  if (snap.empty) continue;
                  data = snap.docs[0].data() as MotherProfile;
                  found = true;
                  break;
                } catch {
                  // Continue checking other fields.
                }
              }
              if (found) break;
            }
          }
        }

        if (data) {
          if (motherId) {
            await setDoc(
              doc(db, 'mothers', motherId),
              {
                ...data,
                createdAt: data.createdAt || serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          }

          if (!data.createdAt) {
            data.createdAt = new Date().toISOString();
          }

          setProfile(data);
          syncToState(data);
        }
      } catch (e) {
        setError('Could not load profile from database.');
      } finally {
        setLoading(false);
      }
    };
    if (motherId || email) fetchProfile();
  }, [motherId, email]);

  function syncToState(data: MotherProfile) {
    setFullName(data.fullName                       ?? '');
    setPhone(data.phone                             ?? '');
    setStage(data.stage                             ?? 'PRENATAL');
    setPregnancyWeek(data.pregnancyWeek             ?? '');
    setBabyAgeMonths(data.babyAgeMonths             ?? '');
    setCounty(data.county                           ?? '');
    setFacility(data.facility                       ?? '');
    setEmergencyContactName(data.emergencyContactName   ?? '');
    setEmergencyContactPhone(data.emergencyContactPhone ?? '');
    setAssignedDoctorName(data.assignedDoctorName ?? '');
    setAssignedDoctorFacility(data.assignedDoctorFacility ?? '');
  }

  // ── UPDATE ────────────────────────────────
  const saveProfile = async () => {
    if (!fullName.trim() || !phone.trim() || !county.trim() || !facility.trim()) {
      setError('Full name, phone, county and facility are required.');
      return;
    }
    if (stage === 'PRENATAL' && !pregnancyWeek.trim()) {
      setError('Please enter your pregnancy week.');
      return;
    }
    if (stage === 'POSTNATAL' && !babyAgeMonths.trim()) {
      setError('Please enter your baby age in months.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const hasExistingAssignedDoctor = Boolean((profile?.assignedDoctorId || '').trim());
      const doctorMatch = hasExistingAssignedDoctor
        ? {
            doctorId: profile?.assignedDoctorId || '',
            doctorName: profile?.assignedDoctorName || '',
            facility: profile?.assignedDoctorFacility || '',
          }
        : await assignDoctorForFacility(facility.trim(), '');

      const updated: Partial<MotherProfile> = {
        fullName:              fullName.trim(),
        phone:                 phone.trim(),
        stage,
        pregnancyWeek:         pregnancyWeek.trim(),
        babyAgeMonths:         babyAgeMonths.trim(),
        county:                county.trim(),
        facility:              facility.trim(),
        emergencyContactName:  emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        assignedDoctorId:      doctorMatch?.doctorId || '',
        assignedDoctorName:    doctorMatch?.doctorName || '',
        assignedDoctorFacility:doctorMatch?.facility || '',
      };
      await updateDoc(doc(db, 'mothers', motherId), {
        ...updated,
        ...(profile?.createdAt ? {} : { createdAt: serverTimestamp() }),
        updatedAt: serverTimestamp(),
      });

      if (doctorMatch) {
        if (!hasExistingAssignedDoctor) {
          await reserveDoctorForMother(doctorMatch, {
            motherId,
            motherEmail: profile?.email || email,
            motherCode: profile?.motherCode || '',
          });
        }
      }

      setProfile((prev) => prev ? { ...prev, ...updated } : prev);
      setAssignedDoctorName(doctorMatch?.doctorName || '');
      setAssignedDoctorFacility(doctorMatch?.facility || '');
      setRequestInfo(null);
      setEditing(false);
    } catch (e) {
      setError('Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── DELETE ────────────────────────────────
  const handleDelete = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your profile and all linked child records. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, 'mothers', motherId));
      await auth.currentUser?.delete();
    } catch (e) {
      Alert.alert('Error', 'Could not delete account. Please sign in again and retry.');
    }
  };

  const handleSignOut = () => signOut(auth);

  const requestDoctorSwitch = async () => {
    const targetFacility = facility.trim() || profile?.facility?.trim() || '';
    if (!targetFacility) {
      setError('Please set your preferred facility first.');
      return;
    }

    setRequestLoading(true);
    setError(null);
    setRequestInfo(null);

    try {
      const requestedDoctor = await assignDoctorForFacility(targetFacility);
      if (!requestedDoctor) {
        setError('No doctor match found for this facility yet. Try another facility.');
        return;
      }

      if ((profile?.assignedDoctorId || '') === requestedDoctor.doctorId) {
        setRequestInfo(`You are already assigned to ${requestedDoctor.doctorName}.`);
        return;
      }

      await addDoc(collection(db, 'doctor_switch_requests'), {
        motherId,
        motherEmail: profile?.email || email,
        motherName: profile?.fullName || fullName,
        motherCode: profile?.motherCode || '',
        currentDoctorId: profile?.assignedDoctorId || '',
        currentDoctorName: profile?.assignedDoctorName || '',
        currentFacility: profile?.assignedDoctorFacility || profile?.facility || '',
        requestedDoctorId: requestedDoctor.doctorId,
        requestedDoctorName: requestedDoctor.doctorName,
        requestedFacility: requestedDoctor.facility,
        status: 'PENDING',
        requestedAt: new Date().toISOString(),
      });

      await updateDoc(doc(db, 'mothers', motherId), {
        doctorSwitchStatus: 'PENDING',
        doctorSwitchRequestedAt: serverTimestamp(),
        pendingDoctorId: requestedDoctor.doctorId,
        pendingDoctorName: requestedDoctor.doctorName,
        pendingDoctorFacility: requestedDoctor.facility,
        updatedAt: serverTimestamp(),
      });

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              doctorSwitchStatus: 'PENDING',
              doctorSwitchRequestedAt: new Date().toISOString(),
            }
          : prev
      );

      setRequestInfo(`Doctor switch request sent. Proposed doctor: ${requestedDoctor.doctorName} (${requestedDoctor.facility}).`);
    } catch {
      setError('Could not submit switch request. Please try again.');
    } finally {
      setRequestLoading(false);
    }
  };

  const initials = (name: string) =>
    name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // ── LOADING ───────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#55075c" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* AVATAR CARD */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials(profile?.fullName ?? '')}</Text>
          </View>
          <View style={styles.avatarInfo}>
            <Text style={styles.avatarName}>{profile?.fullName || 'Mother Profile'}</Text>
            <Text style={styles.avatarEmail}>{profile?.email || email || '—'}</Text>
            <Text style={styles.avatarJoined}>Joined: {formatDate(profile?.createdAt)}</Text>
          </View>
          <View style={[
            styles.stagePill,
            profile?.stage === 'PRENATAL' ? styles.stagePrenatal : styles.stagePostnatal,
          ]}>
            <Text style={styles.stagePillText}>
              {profile?.stage === 'PRENATAL' ? 'Prenatal' : 'Postnatal'}
            </Text>
          </View>
        </View>

        {/* NO PROFILE STATE */}
        {!profile && (
          <View style={styles.card}>
            <Text style={styles.emptyText}>No profile found for this account.</Text>
          </View>
        )}

        {/* ── VIEW MODE ── */}
        {profile && !editing && (
          <>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Personal Information</Text>
                <TouchableOpacity onPress={() => { setEditing(true); setError(null); }}>
                  <Text style={styles.editLink}>Edit</Text>
                </TouchableOpacity>
              </View>
              {profile.doctorSwitchStatus === 'PENDING' ? (
                <View style={styles.pendingCard}>
                  <Text style={styles.pendingTitle}>Doctor switch request pending</Text>
                  <Text style={styles.pendingText}>We have received your request and are reviewing reassignment.</Text>
                </View>
              ) : null}
              <InfoRow label="Mother Code"  value={profile.motherCode  ?? ''} />
              <InfoRow label="Assigned Doctor" value={profile.assignedDoctorName ?? assignedDoctorName} />
              <InfoRow label="Doctor Facility" value={profile.assignedDoctorFacility ?? assignedDoctorFacility} />
              <InfoRow label="Full Name"    value={profile.fullName    ?? ''} />
              <InfoRow label="Email"        value={profile.email       ?? email} />
              <InfoRow label="Phone"        value={profile.phone       ?? ''} />
              <InfoRow label="County"       value={profile.county      ?? ''} />
              <InfoRow label="Facility"     value={profile.facility    ?? ''} />

              <TouchableOpacity
                style={[styles.switchDoctorBtn, requestLoading && styles.btnDisabled]}
                onPress={requestDoctorSwitch}
                disabled={requestLoading}
              >
                <Text style={styles.switchDoctorBtnText}>
                  {requestLoading ? 'Submitting request...' : 'Request Doctor Switch'}
                </Text>
              </TouchableOpacity>

              {requestInfo ? <Text style={styles.infoText}>{requestInfo}</Text> : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Care Stage</Text>
              <InfoRow label="Stage" value={profile.stage ?? ''} />
              {profile.stage === 'PRENATAL'
                ? <InfoRow label="Pregnancy Week"    value={profile.pregnancyWeek  ?? ''} />
                : <InfoRow label="Baby Age (Months)" value={profile.babyAgeMonths  ?? ''} />
              }
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Emergency Contact</Text>
              <InfoRow label="Name"  value={profile.emergencyContactName  ?? ''} />
              <InfoRow label="Phone" value={profile.emergencyContactPhone ?? ''} />
            </View>

            {profile.children?.length ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Children Profiles</Text>
                {profile.children.map((child, i) => (
                  <View key={child.childCode || i} style={styles.childCard}>
                    <View style={styles.childTop}>
                      <Text style={styles.childCode}>{child.childCode || 'No code'}</Text>
                      <Text style={styles.childSex}>{child.sex || '—'}</Text>
                    </View>
                    <Text style={styles.childName}>{child.fullName || 'Unnamed child'}</Text>
                    <Text style={styles.childDob}>DOB: {child.birthDate || 'Not set'}</Text>
                    <Text style={styles.childDob}>Family Link: {child.familyLinkId || `${profile.motherCode || 'M---'}-${child.childCode || 'B?'}`}</Text>
                    <Text style={styles.childLocked}>Child code is auto-assigned and cannot be edited.</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        )}

        {/* ── EDIT MODE ── */}
        {profile && editing && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => {
                setEditing(false);
                setError(null);
                syncToState(profile);
              }}>
                <Text style={styles.cancelLink}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <FieldInput label="Mother Code" value={profile.motherCode ?? ''} onChange={() => {}} locked />
            <FieldInput label="Assigned Doctor" value={assignedDoctorName || profile.assignedDoctorName || ''} onChange={() => {}} locked />
            <FieldInput label="Doctor Facility" value={assignedDoctorFacility || profile.assignedDoctorFacility || ''} onChange={() => {}} locked />
            <FieldInput label="Full Name"   value={fullName}  onChange={setFullName} />
            <FieldInput label="Email"       value={profile.email ?? email} onChange={() => {}} locked />
            <FieldInput label="Phone"       value={phone}     onChange={setPhone}   keyboardType="phone-pad" />
            <FieldInput label="County"      value={county}    onChange={setCounty} />
            <FieldInput label="Facility"    value={facility}  onChange={setFacility} />

            <Text style={[styles.fieldLabel, { marginTop: 4 }]}>Care Stage</Text>
            <View style={styles.stageRow}>
              {(['PRENATAL', 'POSTNATAL'] as Stage[]).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.stageChip, stage === s && styles.stageChipActive]}
                  onPress={() => setStage(s)}
                >
                  <Text style={[styles.stageChipText, stage === s && styles.stageChipTextActive]}>
                    {s === 'PRENATAL' ? 'Prenatal' : 'Postnatal'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {stage === 'PRENATAL'
              ? <FieldInput label="Pregnancy Week"    value={pregnancyWeek}  onChange={setPregnancyWeek}  keyboardType="number-pad" />
              : <FieldInput label="Baby Age (Months)" value={babyAgeMonths}  onChange={setBabyAgeMonths}  keyboardType="number-pad" />
            }

            <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Emergency Contact</Text>
            <FieldInput label="Contact Name"  value={emergencyContactName}  onChange={setEmergencyContactName} />
            <FieldInput label="Contact Phone" value={emergencyContactPhone} onChange={setEmergencyContactPhone} keyboardType="phone-pad" />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {requestInfo ? <Text style={styles.infoText}>{requestInfo}</Text> : null}

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.btnDisabled]}
              onPress={saveProfile}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>Save Changes</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* SIGN OUT */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* DELETE */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete Account</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// ── STYLES ───────────────────────────────────
const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#F8FAFC' },
  centered:             { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText:          { marginTop: 12, fontSize: 14, color: '#6B7280' },

  header:               { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: '#3a0440' },
  backBtn:              {},
  backBtnText:          { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
  headerTitle:          { fontSize: 22, fontWeight: '800', color: '#fff' },

  content:              { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 50 },

  avatarCard:           { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14, borderWidth: 1, borderColor: '#EBD6ED', shadowColor: '#55075c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  avatarCircle:         { width: 56, height: 56, borderRadius: 28, backgroundColor: '#55075c', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText:           { fontSize: 22, fontWeight: '800', color: '#fff' },
  avatarInfo:           { flex: 1 },
  avatarName:           { fontSize: 17, fontWeight: '800', color: '#1a1a2e' },
  avatarEmail:          { fontSize: 12, color: '#6B7280', marginTop: 2 },
  avatarJoined:         { fontSize: 11, color: '#9CA3AF', marginTop: 3 },
  stagePill:            { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  stagePrenatal:        { backgroundColor: '#f3e8ff' },
  stagePostnatal:       { backgroundColor: '#ecfeff' },
  stagePillText:        { fontSize: 11, fontWeight: '700', color: '#1a1a2e' },

  card:                 { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EBD6ED', shadowColor: '#55075c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#EBD6ED' },
  cardTitle:            { fontSize: 12, fontWeight: '800', color: '#55075c', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10 },
  editLink:             { fontSize: 13, fontWeight: '700', color: '#55075c' },
  cancelLink:           { fontSize: 13, fontWeight: '600', color: '#6B7280' },

  infoRow:              { paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel:            { fontSize: 11, fontWeight: '600', color: '#9CA3AF', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue:            { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  pendingCard:          { backgroundColor: '#fff7ed', borderColor: '#fed7aa', borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 12 },
  pendingTitle:         { color: '#9a3412', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  pendingText:          { color: '#9a3412', fontSize: 12, lineHeight: 17 },
  switchDoctorBtn:      { marginTop: 12, backgroundColor: '#fdf5f9', borderColor: '#EBD6ED', borderWidth: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  switchDoctorBtnText:  { color: '#55075c', fontSize: 13, fontWeight: '700' },

  childCard:            { backgroundColor: '#ffffff', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#EBD6ED' },
  childTop:             { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  childCode:            { fontSize: 11, fontWeight: '700', color: '#55075c' },
  childSex:             { fontSize: 11, color: '#6B7280' },
  childName:            { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
  childDob:             { fontSize: 12, color: '#6B7280' },
  childLocked:          { fontSize: 11, color: '#9CA3AF', marginTop: 6, fontStyle: 'italic' },

  emptyText:            { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 20 },

  fieldWrap:            { marginBottom: 14 },
  fieldLabel:           { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 5 },
  input:                { borderWidth: 1, borderColor: '#EBD6ED', borderRadius: 12, padding: 11, fontSize: 14, color: '#1a1a2e', backgroundColor: '#ffffff' },
  inputLocked:          { backgroundColor: '#F3F4F6', color: '#9CA3AF' },

  stageRow:             { flexDirection: 'row', gap: 10, marginBottom: 14 },
  stageChip:            { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: '#EBD6ED', alignItems: 'center', backgroundColor: '#ffffff' },
  stageChipActive:      { backgroundColor: '#55075c', borderColor: '#55075c' },
  stageChipText:        { fontSize: 13, fontWeight: '600', color: '#374151' },
  stageChipTextActive:  { color: '#fff' },

  errorText:            { color: '#b91c1c', fontSize: 13, marginTop: 10, marginBottom: 4 },
  infoText:             { color: '#0f766e', fontSize: 13, marginTop: 10 },
  saveBtn:              { backgroundColor: '#55075c', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText:          { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnDisabled:          { opacity: 0.6 },

  signOutBtn:           { backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#EBD6ED' },
  signOutText:          { fontSize: 15, fontWeight: '700', color: '#55075c' },

  deleteBtn:            { borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 10 },
  deleteBtnText:        { fontSize: 15, fontWeight: '600', color: '#b91c1c' },
});
