import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as Speech from 'expo-speech';
import { VoiceSelectionService } from '../services/VoiceSelectionService';
import { VoiceProfile, VoiceOption } from '../types';

interface VoiceProfileContextValue {
  profile: VoiceProfile;
  availableVoices: VoiceOption[];
  isLoading: boolean;
  updateProfile: (profile: VoiceProfile) => void;
  previewVoice: (voiceId: string, speed: number) => Promise<void>;
}

const VoiceProfileContext = createContext<VoiceProfileContextValue | undefined>(undefined);

export function VoiceProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<VoiceProfile>(VoiceSelectionService.getActiveProfile());
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadVoices() {
      try {
        const voices = await VoiceSelectionService.getAvailableVoices();
        if (mounted) {
          setAvailableVoices(voices);
        }
      } catch {
        // Voice loading failed — keep empty list, user can retry
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    loadVoices();
    return () => { mounted = false; };
  }, []);

  const updateProfile = useCallback((newProfile: VoiceProfile) => {
    VoiceSelectionService.saveProfile(newProfile);
    setProfile(newProfile);
  }, []);

  const previewVoice = useCallback(async (voiceId: string, speed: number) => {
    await Speech.speak('spelling', {
      voice: voiceId,
      rate: speed,
      language: 'en-GB',
    });
  }, []);

  return (
    <VoiceProfileContext.Provider value={{ profile, availableVoices, isLoading, updateProfile, previewVoice }}>
      {children}
    </VoiceProfileContext.Provider>
  );
}

export function useVoiceProfile(): VoiceProfileContextValue {
  const ctx = useContext(VoiceProfileContext);
  if (!ctx) throw new Error('useVoiceProfile must be used within a VoiceProfileProvider');
  return ctx;
}

export { VoiceProfileContext };
