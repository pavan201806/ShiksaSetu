import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getLastSyncTime, setCustomApiUrl } from '../services/database';
import { performContentSync, isNetworkConnected, SyncResult } from '../services/syncService';
import {
  getEffectiveApiUrl,
  setEffectiveApiUrl,
  initApiBaseUrl,
  testApiConnection,
  checkBackendHealth,
  DEFAULT_API_BASE_URL,
} from '../services/api';

interface Props {
  navigation: any;
}

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [lastSynced, setLastSynced] = useState<string>('Never');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Runtime Backend Reachability State
  const [serverUrl, setServerUrl] = useState<string>(getEffectiveApiUrl());
  const [isTestingUrl, setIsTestingUrl] = useState<boolean>(false);
  const [urlStatus, setUrlStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    // Load initial sync state & API endpoint
    getLastSyncTime().then((time) => {
      if (time) {
        setLastSynced(new Date(time).toLocaleString());
      }
    });

    initApiBaseUrl().then((url) => {
      setServerUrl(url);
    });

    isNetworkConnected().then(setIsOnline);
  }, []);

  const handleTestAndSaveUrl = async (targetUrlToTest?: string) => {
    const urlToUse = (targetUrlToTest || serverUrl).trim();
    if (!urlToUse) {
      Alert.alert('Invalid URL', 'Please enter a valid backend server URL.');
      return;
    }

    setIsTestingUrl(true);
    setUrlStatus(null);

    const test = await testApiConnection(urlToUse);
    setIsTestingUrl(false);

    if (test.success) {
      const cleanUrl = setEffectiveApiUrl(urlToUse);
      setServerUrl(cleanUrl);
      await setCustomApiUrl(cleanUrl);
      setUrlStatus({ success: true, message: `Connected! Reachable at ${cleanUrl}` });

      const health = await checkBackendHealth();
      setIsOnline(Boolean(health));

      Alert.alert(
        'Backend Connected ✓',
        `Successfully reached FastAPI backend at:\n${cleanUrl}\n\nSaved to SQLite settings as active endpoint.`
      );
    } else {
      setUrlStatus({ success: false, message: test.error || 'Endpoint unreachable' });
      Alert.alert(
        'Connection Failed ⚠️',
        `Could not reach backend at ${urlToUse}.\n\nReason: ${test.error}\n\nTroubleshooting:\n• Physical Phone: Ensure phone & PC are on the same Wi-Fi. Use your computer's Wi-Fi IP (e.g. http://192.168.x.x:8000).\n• Android Emulator: Use http://10.0.2.2:8000.\n• Verify FastAPI is running: uvicorn main:app --host 0.0.0.0 --port 8000.`
      );
    }
  };

  const handleApplyPreset = (presetUrl: string) => {
    setServerUrl(presetUrl);
    handleTestAndSaveUrl(presetUrl);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);

    const result: SyncResult = await performContentSync();
    setIsSyncing(false);
    setIsOnline(result.isOnline);

    if (result.success) {
      setLastSynced(new Date(result.syncedAt).toLocaleString());
      setSyncMessage(result.message);
      Alert.alert('Sync Completed', result.message);
    } else {
      setSyncMessage(result.message);
      Alert.alert('Sync Alert', result.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Settings & Info</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Branding Card */}
        <View style={styles.brandCard}>
          <Text style={styles.appName}>ShikshaSetu</Text>
          <Text style={styles.appSub}>Bridging Quality Primary Education</Text>

          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>SIH 2026 PROTOTYPE</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
              <Text style={[styles.badgeText, { color: '#15803d' }]}>OFFLINE FIRST</Text>
            </View>
          </View>
        </View>

        {/* Backend Synchronization Section */}
        <Text style={styles.sectionTitle}>Backend & Content Synchronization</Text>
        <View style={styles.syncCard}>
          <View style={styles.syncHeaderRow}>
            <View>
              <Text style={styles.syncCardTitle}>Content & Correction Sync</Text>
              <Text style={styles.syncCardSub}>FastAPI Microservice Integration</Text>
            </View>
            <View style={[styles.onlineBadge, { backgroundColor: isOnline ? '#dcfce7' : '#fee2e2' }]}>
              <Text style={[styles.onlineBadgeText, { color: isOnline ? '#15803d' : '#b91c1c' }]}>
                {isOnline ? '● Online' : '○ Offline'}
              </Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          {/* Server Reachability & Endpoint Block */}
          <View style={styles.endpointConfigBlock}>
            <Text style={styles.endpointBlockTitle}>Active API Endpoint (Configurable)</Text>
            <Text style={styles.endpointBlockSub}>
              Customizable for Local Wi-Fi testing, physical devices, and Android emulators.
            </Text>

            <View style={styles.endpointInputRow}>
              <TextInput
                style={styles.endpointInput}
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="http://192.168.1.5:8000"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.testSaveButton, isTestingUrl ? styles.testSaveButtonDisabled : null]}
                onPress={() => handleTestAndSaveUrl()}
                disabled={isTestingUrl}
                activeOpacity={0.8}
              >
                {isTestingUrl ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.testSaveButtonText}>Test & Save</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Status Feedback Badge */}
            {urlStatus && (
              <View
                style={[
                  styles.urlStatusBadge,
                  urlStatus.success ? styles.urlStatusSuccess : styles.urlStatusError,
                ]}
              >
                <Text
                  style={[
                    styles.urlStatusText,
                    urlStatus.success ? styles.urlStatusSuccessText : styles.urlStatusErrorText,
                  ]}
                >
                  {urlStatus.success ? '✓ ' : '✕ '}
                  {urlStatus.message}
                </Text>
              </View>
            )}

            {/* Quick Preset IP Buttons */}
            <Text style={styles.presetLabel}>Quick Network Presets:</Text>
            <View style={styles.presetRow}>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handleApplyPreset('http://127.0.0.1:8000')}
                activeOpacity={0.7}
              >
                <Text style={styles.presetChipText}>127.0.0.1 (Localhost)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handleApplyPreset('http://10.0.2.2:8000')}
                activeOpacity={0.7}
              >
                <Text style={styles.presetChipText}>10.0.2.2 (Android Emu)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.presetChip, { backgroundColor: '#f1f5f9' }]}
                onPress={() => handleApplyPreset(DEFAULT_API_BASE_URL)}
                activeOpacity={0.7}
              >
                <Text style={[styles.presetChipText, { color: '#64748b' }]}>Reset Default</Text>
              </TouchableOpacity>
            </View>

            {/* Loopback Warning on Physical Device */}
            {(serverUrl.includes('127.0.0.1') || serverUrl.includes('localhost')) && (
              <View style={styles.deviceWarningBox}>
                <Text style={styles.deviceWarningTitle}>💡 Tip for Physical Phones</Text>
                <Text style={styles.deviceWarningText}>
                  Loopback addresses (127.0.0.1) refer to the phone itself. If testing on a physical device or Expo Go via QR code, enter your computer's local Wi-Fi IP (e.g. http://192.168.1.15:8000).
                </Text>
              </View>
            )}
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Successful Sync</Text>
            <Text style={styles.infoValue}>{lastSynced}</Text>
          </View>

          {syncMessage ? (
            <View style={styles.syncMessageBar}>
              <Text style={styles.syncMessageText}>{syncMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.syncButton, isSyncing ? styles.syncButtonDisabled : null]}
            onPress={handleManualSync}
            disabled={isSyncing}
            activeOpacity={0.8}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.syncButtonText}>🔄 Sync Content & Corrections Now</Text>
            )}
          </TouchableOpacity>
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
            <Text style={styles.infoLabel}>Supported Languages</Text>
            <Text style={styles.infoValue}>Hindi (hi), Santali (sat), English (en)</Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Offline Engine</Text>
            <Text style={[styles.infoValue, { color: '#16a34a' }]}>Enabled (expo-sqlite & expo-av)</Text>
          </View>
        </View>

        {/* Architecture Note */}
        <View style={styles.architectureNote}>
          <Text style={styles.noteTitle}>⚙️ Offline-First Native Architecture</Text>
          <Text style={styles.noteBody}>
            ShikshaSetu is built with `expo-sqlite` and `expo-av` to operate completely offline in remote classrooms. Teacher corrections and curriculum progress persist locally and synchronize whenever internet or local network connectivity to the FastAPI server is restored.
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
    elevation: 4,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
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
  syncCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  syncHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  syncCardSub: {
    fontSize: 12,
    color: '#64748b',
  },
  onlineBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  syncMessageBar: {
    backgroundColor: '#eff6ff',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  syncMessageText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '600',
  },
  syncButton: {
    marginTop: 14,
    backgroundColor: '#1e40af',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  syncButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
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
    alignItems: 'center',
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
  infoValueMonospace: {
    fontSize: 12,
    color: '#1e40af',
    fontFamily: 'monospace',
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
  endpointConfigBlock: {
    marginVertical: 10,
  },
  endpointBlockTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  endpointBlockSub: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 10,
    lineHeight: 16,
  },
  endpointInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  endpointInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#0f172a',
  },
  testSaveButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testSaveButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  testSaveButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  urlStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  urlStatusSuccess: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  urlStatusError: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  urlStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  urlStatusSuccessText: {
    color: '#15803d',
  },
  urlStatusErrorText: {
    color: '#b91c1c',
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  presetChip: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  deviceWarningBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginTop: 6,
  },
  deviceWarningTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 2,
  },
  deviceWarningText: {
    fontSize: 11,
    color: '#78350f',
    lineHeight: 16,
  },
});
