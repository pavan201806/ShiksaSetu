import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { DEMO_STT_PHRASES } from '../services/voiceService';
import { useVosk } from '../hooks/useVosk';

type VoiceState = 'idle' | 'listening' | 'processing';

interface Props {
  navigation: any;
}

export const VoiceAssistantScreen: React.FC<Props> = ({ navigation }) => {
  const [state, setState] = useState<VoiceState>('idle');
  const [selectedScenario, setSelectedScenario] = useState<number>(0);

  const {
    isLoaded: isModelLoaded,
    isRecognizing,
    result: voskResult,
    partialResult,
    error: voskError,
    loadModel,
    start: startVosk,
    stop: stopVosk,
  } = useVosk();

  // 1. On mount: Load offline Hindi STT model from android/app/src/main/assets/model-hi-in
  useEffect(() => {
    loadModel('model-hi-in');
  }, [loadModel]);

  // 2. Push-to-Hold Handlers: Press in starts recognizer, release stops it
  const handlePressIn = async () => {
    try {
      setState('listening');
      const started = await startVosk();
      if (!started) {
        setState('idle');
      }
    } catch (err) {
      console.warn('[VoiceAssistantScreen] start error:', err);
      setState('idle');
    }
  };

  const handlePressOut = async () => {
    try {
      setState('processing');
      await stopVosk();
    } catch (err) {
      console.warn('[VoiceAssistantScreen] stop error:', err);
      setState('idle');
    }
  };

  // 3. Automated Downstream Flow: On receiving Vosk transcript result, auto-navigate
  useEffect(() => {
    if (voskResult && voskResult.trim().length > 0) {
      const transcript = voskResult.trim();
      console.log('[VoiceAssistantScreen] Vosk transcript ready, auto-navigating:', transcript);
      setState('idle');
      navigation.navigate('TranslationResult', {
        hindiTranscript: transcript,
      });
    }
  }, [voskResult, navigation]);

  // 4. Handle Vosk Error State
  useEffect(() => {
    if (voskError) {
      console.warn('[VoiceAssistantScreen] Vosk recognition error:', voskError);
      Alert.alert(
        'Speech Recognition Error',
        typeof voskError === 'string'
          ? voskError
          : voskError?.message || 'Error occurred during offline speech recognition.'
      );
      setState('idle');
    }
  }, [voskError]);

  // Fallback demo scenario trigger
  const handleRunDemoScenario = () => {
    const demoText = DEMO_STT_PHRASES[selectedScenario]?.text;
    navigation.navigate('TranslationResult', {
      hindiTranscript: demoText,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Classroom Voice Assistant</Text>
        <Text style={styles.headerSub}>Offline Hindi STT (Vosk) → Regional Neural Translation</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Model Status Indicator */}
        <View style={styles.modelStatusCard}>
          <View style={[styles.statusDot, { backgroundColor: isModelLoaded ? '#16a34a' : '#f59e0b' }]} />
          <Text style={styles.modelStatusText}>
            {isModelLoaded
              ? 'Offline Model Ready: Hindi STT (model-hi-in)'
              : 'Loading Offline Vosk Hindi Model...'}
          </Text>
        </View>

        {/* Demo Scenario Selector (Quick Testing) */}
        {state === 'idle' && (
          <View style={styles.scenarioSelectorCard}>
            <Text style={styles.scenarioLabel}>SELECT DEMO PHRASE SCENARIO (OR USE MIC):</Text>
            <View style={styles.scenarioButtonGroup}>
              {DEMO_STT_PHRASES.map((phrase, idx) => (
                <TouchableOpacity
                  key={phrase.id}
                  style={[
                    styles.scenarioButton,
                    selectedScenario === idx ? styles.scenarioButtonActive : null,
                  ]}
                  onPress={() => setSelectedScenario(idx)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.scenarioButtonText,
                      selectedScenario === idx ? styles.scenarioButtonTextActive : null,
                    ]}
                  >
                    Scenario {idx + 1}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.scenarioPreviewText}>
              &quot;{DEMO_STT_PHRASES[selectedScenario]?.text}&quot;
            </Text>

            <TouchableOpacity
              style={styles.demoNavigateButton}
              onPress={handleRunDemoScenario}
              activeOpacity={0.8}
            >
              <Text style={styles.demoNavigateButtonText}>
                Test With Selected Demo Phrase →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Body per State */}
        <View style={styles.stateWrapper}>
          {state === 'idle' && (
            <View style={styles.stateContainer}>
              <View style={styles.micCircleOuter}>
                <TouchableOpacity
                  style={styles.micButton}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  activeOpacity={0.7}
                  delayPressIn={0}
                >
                  <Text style={styles.micIcon}>🎤</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.actionPrompt}>Hold Microphone to Speak Hindi</Text>
              <Text style={styles.subPrompt}>
                Push-to-hold button • Release when finished to process
              </Text>
            </View>
          )}

          {state === 'listening' && (
            <View style={styles.stateContainer}>
              <View style={styles.pulseOuter}>
                <TouchableOpacity
                  style={styles.pulseInner}
                  onPressOut={handlePressOut}
                  activeOpacity={0.9}
                >
                  <Text style={styles.micIcon}>🎙️</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.listeningTitle}>Listening...</Text>
              <Text style={styles.subPrompt}>
                Speaking into microphone • Release hold when done
              </Text>

              {/* Real-time partial transcript preview if available */}
              {partialResult ? (
                <View style={styles.partialBox}>
                  <Text style={styles.partialBoxLabel}>LIVE RECOGNITION PREVIEW:</Text>
                  <Text style={styles.partialBoxText}>{partialResult}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.stopButton}
                onPress={handlePressOut}
                activeOpacity={0.8}
              >
                <Text style={styles.stopButtonText}>Release / Done Speaking</Text>
              </TouchableOpacity>
            </View>
          )}

          {state === 'processing' && (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
              <Text style={styles.listeningTitle}>Transcribing Hindi Voice...</Text>
              <Text style={styles.subPrompt}>
                Running offline Vosk Hindi ASR • Navigating to translation...
              </Text>
            </View>
          )}
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
  headerSub: {
    fontSize: 13,
    color: '#64748b',
  },
  scrollBody: {
    padding: 20,
  },
  scenarioSelectorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scenarioLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  scenarioButtonGroup: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  scenarioButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  scenarioButtonActive: {
    backgroundColor: '#1e40af',
  },
  scenarioButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  scenarioButtonTextActive: {
    color: '#ffffff',
  },
  scenarioPreviewText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#334155',
  },
  stateWrapper: {
    marginTop: 10,
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  micCircleOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  micIcon: {
    fontSize: 42,
  },
  actionPrompt: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
    textAlign: 'center',
  },
  subPrompt: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  pulseOuter: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#fef2f2',
    borderWidth: 3,
    borderColor: '#fca5a5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  pulseInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listeningTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#991b1b',
    marginBottom: 6,
  },
  stopButton: {
    marginTop: 28,
    backgroundColor: '#0f172a',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  stopButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  loader: {
    marginBottom: 20,
    transform: [{ scale: 1.4 }],
  },
  modelStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modelStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  demoNavigateButton: {
    marginTop: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  demoNavigateButtonText: {
    color: '#1d4ed8',
    fontWeight: '700',
    fontSize: 13,
  },
  partialBox: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    width: '90%',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  partialBoxLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  partialBoxText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    fontStyle: 'italic',
  },
});
