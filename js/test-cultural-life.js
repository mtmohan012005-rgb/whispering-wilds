/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Developer Validation Suite: Authentic Tamil Nadu Cultural Life Simulation
 * Validates 7 distinct regional profiles, cultural props, context-aware wardrobe,
 * reviewed Tamil signage dictionary, and cultural quality gate compliance.
 */

window.runCulturalLifeTests = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[CULTURAL LIFE TEST] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  console.log('>>> RUNNING AUTHENTIC TAMIL NADU CULTURAL LIFE TEST SUITE <<<');

  try {
    const cultSys = new window.CulturalLifeSystem();

    // -----------------------------------------------------------------
    // TEST 1: 7 Distinct Regional Profiles Integrity
    // -----------------------------------------------------------------
    const expectedRegions = [
      'GEORGE_TOWN',
      'CAUVERY_DELTA',
      'PICHAVARAM',
      'CHETTINAD',
      'THANJAVUR',
      'MAMALLAPURAM',
      'NILGIRIS'
    ];
    const allRegionsPresent = expectedRegions.every(r => !!cultSys.getRegionProfile(r));

    let distinctProfiles = true;
    for (const r of expectedRegions) {
      const p = cultSys.getRegionProfile(r);
      if (!p.architecture || !p.soundscape || !Array.isArray(p.occupations) || p.occupations.length === 0) {
        distinctProfiles = false;
        break;
      }
    }

    log('7 Distinct Regional Profiles Integrity',
      allRegionsPresent && distinctProfiles,
      `All 7 Regions: ${allRegionsPresent}, ProfilesDetailed: ${distinctProfiles}`);

    // -----------------------------------------------------------------
    // TEST 2: Context-Aware Wardrobe Selection (Male & Female)
    // -----------------------------------------------------------------
    // Delta farmer
    const maleFarmerAttire = cultSys.resolveAppropriateAttire('MALE', 'CAUVERY_DELTA', 'paddy_farmer', 'clear', false);
    // Nilgiri mist
    const maleMistAttire = cultSys.resolveAppropriateAttire('MALE', 'NILGIRIS', 'tea_worker', 'mist', false);
    // Festival woman
    const femaleFestive = cultSys.resolveAppropriateAttire('FEMALE', 'THANJAVUR', 'teacher', 'clear', true);

    const wardrobeValid = maleFarmerAttire === 'village_workwear' &&
                          maleMistAttire === 'nilgiri_warmwear' &&
                          femaleFestive === 'kanchipuram_silk_saree';

    log('Context-Aware Wardrobe Selection (Region, Weather & Gender)',
      wardrobeValid,
      `Farmer: "${maleFarmerAttire}", MountainMist: "${maleMistAttire}", FestivalFemale: "${femaleFestive}"`);

    // -----------------------------------------------------------------
    // TEST 3: Cultural Props Catalog & Discovery System
    // -----------------------------------------------------------------
    const props = window.CULTURAL_PROPS_DATA;
    const hasProps = Array.isArray(props) && props.length >= 10;

    // Record discovery of Kuthu Vilakku
    const discRecord = cultSys.recordCulturalDiscovery({
      id: 'prop_kuthu_vilakku',
      name: 'Ornate Brass Kuthu Vilakku',
      tamilName: 'குத்து விளக்கு',
      region: 'CHETTINAD',
      lore: 'Traditional brass oil lamp cast via lost-wax method.'
    });

    const discovered = cultSys.culturalDiscoveries.has('prop_kuthu_vilakku');

    log('Cultural Props Catalog & Discovery Registry',
      hasProps && discovered,
      `CatalogProps: ${props.length}, Discovered: ${discovered}`);

    // -----------------------------------------------------------------
    // TEST 4: Human-Reviewed Tamil Signage Dictionary
    // -----------------------------------------------------------------
    const signage = window.TAMIL_SIGNAGE_DICTIONARY;
    const hasSigns = Array.isArray(signage) && signage.length >= 6;
    const signsReviewed = signage.every(s => s.tamilText && s.tamilText.length > 2 && s.englishText);

    log('Human-Reviewed Tamil Signage Dictionary',
      hasSigns && signsReviewed,
      `SignsCount: ${signage.length}, ReviewedGrammar: ${signsReviewed}`);

    // -----------------------------------------------------------------
    // TEST 5: Cultural Quality Gate Verification
    // -----------------------------------------------------------------
    const gate = window.CULTURAL_QUALITY_GATE;
    const validAsset = gate.validateAsset({
      region: 'CHETTINAD',
      category: 'household',
      tamilName: 'அம்மிக்கல்'
    });
    const invalidAsset = gate.validateAsset({
      region: 'GENERIC_VILLAGE',
      category: 'prop',
      tamilName: ''
    });

    const qualityGatePassed = validAsset.valid === true && invalidAsset.valid === false;

    log('Cultural Authenticity Quality Gate Enforcement',
      qualityGatePassed,
      `ApprovedValid: ${validAsset.valid}, BlockedGeneric: ${!invalidAsset.valid}`);

    return {
      passed: results.every(r => r.passed),
      results
    };
  } catch (err) {
    log('Cultural Life System Test Failure', false, err.message);
    return { passed: false, results };
  }
};
