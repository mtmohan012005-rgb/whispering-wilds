/**
 * Automated QA Test: Regional Temperature Model & Clothing Insulation
 * Project: The Whispering Wilds (Kaattu Vazhi)
 */

window.testTemperatureSuite = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[QA TEMPERATURE] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  try {
    const tempSys = window.temperatureSystem || new window.TemperatureSystem();

    // 1. Regional Baselines: Nilgiris vs Chettinad vs Chennai
    const tempNilgiris = tempSys.calculateAmbientTemperature({
      region: 'nilgiris',
      timeOfDay: 12.0,
      weather: 'clear',
      elevation: 1800
    });
    const tempChettinad = tempSys.calculateAmbientTemperature({
      region: 'chettinad',
      timeOfDay: 12.0,
      weather: 'clear',
      elevation: 100
    });
    const tempChennai = tempSys.calculateAmbientTemperature({
      region: 'chennai',
      timeOfDay: 12.0,
      weather: 'clear',
      elevation: 10
    });

    const regionalCoherence = (tempNilgiris < tempChennai) && (tempChennai < tempChettinad || Math.abs(tempChettinad - tempChennai) < 5);
    log('Regional Temperature Differentiation', regionalCoherence,
      `Nilgiris: ${tempNilgiris.toFixed(1)}°C, Chennai: ${tempChennai.toFixed(1)}°C, Chettinad: ${tempChettinad.toFixed(1)}°C`);

    // 2. Elevation Lapse Rate (Higher altitude -> cooler temperature)
    const seaLevel = tempSys.calculateAmbientTemperature({ region: 'nilgiris', timeOfDay: 12.0, weather: 'clear', elevation: 0 });
    const mountainPeak = tempSys.calculateAmbientTemperature({ region: 'nilgiris', timeOfDay: 12.0, weather: 'clear', elevation: 2000 });
    const lapseRateWorks = (mountainPeak < seaLevel) && (seaLevel - mountainPeak >= 15);
    log('Elevation Lapse Rate Model', lapseRateWorks,
      `Sea Level: ${seaLevel.toFixed(1)}°C vs 2000m Peak: ${mountainPeak.toFixed(1)}°C (Δ: ${(seaLevel - mountainPeak).toFixed(1)}°C)`);

    // 3. Diurnal Temperature Curve (Night vs Noon)
    const tempNoon = tempSys.calculateAmbientTemperature({ region: 'thanjavur', timeOfDay: 14.0, weather: 'clear', elevation: 50 });
    const tempMidnight = tempSys.calculateAmbientTemperature({ region: 'thanjavur', timeOfDay: 3.0, weather: 'clear', elevation: 50 });
    const diurnalWorks = tempNoon > tempMidnight;
    log('Diurnal Day/Night Cycle Curve', diurnalWorks,
      `Noon (14:00): ${tempNoon.toFixed(1)}°C vs Night (03:00): ${tempMidnight.toFixed(1)}°C`);

    // 4. Weather Impact (Rain drops temperature)
    const clearWeather = tempSys.calculateAmbientTemperature({ region: 'mamallapuram', timeOfDay: 12.0, weather: 'clear', elevation: 5 });
    const stormWeather = tempSys.calculateAmbientTemperature({ region: 'mamallapuram', timeOfDay: 12.0, weather: 'storm', elevation: 5 });
    const weatherCooling = stormWeather < clearWeather;
    log('Weather Storm Cooling Factor', weatherCooling,
      `Clear: ${clearWeather.toFixed(1)}°C vs Storm: ${stormWeather.toFixed(1)}°C`);

    // 5. Clothing Insulation & Protection (Nilgiri Warmwear vs Veshti)
    const warmwearColdLoss = tempSys.calculateWarmthDecayRate ?
      tempSys.calculateWarmthDecayRate(8.0, 'nilgiri_warmwear', false) :
      (tempSys.data.outfits.nilgiri_warmwear.coldInsulation);
    const veshtiColdLoss = tempSys.calculateWarmthDecayRate ?
      tempSys.calculateWarmthDecayRate(8.0, 'everyday_veshti', false) :
      (tempSys.data.outfits.everyday_veshti.coldInsulation);

    const warmwearProtectsCold = warmwearColdLoss > veshtiColdLoss || (typeof warmwearColdLoss === 'number' && warmwearColdLoss >= 0.7);
    log('Clothing Insulation Differentiation', warmwearProtectsCold,
      `Nilgiri Warmwear Cold Insulation: ${tempSys.data.outfits.nilgiri_warmwear.coldInsulation}, Everyday Veshti: ${tempSys.data.outfits.everyday_veshti.coldInsulation}`);

    return { passed: results.every(r => r.passed), results };
  } catch (err) {
    log('Temperature Suite Error', false, err.message);
    return { passed: false, results };
  }
};
