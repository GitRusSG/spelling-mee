import { Platform } from 'react-native';
import { RecordingResult, RecordingStatus } from '../types/index';

/**
 * Platform-aware recording service.
 * Uses WebRecordingService (MediaRecorder API) on web,
 * and the native RecordingService (expo-audio) on mobile.
 */

interface IRecordingService {
  startRecording(): Promise<void>;
  stopRecording(): Promise<RecordingResult>;
  cancelRecording(): void;
  getStatus(): RecordingStatus;
}

function getService(): IRecordingService {
  if (Platform.OS === 'web') {
    const { WebRecordingService } = require('./WebRecordingService');
    return WebRecordingService;
  }
  const { RecordingService } = require('./RecordingService');
  return RecordingService;
}

export const PlatformRecordingService: IRecordingService = {
  startRecording() {
    return getService().startRecording();
  },
  stopRecording() {
    return getService().stopRecording();
  },
  cancelRecording() {
    return getService().cancelRecording();
  },
  getStatus() {
    return getService().getStatus();
  },
};
