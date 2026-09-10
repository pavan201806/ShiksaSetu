import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { MockTranslator } from '../services/voicePipeline/mockTranslator';
import { RecordedAudioTTS } from '../services/voicePipeline/recordedAudioTTS';
import { Translator, SpeechSynthesizer } from '../services/voicePipeline/interfaces';
import { playAudio, stopAudio } from '../services/audioPlayer';
import { saveTeacherCorrection } from '../services/database';

// Pluggable AI Service Instances (swap with real neural models when ready)
const defaultTranslator: Translator = new MockTranslator();
const defaultTTS: SpeechSynthesizer = new RecordedAudioTTS(0);

interface Props {
  navigation: any;
  route: {
    params: {
      hindiTranscript: string;
    };
  };
}

type PipelineStep =
  | 'translating'
  | 'reviewing'
  | 'synthesizing'
  | 'playing'
  | 'completed'
  | 'error';

export const TranslationResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const hindiTranscript =
    route.params?.hindiTranscript || 'कोई आवाज नहीं पहचानी गई (No speech recognized)';

  const [step, setStep] = useState<PipelineStep>('translating');
  const [originalTranslatedText, setOriginalTranslatedText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [editedText, setEditedText] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [script, setScript] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [wasCorrectionSaved, setWasCorrectionSaved] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function runInitialTranslation() {
      try {
        if (isMounted) setStep('translating');
        const translationResult = await defaultTranslator.translate(hindiTranscript);
        if (!isMounted) return;

        setOriginalTranslatedText(translationResult.translatedText);
        setTranslatedText(translationResult.translatedText);
        setEditedText(translationResult.translatedText);
        setScript(translationResult.script);

        // Transition to review step for teacher verification before speech synthesis
        setStep('reviewing');
      } catch (err: any) {
        console.warn('[TranslationResultScreen] Translation error:', err);
        if (isMounted) {
          setErrorMessage(err?.message || 'Failed to generate regional translation.');
          setStep('error');
        }
      }
    }

    runInitialTranslation();

    return () => {
      isMounted = false;
      stopAudio();
    };
  }, [hindiTranscript]);

  // Handler for saving edited text in review mode
  const handleSaveEdit = () => {
    if (editedText.trim().length === 0) {
      Alert.alert('Empty Translation', 'Please enter a valid translated text.');
      return;
    }
    setTranslatedText(editedText.trim());
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedText(translatedText);
    setIsEditing(false);
  };

  // Handler for approving translation and triggering real audio synthesis
  const handleApproveAndSpeak = async () => {
    try {
      const finalText = translatedText.trim();

      // If teacher edited original model output, persist to SQLite teacher_corrections table
      if (finalText !== originalTranslatedText && !wasCorrectionSaved) {
        await saveTeacherCorrection(hindiTranscript, originalTranslatedText, finalText);
        setWasCorrectionSaved(true);
        console.log('[TranslationResultScreen] Teacher correction queued in SQLite');
      }

      // Step 2: Speech Synthesis
      setStep('synthesizing');
      const ttsResult = await defaultTTS.synthesize(finalText);
      setAudioUri(ttsResult.audioUri);

      // Step 3: Real native audio playback using expo-av
      setStep('playing');
      console.log(`[TranslationResultScreen] Playing audio via expo-av: ${ttsResult.audioUri}`);

      await playAudio(
        ttsResult.audioUri,
        () => {
          setStep('completed');
        },
        (err) => {
          console.warn('[TranslationResultScreen] Playback error:', err);
          setStep('completed');
        }
      );
    } catch (err: any) {
      console.warn('[TranslationResultScreen] Downstream pipeline error:', err);
      setErrorMessage(err?.message || 'Failed to synthesize or play regional speech.');
      setStep('error');
    }
  };

  const handleReplay = async () => {
    if (audioUri) {
      setStep('playing');
      await playAudio(
        audioUri,
        () => setStep('completed'),
        () => setStep('completed')
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            stopAudio();
            navigation.goBack();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Record Another Prompt</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Classroom Translation</Text>
        <Text style={styles.headerSub}>Teacher Review & Verified Speech Output</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: Hindi Speech Recognized (Input) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, styles.hindiBadge]}>
                <Text style={styles.hindiBadgeText}>HINDI (STT TRANSCRIPT)</Text>
              </View>
              <Text style={styles.scriptLabel}>Script: Devanagari</Text>
            </View>
            <Text style={styles.statusDotIcon}>✓</Text>
          </View>
          <Text style={styles.hindiText}>{hindiTranscript}</Text>
        </View>

        {/* Section 2: Automated Pipeline Status Banner */}
        <View style={styles.pipelineStatusBar}>
          {step === 'translating' && (
            <View style={styles.statusInnerRow}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.statusText}>Translating Hindi to Santali (Ol Chiki)...</Text>
            </View>
          )}

          {step === 'reviewing' && (
            <View style={styles.statusInnerRow}>
              <Text style={styles.stepReviewIcon}>✍️</Text>
              <Text style={[styles.statusText, { color: '#b45309', fontWeight: '700' }]}>
                Teacher Verification Required: Review or edit before audio output
              </Text>
            </View>
          )}

          {step === 'synthesizing' && (
            <View style={styles.statusInnerRow}>
              <ActivityIndicator size="small" color="#059669" />
              <Text style={styles.statusText}>Synthesizing Santali Speech Audio...</Text>
            </View>
          )}

          {step === 'playing' && (
            <View style={[styles.statusInnerRow, styles.playingBar]}>
              <Text style={styles.audioWaveIcon}>🔊 ılılılllı</Text>
              <Text style={[styles.statusText, styles.playingText]}>
                Playing Santali Audio Response (expo-av)...
              </Text>
            </View>
          )}

          {step === 'completed' && (
            <View style={styles.statusInnerRow}>
              <Text style={styles.completedIcon}>✅</Text>
              <Text style={[styles.statusText, { color: '#047857', fontWeight: '700' }]}>
                Verified & Played • Pipeline Complete
              </Text>
            </View>
          )}

          {step === 'error' && (
            <View style={styles.statusInnerRow}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={[styles.statusText, { color: '#dc2626' }]}>
                {errorMessage || 'Error in translation or audio pipeline.'}
              </Text>
            </View>
          )}
        </View>

        {/* Section 3: Santali Translation & Teacher Review Card */}
        {translatedText ? (
          <View style={[styles.card, styles.santaliCard]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, styles.santaliBadge]}>
                  <Text style={styles.santaliBadgeText}>SANTALI TRANSLATION</Text>
                </View>
                {script && (
                  <Text style={[styles.scriptLabel, { color: '#047857' }]}>
                    Script: {script} (Ol Chiki)
                  </Text>
                )}
              </View>

              {step === 'reviewing' && !isEditing && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setIsEditing(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editButtonText}>✏️ Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Inline Editor or Display Text */}
            {isEditing ? (
              <View style={styles.editorContainer}>
                <Text style={styles.editorHint}>
                  Edit translation if needed. Corrections are saved to local SQLite and synced to server.
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={editedText}
                  onChangeText={setEditedText}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <View style={styles.editorActionRow}>
                  <TouchableOpacity
                    style={styles.cancelEditButton}
                    onPress={handleCancelEdit}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelEditText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveEditButton}
                    onPress={handleSaveEdit}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.saveEditText}>✓ Save Correction</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.santaliText}>{translatedText}</Text>
            )}

            {/* Correction saved banner */}
            {wasCorrectionSaved && (
              <View style={styles.correctionSavedBadge}>
                <Text style={styles.correctionSavedText}>
                  ✓ Teacher correction queued in local SQLite for backend sync
                </Text>
              </View>
            )}

            {/* Review Step Actions: Approve & Speak */}
            {step === 'reviewing' && !isEditing && (
              <View style={styles.approvalActionContainer}>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={handleApproveAndSpeak}
                  activeOpacity={0.85}
                >
                  <Text style={styles.approveButtonText}>✓ Approve & Speak (expo-av) →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Audio Track Information & Replay */}
            {audioUri && (step === 'playing' || step === 'completed') && (
              <View style={styles.audioMetaCard}>
                <View style={styles.audioMetaHeader}>
                  <Text style={styles.audioMetaTitle}>SYNTHESIZED AUDIO TRACK</Text>
                  {step === 'playing' && (
                    <View style={styles.liveIndicator}>
                      <Text style={styles.liveIndicatorText}>PLAYING NOW</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.audioMetaPath}>{audioUri}</Text>

                {step === 'completed' && (
                  <TouchableOpacity
                    style={styles.replayButton}
                    onPress={handleReplay}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.replayButtonText}>🔄 Replay Audio</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ) : null}

        {/* Section 4: Return Action */}
        <View style={styles.footerSection}>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => {
              stopAudio();
              navigation.goBack();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>🎙️ Speak Another Prompt</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
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
    marginBottom: 8,
  },
  backButtonText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  santaliCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  hindiBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  hindiBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1d4ed8',
    letterSpacing: 0.6,
  },
  santaliBadge: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  santaliBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.6,
  },
  scriptLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  statusDotIcon: {
    color: '#16a34a',
    fontWeight: '800',
    fontSize: 16,
  },
  hindiText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 28,
  },
  santaliText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#065f46',
    lineHeight: 30,
  },
  pipelineStatusBar: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepReviewIcon: {
    fontSize: 18,
  },
  playingBar: {
    backgroundColor: '#ecfdf5',
    padding: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },
  playingText: {
    color: '#065f46',
    fontWeight: '700',
  },
  audioWaveIcon: {
    fontSize: 18,
    color: '#059669',
  },
  completedIcon: {
    fontSize: 16,
  },
  errorIcon: {
    fontSize: 16,
  },
  editButton: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369a1',
  },
  editorContainer: {
    marginTop: 6,
    marginBottom: 10,
  },
  editorHint: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#3b82f6',
    padding: 12,
    fontSize: 16,
    color: '#0f172a',
    minHeight: 80,
  },
  editorActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  cancelEditButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  cancelEditText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 13,
  },
  saveEditButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#16a34a',
  },
  saveEditText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  approvalActionContainer: {
    marginTop: 16,
  },
  approveButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  approveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  correctionSavedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  correctionSavedText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '700',
  },
  audioMetaCard: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  audioMetaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  audioMetaTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.8,
  },
  liveIndicator: {
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveIndicatorText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  audioMetaPath: {
    fontSize: 12,
    color: '#475569',
    fontFamily: 'monospace',
  },
  replayButton: {
    marginTop: 10,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  replayButtonText: {
    color: '#15803d',
    fontWeight: '700',
    fontSize: 13,
  },
  footerSection: {
    marginTop: 10,
  },
  doneButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
