import type { RaceLog, RaceState } from '../types/race';

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function createNoiseBuffer(context: AudioContext, seconds = 1.8) {
  const sampleRate = context.sampleRate;
  const frameCount = Math.floor(sampleRate * seconds);
  const buffer = context.createBuffer(1, frameCount, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i += 1) {
    data[i] = (Math.random() * 2 - 1) * 0.6;
  }
  return buffer;
}

export class RaceAudioSystem {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private crowdGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private crowdSource: AudioBufferSourceNode | null = null;
  private windOsc: OscillatorNode | null = null;
  private enabled = false;
  private volume = 0.55;

  async init() {
    if (typeof window === 'undefined') return;
    if (this.context) return;

    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const crowdGain = ctx.createGain();
    crowdGain.gain.value = 0;
    crowdGain.connect(master);

    const windGain = ctx.createGain();
    windGain.gain.value = 0;
    windGain.connect(master);

    const crowdBuffer = createNoiseBuffer(ctx, 2.5);
    const crowdSource = ctx.createBufferSource();
    crowdSource.buffer = crowdBuffer;
    crowdSource.loop = true;
    crowdSource.connect(crowdGain);
    crowdSource.start();

    const windOsc = ctx.createOscillator();
    windOsc.type = 'triangle';
    windOsc.frequency.value = 180;
    windOsc.connect(windGain);
    windOsc.start();

    this.context = ctx;
    this.masterGain = master;
    this.crowdGain = crowdGain;
    this.windGain = windGain;
    this.crowdSource = crowdSource;
    this.windOsc = windOsc;
  }

  async setEnabled(on: boolean) {
    this.enabled = on;
    if (!this.context) await this.init();
    if (!this.context || !this.masterGain) return;
    if (on) {
      await this.context.resume();
    }
    const target = on ? this.volume : 0;
    this.masterGain.gain.linearRampToValueAtTime(target, this.context.currentTime + 0.18);
  }

  setVolume(vol: number) {
    this.volume = clamp(vol, 0, 1);
    if (this.masterGain && this.enabled) {
      this.masterGain.gain.linearRampToValueAtTime(this.volume, this.context!.currentTime + 0.1);
    }
  }

  updateFromRaceState(state: RaceState | null) {
    if (!state || !this.enabled || !this.context || !this.crowdGain || !this.windGain || !this.windOsc) return;

    const finished = state.teamStates.filter((s) => s.finishTime !== null).length;
    const progress = Math.max(0, Math.min(1, finished / Math.max(1, state.teamStates.length)));
    const avgSpeed =
      state.teamStates.reduce((sum, s) => sum + s.speed, 0) / Math.max(1, state.teamStates.length);
    const speedNorm = clamp(avgSpeed / 10, 0, 1);

    const crowdTarget = state.phase === 'racing' ? 0.05 + progress * 0.07 : 0.02;
    const windTarget = state.phase === 'racing' ? 0.02 + speedNorm * 0.08 : 0;
    const freqTarget = 160 + speedNorm * 220;

    this.crowdGain.gain.linearRampToValueAtTime(crowdTarget, this.context.currentTime + 0.14);
    this.windGain.gain.linearRampToValueAtTime(windTarget, this.context.currentTime + 0.1);
    this.windOsc.frequency.linearRampToValueAtTime(freqTarget, this.context.currentTime + 0.09);
  }

  playLogEvent(log: RaceLog) {
    if (!this.enabled || !this.context || !this.masterGain) return;
    const ctx = this.context;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);

    if (log.type === 'skill_activate') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(760, now + 0.08);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.09, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.19);
      return;
    }

    if (log.type === 'overtake') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(170, now + 0.12);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
      osc.start(now);
      osc.stop(now + 0.14);
      return;
    }

    if (log.type === 'finish') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(640, now);
      osc.frequency.setValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.24);
    }
  }

  destroy() {
    this.crowdSource?.stop();
    this.windOsc?.stop();
    this.context?.close();
    this.context = null;
    this.masterGain = null;
    this.crowdGain = null;
    this.windGain = null;
    this.crowdSource = null;
    this.windOsc = null;
  }
}
