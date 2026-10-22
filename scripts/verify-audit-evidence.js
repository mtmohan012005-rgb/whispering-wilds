#!/usr/bin/env node

/**
 * verify-audit-evidence.js — Automated regression validator for audit evidence integrity.
 *
 * Verifies that:
 * 1. Each suite's total equals passed + failed + skipped in artifacts/whole-game-audit/test-results.json.
 * 2. Component summaries equal the exact sum of their underlying suites.
 * 3. The grand total equals the exact sum of the component summaries (391 total, 389 passed, 0 failed, 2 skipped).
 * 4. WHOLE_GAME_AUDIT.md, release-blockers.md, and FULL_GAME_DEVELOPMENT_ROADMAP.md disclose the exact same
 *    executed (391), passed (389), failed (0), and skipped (2) verification counts.
 *
 * Usage: node scripts/verify-audit-evidence.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const TEST_RESULTS_PATH = path.join(ROOT_DIR, 'artifacts', 'whole-game-audit', 'test-results.json');
const AUDIT_MD_PATH = path.join(ROOT_DIR, 'artifacts', 'whole-game-audit', 'WHOLE_GAME_AUDIT.md');
const RELEASE_BLOCKERS_PATH = path.join(ROOT_DIR, 'artifacts', 'whole-game-audit', 'release-blockers.md');
const ROADMAP_PATH = path.join(ROOT_DIR, 'docs', 'FULL_GAME_DEVELOPMENT_ROADMAP.md');

let checksPassed = 0;
let checksFailed = 0;

function assert(condition, message) {
    if (condition) {
        checksPassed++;
        console.log(`  ✅ PASS: ${message}`);
    } else {
        checksFailed++;
        console.error(`  ❌ FAIL: ${message}`);
    }
}

console.log('='.repeat(70));
console.log('🧪 VERIFY AUDIT EVIDENCE INTEGRITY & CHECK RECONCILIATION');
console.log('='.repeat(70));

// 1. Verify test-results.json existence and schema
assert(fs.existsSync(TEST_RESULTS_PATH), `test-results.json exists at ${TEST_RESULTS_PATH}`);
const jsonRaw = fs.readFileSync(TEST_RESULTS_PATH, 'utf8');
let testResults;
try {
    testResults = JSON.parse(jsonRaw);
    assert(true, 'test-results.json parsed successfully as valid JSON');
} catch (e) {
    assert(false, `test-results.json JSON parse error: ${e.message}`);
    process.exit(1);
}

// 2. Validate Tier 1: Unity In-Engine Suites
console.log('\n--- Group 1: Unity In-Engine Suites Integrity ---');
const unitySuites = testResults.unityInEngineSuites || [];
assert(unitySuites.length === 5, `Unity in-engine suite count is 5 (got ${unitySuites.length})`);

let unityTotal = 0;
let unityPassed = 0;
let unityFailed = 0;
let unitySkipped = 0;

unitySuites.forEach((s) => {
    const sum = (s.passed || 0) + (s.failed || 0) + (s.skipped || 0);
    assert(s.total === sum, `Suite '${s.name}' total (${s.total}) matches passed(${s.passed}) + failed(${s.failed}) + skipped(${s.skipped})`);
    unityTotal += s.total;
    unityPassed += s.passed;
    unityFailed += s.failed;
    unitySkipped += s.skipped;
});

const unitySummary = testResults.summary?.unityInEngineChecks || {};
assert(unitySummary.totalChecks === unityTotal, `Unity summary total (${unitySummary.totalChecks}) matches suite sum (${unityTotal})`);
assert(unitySummary.passed === unityPassed, `Unity summary passed (${unitySummary.passed}) matches suite sum (${unityPassed})`);
assert(unitySummary.failed === unityFailed, `Unity summary failed (${unitySummary.failed}) matches suite sum (${unityFailed})`);
assert(unitySummary.skipped === unitySkipped, `Unity summary skipped (${unitySummary.skipped}) matches suite sum (${unitySkipped})`);
assert(unityTotal === 148, `Unity in-engine total executions equals exactly 148 (got ${unityTotal})`);
assert(unityPassed === 148, `Unity in-engine passed executions equals exactly 148 (got ${unityPassed})`);

// 3. Validate Tier 2: Repository and Launcher Suites
console.log('\n--- Group 2: Repository & Launcher Suites Integrity ---');
const repoSuites = testResults.repositoryAndLauncherSuites || [];
assert(repoSuites.length === 8, `Repository & launcher suite count is 8 (got ${repoSuites.length})`);

let repoTotal = 0;
let repoPassed = 0;
let repoFailed = 0;
let repoSkipped = 0;

repoSuites.forEach((s) => {
    const sum = (s.passed || 0) + (s.failed || 0) + (s.skipped || 0);
    assert(s.total === sum, `Suite '${s.name}' total (${s.total}) matches passed(${s.passed}) + failed(${s.failed}) + skipped(${s.skipped})`);
    repoTotal += s.total;
    repoPassed += s.passed;
    repoFailed += s.failed;
    repoSkipped += s.skipped;
});

const repoSummary = testResults.summary?.repositoryAndLauncherChecks || {};
assert(repoSummary.totalChecks === repoTotal, `Repo summary total (${repoSummary.totalChecks}) matches suite sum (${repoTotal})`);
assert(repoSummary.passed === repoPassed, `Repo summary passed (${repoSummary.passed}) matches suite sum (${repoPassed})`);
assert(repoSummary.failed === repoFailed, `Repo summary failed (${repoSummary.failed}) matches suite sum (${repoFailed})`);
assert(repoSummary.skipped === repoSkipped, `Repo summary skipped (${repoSummary.skipped}) matches suite sum (${repoSkipped})`);
assert(repoTotal === 243, `Repository/launcher total executions equals exactly 243 (got ${repoTotal})`);
assert(repoPassed === 241, `Repository/launcher passed executions equals exactly 241 (got ${repoPassed})`);
assert(repoSkipped === 2, `Repository/launcher skipped executions equals exactly 2 (got ${repoSkipped})`);

// 4. Validate Grand Totals
console.log('\n--- Group 3: Grand Total Reconciliation ---');
const grandSummary = testResults.summary?.grandTotalAutomatedVerifications || {};
const expectedGrandTotal = unityTotal + repoTotal; // 148 + 243 = 391
const expectedGrandPassed = unityPassed + repoPassed; // 148 + 241 = 389
const expectedGrandFailed = unityFailed + repoFailed; // 0
const expectedGrandSkipped = unitySkipped + repoSkipped; // 2

assert(grandSummary.totalChecks === expectedGrandTotal, `Grand total checks (${grandSummary.totalChecks}) matches expected (${expectedGrandTotal})`);
assert(grandSummary.passed === expectedGrandPassed, `Grand total passed (${grandSummary.passed}) matches expected (${expectedGrandPassed})`);
assert(grandSummary.failed === expectedGrandFailed, `Grand total failed (${grandSummary.failed}) matches expected (${expectedGrandFailed})`);
assert(grandSummary.skipped === expectedGrandSkipped, `Grand total skipped (${grandSummary.skipped}) matches expected (${expectedGrandSkipped})`);
assert(expectedGrandTotal === 391, `Grand total is exactly 391 executions (got ${expectedGrandTotal})`);
assert(expectedGrandPassed === 389, `Grand passed is exactly 389 (got ${expectedGrandPassed})`);
assert(expectedGrandSkipped === 2, `Grand skipped is exactly 2 (got ${expectedGrandSkipped})`);

// 5. Validate Markdown Document Disclosures
console.log('\n--- Group 4: Markdown Documentation Disclosures Consistency ---');

function verifyDocNumbers(docPath, docName) {
    assert(fs.existsSync(docPath), `${docName} exists`);
    const content = fs.readFileSync(docPath, 'utf8');

    // Check for reconciled counts
    const has391 = content.includes('391');
    const has389 = content.includes('389');
    const has148 = content.includes('148');
    const has243 = content.includes('243');
    const has241 = content.includes('241');
    const has0Failed = content.includes('0 failed') || content.includes('0 Failed');
    const has2Skipped = content.includes('2 skipped') || content.includes('2 Skipped');

    assert(has391, `${docName} discloses 391 total executions`);
    assert(has389, `${docName} discloses 389 passed executions`);
    assert(has0Failed, `${docName} discloses 0 failed executions`);
    assert(has2Skipped, `${docName} discloses 2 skipped executions`);
    assert(has148, `${docName} discloses 148 historical Unity verifications`);
    assert(has243, `${docName} discloses 243 repository/launcher checks`);
    assert(has241, `${docName} discloses 241 repository/launcher passed checks`);
}

verifyDocNumbers(AUDIT_MD_PATH, 'WHOLE_GAME_AUDIT.md');
verifyDocNumbers(RELEASE_BLOCKERS_PATH, 'release-blockers.md');
verifyDocNumbers(ROADMAP_PATH, 'FULL_GAME_DEVELOPMENT_ROADMAP.md');

// 6. Final Summary
console.log('\n' + '='.repeat(70));
console.log(`Summary: ${checksPassed} passed, ${checksFailed} failed`);
console.log('='.repeat(70));

if (checksFailed > 0) {
    console.error('❌ Evidence integrity verification failed!');
    process.exit(1);
} else {
    console.log('🎉 SUCCESS: All audit evidence counts, suite sums, and document disclosures reconciled 100% cleanly.');
    process.exit(0);
}
