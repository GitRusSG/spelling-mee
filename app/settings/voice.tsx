import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useVoiceProfile } from '../../src/contexts/VoiceProfileContext';
import VoiceCard from '../../src/components/VoiceCard';
import SpeedSlider from '../../src/components/SpeedSlider';
import { createStorage } from '../../src/services/storage';

const HONEY_COST_TO_UNLOCK = 10; // 10 honey pots to unlock a voice
const DEFAULT_VOICE_ID = 'com.google.android.tts'; // Google voice identifier prefix

function isGoogleVoice(voiceId: string): boolean {
  // Google voices on web typically have "Google" in the name
  return voiceId.toLowerCase().includes('google') || voiceId === 'en-GB-female-default';
}

function getUnlockedVoices(): string[] {
  try {
    const storage = createStorage();
    const stored = storage.getString('unlocked_voices');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveUnlockedVoice(voiceId: string): void {
  try {
    const storage = createStorage();
    const current = getUnlockedVoices();
    if (!current.includes(voiceId)) {
      current.push(voiceId);
      storage.set('unlocked_voices', JSON.stringify(current));
    }
  } catch {
    // Storage error — non-critical
  }
}

function getTotalHoney(): number {
  try {
    const storage = createStorage();
    const stored = storage.getString('total_honey');
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

function spendHoney(amount: number): boolean {
  try {
    const storage = createStorage();
    const current = getTotalHoney();
    if (current >= amount) {
      storage.set('total_honey', String(current - amount));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Voice Selection screen — allows users to pick a TTS voice and adjust speed.
 * Google voice is free/default. Other voices require honey or watching an ad.
 */
export default function VoiceSelectionScreen() {
  const { profile, availableVoices, isLoading, updateProfile, previewVoice } =
    useVoiceProfile();
  const [speed, setSpeed] = useState(profile.speed);
  const [unlockedVoices, setUnlockedVoices] = useState<string[]>(getUnlockedVoices());
  const [honey, setHoney] = useState(getTotalHoney());

  const isVoiceUnlocked = useCallback((voiceId: string): boolean => {
    // Google voice is always free
    if (isGoogleVoice(voiceId)) return true;
    // Check if unlocked
    return unlockedVoices.includes(voiceId);
  }, [unlockedVoices]);

  const handleVoiceSelect = (voiceId: string) => {
    if (!isVoiceUnlocked(voiceId)) {
      // Show unlock options
      Alert.alert(
        '🔒 Voice Locked',
        `This voice costs ${HONEY_COST_TO_UNLOCK} 🍯 to unlock.\n\nYou have ${honey} 🍯.`,
        [
          { text: 'Cancel', style: 'cancel' },
          ...(honey >= HONEY_COST_TO_UNLOCK
            ? [{
                text: `Unlock (${HONEY_COST_TO_UNLOCK} 🍯)`,
                onPress: () => {
                  if (spendHoney(HONEY_COST_TO_UNLOCK)) {
                    saveUnlockedVoice(voiceId);
                    setUnlockedVoices((prev) => [...prev, voiceId]);
                    setHoney((prev) => prev - HONEY_COST_TO_UNLOCK);
                    // Now select it
                    const selectedVoice = availableVoices.find((v) => v.id === voiceId);
                    const label = selectedVoice?.name ?? profile.label;
                    updateProfile({ ...profile, voiceId, label });
                    previewVoice(voiceId, speed);
                  }
                },
              }]
            : []),
          {
            text: '📺 Watch Ad to Unlock',
            onPress: () => {
              // Simulate watching an ad (in production, show a rewarded ad)
              saveUnlockedVoice(voiceId);
              setUnlockedVoices((prev) => [...prev, voiceId]);
              const selectedVoice = availableVoices.find((v) => v.id === voiceId);
              const label = selectedVoice?.name ?? profile.label;
              updateProfile({ ...profile, voiceId, label });
              previewVoice(voiceId, speed);
              Alert.alert('✅ Unlocked!', 'Voice unlocked. Enjoy!');
            },
          },
        ]
      );
      return;
    }

    const selectedVoice = availableVoices.find((v) => v.id === voiceId);
    const label = selectedVoice?.name ?? profile.label;
    const updatedProfile = { ...profile, voiceId, label };
    updateProfile(updatedProfile);
    previewVoice(voiceId, speed);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  const handleSpeedChangeEnd = (newSpeed: number) => {
    setSpeed(newSpeed);
    const updatedProfile = { ...profile, speed: newSpeed };
    updateProfile(updatedProfile);
    previewVoice(profile.voiceId, newSpeed);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer} testID="voice-loading">
          <ActivityIndicator size="large" color="#7C4DFF" />
          <Text style={styles.loadingText}>Loading voices…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.heading}>🎙️ Choose a Voice</Text>
        <Text style={styles.subtitle}>
          Pick a voice for spelling tests. Tap to hear a sample!
        </Text>
        <Text style={styles.honeyBalance}>🍯 {honey} honey</Text>

        {/* Speed Slider */}
        <View style={styles.speedSection}>
          <Text style={styles.sectionTitle}>⚡ Speed</Text>
          <SpeedSlider
            value={speed}
            onChange={handleSpeedChange}
            onChangeEnd={handleSpeedChangeEnd}
          />
        </View>

        {/* Voice List */}
        <View style={styles.voiceSection}>
          <Text style={styles.sectionTitle}>🗣️ Voices</Text>
          {availableVoices.length === 0 ? (
            <Text style={styles.emptyText}>
              No voices available on this device.
            </Text>
          ) : (
            availableVoices.map((voice) => {
              const unlocked = isVoiceUnlocked(voice.id);
              const isDefault = isGoogleVoice(voice.id);
              return (
                <View key={voice.id} style={styles.voiceCardWrapper}>
                  <VoiceCard
                    voice={voice}
                    isSelected={voice.id === profile.voiceId}
                    onSelect={() => handleVoiceSelect(voice.id)}
                    onPreview={() => previewVoice(voice.id, speed)}
                  />
                  {isDefault && (
                    <Text style={styles.freeLabel}>FREE</Text>
                  )}
                  {!unlocked && !isDefault && (
                    <View style={styles.lockOverlay}>
                      <Text style={styles.lockText}>🔒 {HONEY_COST_TO_UNLOCK} 🍯 or watch ad</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3E5F5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#4A148C',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A148C',
    marginBottom: 8,
  },
  speedSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  voiceSection: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 24,
  },
  honeyBalance: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F57F17',
    textAlign: 'center',
    marginBottom: 16,
    backgroundColor: '#FFF8E1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  voiceCardWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  freeLabel: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#00C853',
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C4DFF',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#7C4DFF',
    fontWeight: '600',
  },
});
