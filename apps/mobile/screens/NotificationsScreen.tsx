import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { fetchNotifications, type MobileNotification } from '../lib/firestoreData';
import { firebaseDb } from '../lib/firebaseClient';

interface NotificationsScreenProps {
  email: string;
  onBack: () => void;
}

export default function NotificationsScreen({ email, onBack }: NotificationsScreenProps) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MobileNotification[]>([]);
  const unreadCount = items.filter((item) => !item.read).length;

  async function markAllAsRead(rows: MobileNotification[]) {
    const unreadRows = rows.filter((item) => !item.read);
    if (unreadRows.length === 0) return;

    setItems((current) => current.map((item) => ({ ...item, read: true })));

    const collectionNames = ['notifications', 'Notifications'];
    for (const row of unreadRows) {
      for (const collectionName of collectionNames) {
        try {
          await updateDoc(doc(firebaseDb, collectionName, row.id), { read: true });
          break;
        } catch {
          // Try next collection variant.
        }
      }
    }
  }

  useEffect(() => {
    async function loadNotifications() {
      try {
        if (!email) {
          setItems([]);
          return;
        }

        const rows = await fetchNotifications(email.toLowerCase());
        setItems(rows);
        await markAllAsRead(rows);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, [email]);

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.heroSub}>Important reminders and care alerts from your clinic.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTag}>CARE ALERTS</Text>
          <Text style={styles.heroTitle}>Your Updates</Text>
          <Text style={styles.heroText}>Unread items are marked and automatically set as read when opened.</Text>
          {!loading ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>{unreadCount} unread alerts</Text>
              {unreadCount > 0 ? <Text style={styles.summaryPing}>PING</Text> : null}
            </View>
          ) : null}
        </View>

        {loading ? (
          <>
            <View style={styles.skeletonCard} />
            <View style={styles.skeletonCard} />
          </>
        ) : null}

        {!loading && items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>You are all caught up. New alerts will appear here.</Text>
          </View>
        ) : null}

        {items.map((item) => (
          <View style={styles.card} key={item.id}>
            <View style={styles.row}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.tagRow}>
                {!item.read ? <Text style={styles.pingTag}>PING</Text> : null}
                <Text style={item.read ? styles.readTag : styles.unreadTag}>{item.read ? 'READ' : 'NEW'}</Text>
              </View>
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
    backgroundColor: '#F8FAFC',
  },
  hero: {
    paddingTop: 52,
    paddingBottom: 18,
    paddingHorizontal: 20,
    backgroundColor: '#3a0440',
  },
  backBtn: {
    marginBottom: 12,
  },
  backBtnText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  heroSub: {
    marginTop: 6,
    color: '#f5b8e8',
    fontSize: 13,
    lineHeight: 18,
  },
  content: {
    padding: 18,
    paddingBottom: 34,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#EBD6ED',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#55075c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTag: {
    color: '#55075c',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#1a1a2e',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroText: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
  },
  summaryRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    color: '#1a1a2e',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryPing: {
    color: '#ffffff',
    backgroundColor: '#55075c',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 0,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#EBD6ED',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  skeletonCard: {
    height: 92,
    backgroundColor: '#e2e8f0',
    borderRadius: 18,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#EBD6ED',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#55075c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pingTag: {
    color: '#ffffff',
    backgroundColor: '#ef4444',
    fontSize: 9,
    fontWeight: '800',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    letterSpacing: 0.6,
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  unreadTag: {
    color: '#fff',
    backgroundColor: '#55075c',
    fontSize: 10,
    fontWeight: '700',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  readTag: {
    color: '#334155',
    backgroundColor: '#f3e8ff',
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
