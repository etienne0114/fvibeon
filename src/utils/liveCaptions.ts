/* Live captions via the browser's free, built-in SpeechRecognition API — no paid
   transcription service, no server round-trip. Each participant who opts in
   transcribes their OWN mic locally and broadcasts the text as a signal; there's
   no way to caption someone else's audio without their own device doing it, so
   this is deliberately a per-person "caption my speech" toggle, not a call-wide
   setting. Chrome/Edge only in practice — feature-detected, hidden entirely
   where unsupported (Firefox/Safari) rather than pretending to work. */

type SpeechRecognitionCtor = new () => any;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function captionsSupported(): boolean {
  return Boolean(getSpeechRecognitionCtor());
}

const LANGUAGE_TAGS: Record<string, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  rw: 'rw-RW', // Kinyarwanda — browser speech engines don't cover this yet; fails gracefully via onUnsupported
};

/** Best-effort BCP-47 tag for the app's short language codes. Passing an unsupported
 * tag through (rather than silently swapping to English) lets the real failure surface
 * via onUnsupported instead of pretending to caption a language it isn't. */
export function toBcp47(code?: string | null): string {
  return (code && LANGUAGE_TAGS[code]) || 'en-US';
}

export interface LiveCaptioner {
  start: () => void;
  stop: () => void;
}

/** `lang` — a BCP-47 tag (e.g. "en-US", "fr-FR"). Browser speech engines only cover
 * major world languages; unsupported ones fail fast via onerror rather than hanging. */
export function createLiveCaptioner(lang: string, onResult: (text: string, isFinal: boolean) => void, onUnsupported: () => void): LiveCaptioner {
  const Ctor = getSpeechRecognitionCtor();
  let recognition: any = null;
  let stoppedIntentionally = false;

  const start = () => {
    if (!Ctor) {
      onUnsupported();
      return;
    }
    stoppedIntentionally = false;
    recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const text = result[0]?.transcript?.trim();
      if (text) onResult(text, result.isFinal);
    };
    recognition.onerror = (event: any) => {
      if (event.error === 'language-not-supported' || event.error === 'not-allowed') onUnsupported();
    };
    // Browsers auto-stop recognition after a period of silence — restart it
    // transparently unless the user actually turned captions off.
    recognition.onend = () => {
      if (!stoppedIntentionally) recognition?.start();
    };

    recognition.start();
  };

  const stop = () => {
    stoppedIntentionally = true;
    recognition?.stop();
    recognition = null;
  };

  return { start, stop };
}
