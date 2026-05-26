import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useVoiceProfile } from '../../src/contexts/VoiceProfileContext';
import VoiceCard from '../../src/components/VoiceCard';
import SpeedSlider from '../../src/components/SpeedSlider';

/**
 * Voice Selection screen — allows users to pick a TTS voice and adjust speed.
 * Plays a sample word on voice tap and on speed slider release.
 * Saves the selection as the active Voice Profile.
 */
export default function VoiceSelectionScreen() {
  const { profile, availableVoices, isLoading, updateProfile, previewVoice } =
    useVoiceProfile();
  const [speed, setSpeed] = useState(profile.speed);

  const handleVoiceSelect = (voiceId: string) => {
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
            availableVoices.map((voice) => (
              <VoiceCard
                key={voice.id}
                voice={voice}
                isSelected={voice.id === profile.voiceId}
                onSelect={() => handleVoiceSelect(voice.id)}
                onPreview={() => previewVoice(voice.id, speed)}
              />
            ))
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
