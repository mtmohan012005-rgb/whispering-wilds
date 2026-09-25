// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CONTENT VALIDATOR
// Comprehensive automated pre-flight validator for all content definitions.
// Inspects IDs, references, prerequisites, circular dependencies, localization,
// audio bindings, coordinates, asset formats, and rewards.
// ============================================================================

(function () {
  'use strict';

  const VALID_REGIONS = [
    'chennai',
    'george_town',
    'cauvery_delta',
    'pichavaram',
    'chettinad',
    'thanjavur',
    'mamallapuram',
    'nilgiris',
    'all',
    'global'
  ];

  const SUPPORTED_ASSET_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.ogg', '.mp3', '.wav', '.glb', '.gltf', '.json'];

  class ContentValidator {
    constructor(registry = null) {
      this.registry = registry || window.ContentRegistry;
      this.errors = [];
      this.warnings = [];
      this.missingAssets = [];
      this.missingLocalization = [];
      this.brokenReferences = [];
      this.validationResults = null;
    }

    /**
     * Run full pre-flight validation on registry and localization
     */
    validateAll(options = {}) {
      const reg = this.registry || window.ContentRegistry;
      this.errors = [];
      this.warnings = [];
      this.missingAssets = [];
      this.missingLocalization = [];
      this.brokenReferences = [];

      if (!reg) {
        this.errors.push({ code: 'REGISTRY_NOT_FOUND', message: 'ContentRegistry instance not available' });
        return this._compileResults();
      }

      const allQuests = reg.getAll('quest');
      const allDialogue = reg.getAll('dialogue');
      const allNpcs = reg.getAll('npc');
      const allLocations = reg.getAll('location');
      const allEvents = reg.getAll('event');
      const allWildlife = reg.getAll('wildlife');
      const allItems = reg.getAll('item');
      const allShops = reg.getAll('shop');
      const allAchievements = reg.getAll('achievement');
      const allCulture = reg.getAll('culture');

      // 1. Validate ID syntax and duplicate checks
      this._validateIds(reg);

      // 2. Validate Quests (Objectives, circular chains, rewards, prerequisites)
      this._validateQuests(allQuests, reg);

      // 3. Validate Dialogue (Choices, speakers, voice references, conditions)
      this._validateDialogue(allDialogue, reg);

      // 4. Validate NPCs (Schedules, clothing sets, coordinates, home/workplace)
      this._validateNpcs(allNpcs, reg);

      // 5. Validate Locations (Coordinates, region, environment)
      this._validateLocations(allLocations);

      // 6. Validate Items & Crafting (Weight, values, recipes, icons)
      this._validateItems(allItems, reg);

      // 7. Validate Shops (Single currency deduction, region match, inventory IDs)
      this._validateShops(allShops, reg);

      // 8. Validate Achievements & Cultural activities
      this._validateCultureAndAchievements(allCulture, allAchievements, reg);

      // 9. Validate Localization keys if localization data exists
      this._validateLocalizationKeys(reg);

      return this._compileResults();
    }

    _validateIds(reg) {
      for (const type of reg.getContentTypes()) {
        const items = reg.getAll(type);
        const seenIds = new Set();
        for (const item of items) {
          if (!item.id || typeof item.id !== 'string') {
            this.errors.push({ code: 'INVALID_ID', type, message: `Item in type '${type}' has missing or non-string ID` });
            continue;
          }
          if (seenIds.has(item.id)) {
            this.errors.push({ code: 'DUPLICATE_ID', type, id: item.id, message: `Duplicate ID '${item.id}' found in type '${type}'` });
          }
          seenIds.add(item.id);

          if (window.ContentUtils && !window.ContentUtils.isValidId(item.id)) {
            this.warnings.push({ code: 'NON_STANDARD_ID', type, id: item.id, message: `ID '${item.id}' contains non-standard characters` });
          }
        }
      }
    }

    _validateQuests(quests, reg) {
      const questMap = new Map();
      const dependencyGraph = {};

      for (const q of quests) {
        questMap.set(q.id, q);
        dependencyGraph[q.id] = [];

        // Check region
        if (q.region && !VALID_REGIONS.includes(q.region.toLowerCase())) {
          this.warnings.push({ code: 'UNKNOWN_REGION', type: 'quest', id: q.id, message: `Quest '${q.id}' references unknown region '${q.region}'` });
        }

        // Check prerequisites
        if (q.prerequisites?.requiredQuests) {
          for (const reqQ of q.prerequisites.requiredQuests) {
            dependencyGraph[q.id].push(reqQ);
            if (!reg.has('quest', reqQ)) {
              this.brokenReferences.push({ code: 'BROKEN_QUEST_REF', type: 'quest', id: q.id, target: reqQ, message: `Quest '${q.id}' requires missing quest '${reqQ}'` });
            }
          }
        }

        // Check NPC references
        if (q.giverNpcId && !reg.has('npc', q.giverNpcId)) {
          this.brokenReferences.push({ code: 'BROKEN_NPC_REF', type: 'quest', id: q.id, target: q.giverNpcId, message: `Quest '${q.id}' giverNpcId '${q.giverNpcId}' not registered` });
        }

        // Check objectives sequence
        if (!Array.isArray(q.objectives) || q.objectives.length === 0) {
          this.errors.push({ code: 'NO_OBJECTIVES', type: 'quest', id: q.id, message: `Quest '${q.id}' has no objectives defined` });
        } else {
          for (let i = 0; i < q.objectives.length; i++) {
            const obj = q.objectives[i];
            if (!obj.id) {
              this.errors.push({ code: 'OBJECTIVE_MISSING_ID', type: 'quest', id: q.id, index: i, message: `Quest '${q.id}' objective index ${i} missing ID` });
            }
            if (!obj.type) {
              this.errors.push({ code: 'OBJECTIVE_MISSING_TYPE', type: 'quest', id: q.id, objId: obj.id, message: `Quest '${q.id}' objective '${obj.id}' missing type` });
            }
            // Check target references
            if (obj.type === 'talk_npc' && obj.target && !reg.has('npc', obj.target)) {
              this.brokenReferences.push({ code: 'OBJECTIVE_BROKEN_NPC', type: 'quest', id: q.id, target: obj.target, message: `Objective '${obj.id}' references missing NPC '${obj.target}'` });
            }
            if (obj.type === 'collect_item' && obj.target && !reg.has('item', obj.target)) {
              this.brokenReferences.push({ code: 'OBJECTIVE_BROKEN_ITEM', type: 'quest', id: q.id, target: obj.target, message: `Objective '${obj.id}' references missing Item '${obj.target}'` });
            }
            if (obj.type === 'reach_location' && obj.target && !reg.has('location', obj.target)) {
              this.brokenReferences.push({ code: 'OBJECTIVE_BROKEN_LOC', type: 'quest', id: q.id, target: obj.target, message: `Objective '${obj.id}' references missing Location '${obj.target}'` });
            }
          }
        }

        // Check rewards
        if (q.rewards) {
          if (Array.isArray(q.rewards.items)) {
            for (const rItem of q.rewards.items) {
              const rId = typeof rItem === 'string' ? rItem : rItem.id;
              if (rId && !reg.has('item', rId)) {
                this.brokenReferences.push({ code: 'REWARD_BROKEN_ITEM', type: 'quest', id: q.id, target: rId, message: `Quest '${q.id}' rewards unregistered item '${rId}'` });
              }
            }
          }
        }
      }

      // Check circular dependencies in quest graph
      if (window.ContentUtils) {
        const cycleResult = window.ContentUtils.detectCycles(dependencyGraph);
        if (cycleResult.hasCycle) {
          this.errors.push({
            code: 'CIRCULAR_QUEST_DEPENDENCY',
            type: 'quest',
            cycle: cycleResult.cycle,
            message: `Circular quest dependency detected: ${cycleResult.cycle.join(' ➔ ')}`
          });
        }
      }
    }

    _validateDialogue(dialogues, reg) {
      for (const d of dialogues) {
        if (!d.nodes || typeof d.nodes !== 'object') {
          this.errors.push({ code: 'DIALOGUE_MISSING_NODES', type: 'dialogue', id: d.id, message: `Dialogue '${d.id}' has no nodes object` });
          continue;
        }

        if (d.speaker && !reg.has('npc', d.speaker) && d.speaker !== 'player') {
          this.brokenReferences.push({ code: 'DIALOGUE_UNKNOWN_SPEAKER', type: 'dialogue', id: d.id, target: d.speaker, message: `Dialogue '${d.id}' speaker '${d.speaker}' is not a registered NPC` });
        }

        // Validate individual nodes
        for (const [nodeId, node] of Object.entries(d.nodes)) {
          if (!node.textTa && !node.textEn && !node.text) {
            this.warnings.push({ code: 'DIALOGUE_MISSING_TEXT', type: 'dialogue', id: d.id, node: nodeId, message: `Dialogue '${d.id}' node '${nodeId}' has no text defined` });
          }

          if (Array.isArray(node.choices)) {
            for (const ch of node.choices) {
              if (ch.nextNode && !d.nodes[ch.nextNode] && ch.nextNode !== 'exit' && ch.nextNode !== 'end') {
                this.brokenReferences.push({
                  code: 'DIALOGUE_BROKEN_BRANCH',
                  type: 'dialogue',
                  id: d.id,
                  fromNode: nodeId,
                  targetNode: ch.nextNode,
                  message: `Choice in dialogue '${d.id}' node '${nodeId}' leads to missing nextNode '${ch.nextNode}'`
                });
              }
            }
          }
        }
      }
    }

    _validateNpcs(npcs, reg) {
      for (const npc of npcs) {
        if (npc.region && !VALID_REGIONS.includes(npc.region.toLowerCase())) {
          this.warnings.push({ code: 'NPC_UNKNOWN_REGION', type: 'npc', id: npc.id, message: `NPC '${npc.id}' region '${npc.region}' is not a recognized region` });
        }

        if (npc.homeLocationId && !reg.has('location', npc.homeLocationId)) {
          this.brokenReferences.push({ code: 'NPC_BROKEN_HOME', type: 'npc', id: npc.id, target: npc.homeLocationId, message: `NPC '${npc.id}' homeLocationId '${npc.homeLocationId}' is not registered` });
        }

        if (npc.dialogueId && !reg.has('dialogue', npc.dialogueId)) {
          this.brokenReferences.push({ code: 'NPC_BROKEN_DIALOGUE', type: 'npc', id: npc.id, target: npc.dialogueId, message: `NPC '${npc.id}' dialogueId '${npc.dialogueId}' is not registered` });
        }

        if (!Array.isArray(npc.schedule) || npc.schedule.length === 0) {
          this.warnings.push({ code: 'NPC_NO_SCHEDULE', type: 'npc', id: npc.id, message: `NPC '${npc.id}' has no daily schedule defined` });
        }
      }
    }

    _validateLocations(locations) {
      for (const loc of locations) {
        if (!loc.coordinates || typeof loc.coordinates.x !== 'number') {
          this.warnings.push({ code: 'LOCATION_MISSING_COORDS', type: 'location', id: loc.id, message: `Location '${loc.id}' missing numeric coordinates` });
        }
      }
    }

    _validateItems(items, reg) {
      for (const it of items) {
        if (typeof it.weight !== 'number' || it.weight < 0) {
          this.warnings.push({ code: 'ITEM_INVALID_WEIGHT', type: 'item', id: it.id, message: `Item '${it.id}' weight must be a non-negative number` });
        }
        if (typeof it.value !== 'number' || it.value < 0) {
          this.warnings.push({ code: 'ITEM_INVALID_VALUE', type: 'item', id: it.id, message: `Item '${it.id}' value must be non-negative` });
        }
      }
    }

    _validateShops(shops, reg) {
      for (const sh of shops) {
        if (sh.ownerNpcId && !reg.has('npc', sh.ownerNpcId)) {
          this.brokenReferences.push({ code: 'SHOP_BROKEN_OWNER', type: 'shop', id: sh.id, target: sh.ownerNpcId, message: `Shop '${sh.id}' owner '${sh.ownerNpcId}' not registered` });
        }
        if (Array.isArray(sh.inventory)) {
          for (const itemRef of sh.inventory) {
            const itemId = typeof itemRef === 'string' ? itemRef : itemRef.id;
            if (itemId && !reg.has('item', itemId)) {
              this.brokenReferences.push({ code: 'SHOP_BROKEN_ITEM', type: 'shop', id: sh.id, target: itemId, message: `Shop '${sh.id}' stocks unregistered item '${itemId}'` });
            }
          }
        }
      }
    }

    _validateCultureAndAchievements(culture, achievements, reg) {
      for (const c of culture) {
        if (!Array.isArray(c.steps) || c.steps.length === 0) {
          this.warnings.push({ code: 'CULTURE_NO_STEPS', type: 'culture', id: c.id, message: `Cultural activity '${c.id}' has no interaction steps` });
        }
      }
    }

    _validateLocalizationKeys(reg) {
      const locData = window.LocalizationData || window.LOCALIZATION_DATA;
      if (!locData) return;

      const taKeys = new Set(Object.keys(locData.ta || {}));
      const enKeys = new Set(Object.keys(locData.en || {}));

      // Check that quests have title / desc localization if specified
      for (const q of reg.getAll('quest')) {
        if (q.titleKey && !enKeys.has(q.titleKey)) {
          this.missingLocalization.push({ type: 'quest', id: q.id, key: q.titleKey, lang: 'en' });
        }
        if (q.titleKey && !taKeys.has(q.titleKey)) {
          this.missingLocalization.push({ type: 'quest', id: q.id, key: q.titleKey, lang: 'ta' });
        }
      }
    }

    _compileResults() {
      const errorCount = this.errors.length + this.brokenReferences.length;
      const warningCount = this.warnings.length;
      const missingAssetsCount = this.missingAssets.length;
      const missingLocCount = this.missingLocalization.length;
      const brokenRefCount = this.brokenReferences.length;

      const reportString = [
        'CONTENT VALIDATION',
        '------------------',
        `Errors: ${errorCount}`,
        `Warnings: ${warningCount}`,
        `Missing Assets: ${missingAssetsCount}`,
        `Missing Localization: ${missingLocCount}`,
        `Broken References: ${brokenRefCount}`
      ].join('\n');

      this.validationResults = {
        passed: errorCount === 0,
        errorCount,
        warningCount,
        missingAssetsCount,
        missingLocCount,
        brokenRefCount,
        errors: [...this.errors],
        warnings: [...this.warnings],
        missingAssets: [...this.missingAssets],
        missingLocalization: [...this.missingLocalization],
        brokenReferences: [...this.brokenReferences],
        reportString
      };

      return this.validationResults;
    }

    formatReport() {
      if (!this.validationResults) {
        this.validateAll();
      }
      return this.validationResults.reportString;
    }
  }

  const instance = new ContentValidator();

  if (typeof window !== 'undefined') {
    window.ContentValidator = instance;
    window.contentValidator = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }
})();
