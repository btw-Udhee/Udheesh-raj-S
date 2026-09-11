/**
 * Synthesizes a gentle, professional high-tech cyber alert chime using standard Web Audio API.
 * Safely guards against browser autoplay restrictions and missing audio context.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Play a double cyber alert beep for high-risk / critical security events
 */
export function playSecurityAlertSound(isMuted: boolean = false): void {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // First tone (higher pitch)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5 note
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.12);

    // Second tone (lower pitch alert tone)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(587.33, now + 0.14); // D5 note
    gain2.gain.setValueAtTime(0.09, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.14);
    osc2.stop(now + 0.32);
  } catch {
    // Audio errors fail silently to avoid disrupting UI
  }
}
