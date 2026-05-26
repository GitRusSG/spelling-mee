import { RecordingError } from '../types/errors';
import { RecordingResult, RecordingStatus } from '../types/index';
import { Platform } from 'react-native';

const MAX_DURATION_MS = 10000;

let status: RecordingStatus = 'idle';
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let autoStopTimer: ReturnType<typeof setTimeout> | null = null;
let recordingStartTime: number = 0;

function clearAutoStopTimer(): void {
  if (autoStopTimer !== null) {
    clearTimeout(autoStopTimer);
    autoStopTimer = null;
  }
}

/**
 * Web-compatible recording service using the MediaRecorder API.
 * Falls back to the native RecordingService on non-web platforms.
 */
export const WebRecordingService = {
  isWebPlatform(): boolean {
    return Platform.OS === 'web';
  },

  async startRecording(): Promise<void> {
    if (status === 'recording') return;

    if (!navigator?.mediaDevices?.getUserMedia) {
      throw new RecordingError(
        'hardware-unavailable',
        'Audio recording is not supported in this browser.'
      );
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error: any) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new RecordingError(
          'permission-denied',
          'Microphone permission is required to record audio. Please allow microphone access in your browser settings.'
        );
      }
      throw new RecordingError(
        'hardware-unavailable',
        `Failed to access microphone: ${error?.message ?? 'Unknown error'}`
      );
    }

    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.start(100); // Collect data every 100ms
    status = 'recording';
    recordingStartTime = Date.now();

    // Auto-stop after MAX_DURATION_MS
    autoStopTimer = setTimeout(async () => {
      if (status === 'recording') {
        try {
          await WebRecordingService.stopRecording();
        } catch {
          status = 'idle';
          mediaRecorder = null;
        }
      }
    }, MAX_DURATION_MS);
  },

  async stopRecording(): Promise<RecordingResult> {
    if (status !== 'recording' || !mediaRecorder) {
      throw new RecordingError('save-failed', 'No active recording to stop.');
    }

    clearAutoStopTimer();
    status = 'processing';

    return new Promise<RecordingResult>((resolve, reject) => {
      if (!mediaRecorder) {
        status = 'idle';
        reject(new RecordingError('save-failed', 'No active recording.'));
        return;
      }

      mediaRecorder.onstop = () => {
        const durationMs = Math.min(Date.now() - recordingStartTime, MAX_DURATION_MS);
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        const localUri = URL.createObjectURL(blob);

        // Stop all tracks to release the microphone
        if (mediaRecorder?.stream) {
          mediaRecorder.stream.getTracks().forEach((track) => track.stop());
        }

        mediaRecorder = null;
        audioChunks = [];
        status = 'idle';

        resolve({ localUri, durationMs });
      };

      mediaRecorder.onerror = (event: any) => {
        mediaRecorder = null;
        audioChunks = [];
        status = 'idle';
        reject(new RecordingError('save-failed', `Recording failed: ${event?.error?.message ?? 'Unknown error'}`));
      };

      mediaRecorder.stop();
    });
  },

  cancelRecording(): void {
    clearAutoStopTimer();

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      }
    }

    mediaRecorder = null;
    audioChunks = [];
    status = 'idle';
  },

  getStatus(): RecordingStatus {
    return status;
  },
};
