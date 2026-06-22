import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getMotherNotifications, type MotherNotification } from '../lib/motherDataStore';

interface NotificationsScreenProps {
  email: string;
  onBack: () => void;
}

export default function NotificationsScreen({ email, onBack }: NotificationsScreenProps) {
  const [notifications, setNotifications] = useState<MotherNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRows() {
      try {
        if (!email) {
          setNotifications([]);
          return;
        }

        const rows = await getMotherNotifications(email);
        setNotifications(rows);
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
        <Text style={styles.title}>Notifications</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTag}>ALERT CENTER</Text>
          <Text style={styles.heroTitle}>Notifications</Text>
          <Text style={styles.heroText}>Timely reminders for appointments, medication, and child care tasks.</Text>
        </View>

        {loading ? <Text style={styles.emptyText}>Loading notifications...</Text> : null}

        {!loading && notifications.length === 0 ? (
          <Text style={styles.emptyText}>No notifications available yet.</Text>
        ) : null}

        {notifications.map((item) => (
          <View style={styles.card} key={item.id}>
            <Text style={styles.cardTitle}>🔔 {item.title}</Text>
            <Text style={styles.cardBody}>{item.body}</Text>
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
    color: '#f59e0b',
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
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardBody: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
});
