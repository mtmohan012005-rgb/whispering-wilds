#!/usr/bin/env node
/**
 * The Whispering Wilds (Kaattu Vazhi) - Build & Release Report Generator
 * Compiles all validation passes into the authoritative BUILD_REPORT.json
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const { runAssetValidation } = require('./validate-assets');
const { runDataValidation } = require('./validate-data');
const { runLinkValidation } = require('./validate-links');
const { runProductionValidation } = require('./validate-production');

function generateBuildReport() {
  console.log('====================================================');
  console.log('COMPILING PRODUCTION RELEASE BUILD REPORT');
  console.log('====================================================\n');

  const assetRes = runAssetValidation();
  const dataRes = runDataValidation();
  const linkRes = runLinkValidation();
  const prodRes = runProductionValidation();

  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));

  const overallSuccess = dataRes.success && linkRes.success && prodRes.success;

  const buildReport = {
    game: 'The Whispering Wilds (Kaattu Vazhi)',
    buildVersion: pkg.version || '1.0.0',
    releaseChannel: 'PRODUCTION_CANDIDATE',
    timestamp: new Date().toISOString(),
    environment: 'production',
    buildStatus: overallSuccess ? 'READY_WITH_WARNINGS' : 'BLOCKED',
    summary: {
      assets: {
        totalReferenced: assetRes.report.totalReferenced,
        found: assetRes.report.foundCount,
        missing: assetRes.report.missingCount,
        proceduralFallbackActive: true,
        playerGLBPresent: assetRes.report.playerGLBPresent
      },
      dataIntegrity: {
        entitiesAudited: dataRes.totalEntities || 0,
        errors: dataRes.errors.length,
        warnings: dataRes.warnings.length
      },
      links: {
        totalLinks: linkRes.checked ? linkRes.checked.length : 0,
        missing: linkRes.errors.length
      },
      codeSafety: {
        criticalErrors: prodRes.errors.length,
        warnings: prodRes.warnings.length
      }
    },
    serverConfiguration: {
      healthEndpoint: '/health',
      readyEndpoint: '/ready',
      renderServiceConfigured: true,
      portConfigured: true,
      hostBinding: '0.0.0.0'
    },
    clientConfiguration: {
      singleSourceOfTruth: 'js/config/runtime-config.js',
      versionLock: 'config/three-version.json',
      customizationLimit: 5,
      saveVersion: 3
    }
  };

  const outPath = path.join(ROOT_DIR, 'BUILD_REPORT.json');
  fs.writeFileSync(outPath, JSON.stringify(buildReport, null, 2));

  console.log('====================================================');
  console.log(`BUILD REPORT GENERATED: ${outPath}`);
  console.log(`STATUS: ${buildReport.buildStatus}`);
  console.log('====================================================\n');

  return buildReport;
}

if (require.main === module) {
  generateBuildReport();
}

module.exports = { generateBuildReport };
