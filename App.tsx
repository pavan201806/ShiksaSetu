import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initDatabase } from './src/services/database';
import { initApiBaseUrl } from './src/services/api';

export default function App() {
  useEffect(() => {
    initDatabase()
      .then(() => initApiBaseUrl())
      .catch((err) => {
        console.warn('Failed to initialize SQLite database or API URL:', err);
      });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
