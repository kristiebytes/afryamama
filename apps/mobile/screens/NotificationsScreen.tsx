import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { fetchNotifications, type MobileNotification } from '../lib/firestoreData';

interface NotificationsScreenProps {
  email: string;
  onBack: () => void;
}

export default function NotificationsScreen({ email, onBack }: NotificationsScreenProps) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MobileNotification[]>([]);

  useEffect(() => {
    async function loadNotifications() {
      try {
        if (!email) {
          setItems([]);
          return;
        }

        const rows = await fetchNotifications(email.toLowerCase());
        setItems(rows);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
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
          <Text style={styles.heroTag}>CARE ALERTS</Text>
          <Text style={styles.heroTitle}>Notifications</Text>
          <Text style={styles.heroText}>Important reminders and updates from your care journey appear here.</Text>
        </View>

        {loading ? <Text style={styles.emptyText}>Loading notifications...</Text> : null}

        {!loading && items.length === 0 ? (
          <Text style={styles.emptyText}>No notifications found in Firestore.</Text>
        ) : null}

        {items.map((item) => (
          <View style={styles.card} key={item.id}>
            <View style={styles.row}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={item.read ? styles.readTag : styles.unreadTag}>{item.read ? 'READ' : 'NEW'}</Text>
            </View>
            <Text style={styles.cardDate}>{item.date} • {item.type}</Text>
            <Text style={styles.cardMessage}>{item.message}</Text>
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
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#d8e2ef',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  unreadTag: {
    color: '#0f172a',
    backgroundColor: '#f59e0b',
    fontSize: 10,
    fontWeight: '700',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  readTag: {
    color: '#334155',
    backgroundColor: '#e2e8f0',
    fontSize: 10,
    fontWeight: '700',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  cardDate: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 6,
  },
  cardMessage: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
});
