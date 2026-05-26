import { ValidationError } from '../types/errors';
import { VoiceProfile } from '../types';

// ─── Validation Result Type ──────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ─── Existing Validators ─────────────────────────────────────────────────────

/**
 * Validates a word list name.
 * Returns a ValidationError if the name is empty or whitespace-only.
 * Returns null if valid.
 */
export function validateListName(name: string): ValidationError | null {
  if (name.trim().length === 0) {
    return new ValidationError('name', 'List name cannot be empty or whitespace only.');
  }
  return null;
}

/**
 * Validates a word list's words array.
 * Returns a ValidationError if the array is empty.
 * Returns null if valid.
 */
export function validateWordList(words: string[]): ValidationError | null {
  if (words.length === 0) {
    return new ValidationError('words', 'Word list must contain at least one word.');
  }
  return null;
}

// ─── New Validators ──────────────────────────────────────────────────────────

/**
 * Validates a password.
 * Accepts if length is at least 8 characters.
 */
export function validatePassword(password: string): ValidationResult {
  if (password.length >= 8) {
    return { valid: true };
  }
  return { valid: false, error: 'Password must be at least 8 characters long.' };
}

/**
 * Validates an email address.
 * Accepts if it contains exactly one @, a non-empty local part,
 * and a domain with at least one dot.
 */
export function validateEmail(email: string): ValidationResult {
  const atIndex = email.indexOf('@');
  const lastAtIndex = email.lastIndexOf('@');

  // Must contain exactly one @
  if (atIndex === -1 || atIndex !== lastAtIndex) {
    return { valid: false, error: 'Email must contain exactly one @ symbol.' };
  }

  const localPart = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);

  // Local part must be non-empty
  if (localPart.length === 0) {
    return { valid: false, error: 'Email must have a non-empty local part before @.' };
  }

  // Domain must contain at least one dot
  if (!domain.includes('.')) {
    return { valid: false, error: 'Email domain must contain at least one dot.' };
  }

  // Domain parts around the dot must be non-empty
  const domainParts = domain.split('.');
  if (domainParts.some(part => part.length === 0)) {
    return { valid: false, error: 'Email domain parts must be non-empty.' };
  }

  return { valid: true };
}

/**
 * Validates a recording duration in milliseconds.
 * Accepts if greater than 0 and less than or equal to 10000.
 */
export function validateRecordingDuration(durationMs: number): ValidationResult {
  if (durationMs > 0 && durationMs <= 10000) {
    return { valid: true };
  }
  return { valid: false, error: 'Recording duration must be greater than 0 and at most 10000ms.' };
}

/**
 * Validates a VoiceProfile.
 * Speed must be between 0.5 and 1.5 inclusive, voiceId must be non-empty.
 */
export function validateVoiceProfile(profile: VoiceProfile): ValidationResult {
  if (!profile.voiceId || profile.voiceId.trim().length === 0) {
    return { valid: false, error: 'Voice profile must have a non-empty voiceId.' };
  }
  if (profile.speed < 0.5 || profile.speed > 1.5) {
    return { valid: false, error: 'Voice profile speed must be between 0.5 and 1.5.' };
  }
  return { valid: true };
}

/**
 * Validates a display name.
 * Must be non-empty after trim and at most 50 characters.
 */
export function validateDisplayName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Display name cannot be empty.' };
  }
  if (trimmed.length > 50) {
    return { valid: false, error: 'Display name must be at most 50 characters.' };
  }
  return { valid: true };
}
