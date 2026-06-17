import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

interface ImmunizationProps {
  onBack: () => void;
}

export default function ImmunizationScreen({ onBack }: ImmunizationProps) {
  const vaccines = [
    { id: 'v-1', name: 'BCG (Tuberculosis)', scheduled: 'At birth', administered: 'Oct 02, 2025', status: 'COMPLETED' },
    { id: 'v-2', name: 'OPV 0 (Polio)', scheduled: 'At birth', administered: 'Oct 02, 2025', status: 'COMPLETED' },
    { id: 'v-3', name: 'Pentavalent 1 (DPT, HepB, Hib)', scheduled: '6 Weeks', administered: 'Nov 12, 2025', status: 'COMPLETED' },
    { id: 'v-4', name: 'OPV 1 (Polio oral dose)', scheduled: '6 Weeks', administered: 'Nov 12, 2025', status: 'COMPLETED' },
    { id: 'v-5', name: 'Pentavalent 2', scheduled: '10 Weeks', administered: 'Dec 18, 2025', status: 'COMPLETED' },
    { id: 'v-6', name: 'Measles-Rubella 1', scheduled: '9 Months', administered: undefined, status: 'PENDING' }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Vaccination Card</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.childHeaderCard}>
          <Text style={styles.childIcon}>👶</Text>
          <View>
            <Text style={styles.childName}>Baby Baraka</Text>
            <Text style={styles.childBirth}>Born: Oct 01, 2025 • Male</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Immunization Schedule</Text>

        {vaccines.map((v) => (
          <View style={styles.vaccineRow} key={v.id}>
            <View style={styles.vaccineDetails}>
              <Text style={styles.vaccineName}>{v.name}</Text>
              <Text style={styles.vaccineSchedule}>Recommended: {v.scheduled}</Text>
              {v.administered && (
                <Text style={styles.administeredText}>Given on: {v.administered}</Text>
              )}
            </View>

            <View style={[
              styles.statusIndicator,
              v.status === 'COMPLETED' ? styles.statusSuccess : styles.statusPending
            ]}>
              <Text style={[
                styles.statusText,
                v.status === 'COMPLETED' ? styles.statusTextSuccess : styles.statusTextPending
              ]}>
                {v.status === 'COMPLETED' ? '✓' : '●'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#243049',
  },
  backBtn: {
    marginRight: 16,
  },
  backBtnText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    padding: 24,
  },
  childHeaderCard: {
    backgroundColor: '#121826',
    borderWidth: 1,
    borderColor: '#243049',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 28,
  },
  childIcon: {
    fontSize: 32,
  },
  childName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  childBirth: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  vaccineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121826',
    borderWidth: 1,
    borderColor: '#243049',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  vaccineDetails: {
    flex: 1,
  },
  vaccineName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  vaccineSchedule: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  administeredText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusTextSuccess: {
    color: '#10b981',
  },
  statusTextPending: {
    color: '#f59e0b',
  },
});
