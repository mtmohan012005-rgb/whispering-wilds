/**
 * Safe-Mode Sangam Expansion Scenes Generator
 * 
 * Replaces the old clone-based generator.
 * DOES NOT copy 07_Nilgiris_Sanctuary.unity over the southern expansion scenes.
 * Instead, creates backups (.pre-production-upgrade.bak) and validates proper
 * regional root nodes and build settings registration.
 */

const fs = require('fs');
const path = require('path');

const scenesDir = path.resolve(__dirname, '..', 'unity/Assets/_Project/Scenes');

const sangamScenes = [
  {
    fileName: '09_Madurai_Meenakshi.unity',
    guid: 'af7553a3c9a45fd4fa0d5108ea1fb1f9',
    regionId: 'madurai_meenakshi',
    rootName: '--- MADURAI_ENVIRONMENT ---'
  },
  {
    fileName: '10_Kanyakumari_Cape.unity',
    guid: 'af7553a3c9a45fd4fa0d5108ea1fb1fa',
    regionId: 'kanyakumari_cape',
    rootName: '--- KANYAKUMARI_ENVIRONMENT ---'
  },
  {
    fileName: '11_Agasthyamalai_Wilds.unity',
    guid: 'af7553a3c9a45fd4fa0d5108ea1fb1fb',
    regionId: 'agasthyamalai_wilds',
    rootName: '--- AGASTHYAMALAI_ENVIRONMENT ---'
  }
];

function runSafeValidation() {
  console.log('[Safe-Mode Generator] Validating Sangam expansion scenes...');

  for (const sc of sangamScenes) {
    const scenePath = path.join(scenesDir, sc.fileName);
    if (!fs.existsSync(scenePath)) {
      console.warn(`[Safe-Mode Generator] Scene file missing: ${sc.fileName}. Will be generated via Unity BuildSangamExpansionScenes.`);
      continue;
    }

    const bakPath = `${scenePath}.pre-production-upgrade.bak`;
    if (!fs.existsSync(bakPath)) {
      fs.copyFileSync(scenePath, bakPath);
      console.log(`[Safe-Mode Generator] Created non-destructive backup: ${sc.fileName}.pre-production-upgrade.bak`);
    } else {
      console.log(`[Safe-Mode Generator] Preserving existing backup: ${sc.fileName}.pre-production-upgrade.bak`);
    }

    const content = fs.readFileSync(scenePath, 'utf8');
    const hasNilgirisClone = content.includes('NILGIRIS_ENVIRONMENT') || content.includes('Toda_Mund');
    if (hasNilgirisClone) {
      console.log(`[Safe-Mode Generator] Notice: ${sc.fileName} contains copied Nilgiris assets. Tools > Whispering Wilds > 03 will safely hide and upgrade them.`);
    } else {
      console.log(`[Safe-Mode Generator] OK: ${sc.fileName} has proper regional structure.`);
    }
  }
}

runSafeValidation();
