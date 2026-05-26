/**
 * Simple sound effects using Web Audio API oscillator tones.
 * No external files needed — generates tones programmatically.
 */

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
  if (typeof window === 'undefined' || !window.AudioContext) return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

export function playCorrectSound() {
  // Happy ascending chime
  playTone(523, 0.15, 'sine', 0.3); // C5
  setTimeout(() => playTone(659, 0.15, 'sine', 0.3), 100); // E5
  setTimeout(() => playTone(784, 0.25, 'sine', 0.3), 200); // G5
}

export function playIncorrectSound() {
  // Gentle descending tone
  playTone(330, 0.2, 'triangle', 0.2); // E4
  setTimeout(() => playTone(262, 0.3, 'triangle', 0.2), 150); // C4
}

export function playStreakSound() {
  // Exciting ascending arpeggio
  playTone(523, 0.1, 'sine', 0.3);
  setTimeout(() => playTone(659, 0.1, 'sine', 0.3), 80);
  setTimeout(() => playTone(784, 0.1, 'sine', 0.3), 160);
  setTimeout(() => playTone(1047, 0.2, 'sine', 0.4), 240); // C6
}

export function playButtonClickSound() {
  playTone(880, 0.05, 'sine', 0.15); // Quick click
}
