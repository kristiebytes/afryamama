import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

interface RecordsProps {
  onBack: () => void;
}

export default function RecordsScreen({ onBack }: RecordsProps) {
  const records = [
    { id: 'mr-1', date: 'June 10, 2026', weight: '72.5 kg', bp: '120/80', hr: '78 bpm', notes: 'Pregnancy progress is normal. Recommended iron supplements, continue light exercise.' },
    { id: 'mr-2', date: 'May 05, 2026', weight: '70.1 kg', bp: '118/78', hr: '74 bpm', notes: 'First prenatal checkup. Blood panels came back clear. Healthy starting weight.' }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Prenatal Checkups</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Maternal Progress Logs</Text>

        {records.map((rec) => (
          <View style={styles.recordCard} key={rec.id}>
            <View style={styles.cardHeader}>
              <Text style={styles.recordDate}>{rec.date}</Text>
              <Text style={styles.clinicName}>AfyaMama Clinic</Text>
            </View>

            <View style={styles.vitalsRow}>
              <View style={styles.vitalBox}>
                <Text style={styles.vitalVal}>{rec.weight}</Text>
                <Text style={styles.vitalLbl}>Weight</Text>
              </View>

              <View style={styles.vitalBox}>
                <Text style={styles.vitalVal}>{rec.bp}</Text>
                <Text style={styles.vitalLbl}>Blood Pressure</Text>
              </View>

              <View style={styles.vitalBox}>
                <Text style={styles.vitalVal}>{rec.hr}</Text>
                <Text style={styles.vitalLbl}>Fetal Heart Rate</Text>
              </View>
            </View>

            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>Clinical Remarks</Text>
              <Text style={styles.notesText}>{rec.notes}</Text>
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
    color: '#ec4899',
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
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  recordCard: {
    backgroundColor: '#121826',
    borderWidth: 1,
    borderColor: '#243049',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#182235',
    paddingBottom: 10,
    marginBottom: 14,
  },
  recordDate: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  clinicName: {
    color: '#ec4899',
    fontSize: 12,
    fontWeight: '600',
  },
  vitalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  vitalBox: {
    flex: 1,
    backgroundColor: '#182235',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  vitalVal: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  vitalLbl: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  notesSection: {
    backgroundColor: '#182235',
    borderRadius: 8,
    padding: 12,
  },
  notesTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  notesText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
});
