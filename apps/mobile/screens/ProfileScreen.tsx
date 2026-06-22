import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { type MotherProfile, type MotherStage } from '../lib/motherProfileStore';

interface ProfileScreenProps {
  profile: MotherProfile | null;
  onBack: () => void;
  onSaveProfile: (profile: MotherProfile) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}

export default function ProfileScreen({ profile, onBack, onSaveProfile, onDeleteAccount }: ProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [stage, setStage] = useState<MotherStage>(profile?.stage || 'PRENATAL');
  const [pregnancyWeek, setPregnancyWeek] = useState(profile?.pregnancyWeek || '');
  const [babyAgeMonths, setBabyAgeMonths] = useState(profile?.babyAgeMonths || '');
  const [county, setCounty] = useState(profile?.county || '');
  const [facility, setFacility] = useState(profile?.facility || '');
  const [emergencyContactName, setEmergencyContactName] = useState(profile?.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(profile?.emergencyContactPhone || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFullName(profile?.fullName || '');
    setPhone(profile?.phone || '');
    setStage(profile?.stage || 'PRENATAL');
    setPregnancyWeek(profile?.pregnancyWeek || '');
    setBabyAgeMonths(profile?.babyAgeMonths || '');
    setCounty(profile?.county || '');
    setFacility(profile?.facility || '');
    setEmergencyContactName(profile?.emergencyContactName || '');
    setEmergencyContactPhone(profile?.emergencyContactPhone || '');
  }, [profile]);

  const rows = [
    { label: 'Mother Code', value: profile?.motherCode || 'Not set' },
    { label: 'Full Name', value: profile?.fullName || 'Not set' },
    { label: 'Email', value: profile?.email || 'Not set' },
    { label: 'Phone', value: profile?.phone || 'Not set' },
    { label: 'Care Stage', value: profile?.stage || 'Not set' },
    { label: 'County', value: profile?.county || 'Not set' },
    { label: 'Facility', value: profile?.facility || 'Not set' },
    { label: 'Emergency Contact', value: profile?.emergencyContactName || 'Not set' },
    { label: 'Emergency Phone', value: profile?.emergencyContactPhone || 'Not set' },
  ];

  async function handleSaveChanges() {
    if (!profile) return;

    if (!fullName.trim() || !phone.trim() || !county.trim() || !facility.trim()) {
      setError('Please fill full name, phone, county and facility.');
      return;
    }

    if (stage === 'PRENATAL' && !pregnancyWeek.trim()) {
      setError('Please provide pregnancy week for prenatal stage.');
      return;
    }

    if (stage === 'POSTNATAL' && !babyAgeMonths.trim()) {
      setError('Please provide baby age in months for postnatal stage.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSaveProfile({
        ...profile,
        fullName: fullName.trim(),
        phone: phone.trim(),
        stage,
        pregnancyWeek: pregnancyWeek.trim(),
        babyAgeMonths: babyAgeMonths.trim(),
        county: county.trim(),
        facility: facility.trim(),
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
      });
      setIsEditing(false);
    } catch {
      setError('Could not save changes to database. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your mother profile and all linked child profiles from the database. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: deleting ? 'Deleting...' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            setError(null);
            try {
              await onDeleteAccount();
            } catch {
              setError('Could not delete account from database. Please try again.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identityCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{(profile?.fullName || 'M').slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.identityContent}>
            <Text style={styles.identityName}>{profile?.fullName || 'Mother Profile'}</Text>
            <Text style={styles.identityMeta}>{profile?.email || 'No email available'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          {rows.map((item) => (
            <View key={item.label} style={styles.row}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.value}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.editCard}>
          <View style={styles.editHeaderRow}>
            <Text style={styles.editTitle}>Edit Profile</Text>
            <TouchableOpacity
              style={[styles.editToggleBtn, isEditing ? styles.editToggleBtnActive : null]}
              onPress={() => {
                setIsEditing((current) => !current);
                setError(null);
              }}
            >
              <Text style={[styles.editToggleBtnText, isEditing ? styles.editToggleBtnTextActive : null]}>
                {isEditing ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <>
              <Text style={styles.inputLabel}>Mother Code (Locked)</Text>
              <TextInput style={[styles.input, styles.inputLocked]} value={profile?.motherCode || ''} editable={false} />

              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

              <Text style={styles.inputLabel}>Care Stage</Text>
              <View style={styles.stageRow}>
                {(['PRENATAL', 'POSTNATAL'] as MotherStage[]).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.stageChip, stage === option ? styles.stageChipActive : null]}
                    onPress={() => setStage(option)}
                  >
                    <Text style={[styles.stageChipText, stage === option ? styles.stageChipTextActive : null]}>
                      {option === 'PRENATAL' ? 'Prenatal' : 'Postnatal'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {stage === 'PRENATAL' ? (
                <>
                  <Text style={styles.inputLabel}>Pregnancy Week</Text>
                  <TextInput
                    style={styles.input}
                    value={pregnancyWeek}
                    onChangeText={setPregnancyWeek}
                    keyboardType="number-pad"
                  />
                </>
              ) : (
                <>
                  <Text style={styles.inputLabel}>Baby Age (Months)</Text>
                  <TextInput
                    style={styles.input}
                    value={babyAgeMonths}
                    onChangeText={setBabyAgeMonths}
                    keyboardType="number-pad"
                  />
                </>
              )}

              <Text style={styles.inputLabel}>County</Text>
              <TextInput style={styles.input} value={county} onChangeText={setCounty} />

              <Text style={styles.inputLabel}>Facility</Text>
              <TextInput style={styles.input} value={facility} onChangeText={setFacility} />

              <Text style={styles.inputLabel}>Emergency Contact Name</Text>
              <TextInput style={styles.input} value={emergencyContactName} onChangeText={setEmergencyContactName} />

              <Text style={styles.inputLabel}>Emergency Contact Phone</Text>
              <TextInput
                style={styles.input}
                value={emergencyContactPhone}
                onChangeText={setEmergencyContactPhone}
                keyboardType="phone-pad"
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
                <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.editHint}>You can edit your profile details, but mother and child codes are locked.</Text>
          )}
        </View>

        {profile?.children?.length ? (
          <View style={styles.childrenCard}>
            <Text style={styles.childrenTitle}>Children Profiles</Text>
            {profile.children.map((child) => (
              <View key={child.childCode || `${child.fullName}-${child.order}`} style={styles.childRow}>
                <Text style={styles.childCode}>{child.childCode || 'No code'}</Text>
                <Text style={styles.childName}>{child.fullName || 'Unnamed child'}</Text>
                <Text style={styles.childMeta}>{child.sex || 'Sex not set'} • {child.birthDate || 'DOB not set'}</Text>
                <Text style={styles.childLockedHint}>Child code is auto-assigned and cannot be edited.</Text>
              </View>
            ))}
          </View>
        ) : null}

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>{deleting ? 'Deleting account...' : 'Delete Account'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef3f9',
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#d8e2ef',
    backgroundColor: '#ffffff',
  },
  backBtn: {
    marginRight: 16,
  },
  backBtnText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    padding: 24,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d8e2ef',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#1d4ed8',
    fontSize: 20,
    fontWeight: '800',
  },
  identityContent: {
    flex: 1,
  },
  identityName: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  identityMeta: {
    color: '#64748b',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#d8e2ef',
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
  },
  label: {
    color: '#475569',
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
  },
  childrenCard: {
    backgroundColor: '#ffffff',
    borderColor: '#d8e2ef',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  editCard: {
    backgroundColor: '#ffffff',
    borderColor: '#d8e2ef',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  editHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  editToggleBtn: {
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  editToggleBtnActive: {
    backgroundColor: '#dbeafe',
  },
  editToggleBtnText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 12,
  },
  editToggleBtnTextActive: {
    color: '#1d4ed8',
  },
  editHint: {
    color: '#475569',
    fontSize: 13,
  },
  inputLabel: {
    color: '#475569',
    fontSize: 12,
    marginBottom: 4,
    marginTop: 10,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0f172a',
  },
  inputLocked: {
    backgroundColor: '#e2e8f0',
    color: '#334155',
  },
  stageRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  stageChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  stageChipActive: {
    borderColor: '#2563eb',
    backgroundColor: '#dbeafe',
  },
  stageChipText: {
    color: '#334155',
    fontWeight: '600',
  },
  stageChipTextActive: {
    color: '#1d4ed8',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  errorText: {
    color: '#dc2626',
    marginTop: 10,
    fontSize: 13,
  },
  childrenTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  childRow: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
  },
  childCode: {
    color: '#0369a1',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  childName: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 1,
  },
  childMeta: {
    color: '#64748b',
    fontSize: 12,
  },
  childLockedHint: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#dc2626',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  deleteButtonText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 14,
  },
});
