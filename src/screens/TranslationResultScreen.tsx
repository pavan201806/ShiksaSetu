import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MockTranslator } from '../services/voicePipeline/mockTranslator';
import { RecordedAudioTTS } from '../services/voicePipeline/recordedAudioTTS';
import { Translator, SpeechSynthesizer } from '../services/voicePipeline/interfaces';

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

type PipelineStep = 'translating' | 'synthesizing' | 'playing' | 'completed' | 'error';

export const TranslationResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const hindiTranscript = route.params?.hindiTranscript || 'कोई आवाज नहीं पहचानी गई (No speech recognized)';

  const [step, setStep] = useState<PipelineStep>('translating');
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [script, setScript] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function executeDownstreamPipeline() {
      try {
        // Step 1: Automatic Hindi -> Santali Translation
        if (isMounted) setStep('translating');
        const translationResult = await defaultTranslator.translate(hindiTranscript);
        if (!isMounted) return;

        setTranslatedText(translationResult.translatedText);
        setScript(translationResult.script);

        // Step 2: Automatic Speech Synthesis (TTS)
        if (isMounted) setStep('synthesizing');
        const ttsResult = await defaultTTS.synthesize(translationResult.translatedText);
        if (!isMounted) return;

        setAudioUri(ttsResult.audioUri);

        // Step 3: Automatically Play Santali Audio Output (Hands-Free)
        if (isMounted) setStep('playing');
        console.log(`[TranslationResultScreen] Auto-playing Santali speech: ${ttsResult.audioUri}`);

        // Maintain active playing state for audio demonstration
        const timer = setTimeout(() => {
          if (isMounted) {
            setStep('completed');
          }
        }, 2500);

        return () => clearTimeout(timer);
      } catch (err: any) {
        console.warn('[TranslationResultScreen] Downstream pipeline error:', err);
        if (isMounted) {
          setErrorMessage(err?.message || 'Failed to process downstream translation & audio.');
          setStep('error');
        }
      }
    }

    executeDownstreamPipeline();

    return () => {
      isMounted = false;
    };
  }, [hindiTranscript]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Record Another Prompt</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Translation & Audio Result</Text>
        <Text style={styles.headerSub}>Automatic Offline Classroom Assistant Pipeline</Text>
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
              <Text style={styles.statusText}>
                Translating Hindi to Santali (Ol Chiki)...
              </Text>
            </View>
          )}

          {step === 'synthesizing' && (
            <View style={styles.statusInnerRow}>
              <ActivityIndicator size="small" color="#059669" />
              <Text style={styles.statusText}>
                Synthesizing Santali Speech Audio...
              </Text>
            </View>
          )}

          {step === 'playing' && (
            <View style={[styles.statusInnerRow, styles.playingBar]}>
              <Text style={styles.audioWaveIcon}>🔊 ılılılllı</Text>
              <Text style={[styles.statusText, styles.playingText]}>
                Auto-playing Santali Audio Response...
              </Text>
            </View>
          )}

          {step === 'completed' && (
            <View style={styles.statusInnerRow}>
              <Text style={styles.completedIcon}>✅</Text>
              <Text style={[styles.statusText, { color: '#047857', fontWeight: '700' }]}>
                Pipeline Complete • Audio Output Finished
              </Text>
            </View>
          )}

          {step === 'error' && (
            <View style={styles.statusInnerRow}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={[styles.statusText, { color: '#dc2626' }]}>
                {errorMessage || 'Error in automatic translation/audio pipeline.'}
              </Text>
            </View>
          )}
        </View>

        {/* Section 3: Santali Translation (Output) */}
        {translatedText ? (
          <View style={[styles.card, styles.santaliCard]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, styles.santaliBadge]}>
                  <Text style={styles.santaliBadgeText}>SANTALI (TRANSLATED)</Text>
                </View>
                {script && (
                  <Text style={[styles.scriptLabel, { color: '#047857' }]}>
                    Script: {script} (Ol Chiki)
                  </Text>
                )}
              </View>
            </View>

            <Text style={styles.santaliText}>{translatedText}</Text>

            {/* Audio Track Information */}
            {audioUri && (
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
              </View>
            )}
          </View>
        ) : null}

        {/* Section 4: Return Action (No manual Translate or Play buttons) */}
        <View style={styles.footerSection}>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
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
  playingBar: {
    backgroundColor: '#ecfdf5',
    padding: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
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
