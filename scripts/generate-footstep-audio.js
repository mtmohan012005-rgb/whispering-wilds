const fs = require('fs');
const path = require('path');

const footstepsDir = path.resolve(__dirname, '..', 'unity/Assets/_Project/Audio/Footsteps');
if (!fs.existsSync(footstepsDir)) {
  fs.mkdirSync(footstepsDir, { recursive: true });
}

function generateWav(filePath, duration, frequency, volume, type = 'sine') {
  const sampleRate = 22050;
  const numSamples = Math.floor(duration * sampleRate);
  const dataSize = numSamples * 2; // 16-bit mono
  const fileSize = 36 + dataSize;
  const buffer = Buffer.alloc(44 + dataSize);
  let offset = 0;

  // RIFF header
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeInt32LE(fileSize, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;

  // fmt chunk
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeInt32LE(16, offset); offset += 4; // chunk length
  buffer.writeInt16LE(1, offset); offset += 2;  // PCM
  buffer.writeInt16LE(1, offset); offset += 2;  // Mono
  buffer.writeInt32LE(sampleRate, offset); offset += 4;
  buffer.writeInt32LE(sampleRate * 2, offset); offset += 4; // Byte rate
  buffer.writeInt16LE(2, offset); offset += 2;  // Block align
  buffer.writeInt16LE(16, offset); offset += 2; // Bits per sample

  // data chunk
  buffer.write('data', offset); offset += 4;
  buffer.writeInt32LE(dataSize, offset); offset += 4;

  // Synthesis
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let envelope = 1.0;
    if (t < 0.02) envelope = t / 0.02;
    else if (t > duration - 0.02) envelope = (duration - t) / 0.02;

    let sample = 0;
    if (type === 'mud') {
      // Squelchy low thump with harmonics
      sample = (Math.sin(2 * Math.PI * frequency * t) * 0.7 +
                Math.sin(2 * Math.PI * (frequency * 0.5) * t) * 0.3) *
                Math.exp(-t * 18);
    } else if (type === 'grass') {
      // Soft rustle (frequency-modulated band)
      sample = (Math.sin(2 * Math.PI * frequency * t) * 0.5 +
                Math.sin(2 * Math.PI * (frequency * 1.8) * t) * 0.3 +
                Math.sin(2 * Math.PI * (frequency * 2.7) * t) * 0.2) *
                Math.exp(-t * 22);
    } else if (type === 'water') {
      // Liquid splash / bubble
      sample = (Math.sin(2 * Math.PI * (frequency + Math.sin(t * 100) * 80) * t)) *
                Math.exp(-t * 15);
    } else if (type === 'sand') {
      // Crunchy frictional step
      sample = (Math.sin(2 * Math.PI * frequency * t) * 0.6 +
                Math.sin(2 * Math.PI * (frequency * 1.4) * t) * 0.4) *
                Math.exp(-t * 16);
    } else {
      sample = Math.sin(2 * Math.PI * frequency * t);
    }

    sample = sample * volume * envelope;
    sample = Math.max(-1.0, Math.min(1.0, sample));
    const intSample = Math.floor(sample * 32767);
    buffer.writeInt16LE(intSample, offset);
    offset += 2;
  }

  fs.writeFileSync(filePath, buffer);
  console.log(`Generated: ${filePath} (${buffer.length} bytes)`);
}

generateWav(path.join(footstepsDir, 'footstep_mud.wav'), 0.22, 120, 0.45, 'mud');
generateWav(path.join(footstepsDir, 'footstep_grass.wav'), 0.18, 420, 0.35, 'grass');
generateWav(path.join(footstepsDir, 'footstep_water.wav'), 0.25, 550, 0.4, 'water');
generateWav(path.join(footstepsDir, 'footstep_sand.wav'), 0.2, 220, 0.38, 'sand');
