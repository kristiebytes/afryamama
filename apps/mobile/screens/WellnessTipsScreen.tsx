import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

interface WellnessTipsProps {
  onBack: () => void;
}

export default function WellnessTipsScreen({ onBack }: WellnessTipsProps) {
  const tips = [
    {
      id: 'wt-1',
      title: 'Importance of Folic Acid',
      category: 'PRENATAL NUTRITION',
      content: 'Folic acid helps prevent neural tube defects in your developing baby. It is recommended to take 400 mcg daily before conception and throughout the first trimester. Focus on foods like leafy greens, citrus, and beans.',
      bg: 'rgba(139, 92, 246, 0.1)',
      border: 'rgba(139, 92, 246, 0.2)',
      tagColor: '#8b5cf6'
    },
    {
      id: 'wt-2',
      title: 'Staying Hydrated During Pregnancy',
      category: 'MATERNAL HEALTH',
      content: 'Expectant mothers should aim for at least 8 to 10 glasses of water daily. Proper hydration supports amniotic fluid levels, improves circulation, and decreases the risk of urinary tract infections.',
      bg: 'rgba(236, 72, 153, 0.1)',
      border: 'rgba(236, 72, 153, 0.2)',
      tagColor: '#ec4899'
    },
    {
      id: 'wt-3',
      title: 'Preparing for Exclusive Breastfeeding',
      category: 'INFANT NUTRITION',
      content: 'Breast milk provides optimal nutrition and critical antibodies for the first six months. Learn latching techniques and consult with your midwife or pediatrician to set up a comfortable nursing routine early.',
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.2)',
      tagColor: '#10b981'
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Wellness Center</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Daily Guidance Cards</Text>

        {tips.map((tip) => (
          <View style={[styles.tipCard, { backgroundColor: tip.bg, borderColor: tip.border }]} key={tip.id}>
            <Text style={[styles.tipCategory, { color: tip.tagColor }]}>{tip.category}</Text>
            <Text style={styles.tipTitle}>{tip.title}</Text>
            <Text style={styles.tipContent}>{tip.content}</Text>
            
            <TouchableOpacity style={styles.readMoreBtn}>
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
    backgroundColor: '#0b0f19',
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#243049',
  },
  backBtn: {
    marginRight: 16,
  },
  backBtnText: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  tipCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  tipCategory: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  tipTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  tipContent: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  readMoreBtn: {
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
