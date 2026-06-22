import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { fetchAppointments, type MobileAppointment } from '../lib/firestoreData';

interface ScheduleScreenProps {
  email: string;
  onBack: () => void;
}

export default function ScheduleScreen({ email, onBack }: ScheduleScreenProps) {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<MobileAppointment[]>([]);

  useEffect(() => {
    async function loadSchedule() {
      try {
        if (!email) {
          setAppointments([]);
          return;
        }

        const rows = await fetchAppointments(email.toLowerCase());
        setAppointments(rows);
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
  }, [email]);

  const grouped = useMemo(() => {
    const upcoming = appointments.filter((item) => item.status !== 'COMPLETED');
    const completed = appointments.filter((item) => item.status === 'COMPLETED');
    return { upcoming, completed };
  }, [appointments]);

  function renderItems(rows: MobileAppointment[]) {
    if (rows.length === 0) {
      return <Text style={styles.emptyText}>No schedule items found.</Text>;
    }

    return rows.map((item) => (
      <View style={styles.card} key={item.id}>
        <Text style={styles.cardTitle}>{item.reason}</Text>
        <Text style={styles.cardMeta}>{item.date} • {item.time}</Text>
        <Text style={styles.cardMeta}>Provider: {item.doctor}</Text>
      </View>
    ));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Schedule</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTag}>CARE TIMELINE</Text>
          <Text style={styles.heroTitle}>My Schedule</Text>
          <Text style={styles.heroText}>Review upcoming visits and follow completed care checkpoints.</Text>
        </View>

        {loading ? <Text style={styles.emptyText}>Loading schedule...</Text> : null}

        {!loading ? (
          <>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            {renderItems(grouped.upcoming)}

            <Text style={styles.sectionTitle}>Completed</Text>
            {renderItems(grouped.completed)}
          </>
        ) : null}
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
    color: '#a78bfa',
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
    marginBottom: 2,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 8,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#d8e2ef',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardMeta: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 2,
  },
});
