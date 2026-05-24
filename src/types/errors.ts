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
