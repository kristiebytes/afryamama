import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { fetchChildrenProfiles, fetchGrowthMonitoring, type MobileChildProfile, type MobileGrowthPoint } from '../lib/firestoreData';

interface GrowthMonitoringScreenProps {
  email: string;
  onBack: () => void;
}

function toNumeric(value: string): number {
  const match = value.match(/[0-9]+(\.[0-9]+)?/);
  if (!match) return 0;
  return Number.parseFloat(match[0]);
}

export default function GrowthMonitoringScreen({ email, onBack }: GrowthMonitoringScreenProps) {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<MobileChildProfile[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [rows, setRows] = useState<MobileGrowthPoint[]>([]);

  useEffect(() => {
    async function loadGrowthRows() {
      try {
        if (!email) {
          setRows([]);
          return;
        }

        const loadedChildren = await fetchChildrenProfiles(email.toLowerCase());
        const activeChildId = selectedChildId || loadedChildren[0]?.id || null;
        const items = await fetchGrowthMonitoring(email.toLowerCase(), activeChildId || undefined);
        setChildren(loadedChildren);
        setSelectedChildId(activeChildId);
        setRows(items);
      } finally {
        setLoading(false);
      }
    }

    loadGrowthRows();
  }, [email, selectedChildId]);

  const maxWeight = useMemo(() => {
    if (rows.length === 0) return 0;
    return rows.reduce((max, row) => Math.max(max, toNumeric(row.weight)), 0);
  }, [rows]);

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
          <Text style={styles.heroTag}>CHILD METRICS</Text>
          <Text style={styles.heroTitle}>Growth Monitoring</Text>
          <Text style={styles.heroText}>Follow weight and size trends over time to spot healthy progress early.</Text>
        </View>

        {children.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.switcherRow}>
            {children.map((child) => {
              const active = child.id === selectedChildId;
              return (
                <TouchableOpacity
                  key={child.id}
                  style={[styles.switcherChip, active ? styles.switcherChipActive : null]}
                  onPress={() => setSelectedChildId(child.id)}
                >
                  <Text style={[styles.switcherChipText, active ? styles.switcherChipTextActive : null]}>{child.childName}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        {loading ? <Text style={styles.emptyText}>Loading growth data...</Text> : null}

        {!loading && rows.length === 0 ? (
          <Text style={styles.emptyText}>No growth monitoring rows found in Firestore.</Text>
        ) : null}

        {rows.map((row) => {
          const weight = toNumeric(row.weight);
          const widthPercent = maxWeight > 0 ? Math.max((weight / maxWeight) * 100, 6) : 6;
          return (
            <View key={row.id} style={styles.card}>
              <View style={styles.rowTop}>
                <Text style={styles.date}>{row.date}</Text>
                <Text style={styles.value}>{row.weight}</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.bar, { width: `${widthPercent}%` as `${number}%` }]} />
              </View>
              <Text style={styles.meta}>Height: {row.height}</Text>
              <Text style={styles.meta}>Head Circumference: {row.headCircumference}</Text>
            </View>
          );
        })}
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
  },
  heroTag: {
    color: '#34d399',
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
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 12,
  },
  switcherRow: {
    gap: 8,
    paddingBottom: 10,
  },
  switcherChip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  switcherChipActive: {
    borderColor: '#34d399',
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
  },
  switcherChipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  switcherChipTextActive: {
    color: '#047857',
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#d8e2ef',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  value: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '700',
  },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
    marginBottom: 8,
  },
  bar: {
    height: '100%',
    backgroundColor: '#34d399',
    borderRadius: 999,
  },
  meta: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 2,
  },
});
