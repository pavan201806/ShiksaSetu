import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  TextInput,
} from 'react-native';
import phrasebookData from '../data/phrasebook.json';
import { playAudio, stopAudio } from '../services/audioPlayer';

interface PhraseItem {
  id: string;
  category: string;
  english: string;
  hindi: string;
  santali: string;
  script: string;
  audioFile: string;
}

interface Props {
  navigation: any;
}

const CATEGORIES = [
  'All',
  'Greetings',
  'Instructions',
  'Discipline',
  'Blackboard',
  'Learning',
  'Encouragement',
  'Questions',
  'Closing',
];

export const PhrasebookScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [playingPhraseId, setPlayingPhraseId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      // Clean up audio on unmount
      stopAudio();
    };
  }, []);

  const handlePlayPhrase = async (phrase: PhraseItem) => {
    if (playingPhraseId === phrase.id) {
      // Stop if currently playing
      await stopAudio();
      setPlayingPhraseId(null);
      return;
    }

    setPlayingPhraseId(phrase.id);
    await playAudio(
      phrase.audioFile,
      () => {
        setPlayingPhraseId(null);
      },
      (err) => {
        console.warn('Playback error:', err);
        setPlayingPhraseId(null);
      }
    );
  };

  const filteredPhrases = phrasebookData.filter((item: PhraseItem) => {
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.hindi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.santali.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderPhraseCard = ({ item }: { item: PhraseItem }) => {
    const isPlaying = playingPhraseId === item.id;

    return (
      <TouchableOpacity
        style={[styles.card, isPlaying ? styles.cardPlaying : null]}
        onPress={() => handlePlayPhrase(item)}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category.toUpperCase()}</Text>
          </View>
          <View style={[styles.playButton, isPlaying ? styles.playButtonActive : null]}>
            <Text style={styles.playButtonIcon}>{isPlaying ? '⏸️ Playing' : '🔊 Tap to Speak'}</Text>
          </View>
        </View>

        {/* English Text */}
        <Text style={styles.englishText}>{item.english}</Text>

        {/* Hindi Subtext */}
        <Text style={styles.hindiText}>{item.hindi}</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Santali Ol Chiki Translation */}
        <View style={styles.santaliContainer}>
          <View style={styles.scriptRow}>
            <Text style={styles.santaliLabel}>SANTALI (OL CHIKI):</Text>
            <Text style={styles.scriptTag}>Script: {item.script}</Text>
          </View>
          <Text style={styles.santaliText}>{item.santali}</Text>
        </View>

        {/* Playing indicator footer */}
        {isPlaying && (
          <View style={styles.playingIndicator}>
            <Text style={styles.playingWave}>🔊 ılılılllı</Text>
            <Text style={styles.playingText}>Playing audio output through speaker...</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Teacher&apos;s Phrasebook</Text>
        <Text style={styles.headerSub}>
          Essential Multilingual Classroom Phrases (English • Hindi • Santali)
        </Text>
      </View>

      {/* Search & Category Filter */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search phrases in English, Hindi, or Santali..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category horizontal pills */}
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryPills}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            return (
              <TouchableOpacity
                style={[styles.pill, isSelected ? styles.pillActive : null]}
                onPress={() => setSelectedCategory(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, isSelected ? styles.pillTextActive : null]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Phrases List */}
      <FlatList
        data={filteredPhrases}
        keyExtractor={(item: PhraseItem) => item.id}
        renderItem={renderPhraseCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No phrases found</Text>
            <Text style={styles.emptySub}>Try a different search keyword or category filter.</Text>
          </View>
        }
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
  headerSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  filterSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 10,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  clearIcon: {
    color: '#94a3b8',
    fontSize: 14,
    paddingHorizontal: 6,
  },
  categoryPills: {
    gap: 8,
    paddingVertical: 4,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pillActive: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  pillTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardPlaying: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: '#0369a1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  playButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  playButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  playButtonIcon: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  englishText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  hindiText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 8,
  },
  santaliContainer: {
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  scriptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  santaliLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.5,
  },
  scriptTag: {
    fontSize: 10,
    color: '#65a30d',
    fontWeight: '600',
  },
  santaliText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#14532d',
    lineHeight: 22,
  },
  playingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#bfdbfe',
  },
  playingWave: {
    fontSize: 14,
    color: '#2563eb',
  },
  playingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748b',
  },
});
