import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { fetchImmunizationData, type MobileVaccine } from '../lib/firestoreData';

interface ImmunizationProps {
  email: string;
  onBack: () => void;
}

export default function ImmunizationScreen({ email, onBack }: ImmunizationProps) {
  const [loading, setLoading] = useState(true);
  const [childName, setChildName] = useState('Child Profile');
  const [childBirth, setChildBirth] = useState('Birth date not set');
  const [vaccines, setVaccines] = useState<MobileVaccine[]>([]);

  useEffect(() => {
    async function loadImmunization() {
      try {
        if (!email) {
          setVaccines([]);
          return;
        }

        const payload = await fetchImmunizationData(email.toLowerCase());
        if (payload.child) {
          setChildName(payload.child.childName);
          setChildBirth(payload.child.childBirth);
        }
        setVaccines(payload.vaccines);
      } finally {
        setLoading(false);
      }
    }

    loadImmunization();
  }, [email]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Vaccination Card</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTag}>CHILD PROTECTION</Text>
          <Text style={styles.heroTitle}>Immunizations</Text>
          <Text style={styles.heroText}>Stay ahead of each vaccine dose and keep your baby fully protected.</Text>
        </View>

        <View style={styles.childHeaderCard}>
          <Text style={styles.childIcon}>👶</Text>
          <View>
            <Text style={styles.childName}>{childName}</Text>
            <Text style={styles.childBirth}>Born: {childBirth}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Immunization Schedule</Text>

        {loading ? <Text style={styles.emptyText}>Loading immunization records...</Text> : null}

        {!loading && vaccines.length === 0 ? (
          <Text style={styles.emptyText}>No vaccine records found in Firestore.</Text>
        ) : null}

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
  heroCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c7d7ef',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  heroTag: {
    color: '#16a34a',
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
  childHeaderCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d8e2ef',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 28,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  childIcon: {
    fontSize: 32,
  },
  childName: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
  },
  childBirth: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 2,
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
  vaccineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d8e2ef',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  vaccineDetails: {
    flex: 1,
  },
  vaccineName: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
  },
  vaccineSchedule: {
    color: '#64748b',
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
