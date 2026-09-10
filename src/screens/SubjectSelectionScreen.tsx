import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SUBJECTS_LIST, SubjectItem, getSyllabusData } from '../services/syllabusService';
import { getAllLessonProgress } from '../services/database';

interface Props {
  navigation: any;
  route: any;
}

export const SubjectSelectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { classId, className } = route.params || { classId: 1, className: 'Class 1' };
  const [progressMap, setProgressMap] = useState<Record<string, { completed: boolean; last_opened_at: string }>>({});

  useFocusEffect(
    useCallback(() => {
      getAllLessonProgress()
        .then((map) => setProgressMap(map))
        .catch((err) => console.warn('Failed to load progress in SubjectSelection:', err));
    }, [])
  );

  const getSubjectStats = (subjectId: string) => {
    const syllabus = getSyllabusData(classId, subjectId);
    let total = 0;
    let completed = 0;
    if (syllabus && syllabus.chapters) {
      for (const ch of syllabus.chapters) {
        for (const l of ch.lessons) {
          total++;
          if (progressMap[l.id]?.completed) {
            completed++;
          }
        }
      }
    }
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  };

  const handleSelectSubject = (subject: SubjectItem) => {
    navigation.navigate('ChapterList', {
      classId,
      className,
      subjectId: subject.id,
      subjectName: subject.name,
    });
  };

  const renderSubjectItem = ({ item }: { item: SubjectItem }) => {
    const stats = getSubjectStats(item.id);

    return (
      <TouchableOpacity
        style={[styles.subjectCard, { borderColor: item.color }]}
        onPress={() => handleSelectSubject(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconBox, { backgroundColor: item.color }]}>
          <Text style={styles.iconText}>{item.icon}</Text>
        </View>

        <View style={styles.subjectInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.subjectName}>{item.name}</Text>
            {stats.completed > 0 && stats.completed === stats.total ? (
              <View style={styles.doneBadge}>
                <Text style={styles.doneBadgeText}>✓ DONE</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.subjectSub}>
            Progress: {stats.completed} of {stats.total} Lessons ({stats.percent}%)
          </Text>

          {/* Mini progress bar */}
          <View style={styles.miniTrack}>
            <View style={[styles.miniFill, { width: `${stats.percent}%`, backgroundColor: item.color }]} />
          </View>
        </View>

        <Text style={[styles.arrowText, { color: item.color }]}>→</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back to Classes</Text>
        </TouchableOpacity>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{className.toUpperCase()}</Text>
        </View>
        <Text style={styles.headerTitle}>Select Subject</Text>
        <Text style={styles.headerSub}>Choose a course subject to access chapters & track progress</Text>
      </View>

      <FlatList
        data={SUBJECTS_LIST}
        keyExtractor={(item: SubjectItem) => item.id}
        renderItem={renderSubjectItem}
        contentContainerStyle={styles.listContent}
      />
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
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
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
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: '#64748b',
  },
  listContent: {
    padding: 20,
  },
  subjectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 26,
  },
  subjectInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  doneBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  doneBadgeText: {
    color: '#15803d',
    fontSize: 9,
    fontWeight: '800',
  },
  subjectSub: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
  },
  miniTrack: {
    height: 5,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    width: '90%',
  },
  miniFill: {
    height: '100%',
    borderRadius: 3,
  },
  arrowText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});
