import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getMotherSchedule, type MotherScheduleItem } from '../lib/motherDataStore';

interface ScheduleScreenProps {
  email: string;
  onBack: () => void;
}

export default function ScheduleScreen({ email, onBack }: ScheduleScreenProps) {
  const [scheduleItems, setScheduleItems] = useState<MotherScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRows() {
      try {
        if (!email) {
          setScheduleItems([]);
          return;
        }

        const rows = await getMotherSchedule(email);
        setScheduleItems(rows);
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
        <Text style={styles.title}>Schedule</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTag}>WEEK PLAN</Text>
          <Text style={styles.heroTitle}>Care Schedule</Text>
          <Text style={styles.heroText}>Stay organized with your weekly maternal activities and follow-ups.</Text>
        </View>

        {loading ? <Text style={styles.emptyText}>Loading schedule...</Text> : null}

        {!loading && scheduleItems.length === 0 ? (
          <Text style={styles.emptyText}>No schedule entries available yet.</Text>
        ) : null}

        {scheduleItems.map((item) => (
          <View style={styles.timelineRow} key={item.id}>
            <View style={styles.timelineDot} />
            <View style={styles.card}>
              <Text style={styles.day}>{item.day}</Text>
              <Text style={styles.slot}>{item.slot}</Text>
              <Text style={styles.task}>{item.task}</Text>
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
    color: '#1d4ed8',
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
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 10,
  },
  timelineDot: {
    width: 10,
    borderRadius: 5,
    backgroundColor: '#1d4ed8',
    marginRight: 10,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderColor: '#d8e2ef',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  day: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  slot: {
    color: '#1d4ed8',
    fontSize: 13,
    marginTop: 3,
  },
  task: {
    color: '#475569',
    fontSize: 13,
    marginTop: 8,
  },
});
