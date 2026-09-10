import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';

interface Props {
  navigation: any;
}

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Settings & Info</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Branding Card */}
        <View style={styles.brandCard}>
          <Text style={styles.appName}>ShikshaSetu</Text>
          <Text style={styles.appSub}>Bridging Quality Primary Education</Text>

          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>SIH 2026 PROTOTYPE</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
              <Text style={[styles.badgeText, { color: '#15803d' }]}>EXPO DEV CLIENT</Text>
            </View>
          </View>
        </View>

        {/* System Info Section */}
        <Text style={styles.sectionTitle}>System Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Development Team</Text>
            <Text style={styles.infoValue}>Stark Dynamics</Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Event Context</Text>
            <Text style={styles.infoValue}>Smart India Hackathon 2026</Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>1.0.0-dev</Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Android Package</Text>
            <Text style={styles.infoValue}>com.starkdynamics.shikshasetu</Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Offline Engine</Text>
            <Text style={[styles.infoValue, { color: '#16a34a' }]}>Enabled (Local JSON & SQLite Ready)</Text>
          </View>
        </View>

        {/* Architecture Note */}
        <View style={styles.architectureNote}>
          <Text style={styles.noteTitle}>⚙️ Custom Native Modules Architecture</Text>
          <Text style={styles.noteBody}>
            This application is configured with `expo-dev-client` (bypassing Expo Go) to enable native bindings for SQLite local databases, background audio recording, and on-device ML model execution.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginBottom: 10,
  },
  backButtonText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  scrollContent: {
    padding: 20,
  },
  brandCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
  },
  appSub: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#93c5fd',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  architectureNote: {
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e40af',
    marginBottom: 6,
  },
  noteBody: {
    fontSize: 13,
    color: '#1e3a8a',
    lineHeight: 19,
  },
});
