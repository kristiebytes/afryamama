import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { getMotherTips, type MotherTip } from '../lib/motherDataStore';

interface WellnessTipsProps {
  email: string;
  onBack: () => void;
}

export default function WellnessTipsScreen({ email, onBack }: WellnessTipsProps) {
  const [tips, setTips] = useState<MotherTip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRows() {
      try {
        if (!email) {
          setTips([]);
          return;
        }

        const rows = await getMotherTips(email);
        setTips(rows);
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
        <Text style={styles.title}>Wellness Center</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTag}>MOTHER KNOWLEDGE</Text>
          <Text style={styles.heroTitle}>What You Need To Know</Text>
          <Text style={styles.heroText}>Practical wellness guidance curated for your current journey.</Text>
        </View>

        <Text style={styles.sectionTitle}>Daily Guidance Cards</Text>

        {loading ? <Text style={styles.emptyText}>Loading wellness guidance...</Text> : null}

        {!loading && tips.length === 0 ? (
          <Text style={styles.emptyText}>No wellness tips available yet.</Text>
        ) : null}

        {tips.map((tip) => (
          <View style={[styles.tipCard, { backgroundColor: tip.bg, borderColor: tip.border }]} key={tip.id}>
            <Text style={[styles.tipCategory, { color: tip.tagColor }]}>{tip.category}</Text>
            <Text style={styles.tipTitle}>{tip.title}</Text>
            <Text style={styles.tipContent}>{tip.content}</Text>
            
            <TouchableOpacity style={[styles.readMoreBtn, { borderColor: tip.tagColor }]}>
              <Text style={[styles.readMoreText, { color: tip.tagColor }]}>Read full article →</Text>
            </TouchableOpacity>
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
  sectionTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
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
    color: '#64748b',
    fontSize: 13,
    marginBottom: 12,
  },
  tipCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  tipCategory: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  tipTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  tipContent: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  readMoreBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
