import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';

interface DashboardProps {
  userName: string;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

export default function MotherDashboardScreen({ userName, onNavigate, onLogout }: DashboardProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Jambo,</Text>
          <Text style={styles.nameText}>{userName} 👋</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Pregnancy Status Card */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTag}>PREGNANCY STATUS</Text>
        <Text style={styles.cardHeader}>Week 21</Text>
        <Text style={styles.cardSub}>Second Trimester • 133 days to Estimated Due Date</Text>
        
        {/* Simple Progress Bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: '52.5%' }]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabelText}>Conception</Text>
          <Text style={styles.progressLabelText}>52%</Text>
          <Text style={styles.progressLabelText}>Due Date</Text>
        </View>
      </View>

      {/* Quick Action Grid */}
      <Text style={styles.sectionTitle}>Maternal Care Menu</Text>
      <View style={styles.grid}>
        <TouchableOpacity 
          style={styles.gridCard} 
          onPress={() => onNavigate('APPOINTMENTS')}
        >
          <View style={[styles.gridIconBg, { backgroundColor: '#8b5cf6' }]}>
            <Text style={styles.gridIcon}>📅</Text>
          </View>
          <Text style={styles.gridTitle}>Appointments</Text>
          <Text style={styles.gridDesc}>1 Upcoming visit</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.gridCard}
          onPress={() => onNavigate('RECORDS')}
        >
          <View style={[styles.gridIconBg, { backgroundColor: '#ec4899' }]}>
            <Text style={styles.gridIcon}>📝</Text>
          </View>
          <Text style={styles.gridTitle}>Checkup Records</Text>
          <Text style={styles.gridDesc}>Maternal observations</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.gridCard}
          onPress={() => onNavigate('IMMUNIZATION')}
        >
          <View style={[styles.gridIconBg, { backgroundColor: '#10b981' }]}>
            <Text style={styles.gridIcon}>💉</Text>
          </View>
          <Text style={styles.gridTitle}>Baby Baraka</Text>
          <Text style={styles.gridDesc}>Vaccine checklist</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.gridCard}
          onPress={() => onNavigate('WELLNESS')}
        >
          <View style={[styles.gridIconBg, { backgroundColor: '#f59e0b' }]}>
            <Text style={styles.gridIcon}>💡</Text>
          </View>
          <Text style={styles.gridTitle}>Wellness Tips</Text>
          <Text style={styles.gridDesc}>Prenatal guides</Text>
        </TouchableOpacity>
      </View>

      {/* Next Appointment Alert */}
      <View style={styles.alertBox}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertHeaderIcon}>🔔</Text>
          <Text style={styles.alertHeaderTitle}>Upcoming Prenatal Visit</Text>
        </View>
        <Text style={styles.alertText}>
          You have a prenatal checkup scheduled with Dr. Jane Mwangi on June 25 at 10:00 AM.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
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
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '500',
  },
  nameText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 2,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#121826',
    borderWidth: 1,
    borderColor: '#243049',
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
  },
  cardTag: {
    color: '#ec4899',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  cardHeader: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSub: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 16,
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#182235',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ec4899',
    borderRadius: 5,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabelText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#ffffff',
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
    backgroundColor: '#121826',
    borderWidth: 1,
    borderColor: '#243049',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  gridDesc: {
    color: '#64748b',
    fontSize: 12,
  },
  alertBox: {
    backgroundColor: '#182235',
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
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
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  alertText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
});
