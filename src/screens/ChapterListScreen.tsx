import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSyllabusData, Chapter, Lesson } from '../services/syllabusService';
import {
  getAllLessonProgress,
  getGeneratedWorksheets,
  deleteGeneratedWorksheet,
  GeneratedWorksheet,
} from '../services/database';

interface Props {
  navigation: any;
  route: any;
}

export const ChapterListScreen: React.FC<Props> = ({ navigation, route }) => {
  const { classId, className, subjectId, subjectName } = route.params || {
    classId: 1,
    className: 'Class 1',
    subjectId: 'mathematics',
    subjectName: 'Mathematics',
  };

  const syllabus = getSyllabusData(classId, subjectId);
  const [progressMap, setProgressMap] = useState<Record<string, { completed: boolean; last_opened_at: string }>>({});
  const [worksheets, setWorksheets] = useState<GeneratedWorksheet[]>([]);

  const loadData = useCallback(() => {
    getAllLessonProgress()
      .then((map) => setProgressMap(map))
      .catch((err) => console.warn('Failed to load lesson progress:', err));

    getGeneratedWorksheets(classId, subjectId)
      .then((list) => setWorksheets(list))
      .catch((err) => console.warn('Failed to load worksheets:', err));
  }, [classId, subjectId]);

  // Reload progress and worksheets whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDeleteWorksheet = (id: string, title: string) => {
    Alert.alert(
      'Delete Worksheet',
      `Are you sure you want to delete "${title}" from offline storage?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGeneratedWorksheet(id);
              loadData();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete worksheet.');
            }
          },
        },
      ]
    );
  };

  // Compute stats
  let totalLessons = 0;
  let completedCount = 0;

  if (syllabus && syllabus.chapters) {
    for (const ch of syllabus.chapters) {
      for (const l of ch.lessons) {
        totalLessons++;
        if (progressMap[l.id]?.completed) {
          completedCount++;
        }
      }
    }
  }

  const completionPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const handleOpenLesson = (chapterTitle: string, lesson: Lesson) => {
    navigation.navigate('LessonContent', {
      classId,
      className,
      subjectName,
      chapterTitle,
      lesson,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back to Subjects</Text>
        </TouchableOpacity>
        <View style={styles.tagRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{className.toUpperCase()}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
            <Text style={[styles.badgeText, { color: '#b45309' }]}>{subjectName.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.headerTitle}>Chapters & Lessons</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewTitle}>Curriculum Progress (SQLite)</Text>
            <Text style={styles.overviewBadge}>
              {completedCount} / {totalLessons} Completed ({completionPercentage}%)
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${completionPercentage}%` }]} />
          </View>
        </View>

        {/* AI Worksheet Generator Action Card */}
        <TouchableOpacity
          style={styles.aiActionCard}
          onPress={() =>
            navigation.navigate('GenerateWorksheet', {
              classId,
              className,
              subjectId,
              subjectName,
            })
          }
          activeOpacity={0.85}
        >
          <View style={styles.aiActionLeft}>
            <View style={styles.aiSparkleBadge}>
              <Text style={styles.aiSparkleIcon}>✨</Text>
            </View>
            <View style={styles.aiActionTextContainer}>
              <Text style={styles.aiActionTitle}>Generate AI Bilingual Worksheet</Text>
              <Text style={styles.aiActionSub}>
                Create custom FLN worksheets in English & Ol Chiki (ᱚᱞ ᱪᱤᱠᱤ)
              </Text>
            </View>
          </View>
          <View style={styles.aiActionArrow}>
            <Text style={styles.aiActionArrowText}>Create →</Text>
          </View>
        </TouchableOpacity>

        {/* Offline Saved AI Worksheets Section */}
        {worksheets.length > 0 && (
          <View style={styles.generatedSectionCard}>
            <View style={styles.generatedSectionHeader}>
              <View>
                <Text style={styles.generatedSectionTag}>AI PRACTICE REPOSITORY</Text>
                <Text style={styles.generatedSectionTitle}>
                  Saved Worksheets ({worksheets.length})
                </Text>
              </View>
              <View style={styles.offlineBadgeSmall}>
                <Text style={styles.offlineBadgeSmallText}>💾 SQLite Stored</Text>
              </View>
            </View>

            <View style={styles.lessonsContainer}>
              {worksheets.map((ws, wIndex) => (
                <View key={ws.id} style={styles.worksheetItemRow}>
                  <TouchableOpacity
                    style={styles.worksheetItemContent}
                    onPress={() =>
                      handleOpenLesson('AI Bilingual Worksheets', {
                        id: ws.id,
                        title: ws.title,
                        content: ws.english_content,
                        santaliContent: ws.santali_content,
                        isGenerated: true,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.worksheetBadge}>
                      <Text style={styles.worksheetBadgeText}>WS{wIndex + 1}</Text>
                    </View>
                    <View style={styles.lessonTextContainer}>
                      <Text style={styles.lessonTitle} numberOfLines={1}>
                        {ws.title}
                      </Text>
                      <Text style={styles.lessonSnippet} numberOfLines={1}>
                        Topic: {ws.topic}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteWorksheetButton}
                    onPress={() => handleDeleteWorksheet(ws.id, ws.title)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.deleteWorksheetIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {!syllabus || syllabus.chapters.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No chapter content found for this selection.</Text>
          </View>
        ) : (
          syllabus.chapters.map((chapter: Chapter, index: number) => (
            <View key={chapter.id} style={styles.chapterCard}>
              <View style={styles.chapterHeader}>
                <Text style={styles.chapterIndex}>CHAPTER {index + 1}</Text>
                <Text style={styles.chapterTitle}>{chapter.title}</Text>
              </View>

              <View style={styles.lessonsContainer}>
                {chapter.lessons.map((lesson: Lesson, lIndex: number) => {
                  const isDone = progressMap[lesson.id]?.completed;
                  const isOpened = progressMap[lesson.id] !== undefined;

                  return (
                    <TouchableOpacity
                      key={lesson.id}
                      style={[styles.lessonItem, isDone ? styles.lessonItemCompleted : null]}
                      onPress={() => handleOpenLesson(chapter.title, lesson)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.lessonLeft}>
                        <View style={[styles.lessonBadge, isDone ? styles.lessonBadgeDone : null]}>
                          <Text style={styles.lessonBadgeText}>{isDone ? '✓' : `L${lIndex + 1}`}</Text>
                        </View>
                        <View style={styles.lessonTextContainer}>
                          <View style={styles.lessonTitleRow}>
                            <Text style={[styles.lessonTitle, isDone ? styles.lessonTitleDone : null]}>
                              {lesson.title}
                            </Text>
                            {isDone && (
                              <View style={styles.doneChip}>
                                <Text style={styles.doneChipText}>DONE</Text>
                              </View>
                            )}
                            {!isDone && isOpened && (
                              <View style={styles.openedChip}>
                                <Text style={styles.openedChipText}>STARTED</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.lessonSnippet} numberOfLines={1}>
                            {lesson.content}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.openArrow, isDone ? { color: '#16a34a' } : null]}>
                        {isDone ? 'Review →' : 'Open →'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
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
    marginBottom: 12,
  },
  backButtonText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  badge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '800',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
  },
  scrollContent: {
    padding: 20,
  },
  overviewCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    elevation: 2,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  overviewBadge: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 15,
  },
  chapterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    elevation: 2,
  },
  chapterHeader: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  chapterIndex: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  chapterTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  lessonsContainer: {
    gap: 10,
  },
  lessonItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  lessonItemCompleted: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  lessonBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lessonBadgeDone: {
    backgroundColor: '#16a34a',
  },
  lessonBadgeText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  lessonTextContainer: {
    flex: 1,
  },
  lessonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  lessonTitleDone: {
    color: '#14532d',
  },
  doneChip: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  doneChipText: {
    color: '#15803d',
    fontSize: 9,
    fontWeight: '800',
  },
  openedChip: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  openedChipText: {
    color: '#b45309',
    fontSize: 9,
    fontWeight: '800',
  },
  lessonSnippet: {
    fontSize: 12,
    color: '#64748b',
  },
  openArrow: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 13,
  },
  aiActionCard: {
    backgroundColor: '#1e40af',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  aiActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  aiSparkleBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiSparkleIcon: {
    fontSize: 18,
  },
  aiActionTextContainer: {
    flex: 1,
  },
  aiActionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  aiActionSub: {
    fontSize: 11,
    color: '#bfdbfe',
    marginTop: 2,
  },
  aiActionArrow: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  aiActionArrowText: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: '800',
  },
  generatedSectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#93c5fd',
    elevation: 2,
  },
  generatedSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  generatedSectionTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  generatedSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  offlineBadgeSmall: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  offlineBadgeSmallText: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '800',
  },
  worksheetItemRow: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  worksheetItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  worksheetBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  worksheetBadgeText: {
    color: '#1d4ed8',
    fontWeight: '800',
    fontSize: 11,
  },
  worksheetTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  worksheetTopic: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  deleteWorksheetButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  deleteWorksheetIcon: {
    fontSize: 14,
  },
});
