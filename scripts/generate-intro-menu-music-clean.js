const fs = require('fs');
const path = require('path');
const SR = 44100;

function writeWav(filePath, samples) {
  const n = samples.length;
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(samples[i]));
  const target = 0.72;
  const g = peak > 1e-9 ? target / peak : 1;
  const edge = Math.floor(SR * 0.05);
  const dataSize = n * 2;
  const out = Buffer.alloc(44 + dataSize);
  out.write('RIFF', 0); out.writeUInt32LE(36 + dataSize, 4); out.write('WAVE', 8);
  out.write('fmt ', 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22); out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 2, 28);
  out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34);
  out.write('data', 36); out.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < n; i++) {
    let env = 1;
    if (i < edge) env = i / edge;
    else if (i > n - edge) env = Math.max(0, (n - i) / edge);
    let s = samples[i] * g * env;
    if (s > 1) s = 1; else if (s < -1) s = -1;
    const v = s < 0 ? Math.round(s * 32768) : Math.round(s * 32767);
    out.writeInt16LE(v, 44 + i * 2);
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, out);
  console.log('wrote', filePath, (n / SR).toFixed(2) + 's', 'peak', peak.toFixed(4));
}

function mix(base, arr, start, gain) {
  start = start | 0; gain = gain || 1;
  for (let i = 0; i < arr.length; i++) {
    const j = start + i;
    if (j >= 0 && j < base.length) base[j] += arr[i] * gain;
  }
}
function sine(f, t, ph) { return Math.sin(2 * Math.PI * f * t + (ph || 0)); }
function envPluck(len, decay) {
  const a = new Float32Array(len);
  for (let i = 0; i < len; i++) { const t = i / SR; a[i] = Math.exp(-t * decay) * (1 - Math.exp(-t * 80)); }
  return a;
}
function envPad(len, aT, rT) {
  const a = new Float32Array(len);
  const as = Math.floor(aT * SR), rs = Math.floor(rT * SR);
  for (let i = 0; i < len; i++) {
    let e = 1;
    if (i < as) e = i / as;
    else if (i > len - rs) e = Math.max(0, (len - i) / rs);
    a[i] = e * e * (3 - 2 * e);
  }
  return a;
}
function onePoleLP(samples, cutoff) {
  const out = new Float32Array(samples.length);
  const rc = 1 / (2 * Math.PI * cutoff);
  const dt = 1 / SR;
  const alpha = dt / (rc + dt);
  out[0] = samples[0] || 0;
  for (let i = 1; i < samples.length; i++) out[i] = out[i - 1] + alpha * (samples[i] - out[i - 1]);
  return out;
}
function veena(freq, dur, gain) {
  const len = Math.floor(dur * SR), s = new Float32Array(len), e = envPluck(len, 1.9);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    let v = sine(freq, t) * 0.52 + sine(freq * 2, t) * 0.16 + sine(freq * 3, t) * 0.07 + sine(freq * 0.5, t) * 0.04;
    // soft attack transient (no noise hiss)
    v += sine(freq * 4.01, t) * 0.03 * Math.exp(-t * 12);
    s[i] = v * e[i] * gain;
  }
  return onePoleLP(s, 3200);
}
function flute(freq, dur, gain) {
  const len = Math.floor(dur * SR), s = new Float32Array(len), e = envPad(len, 0.25, 0.45);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const vib = 1 + 0.0022 * Math.sin(2 * Math.PI * 5.1 * t);
    let v = sine(freq * vib, t) * 0.62 + sine(freq * 2 * vib, t) * 0.10 + sine(freq * 3 * vib, t) * 0.03;
    // gentle breath-like AM (tonal, not white noise)
    v *= 0.985 + 0.015 * Math.sin(2 * Math.PI * 3.7 * t);
    s[i] = v * e[i] * gain;
  }
  return onePoleLP(s, 2600);
}
function nadas(freq, dur, gain) {
  const len = Math.floor(dur * SR), s = new Float32Array(len), e = envPad(len, 0.12, 0.35);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const vib = 1 + 0.0035 * Math.sin(2 * Math.PI * 5.8 * t);
    let v = 0;
    const harms = [1,2,3,4,5];
    const amps = [0.42,0.14,0.07,0.04,0.02];
    for (let h = 0; h < harms.length; h++) v += sine(freq * harms[h] * vib, t) * amps[h];
    s[i] = v * e[i] * gain;
  }
  return onePoleLP(s, 2800);
}
function mridangam(dur, low, gain) {
  const len = Math.floor(dur * SR), s = new Float32Array(len), e = envPluck(len, 10);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const f = low * Math.exp(-t * 9) + low * 0.72;
    let v = sine(f, t) * 0.7 + sine(f * 2.02, t) * 0.15 + sine(f * 2.98, t) * 0.05 * Math.exp(-t * 20);
    s[i] = v * e[i] * gain;
  }
  return onePoleLP(s, 1400);
}
function bell(dur, freq, gain) {
  const len = Math.floor(dur * SR), s = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const e = Math.exp(-t * 1.7);
    let v = sine(freq, t) * 0.46 + sine(freq * 2.4, t) * 0.16 + sine(freq * 3.9, t) * 0.09 + sine(freq * 5.2, t) * 0.05;
    s[i] = v * e * gain;
  }
  return onePoleLP(s, 4500);
}
function drone(freqs, dur, gain) {
  const len = Math.floor(dur * SR), s = new Float32Array(len), e = envPad(len, 3.5, 3.5);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    let v = 0;
    for (let k = 0; k < freqs.length; k++) {
      const f = freqs[k];
      v += (sine(f, t) + sine(f * 2, t) * 0.10 + sine(f * 3, t) * 0.03) * (1 - k * 0.12);
    }
    v *= 0.94 + 0.06 * Math.sin(2 * Math.PI * 0.09 * t);
    s[i] = v * gain * e[i];
  }
  return onePoleLP(s, 2000);
}
function seamlessLoop(buf, crossfadeSec) {
  const cf = Math.min(Math.floor(SR * crossfadeSec), Math.floor(buf.length / 4));
  for (let i = 0; i < cf; i++) {
    const a = i / cf; // 0..1
    buf[i] = buf[i] * a + buf[buf.length - cf + i] * (1 - a);
  }
  // clear the tail we blended from to avoid duplicate transient (copy fade-out)
  for (let i = buf.length - cf; i < buf.length; i++) {
    const t = (i - (buf.length - cf)) / cf;
    buf[i] *= (1 - t);
  }
  return buf;
}

function makeMenu() {
  const dur = 96, len = Math.floor(dur * SR), out = new Float32Array(len);
  mix(out, drone([146.83, 220.0, 293.66], dur, 0.042), 0);
  const v = [293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33]; // D major pentatonic-ish set
  const seq = [0,2,4,5,4,2,0,3,4,6,7,6,4,2,0,1,3,5,4,2,0,2,4,3];
  let t = 3.2;
  for (let rep = 0; rep < 4; rep++) {
    seq.forEach((idx, i) => {
      const f = v[idx] * (rep % 2 && i > 16 ? 2 : 1);
      mix(out, veena(f, 2.0, 0.05), Math.floor(t * SR));
      t += 1.5;
    });
  }
  const f = [587.33, 659.25, 698.46, 783.99, 880.0];
  [10, 24, 40, 56, 72, 88].forEach((tt, i) => mix(out, flute(f[i % f.length], 3.6, 0.032), Math.floor(tt * SR)));
  [20, 50, 80].forEach((tt, i) => mix(out, nadas([246.94, 261.63, 293.66][i % 3], 2.4, 0.018), Math.floor(tt * SR)));
  for (let b = 4; b < dur - 3; b += 1.5) {
    mix(out, mridangam(0.4, 120, 0.024), Math.floor(b * SR));
    if (Math.abs((b % 3) - 1.5) < 0.01) mix(out, mridangam(0.28, 185, 0.014), Math.floor((b + 0.5) * SR));
  }
  [28, 64].forEach(tt => mix(out, bell(5.5, 660, 0.016), Math.floor(tt * SR)));
  return seamlessLoop(out, 2.0);
}

function makeIntro() {
  const dur = 72, len = Math.floor(dur * SR), out = new Float32Array(len);
  mix(out, drone([130.81, 196.0, 261.63], dur, 0.038), 0);
  [6, 22, 38, 54, 64].forEach(tt => mix(out, bell(6.5, 720, 0.04), Math.floor(tt * SR)));
  [14, 30, 46, 60].forEach(tt => mix(out, bell(5.0, 540, 0.022), Math.floor(tt * SR)));
  const n = [196,220,246.94,261.63,293.66,329.63,349.23,392];
  const ph = [0,2,4,5,4,2,0,1,3,4,6,7,6,4,2,0];
  let t = 8;
  ph.forEach((idx, i) => { mix(out, nadas(n[idx], i % 4 === 3 ? 2.4 : 1.7, 0.04), Math.floor(t * SR)); t += (i % 4 === 3 ? 2.6 : 1.8); });
  let t2 = 38;
  ph.slice().reverse().forEach((idx, i) => { mix(out, nadas(n[idx], i % 4 === 3 ? 2.2 : 1.6, 0.036), Math.floor(t2 * SR)); t2 += (i % 4 === 3 ? 2.4 : 1.8); });
  const f = [392,440,493.88,523.25,587.33];
  [16, 26, 36, 48, 58].forEach((tt, i) => mix(out, flute(f[i % f.length], 3.2, 0.028), Math.floor(tt * SR)));
  for (let b = 6; b < dur - 4; b += 2.0) {
    mix(out, mridangam(0.42, 110, 0.026), Math.floor(b * SR));
    if ((Math.round(b * 10) % 40) === 0) mix(out, mridangam(0.3, 170, 0.015), Math.floor((b + 0.5) * SR));
  }
  return seamlessLoop(out, 2.0);
}

const base = 'unity/Assets/_Project/Resources/Audio/Music';
writeWav(path.join(base, 'bgm_intro_cinematic.wav'), makeIntro());
writeWav(path.join(base, 'bgm_main_menu.wav'), makeMenu());
console.log('done');
