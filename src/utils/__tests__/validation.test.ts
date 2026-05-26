import {
  validatePassword,
  validateEmail,
  validateRecordingDuration,
  validateVoiceProfile,
  validateDisplayName,
} from '../validation';

describe('validatePassword', () => {
  it('accepts a password with exactly 8 characters', () => {
    expect(validatePassword('12345678')).toEqual({ valid: true });
  });

  it('accepts a password longer than 8 characters', () => {
    expect(validatePassword('a very long password')).toEqual({ valid: true });
  });

  it('rejects a password with 7 characters', () => {
    const result = validatePassword('1234567');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects an empty password', () => {
    const result = validatePassword('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('validateEmail', () => {
  it('accepts a standard email', () => {
    expect(validateEmail('user@example.com')).toEqual({ valid: true });
  });

  it('accepts an email with subdomain', () => {
    expect(validateEmail('user@mail.example.co.uk')).toEqual({ valid: true });
  });

  it('rejects an email without @', () => {
    const result = validateEmail('userexample.com');
    expect(result.valid).toBe(false);
  });

  it('rejects an email with multiple @ symbols', () => {
    const result = validateEmail('user@@example.com');
    expect(result.valid).toBe(false);
  });

  it('rejects an email with empty local part', () => {
    const result = validateEmail('@example.com');
    expect(result.valid).toBe(false);
  });

  it('rejects an email without a dot in the domain', () => {
    const result = validateEmail('user@localhost');
    expect(result.valid).toBe(false);
  });

  it('rejects an email with empty domain part after dot', () => {
    const result = validateEmail('user@example.');
    expect(result.valid).toBe(false);
  });

  it('rejects an email with empty domain part before dot', () => {
    const result = validateEmail('user@.com');
    expect(result.valid).toBe(false);
  });
});

describe('validateRecordingDuration', () => {
  it('accepts duration of 1ms', () => {
    expect(validateRecordingDuration(1)).toEqual({ valid: true });
  });

  it('accepts duration of exactly 10000ms', () => {
    expect(validateRecordingDuration(10000)).toEqual({ valid: true });
  });

  it('accepts duration of 5000ms', () => {
    expect(validateRecordingDuration(5000)).toEqual({ valid: true });
  });

  it('rejects duration of 0', () => {
    const result = validateRecordingDuration(0);
    expect(result.valid).toBe(false);
  });

  it('rejects negative duration', () => {
    const result = validateRecordingDuration(-100);
    expect(result.valid).toBe(false);
  });

  it('rejects duration exceeding 10000ms', () => {
    const result = validateRecordingDuration(10001);
    expect(result.valid).toBe(false);
  });
});

describe('validateVoiceProfile', () => {
  it('accepts a valid voice profile', () => {
    expect(
      validateVoiceProfile({ voiceId: 'en-gb-female', speed: 1.0, label: 'British Female' })
    ).toEqual({ valid: true });
  });

  it('accepts speed at lower bound (0.5)', () => {
    expect(
      validateVoiceProfile({ voiceId: 'voice1', speed: 0.5, label: 'Slow' })
    ).toEqual({ valid: true });
  });

  it('accepts speed at upper bound (1.5)', () => {
    expect(
      validateVoiceProfile({ voiceId: 'voice1', speed: 1.5, label: 'Fast' })
    ).toEqual({ valid: true });
  });

  it('rejects empty voiceId', () => {
    const result = validateVoiceProfile({ voiceId: '', speed: 1.0, label: 'Test' });
    expect(result.valid).toBe(false);
  });

  it('rejects whitespace-only voiceId', () => {
    const result = validateVoiceProfile({ voiceId: '   ', speed: 1.0, label: 'Test' });
    expect(result.valid).toBe(false);
  });

  it('rejects speed below 0.5', () => {
    const result = validateVoiceProfile({ voiceId: 'voice1', speed: 0.4, label: 'Test' });
    expect(result.valid).toBe(false);
  });

  it('rejects speed above 1.5', () => {
    const result = validateVoiceProfile({ voiceId: 'voice1', speed: 1.6, label: 'Test' });
    expect(result.valid).toBe(false);
  });
});

describe('validateDisplayName', () => {
  it('accepts a valid display name', () => {
    expect(validateDisplayName('John')).toEqual({ valid: true });
  });

  it('accepts a name with exactly 50 characters after trim', () => {
    const name = 'a'.repeat(50);
    expect(validateDisplayName(name)).toEqual({ valid: true });
  });

  it('rejects an empty string', () => {
    const result = validateDisplayName('');
    expect(result.valid).toBe(false);
  });

  it('rejects a whitespace-only string', () => {
    const result = validateDisplayName('   ');
    expect(result.valid).toBe(false);
  });

  it('rejects a name longer than 50 characters after trim', () => {
    const name = 'a'.repeat(51);
    const result = validateDisplayName(name);
    expect(result.valid).toBe(false);
  });

  it('trims leading/trailing whitespace before checking length', () => {
    const name = '  ' + 'a'.repeat(50) + '  ';
    expect(validateDisplayName(name)).toEqual({ valid: true });
  });
});
