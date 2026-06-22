import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { type MotherStage } from '../lib/motherProfileStore';

interface DashboardProps {
  userName: string;
  motherCode: string;
  stage: MotherStage;
  pregnancyWeek: string;
  babyAgeMonths: string;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

export default function MotherDashboardScreen({
  userName,
  motherCode,
  stage,
  pregnancyWeek,
  babyAgeMonths,
  onNavigate,
  onLogout,
}: DashboardProps) {
  const isPrenatal = stage === 'PRENATAL';
  const cardHeader = isPrenatal
    ? `Week ${pregnancyWeek || 'Not set'}`
    : `Postnatal ${babyAgeMonths ? `• Baby ${babyAgeMonths} months` : ''}`;
  const cardSub = isPrenatal
    ? 'Prenatal mother profile complete. Continue ANC care plan.'
    : 'Postnatal mother profile complete. Continue baby and mother follow-up.';
  const progress = isPrenatal && pregnancyWeek ? Number.parseInt(pregnancyWeek, 10) : 0;
  const progressPercent = Number.isFinite(progress) ? Math.min(Math.max((progress / 40) * 100, 0), 100) : 0;
  const progressWidth = `${progressPercent}%` as `${number}%`;

  const prioritizedActions = [
    {
      key: 'IMMUNIZATION',
      title: 'Immunizations',
      desc: 'Follow baby vaccine schedule',
      icon: '💉',
      color: '#16a34a',
    },
    {
      key: 'RECORDS',
      title: 'Health Records',
      desc: 'View latest maternal notes',
      icon: '📝',
      color: '#0ea5e9',
    },
    {
      key: 'PROFILE',
      title: 'Profile',
      desc: 'Mother account details',
      icon: '👩',
      color: '#2563eb',
    },
    {
      key: 'SCHEDULE',
      title: 'Schedule',
      desc: 'Weekly care schedule',
      icon: '🗓️',
      color: '#1d4ed8',
    },
    {
      key: 'MILESTONES',
      title: 'Milestones',
      desc: 'Track care milestones',
      icon: '🎯',
      color: '#0284c7',
    },
    {
      key: 'APPOINTMENTS',
      title: 'Appointments',
      desc: 'Check upcoming clinic visits',
      icon: '📅',
      color: '#2563eb',
    },
    {
      key: 'NOTIFICATIONS',
      title: 'Notifications',
      desc: 'Important reminders',
      icon: '🔔',
      color: '#f59e0b',
    },
    {
      key: 'WELLNESS',
      title: 'What You Need To Know',
      desc: 'Daily maternal guidance',
      icon: '📘',
      color: '#f59e0b',
    },
    {
      key: 'GROWTH',
      title: 'Growth Monitoring Charts',
      desc: 'Child growth trend snapshots',
      icon: '📈',
      color: '#0f766e',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>{userName} 👋</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Pregnancy Status Card */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTag}>{isPrenatal ? 'PRENATAL STATUS' : 'POSTNATAL STATUS'}</Text>
        <Text style={styles.cardHeader}>{cardHeader}</Text>
        <Text style={styles.cardSub}>{cardSub}</Text>
        <View style={styles.codeBadge}>
          <Text style={styles.codeBadgeText}>Mother Code: {motherCode}</Text>
        </View>
        
        {/* Simple Progress Bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabelText}>{isPrenatal ? 'Conception' : 'Delivery'}</Text>
          <Text style={styles.progressLabelText}>{Math.round(progressPercent)}%</Text>
          <Text style={styles.progressLabelText}>{isPrenatal ? 'Due Date' : 'Infant Follow-up'}</Text>
        </View>
      </View>

      {/* Quick Action Grid */}
      <Text style={styles.sectionTitle}>Mother Services</Text>
      <View style={styles.grid}>
        {prioritizedActions.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.gridCard}
            onPress={() => onNavigate(item.key)}
          >
            <View style={[styles.gridIconBg, { backgroundColor: item.color }]}>
              <Text style={styles.gridIcon}>{item.icon}</Text>
            </View>
            <Text style={styles.gridTitle}>{item.title}</Text>
            <Text style={styles.gridDesc}>{item.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Next Appointment Alert */}
      <View style={styles.alertBox}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertHeaderIcon}>🔔</Text>
          <Text style={styles.alertHeaderTitle}>Next Care Reminder</Text>
        </View>
        <Text style={styles.alertText}>
          Keep your next clinic visit updated to stay on track with maternal and infant care.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef3f9',
  },
  contentContainer: {
    padding: 24,
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  welcomeText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
  },
  nameText: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 2,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc2626',
    backgroundColor: '#ffffff',
  },
  logoutText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d8e2ef',
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
  },
  cardTag: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  cardHeader: {
    color: '#0f172a',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSub: {
    color: '#475569',
    fontSize: 13,
    marginBottom: 10,
  },
  codeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 12,
  },
  codeBadgeText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 5,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabelText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d8e2ef',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  gridIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridIcon: {
    fontSize: 18,
  },
  gridTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  gridDesc: {
    color: '#475569',
    fontSize: 12,
  },
  alertBox: {
    backgroundColor: '#ffffff',
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertHeaderIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  alertHeaderTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  alertText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
});
