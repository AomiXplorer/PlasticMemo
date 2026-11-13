/**
 * Voice channel. The game ships with a per-character synthesised voice (Web
 * Speech) so every line can be heard with a distinct timbre and cadence per
 * character. Recorded lines can replace it later by dropping files into
 * assets/audio/voice/<character>/<hash>.ogg and registering them in VOICE_MAP.
 */

const VOICE_MAP = {}; // e.g. 'mizuki:0' -> 'assets/audio/voice/mizuki/0001.ogg'

export class VoiceManager {
  constructor(audioManager, settings = {}) {
    this.audio = audioManager;
    this.enabled = settings.enabled ?? false;
    this.volume = settings.volume ?? 0.8;
    this.synth = window.speechSynthesis ?? null;
    this.voices = [];
    this.currentAudio = null;
    this.lineKey = null;
    this.loadVoices();
    if (this.synth) {
      this.synth.addEventListener?.('voiceschanged', () => this.loadVoices());
    }
  }

  loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices?.() ?? [];
  }

  pickVoice(lang = 'id-ID') {
    if (!this.voices.length) this.loadVoices();
    const exact = this.voices.find((v) => v.lang?.toLowerCase() === lang.toLowerCase());
    if (exact) return exact;
    const indo = this.voices.find((v) => v.lang?.toLowerCase().startsWith('id'));
    if (indo) return indo;
    const ms = this.voices.find((v) => /ms|id/i.test(v.lang ?? ''));
    if (ms) return ms;
    return this.voices.find((v) => v.lang?.toLowerCase().startsWith('en')) ?? this.voices[0] ?? null;
  }

  setEnabled(on) {
    this.enabled = !!on;
    if (!this.enabled) this.stop();
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.currentAudio) this.currentAudio.volume = this.volume;
  }

  stop() {
    if (this.synth) {
      try { this.synth.cancel(); } catch { /* ignore */ }
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }

  /**
   * @param {string} character  key from CHARACTERS
   * @param {string} text       the spoken line
   * @param {object} profile    { pitch, rate } from CHARACTERS
   * @param {string} [lineKey]  optional recorded-line lookup key
   */
  speak(character, text, profile = {}, lineKey = null) {
    this.stop();
    if (!this.enabled || !text) return;
    this.lineKey = lineKey;

    const recorded = lineKey ? VOICE_MAP[lineKey] : null;
    if (recorded) {
      const audio = new Audio(recorded);
      audio.volume = this.volume;
      audio.play().catch(() => {});
      this.currentAudio = audio;
      return;
    }

    if (!this.synth) return;
    const clean = text
      .replace(/[""]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return;
    const utter = new SpeechSynthesisUtterance(clean);
    const voice = this.pickVoice('id-ID');
    if (voice) utter.voice = voice;
    utter.lang = voice?.lang ?? 'id-ID';
    utter.pitch = profile.pitch ?? 1;
    utter.rate = (profile.rate ?? 1) * 1.02;
    utter.volume = this.volume;
    try { this.synth.speak(utter); } catch { /* ignore */ }
  }

  /** Speak a narration or system line with a neutral profile. */
  speakNarration(text) {
    this.speak('narrator', text, { pitch: 0.95, rate: 0.93 });
  }
}
