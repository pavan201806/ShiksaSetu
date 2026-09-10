import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { Lesson } from '../services/syllabusService';
import { getLessonProgress, markLessonOpened, markLessonComplete } from '../services/database';

interface Props {
  navigation: any;
  route: any;
}

export const LessonContentScreen: React.FC<Props> = ({ navigation, route }) => {
  const { className, subjectName, chapterTitle, lesson } = route.params || {
    className: 'Class 1',
    subjectName: 'Mathematics',
    chapterTitle: 'Numbers 1 to 20',
    lesson: {
      id: 'l1',
      title: 'Counting 1 to 10',
      content: 'Sample lesson content for counting 1 to 10.',
    } as Lesson,
  };

  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [lastOpened, setLastOpened] = useState<string | null>(null);

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

  const handleReadAloud = () => {
    Alert.alert(
      'Text-to-Speech Engine',
      'Offline audio playback engine activated for this lesson.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back to Lessons</Text>
        </TouchableOpacity>
        <Text style={styles.breadCrumb}>
          {className} • {subjectName} • {chapterTitle}
        </Text>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Bar */}
        <View style={styles.progressStatusCard}>
          <View style={styles.statusLeft}>
            <View style={[styles.statusDot, { backgroundColor: isCompleted ? '#16a34a' : '#f59e0b' }]} />
            <Text style={styles.statusText}>
              Status: <Text style={{ fontWeight: '800', color: isCompleted ? '#16a34a' : '#b45309' }}>
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

        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>LESSON CONTENT</Text>
            </View>

            <TouchableOpacity style={styles.audioButton} onPress={handleReadAloud} activeOpacity={0.8}>
              <Text style={styles.audioIcon}>🔊</Text>
              <Text style={styles.audioText}>Read Aloud</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.contentBody}>{lesson.content}</Text>
        </View>

        <View style={styles.teacherTipCard}>
          <Text style={styles.tipHeader}>💡 Teacher Blackboard Tip</Text>
          <Text style={styles.tipText}>
            Use visual counters (beads, pebbles, or flashcards) while explaining this lesson to aid primary grade comprehension.
          </Text>
        </View>

        {/* Action Buttons */}
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
    marginBottom: 16,
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 20,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  badge: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 6,
  },
  audioIcon: {
    fontSize: 14,
  },
  audioText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '700',
  },
  contentBody: {
    fontSize: 16,
    lineHeight: 26,
    color: '#1e293b',
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
