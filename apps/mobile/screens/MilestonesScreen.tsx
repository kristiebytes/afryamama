import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getMotherMilestones, type MotherMilestone } from '../lib/motherDataStore';

interface MilestonesScreenProps {
  email: string;
  onBack: () => void;
}

export default function MilestonesScreen({ email, onBack }: MilestonesScreenProps) {
  const [milestones, setMilestones] = useState<MotherMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRows() {
      try {
        if (!email) {
          setMilestones([]);
          return;
        }

        const rows = await getMotherMilestones(email);
        setMilestones(rows);
      } finally {
        setLoading(false);
      }
    }

    loadRows();
  }, [email]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Milestones</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTag}>TRACKER</Text>
          <Text style={styles.heroTitle}>Milestones</Text>
          <Text style={styles.heroText}>Follow your progress from registration to delivery and postnatal care.</Text>
        </View>

        {loading ? <Text style={styles.emptyText}>Loading milestones...</Text> : null}

        {!loading && milestones.length === 0 ? (
          <Text style={styles.emptyText}>No milestones available yet.</Text>
        ) : null}

        {milestones.map((item) => (
          <View style={styles.card} key={item.id}>
            <Text style={styles.name}>{item.title}</Text>
            <Text style={item.status === 'Completed' ? styles.done : styles.pending}>{item.status}</Text>
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
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 12,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c7d7ef',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  heroTag: {
    color: '#0284c7',
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
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#d8e2ef',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  name: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  done: {
    alignSelf: 'flex-start',
    color: '#15803d',
    backgroundColor: '#dcfce7',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pending: {
    alignSelf: 'flex-start',
    color: '#b45309',
    backgroundColor: '#fef3c7',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
