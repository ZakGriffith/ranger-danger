/**
 * Sounds built from code rather than files: the level map's hover and select,
 * building and upgrading towers, boss entrances, the level win and the
 * game-over sting. Plain sample math at
 * 44.1 kHz, rendered once per load by sfx.ts into AudioBuffers. Each generator
 * is deterministic, so the game plays the exact waveform that was auditioned.
 */
export const SYNTH_RATE = 44100;
const SR = SYNTH_RATE;
const TAU = Math.PI * 2;

type Rng = () => number;
type Filter = (x: number) => number;
type Samples = Float32Array<ArrayBuffer>;
type Overtone = [freq: number, amp: number, tau: number];
type Mode = [freq: number, decay: number, gain: number];

function rng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const secs = (s: number) => Math.ceil(s * SR);
const make = (s: number) => new Float32Array(secs(s));

function mix(dst: Samples, src: Samples, at = 0, gain = 1): Samples {
  const off = Math.round(at * SR);
  const n = Math.min(src.length, dst.length - off);
  for (let i = 0; i < n; i++) dst[off + i] += src[i] * gain;
  return dst;
}

function noise(sec: number, rnd: Rng): Samples {
  const out = make(sec);
  for (let i = 0; i < out.length; i++) out[i] = rnd() * 2 - 1;
  return out;
}

/** Exponential fade with time constant tau, after an optional soft attack. */
function envelope(buf: Samples, tau: number, attack = 0): Samples {
  const out = new Float32Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR;
    out[i] = buf[i] * Math.exp(-t / tau) * (attack ? 1 - Math.exp(-t / attack) : 1);
  }
  return out;
}

/** RBJ biquad (lowpass, bandpass or highpass) as a per-sample processor. */
function biquad(type: 'lp' | 'bp' | 'hp', f0: number, Q: number): Filter {
  const w0 = TAU * f0 / SR, cw = Math.cos(w0), al = Math.sin(w0) / (2 * Q);
  const a0 = 1 + al, a1 = -2 * cw / a0, a2 = (1 - al) / a0;
  const [b0, b1, b2] = type === 'lp'
    ? [(1 - cw) / 2 / a0, (1 - cw) / a0, (1 - cw) / 2 / a0]
    : type === 'hp'
      ? [(1 + cw) / 2 / a0, -(1 + cw) / a0, (1 + cw) / 2 / a0]
      : [al / a0, 0, -al / a0];
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => {
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}

function filter(buf: Samples, fn: Filter): Samples {
  const out = new Float32Array(buf.length);
  for (let i = 0; i < buf.length; i++) out[i] = fn(buf[i]);
  return out;
}

/** Filtered noise under an envelope: the raw material of pats, drum skins, cracks and thuds. */
function burst(sec: number, rnd: Rng, type: 'lp' | 'bp' | 'hp', f0: number, Q: number, tau: number, attack = 0): Samples {
  return envelope(filter(noise(sec, rnd), biquad(type, f0, Q)), tau, attack);
}

/** A struck body: decaying sines at its overtone frequencies. */
function strike(sec: number, overtones: Overtone[]): Samples {
  const out = make(sec);
  for (const [f, a, tau] of overtones)
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      out[i] += a * Math.exp(-t / tau) * Math.sin(TAU * f * t);
    }
  return out;
}

/** Sine whose pitch falls from fHi to fLo (time constant slide) while fading with tau: drum bodies and thuds. */
function thump(sec: number, fHi: number, fLo: number, slide: number, tau: number): Samples {
  const out = make(sec);
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR, f = fLo + (fHi - fLo) * Math.exp(-t / slide);
    ph += TAU * f / SR;
    out[i] = Math.sin(ph) * Math.exp(-t / tau) * (1 - Math.exp(-t / 0.0015));
  }
  return out;
}

/**
 * Schroeder reverb: four lowpassed feedback combs into two allpasses. tail is
 * the RT60 in seconds, size scales the delays (a bigger room), damp darkens
 * the tail the way stone soaks up highs faster than lows.
 */
function reverb(input: Samples, tail: number, wet: number, size: number, damp: number): Samples {
  const n = input.length + secs(tail + 0.2);
  const out = new Float32Array(n);
  const pre = secs(0.008);
  const combs = [29.7, 37.1, 41.1, 43.7].map((ms) => {
    const D = Math.round(ms * size * SR / 1000);
    return { buf: new Float32Array(D), i: 0, g: Math.pow(10, -3 * D / (tail * SR)), lp: 0 };
  });
  const aps = [5.0, 1.7].map((ms) => ({ buf: new Float32Array(Math.round(ms * size * SR / 1000)), i: 0 }));
  for (let i = 0; i < n; i++) {
    const j = i - pre;
    const x = j >= 0 && j < input.length ? input[j] : 0;
    let s = 0;
    for (const c of combs) {
      const y = c.buf[c.i];
      c.lp += (1 - damp) * (y - c.lp);
      c.buf[c.i] = x + c.g * c.lp;
      c.i = (c.i + 1) % c.buf.length;
      s += y;
    }
    s *= 0.25;
    for (const a of aps) {
      const d = a.buf[a.i];
      const y = -0.7 * s + d;
      a.buf[a.i] = s + 0.7 * y;
      a.i = (a.i + 1) % a.buf.length;
      s = y;
    }
    out[i] = (i < input.length ? input[i] : 0) + wet * s;
  }
  return out;
}

/** In-place radix-2 FFT; the inverse is done through conjugation in convolve. */
function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { const tr = re[i]; re[i] = re[j]; re[j] = tr; const ti = im[i]; im[i] = im[j]; im[j] = ti; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -TAU / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const br = re[b] * cr - im[b] * ci, bi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - br; im[b] = im[a] - bi;
        re[a] += br; im[a] += bi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}

/** dry + wet * (x convolved with the room impulse h), via one large FFT. */
function convolve(x: Samples, h: Samples, wet: number): Samples {
  const n = x.length + h.length - 1;
  let N = 1;
  while (N < n) N <<= 1;
  const xr = new Float64Array(N), xi = new Float64Array(N), hr = new Float64Array(N), hi = new Float64Array(N);
  xr.set(x); hr.set(h);
  fft(xr, xi); fft(hr, hi);
  for (let i = 0; i < N; i++) {
    const a = xr[i] * hr[i] - xi[i] * hi[i], b = xr[i] * hi[i] + xi[i] * hr[i];
    xr[i] = a; xi[i] = -b;
  }
  fft(xr, xi);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = (i < x.length ? x[i] : 0) + wet * xr[i] / N;
  return out;
}

/**
 * Room impulse: a few discrete early echoes, then a diffuse noise tail whose
 * highs die sooner than its lows, as in real rooms. Unit energy, so wet means
 * the same thing in every space.
 */
function room(seed: number, t60: number, early: [number, number][], bright: number): Samples {
  const r = rng(seed);
  const pre = 0.004;
  const n = secs(pre + t60 * 1.1), ir = new Float32Array(n);
  const p0 = secs(pre);
  for (const [ms, g] of early) ir[Math.min(n - 1, p0 + secs(ms / 1000))] += g;
  const low = biquad('lp', 1200, 0.7), high = biquad('hp', 1200, 0.7);
  const start = p0 + secs(0.012);
  for (let i = start; i < n; i++) {
    const t = (i - start) / SR, v = r() * 2 - 1;
    ir[i] += low(v) * Math.pow(10, -3 * t / t60) + high(v) * Math.pow(10, -3 * t / (t60 * bright)) * 0.7;
  }
  let e = 0;
  for (let i = 0; i < n; i++) e += ir[i] * ir[i];
  const k = 1 / Math.sqrt(e);
  for (let i = 0; i < n; i++) ir[i] *= k;
  return ir;
}
const SHED = () => room(102, 0.6, [[4, 0.7], [9, 0.5], [15, 0.4], [26, 0.3], [40, 0.2]], 0.4);
const CATHEDRAL = () => room(105, 2.8, [[18, 0.4], [31, 0.35], [49, 0.3], [72, 0.25], [95, 0.2]], 0.35);
const YARD = () => room(106, 0.3, [[6, 0.3], [13, 0.2], [23, 0.15], [37, 0.1]], 0.5);

/** Noise excitation ringing a bank of resonances; peak-normalized to 1. */
function resonate(exc: Samples, modes: Mode[]): Samples {
  const out = new Float32Array(exc.length);
  for (const [f, tau, g] of modes) {
    const bp = biquad('bp', f, Math.PI * f * tau);
    for (let i = 0; i < exc.length; i++) out[i] += bp(exc[i]) * g;
  }
  let max = 1e-9;
  for (let i = 0; i < out.length; i++) max = Math.max(max, Math.abs(out[i]));
  for (let i = 0; i < out.length; i++) out[i] /= max;
  return out;
}

/** Peak-normalize to 1 so components can be balanced by their mix gains alone. */
function norm(buf: Samples): Samples {
  let max = 1e-9;
  for (let i = 0; i < buf.length; i++) max = Math.max(max, Math.abs(buf[i]));
  const out = new Float32Array(buf.length);
  for (let i = 0; i < buf.length; i++) out[i] = buf[i] / max;
  return out;
}

/** Normalize to peak, drop the inaudible tail and fade the last 5 ms so the cut never clicks. */
function finish(buf: Samples, peak: number): Samples {
  let max = 1e-9;
  for (let i = 0; i < buf.length; i++) max = Math.max(max, Math.abs(buf[i]));
  const k = peak / max;
  let end = buf.length;
  while (end > 1 && Math.abs(buf[end - 1]) * k < 0.0005) end--;
  const fade = Math.min(secs(0.005), end);
  const out = new Float32Array(end);
  for (let i = 0; i < end; i++) {
    const left = end - i;
    out[i] = buf[i] * k * (left < fade ? left / fade : 1);
  }
  return out;
}

/** Hovering a level node: a gloved hand patting the map. Kept quiet because it fires on every node the mouse crosses. */
export function hoverPat(): Samples {
  const r = rng(13);
  const out = make(0.11);
  mix(out, burst(0.1, r, 'lp', 650, 0.7, 0.018, 0.002), 0, 1);
  mix(out, thump(0.1, 150, 95, 0.02, 0.028), 0, 0.8);
  return finish(out, 0.5);
}

/** Picking a level, difficulty or start: one war-drum hit in a small stone room. */
export function selectDrum(): Samples {
  const r = rng(23);
  const hit = make(0.96);
  mix(hit, thump(0.96, 115, 55, 0.035, 0.16), 0, 1);                 // the head, pitch settling as it stretches
  mix(hit, burst(0.05, r, 'bp', 1400, 0.8, 0.01, 0.0005), 0, 0.5);  // stick slap
  mix(hit, burst(0.08, r, 'lp', 900, 0.7, 0.03, 0.001), 0, 0.6);    // air pushed out of the shell
  mix(hit, strike(0.2, [[55 * 2.15, 0.3, 0.06]]), 0, 1);            // head overtone
  const out = mix(make(0.7), hit, 0, 1);
  return finish(reverb(out, 0.9, 0.25, 1.2, 0.6), 0.8);
}

/**
 * A horn with a partner a few cents sharp, scooping into the note with
 * vibrato arriving late. FM at a 1:1 ratio gives the brassy harmonics; the
 * modulation index rides the envelope so the tone brightens as it swells.
 */
function hornNote(freq: number, sec: number, attack = 0.07, release = 0.25): Samples {
  const out = make(sec + release);
  const f2 = freq * 1.0017;
  let ph = 0, ph2 = 0;
  const held = 1 - Math.exp(-sec / attack);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const gate = t < sec ? 1 - Math.exp(-t / attack) : held * Math.max(0, 1 - (t - sec) / release);
    const vib = t > 0.22 ? 0.005 * Math.sin(TAU * 5.2 * t) * Math.min(1, (t - 0.22) / 0.3) : 0;
    const scoop = 1 - 0.025 * Math.exp(-t / 0.05);
    const index = 0.4 + 2.4 * gate;
    ph += TAU * freq * scoop * (1 + vib) / SR;
    ph2 += TAU * f2 * scoop * (1 + vib) / SR;
    out[i] = gate * (Math.sin(ph + index * Math.sin(ph)) + 0.5 * Math.sin(ph2 + index * Math.sin(ph2)));
  }
  return out;
}

/** The ranger falls: horns descend C4, Ab3, F3 and fade in a hall. */
export function gameOverHorn(): Samples {
  let out = make(3.6);
  mix(out, hornNote(261.63, 0.5), 0, 0.8);
  mix(out, hornNote(207.65, 0.5), 0.52, 0.85);
  mix(out, hornNote(174.61, 1.2, 0.4, 0.6), 1.04, 1);
  out = filter(out, biquad('lp', 2600, 0.8));
  return finish(reverb(out, 1.3, 0.25, 1.3, 0.5), 0.8);
}

/** A boss arrives: a lightning crack, then thunder rolling away through a vast space. */
export function bossThunder(): Samples {
  const r = rng(111);
  const out = make(3.2);
  mix(out, burst(0.05, r, 'hp', 900, 0.7, 0.006, 0.0003), 0, 1);
  for (let i = 0; i < 6; i++) mix(out, burst(0.03, r, 'bp', 2500 + r() * 2500, 1.0, 0.004, 0.0003), 0.01 + r() * 0.12, 0.5 + r() * 0.3);
  const rumble = filter(noise(2.8, r), biquad('lp', 110, 0.9));
  const wob = filter(noise(2.8, r), biquad('lp', 3, 0.7));
  let wmax = 1e-9;
  for (let i = 0; i < wob.length; i++) wmax = Math.max(wmax, Math.abs(wob[i]));
  const roll = make(2.8);
  for (let i = 0; i < roll.length; i++) {
    const t = i / SR;
    roll[i] = rumble[i] * Math.min(1, t / 0.08) * Math.exp(-t / 1.1) * (0.65 + 0.35 * wob[i] / wmax);
  }
  mix(out, roll, 0.03, 9);
  return finish(convolve(out, CATHEDRAL(), 0.3), 0.85);
}

/** A plank knocking: low wood clunk with a short clatter. The chest lid falling open. */
function plank(r: Rng, pitch: number): Samples {
  const out = make(0.35);
  const exc = mix(make(0.35), burst(0.008, r, 'lp', 2500, 0.7, 0.002, 0.0003), 0, 1);
  mix(out, resonate(exc, [[120 * pitch, 0.045, 1.0], [210 * pitch, 0.04, 0.8], [350 * pitch, 0.03, 0.6], [600 * pitch, 0.02, 0.4], [950 * pitch, 0.012, 0.25]]), 0, 0.8);
  mix(out, burst(0.03, r, 'lp', 900, 0.7, 0.008, 0.0005), 0, 0.7);
  mix(out, thump(0.1, 90, 60, 0.02, 0.03), 0, 0.4);
  return out;
}

/** One coin landing: a bright metallic ping at a random size. */
function coin(r: Rng): Samples {
  const k = 0.8 + r() * 0.5;
  const exc = mix(make(0.12), burst(0.004, r, 'hp', 3000, 0.7, 0.0008, 0.0001), 0, 1);
  return resonate(exc, [[4200 * k, 0.03, 1.0], [6100 * k, 0.025, 0.7], [8300 * k, 0.018, 0.5], [11000 * k, 0.012, 0.3]]);
}

/** Level won: a chest lid creaks open and coins pour out. */
export function victoryCoins(): Samples {
  const r = rng(123);
  const out = make(2.6);
  const creakN = filter(noise(0.4, r), biquad('bp', 900, 6));
  const creak = make(0.4);
  for (let i = 0; i < creak.length; i++) {
    const t = i / SR;
    creak[i] = creakN[i] * Math.sin(Math.PI * t / 0.4) * (0.5 + 0.5 * Math.sin(TAU * (18 + 30 * t) * t));
  }
  mix(out, creak, 0, 0.5);
  mix(out, plank(r, 1.1), 0.42, 0.7);
  for (let i = 0; i < 34; i++) {
    const p = i / 34;
    mix(out, coin(r), 0.55 + p * 1.1 + r() * 0.05, 0.35 + 0.5 * Math.sin(Math.PI * Math.min(1, p * 1.2)) + r() * 0.15);
  }
  return finish(convolve(out, SHED(), 0.3), 0.8);
}

/**
 * Heavy hammer on timber. The band-limited knock and the wood's low modes
 * carry the sound; the hammer-head click is only a hint, and everything above
 * 4.5 kHz is rolled off so it reads as wood, not as a tick.
 */
function hammer(r: Rng, pitch: number, weight: number, ring: number, crack: number): Samples {
  const out = make(0.4);
  mix(out, norm(burst(0.06, r, 'bp', 650 * pitch, 0.7, 0.011, 0.0004)), 0, 1.0);
  mix(out, norm(burst(0.012, r, 'bp', 2800, 1.0, 0.0015, 0.0002)), 0, crack);
  const exc = mix(make(0.4), burst(0.012, r, 'lp', 1500, 0.7, 0.003, 0.0003), 0, 1);
  const modes: Mode[] = [[115, 0.09, 1.0], [190, 0.07, 0.8], [290, 0.05, 0.6], [430, 0.035, 0.45], [640, 0.025, 0.3], [950, 0.015, 0.18]]
    .map(([f, t, g]) => [f * pitch, t * ring, g] as Mode);
  mix(out, resonate(exc, modes), 0, 0.55);
  mix(out, norm(thump(0.25, 85, 55, 0.025, 0.06 * weight)), 0, 0.6 * weight);
  return filter(out, biquad('lp', 4500, 0.7));
}

/** Building or upgrading a tower: a sledgehammer driving a post home in three blows, the last the heaviest. */
export function hammerBlows(): Samples {
  const r = rng(153);
  const pitch = 0.72, weight = 2.0, ring = 1.2, crack = 0.12;
  const out = make(1.0);
  mix(out, hammer(r, pitch * 1.04, weight, ring, crack), 0, 0.75);
  mix(out, hammer(r, pitch, weight, ring, crack), 0.17 + r() * 0.02, 0.85);
  mix(out, hammer(r, pitch * 0.94, weight * 1.4, ring * 1.15, crack), 0.35 + r() * 0.02, 1);
  return finish(convolve(out, YARD(), 0.3), 0.8);
}
