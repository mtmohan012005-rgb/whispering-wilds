/**
 * ============================================================================
 * THE WHISPERING WILDS — STEP 2 VERIFICATION SUITE
 * ============================================================================
 * 
 * Verifies:
 * 1. PlayerController & Locomotion subsystem scripts
 * 2. Camera controller & orbit physics
 * 3. Interaction system & prompt bindings
 * 4. In-Game Pause Menu & safe state pausing
 * 5. Guided Introduction Tutorial & bilingual prompts
 * 6. Procedural locomotion animation assets & Animator controllers
 * 7. Real character model & PBR textures (Player & NPCs)
 * 8. First Exploration Region (02_Chennai_GeorgeTown.unity) spawn & street layout
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
console.log('======================================================================');
console.log('🎮 THE WHISPERING WILDS — STEP 2 PLAYER CONTROLLER & REGION AUDIT');
console.log('======================================================================\n');

let totalChecks = 0;
let passedChecks = 0;

function check(desc, condition) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ PASS: ${desc}`);
  } else {
    console.error(`  ❌ FAIL: ${desc}`);
  }
}

// Group 1: Player Controller & Camera Scripts
console.log('--- Group 1: Player Controller & Camera Scripts ---');
const playerScripts = [
  'unity/Assets/_Project/Scripts/Player/PlayerMovement.cs',
  'unity/Assets/_Project/Scripts/Player/PlayerInputHandler.cs',
  'unity/Assets/_Project/Scripts/Player/PlayerInteractor.cs',
  'unity/Assets/_Project/Scripts/Player/PlayerManager.cs',
  'unity/Assets/_Project/Scripts/Player/PlayerAppearanceManager.cs',
  'unity/Assets/_Project/Scripts/Player/PlayerIKRiggedController.cs',
  'unity/Assets/_Project/Scripts/Player/VeshtiClothPhysicsController.cs',
  'unity/Assets/_Project/Scripts/Camera/CameraController.cs',
  'unity/Assets/_Project/Scripts/UI/InGamePauseMenuUI.cs',
  'unity/Assets/_Project/Scripts/UI/IntroductionTutorialUI.cs'
];

playerScripts.forEach(rel => {
  const full = path.join(ROOT, rel);
  check(`Script exists: ${path.basename(rel)}`, fs.existsSync(full));
  if (fs.existsSync(full)) {
    check(`Script non-empty: ${path.basename(rel)}`, fs.statSync(full).size > 500);
  }
});

// Group 2: Pause & Focus Handling Code Checks
console.log('\n--- Group 2: Pause, Menu & Focus Code Integrity ---');
const inputHandlerContent = fs.readFileSync(path.join(ROOT, 'unity/Assets/_Project/Scripts/Player/PlayerInputHandler.cs'), 'utf8');
check('PlayerInputHandler implements OnApplicationFocus', inputHandlerContent.includes('OnApplicationFocus(bool hasFocus)'));
check('PlayerInputHandler gates look input on CursorLockMode.Locked & isGameplay', inputHandlerContent.includes('Cursor.lockState == CursorLockMode.Locked && isGameplay'));

const camControllerContent = fs.readFileSync(path.join(ROOT, 'unity/Assets/_Project/Scripts/Camera/CameraController.cs'), 'utf8');
check('CameraController gates orbit input on CursorLockMode.Locked & GameState.Gameplay', camControllerContent.includes('Cursor.lockState != CursorLockMode.Locked') && camControllerContent.includes('GameState.Gameplay'));
check('CameraController has collision avoidance SphereCast', camControllerContent.includes('Physics.SphereCast'));

// Group 3: Procedural Animation Clips & Controllers
console.log('\n--- Group 3: Animation Clips & Rig Controllers ---');
const animClips = [
  'PlayerIdle.anim',
  'PlayerWalk.anim',
  'PlayerRun.anim',
  'PlayerSprint.anim',
  'PlayerJump.anim',
  'PlayerFall.anim',
  'PlayerLand.anim',
  'PlayerCrouchIdle.anim',
  'PlayerCrouchWalk.anim'
];

animClips.forEach(clip => {
  const full = path.join(ROOT, 'unity/Assets/_Project/Art/Characters/Procedural/Clips', clip);
  check(`Locomotion clip exists: ${clip}`, fs.existsSync(full));
});

const playerAnimController = path.join(ROOT, 'unity/Assets/_Project/Art/Animations/Characters/PlayerCharacter.controller');
check('PlayerCharacter.controller exists', fs.existsSync(playerAnimController));
if (fs.existsSync(playerAnimController)) {
  const ctrlContent = fs.readFileSync(playerAnimController, 'utf8');
  check('Animator parameter: Speed', ctrlContent.includes('m_Name: Speed'));
  check('Animator parameter: Grounded', ctrlContent.includes('m_Name: Grounded'));
  check('Animator parameter: FreeFall', ctrlContent.includes('m_Name: FreeFall'));
  check('Animator parameter: Crouching', ctrlContent.includes('m_Name: Crouching'));
  check('Animator parameter: Jump', ctrlContent.includes('m_Name: Jump'));
}

// Group 4: Character Model & Textures
console.log('\n--- Group 4: Authentic Character Model & PBR Textures ---');
const playerModel = path.join(ROOT, 'unity/Assets/_Project/Art/Models/Characters/Player/player.glb');
check('player.glb model exists', fs.existsSync(playerModel));

const pbrTextures = [
  'player_albedo.png',
  'player_normal.png',
  'player_ao.png',
  'player_roughness.png'
];
pbrTextures.forEach(tex => {
  const full = path.join(ROOT, 'unity/Assets/_Project/Art/Models/Characters/Player/textures', tex);
  check(`PBR texture exists: ${tex}`, fs.existsSync(full));
});

// Group 5: First Exploration Region (Chennai George Town)
console.log('\n--- Group 5: Chennai George Town Scene & Architecture ---');
const chennaiScene = path.join(ROOT, 'unity/Assets/_Project/Scenes/02_Chennai_GeorgeTown.unity');
check('02_Chennai_GeorgeTown.unity scene exists', fs.existsSync(chennaiScene));
if (fs.existsSync(chennaiScene)) {
  const sceneText = fs.readFileSync(chennaiScene, 'utf8');
  check('Chennai scene contains Player GameObject', sceneText.includes('m_Name: Player'));
  check('Chennai scene contains SpawnPoint marker', sceneText.includes('m_Name: SpawnPoint'));
  check('Player spawned on west sidewalk (x: -6.08, y: 0.2)', sceneText.includes('m_LocalPosition: {x: -6.08, y: 0.2, z: 0}'));
  check('Chennai scene contains --- CHENNAI_STREET --- corridor', sceneText.includes('m_Name: --- CHENNAI_STREET ---'));
  check('Chennai scene contains --- NPCS --- roster', sceneText.includes('m_Name: --- NPCS ---'));
  check('Chennai scene contains Main Camera with CameraController', sceneText.includes('m_Name: Main Camera') && sceneText.includes('dc7a4cada764f20498deae99cbdd439a'));
}

// Group 6: Localization & Content Declaration
console.log('\n--- Group 6: Step 2 Localization & Content Declaration ---');
const locContent = fs.readFileSync(path.join(ROOT, 'unity/Assets/_Project/Scripts/Localization/LocalizationManager.cs'), 'utf8');
const expectedKeys = [
  'menu.pause_title',
  'menu.resume',
  'menu.save_game',
  'menu.save_success',
  'menu.return_to_main',
  'tutorial.title',
  'tutorial.move',
  'tutorial.look',
  'tutorial.sprint_crouch',
  'tutorial.interact',
  'tutorial.journal_pause',
  'tutorial.complete',
  'tutorial.dismiss'
];
expectedKeys.forEach(k => {
  check(`Localization contains key: ${k}`, locContent.includes(`"${k}"`));
});

const chennaiOpeningContent = fs.readFileSync(path.join(ROOT, 'unity/Assets/_Project/Scripts/Data/ChennaiOpeningContent.cs'), 'utf8');
check('ChennaiOpeningContent defines murugan', chennaiOpeningContent.includes('NpcMurugan = "murugan"'));
check('ChennaiOpeningContent defines velu', chennaiOpeningContent.includes('NpcVelu = "velu"'));
check('ChennaiOpeningContent defines tea kadai clue', chennaiOpeningContent.includes('ClueMuruganTeaLedger'));
check('ChennaiOpeningContent defines first day quest', chennaiOpeningContent.includes('QuestFirstDayInGeorgeTown'));

console.log('\n======================================================================');
console.log(`Summary: ${passedChecks}/${totalChecks} checks passed.`);
console.log('======================================================================');

if (passedChecks === totalChecks) {
  console.log('🎉 SUCCESS: Step 2 Player Controller & First Exploration Region verified 100% cleanly.\n');
  process.exit(0);
} else {
  console.error(`💥 FAILURE: ${totalChecks - passedChecks} checks failed.\n`);
  process.exit(1);
}
