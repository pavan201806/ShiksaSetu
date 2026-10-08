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
import {
  DEMO_STT_PHRASES,
  SANTALI_DEMO_PHRASES,
  VoiceDirection,
} from '../services/voiceService';
import { useVosk } from '../hooks/useVosk';

type VoiceState = 'idle' | 'listening' | 'processing';

interface Props {
  navigation: any;
}

export const VoiceAssistantScreen: React.FC<Props> = ({ navigation }) => {
  const [direction, setDirection] = useState<VoiceDirection>('hi-to-sat');
  const [state, setState] = useState<VoiceState>('idle');
  const [selectedScenario, setSelectedScenario] = useState<number>(0);
  const [selectedSantaliPhraseIndex, setSelectedSantaliPhraseIndex] = useState<number>(0);

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

  // Handle direction toggle mid-session cleanly
  const handleToggleDirection = async (newDirection: VoiceDirection) => {
    if (newDirection === direction) return;

    // Reset any in-progress state cleanly
    if (isRecognizing || state === 'listening') {
      try {
        await stopVosk();
      } catch (err) {
        // Ignored
      }
    }
    setState('idle');
    setDirection(newDirection);
  };

  // 2. Push-to-Hold Handlers (for Hindi STT via Vosk)
  const handlePressIn = async () => {
    if (direction !== 'hi-to-sat') return;
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
    if (direction !== 'hi-to-sat') return;
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
    if (direction === 'hi-to-sat' && voskResult && voskResult.trim().length > 0) {
      const transcript = voskResult.trim();
      console.log('[VoiceAssistantScreen] Vosk transcript ready, auto-navigating:', transcript);
      setState('idle');
      navigation.navigate('TranslationResult', {
        hindiTranscript: transcript,
        sourceTranscript: transcript,
        direction: 'hi-to-sat',
        scenarioIndex: selectedScenario,
      });
    }
  }, [voskResult, navigation, direction, selectedScenario]);

  // 4. Handle Vosk Error State
  useEffect(() => {
    if (direction === 'hi-to-sat' && voskError) {
      console.warn('[VoiceAssistantScreen] Vosk recognition error:', voskError);
      Alert.alert(
        'Speech Recognition Error',
        typeof voskError === 'string'
          ? voskError
          : voskError?.message || 'Error occurred during offline speech recognition.'
      );
      setState('idle');
    }
  }, [voskError, direction]);

  // Forward demo scenario trigger (Hindi -> Santali)
  const handleRunDemoScenario = () => {
    const demoText = DEMO_STT_PHRASES[selectedScenario]?.text;
    navigation.navigate('TranslationResult', {
      hindiTranscript: demoText,
      sourceTranscript: demoText,
      direction: 'hi-to-sat',
      scenarioIndex: selectedScenario,
    });
  };

  // Santali simulated speech recognition trigger (Santali -> Hindi)
  const handleSimulateSantaliSpeaking = async (phraseIndex?: number) => {
    const indexToUse = phraseIndex !== undefined ? phraseIndex : selectedSantaliPhraseIndex;
    const selectedPhrase = SANTALI_DEMO_PHRASES[indexToUse] || SANTALI_DEMO_PHRASES[0];

    try {
      setState('processing');
      // Simulate Santali MockSTT acoustic pass latency (800ms)
      await new Promise((resolve) => setTimeout(resolve, 800));
      setState('idle');
      navigation.navigate('TranslationResult', {
        hindiTranscript: selectedPhrase.text,
        sourceTranscript: selectedPhrase.text,
        direction: 'sat-to-hi',
        scenarioIndex: indexToUse,
      });
    } catch (err) {
      console.warn('[VoiceAssistantScreen] Santali simulation error:', err);
      setState('idle');
    }
  };

  const isHindiToSantali = direction === 'hi-to-sat';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Classroom Voice Assistant</Text>
        <Text style={styles.headerSub}>
          {isHindiToSantali
            ? 'Offline Hindi STT (Vosk) → Santali Neural Translation'
            : 'Santali Student Voice (Ol Chiki) → Hindi Translation'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Direction Toggle Card */}
        <View style={styles.directionCard}>
          <Text style={styles.directionSectionLabel}>CONVERSATION DIRECTION:</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                isHindiToSantali ? styles.toggleOptionActiveHindi : null,
              ]}
              onPress={() => handleToggleDirection('hi-to-sat')}
              activeOpacity={0.8}
            >
              <Text style={styles.toggleIcon}>🇮🇳 ➔ 🌾</Text>
              <Text
                style={[
                  styles.toggleText,
                  isHindiToSantali ? styles.toggleTextActive : null,
                ]}
              >
                Hindi → Santali
              </Text>
              <Text
                style={[
                  styles.toggleSubText,
                  isHindiToSantali ? styles.toggleSubTextActive : null,
                ]}
              >
                Teacher Speaking
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleOption,
                !isHindiToSantali ? styles.toggleOptionActiveSantali : null,
              ]}
              onPress={() => handleToggleDirection('sat-to-hi')}
              activeOpacity={0.8}
            >
              <Text style={styles.toggleIcon}>🌾 ➔ 🇮🇳</Text>
              <Text
                style={[
                  styles.toggleText,
                  !isHindiToSantali ? styles.toggleTextActive : null,
                ]}
              >
                Santali → Hindi
              </Text>
              <Text
                style={[
                  styles.toggleSubText,
                  !isHindiToSantali ? styles.toggleSubTextActive : null,
                ]}
              >
                Student Speaking
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Indicator Card */}
        {isHindiToSantali ? (
          <View style={styles.modelStatusCard}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isModelLoaded ? '#16a34a' : '#f59e0b' },
              ]}
            />
            <Text style={styles.modelStatusText}>
              {isModelLoaded
                ? 'Offline Model Ready: Hindi STT (model-hi-in)'
                : 'Loading Offline Vosk Hindi Model...'}
            </Text>
          </View>
        ) : (
          <View style={[styles.modelStatusCard, styles.santaliStatusCard]}>
            <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
            <Text style={[styles.modelStatusText, { color: '#065f46' }]}>
              Santali Input Mode: Student Phrase Picker (Simulated STT)
            </Text>
          </View>
        )}

        {/* ----------------- DIRECTION 1: HINDI TO SANTALI ----------------- */}
        {isHindiToSantali && (
          <>
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

            {/* Main Body per State (Hindi) */}
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
          </>
        )}

        {/* ----------------- DIRECTION 2: SANTALI TO HINDI ----------------- */}
        {!isHindiToSantali && (
          <>
            {/* Santali Phrase-Picker Card */}
            {state === 'idle' && (
              <View style={styles.santaliPickerCard}>
                <View style={styles.pickerHeaderRow}>
                  <Text style={styles.pickerTitle}>SELECT SANTALI STUDENT PHRASE:</Text>
                  <Text style={styles.pickerBadge}>Student Simulation</Text>
                </View>
                <Text style={styles.pickerHint}>
                  Tap any phrase to choose what the Santali student speaker says:
                </Text>

                <View style={styles.phraseList}>
                  {SANTALI_DEMO_PHRASES.map((phrase, idx) => {
                    const isSelected = selectedSantaliPhraseIndex === idx;
                    return (
                      <TouchableOpacity
                        key={phrase.id}
                        style={[
                          styles.phraseCard,
                          isSelected ? styles.phraseCardSelected : null,
                        ]}
                        onPress={() => setSelectedSantaliPhraseIndex(idx)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.phraseCardHeader}>
                          <View
                            style={[
                              styles.radioCircle,
                              isSelected ? styles.radioCircleSelected : null,
                            ]}
                          >
                            {isSelected && <View style={styles.radioDot} />}
                          </View>
                          <Text style={styles.phraseIndexTag}>Phrase {idx + 1}</Text>
                        </View>

                        <Text style={styles.santaliPhraseText}>{phrase.text}</Text>

                        {phrase.phoneticHint ? (
                          <Text style={styles.phrasePhoneticText}>
                            🗣️ &quot;{phrase.phoneticHint}&quot;
                          </Text>
                        ) : null}

                        {phrase.meaningHint ? (
                          <Text style={styles.phraseMeaningText}>
                            📖 {phrase.meaningHint}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={styles.simulateButton}
                  onPress={() => handleSimulateSantaliSpeaking()}
                  activeOpacity={0.85}
                >
                  <Text style={styles.simulateButtonText}>
                    🗣️ Simulate Student Speaking (Santali) →
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Main Body per State (Santali) */}
            <View style={styles.stateWrapper}>
              {state === 'idle' && (
                <View style={styles.stateContainer}>
                  <View style={[styles.micCircleOuter, styles.santaliMicCircleOuter]}>
                    <TouchableOpacity
                      style={[styles.micButton, styles.santaliMicButton]}
                      onPress={() => handleSimulateSantaliSpeaking()}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.micIcon}>🎙️</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.actionPrompt}>Tap to Simulate Santali Speech</Text>
                  <Text style={styles.subPrompt}>
                    Transcribes &quot;{SANTALI_DEMO_PHRASES[selectedSantaliPhraseIndex]?.text}&quot;
                  </Text>
                </View>
              )}

              {state === 'processing' && (
                <View style={styles.stateContainer}>
                  <ActivityIndicator size="large" color="#059669" style={styles.loader} />
                  <Text style={[styles.listeningTitle, { color: '#065f46' }]}>
                    Transcribing Santali Speech...
                  </Text>
                  <Text style={styles.subPrompt}>
                    Simulating on-device acoustic pass for Ol Chiki • Navigating to Hindi translation...
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
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
    marginTop: 2,
  },
  scrollBody: {
    padding: 20,
  },
  directionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  directionSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  toggleOptionActiveHindi: {
    backgroundColor: '#1e40af',
    borderColor: '#1d4ed8',
  },
  toggleOptionActiveSantali: {
    backgroundColor: '#065f46',
    borderColor: '#047857',
  },
  toggleIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    textAlign: 'center',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  toggleSubText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  toggleSubTextActive: {
    color: '#e2e8f0',
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
  santaliStatusCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
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
    flex: 1,
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
  santaliPickerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  pickerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pickerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065f46',
    letterSpacing: 0.8,
  },
  pickerBadge: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: '700',
  },
  pickerHint: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  phraseList: {
    gap: 10,
    marginBottom: 14,
  },
  phraseCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  phraseCardSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#059669',
  },
  phraseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#059669',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  phraseIndexTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  santaliPhraseText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  phrasePhoneticText: {
    fontSize: 12,
    color: '#0284c7',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  phraseMeaningText: {
    fontSize: 12,
    color: '#475569',
  },
  simulateButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  simulateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  stateWrapper: {
    marginTop: 6,
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  micCircleOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  santaliMicCircleOuter: {
    backgroundColor: '#d1fae5',
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
  santaliMicButton: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
  },
  micIcon: {
    fontSize: 40,
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
    paddingHorizontal: 20,
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
    textAlign: 'center',
  },
  stopButton: {
    marginTop: 24,
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
