import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useWordList } from '../../../src/contexts/WordListContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import AuthGate from '../../../src/components/AuthGate';
import RecordButton from '../../../src/components/RecordButton';
import { PlatformRecordingService } from '../../../src/services/PlatformRecordingService';
import * as DictationStorageService from '../../../src/services/DictationStorageService';
import { RecordingError } from '../../../src/types/errors';

interface WordRecordingState {
  word: string;
  downloadUrl: string | null;
  isUploading: boolean;
  isPlaying: boolean;
}

function DictationContent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById } = useWordList();
  const { user } = useAuth();
  const router = useRouter();

  const [wordStates, setWordStates] = useState<WordRecordingState[]>([]);
  const [activeRecordingWord, setActiveRecordingWord] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notOwner, setNotOwner] = useState(false);

  const list = id ? getById(id) : undefined;

  // Load list and existing recordings
  useEffect(() => {
    if (!id || !user) return;

    const currentList = getById(id);
    if (!currentList) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    if (currentList.type !== 'custom') {
      setNotOwner(true);
      setIsLoading(false);
      return;
    }

    // Check ownership: if the list has a creatorUid, it must match the current user
    const customList = currentList as import('../../../src/types').CustomWordList;
    if (customList.creatorUid && customList.creatorUid !== user.uid) {
      setNotOwner(true);
      setIsLoading(false);
      return;
    }

    // Load existing recording URLs for each word
    async function loadRecordings() {
      const results = await Promise.allSettled(
        currentList!.words.map(async (word) => {
          try {
            const downloadUrl = await DictationStorageService.getDownloadUrl(user!.uid, id!, word);
            return { word, downloadUrl };
          } catch {
            return { word, downloadUrl: null };
          }
        })
      );
      const states: WordRecordingState[] = results.map((result) => {
        const { word, downloadUrl } = result.status === 'fulfilled' ? result.value : { word: '', downloadUrl: null };
        return { word, downloadUrl, isUploading: false, isPlaying: false };
      });
      setWordStates(states);
      setIsLoading(false);
    }

    loadRecordings();
  }, [id, user, getById]);

  const handleStartRecording = useCallback(
    async (word: string) => {
      try {
        setPermissionDenied(false);
        await PlatformRecordingService.startRecording();
        setActiveRecordingWord(word);
      } catch (error) {
        if (error instanceof RecordingError && error.reason === 'permission-denied') {
          setPermissionDenied(true);
        } else {
          Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
        }
      }
    },
    []
  );

  const handleStopRecording = useCallback(
    async (word: string) => {
      if (!user || !id) return;

      try {
        const result = await PlatformRecordingService.stopRecording();
        setActiveRecordingWord(null);

        // Mark as uploading
        setWordStates((prev) =>
          prev.map((ws) =>
            ws.word === word ? { ...ws, isUploading: true } : ws
          )
        );

        // Upload to Firebase Storage
        const downloadUrl = await DictationStorageService.uploadRecording(
          user.uid,
          id,
          word,
          result.localUri
        );

        // Update state with new URL
        setWordStates((prev) =>
          prev.map((ws) =>
            ws.word === word
              ? { ...ws, downloadUrl, isUploading: false }
              : ws
          )
        );
      } catch (error) {
        setActiveRecordingWord(null);
        setWordStates((prev) =>
          prev.map((ws) =>
            ws.word === word ? { ...ws, isUploading: false } : ws
          )
        );
        Alert.alert(
          'Upload Error',
          'Recording saved locally but failed to upload. Please try again.'
        );
      }
    },
    [user, id]
  );

  const handlePlayback = useCallback(async (word: string, downloadUrl: string) => {
    setWordStates((prev) =>
      prev.map((ws) =>
        ws.word === word ? { ...ws, isPlaying: true } : ws
      )
    );

    try {
      const { createAudioPlayer } = require('expo-audio');
      const player = createAudioPlayer({ uri: downloadUrl });
      await player.play();

      // Listen for completion (simplified — wait a reasonable time)
      // In production, you'd use the player's status events
      player.addListener('playbackStatusUpdate', (status: any) => {
        if (status.didJustFinish || status.isLoaded === false) {
          setWordStates((prev) =>
            prev.map((ws) =>
              ws.word === word ? { ...ws, isPlaying: false } : ws
            )
          );
        }
      });

      // Fallback: reset after 12 seconds max
      setTimeout(() => {
        setWordStates((prev) =>
          prev.map((ws) =>
            ws.word === word ? { ...ws, isPlaying: false } : ws
          )
        );
      }, 12000);
    } catch {
      setWordStates((prev) =>
        prev.map((ws) =>
          ws.word === word ? { ...ws, isPlaying: false } : ws
        )
      );
      Alert.alert('Playback Error', 'Failed to play recording. Please try again.');
    }
  }, []);

  const openSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centered} testID="dictation-loading">
        <ActivityIndicator size="large" color="#7C4DFF" />
        <Text style={styles.loadingText}>Loading recordings...</Text>
      </View>
    );
  }

  if (notFound) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>List not found</Text>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.replace('/')}
            accessibilityRole="button"
            accessibilityLabel="Go home"
          >
            <Text style={styles.homeButtonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (notOwner) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Access Denied</Text>
          <Text style={styles.errorMessage}>
            You can only record dictation for your own custom lists.
          </Text>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.homeButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const recordedCount = wordStates.filter((ws) => ws.downloadUrl !== null).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Record Dictation</Text>
        <Text style={styles.subtitle}>
          {list?.name} — {recordedCount}/{wordStates.length} words recorded
        </Text>

        {permissionDenied && (
          <View style={styles.permissionBanner} testID="permission-denied-banner">
            <Text style={styles.permissionIcon}>🎙️</Text>
            <Text style={styles.permissionText}>
              Microphone access is required to record audio. Please enable it in
              your device settings.
            </Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={openSettings}
              accessibilityRole="button"
              accessibilityLabel="Open device settings"
              testID="open-settings-button"
            >
              <Text style={styles.settingsButtonText}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={wordStates}
          keyExtractor={(item) => item.word}
          style={styles.wordList}
          renderItem={({ item }) => (
            <WordRecordingRow
              wordState={item}
              isRecording={activeRecordingWord === item.word}
              isOtherRecording={
                activeRecordingWord !== null && activeRecordingWord !== item.word
              }
              onStartRecording={() => handleStartRecording(item.word)}
              onStopRecording={() => handleStopRecording(item.word)}
              onPlayback={() =>
                item.downloadUrl && handlePlayback(item.word, item.downloadUrl)
              }
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No words in this list.</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

interface WordRecordingRowProps {
  wordState: WordRecordingState;
  isRecording: boolean;
  isOtherRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayback: () => void;
}

function WordRecordingRow({
  wordState,
  isRecording,
  isOtherRecording,
  onStartRecording,
  onStopRecording,
  onPlayback,
}: WordRecordingRowProps) {
  const { word, downloadUrl, isUploading, isPlaying } = wordState;

  return (
    <View style={styles.wordRow} testID={`word-row-${word}`}>
      <View style={styles.wordInfo}>
        <Text style={styles.wordText}>{word}</Text>
        <View style={styles.statusRow}>
          {downloadUrl ? (
            <Text style={styles.recordedBadge} testID={`status-recorded-${word}`}>
              ✅ Recorded
            </Text>
          ) : (
            <Text style={styles.notRecordedBadge} testID={`status-not-recorded-${word}`}>
              ⬜ Not recorded
            </Text>
          )}
          {isUploading && (
            <ActivityIndicator
              size="small"
              color="#7C4DFF"
              style={styles.uploadingIndicator}
              testID={`uploading-${word}`}
            />
          )}
        </View>
      </View>

      <View style={styles.controls}>
        {/* Playback button — only shown if recording exists */}
        {downloadUrl && !isRecording && (
          <TouchableOpacity
            style={[styles.playButton, isPlaying && styles.playingButton]}
            onPress={onPlayback}
            disabled={isPlaying || isOtherRecording}
            accessibilityRole="button"
            accessibilityLabel={`Play recording for ${word}`}
            testID={`play-button-${word}`}
          >
            <Text style={styles.playIcon}>{isPlaying ? '⏸️' : '▶️'}</Text>
          </TouchableOpacity>
        )}

        {/* Record button */}
        <View style={styles.recordButtonWrapper}>
          <RecordButton
            status={isRecording ? 'recording' : 'idle'}
            onStart={onStartRecording}
            onStop={onStopRecording}
            maxDurationMs={10000}
          />
        </View>
      </View>
    </View>
  );
}

export default function DictationScreen() {
  return (
    <AuthGate>
      <DictationContent />
    </AuthGate>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E53935',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  homeButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionBanner: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  permissionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#E65100',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  settingsButton: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  wordList: {
    flex: 1,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  wordInfo: {
    flex: 1,
    marginRight: 12,
  },
  wordText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordedBadge: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  notRecordedBadge: {
    fontSize: 12,
    color: '#999',
  },
  uploadingIndicator: {
    marginLeft: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingButton: {
    backgroundColor: '#C8E6C9',
  },
  playIcon: {
    fontSize: 20,
  },
  recordButtonWrapper: {
    transform: [{ scale: 0.7 }],
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 24,
  },
});
