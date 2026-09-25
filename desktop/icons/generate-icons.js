/**
 * Generate desktop icon placeholders (PNG, ICO, ICNS) from base SVG or minimal valid image buffers.
 */

const fs = require('fs');
const path = require('path');

// Minimal 1x1 or 16x16 valid PNG buffer
const minimalPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAV0lEQVR42u3PAQ0AIAwDsPn3r61gBwsrCdpM2d1f9wFwMh9APoB8APkA8gHkA8gHkA8gH0A+gHwA+QDyAeQDyAeQDyAfQD6AfAD5APIB5APIB5APIB9APoB8ALf1Au8gAcZp8S24AAAAAElFTkSuQmCC';
const pngBuffer = Buffer.from(minimalPngBase64, 'base64');

// Minimal ICO header + directory + PNG image payload
function createMinimalIco(pngBuf) {
  const header = Buffer.from([
    0x00, 0x00,             // Reserved
    0x01, 0x00,             // Type: 1 = ICO
    0x01, 0x00,             // Count: 1 image
    0x40,                   // Width: 64
    0x40,                   // Height: 64
    0x00,                   // Color count: 0 (>=8bpp)
    0x00,                   // Reserved
    0x01, 0x00,             // Color planes: 1
    0x20, 0x00,             // Bits per pixel: 32
    ...int32ToBytes(pngBuf.length), // Size of image
    ...int32ToBytes(22)     // Offset of image data (6 header + 16 entry = 22)
  ]);
  return Buffer.concat([header, pngBuf]);
}

function int32ToBytes(val) {
  return [val & 0xFF, (val >> 8) & 0xFF, (val >> 16) & 0xFF, (val >> 24) & 0xFF];
}

const icoBuffer = createMinimalIco(pngBuffer);

const targets = [
  path.join(__dirname, 'windows', 'icon.ico'),
  path.join(__dirname, 'windows', 'icon.png'),
  path.join(__dirname, 'macos', 'icon.icns'),
  path.join(__dirname, 'macos', 'icon.png'),
  path.join(__dirname, 'linux', 'icon.png')
];

for (const t of targets) {
  if (!fs.existsSync(t)) {
    fs.writeFileSync(t, t.endsWith('.ico') ? icoBuffer : pngBuffer);
  }
}

console.log('[Icons] Generated desktop icon assets.');
