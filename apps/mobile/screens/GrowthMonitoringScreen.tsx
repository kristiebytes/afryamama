import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getMotherGrowthRows, type MotherGrowthRow } from '../lib/motherDataStore';

interface GrowthMonitoringScreenProps {
  email: string;
  onBack: () => void;
}

export default function GrowthMonitoringScreen({ email, onBack }: GrowthMonitoringScreenProps) {
  const [growthRows, setGrowthRows] = useState<MotherGrowthRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRows() {
      try {
        if (!email) {
          setGrowthRows([]);
          return;
        }

        const rows = await getMotherGrowthRows(email);
        setGrowthRows(rows);
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
        <Text style={styles.title}>Growth Monitoring Charts</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTag}>CHILD DEVELOPMENT</Text>
          <Text style={styles.heroTitle}>Growth Monitoring</Text>
          <Text style={styles.heroText}>Review growth trends over time with weight and height indicators.</Text>
        </View>

        {loading ? <Text style={styles.emptyText}>Loading growth monitoring charts...</Text> : null}

        {!loading && growthRows.length === 0 ? (
          <Text style={styles.emptyText}>No growth chart entries available yet.</Text>
        ) : null}

        {growthRows.map((row) => (
          <View key={row.id} style={styles.card}>
            <Text style={styles.month}>{row.month}</Text>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Weight</Text>
              <Text style={styles.metricValue}>{row.weight}</Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Height</Text>
              <Text style={styles.metricValue}>{row.height}</Text>
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
    color: '#0f766e',
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
  month: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  metricBlock: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dbe4ef',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  metricValue: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
});
