// ---------------------------------------------------------------
//  Tiny WebAudio synth: cute meows, splashes, coin blips
// ---------------------------------------------------------------
type MeowKind = 'meow' | 'mew' | 'chirp';

class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private lastMeow = 0;
  private lastSplash = 0;
  muted = false;

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.55;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.55;
  }

  meow(kind: MeowKind = 'meow', pitch = 1, vol = 1) {
    const c = this.ctx;
    if (!c || !this.master || this.muted) return;
    const now = c.currentTime;
    if (now - this.lastMeow < 0.12) return;
    this.lastMeow = now;

    const dur = kind === 'meow' ? 0.6 : kind === 'mew' ? 0.34 : 0.17;
    const f0 = (kind === 'meow' ? 540 : kind === 'mew' ? 760 : 980) * pitch;

    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f0 * 0.9, now);
    osc.frequency.linearRampToValueAtTime(f0 * 1.4, now + dur * 0.3);
    osc.frequency.linearRampToValueAtTime(f0 * 0.78, now + dur);

    const lfo = c.createOscillator();
    lfo.frequency.value = 7;
    const lg = c.createGain();
    lg.gain.value = f0 * 0.018;
    lfo.connect(lg);
    lg.connect(osc.frequency);

    const f1 = c.createBiquadFilter();
    f1.type = 'bandpass';
    f1.Q.value = 5;
    f1.frequency.setValueAtTime(520, now);
    f1.frequency.linearRampToValueAtTime(1150, now + dur * 0.35);
    f1.frequency.linearRampToValueAtTime(620, now + dur);

    const f2 = c.createBiquadFilter();
    f2.type = 'bandpass';
    f2.Q.value = 7;
    f2.frequency.setValueAtTime(1500, now);
    f2.frequency.linearRampToValueAtTime(2700, now + dur * 0.35);
    f2.frequency.linearRampToValueAtTime(1700, now + dur);
    const g2 = c.createGain();
    g2.gain.value = 0.6;

    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(0.55 * vol, now + 0.04);
    env.gain.exponentialRampToValueAtTime(0.35 * vol, now + dur * 0.6);
    env.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(f1);
    f1.connect(env);
    osc.connect(f2);
    f2.connect(g2);
    g2.connect(env);
    env.connect(this.master);

    osc.start(now);
    lfo.start(now);
    osc.stop(now + dur + 0.05);
    lfo.stop(now + dur + 0.05);
  }

  splash(vol = 1) {
    const c = this.ctx;
    if (!c || !this.master || this.muted) return;
    const now = c.currentTime;
    if (now - this.lastSplash < 0.08) return;
    this.lastSplash = now;
    const len = Math.floor(c.sampleRate * 0.35);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 0.9;
    f.frequency.setValueAtTime(2200, now);
    f.frequency.exponentialRampToValueAtTime(500, now + 0.32);
    const g = c.createGain();
    g.gain.setValueAtTime(0.5 * vol, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(now);
  }

  blip(f1: number, f2: number, dur: number, type: OscillatorType = 'sine', vol = 0.25, delay = 0) {
    const c = this.ctx;
    if (!c || !this.master || this.muted) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  coin() {
    this.blip(988, 990, 0.08, 'square', 0.1);
    this.blip(1319, 1320, 0.16, 'square', 0.1, 0.07);
  }

  pop() {
    this.blip(380, 820, 0.12, 'sine', 0.3);
  }

  chop() {
    this.blip(240, 70, 0.09, 'triangle', 0.38);
    this.blip(1500, 500, 0.04, 'square', 0.05);
  }

  /** rising pitch while collecting coins in a streak */
  coinStep(step: number) {
    const f = 880 * Math.pow(1.0595, Math.min(step, 18));
    this.blip(f, f * 1.01, 0.1, 'triangle', 0.17);
    this.blip(f * 2, f * 2.02, 0.12, 'sine', 0.07, 0.025);
  }

  /** cash register "ka-ching" */
  cha() {
    this.blip(1568, 1570, 0.07, 'square', 0.08);
    this.blip(2093, 2095, 0.22, 'square', 0.08, 0.07);
    this.blip(3136, 3140, 0.3, 'sine', 0.06, 0.07);
  }

  thud() {
    this.blip(190, 60, 0.12, 'sine', 0.25);
  }

  fanfare() {
    [523, 659, 784, 1047].forEach((f, i) => this.blip(f, f * 1.003, 0.2, 'triangle', 0.2, i * 0.09));
    this.blip(1568, 1570, 0.4, 'sine', 0.12, 0.36);
  }

  private amb = false;
  startAmbience() {
    const c = this.ctx;
    if (!c || !this.master || this.amb) return;
    this.amb = true;
    const len = c.sampleRate * 4;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + 0.03 * (Math.random() * 2 - 1)) / 1.03; d[i] = last * 3.2; }
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 650;
    const g = c.createGain();
    g.gain.value = 0.09;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.11;
    const lg = c.createGain();
    lg.gain.value = 0.06;
    lfo.connect(lg);
    lg.connect(g.gain);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start();
    lfo.start();
  }

  alert() {
    this.blip(900, 1300, 0.13, 'triangle', 0.3);
  }
}

export const sfx = new Sfx();
