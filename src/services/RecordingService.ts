import { RecordingError } from '../types/errors';
import { RecordingResult, RecordingStatus } from '../types/index';

const MAX_DURATION_MS = 10000;

let status: RecordingStatus = 'idle';
let recording: any = null;
let autoStopTimer: ReturnType<typeof setTimeout> | null = null;
let recordingStartTime: number = 0;

/**
 * Clears the auto-stop timer if one is active.
 */
function clearAutoStopTimer(): void {
  if (autoStopTimer !== null) {
    clearTimeout(autoStopTimer);
    autoStopTimer = null;
  }
}

/**
 * Requests microphone permissions from the user.
 * Throws RecordingError with reason 'permission-denied' if not granted.
 */
async function ensureMicrophonePermission(): Promise<void> {
  const { requestPermissionsAsync } = require('expo-audio');
  const { granted } = await requestPermissionsAsync();
  if (!granted) {
    throw new RecordingError(
      'permission-denied',
      'Microphone permission is required to record audio. Please enable it in device settings.'
    );
  }
}

export const RecordingService = {
  /**
   * Starts a new recording session.
   * Checks microphone permissions, creates a recording instance, and starts a
   * 10-second auto-stop timer.
   */
  async startRecording(): Promise<void> {
    if (status === 'recording') {
      return;
    }

    await ensureMicrophonePermission();

    const { AudioRecorder } = require('expo-audio');

    try {
      recording = new AudioRecorder();
      await recording.prepareToRecordAsync();
      await recording.record();
    } catch (error: any) {
      recording = null;
      throw new RecordingError(
        'hardware-unavailable',
        `Failed to start recording: ${error?.message ?? 'Unknown error'}`
      );
    }

    status = 'recording';
    recordingStartTime = Date.now();

    // Auto-stop after MAX_DURATION_MS
    autoStopTimer = setTimeout(async () => {
      if (status === 'recording') {
        try {
          await RecordingService.stopRecording();
        } catch {
          // Auto-stop failure is silently handled; status resets to idle
          status = 'idle';
          recording = null;
        }
      }
    }, MAX_DURATION_MS);
  },

  /**
   * Stops the current recording and returns the result.
   * Returns the local file URI and actual duration.
   */
  async stopRecording(): Promise<RecordingResult> {
    if (status !== 'recording' || !recording) {
      throw new RecordingError(
        'save-failed',
        'No active recording to stop.'
      );
    }

    clearAutoStopTimer();
    status = 'processing';

    try {
      await recording.stop();
      const uri = recording.uri;
      const durationMs = Date.now() - recordingStartTime;

      const result: RecordingResult = {
        localUri: uri,
        durationMs: Math.min(durationMs, MAX_DURATION_MS),
      };

      recording = null;
      status = 'idle';
      return result;
    } catch (error: any) {
      recording = null;
      status = 'idle';
      throw new RecordingError(
        'save-failed',
        `Failed to stop recording: ${error?.message ?? 'Unknown error'}`
      );
    }
  },

  /**
   * Cancels the current recording session without saving.
   * Discards any recorded audio and resets status to idle.
   */
  cancelRecording(): void {
    clearAutoStopTimer();

    if (recording) {
      try {
        recording.stop();
      } catch {
        // Best-effort stop on cancel
      }
      recording = null;
    }

    status = 'idle';
  },

  /**
   * Returns the current recording status.
   */
  getStatus(): RecordingStatus {
    return status;
  },
};
