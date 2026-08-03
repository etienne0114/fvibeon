/* Local mic activity detection via the Web Audio API — no library, no server
   round-trip. Used to (a) show a "speaking" pulse on your own tile and (b)
   let other participants know you're talking, via a lightweight signal, so
   everyone can independently rank "who's active" the same way.

   Note: a disabled MediaStreamTrack (muted mic) outputs silence to Web Audio
   too, so this naturally reads as "not speaking" whenever the mic is off —
   no extra muted-check needed. */

const SPEAKING_VOLUME_THRESHOLD = 14; // 0-255 scale; tuned to ignore room noise, catch normal speech
const CHECK_INTERVAL_MS = 300;

export interface SpeakingDetector {
  start: (stream: MediaStream) => void;
  stop: () => void;
}

export function createSpeakingDetector(onChange: (speaking: boolean) => void): SpeakingDetector {
  let audioContext: AudioContext | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let wasSpeaking = false;

  const stop = () => {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    audioContext?.close().catch(() => undefined);
    audioContext = null;
    if (wasSpeaking) onChange(false);
    wasSpeaking = false;
  };

  const start = (stream: MediaStream) => {
    stop();
    if (!stream.getAudioTracks().length) return;
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) return;

    audioContext = new AudioContextCtor();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    intervalId = setInterval(() => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
      const speaking = avg > SPEAKING_VOLUME_THRESHOLD;
      if (speaking !== wasSpeaking) {
        wasSpeaking = speaking;
        onChange(speaking);
      }
    }, CHECK_INTERVAL_MS);
  };

  return { start, stop };
}
