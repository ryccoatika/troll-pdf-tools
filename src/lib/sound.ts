"use client";

/**
 * Tiny procedural sound engine (Web Audio). No assets: every hiss, crunch and
 * laser zap is synthesised on the fly.
 */
class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  muted = false;

  private ac() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      const comp = this.ctx.createDynamicsCompressor();
      this.master.connect(comp).connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 2;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.55, this.ctx.currentTime, 0.02);
  }

  private ready() {
    if (this.muted) return null;
    return this.ac();
  }

  private noise(ctx: AudioContext) {
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    return src;
  }

  private env(ctx: AudioContext, t: number, a: number, peak: number, hold: number, r: number) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, t + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + r);
    return g;
  }

  click() {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(1800, t);
    o.frequency.exponentialRampToValueAtTime(600, t + 0.05);
    const g = this.env(ctx, t, 0.002, 0.15, 0, 0.06);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + 0.1);
  }

  /** Hydraulic hiss (pneumatic release). */
  hiss(duration = 1, gain = 0.35) {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const n = this.noise(ctx);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 2500;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(6000, t);
    bp.frequency.exponentialRampToValueAtTime(3500, t + duration);
    bp.Q.value = 0.6;
    const g = this.env(ctx, t, 0.03, gain, duration * 0.6, duration * 0.4);
    n.connect(hp).connect(bp).connect(g).connect(this.master!);
    n.start(t);
    n.stop(t + duration + 0.1);
  }

  /** Low motor hum + strained creak while the press works. Returns a stop fn. */
  strain(duration = 2.5) {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(48, t);
    o.frequency.linearRampToValueAtTime(38, t + duration);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 7;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 4;
    lfo.connect(lfoGain).connect(o.frequency);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    const g = this.env(ctx, t, 0.2, 0.32, duration - 0.5, 0.3);
    o.connect(lp).connect(g).connect(this.master!);
    o.start(t);
    lfo.start(t);
    o.stop(t + duration + 0.1);
    lfo.stop(t + duration + 0.1);
  }

  /** Paper crunch: a burst of filtered crackles. */
  crunch(intensity = 1) {
    const ctx = this.ready();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const count = Math.round(6 + intensity * 10);
    for (let i = 0; i < count; i++) {
      const t = t0 + Math.random() * 0.25;
      const n = this.noise(ctx);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 800 + Math.random() * 4000;
      bp.Q.value = 2 + Math.random() * 4;
      const g = this.env(ctx, t, 0.001, 0.25 * intensity, 0.005, 0.03 + Math.random() * 0.05);
      n.connect(bp).connect(g).connect(this.master!);
      n.start(t, Math.random());
      n.stop(t + 0.15);
    }
    this.thump(0.5 * intensity);
  }

  thump(gain = 0.8) {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.25);
    const g = this.env(ctx, t, 0.003, gain, 0.02, 0.35);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + 0.5);
  }

  clank() {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    [220, 331, 467, 1043].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "square";
      o.frequency.value = f;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 2400;
      const g = this.env(ctx, t, 0.002, 0.06 / (i + 1), 0, 0.4);
      o.connect(lp).connect(g).connect(this.master!);
      o.start(t);
      o.stop(t + 0.5);
    });
    this.thump(0.6);
  }

  /** Laser cutting: buzzing tone + sizzle. */
  laser(duration = 1.6) {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(880, t);
    o.frequency.linearRampToValueAtTime(1320, t + duration);
    const o2 = ctx.createOscillator();
    o2.type = "square";
    o2.frequency.setValueAtTime(110, t);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3000;
    const g = this.env(ctx, t, 0.05, 0.08, duration - 0.15, 0.1);
    o.connect(lp);
    o2.connect(lp);
    lp.connect(g).connect(this.master!);
    const n = this.noise(ctx);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 5000;
    const ng = this.env(ctx, t, 0.05, 0.12, duration - 0.15, 0.1);
    n.connect(hp).connect(ng).connect(this.master!);
    [o, o2, n].forEach((s) => {
      s.start(t);
      s.stop(t + duration + 0.1);
    });
  }

  zap() {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(2400, t);
    o.frequency.exponentialRampToValueAtTime(120, t + 0.3);
    const g = this.env(ctx, t, 0.002, 0.15, 0.02, 0.3);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + 0.4);
  }

  /** Rising vortex whoosh. */
  whoosh(duration = 2, rising = true) {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const n = this.noise(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 3;
    bp.frequency.setValueAtTime(rising ? 200 : 2000, t);
    bp.frequency.exponentialRampToValueAtTime(rising ? 3200 : 200, t + duration);
    const g = this.env(ctx, t, duration * 0.6, 0.5, 0, duration * 0.4);
    n.connect(bp).connect(g).connect(this.master!);
    n.start(t);
    n.stop(t + duration + 0.1);
  }

  success() {
    const ctx = this.ready();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const t = t0 + i * 0.08;
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = this.env(ctx, t, 0.005, 0.14, 0.05, 0.5);
      o.connect(g).connect(this.master!);
      o.start(t);
      o.stop(t + 0.7);
    });
  }

  sadTrombone() {
    const ctx = this.ready();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    [293.66, 277.18, 261.63, 246.94].forEach((f, i) => {
      const t = t0 + i * 0.38;
      const last = i === 3;
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(f, t);
      if (last) {
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 6;
        const lg = ctx.createGain();
        lg.gain.value = 6;
        lfo.connect(lg).connect(o.frequency);
        lfo.start(t);
        lfo.stop(t + 1.2);
      }
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 900;
      const g = this.env(ctx, t, 0.02, 0.12, last ? 0.8 : 0.25, 0.1);
      o.connect(lp).connect(g).connect(this.master!);
      o.start(t);
      o.stop(t + (last ? 1.2 : 0.4));
    });
  }
}

export const sfx = new Sfx();
