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

type Screen = 'LOGIN' | 'DASHBOARD' | 'APPOINTMENTS' | 'RECORDS' | 'IMMUNIZATION' | 'WELLNESS';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('LOGIN');
  const [userName, setUserName] = useState<string>('');

  const handleLoginSuccess = (email: string) => {
    // Extract name prefix from email for demo purposes
    const namePrefix = email.split('@')[0];
    const formattedName = namePrefix.charAt(0).toUpperCase() + namePrefix.slice(1);
    setUserName(formattedName === 'Mother' ? 'Amina Omondi' : formattedName);
    setCurrentScreen('DASHBOARD');
  };

  const handleLogout = () => {
    setUserName('');
    setCurrentScreen('LOGIN');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'LOGIN':
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
      case 'DASHBOARD':
        return (
          <MotherDashboardScreen
            userName={userName}
            onNavigate={(screen) => setCurrentScreen(screen as Screen)}
            onLogout={handleLogout}
          />
        );
      case 'APPOINTMENTS':
        return <AppointmentsScreen onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'RECORDS':
        return <RecordsScreen onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'IMMUNIZATION':
        return <ImmunizationScreen onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'WELLNESS':
        return <WellnessTipsScreen onBack={() => setCurrentScreen('DASHBOARD')} />;
      default:
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.wrapper}>
        {renderScreen()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
    // On web, add a top padding since SafeAreaView works slightly differently
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  wrapper: {
    flex: 1,
  },
});
