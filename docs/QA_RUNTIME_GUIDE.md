# QA Runtime Guide & Validation Framework
## Project: The Whispering Wilds (`Kaattu Vazhi`)

---

## 1. Overview
The Whispering Wilds incorporates an automated QA, runtime validation, crash prevention, regression detection, and self-healing runtime framework.
This framework ensures that as new narrative chapters, regional assets, and simulation systems are added, the game remains stable, performant, and resistant to state corruption.

### Core Priorities:
1. **STABILITY**: Under no circumstances should non-critical errors crash the gameplay loop.
2. **PLAYABILITY**: Gameplay input, movement, camera, and quest interactions must remain responsive.
3. **SAVE INTEGRITY**: Save data must never be corrupted, and valid saves must never be overwritten by invalid payloads.
4. **PERFORMANCE**: Automatic adaptation to low-end and high-end PC hardware.

---

## 2. Core Architecture

### Authoritative System Registry (`SystemRegistry`)
- All major subsystems (`Renderer`, `Player`, `Weather`, `NPC`, `Wildlife`, `Traffic`, `Quest`, `Inventory`, `SaveManager`, `Audio`, `Input`, `Performance`, `WorldStreaming`) register with a unique ID, version, dependencies, and health check.
- Duplicate system instantiation is strictly prevented.

### Runtime Validation & Self-Healing (`RuntimeValidator`)
- Enforces player coordinate sanity (bounds: -5000 to +5000, world floor: y >= -50).
- Automatic recovery: restores `lastSafePosition` if `NaN`, `Infinity`, or out-of-bounds coordinates are detected.
- Clamps health and energy (0–100).
- Guarantees non-negative currency.
- **Enforces the absolute ceiling of 5 permanent player customization changes (`0 <= customizationChangesUsed <= 5`)**.

### Error Boundary (`ErrorBoundary`)
- Wraps subsystems (`wrap` and `wrapAsync`) to trap exceptions.
- Deduplicates and rate-limits error logs (1.5s cooldown per duplicate message).
- Isolates non-critical subsystems (e.g., audio, optional weather particles) while gracefully degrading them.
- Dispatches critical failures to `CrashRecoverySystem`.

### Resource & Loop Singularity
- **`RenderLoopRegistry`**: Enforces exactly one authoritative `requestAnimationFrame` loop.
- **`TimerRegistry`**: Scopes `setTimeout` and `setInterval` by owner for leak-free region unloads.
- **`EventListenerRegistry`**: Scopes DOM listeners by owner to prevent duplicate handlers.
- **`ResourceLeakDetector`**: Reference-counts shared geometries/materials and runs snapshot diffing.

---

## 3. Running Automated Tests

Run the full automated QA test suite in PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File run_tests.ps1
```
All 61 steps must execute and report `passed: true`.
