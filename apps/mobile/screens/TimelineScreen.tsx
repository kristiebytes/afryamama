import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchTimeline, type MobileTimelineItem } from '../lib/firestoreData';

interface TimelineScreenProps {
  email: string;
  onBack: () => void;
}

type TimelineFilter = 'ALL' | MobileTimelineItem['type'];

const FILTERS: TimelineFilter[] = ['ALL', 'APPOINTMENT', 'MILESTONE', 'VACCINE', 'NOTIFICATION'];

function colorForType(type: MobileTimelineItem['type']): string {
  switch (type) {
    case 'APPOINTMENT':
      return '#8b5cf6';
    case 'MILESTONE':
      return '#22d3ee';
    case 'VACCINE':
      return '#10b981';
    default:
      return '#f59e0b';
  }
}

export default function TimelineScreen({ email, onBack }: TimelineScreenProps) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<MobileTimelineItem[]>([]);
  const [filter, setFilter] = useState<TimelineFilter>('ALL');

  useEffect(() => {
    async function loadTimeline() {
      try {
        if (!email) {
          setRows([]);
          return;
        }

        const items = await fetchTimeline(email.toLowerCase());
        setRows(items);
      } finally {
        setLoading(false);
      }
    }

    loadTimeline();
  }, [email]);

  const filteredRows = useMemo(() => {
    if (filter === 'ALL') return rows;
    return rows.filter((item) => item.type === filter);
  }, [filter, rows]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Care Timeline</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTag}>UNIFIED JOURNEY</Text>
          <Text style={styles.heroTitle}>Timeline View</Text>
          <Text style={styles.heroText}>Appointments, milestones, vaccines, and notifications in one chronological stream.</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((item) => {
            const active = item === filter;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.filterChip, active ? styles.filterChipActive : null]}
                onPress={() => setFilter(item)}
              >
                <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? <Text style={styles.emptyText}>Loading timeline...</Text> : null}

        {!loading && filteredRows.length === 0 ? (
          <Text style={styles.emptyText}>No timeline events found for this profile.</Text>
        ) : null}

        {filteredRows.map((item) => (
          <View style={styles.rowCard} key={item.id}>
            <View style={styles.rowTop}>
              <View style={[styles.typeDot, { backgroundColor: colorForType(item.type) }]} />
              <Text style={styles.rowType}>{item.type}</Text>
              <Text style={styles.rowDate}>{item.date}</Text>
            </View>
            <Text style={styles.rowTitle}>{item.title}</Text>
            <Text style={styles.rowDetail}>{item.detail}</Text>
            <Text style={styles.rowStatus}>Status: {item.status}</Text>
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
    paddingBottom: 36,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c7d7ef',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  heroTag: {
    color: '#0ea5e9',
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
  filterRow: {
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#ffffff',
  },
  filterChipActive: {
    borderColor: '#2563eb',
    backgroundColor: '#dbeafe',
  },
  filterChipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#1d4ed8',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 12,
  },
  rowCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d8e2ef',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  rowType: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    marginRight: 'auto',
  },
  rowDate: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  rowTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  rowDetail: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  rowStatus: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 6,
  },
});
