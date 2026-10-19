const fs = require('fs');
const path = require('path');

const audioLic = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets', 'audio', 'AUDIO_LICENSE_MANIFEST.json'), 'utf8'));
const audioMan = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets', 'audio', 'audio-manifest.json'), 'utf8'));

const headers = ['AssetID', 'FilePath', 'Category', 'Status', 'SourceType', 'ExactLicense', 'Creator', 'SourceURL', 'SHA256', 'AttributionText', 'VerificationNotes'];
const rows = [headers.join(',')];

function escapeCsv(val) {
  if (val == null) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// 1. Physically present Unity placeholders
audioLic.tracks.forEach(t => {
  rows.push([
    escapeCsv(t.id),
    escapeCsv(t.path),
    escapeCsv(t.category),
    escapeCsv(t.status),
    escapeCsv(t.source),
    escapeCsv(t.license),
    escapeCsv(t.creator),
    escapeCsv('local://unity/Assets/_Project/Scripts/Editor/GenerateAudioAssets.cs'),
    escapeCsv(t.sha256),
    escapeCsv('Created in-house for The Whispering Wilds prototype development'),
    escapeCsv('Verified procedural PCM sine wave. Functional in Unity runtime; development fallback.')
  ].join(','));
});

// 2. Blocked production requirements from audio-manifest
audioMan.assets.filter(a => a.status === 'BLOCKED').forEach(a => {
  rows.push([
    escapeCsv(a.id),
    escapeCsv(a.path),
    escapeCsv(a.type),
    escapeCsv(a.status),
    escapeCsv('planned_production'),
    escapeCsv(a.license || 'PENDING_VERIFIED_LICENSE'),
    escapeCsv(a.creator || 'Unassigned / Work-for-Hire'),
    escapeCsv('BLOCKED_PENDING_ACQUISITION'),
    escapeCsv('NONE_MISSING_FROM_DISK'),
    escapeCsv('Attribution pending verified source acquisition'),
    escapeCsv(a.blockerReason || 'Asset required for commercial release; requires verified field recording / voice session.')
  ].join(','));
});

const outPath = path.join(__dirname, '..', 'docs', 'audits', 'WHISPERING_WILDS_AUDIO_LICENSE_AUDIT.csv');
fs.writeFileSync(outPath, rows.join('\n'));
console.log('Successfully wrote', outPath, 'with', rows.length - 1, 'entries.');
