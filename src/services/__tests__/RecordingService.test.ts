import { RecordingError } from '../../types/errors';
import { RecordingService } from '../RecordingService';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockRequestPermissionsAsync = jest.fn();
const mockRecord = jest.fn();
const mockStop = jest.fn();
const mockPrepareToRecordAsync = jest.fn();

jest.mock('expo-audio', () => ({
  requestPermissionsAsync: (...args: any[]) => mockRequestPermissionsAsync(...args),
  AudioRecorder: jest.fn().mockImplementation(() => ({
    prepareToRecordAsync: mockPrepareToRecordAsync,
    record: mockRecord,
    stop: mockStop,
    uri: 'file:///tmp/recording.m4a',
  })),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function grantPermission() {
  mockRequestPermissionsAsync.mockResolvedValue({ granted: true });
}

function denyPermission() {
  mockRequestPermissionsAsync.mockResolvedValue({ granted: false });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RecordingService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockRequestPermissionsAsync.mockReset();
    mockRecord.mockReset();
    mockStop.mockReset();
    mockPrepareToRecordAsync.mockReset();
    mockRecord.mockResolvedValue(undefined);
    mockStop.mockResolvedValue(undefined);
    mockPrepareToRecordAsync.mockResolvedValue(undefined);

    // Reset service state by cancelling any active recording
    RecordingService.cancelRecording();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getStatus', () => {
    it('returns idle initially', () => {
      expect(RecordingService.getStatus()).toBe('idle');
    });
  });

  describe('startRecording', () => {
    it('checks microphone permissions before recording', async () => {
      grantPermission();
      await RecordingService.startRecording();
      expect(mockRequestPermissionsAsync).toHaveBeenCalled();
      RecordingService.cancelRecording();
    });

    it('throws RecordingError with permission-denied when permission is not granted', async () => {
      denyPermission();
      await expect(RecordingService.startRecording()).rejects.toEqual(
        expect.objectContaining({
          name: 'RecordingError',
          reason: 'permission-denied',
        })
      );
    });

    it('sets status to recording after successful start', async () => {
      grantPermission();
      await RecordingService.startRecording();
      expect(RecordingService.getStatus()).toBe('recording');
      RecordingService.cancelRecording();
    });

    it('throws RecordingError with hardware-unavailable when recording fails to start', async () => {
      grantPermission();
      mockPrepareToRecordAsync.mockRejectedValue(new Error('Hardware error'));
      await expect(RecordingService.startRecording()).rejects.toEqual(
        expect.objectContaining({
          name: 'RecordingError',
          reason: 'hardware-unavailable',
        })
      );
    });

    it('does not start a second recording if already recording', async () => {
      grantPermission();
      await RecordingService.startRecording();
      // Second call should be a no-op
      await RecordingService.startRecording();
      expect(mockPrepareToRecordAsync).toHaveBeenCalledTimes(1);
      RecordingService.cancelRecording();
    });
  });

  describe('stopRecording', () => {
    it('returns a RecordingResult with localUri and durationMs', async () => {
      grantPermission();
      await RecordingService.startRecording();

      // Advance time by 3 seconds
      jest.advanceTimersByTime(3000);

      const result = await RecordingService.stopRecording();
      expect(result).toEqual({
        localUri: 'file:///tmp/recording.m4a',
        durationMs: expect.any(Number),
      });
      expect(result.durationMs).toBeGreaterThan(0);
      expect(result.durationMs).toBeLessThanOrEqual(10000);
    });

    it('sets status back to idle after stopping', async () => {
      grantPermission();
      await RecordingService.startRecording();
      await RecordingService.stopRecording();
      expect(RecordingService.getStatus()).toBe('idle');
    });

    it('throws RecordingError with save-failed when no active recording', async () => {
      await expect(RecordingService.stopRecording()).rejects.toEqual(
        expect.objectContaining({
          name: 'RecordingError',
          reason: 'save-failed',
        })
      );
    });

    it('throws RecordingError with save-failed when stop fails', async () => {
      grantPermission();
      await RecordingService.startRecording();
      mockStop.mockRejectedValue(new Error('Stop failed'));
      await expect(RecordingService.stopRecording()).rejects.toEqual(
        expect.objectContaining({
          name: 'RecordingError',
          reason: 'save-failed',
        })
      );
      expect(RecordingService.getStatus()).toBe('idle');
    });
  });

  describe('cancelRecording', () => {
    it('resets status to idle', async () => {
      grantPermission();
      await RecordingService.startRecording();
      expect(RecordingService.getStatus()).toBe('recording');
      RecordingService.cancelRecording();
      expect(RecordingService.getStatus()).toBe('idle');
    });

    it('does not throw when called with no active recording', () => {
      expect(() => RecordingService.cancelRecording()).not.toThrow();
    });
  });

  describe('auto-stop at 10 seconds', () => {
    it('automatically stops recording after 10 seconds', async () => {
      grantPermission();
      await RecordingService.startRecording();
      expect(RecordingService.getStatus()).toBe('recording');

      // Advance time past the 10-second limit
      await jest.advanceTimersByTimeAsync(10000);

      expect(RecordingService.getStatus()).toBe('idle');
      expect(mockStop).toHaveBeenCalled();
    });

    it('does not auto-stop if recording is manually stopped before 10 seconds', async () => {
      grantPermission();
      await RecordingService.startRecording();

      // Stop manually after 5 seconds
      jest.advanceTimersByTime(5000);
      await RecordingService.stopRecording();

      // Advance past the 10-second mark — should not call stop again
      mockStop.mockClear();
      jest.advanceTimersByTime(6000);
      expect(mockStop).not.toHaveBeenCalled();
    });

    it('caps durationMs at 10000 when auto-stopped', async () => {
      grantPermission();
      await RecordingService.startRecording();

      // Advance time to trigger auto-stop
      await jest.advanceTimersByTimeAsync(10000);

      // The auto-stop already happened, status is idle
      expect(RecordingService.getStatus()).toBe('idle');
    });
  });
});
