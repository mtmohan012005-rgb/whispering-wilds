# Audio Architecture & Technical Pipeline
**Project:** The Whispering Wilds (*Kaattu Vazhi* / காட்டு வழி)  
**Target Platform:** PC Exploration Game (Windows / macOS / Linux)  
**Standard Authority:** Single `AudioManager` on shared `AudioContext`

---

## 1. Single Audio Authority Model
In accordance with Rule 2:
- A single global `AudioManager` manages audio lifecycle, context creation, hardware change detection, and teardown.
- Sub-managers (`AudioBusMatrix`, `VoiceManager`, `DynamicMusicSystem`, `AmbientAudioSystem`, `FootstepAudioSystem`, `VehicleAudioSystem`, `WildlifeAudioSystem`, `WeatherAudioSystem`) interact strictly through `AudioManager.ctx` and `AudioBusMatrix`.
- No independent or competing `AudioContext` instances are permitted in runtime code or QA tests.

```
GAMEPLAY EVENT (Animation / Physics / Story / Weather)
                     ↓
             AudioManager.play()
                     ↓
             10 Audio Buses
[MUSIC | VOICE | AMBIENCE | SFX | UI | WEATHER | VEHICLE | WILDLIFE | CINEMATIC]
                     ↓
                MASTER BUS
                     ↓
        Context.destination (Speakers / Headphones)
```

---

## 2. 10 Authoritative Audio Buses
All audio signals route into one of 10 dedicated buses:
1. **MASTER:** Root sum bus connecting to `AudioContext.destination`.
2. **MUSIC:** Thematic regional exploration, mystery, and ending scores.
3. **VOICE:** Tamil and English human dialogue, narration, and NPC vocalizations.
4. **AMBIENCE:** Regional 2D environmental sound beds and stochastic atmospheric accents.
5. **SFX:** General object interactions, doors, pumps, brass vessels, and UI sounds.
6. **UI:** Menu selection, confirm, cancel, inventory, and codex chime effects.
7. **WEATHER:** Surface rain impacts, wind gusts, and thunderclaps.
8. **VEHICLE:** Auto-rickshaw engines, bus brakes, motorcycle exhausts, bicycle chains, and bullock carts.
9. **WILDLIFE:** 9 Western Ghats & Coromandel wildlife species calls (tahr, langur, elephant, gaur, etc.).
10. **CINEMATIC:** Authoritative cutscene soundtrack and dialogue mix.

---

## 3. Dynamic Ducking Hierarchy
- **Dialogue Ducking:** When `VoiceManager` begins playback of spoken dialogue, `AudioMixer.onDialogueStart()` smoothly attenuates `MUSIC` (to 0.35) and `AMBIENCE` (to 0.45) over a 250ms ramp.
- **Cinematic Ducking:** During major cutscenes, `CINEMATIC` commands exclusive priority, reducing world background elements to 0.20.
- **Dialogue Restoration:** Upon dialogue conclusion, `AudioMixer.onDialogueEnd()` restores baseline bus levels over a 400ms linear ramp.

---

## 4. 3D Spatial Audio, Occlusion, and Distance Culling
- **Distance Culling:** Any emitter positioned greater than 60.0 meters from the player camera listener is culled from active processing to save CPU cycles (`AudioDistanceSystem`).
- **Cached Occlusion:** For emitters within 60m obstructed by architectural geometry (e.g. granite temple walls, Chettinad teak doors), raycasts are throttled to a 150ms evaluation interval. Occluded sources pass through a dynamic low-pass biquad filter configured with a 900Hz cutoff and a 0.6x gain multiplier (`AudioOcclusionSystem`).
- **Interior Acoustics:** 5 authored interior acoustic zones (`tea_shop`, `heritage_mansion`, `stone_corridor`, `temple_hall`, `forest_shelter`) apply localized dampening to exterior ambience.

---

## 5. Performance Scalability & Voice Budgets
Hardware performance tiers regulate simultaneous voice allocation:
- **LOW:** 12 max concurrent voices
- **MEDIUM:** 20 max concurrent voices
- **HIGH:** 28 max concurrent voices
- **ULTRA:** 36 max concurrent voices

When voice budgets are saturated, `AudioPrioritySystem` performs priority-based voice stealing:
- `CRITICAL_STORY` (Priority 100): Cannot be evicted.
- `ACTIVE_INTERACTION` (Priority 75): Evicts background fluff.
- `ENVIRONMENT_PRIMARY` (Priority 50): Evicts low-tier ambience.
- `BACKGROUND_FLUFF` (Priority 25): First to be evicted upon budget saturation.

---

## 6. Fault Tolerance & Alt-Tab Handling
- **Window Blur / Alt-Tab:** `document.visibilityState` listener automatically mutes/ducks world simulation audio, preventing high-volume background drain.
- **AudioContext Loss / Crash:** `audioManager.onContextLost()` traps browser hardware dropouts, attempts automatic resume, and safely drops into a silent fallback mode so the game remains completely playable without crashing.
