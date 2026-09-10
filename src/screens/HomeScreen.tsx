import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getLastSyncTime } from '../services/database';

interface Props {
  navigation: any;
}

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [lastSyncText, setLastSyncText] = useState<string>('Local Mode');

  useFocusEffect(
    useCallback(() => {
      getLastSyncTime().then((time) => {
        if (time) {
          const date = new Date(time);
          setLastSyncText(`Synced ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        } else {
          setLastSyncText('Offline SQLite');
        }
      });
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand Header Banner */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>SIH 2026 PROTOTYPE</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsIconBtn}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.75}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.heroTitle}>ShikshaSetu</Text>
          <Text style={styles.heroSubtitle}>शिक्षा सेतु • Multilingual Educator Bridge</Text>
          <Text style={styles.heroTagline}>
            Empowering primary school teachers with offline bilingual curriculum & on-device voice intelligence.
          </Text>

          {/* Quick Metrics Bar */}
          <View style={styles.metricsBar}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>Class 1–3</Text>
              <Text style={styles.metricLabel}>Active Grades</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>Bilingual</Text>
              <Text style={styles.metricLabel}>English + Santali</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{lastSyncText}</Text>
              <Text style={styles.metricLabel}>Engine Status</Text>
            </View>
          </View>
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Teacher Classroom Modules</Text>
          <View style={styles.onlinePill}>
            <Text style={styles.onlinePillText}>● OFFLINE FIRST</Text>
          </View>
        </View>

        {/* Module 1: Curriculum & Bilingual Worksheets */}
        <TouchableOpacity
          style={[styles.moduleCard, styles.curriculumBorder]}
          onPress={() => navigation.navigate('ClassSelection')}
          activeOpacity={0.85}
        >
          <View style={styles.cardTopRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#1e3a8a' }]}>
              <Text style={styles.moduleIcon}>📚</Text>
            </View>
            <View style={[styles.cardTag, { backgroundColor: '#dbeafe' }]}>
              <Text style={[styles.cardTagText, { color: '#1d4ed8' }]}>SYLLABUS & LESSONS</Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>Curriculum & Bilingual Worksheets</Text>
          <Text style={styles.cardDescription}>
            Explore Class 1 to 3 Mathematics, Science, and Language lessons. View interactive bilingual worksheets in English and Santali Ol Chiki with native audio playback.
          </Text>

          <View style={styles.cardActionRow}>
            <Text style={[styles.actionText, { color: '#1e40af' }]}>Browse Classes & Subjects →</Text>
          </View>
        </TouchableOpacity>

        {/* Module 2: Classroom Voice Assistant */}
        <TouchableOpacity
          style={[styles.moduleCard, styles.voiceBorder]}
          onPress={() => navigation.navigate('VoiceAssistant')}
          activeOpacity={0.85}
        >
          <View style={styles.cardTopRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#065f46' }]}>
              <Text style={styles.moduleIcon}>🎤</Text>
            </View>
            <View style={[styles.cardTag, { backgroundColor: '#dcfce7' }]}>
              <Text style={[styles.cardTagText, { color: '#15803d' }]}>VOICE AI ASSISTANT</Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>Classroom Voice Assistant</Text>
          <Text style={styles.cardDescription}>
            Push-to-hold speech recognition in Hindi (powered by offline Vosk ASR) translated automatically to Santali with teacher review, inline editing, and verified speech output.
          </Text>

          <View style={styles.cardActionRow}>
            <Text style={[styles.actionText, { color: '#047857' }]}>Launch Voice Assistant →</Text>
          </View>
        </TouchableOpacity>

        {/* Module 3: Teacher's Classroom Phrasebook */}
        <TouchableOpacity
          style={[styles.moduleCard, styles.phrasebookBorder]}
          onPress={() => navigation.navigate('Phrasebook')}
          activeOpacity={0.85}
        >
          <View style={styles.cardTopRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#78350f' }]}>
              <Text style={styles.moduleIcon}>💬</Text>
            </View>
            <View style={[styles.cardTag, { backgroundColor: '#fef3c7' }]}>
              <Text style={[styles.cardTagText, { color: '#b45309' }]}>PHRASEBOOK</Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>Teacher&apos;s Classroom Phrasebook</Text>
          <Text style={styles.cardDescription}>
            16+ essential everyday classroom management phrases across Greetings, Discipline, Blackboard, and Encouragement. Tap any phrase to play native pronunciation aloud.
          </Text>

          <View style={styles.cardActionRow}>
            <Text style={[styles.actionText, { color: '#b45309' }]}>Open Classroom Phrasebook →</Text>
          </View>
        </TouchableOpacity>

        {/* Module 4: Settings & Backend Synchronization */}
        <TouchableOpacity
          style={styles.settingsNavCard}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.85}
        >
          <View style={styles.settingsNavLeft}>
            <Text style={styles.settingsNavIcon}>🛡️</Text>
            <View>
              <Text style={styles.settingsNavTitle}>Offline Database & Cloud Sync</Text>
              <Text style={styles.settingsNavSub}>FastAPI sync, teacher corrections queue & app information</Text>
            </View>
          </View>
          <Text style={styles.settingsNavArrow}>→</Text>
        </TouchableOpacity>

        {/* Footer Credit */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerTeam}>Developed by Stark Dynamics</Text>
          <Text style={styles.footerMeta}>Smart India Hackathon 2026 • Offline Primary LMS</Text>
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
  scrollContent: {
    padding: 18,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 22,
    padding: 22,
    marginBottom: 24,
    elevation: 6,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoBadgeText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  settingsIconBtn: {
    backgroundColor: '#1e293b',
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  settingsIcon: {
    fontSize: 18,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38bdf8',
    marginTop: 2,
    marginBottom: 8,
  },
  heroTagline: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 19,
    marginBottom: 18,
  },
  metricsBar: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  onlinePill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  onlinePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.5,
  },
  moduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1.5,
    elevation: 4,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  curriculumBorder: {
    borderColor: '#bfdbfe',
  },
  voiceBorder: {
    borderColor: '#bbf7d0',
  },
  phrasebookBorder: {
    borderColor: '#fde68a',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  moduleIcon: {
    fontSize: 24,
  },
  cardTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
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
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingsNavCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  settingsNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  settingsNavIcon: {
    fontSize: 24,
  },
  settingsNavTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  settingsNavSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  settingsNavArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e40af',
  },
  footerInfo: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerTeam: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  footerMeta: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
});
