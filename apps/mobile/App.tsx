import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';

// Import screens
import LoginScreen from './screens/LoginScreen';
import MotherDashboardScreen from './screens/MotherDashboardScreen';
import AppointmentsScreen from './screens/AppointmentsScreen';
import RecordsScreen from './screens/RecordsScreen';
import ImmunizationScreen from './screens/ImmunizationScreen';
import WellnessTipsScreen from './screens/WellnessTipsScreen';
import ProfileScreen from './screens/ProfileScreen';
import MotherProfileSetupScreen from './screens/MotherProfileSetupScreen';
import MilestonesScreen from './screens/MilestonesScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import GrowthMonitoringScreen from './screens/GrowthMonitoringScreen';
import { firebaseAuth } from './lib/firebaseClient';
import {
  loadMotherProfile,
  loginWithFirebasePin,
  logoutFromFirebase,
  signUpMotherWithFirebase,
} from './lib/firebaseAuth';
import { getRememberedMotherEmail, rememberMotherEmail } from './lib/localAuthStore';
import { getMotherProfileByEmail, saveMotherProfile } from './lib/motherProfileStore';

type Screen =
  | 'LOGIN'
  | 'DASHBOARD'
  | 'APPOINTMENTS'
  | 'RECORDS'
  | 'IMMUNIZATION'
  | 'WELLNESS'
  | 'PROFILE_SETUP'
  | 'PROFILE'
  | 'MILESTONES'
  | 'NOTIFICATIONS'
  | 'GROWTH';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('LOGIN');
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null);
  const [pregnancyWeek, setPregnancyWeek] = useState<number | null>(null);
  const [nextAppointmentText, setNextAppointmentText] = useState<string | null>(null);
  const redirectToProfileAfterSignUpRef = useRef(false);

  useEffect(() => {
    getRememberedMotherEmail()
      .then((email) => setRememberedEmail(email))
      .catch(() => setRememberedEmail(null));
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        setUserName('');
        setUserEmail('');
        setPregnancyWeek(null);
        setNextAppointmentText(null);
        setCurrentScreen('LOGIN');
        return;
      }

      const normalizedEmail = (user.email || '').trim().toLowerCase();
      const [profile, dbProfile] = await Promise.all([
        loadMotherProfile(user),
        normalizedEmail ? getMotherProfileByEmail(normalizedEmail) : Promise.resolve(null),
      ]);
      setUserName(profile.displayName);
      setUserEmail(user.email || '');
      setPregnancyWeek(profile.pregnancyWeek);
      setNextAppointmentText(profile.nextAppointmentText);

      if (redirectToProfileAfterSignUpRef.current) {
        redirectToProfileAfterSignUpRef.current = false;
        setCurrentScreen('PROFILE_SETUP');
        return;
      }

      const hasPin = Boolean(
        (dbProfile?.loginPin || dbProfile?.lockscreenPin || '').trim()
      );

      if (!hasPin) {
        setCurrentScreen('PROFILE_SETUP');
        return;
      }

      if (normalizedEmail) {
        await rememberMotherEmail(normalizedEmail);
        setRememberedEmail(normalizedEmail);
      }

      setCurrentScreen('DASHBOARD');
    });

    return () => unsubscribe();
  }, []);

  const handlePinLoginSuccess = async (pin: string) => {
    const email = (rememberedEmail || '').trim().toLowerCase();
    if (!email) {
      throw new Error('No remembered account on this device. Please sign up first.');
    }

    await loginWithFirebasePin(email, pin);
  };

  const handleSignUpSuccess = async (fullName: string, email: string, password: string) => {
    redirectToProfileAfterSignUpRef.current = true;
    try {
      await signUpMotherWithFirebase(fullName, email, password);
    } catch (error) {
      redirectToProfileAfterSignUpRef.current = false;
      throw error;
    }
  };

  const handleLogout = async () => {
    await logoutFromFirebase();
    setUserName('');
    setUserEmail('');
    setPregnancyWeek(null);
    setNextAppointmentText(null);
    setCurrentScreen('LOGIN');
  };

  const handleCompleteProfileSetup = async (profile: Parameters<typeof saveMotherProfile>[0]) => {
    await saveMotherProfile(profile);
    await rememberMotherEmail(profile.email);
    setRememberedEmail(profile.email.trim().toLowerCase());
    setCurrentScreen('DASHBOARD');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'LOGIN':
        return (
          <LoginScreen
            hasRememberedAccount={Boolean(rememberedEmail)}
            onPinLoginSuccess={handlePinLoginSuccess}
            onSignUpSuccess={handleSignUpSuccess}
          />
        );
      case 'DASHBOARD':
        return (
          <MotherDashboardScreen
            userEmail={userEmail}
            userName={userName}
            pregnancyWeek={pregnancyWeek}
            nextAppointmentText={nextAppointmentText}
            onNavigate={(screen) => setCurrentScreen(screen as Screen)}
            onLogout={handleLogout}
          />
        );
      case 'PROFILE_SETUP':
        return (
          <MotherProfileSetupScreen
            email={userEmail}
            onBackToLogin={handleLogout}
            onComplete={handleCompleteProfileSetup}
          />
        );
      case 'PROFILE':
        return <ProfileScreen email={userEmail} onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'MILESTONES':
        return <MilestonesScreen email={userEmail} onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'APPOINTMENTS':
        return <AppointmentsScreen email={userEmail} onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'RECORDS':
        return <RecordsScreen email={userEmail} onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'IMMUNIZATION':
        return <ImmunizationScreen email={userEmail} onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'WELLNESS':
        return <WellnessTipsScreen email={userEmail} onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'NOTIFICATIONS':
        return <NotificationsScreen email={userEmail} onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'GROWTH':
        return <GrowthMonitoringScreen email={userEmail} onBack={() => setCurrentScreen('DASHBOARD')} />;
      default:
        return (
          <LoginScreen
            hasRememberedAccount={Boolean(rememberedEmail)}
            onPinLoginSuccess={handlePinLoginSuccess}
            onSignUpSuccess={handleSignUpSuccess}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.wrapper}>{renderScreen()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef3f9',
  },
  wrapper: {
    flex: 1,
  },
});
