import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Import screens
import LoginScreen from './screens/LoginScreen';
import MotherDashboardScreen from './screens/MotherDashboardScreen';
import AppointmentsScreen from './screens/AppointmentsScreen';
import RecordsScreen from './screens/RecordsScreen';
import ImmunizationScreen from './screens/ImmunizationScreen';
import WellnessTipsScreen from './screens/WellnessTipsScreen';
import MotherProfileSetupScreen from './screens/MotherProfileSetupScreen';
import ProfileScreen from './screens/ProfileScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import MilestonesScreen from './screens/MilestonesScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import GrowthMonitoringScreen from './screens/GrowthMonitoringScreen';
import {
  deleteMotherAccountByEmail,
  getMotherProfileByEmail,
  saveMotherProfile,
  type MotherProfile,
} from './lib/motherProfileStore';

type Screen =
  | 'LOGIN'
  | 'PROFILE_SETUP'
  | 'DASHBOARD'
  | 'PROFILE'
  | 'SCHEDULE'
  | 'MILESTONES'
  | 'APPOINTMENTS'
  | 'NOTIFICATIONS'
  | 'RECORDS'
  | 'IMMUNIZATION'
  | 'WELLNESS'
  | 'GROWTH';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('LOGIN');
  const [currentEmail, setCurrentEmail] = useState<string>('');
  const [motherProfile, setMotherProfile] = useState<MotherProfile | null>(null);

  const handleLoginSuccess = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    setCurrentEmail(normalizedEmail);

    const existingProfile = await getMotherProfileByEmail(normalizedEmail);
    if (existingProfile) {
      setMotherProfile(existingProfile);
      setCurrentScreen('DASHBOARD');
      return;
    }

    setMotherProfile(null);
    setCurrentScreen('PROFILE_SETUP');
  };

  const handleProfileComplete = async (profile: MotherProfile) => {
    const savedProfile = await saveMotherProfile(profile);
    setMotherProfile(savedProfile);
    setCurrentScreen('DASHBOARD');
  };

  const handleLogout = () => {
    setCurrentEmail('');
    setMotherProfile(null);
    setCurrentScreen('LOGIN');
  };

  const handleProfileUpdate = async (profile: MotherProfile) => {
    const savedProfile = await saveMotherProfile(profile);
    setMotherProfile(savedProfile);
  };

  const handleDeleteAccount = async () => {
    if (!currentEmail.trim()) return;
    await deleteMotherAccountByEmail(currentEmail);
    setCurrentEmail('');
    setMotherProfile(null);
    setCurrentScreen('LOGIN');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'LOGIN':
        return <LoginScreen onLoginSuccess={(email) => handleLoginSuccess(email)} />;
      case 'PROFILE_SETUP':
        return (
          <MotherProfileSetupScreen
            email={currentEmail}
            onBackToLogin={() => setCurrentScreen('LOGIN')}
            onComplete={handleProfileComplete}
          />
        );
      case 'DASHBOARD':
        return (
          <MotherDashboardScreen
            userName={motherProfile?.fullName || 'Mother'}
            motherCode={motherProfile?.motherCode || 'Not assigned'}
            stage={motherProfile?.stage || 'PRENATAL'}
            pregnancyWeek={motherProfile?.pregnancyWeek || ''}
            babyAgeMonths={motherProfile?.babyAgeMonths || ''}
            onNavigate={(screen) => setCurrentScreen(screen as Screen)}
            onLogout={handleLogout}
          />
        );
      case 'PROFILE':
        return (
          <ProfileScreen
            profile={motherProfile}
            onBack={() => setCurrentScreen('DASHBOARD')}
            onSaveProfile={handleProfileUpdate}
            onDeleteAccount={handleDeleteAccount}
          />
        );
      case 'SCHEDULE':
        return <ScheduleScreen email={currentEmail} onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'MILESTONES':
        return <MilestonesScreen email={currentEmail} onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'APPOINTMENTS':
        return <AppointmentsScreen email={currentEmail} onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'NOTIFICATIONS':
        return <NotificationsScreen email={currentEmail} onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'RECORDS':
        return <RecordsScreen email={currentEmail} onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'IMMUNIZATION':
        return <ImmunizationScreen email={currentEmail} onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'WELLNESS':
        return <WellnessTipsScreen email={currentEmail} onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'GROWTH':
        return <GrowthMonitoringScreen email={currentEmail} onBack={() => setCurrentScreen('DASHBOARD')} />;
      default:
        return <LoginScreen onLoginSuccess={(email) => handleLoginSuccess(email)} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.wrapper}>
        {renderScreen()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef3f9',
    // On web, add a top padding since SafeAreaView works slightly differently
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  wrapper: {
    flex: 1,
  },
});
