import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';

interface Props {
  navigation: any;
}

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>TEACHER MANAGEMENT DASHBOARD</Text>
            <Text style={styles.headerTitle}>ShikshaSetu</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* System Stats Bar */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Class 1-3</Text>
            <Text style={styles.statLabel}>Active Syllabus</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Offline</Text>
            <Text style={styles.statLabel}>Storage Status</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Dev-Client</Text>
            <Text style={styles.statLabel}>Native Engine</Text>
          </View>
        </View>

        {/* Section Heading */}
        <Text style={styles.sectionHeader}>Core Administrator Modules</Text>

        {/* Two Large Entry Cards */}
        <TouchableOpacity
          style={[styles.moduleCard, styles.syllabusCard]}
          onPress={() => navigation.navigate('ClassSelection')}
          activeOpacity={0.85}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconContainer, { backgroundColor: '#1e3a8a' }]}>
              <Text style={styles.cardIcon}>📚</Text>
            </View>

            <View style={styles.badgeLabel}>
              <Text style={styles.badgeLabelText}>CURRICULUM</Text>
            </View>
          </View>
          <Text style={styles.cardTitle}>Syllabus & Course Material</Text>
          <Text style={styles.cardDescription}>
            Browse class-wise subjects (Mathematics, Science, Language), structured chapters, and offline lesson content for primary grades.
          </Text>
          <View style={styles.cardActionRow}>
            <Text style={[styles.cardActionText, { color: '#1e40af' }]}>Browse Syllabus →</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.moduleCard, styles.voiceCard]}
          onPress={() => navigation.navigate('VoiceAssistant')}
          activeOpacity={0.85}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconContainer, { backgroundColor: '#065f46' }]}>
              <Text style={styles.cardIcon}>🎤</Text>
            </View>

            <View style={[styles.badgeLabel, { backgroundColor: '#dcfce7' }]}>
              <Text style={[styles.badgeLabelText, { color: '#15803d' }]}>VOICE AI</Text>
            </View>
          </View>
          <Text style={styles.cardTitle}>Classroom Voice Assistant</Text>
          <Text style={styles.cardDescription}>
            AI-assisted real-time speech translation, voice prompts, and multilingual lesson assistance for classroom teaching.
          </Text>
          <View style={styles.cardActionRow}>
            <Text style={[styles.cardActionText, { color: '#047857' }]}>Open Voice Assistant →</Text>
          </View>
        </TouchableOpacity>

        {/* Quick Settings Access Card */}
        <TouchableOpacity
          style={styles.settingsRowCard}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.8}
        >
          <View style={styles.settingsRowLeft}>
            <Text style={styles.settingsRowIcon}>🛡️</Text>
            <View>
              <Text style={styles.settingsRowTitle}>App Information & Settings</Text>
              <Text style={styles.settingsRowSub}>Stark Dynamics • SIH 2026 Prototype</Text>
            </View>
          </View>
          <Text style={styles.settingsRowArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 8,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 1.1,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0f172a',
  },
  settingsButton: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    elevation: 1,
  },
  settingsIcon: {
    fontSize: 20,
  },
  statsCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#38bdf8',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#334155',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  moduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  syllabusCard: {
    borderColor: '#bfdbfe',
  },
  voiceCard: {
    borderColor: '#bbf7d0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 24,
  },
  badgeLabel: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeLabelText: {
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 16,
  },
  cardActionRow: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  cardActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingsRowCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginTop: 6,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsRowIcon: {
    fontSize: 24,
  },
  settingsRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  settingsRowSub: {
    fontSize: 12,
    color: '#64748b',
  },
  settingsRowArrow: {
    fontSize: 22,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
});
