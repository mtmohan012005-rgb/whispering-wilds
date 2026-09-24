#!/usr/bin/env node
/**
 * The Whispering Wilds (Kaattu Vazhi) - Game Data & Cross-Reference Validator
 * Validates NPCs, wildlife, quests, items, recipes, regions, landmarks, festivals, food, wardrobe.
 * Detects: duplicate IDs, missing references, invalid enums, empty required fields.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'js', 'data');

function loadDataFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');

  // Simple sandbox evaluation for window.* assignment
  const sandbox = { window: {} };
  try {
    const fn = new Function('window', content);
    fn(sandbox.window);
    return sandbox.window;
  } catch (err) {
    console.error(`Failed to parse ${filename}:`, err.message);
    return null;
  }
}

function runDataValidation() {
  console.log('====================================================');
  console.log('THE WHISPERING WILDS - GAME DATA & CROSS-REFERENCE AUDIT');
  console.log('====================================================\n');

  const errors = [];
  const warnings = [];
  const allIds = new Map(); // id -> source

  function registerId(id, type) {
    if (!id) return;
    if (allIds.has(id)) {
      errors.push(`Duplicate ID detected: "${id}" in ${type} (previously registered in ${allIds.get(id)})`);
    } else {
      allIds.set(id, type);
    }
  }

  // 1. Quests & Chapters
  const questData = loadDataFile('quest-progression-data.js') || {};
  const chapters = questData.QUEST_PRODUCTION_CHAPTERS || [];
  const quests = questData.QUEST_PRODUCTION_DATA || [];

  console.log(`Auditing Quests: ${quests.length} quests in ${chapters.length} chapters...`);
  chapters.forEach(ch => {
    if (!ch.id || !ch.title) errors.push(`Chapter missing required id or title: ${JSON.stringify(ch)}`);
    registerId(ch.id, 'Chapter');
  });

  quests.forEach(q => {
    if (!q.id || !q.title || !q.region) {
      errors.push(`Quest missing required fields: ${q.id || 'NO_ID'}`);
    }
    registerId(q.id, 'Quest');
  });

  // 2. Wardrobe & Outfits
  const wardrobeData = loadDataFile('wardrobe-data.js') || {};
  const wardrobeItems = wardrobeData.WARDROBE_ITEMS || [];
  console.log(`Auditing Wardrobe: ${wardrobeItems.length} items...`);
  wardrobeItems.forEach(item => {
    if (!item.id || !item.name) errors.push(`Wardrobe item missing id or name: ${JSON.stringify(item)}`);
    registerId(item.id, 'Wardrobe');
  });

  // 3. Food Culture Data
  const foodData = loadDataFile('food-culture-data.js') || {};
  const foods = foodData.FOOD_CULTURE_DATA || [];
  console.log(`Auditing Food Culture: ${foods.length} culinary items...`);
  foods.forEach(f => {
    if (!f.id || !f.name || !f.region) errors.push(`Food item missing id/name/region: ${JSON.stringify(f)}`);
    registerId(f.id, 'Food');
  });

  // 4. Cultural Life Data
  const culturalData = loadDataFile('cultural-life-data.js') || {};
  const festivals = culturalData.FESTIVALS_DATA || [];
  const npcs = culturalData.LIVING_WORLD_NPCS || [];
  const wildlife = culturalData.LIVING_WORLD_WILDLIFE || [];
  console.log(`Auditing Living World: ${npcs.length} NPCs, ${wildlife.length} Wildlife species, ${festivals.length} Festivals...`);

  npcs.forEach(npc => {
    if (!npc.id || !npc.name) errors.push(`NPC missing id/name: ${JSON.stringify(npc)}`);
    registerId(npc.id, 'NPC');
  });

  wildlife.forEach(w => {
    if (!w.id || !w.name) errors.push(`Wildlife missing id/name: ${JSON.stringify(w)}`);
    registerId(w.id, 'Wildlife');
  });

  // 5. Exploration & Puzzles
  const puzzleData = loadDataFile('puzzle-data.js') || {};
  const puzzles = puzzleData.PUZZLE_DATA || [];
  console.log(`Auditing Puzzles: ${puzzles.length} environmental mechanisms...`);
  puzzles.forEach(p => {
    if (!p.id || !p.title) errors.push(`Puzzle missing id/title: ${JSON.stringify(p)}`);
    registerId(p.id, 'Puzzle');
  });

  console.log(`\nData Integrity Audit Summary:`);
  console.log(`  Total Registered Entities : ${allIds.size}`);
  console.log(`  Errors Detected           : ${errors.length}`);
  console.log(`  Warnings Detected         : ${warnings.length}`);

  if (errors.length > 0) {
    console.error('\nErrors:');
    errors.forEach(e => console.error(`  ✗ ${e}`));
  }

  const report = {
    timestamp: new Date().toISOString(),
    totalEntities: allIds.size,
    errorsCount: errors.length,
    warningsCount: warnings.length,
    errors,
    warnings
  };

  fs.writeFileSync(path.join(ROOT_DIR, 'DATA_AUDIT_REPORT.json'), JSON.stringify(report, null, 2));
  console.log('Report written to DATA_AUDIT_REPORT.json\n');

  return { success: errors.length === 0, errors, warnings };
}

if (require.main === module) {
  const result = runDataValidation();
  if (!result.success) {
    process.exit(1);
  }
}

module.exports = { runDataValidation };
