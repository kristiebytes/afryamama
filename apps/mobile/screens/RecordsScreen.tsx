import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { fetchRecords, type MobileRecord } from '../lib/firestoreData';

interface RecordsProps {
  email: string;
  onBack: () => void;
}

export default function RecordsScreen({ email, onBack }: RecordsProps) {
  const [records, setRecords] = useState<MobileRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const readingCount = records.length;

  useEffect(() => {
    async function loadRecords() {
      try {
        if (!email) {
          setRecords([]);
          return;
        }

        const rows = await fetchRecords(email.toLowerCase());
        setRecords(rows);
      } finally {
        setLoading(false);
      }
    }

    loadRecords();
  }, [email]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Health Reports</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTag}>CARE RECORDS</Text>
          <Text style={styles.heroTitle}>Clinical Records</Text>
          <Text style={styles.heroText}>Doctor-reported ANC and PNC visit details are shown here.</Text>
          {!loading ? (
            <View style={styles.metricPill}>
              <Text style={styles.metricLabel}>Entries</Text>
              <Text style={styles.metricValue}>{readingCount}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Maternal Progress Logs</Text>

        {loading ? <Text style={styles.emptyText}>Loading records...</Text> : null}

        {!loading && records.length === 0 ? (
          <Text style={styles.emptyText}>No ANC/PNC reports found yet.</Text>
        ) : null}

        {records.map((rec) => (
          <View style={styles.recordCard} key={rec.id}>
            <View style={styles.cardHeader}>
              <Text style={styles.recordDate}>{rec.date}</Text>
              <Text style={styles.clinicName}>Clinical Record</Text>
            </View>

            <View style={styles.vitalsRow}>
              <View style={styles.vitalBox}>
                <Text style={styles.vitalIcon}>⚖️</Text>
                <Text style={styles.vitalVal}>{rec.weight}</Text>
                <Text style={styles.vitalLbl}>Weight</Text>
              </View>

              <View style={styles.vitalBox}>
                <Text style={styles.vitalIcon}>🩺</Text>
                <Text style={styles.vitalVal}>{rec.bp}</Text>
                <Text style={styles.vitalLbl}>Blood Pressure</Text>
              </View>

              <View style={styles.vitalBox}>
                <Text style={styles.vitalIcon}>❤️</Text>
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#3a0440',
  },
  backBtn: {
    marginRight: 4,
  },
  backBtnText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 34,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#EBD6ED',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#55075c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTag: {
    color: '#55075c',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#1a1a2e',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroText: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
  },
  metricPill: {
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: '#fdf5f9',
    borderColor: '#EBD6ED',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
  },
  metricValue: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#1a1a2e',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 12,
  },
  recordCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#EBD6ED',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#55075c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 10,
    marginBottom: 14,
  },
  recordDate: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: '800',
  },
  clinicName: {
    color: '#55075c',
    fontSize: 12,
    fontWeight: '700',
  },
  vitalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  vitalBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EBD6ED',
    padding: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  vitalVal: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  vitalIcon: {
    fontSize: 16,
    marginBottom: 5,
  },
  vitalLbl: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  notesSection: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EBD6ED',
    padding: 12,
  },
  notesTitle: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  notesText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
});
