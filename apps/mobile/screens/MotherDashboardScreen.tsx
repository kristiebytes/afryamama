import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { type MotherStage } from '../lib/motherProfileStore';

interface DashboardProps {
  userName: string;
  pregnancyWeek: number | null;
  nextAppointmentText: string | null;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

export default function MotherDashboardScreen({
  userName,
  pregnancyWeek,
  nextAppointmentText,
  onNavigate,
  onLogout,
}: DashboardProps) {
  const weekLabel = pregnancyWeek ? `Week ${pregnancyWeek}` : 'Pregnancy tracking pending';
  const progressPercent = pregnancyWeek ? Math.min(Math.max((pregnancyWeek / 40) * 100, 0), 100) : 0;
  const progressWidth = `${progressPercent}%` as `${number}%`;

  const menuItems = [
    {
      screen: 'IMMUNIZATION',
      color: '#10b981',
      icon: '💉',
      title: 'Immunizations',
      desc: 'Child vaccine schedule',
    },
    {
      screen: 'RECORDS',
      color: '#ec4899',
      icon: '📝',
      title: 'Health Records',
      desc: 'Prenatal checkup logs',
    },
    {
      screen: 'PROFILE',
      color: '#38bdf8',
      icon: '👩',
      title: 'Profile',
      desc: 'Mother account details',
    },
    {
      screen: 'SCHEDULE',
      color: '#a78bfa',
      icon: '🗓️',
      title: 'Schedule',
      desc: 'Clinic visit timeline',
    },
    {
      screen: 'MILESTONES',
      color: '#22d3ee',
      icon: '🎯',
      title: 'Milestones',
      desc: 'Pregnancy progress goals',
    },
    {
      screen: 'APPOINTMENTS',
      color: '#8b5cf6',
      icon: '📅',
      title: 'Appointments',
      desc: 'Booked and pending visits',
    },
    {
      screen: 'NOTIFICATIONS',
      color: '#f59e0b',
      icon: '🔔',
      title: 'Notifications',
      desc: 'Reminders and alerts',
    },
    {
      screen: 'WELLNESS',
      color: '#f97316',
      icon: '📘',
      title: 'What You Need To Know',
      desc: 'Care tips and guidance',
    },
    {
      screen: 'GROWTH',
      color: '#34d399',
      icon: '📈',
      title: 'Growth Monitoring',
      desc: 'Child growth charts',
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
        <Text style={styles.cardTag}>PREGNANCY STATUS</Text>
        <Text style={styles.cardHeader}>{weekLabel}</Text>
        <Text style={styles.cardSub}>Synced from your Firebase maternal profile</Text>
        
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
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.gridCard}
            onPress={() => onNavigate(item.screen)}
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
          {nextAppointmentText
            ? `You have a prenatal checkup scheduled on ${nextAppointmentText}.`
            : 'No upcoming prenatal appointment is linked yet in your profile.'}
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
