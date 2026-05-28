import { createStorage } from '../services/storage';
import { TextStyle } from 'react-native';

export function getEquippedTextPackId(): string | null {
  try {
    const storage = createStorage();
    return storage.getString('equipped_text_pack_id') || null;
  } catch {
    return null;
  }
}

export function getEquippedTextStyle(): TextStyle {
  const packId = getEquippedTextPackId();
  if (!packId) return {};

  switch (packId) {
    case 'text-bubble':
      return { letterSpacing: 3, fontWeight: '900' as const };
    case 'text-pixel':
      return { fontFamily: 'monospace', letterSpacing: 2 };
    case 'text-rainbow':
      return { color: '#FF6D00' };
    case 'text-glow':
      return { textShadowColor: '#7C4DFF', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 };
    case 'text-handwritten':
      return { fontStyle: 'italic' as const, fontWeight: '300' as const, letterSpacing: 1 };
    default:
      return {};
  }
}
