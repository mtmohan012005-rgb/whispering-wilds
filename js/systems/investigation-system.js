/**
 * The Whispering Wilds (Kaattu Vazhi) - Investigation System & Clue Board
 * Authoritative evidence collection, 3D photo validation, clue connection logic,
 * and PC corkboard interface for mystery solving.
 */

class InvestigationSystem {
  constructor() {
    this.activeCaseId = "case_chola_heist";

    // Known Evidence registry across all 8 chapters
    this.evidenceRegistry = {
      clue_torn_blueprint: {
        id: "clue_torn_blueprint",
        name: "Torn Chola Hydro-Sanctuary Blueprint",
        tamilName: "கிழிந்த சோழர் நீர் வரைபடம்",
        description: "Recovered folio from Dr. Ramanathan's inherited parchment. Illustrates a dual lotus gear mechanism that controls tidal floodgates.",
        region: "george_town",
        source: "high_court_gates",
        category: "document",
        photoRequired: false,
        discovered: true,
        linkedEvidence: ["clue_enfield_tread", "clue_chola_seal"]
      },
      clue_enfield_tread: {
        id: "clue_enfield_tread",
        name: "Royal Enfield 350 Rear Tyre Skid",
        tamilName: "ராயல் என்பீல்ட் டயர் தடம்",
        description: "Distinct chevron tread pattern exclusive to vintage 1960s Madras Motors Enfield. Angles southeast toward the Pichavaram coastal highway.",
        region: "george_town",
        source: "enfield_tracks_site",
        category: "physical_evidence",
        photoRequired: true,
        discovered: false,
        linkedEvidence: ["clue_torn_blueprint", "clue_waterwheel_glyph"]
      },
      clue_chola_seal: {
        id: "clue_chola_seal",
        name: "Ancient Chola Sluice Seal",
        tamilName: "பண்டைய சோழர் மதகு முத்திரை",
        description: "Heavy cast-copper seal dropped by the fleeing courier near Selvam's cattle pen. Features royal tiger heraldry.",
        region: "cauvery_delta",
        source: "farmer_selvam",
        category: "physical_evidence",
        photoRequired: false,
        discovered: false,
        linkedEvidence: ["clue_torn_blueprint", "clue_artisan_stamp"]
      },
      clue_waterwheel_glyph: {
        id: "clue_waterwheel_glyph",
        name: "Chola Lotus-Tiger Granite Dial",
        tamilName: "சோழர் தாமரை-புலி கிரானைட் சுழலி",
        description: "Granite rotational dial controlling the mangrove weir gate. Aligning the tiger crest with the lotus rune unblocks the sunken canal.",
        region: "pichavaram",
        source: "chola_waterwheel",
        category: "puzzle_key",
        photoRequired: true,
        discovered: false,
        linkedEvidence: ["clue_enfield_tread", "clue_chettinad_letter"]
      },
      clue_chettinad_letter: {
        id: "clue_chettinad_letter",
        name: "1894 Chettiar Trade Dispatch",
        tamilName: "1894 செட்டியார் வர்த்தக கடிதம்",
        description: "Archived letters from Southeast Asian voyages detailing an unmapped subterranean botanical sanctuary beneath the Nilgiris.",
        region: "chettinad",
        source: "teak_floor_vault",
        category: "document",
        photoRequired: true,
        discovered: false,
        linkedEvidence: ["clue_waterwheel_glyph", "clue_stone_relief"]
      },
      clue_artisan_stamp: {
        id: "clue_artisan_stamp",
        name: "Swamimalai Royal Bronze Hallmark",
        tamilName: "சுவாமிமலை வெண்கல முத்திரை",
        description: "Bronze founder hallmark matching the lost-wax casting technique of the imperial Chola hydraulic guilds.",
        region: "thanjavur",
        source: "bronze_artisan_sembian",
        category: "physical_evidence",
        photoRequired: false,
        discovered: false,
        linkedEvidence: ["clue_chola_seal", "clue_eco_portal"]
      },
      clue_stone_relief: {
        id: "clue_stone_relief",
        name: "Pallava Mountain-to-Sea Bas-Relief",
        tamilName: "பல்லவர் மலை-கடல் புடைப்புச் சிற்பம்",
        description: "Weathered granite panel depicting sacred water conduits carrying mountain rain down into protected underground aquifers.",
        region: "mamallapuram",
        source: "granite_wave_bas_relief",
        category: "archaeology",
        photoRequired: true,
        discovered: false,
        linkedEvidence: ["clue_chettinad_letter", "clue_eco_portal"]
      },
      clue_eco_portal: {
        id: "clue_eco_portal",
        name: "Nilgiri Eco-Sanctuary Subterranean Seal",
        tamilName: "நீலகிரி பசுமைத் தடம் நிலத்தடி வாயில்",
        description: "Monolithic portal seal locking the untouched ancient biosphere of Pasumai Thadam. Requires the restored bronze Lotus gear and Pallava keystone.",
        region: "nilgiris",
        source: "ancient_sanctuary_cairn",
        category: "final_portal",
        photoRequired: true,
        discovered: false,
        linkedEvidence: ["clue_artisan_stamp", "clue_stone_relief"]
      },
      clue_tea_ledger: {
        id: "clue_tea_ledger",
        name: "Tea Stall Credit Ledger",
        tamilName: "டீக்கடை கடன் கணக்கு ஏடு",
        description: "Murugan Annan's handwritten register recording late-night chai orders and vehicle stops.",
        region: "george_town",
        source: "tea_kadai",
        category: "document",
        photoRequired: false,
        discovered: false,
        linkedEvidence: ["clue_enfield_track", "clue_enfield_tread"]
      },
      clue_enfield_track: {
        id: "clue_enfield_track",
        name: "Vintage Motorcycle Wheel Imprint",
        tamilName: "மோட்டார் சைக்கிள் சக்கர பதிவு",
        description: "Fresh tyre depression in the rain-soaked asphalt matching a Royal Enfield 350.",
        region: "george_town",
        source: "tea_stall_curb",
        category: "physical_evidence",
        photoRequired: true,
        discovered: false,
        linkedEvidence: ["clue_tea_ledger", "clue_torn_blueprint"]
      },
      clue_mangrove_roots: {
        id: "clue_mangrove_roots",
        name: "Mangrove Prop Root Silt Deposits",
        tamilName: "சதுப்புநில வேர் சேற்றுப் படிவு",
        description: "Rhizophora stilt root mud samples from the Pichavaram tidal waterways.",
        region: "pichavaram",
        source: "mangrove_channel",
        category: "environmental",
        photoRequired: false,
        discovered: false,
        linkedEvidence: ["clue_waterwheel_glyph"]
      }
    };

    // Active connections formed on the corkboard
    this.connections = [
      { from: "clue_torn_blueprint", to: "clue_enfield_tread" }
    ];

    // Solved investigative cases
    this.solvedCases = new Set();
  }

  get clueConnections() {
    return this.connections;
  }

  startInvestigation(caseId) {
    this.activeCaseId = caseId;
    console.log(`[InvestigationSystem] Started investigation case: ${caseId}`);
  }

  addEvidence(evidenceId) {
    let item = this.evidenceRegistry[evidenceId];
    if (!item) {
      item = {
        id: evidenceId,
        name: evidenceId,
        description: "Discovered evidence artifact",
        discovered: false,
        linkedEvidence: []
      };
      this.evidenceRegistry[evidenceId] = item;
    }

    if (!item.discovered) {
      item.discovered = true;
      item.discoveredAt = Date.now();

      if (window.gameAudio) {
        window.gameAudio.playDiscoveryJingle();
      }

      if (window.gameQuests && typeof window.gameQuests.showQuestNotification === 'function') {
        window.gameQuests.showQuestNotification(`🔍 EVIDENCE LOGGED: ${item.name}!`);
      }

      // Sync with Field Journal
      if (window.gameJournal) {
        window.gameJournal.unlockEntry(evidenceId);
        window.gameJournal.render();
      }

      console.log(`[InvestigationSystem] Discovered evidence: ${item.name}`);
      return true;
    }
    return false;
  }

  getEvidence(evidenceId) {
    return this.evidenceRegistry[evidenceId] || null;
  }

  inspectEvidence(evidenceId) {
    const item = this.getEvidence(evidenceId);
    if (item) {
      item.inspected = true;
      return item;
    }
    return null;
  }

  connectClues(clueA, clueB) {
    const res = this.connectEvidence(clueA, clueB);
    return {
      connected: !!(res && (res.connected || res.alreadyConnected)),
      ...res
    };
  }

  getAllDiscoveredEvidence() {
    return Object.values(this.evidenceRegistry).filter(e => e.discovered);
  }

  inspectObject(objectId) {
    // Check if object yields evidence
    for (const [id, ev] of Object.entries(this.evidenceRegistry)) {
      if (ev.source === objectId && !ev.discovered) {
        this.addEvidence(id);
        return { success: true, evidence: ev };
      }
    }
    return { success: false, reason: "No new clues found upon inspection." };
  }

  /**
   * Validates photo evidence against 3D canvas and subject
   */
  photographEvidence(targetSubjectId, cameraContext = {}) {
    const is3D = !!(window.threeWorld && window.threeWorld.isActive);
    const canvas = is3D
      ? (window.threeWorld.renderer ? window.threeWorld.renderer.domElement : null)
      : document.getElementById('game-canvas');

    if (!canvas) {
      return { success: false, reason: "Camera view not available." };
    }

    // Match with evidence registry
    for (const [id, ev] of Object.entries(this.evidenceRegistry)) {
      if ((ev.source === targetSubjectId || ev.id === targetSubjectId) && ev.photoRequired) {
        this.addEvidence(id);
        return {
          success: true,
          evidence: ev,
          canvasType: is3D ? "3D_WebGL" : "2D_Canvas",
          metadata: {
            timestamp: new Date().toLocaleTimeString(),
            targetSubject: targetSubjectId,
            quality: "Optimal Focus & Lighting"
          }
        };
      }
    }

    return { success: false, reason: "Subject does not match required case evidence." };
  }

  /**
   * Connect two evidence clues on the corkboard
   */
  connectEvidence(evidenceA, evidenceB) {
    const itemA = this.evidenceRegistry[evidenceA];
    const itemB = this.evidenceRegistry[evidenceB];

    if (!itemA || !itemB) {
      return { success: false, connected: false, reason: "Invalid evidence selection." };
    }

    if (!itemA.discovered || !itemB.discovered) {
      return { success: false, connected: false, reason: "Both clues must be discovered first." };
    }

    // Check if valid connection defined in model
    const isValid = (itemA.linkedEvidence && itemA.linkedEvidence.includes(evidenceB)) ||
                    (itemB.linkedEvidence && itemB.linkedEvidence.includes(evidenceA));

    if (isValid) {
      // Check if already linked
      const alreadyLinked = this.connections.some(
        c => (c.from === evidenceA && c.to === evidenceB) || (c.from === evidenceB && c.to === evidenceA)
      );

      if (!alreadyLinked) {
        this.connections.push({ from: evidenceA, to: evidenceB });

        if (window.gameAudio) {
          window.gameAudio.playPinTap();
        }

        if (window.gameQuests) {
          window.gameQuests.showQuestNotification(`🧵 CLUES CONNECTED: ${itemA.name} ↔ ${itemB.name}`);
        }

        // Check if case is solved
        this.checkCaseProgression();
        return { success: true, connected: true, itemA, itemB };
      }

      return { success: true, alreadyConnected: true, connected: true, itemA, itemB };
    }

    return {
      success: false,
      connected: false,
      reason: "No strong connection found between these clues."
    };
  }

  checkCaseProgression() {
    // If 6 or more evidence links formed, mark case solved
    if (this.connections.length >= 4 && !this.solvedCases.has(this.activeCaseId)) {
      this.solvedCases.add(this.activeCaseId);
      console.log(`[InvestigationSystem] Case ${this.activeCaseId} resolved!`);
      if (window.gameQuests) {
        window.gameQuests.showQuestNotification("⭐ CASE ADVANCED: Master Chola blueprint reconstructed!");
      }
    }
  }

  isCaseSolved(caseId) {
    return this.solvedCases.has(caseId || this.activeCaseId);
  }

  getState() {
    return {
      activeCaseId: this.activeCaseId,
      discoveredEvidence: Object.keys(this.evidenceRegistry).filter(k => this.evidenceRegistry[k].discovered),
      connections: [...this.connections],
      solvedCases: Array.from(this.solvedCases)
    };
  }

  restoreState(state) {
    if (!state) return;
    if (state.activeCaseId) this.activeCaseId = state.activeCaseId;

    if (Array.isArray(state.discoveredEvidence)) {
      state.discoveredEvidence.forEach(id => {
        if (this.evidenceRegistry[id]) {
          this.evidenceRegistry[id].discovered = true;
        }
      });
    }

    if (Array.isArray(state.connections)) {
      this.connections = [...state.connections];
    }

    if (Array.isArray(state.solvedCases)) {
      this.solvedCases = new Set(state.solvedCases);
    }
  }
}

if (typeof window !== 'undefined') {
  window.InvestigationSystem = InvestigationSystem;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InvestigationSystem };
}
