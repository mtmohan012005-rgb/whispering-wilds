const fs = require('fs');
const path = require('path');
const SR = 44100;
function writeWav(filePath, samples) {
  const num = samples.length; const dataSize = num * 2; const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + dataSize, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR*2, 28);
  buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(dataSize, 40);
  for (let i=0;i<num;i++){ let s=Math.max(-1,Math.min(1,samples[i])); buf.writeInt16LE(s<0?s*0x8000:s*0x7FFF,44+i*2); }
  fs.mkdirSync(path.dirname(filePath), {recursive:true}); fs.writeFileSync(filePath, buf);
  console.log('wrote', filePath, (num/SR).toFixed(1)+'s', buf.length);
}
function mix(base, arr, start, gain=1){ for(let i=0;i<arr.length;i++){ const j=start+i; if(j>=0 && j<base.length) base[j]+=arr[i]*gain; } }
function envPluck(len, decay=2.2){ const a=new Float32Array(len); for(let i=0;i<len;i++){ const t=i/SR; a[i]=Math.exp(-t*decay)*(1-Math.exp(-t*40)); } return a; }
function envPad(len, aT=1.5, rT=2.0){ const a=new Float32Array(len); const as=Math.floor(aT*SR), rs=Math.floor(rT*SR); for(let i=0;i<len;i++){ let e=1; if(i<as) e=i/as; else if(i>len-rs) e=Math.max(0,(len-i)/rs); a[i]=e*e*(3-2*e); } return a; }
function sine(f,t,ph=0){ return Math.sin(2*Math.PI*f*t+ph); }
function noise(){ return Math.random()*2-1; }
function lpf(samples, cutoff){ const out=new Float32Array(samples.length); const rc=1/(2*Math.PI*cutoff), dt=1/SR, alpha=dt/(rc+dt); out[0]=samples[0]; for(let i=1;i<samples.length;i++) out[i]=out[i-1]+alpha*(samples[i]-out[i-1]); return out; }
function veenaNote(freq, dur, gain=0.12){ const len=Math.floor(dur*SR), s=new Float32Array(len), e=envPluck(len,1.6);
  for(let i=0;i<len;i++){ const t=i/SR; let v=sine(freq,t)*0.55 + sine(freq*2,t)*0.22 + sine(freq*3,t)*0.12 + sine(freq*4.02,t)*0.06 + sine(freq*0.5,t)*0.05;
    const pluck = Math.exp(-t*18)*noise()*0.08; s[i]=(v+pluck)*e[i]*gain; } return s; }
function fluteNote(freq, dur, gain=0.09){ const len=Math.floor(dur*SR), s=new Float32Array(len), e=envPad(len,0.18,0.35);
  for(let i=0;i<len;i++){ const t=i/SR; const vib=1+0.0035*Math.sin(2*Math.PI*5.2*t);
    let v=sine(freq*vib,t)*0.6 + sine(freq*2*vib,t)*0.18 + sine(freq*3*vib,t)*0.07; const breath=(noise()*0.03)*Math.exp(-t*1.2); s[i]=(v+breath)*e[i]*gain; } return lpf(s, 3200); }
function nadaswaramNote(freq, dur, gain=0.08){ const len=Math.floor(dur*SR), s=new Float32Array(len), e=envPad(len,0.08,0.25);
  for(let i=0;i<len;i++){ const t=i/SR; const vib=1+0.006*Math.sin(2*Math.PI*6.5*t); let v=0; [1,2,3,4,5,6].forEach((h,idx)=>{ v += sine(freq*h*vib,t)*(idx===0?0.45:0.18/idx); }); v+=noise()*0.01; s[i]=v*e[i]*gain; } return lpf(s,3800); }
function mridangamHit(dur, lowFreq, gain=0.12){ const len=Math.floor(dur*SR), s=new Float32Array(len), e=envPluck(len,8);
  for(let i=0;i<len;i++){ const t=i/SR; const f=lowFreq*Math.exp(-t*12)+lowFreq*0.7; let v=sine(f,t)*0.7 + sine(f*2.1,t)*0.2 + noise()*Math.exp(-t*30)*0.25; s[i]=v*e[i]*gain; } return lpf(s,1800); }
function bellHit(dur, freq, gain=0.08){ const len=Math.floor(dur*SR), s=new Float32Array(len);
  for(let i=0;i<len;i++){ const t=i/SR; const e=Math.exp(-t*1.4); let v=sine(freq,t)*0.5 + sine(freq*2.4,t)*0.22 + sine(freq*3.9,t)*0.12 + sine(freq*5.2,t)*0.08; s[i]=v*e*gain; } return s; }
function tanpuraDrone(freqs, dur, gain=0.06){ const len=Math.floor(dur*SR), s=new Float32Array(len);
  for(let i=0;i<len;i++){ const t=i/SR; let v=0; freqs.forEach((f,idx)=>{ v += (sine(f,t)+sine(f*2,t)*0.15+sine(f*3,t)*0.05)*(1-idx*0.15); }); v *= 0.9 + 0.1*Math.sin(2*Math.PI*0.12*t); s[i]=v*gain; }
  const e=envPad(len,2.5,2.5); for(let i=0;i<len;i++) s[i]*=e[i]; return s; }
function normalize(samples, peak=0.92){ let m=0; for(let i=0;i<samples.length;i++) m=Math.max(m,Math.abs(samples[i])); if(m<1e-6) return samples; const g=peak/m; for(let i=0;i<samples.length;i++) samples[i]*=g; return samples; }
function makeIntro(){ const dur=72, len=Math.floor(dur*SR), out=new Float32Array(len);
  mix(out, tanpuraDrone([130.81,196.0,261.63], dur, 0.045), 0);
  [4.5,18,33,48,60].forEach(t=>mix(out, bellHit(6,720,0.06), Math.floor(t*SR)));
  [10,26,42,56].forEach(t=>mix(out, bellHit(4.5,540,0.04), Math.floor(t*SR)));
  const nScale=[196,220,246.94,261.63,293.66,329.63,349.23,392]; const phrase=[0,2,4,5,4,2,0,1,3,4,6,7,6,4,2,0];
  let t=8; phrase.forEach((idx,i)=>{ mix(out, nadaswaramNote(nScale[idx], i%4===3?2.6:1.6, 0.055), Math.floor(t*SR)); t += (i%4===3?2.8:1.8); });
  let t2=38; const rev=phrase.slice().reverse(); rev.forEach((idx,i)=>{ mix(out, nadaswaramNote(nScale[idx], i%4===3?2.4:1.5, 0.05), Math.floor(t2*SR)); t2 += (i%4===3?2.6:1.7); });
  const fScale=[392,440,493.88,523.25,587.33,659.25]; [12,20,28,44,52,62].forEach((tt,i)=>mix(out, fluteNote(fScale[i%fScale.length], 2.8, 0.045), Math.floor(tt*SR)));
  for(let beat=6; beat<dur-4; beat+=2.0){ mix(out, mridangamHit(0.5,110,0.045), Math.floor(beat*SR)); if((Math.round(beat*10)%40)===0) mix(out, mridangamHit(0.35,180,0.03), Math.floor((beat+0.5)*SR)); }
  for(let i=0;i<len;i++) out[i]+=noise()*0.0035; return normalize(out,0.9); }
function makeMenu(){ const dur=96, len=Math.floor(dur*SR), out=new Float32Array(len);
  mix(out, tanpuraDrone([146.83,220.0,293.66], dur, 0.05), 0);
  const vScale=[293.66,329.63,349.23,392.0,440.0,493.88,523.25,587.33]; const seq=[0,2,4,5,4,2,0,3,4,6,7,6,4,2,0,1,3,5,4,2,0,2,4,3];
  let t=2.5; for(let rep=0; rep<4; rep++){ seq.forEach((idx,i)=>{ mix(out, veenaNote(vScale[idx]*(rep%2===1 && i>16?2:1), 1.8, 0.06), Math.floor(t*SR)); t += 1.5; }); }
  const fScale=[587.33,659.25,698.46,783.99,880.0,987.77]; [8,16,24,40,56,72,88].forEach((tt,i)=>mix(out, fluteNote(fScale[i%fScale.length], 3.2, 0.04), Math.floor(tt*SR)));
  for(let beat=4; beat<dur-3; beat+=1.5){ mix(out, mridangamHit(0.45,120,0.035), Math.floor(beat*SR)); if(Math.abs((beat%3)-1.5)<0.01) mix(out, mridangamHit(0.3,200,0.022), Math.floor((beat+0.5)*SR)); }
  [18,45,78].forEach(tt=>mix(out, bellHit(5,660,0.03), Math.floor(tt*SR)));
  for(let i=0;i<len;i++) out[i]+=noise()*0.0025; return normalize(out,0.88); }
const base='unity/Assets/_Project/Resources/Audio/Music';
writeWav(path.join(base,'bgm_intro_cinematic.wav'), makeIntro());
writeWav(path.join(base,'bgm_main_menu.wav'), makeMenu());
console.log('done');
