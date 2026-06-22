import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { fetchAppointments, type MobileAppointment } from '../lib/firestoreData';

interface AppointmentsProps {
  email: string;
  onBack: () => void;
}

export default function AppointmentsScreen({ email, onBack }: AppointmentsProps) {
  const [appointments, setAppointments] = useState<MobileAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAppointments() {
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

    loadAppointments();
  }, [email]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Appointments</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTag}>CARE PLANNER</Text>
          <Text style={styles.heroTitle}>Appointments</Text>
          <Text style={styles.heroText}>Track upcoming visits and follow through on maternal care timelines.</Text>
        </View>

        <Text style={styles.sectionTitle}>Upcoming Consultations</Text>

        {loading ? <Text style={styles.emptyText}>Loading appointments...</Text> : null}

        {!loading && appointments.length === 0 ? (
          <Text style={styles.emptyText}>No appointments available for this mother profile yet.</Text>
        ) : null}

        {appointments.map((appt) => (
          <View style={styles.apptCard} key={appt.id}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.apptDate}>{appt.date}</Text>
                <Text style={styles.apptTime}>{appt.time}</Text>
              </View>
              <View style={[
                styles.badge, 
                appt.status === 'COMPLETED' ? styles.badgeSuccess : styles.badgeWarning
              ]}>
                <Text style={[
                  styles.badgeText,
                  appt.status === 'COMPLETED' ? styles.badgeTextSuccess : styles.badgeTextWarning
                ]}>{appt.status}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.doctorName}>👩‍⚕️ Provider: {appt.doctor}</Text>
              <Text style={styles.reason}>📌 Reason: {appt.reason}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.bookBtn} disabled>
          <Text style={styles.bookBtnText}>Appointment requests are managed by clinic staff</Text>
        </TouchableOpacity>
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
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 12,
  },
  apptCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d8e2ef',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  apptDate: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  apptTime: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 2,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 9999,
  },
  badgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  badgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  badgeTextWarning: {
    color: '#f59e0b',
  },
  badgeTextSuccess: {
    color: '#10b981',
  },
  cardBody: {
    gap: 4,
  },
  doctorName: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },
  reason: {
    color: '#475569',
    fontSize: 13,
  },
  bookBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  bookBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});
