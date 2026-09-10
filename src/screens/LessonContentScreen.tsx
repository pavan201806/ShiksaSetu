import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Lesson } from '../services/syllabusService';
import { getLessonProgress, markLessonOpened, markLessonComplete } from '../services/database';
import { playAudio, stopAudio } from '../services/audioPlayer';

interface Props {
  navigation: any;
  route: any;
}

type ViewMode = 'bilingual' | 'english' | 'santali';

export const LessonContentScreen: React.FC<Props> = ({ navigation, route }) => {
  const { className, subjectName, chapterTitle, lesson } = route.params || {
    className: 'Class 1',
    subjectName: 'Mathematics',
    chapterTitle: 'Numbers 1 to 20',
    lesson: {
      id: 'l1',
      title: 'Counting 1 to 10',
      content: 'Sample lesson content for counting 1 to 10.',
      santaliContent: '᱑ ᱠᱷᱚᱱ ᱑᱐ ᱦᱟᱹᱵᱤᱡ ᱞᱮᱠᱷᱟ ᱥᱮᱪᱮᱫᱚᱜ ᱢᱮ᱾',
    } as Lesson,
  };

  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [lastOpened, setLastOpened] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('bilingual');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  useEffect(() => {
    // Record opening in SQLite and fetch current status
    markLessonOpened(lesson.id).catch((err) => console.warn('SQLite open error:', err));
    getLessonProgress(lesson.id)
      .then((prog) => {
        if (prog) {
          setIsCompleted(prog.completed === 1);
          setLastOpened(prog.last_opened_at);
        }
      })
      .catch((err) => console.warn('SQLite fetch error:', err));

    return () => {
      stopAudio();
    };
  }, [lesson.id]);

  const handleToggleComplete = async () => {
    try {
      await markLessonComplete(lesson.id);
      setIsCompleted(true);
      Alert.alert('Progress Recorded', `Lesson "${lesson.title}" marked as completed in SQLite!`);
    } catch (err) {
      Alert.alert('Database Error', 'Failed to update lesson progress.');
    }
  };

  const handleReadAloud = async (track: string = 'scenario_1.mp3') => {
    if (isPlayingAudio) {
      await stopAudio();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    await playAudio(
      track,
      () => {
        setIsPlayingAudio(false);
      },
      (err) => {
        console.warn('Audio playback error:', err);
        setIsPlayingAudio(false);
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back to Lessons</Text>
        </TouchableOpacity>
        <Text style={styles.breadCrumb}>
          {className} • {subjectName} • {chapterTitle}
        </Text>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Bar */}
        <View style={styles.progressStatusCard}>
          <View style={styles.statusLeft}>
            <View style={[styles.statusDot, { backgroundColor: isCompleted ? '#16a34a' : '#f59e0b' }]} />
            <Text style={styles.statusText}>
              Status:{' '}
              <Text style={{ fontWeight: '800', color: isCompleted ? '#16a34a' : '#b45309' }}>
                {isCompleted ? 'Completed ✓' : 'In Progress'}
              </Text>
            </Text>
          </View>
          {lastOpened && (
            <Text style={styles.timestampText}>
              Last opened: {new Date(lastOpened).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>

        {/* Bilingual View Mode Selector Tabs */}
        <View style={styles.modeTabsContainer}>
          <TouchableOpacity
            style={[styles.modeTab, viewMode === 'bilingual' ? styles.modeTabActive : null]}
            onPress={() => setViewMode('bilingual')}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeTabText, viewMode === 'bilingual' ? styles.modeTabTextActive : null]}>
              Bilingual (Both)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, viewMode === 'english' ? styles.modeTabActive : null]}
            onPress={() => setViewMode('english')}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeTabText, viewMode === 'english' ? styles.modeTabTextActive : null]}>
              English Only
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, viewMode === 'santali' ? styles.modeTabActive : null]}
            onPress={() => setViewMode('santali')}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeTabText, viewMode === 'santali' ? styles.modeTabTextActive : null]}>
              Santali (Ol Chiki)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Audio Player Action Bar */}
        <View style={styles.audioBar}>
          <View style={styles.audioBarLeft}>
            <Text style={styles.audioBarTitle}>Lesson Audio Assistant</Text>
            <Text style={styles.audioBarSub}>Offline native speech output (expo-av)</Text>
          </View>
          <TouchableOpacity
            style={[styles.audioActionButton, isPlayingAudio ? styles.audioActionButtonPlaying : null]}
            onPress={() => handleReadAloud('scenario_1.mp3')}
            activeOpacity={0.8}
          >
            <Text style={styles.audioActionText}>
              {isPlayingAudio ? '⏸️ Stop Audio' : '🔊 Read Aloud'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* English Content Card */}
        {(viewMode === 'bilingual' || viewMode === 'english') && (
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={[styles.badge, styles.englishBadge]}>
                <Text style={styles.englishBadgeText}>ENGLISH INSTRUCTION</Text>
              </View>
              <Text style={styles.scriptLabel}>Script: Latin</Text>
            </View>
            <Text style={styles.contentBody}>{lesson.content}</Text>
          </View>
        )}

        {/* Santali Content Card */}
        {(viewMode === 'bilingual' || viewMode === 'santali') && (
          <View style={[styles.card, styles.santaliCard]}>
            <View style={styles.cardTopRow}>
              <View style={[styles.badge, styles.santaliBadge]}>
                <Text style={styles.santaliBadgeText}>SANTALI (ᱥᱟᱱᱛᱟᱲᱤ)</Text>
              </View>
              <Text style={[styles.scriptLabel, { color: '#047857' }]}>Script: Ol Chiki</Text>
            </View>
            <Text style={styles.santaliContentBody}>
              {lesson.santaliContent ||
                'ᱯᱟᱹᱦᱤᱞ ᱪᱟᱱᱟᱪ ᱮᱞᱠᱷᱟ ᱥᱮᱪᱮᱫ (Lesson translation available in classroom phrasebook)'}
            </Text>
          </View>
        )}

        {/* Teacher Blackboard Tip */}
        <View style={styles.teacherTipCard}>
          <Text style={styles.tipHeader}>💡 Teacher Blackboard Tip</Text>
          <Text style={styles.tipText}>
            Read the English concept first, then repeat the Santali Ol Chiki explanation so bilingual learners easily bridge both languages.
          </Text>
        </View>

        {/* Action Buttons */}
        {/* Create Practice Worksheet from this Lesson */}
        <TouchableOpacity
          style={styles.createWorksheetButton}
          onPress={() =>
            navigation.navigate('GenerateWorksheet', {
              classId: route.params?.classId || 1,
              className,
              subjectName,
              defaultTopic: lesson.title,
              sourceContent: lesson.content,
            })
          }
          activeOpacity={0.8}
        >
          <Text style={styles.createWorksheetText}>
            ✨ Create Practice Worksheet from this Lesson
          </Text>
        </TouchableOpacity>

        {!isCompleted ? (
          <TouchableOpacity
            style={styles.markCompleteButton}
            onPress={handleToggleComplete}
            activeOpacity={0.8}
          >
            <Text style={styles.markCompleteText}>✓ Mark Lesson as Completed</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.alreadyCompletedBanner}>
            <Text style={styles.alreadyCompletedText}>✓ Lesson Completed & Saved to Local SQLite</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.doneButtonText}>Return to Chapter List</Text>
        </TouchableOpacity>
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
  breadCrumb: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  lessonTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  scrollContent: {
    padding: 20,
  },
  progressStatusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 13,
    color: '#334155',
  },
  timestampText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  modeTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    padding: 4,
    borderRadius: 12,
    marginBottom: 16,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  modeTabActive: {
    backgroundColor: '#1e40af',
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  modeTabTextActive: {
    color: '#ffffff',
  },
  audioBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  audioBarLeft: {
    flex: 1,
    marginRight: 10,
  },
  audioBarTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  audioBarSub: {
    fontSize: 11,
    color: '#64748b',
  },
  audioActionButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  audioActionButtonPlaying: {
    backgroundColor: '#dc2626',
  },
  audioActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  santaliCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  englishBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  englishBadgeText: {
    color: '#1d4ed8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  santaliBadge: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  santaliBadgeText: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  scriptLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  contentBody: {
    fontSize: 16,
    lineHeight: 26,
    color: '#1e293b',
  },
  santaliContentBody: {
    fontSize: 17,
    lineHeight: 28,
    color: '#14532d',
    fontWeight: '600',
  },
  teacherTipCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 20,
  },
  tipHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 19,
  },
  markCompleteButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
  },
  markCompleteText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  alreadyCompletedBanner: {
    backgroundColor: '#dcfce7',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  alreadyCompletedText: {
    color: '#15803d',
    fontSize: 13,
    fontWeight: '700',
  },
  createWorksheetButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  createWorksheetText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  doneButton: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
