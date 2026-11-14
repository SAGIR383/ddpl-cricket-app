// Audio Engine for CricPlus Live Auction
// Powered by browser Web Audio API for zero-latency, offline-capable synthesized sound effects
// and Web Speech API for sweet Indian English female voice commentary & announcements.

class AuctionSoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private voiceMuted: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];
  private isAnnouncingResult: boolean = false;
  private pendingQueue: Array<() => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('cricplus_auction_muted');
      this.muted = savedMute === 'true';
      const savedVoiceMute = localStorage.getItem('cricplus_auction_voice_muted');
      this.voiceMuted = savedVoiceMute === 'true';

      if ('speechSynthesis' in window) {
        this.loadVoices();
        if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
          window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
      }
    }
  }

  private loadVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      this.voices = window.speechSynthesis.getVoices() || [];
    } catch {
      this.voices = [];
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('cricplus_auction_muted', String(this.muted));
    }
    return this.muted;
  }

  public setMute(muted: boolean) {
    this.muted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('cricplus_auction_muted', String(this.muted));
    }
  }

  public isVoiceMuted(): boolean {
    return this.voiceMuted;
  }

  public toggleVoiceMute(): boolean {
    this.voiceMuted = !this.voiceMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('cricplus_auction_voice_muted', String(this.voiceMuted));
      if (this.voiceMuted && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
    }
    return this.voiceMuted;
  }

  public setVoiceMute(muted: boolean) {
    this.voiceMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('cricplus_auction_voice_muted', String(this.voiceMuted));
      if (this.voiceMuted && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
    }
  }

  // --------------------------------------------------------------------------
  // Sweet Indian English Female Voice Selector
  // --------------------------------------------------------------------------
  private getPreferredVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    if (!this.voices || this.voices.length === 0) {
      this.loadVoices();
    }
    if (!this.voices || this.voices.length === 0) return null;

    // Priority 1: Indian English Female Voice (Neerja, Heera, Swara, Google en-IN Female, etc.)
    const enInFemale = this.voices.find((v) => {
      const isEnIn = v.lang === 'en-IN' || v.lang === 'en_IN' || v.lang.toLowerCase().startsWith('en-in');
      const n = (v.name || '').toLowerCase();
      return (
        isEnIn &&
        (n.includes('female') ||
          n.includes('neerja') ||
          n.includes('heera') ||
          n.includes('swara') ||
          n.includes('veena') ||
          n.includes('ananya') ||
          n.includes('priya') ||
          n.includes('natural') ||
          n.includes('google'))
      );
    });
    if (enInFemale) return enInFemale;

    // Priority 2: Any English (India) voice
    const anyEnIn = this.voices.find(
      (v) => v.lang === 'en-IN' || v.lang === 'en_IN' || v.lang.toLowerCase().startsWith('en-in')
    );
    if (anyEnIn) return anyEnIn;

    // Priority 3: Sweet, clear English Female voices (Zira, Samantha, Jenny, Ava, Sonia, Aria)
    const enFemale = this.voices.find((v) => {
      const n = (v.name || '').toLowerCase();
      return (
        (v.lang || '').startsWith('en') &&
        (n.includes('female') ||
          n.includes('zira') ||
          n.includes('samantha') ||
          n.includes('jenny') ||
          n.includes('ava') ||
          n.includes('sonia') ||
          n.includes('aria') ||
          n.includes('natural'))
      );
    });
    if (enFemale) return enFemale;

    // Priority 4: Any standard English voice
    const anyEn = this.voices.find((v) => (v.lang || '').startsWith('en'));
    return anyEn || this.voices[0] || null;
  }

  // --------------------------------------------------------------------------
  // Voice Announcements (With Guaranteed Completion Queue Protection)
  // --------------------------------------------------------------------------
  private announceCritical(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (this.voiceMuted || this.muted) return;

    try {
      this.isAnnouncingResult = true;
      this.pendingQueue = [];
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = this.getPreferredVoice();
      if (voice) {
        utterance.voice = voice;
      }
      utterance.pitch = 1.05; // Slightly elevated pitch for sweet tone
      utterance.rate = 0.95;  // Clear, natural commentary pacing
      utterance.volume = 1.0;

      const finishCritical = () => {
        this.isAnnouncingResult = false;
        if (this.pendingQueue.length > 0) {
          const nextFn = this.pendingQueue.shift();
          if (nextFn) setTimeout(nextFn, 350);
        }
      };

      utterance.onend = finishCritical;
      utterance.onerror = finishCritical;

      // Safety watchdog: In case browser drops onend, reset after 7.5 seconds
      setTimeout(() => {
        if (this.isAnnouncingResult) {
          finishCritical();
        }
      }, 7500);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      this.isAnnouncingResult = false;
      console.warn('[AuctionAudio] AnnounceCritical error:', e);
    }
  }

  public announce(text: string, force: boolean = false) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (this.voiceMuted || this.muted) return;

    // If a Sold or Unsold result is speaking, queue this speech so it won't be truncated!
    if (this.isAnnouncingResult && !force) {
      this.pendingQueue.push(() => this.announce(text, true));
      return;
    }

    try {
      if (!this.isAnnouncingResult) {
        window.speechSynthesis.cancel();
      }
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = this.getPreferredVoice();
      if (voice) {
        utterance.voice = voice;
      }
      utterance.pitch = 1.05;
      utterance.rate = 0.95;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[AuctionAudio] Announce error:', e);
    }
  }

  public announceFirstPlayer(player: string, role?: string, basePrice: number = 100) {
    const cleanPlayer = (player || '').replace(/\s*\([^)]*\)/g, '').trim();
    const roleStr = role ? role.trim() : 'All-Rounder';
    const text = `Welcome to DDPL 3.0 live auction! The first player on the block is ${cleanPlayer}, ${roleStr}. Base price is ${basePrice} points.`;
    this.announce(text, true);
  }

  public announceNextPlayer(player: string, role?: string, basePrice: number = 100) {
    const cleanPlayer = (player || '').replace(/\s*\([^)]*\)/g, '').trim();
    const roleStr = role ? role.trim() : 'Player';
    const text = `Next player on the block is ${cleanPlayer}, ${roleStr}. Base price is ${basePrice} points.`;
    this.announce(text);
  }

  public announceSold(player: string, team: string, price: number) {
    const cleanPlayer = (player || '').replace(/\s*\([^)]*\)/g, '').trim();
    const cleanTeam = (team || '').replace(/\s*\([^)]*\)/g, '').trim();
    const text = `Sold! ${cleanPlayer} is acquired by Team ${cleanTeam} for ${price} points! Congratulations ${cleanTeam}!`;
    setTimeout(() => {
      this.announceCritical(text);
    }, 250);
  }

  public announceUnsold(player: string) {
    const cleanPlayer = (player || '').replace(/\s*\([^)]*\)/g, '').trim();
    const text = `Unsold. ${cleanPlayer} remains unsold and moves to the unsold pool.`;
    setTimeout(() => {
      this.announceCritical(text);
    }, 250);
  }

  // 1. Crystal Clear Bell / Chime on New Bid
  public playBidChime() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12); // High chime

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      // Non-blocking
    }
  }

  // 2. Deep Resonant Gavel Hammer Strike on SOLD
  public playGavelStrike() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      // Wooden thud (Low punch)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);

      // Wooden strike transient click (High crack)
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(1200, ctx.currentTime);
      clickOsc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);

      clickGain.gain.setValueAtTime(0.5, ctx.currentTime);
      clickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);

      clickOsc.start();
      clickOsc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // Non-blocking
    }
  }

  // 3. Urgent Countdown Warning Beep (Final 5 Seconds)
  public playCountdownBeep(isFinal: boolean = false) {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isFinal ? 1200 : 750, ctx.currentTime);

      gain.gain.setValueAtTime(isFinal ? 0.45 : 0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Non-blocking
    }
  }

  // 4. Low Double Buzz on UNSOLD
  public playUnsoldBuzzer() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.setValueAtTime(95, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      // Non-blocking
    }
  }

  // 5. Celebratory Fanfare on RTM (Right to Match) Invocation
  public playRtmFanfare() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

        gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.3);
      });
    } catch (e) {
      // Non-blocking
    }
  }
}

export const auctionAudio = new AuctionSoundEngine();
