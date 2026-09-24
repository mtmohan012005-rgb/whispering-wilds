/**
 * The Whispering Wilds (Kaattu Vazhi) - Story Scene System
 * Orchestrates data-driven cutscene timelines, checks scene prerequisites,
 * manages camera sequences, triggers dialogue lines, and commits story milestones.
 */

class StorySceneSystem {
  constructor(cinematicSystem, dialogueController, cameraDirector) {
    this.cinematicSystem = cinematicSystem;
    this.dialogue = dialogueController;
    this.camera = cameraDirector;

    this.scenes = new Map();
    this.activeScene = null;
    this.sceneTime = 0;
    this.cameraStepIndex = 0;
    this.dialogueStepIndex = 0;

    this.initScenes();
  }

  initScenes() {
    const list = window.STORY_SCENE_DATA || [];
    list.forEach(scene => {
      this.scenes.set(scene.id, scene);
    });
  }

  getScene(sceneId) {
    return this.scenes.get(sceneId) || null;
  }

  canPlayScene(scene) {
    if (!scene) return false;

    // Check oneShot persistence via GameState or SaveManager
    if (scene.oneShot) {
      const flags = (window.GameState && window.GameState.quests && window.GameState.quests.storyFlags) || new Set();
      const flagName = `played_${scene.id}`;
      if (flags instanceof Set ? flags.has(flagName) : flags[flagName]) {
        return false;
      }
    }

    // Check prerequisites
    if (scene.prerequisites) {
      const p = scene.prerequisites;
      if (p.requiredRegion && window.GameState && window.GameState.world.currentRegion !== p.requiredRegion) {
        return false;
      }
    }

    return true;
  }

  playScene(sceneId, onComplete = null) {
    const scene = this.getScene(sceneId);
    if (!scene) {
      console.warn(`[StorySceneSystem] Scene not found: ${sceneId}`);
      if (onComplete) onComplete();
      return false;
    }

    if (!this.canPlayScene(scene)) {
      console.log(`[StorySceneSystem] Scene ${sceneId} already completed or prerequisites not met.`);
      if (onComplete) onComplete();
      return false;
    }

    this.activeScene = scene;
    this.sceneTime = 0;
    this.cameraStepIndex = 0;
    this.onCompleteCallback = onComplete;

    console.log(`[StorySceneSystem] >>> PLAYING SCENE: ${scene.id} (${scene.title}) <<<`);

    // Lock gameplay controls via master CinematicSystem
    if (this.cinematicSystem) {
      this.cinematicSystem.startCinematic(scene);
    }

    // Show title card if chapter/region intro
    if (scene.type === 'LOCATION_INTRO' || scene.type === 'REGION_UNLOCK') {
      if (this.cinematicSystem && this.cinematicSystem.ui) {
        this.cinematicSystem.ui.showTitleCard({
          number: scene.region || 'TAMIL NADU',
          title: scene.title,
          tamilTitle: scene.tamilTitle
        }, 3.5);
      }
    }

    // Trigger initial camera shot
    if (scene.cameraSequence && scene.cameraSequence.length > 0) {
      const firstShot = scene.cameraSequence[0];
      if (this.camera) {
        this.camera.setShot(firstShot.shot, firstShot.target, firstShot.duration || 1.0);
      }
    }

    // Trigger dialogue sequence
    if (scene.dialogueSequence && scene.dialogueSequence.length > 0 && this.dialogue) {
      this.dialogue.startDialogue(scene.dialogueSequence, () => {
        // If choices present, evaluate choices
        if (scene.choices && scene.choices.length > 0) {
          this.dialogue.showChoice(scene.choices, (choiceIdx) => {
            console.log(`[StorySceneSystem] Player chose option #${choiceIdx + 1}`);
            this.finishScene();
          });
        } else {
          this.finishScene();
        }
      });
    } else {
      // Scene without dialogue (timed environmental scene)
      setTimeout(() => {
        this.finishScene();
      }, (scene.duration || 5.0) * 1000);
    }

    return true;
  }

  update(deltaTime) {
    if (!this.activeScene) return;
    this.sceneTime += deltaTime;

    // Advance camera sequence based on timestamps
    const seq = this.activeScene.cameraSequence;
    if (seq && this.cameraStepIndex + 1 < seq.length) {
      const nextShot = seq[this.cameraStepIndex + 1];
      if (this.sceneTime >= nextShot.time) {
        this.cameraStepIndex++;
        if (this.camera) {
          this.camera.setShot(nextShot.shot, nextShot.target, nextShot.duration || 1.0);
        }
      }
    }
  }

  finishScene() {
    if (!this.activeScene) return;
    const scene = this.activeScene;
    this.activeScene = null;

    // Commit story flags & one-shot markers
    if (window.GameState && window.GameState.quests) {
      if (!window.GameState.quests.storyFlags) {
        window.GameState.quests.storyFlags = new Set();
      }
      const flags = window.GameState.quests.storyFlags;
      const addFlag = (f) => {
        if (flags instanceof Set) flags.add(f);
        else flags[f] = true;
      };

      addFlag(`played_${scene.id}`);
      if (scene.unlocks && scene.unlocks.storyFlags) {
        scene.unlocks.storyFlags.forEach(f => addFlag(f));
      }
      if (scene.unlocks && scene.unlocks.regions) {
        scene.unlocks.regions.forEach(r => window.GameState.unlockRegion(r));
      }
    }

    // Record Journal Entry
    if (scene.journalEntry && window.gameJournal) {
      if (typeof window.gameJournal.addEntry === 'function') {
        window.gameJournal.addEntry(scene.journalEntry);
      } else if (window.gameJournal.unlockedEntries) {
        window.gameJournal.unlockedEntries.add(scene.journalEntry.id);
      }
    }

    // Restore gameplay controls
    if (this.cinematicSystem) {
      this.cinematicSystem.stopCinematic();
    }
    if (this.dialogue && typeof this.dialogue.endDialogue === 'function') {
      this.dialogue.endDialogue();
    }

    console.log(`[StorySceneSystem] Scene ${scene.id} finished.`);
    if (this.onCompleteCallback) {
      const cb = this.onCompleteCallback;
      this.onCompleteCallback = null;
      cb();
    }
  }
}

window.StorySceneSystem = StorySceneSystem;
