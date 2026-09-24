// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - HARDWARE PROFILES & CLASSIFICATION
// Safe GPU vendor/renderer categorization & heuristic tier classification
// ============================================================================

(function() {
  'use strict';

  const GPU_PATTERNS = {
    VERY_LOW: [
      /intel.*(hd|uhd\s*600|uhd\s*605|hd\s*graphics\s*[2-4]\d{3})/i,
      /microsoft\s*basic/i,
      /llvmpipe/i,
      /swiftshader/i,
      /adreno\s*(3|4|5\d0)/i,
      /mali-4/i,
      /powervr/i
    ],
    LOW: [
      /intel.*(uhd\s*620|uhd\s*630|uhd\s*730|uhd\s*750|iris\s*plus|iris\s*5\d\d)/i,
      /amd.*(radeon\s*r[57]|radeon\s*vega\s*[368]|radeon\s*5[23]0)/i,
      /geforce\s*(gt\s*7\d\d|gt\s*1030|8\d{2}m|9\d{2}m)/i,
      /apple\s*a(1[0-2])/i
    ],
    MEDIUM: [
      /intel.*(iris\s*xe|arc\s*a3\d\d)/i,
      /amd.*(radeon\s*6[68]0m|radeon\s*780m|rx\s*5[56]0|rx\s*570|rx\s*580|rx\s*6400|rx\s*6500)/i,
      /geforce\s*(gtx\s*9[678]0|gtx\s*1050|gtx\s*1060|gtx\s*1650|gtx\s*1660|rtx\s*2050|rtx\s*3050)/i,
      /apple\s*(m1|a1[3-6])/i
    ],
    HIGH: [
      /amd.*(rx\s*5[67]00|rx\s*6600|rx\s*6700|rx\s*7600)/i,
      /geforce\s*(rtx\s*20[67]0|rtx\s*3060|rtx\s*3070|rtx\s*4060)/i,
      /intel.*arc\s*a7\d\d/i,
      /apple\s*(m1\s*pro|m1\s*max|m2|m3)/i
    ],
    ULTRA: [
      /geforce\s*(rtx\s*3080|rtx\s*3090|rtx\s*4070|rtx\s*4080|rtx\s*4090)/i,
      /amd.*(rx\s*6800|rx\s*6900|rx\s*7800|rx\s*7900)/i,
      /apple\s*(m1\s*ultra|m2\s*ultra|m3\s*max)/i
    ]
  };

  /**
   * Classifies hardware capability using available WebGL & browser data
   * @param {Object} hw - detected hardware object
   * @returns {Object} { tier: 'VERY_LOW'|'LOW'|'MEDIUM'|'HIGH'|'ULTRA', score: number, confidence: string }
   */
  function classifyHardware(hw = {}) {
    const cores = hw.cpuCores || 4;
    const mem = hw.deviceMemoryGB || 4;
    const renderer = (hw.gpuRenderer || '').toLowerCase();
    const vendor = (hw.gpuVendor || '').toLowerCase();
    const maxTex = hw.maxTextureSize || 4096;

    // 1. Direct GPU String Matching
    for (const [tier, patterns] of Object.entries(GPU_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(renderer) || pattern.test(vendor)) {
          // Cross-verify with memory/core constraints so we don't overestimate
          if (tier === 'ULTRA' && mem < 8) return { tier: 'HIGH', score: 80, confidence: 'high' };
          if (tier === 'HIGH' && mem < 6) return { tier: 'MEDIUM', score: 65, confidence: 'high' };
          const scores = { VERY_LOW: 20, LOW: 40, MEDIUM: 60, HIGH: 80, ULTRA: 95 };
          return { tier, score: scores[tier], confidence: 'high' };
        }
      }
    }

    // 2. Heuristic Classification if GPU string was unmasked or generic
    let score = 50; // base safe medium

    // Cores weighting (0 - 25 pts)
    if (cores <= 2) score -= 20;
    else if (cores <= 4) score -= 5;
    else if (cores >= 8) score += 15;
    else if (cores >= 6) score += 10;

    // Memory weighting (0 - 30 pts)
    if (mem < 4) score -= 25;
    else if (mem < 6) score -= 10;
    else if (mem >= 16) score += 20;
    else if (mem >= 8) score += 10;

    // Texture size weighting (0 - 25 pts)
    if (maxTex < 4096) score -= 20;
    else if (maxTex >= 16384) score += 15;
    else if (maxTex >= 8192) score += 10;

    // WebGL 2 boost
    if (hw.webglVersion === 2) score += 5;

    score = Math.max(10, Math.min(100, score));

    let tier = 'MEDIUM';
    if (score < 30) tier = 'VERY_LOW';
    else if (score < 50) tier = 'LOW';
    else if (score < 75) tier = 'MEDIUM';
    else if (score < 90) tier = 'HIGH';
    else tier = 'ULTRA';

    return {
      tier,
      score,
      confidence: 'heuristic'
    };
  }

  const profiles = {
    GPU_PATTERNS,
    classifyHardware
  };

  if (typeof window !== 'undefined') {
    window.HardwareProfiles = profiles;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = profiles;
  }
})();
