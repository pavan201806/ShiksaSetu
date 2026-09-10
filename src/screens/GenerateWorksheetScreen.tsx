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
import { generateWorksheet, WorksheetGenerateResponse, checkBackendHealth } from '../services/api';
import { saveGeneratedWorksheet, GeneratedWorksheet } from '../services/database';
import { isNetworkConnected } from '../services/syncService';
import { CLASSES_LIST, SUBJECTS_LIST } from '../services/syllabusService';

interface Props {
  navigation: any;
  route: any;
}

const TOPIC_SUGGESTIONS: Record<string, string[]> = {
  mathematics: ['Counting 1 to 10', 'Addition with Fruits', 'Shapes & Patterns', 'Skip Counting by 2s'],
  science: ['Living and Non-living', 'Parts of a Plant', 'Animals and their Babies', 'Our Sense Organs'],
  language: ['Opposite Words', 'Rhyming Words', 'Naming Words (Nouns)', 'Simple Action Words'],
};

export const GenerateWorksheetScreen: React.FC<Props> = ({ navigation, route }) => {
  const params = route.params || {};

  const [selectedClass, setSelectedClass] = useState<number>(params.classId || 1);
  const [selectedSubject, setSelectedSubject] = useState<string>(
    (params.subjectId || 'mathematics').toLowerCase()
  );
  const [topic, setTopic] = useState<string>(params.defaultTopic || '');
  const [context, setContext] = useState<string>(params.sourceContent || '');

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generatedResult, setGeneratedResult] = useState<GeneratedWorksheet | null>(null);
  const [resultSource, setResultSource] = useState<string>('');

  useEffect(() => {
    checkConnectivity();
  }, []);

  const checkConnectivity = async () => {
    const net = await isNetworkConnected();
    if (!net) {
      setIsOnline(false);
      return;
    }
    const health = await checkBackendHealth();
    setIsOnline(Boolean(health));
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      Alert.alert('Topic Required', 'Please enter or select a topic for the worksheet.');
      return;
    }

    const net = await isNetworkConnected();
    if (!net) {
      setIsOnline(false);
      Alert.alert('Offline Mode', 'AI worksheet generation requires an active network connection.');
      return;
    }

    setIsGenerating(true);
    setGenerationStep('Connecting to AI curriculum engine...');

    try {
      setTimeout(() => {
        setGenerationStep('Formulating Class ' + selectedClass + ' pedagogical questions...');
      }, 700);

      setTimeout(() => {
        setGenerationStep('Translating into authentic Santali (ᱚᱞ ᱪᱤᱠᱤ) script...');
      }, 1500);

      const res: WorksheetGenerateResponse = await generateWorksheet({
        classId: selectedClass,
        subject: selectedSubject,
        topic: topic.trim(),
        existingEnglishContent: context.trim() || undefined,
      });

      const worksheetRecord: GeneratedWorksheet = {
        id: res.id,
        class_id: res.classId,
        subject_id: res.subject.toLowerCase(),
        topic: res.topic,
        title: res.title,
        english_content: res.englishContent,
        santali_content: res.santaliContent,
        created_at: res.createdAt,
      };

      // Persist permanently in SQLite for offline access
      await saveGeneratedWorksheet(worksheetRecord);

      setGeneratedResult(worksheetRecord);
      setResultSource(res.source || 'gemini');
    } catch (err: any) {
      console.warn('[GenerateWorksheet] Error:', err);
      Alert.alert(
        'Generation Error',
        err?.message || 'Failed to generate worksheet. Please verify backend server reachability.'
      );
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleOpenWorksheet = () => {
    if (!generatedResult) return;

    const matchedSubject = SUBJECTS_LIST.find((s) => s.id === selectedSubject);
    navigation.navigate('LessonContent', {
      classId: selectedClass,
      className: `Class ${selectedClass}`,
      subjectName: matchedSubject?.name || 'Subject',
      chapterTitle: 'AI Practice Worksheet',
      lesson: {
        id: generatedResult.id,
        title: generatedResult.title,
        content: generatedResult.english_content,
        santaliContent: generatedResult.santali_content,
        isGenerated: true,
      },
    });
  };

  const handleResetForNew = () => {
    setGeneratedResult(null);
    setTopic('');
    setContext('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back to Chapters</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>✨ AI Bilingual Worksheet</Text>
        <Text style={styles.headerSubtitle}>
          Generates FLN practice sheets in English and Ol Chiki (ᱚᱞ ᱪᱤᱠᱤ)
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Offline Warning Banner */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerTitle}>⚠️ Online Connection Required</Text>
            <Text style={styles.offlineBannerBody}>
              AI worksheet generation connects to the backend to generate customized bilingual content.
              Once generated, worksheets are stored in SQLite and accessible 100% offline forever.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={checkConnectivity}>
              <Text style={styles.retryButtonText}>🔄 Check Connection</Text>
            </TouchableOpacity>
          </View>
        )}

        {generatedResult ? (
          /* Result Card */
          <View style={styles.resultContainer}>
            <View style={styles.successBanner}>
              <View style={styles.successBadge}>
                <Text style={styles.successBadgeText}>✓ SAVED TO OFFLINE SQLITE</Text>
              </View>
              <View style={styles.sourceBadge}>
                <Text style={styles.sourceBadgeText}>
                  {resultSource === 'gemini' ? '🤖 Gemini AI' : '📚 FLN Curated'}
                </Text>
              </View>
            </View>

            <Text style={styles.resultTitle}>{generatedResult.title}</Text>
            <Text style={styles.resultTopicMeta}>
              Class {generatedResult.class_id} • {generatedResult.subject_id.toUpperCase()} • {generatedResult.topic}
            </Text>

            {/* English Content Card */}
            <View style={styles.contentCard}>
              <View style={styles.contentHeaderRow}>
                <Text style={styles.contentLanguageTag}>ENGLISH WORKSHEET</Text>
                <Text style={styles.contentScriptTag}>Script: Latin</Text>
              </View>
              <Text style={styles.contentText}>{generatedResult.english_content}</Text>
            </View>

            {/* Santali Content Card */}
            <View style={[styles.contentCard, styles.santaliContentCard]}>
              <View style={styles.contentHeaderRow}>
                <Text style={[styles.contentLanguageTag, { color: '#15803d' }]}>
                  SANTALI (ᱥᱟᱱᱛᱟᱲᱤ)
                </Text>
                <Text style={[styles.contentScriptTag, { color: '#047857' }]}>
                  Script: Ol Chiki
                </Text>
              </View>
              <Text style={styles.santaliContentText}>{generatedResult.santali_content}</Text>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.openLessonButton}
              onPress={handleOpenWorksheet}
              activeOpacity={0.8}
            >
              <Text style={styles.openLessonButtonText}>📖 Practice in Interactive Viewer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.generateAnotherButton}
              onPress={handleResetForNew}
              activeOpacity={0.8}
            >
              <Text style={styles.generateAnotherButtonText}>➕ Create Another Worksheet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Configuration & Generation Form */
          <View style={styles.formCard}>
            {/* Class Selection */}
            <Text style={styles.inputLabel}>SELECT CLASS (FOUNDATIONAL STAGE)</Text>
            <View style={styles.pillRow}>
              {CLASSES_LIST.map((cls) => (
                <TouchableOpacity
                  key={cls.id}
                  style={[styles.pill, selectedClass === cls.id ? styles.pillActive : null]}
                  onPress={() => setSelectedClass(cls.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pillText,
                      selectedClass === cls.id ? styles.pillTextActive : null,
                    ]}
                  >
                    Class {cls.id}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Subject Selection */}
            <Text style={styles.inputLabel}>SELECT SUBJECT</Text>
            <View style={styles.pillRow}>
              {SUBJECTS_LIST.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  style={[
                    styles.pill,
                    selectedSubject === sub.id ? styles.pillActive : null,
                  ]}
                  onPress={() => setSelectedSubject(sub.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pillText,
                      selectedSubject === sub.id ? styles.pillTextActive : null,
                    ]}
                  >
                    {sub.icon} {sub.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Topic Input */}
            <Text style={styles.inputLabel}>WORKSHEET TOPIC</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Counting 1 to 10 or Parts of Plants"
              placeholderTextColor="#94a3b8"
              value={topic}
              onChangeText={setTopic}
              editable={!isGenerating}
            />

            {/* Topic Suggestions */}
            <Text style={styles.subLabel}>Quick Topic Ideas:</Text>
            <View style={styles.suggestionRow}>
              {(TOPIC_SUGGESTIONS[selectedSubject] || []).map((sugg, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionChip}
                  onPress={() => setTopic(sugg)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionChipText}>+ {sugg}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Context / Reference Text */}
            <Text style={styles.inputLabel}>LESSON CONTEXT / SPECIAL INSTRUCTIONS (OPTIONAL)</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              placeholder="Add lesson text or specific question styles (e.g. include matching and count activities)"
              placeholderTextColor="#94a3b8"
              value={context}
              onChangeText={setContext}
              multiline
              numberOfLines={3}
              editable={!isGenerating}
            />

            {/* Action Button */}
            {isGenerating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>{generationStep}</Text>
                <Text style={styles.loadingSub}>Synthesizing bilingual FLN content...</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.generateButton,
                  !isOnline ? styles.generateButtonDisabled : null,
                ]}
                onPress={handleGenerate}
                disabled={!isOnline || isGenerating}
                activeOpacity={0.8}
              >
                <Text style={styles.generateButtonText}>
                  ✨ Generate Bilingual Worksheet
                </Text>
              </TouchableOpacity>
            )}
          </View>
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
    marginBottom: 8,
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
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
  },
  offlineBanner: {
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 20,
  },
  offlineBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#b45309',
    marginBottom: 4,
  },
  offlineBannerBody: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 18,
    marginBottom: 10,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  retryButtonText: {
    color: '#92400e',
    fontWeight: '700',
    fontSize: 12,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 14,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pillActive: {
    backgroundColor: '#1e40af',
    borderColor: '#1d4ed8',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  pillTextActive: {
    color: '#ffffff',
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  suggestionChip: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  suggestionChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  generateButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    elevation: 3,
  },
  generateButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e40af',
    marginTop: 14,
    textAlign: 'center',
  },
  loadingSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  resultContainer: {
    gap: 16,
  },
  successBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  successBadgeText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '800',
  },
  sourceBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sourceBadgeText: {
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '800',
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  resultTopicMeta: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  santaliContentCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  contentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  contentLanguageTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1d4ed8',
    letterSpacing: 0.8,
  },
  contentScriptTag: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  contentText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#1e293b',
  },
  santaliContentText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#14532d',
    fontWeight: '600',
  },
  openLessonButton: {
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 2,
  },
  openLessonButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  generateAnotherButton: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  generateAnotherButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
