import React, { useState, useCallback, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { useVoiceProfile } from '../../src/contexts/VoiceProfileContext';
import { useSubscription } from '../../src/contexts/SubscriptionContext';
import VoiceCard from '../../src/components/VoiceCard';
import SpeedSlider from '../../src/components/SpeedSlider';
import { createStorage } from '../../src/services/storage';

const HONEY_COST_TO_UNLOCK = 10; // 10 honey pots to unlock a regular voice
const FUNNY_HONEY_COST = 20; // 20 honey pots to unlock a funny voice
const DEFAULT_VOICE_ID = 'com.google.android.tts'; // Google voice identifier prefix

const FUNNY_VOICES = [
  { id: 'funny-chipmunk', name: '🐿️ Chipmunk', description: 'Super fast and squeaky!', pitch: 2.0, rate: 1.8 },
  { id: 'funny-robot', name: '🤖 Robot', description: 'Beep boop!', pitch: 0.5, rate: 0.6 },
  { id: 'funny-giant', name: '🦕 Giant', description: 'Deep and slow!', pitch: 0.3, rate: 0.4 },
  { id: 'funny-fairy', name: '🧚 Fairy', description: 'Light and magical!', pitch: 1.8, rate: 1.3 },
  { id: 'funny-pirate', name: '🏴‍☠️ Pirate', description: 'Arrr matey!', pitch: 0.7, rate: 0.8 },
];

function isGoogleVoice(voiceId: string): boolean {
  // Google voices on web typically have "Google" in the name
  return voiceId.toLowerCase().includes('google') || voiceId === 'en-GB-female-default';
}

function isFunnyVoice(voiceId: string): boolean {
  return voiceId.startsWith('funny-');
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
  const { isSubscribed } = useSubscription();
  const router = useRouter();
  const [speed, setSpeed] = useState(profile.speed);
  const [unlockedVoices, setUnlockedVoices] = useState<string[]>(getUnlockedVoices());
  const [honey, setHoney] = useState(getTotalHoney());

  const getDiscountedCost = (baseCost: number) => isSubscribed ? Math.floor(baseCost * 0.9) : baseCost;

  // Ad simulation state
  const [showingAd, setShowingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [pendingUnlockVoiceId, setPendingUnlockVoiceId] = useState<string | null>(null);
  const [adWatchCount, setAdWatchCount] = useState(0); // Track ads watched for funny voices (need 2)

  // Countdown effect for simulated ad
  useEffect(() => {
    if (!showingAd) return;
    if (adCountdown <= 0) {
      // Ad finished — unlock the voice
      setShowingAd(false);
      if (pendingUnlockVoiceId) {
        const isFunny = isFunnyVoice(pendingUnlockVoiceId);
        if (isFunny && adWatchCount < 1) {
          // Need 2 ads for funny voices — this was the first
          setAdWatchCount(1);
          setAdCountdown(5);
          Alert.alert('📺 1 of 2 ads watched!', 'Watch one more ad to unlock this voice.');
        } else {
          // Fully unlocked (regular voice after 1 ad, or funny voice after 2 ads)
          saveUnlockedVoice(pendingUnlockVoiceId);
          setUnlockedVoices((prev) => [...prev, pendingUnlockVoiceId!]);

          // Select the voice
          const funnyVoice = FUNNY_VOICES.find(v => v.id === pendingUnlockVoiceId);
          if (funnyVoice) {
            updateProfile({
              ...profile,
              voiceId: pendingUnlockVoiceId!,
              label: funnyVoice.name,
              speed: funnyVoice.rate,
              pitch: funnyVoice.pitch,
            });
          } else {
            const selectedVoice = availableVoices.find((v) => v.id === pendingUnlockVoiceId);
            const label = selectedVoice?.name ?? profile.label;
            updateProfile({ ...profile, voiceId: pendingUnlockVoiceId!, label });
            previewVoice(pendingUnlockVoiceId!, speed);
          }

          setPendingUnlockVoiceId(null);
          setAdWatchCount(0);
          Alert.alert('✅ Voice unlocked!', 'Enjoy your new voice!');
        }
      }
      return;
    }
    const timer = setTimeout(() => {
      setAdCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [showingAd, adCountdown]);

  const startAdForVoice = (voiceId: string) => {
    setPendingUnlockVoiceId(voiceId);
    setAdCountdown(5);
    setShowingAd(true);
  };

  const isVoiceUnlocked = useCallback((voiceId: string): boolean => {
    // Google voice is always free
    if (isGoogleVoice(voiceId)) return true;
    // Check if unlocked
    return unlockedVoices.includes(voiceId);
  }, [unlockedVoices]);

  const handleVoiceSelect = (voiceId: string) => {
    if (!isVoiceUnlocked(voiceId)) {
      const cost = getDiscountedCost(HONEY_COST_TO_UNLOCK);
      Alert.alert(
        '🔒 Voice Locked',
        `This voice costs ${cost} 🍯 to unlock.${isSubscribed ? ' (10% off!)' : ''}\n\nYou have ${honey} 🍯.`,
        [
          { text: 'Cancel', style: 'cancel' },
          ...(honey >= cost
            ? [{
                text: `Unlock (${cost} 🍯)`,
                onPress: () => {
                  if (spendHoney(cost)) {
                    saveUnlockedVoice(voiceId);
                    setUnlockedVoices((prev) => [...prev, voiceId]);
                    setHoney((prev) => prev - cost);
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
              setAdWatchCount(0);
              startAdForVoice(voiceId);
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

  const handleFunnyVoiceSelect = (funnyVoiceId: string) => {
    const funnyVoice = FUNNY_VOICES.find(v => v.id === funnyVoiceId);
    if (!funnyVoice) return;

    if (!isVoiceUnlocked(funnyVoiceId)) {
      const cost = getDiscountedCost(FUNNY_HONEY_COST);
      Alert.alert(
        '🔒 Premium Voice Locked',
        `This premium voice costs ${cost} 🍯 or 2 ads to unlock.${isSubscribed ? ' (10% off!)' : ''}\n\nYou have ${honey} 🍯.`,
        [
          { text: 'Cancel', style: 'cancel' },
          ...(honey >= cost
            ? [{
                text: `Unlock (${cost} 🍯)`,
                onPress: () => {
                  if (spendHoney(cost)) {
                    saveUnlockedVoice(funnyVoiceId);
                    setUnlockedVoices((prev) => [...prev, funnyVoiceId]);
                    setHoney((prev) => prev - cost);
                    // Select it with custom pitch/rate
                    updateProfile({
                      ...profile,
                      voiceId: funnyVoiceId,
                      label: funnyVoice.name,
                      speed: funnyVoice.rate,
                      pitch: funnyVoice.pitch,
                    });
                  }
                },
              }]
            : []),
          {
            text: '📺 Watch 2 Ads to Unlock',
            onPress: () => {
              setAdWatchCount(0);
              startAdForVoice(funnyVoiceId);
            },
          },
        ]
      );
      return;
    }

    // Already unlocked — select it
    updateProfile({
      ...profile,
      voiceId: funnyVoiceId,
      label: funnyVoice.name,
      speed: funnyVoice.rate,
      pitch: funnyVoice.pitch,
    });
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
      {/* Ad overlay */}
      {showingAd && (
        <View style={styles.adOverlay}>
          <Text style={styles.adTitle}>📺 Watching Ad...</Text>
          <Text style={styles.adCountdown}>{adCountdown}</Text>
          <Text style={styles.adSubtext}>Voice will unlock when ad finishes</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} testID="back-button">
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
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

        {/* Funny Voices Section */}
        <View style={styles.voiceSection}>
          <Text style={styles.sectionTitle}>🎭 Funny Voices</Text>
          <Text style={styles.funnySubtitle}>Premium voices with wacky effects!</Text>
          {FUNNY_VOICES.map((funnyVoice) => {
            const unlocked = isVoiceUnlocked(funnyVoice.id);
            const isSelected = profile.voiceId === funnyVoice.id;
            return (
              <TouchableOpacity
                key={funnyVoice.id}
                style={[
                  styles.funnyVoiceCard,
                  isSelected && styles.funnyVoiceCardSelected,
                ]}
                onPress={() => handleFunnyVoiceSelect(funnyVoice.id)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${funnyVoice.name} voice`}
              >
                <View style={styles.funnyVoiceHeader}>
                  <Text style={styles.funnyVoiceName}>{funnyVoice.name}</Text>
                  {!unlocked && (
                    <View style={styles.premiumBadge}>
                      <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                    </View>
                  )}
                  {isSelected && (
                    <Text style={styles.selectedCheck}>✓</Text>
                  )}
                </View>
                <Text style={styles.funnyVoiceDescription}>{funnyVoice.description}</Text>
                {!unlocked && (
                  <Text style={styles.funnyVoiceCost}>🔒 {FUNNY_HONEY_COST} 🍯 or 2 ads</Text>
                )}
              </TouchableOpacity>
            );
          })}
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
  backButton: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 4, marginBottom: 8 },
  backButtonText: { fontSize: 15, color: '#7C4DFF', fontWeight: '600' },
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
  // Ad overlay styles
  adOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  adTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
  },
  adCountdown: {
    fontSize: 72,
    fontWeight: '800',
    color: '#FFC107',
    marginBottom: 24,
  },
  adSubtext: {
    fontSize: 16,
    color: '#ccc',
    fontWeight: '500',
  },
  // Funny voices styles
  funnySubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  funnyVoiceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#E1BEE7',
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  funnyVoiceCardSelected: {
    borderColor: '#7C4DFF',
    backgroundColor: '#F3E5F5',
  },
  funnyVoiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  funnyVoiceName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4A148C',
    flex: 1,
  },
  funnyVoiceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  funnyVoiceCost: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C4DFF',
    marginTop: 4,
  },
  premiumBadge: {
    backgroundColor: '#FF6D00',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  selectedCheck: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
    marginLeft: 8,
  },
});
