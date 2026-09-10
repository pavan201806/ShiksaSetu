import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { CLASSES_LIST, ClassItem } from '../services/syllabusService';

interface Props {
  navigation: any;
}

export const ClassSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const handleSelectClass = (classItem: ClassItem) => {
    navigation.navigate('SubjectSelection', { classId: classItem.id, className: classItem.name });
  };

  const renderClassItem = ({ item }: { item: ClassItem }) => (
    <TouchableOpacity
      style={styles.classCard}
      onPress={() => handleSelectClass(item)}
      activeOpacity={0.8}
    >
      <View style={styles.classNumberBadge}>
        <Text style={styles.classNumberText}>{item.id}</Text>
      </View>

      <View style={styles.classInfo}>
        <Text style={styles.className}>{item.name}</Text>
        <Text style={styles.classDescription}>{item.description}</Text>
      </View>

      <Text style={styles.arrowText}>→</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Class</Text>
        <Text style={styles.headerSub}>Choose a primary grade to view subjects & syllabus</Text>
      </View>

      <FlatList
        data={CLASSES_LIST}
        keyExtractor={(item: ClassItem) => item.id.toString()}
        renderItem={renderClassItem}
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
  classCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  classNumberBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  classNumberText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  classDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  arrowText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    marginLeft: 12,
  },
});
