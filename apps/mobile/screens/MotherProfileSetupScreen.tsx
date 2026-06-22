import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  type ChildProfile,
  type MotherProfile,
  type MotherStage,
  type MultipleBirthType,
} from '../lib/motherProfileStore';

interface MotherProfileSetupScreenProps {
  email: string;
  onBackToLogin: () => void;
  onComplete: (profile: MotherProfile) => Promise<void>;
}

const STAGE_OPTIONS: MotherStage[] = ['PRENATAL', 'POSTNATAL'];
const MULTIPLE_BIRTH_OPTIONS: MultipleBirthType[] = ['SINGLE', 'TWINS', 'TRIPLETS'];

function childCountFromType(multipleBirthType: MultipleBirthType): number {
  if (multipleBirthType === 'TWINS') return 2;
  if (multipleBirthType === 'TRIPLETS') return 3;
  return 1;
}

function buildChildDraft(order: number, multipleBirthType: MultipleBirthType): ChildProfile {
  return {
    childCode: '',
    fullName: '',
    sex: '',
    birthDate: '',
    birthWeightKg: '',
    multipleBirthType,
    order,
  };
}

export default function MotherProfileSetupScreen({
  email,
  onBackToLogin,
  onComplete,
}: MotherProfileSetupScreenProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState<MotherStage>('PRENATAL');
  const [multipleBirthType, setMultipleBirthType] = useState<MultipleBirthType>('SINGLE');
  const [pregnancyWeek, setPregnancyWeek] = useState('');
  const [babyAgeMonths, setBabyAgeMonths] = useState('');
  const [children, setChildren] = useState<ChildProfile[]>([buildChildDraft(1, 'SINGLE')]);
  const [county, setCounty] = useState('');
  const [facility, setFacility] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateMultipleBirthType(nextType: MultipleBirthType) {
    const nextCount = childCountFromType(nextType);
    setMultipleBirthType(nextType);

    setChildren((current) => {
      const nextChildren = Array.from({ length: nextCount }, (_, index) => {
        const existing = current[index];
        if (!existing) return buildChildDraft(index + 1, nextType);
        return {
          ...existing,
          multipleBirthType: nextType,
          order: index + 1,
        };
      });
      return nextChildren;
    });
  }

  function updateChildField(index: number, field: keyof ChildProfile, value: string) {
    setChildren((current) =>
      current.map((child, idx) => (idx === index ? { ...child, [field]: value } : child))
    );
  }

  async function handleSave() {
    if (!fullName.trim() || !phone.trim() || !county.trim() || !facility.trim()) {
      setError('Please fill in full name, phone, county, and facility.');
      return;
    }

    if (stage === 'PRENATAL' && !pregnancyWeek.trim()) {
      setError('Please enter current pregnancy week for prenatal mothers.');
      return;
    }

    if (stage === 'POSTNATAL' && !babyAgeMonths.trim()) {
      setError('Please enter baby age in months for postnatal mothers.');
      return;
    }

    if (stage === 'POSTNATAL') {
      const hasMissingChildName = children.some((child) => !child.fullName.trim());
      if (hasMissingChildName) {
        setError('Please enter each child name for postnatal setup.');
        return;
      }
    }

    setError(null);
    setSaving(true);

    try {
      await onComplete({
        email: email.trim().toLowerCase(),
        motherCode: '',
        fullName: fullName.trim(),
        phone: phone.trim(),
        stage,
        pregnancyWeek: pregnancyWeek.trim(),
        babyAgeMonths: babyAgeMonths.trim(),
        county: county.trim(),
        facility: facility.trim(),
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        children:
          stage === 'POSTNATAL'
            ? children.map((child, index) => ({
                childCode: '',
                fullName: child.fullName.trim(),
                sex: child.sex.trim(),
                birthDate: child.birthDate.trim(),
                birthWeightKg: child.birthWeightKg.trim(),
                multipleBirthType,
                order: index + 1,
              }))
            : [],
        createdAt: new Date().toISOString(),
      });
    } catch {
      setError('Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTag}>ONBOARDING</Text>
          <Text style={styles.heroTitle}>Create your care profile</Text>
          <Text style={styles.heroText}>Tell us about your stage and preferences so we can personalize your dashboard.</Text>
        </View>

        <Text style={styles.title}>Create Mother Profile</Text>
        <Text style={styles.subtitle}>First time sign-in detected for {email}</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Mary Njeri" placeholderTextColor="#94a3b8" />

          <Text style={styles.label}>Phone Number *</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="07XXXXXXXX" placeholderTextColor="#94a3b8" keyboardType="phone-pad" />

          <Text style={styles.label}>Care Stage *</Text>
          <View style={styles.stageRow}>
            {STAGE_OPTIONS.map((option) => (
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
              <Text style={styles.label}>Current Pregnancy Week *</Text>
              <TextInput
                style={styles.input}
                value={pregnancyWeek}
                onChangeText={setPregnancyWeek}
                placeholder="e.g. 24"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Baby Age (Months) *</Text>
              <TextInput
                style={styles.input}
                value={babyAgeMonths}
                onChangeText={setBabyAgeMonths}
                placeholder="e.g. 3"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
              />

              <Text style={styles.label}>Birth Type *</Text>
              <View style={styles.stageRow}>
                {MULTIPLE_BIRTH_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.stageChip,
                      multipleBirthType === option ? styles.stageChipActive : null,
                    ]}
                    onPress={() => updateMultipleBirthType(option)}
                  >
                    <Text
                      style={[
                        styles.stageChipText,
                        multipleBirthType === option ? styles.stageChipTextActive : null,
                      ]}
                    >
                      {option === 'SINGLE' ? 'Single' : option === 'TWINS' ? 'Twins' : 'Triplets'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {children.map((child, index) => (
                <View key={`child-${index + 1}`} style={styles.childCard}>
                  <Text style={styles.childCardTitle}>Child {index + 1}</Text>

                  <Text style={styles.label}>Child Full Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={child.fullName}
                    onChangeText={(value) => updateChildField(index, 'fullName', value)}
                    placeholder={`Baby ${index + 1} name`}
                    placeholderTextColor="#94a3b8"
                  />

                  <Text style={styles.label}>Sex</Text>
                  <TextInput
                    style={styles.input}
                    value={child.sex}
                    onChangeText={(value) => updateChildField(index, 'sex', value)}
                    placeholder="Male / Female"
                    placeholderTextColor="#94a3b8"
                  />

                  <Text style={styles.label}>Date of Birth</Text>
                  <TextInput
                    style={styles.input}
                    value={child.birthDate}
                    onChangeText={(value) => updateChildField(index, 'birthDate', value)}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94a3b8"
                  />

                  <Text style={styles.label}>Birth Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    value={child.birthWeightKg}
                    onChangeText={(value) => updateChildField(index, 'birthWeightKg', value)}
                    placeholder="e.g. 3.2"
                    placeholderTextColor="#94a3b8"
                    keyboardType="decimal-pad"
                  />
                </View>
              ))}
            </>
          )}

          <Text style={styles.label}>County *</Text>
          <TextInput style={styles.input} value={county} onChangeText={setCounty} placeholder="Nairobi" placeholderTextColor="#94a3b8" />

          <Text style={styles.label}>Preferred Facility *</Text>
          <TextInput style={styles.input} value={facility} onChangeText={setFacility} placeholder="AfyaMama Clinic" placeholderTextColor="#94a3b8" />

          <Text style={styles.label}>Emergency Contact Name</Text>
          <TextInput style={styles.input} value={emergencyContactName} onChangeText={setEmergencyContactName} placeholder="John Doe" placeholderTextColor="#94a3b8" />

          <Text style={styles.label}>Emergency Contact Phone</Text>
          <TextInput style={styles.input} value={emergencyContactPhone} onChangeText={setEmergencyContactPhone} placeholder="07XXXXXXXX" placeholderTextColor="#94a3b8" keyboardType="phone-pad" />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save & Continue'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={onBackToLogin}>
            <Text style={styles.backButtonText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef3f9',
  },
  content: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  title: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#475569',
    fontSize: 14,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d8e2ef',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c7d7ef',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  heroTag: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    color: '#0f172a',
    fontSize: 15,
  },
  stageRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
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
  childCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dbe4ef',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  childCardTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  errorText: {
    color: '#ef4444',
    marginTop: 12,
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  backButton: {
    alignItems: 'center',
    paddingTop: 14,
  },
  backButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
});
