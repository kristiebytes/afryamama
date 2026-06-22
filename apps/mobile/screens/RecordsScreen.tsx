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
        <Text style={styles.title}>Prenatal Checkups</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTag}>MOTHER HEALTH</Text>
          <Text style={styles.heroTitle}>Clinical Records</Text>
          <Text style={styles.heroText}>View your checkup history, vitals, and care notes in one place.</Text>
        </View>

        <Text style={styles.sectionTitle}>Maternal Progress Logs</Text>

        {loading ? <Text style={styles.emptyText}>Loading records...</Text> : null}

        {!loading && records.length === 0 ? (
          <Text style={styles.emptyText}>No prenatal records found in Firestore.</Text>
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
  sectionTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 12,
  },
  recordCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d8e2ef',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
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
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  clinicName: {
    color: '#0ea5e9',
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
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbe4ef',
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
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbe4ef',
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
