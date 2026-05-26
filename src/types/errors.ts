export class AudioUnavailableError extends Error {
  constructor(
    public word: string,
    public reason: 'offline' | 'not-found' | 'tts-failed'
  ) {
    super(`Audio unavailable for "${word}": ${reason}`);
    this.name = 'AudioUnavailableError';
    Object.setPrototypeOf(this, AudioUnavailableError.prototype);
  }
}

export class ValidationError extends Error {
  constructor(public field: string, public message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class PurchaseError extends Error {
  constructor(public code: string, public userMessage: string) {
    super(userMessage);
    this.name = 'PurchaseError';
    Object.setPrototypeOf(this, PurchaseError.prototype);
  }
}

export class RecordingError extends Error {
  constructor(
    public reason: 'permission-denied' | 'hardware-unavailable' | 'duration-exceeded' | 'save-failed',
    message: string
  ) {
    super(message);
    this.name = 'RecordingError';
    Object.setPrototypeOf(this, RecordingError.prototype);
  }
}

export class DictationStorageError extends Error {
  constructor(
    public reason: 'upload-failed' | 'download-failed' | 'not-found',
    public word: string,
    message: string
  ) {
    super(message);
    this.name = 'DictationStorageError';
    Object.setPrototypeOf(this, DictationStorageError.prototype);
  }
}

export class CommunityListError extends Error {
  constructor(
    public reason: 'publish-failed' | 'fetch-failed' | 'not-found',
    message: string
  ) {
    super(message);
    this.name = 'CommunityListError';
    Object.setPrototypeOf(this, CommunityListError.prototype);
  }
}
