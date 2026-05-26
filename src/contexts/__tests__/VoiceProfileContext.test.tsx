import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { VoiceProfileProvider, useVoiceProfile } from '../VoiceProfileContext';
import { VoiceSelectionService } from '../../services/VoiceSelectionService';
import * as Speech from 'expo-speech';
import { VoiceProfile, VoiceOption } from '../../types';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
}));

jest.mock('../../services/VoiceSelectionService', () => ({
  VoiceSelectionService: {
    getActiveProfile: jest.fn(),
    getAvailableVoices: jest.fn(),
    saveProfile: jest.fn(),
  },
}));

const mockGetActiveProfile = VoiceSelectionService.getActiveProfile as jest.Mock;
const mockGetAvailableVoices = VoiceSelectionService.getAvailableVoices as jest.Mock;
const mockSaveProfile = VoiceSelectionService.saveProfile as jest.Mock;
const mockSpeak = Speech.speak as jest.Mock;

// ─── Test Data ───────────────────────────────────────────────────────────────

const defaultProfile: VoiceProfile = {
  voiceId: 'en-GB-female-default',
  speed: 1.0,
  label: 'British English Female',
};

const mockVoices: VoiceOption[] = [
  { id: 'en-GB-female-default', name: 'British English Female', language: 'en-GB', gender: 'female', quality: 'default' },
  { id: 'en-GB-male-default', name: 'British English Male', language: 'en-GB', gender: 'male', quality: 'default' },
  { id: 'en-US-female-enhanced', name: 'American English Female', language: 'en-US', gender: 'female', quality: 'enhanced' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  return <VoiceProfileProvider>{children}</VoiceProfileProvider>;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('VoiceProfileContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetActiveProfile.mockReturnValue(defaultProfile);
    mockGetAvailableVoices.mockResolvedValue(mockVoices);
  });

  it('loads active profile from VoiceSelectionService on mount', () => {
    const { result } = renderHook(() => useVoiceProfile(), { wrapper });

    expect(mockGetActiveProfile).toHaveBeenCalledTimes(1);
    expect(result.current.profile).toEqual(defaultProfile);
  });

  it('enumerates available voices on mount', async () => {
    const { result } = renderHook(() => useVoiceProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetAvailableVoices).toHaveBeenCalledTimes(1);
    expect(result.current.availableVoices).toEqual(mockVoices);
  });

  it('starts with isLoading true and sets to false after voices load', async () => {
    const { result } = renderHook(() => useVoiceProfile(), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('updateProfile saves to VoiceSelectionService and updates state', async () => {
    const { result } = renderHook(() => useVoiceProfile(), { wrapper });

    const newProfile: VoiceProfile = {
      voiceId: 'en-GB-male-default',
      speed: 0.8,
      label: 'British English Male',
    };

    act(() => {
      result.current.updateProfile(newProfile);
    });

    expect(mockSaveProfile).toHaveBeenCalledWith(newProfile);
    expect(result.current.profile).toEqual(newProfile);
  });

  it('previewVoice calls Speech.speak with correct parameters', async () => {
    const { result } = renderHook(() => useVoiceProfile(), { wrapper });

    await act(async () => {
      await result.current.previewVoice('en-GB-male-default', 0.75);
    });

    expect(mockSpeak).toHaveBeenCalledWith('spelling', {
      voice: 'en-GB-male-default',
      rate: 0.75,
      language: 'en-GB',
    });
  });

  it('throws error when useVoiceProfile is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useVoiceProfile());
    }).toThrow('useVoiceProfile must be used within a VoiceProfileProvider');

    consoleSpy.mockRestore();
  });

  it('handles voice loading failure gracefully', async () => {
    mockGetAvailableVoices.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useVoiceProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.availableVoices).toEqual([]);
  });
});
