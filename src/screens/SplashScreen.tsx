import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';

interface Props {
  navigation: any;
}

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 2200);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>OFFLINE LMS PLATFORM</Text>
        </View>
        <Text style={styles.logoTitle}>ShikshaSetu</Text>
        <Text style={styles.subTitle}>Empowering Primary School Educators</Text>
        <View style={styles.divider} />
        <Text style={styles.tagline}>Bridge to Quality Education in Every Classroom</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.replace('Home')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Enter Teacher Dashboard →</Text>
        </TouchableOpacity>

        <Text style={styles.footerTeam}>Developed by Stark Dynamics</Text>
        <Text style={styles.footerMeta}>SIH 2026 Prototype • Dev Client Native Module Ready</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3b82f6',
    marginBottom: 20,
  },
  badgeText: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  logoTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#38bdf8',
    textAlign: 'center',
    marginBottom: 16,
  },
  divider: {
    width: 60,
    height: 4,
    backgroundColor: '#0284c7',
    borderRadius: 2,
    marginVertical: 16,
  },
  tagline: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    width: '100%',
  },
  button: {
    backgroundColor: '#2563eb',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  footerTeam: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerMeta: {
    color: '#64748b',
    fontSize: 11,
  },
});
