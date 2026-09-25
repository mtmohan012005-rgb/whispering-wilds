# Crash Recovery, Self-Healing & Fault Tolerance Runbook
## Project: The Whispering Wilds (`Kaattu Vazhi`)

---

## 1. Crash Prevention & Fault Isolation Principles

### Never Expose Raw Exceptions
Players should never see unhandled browser stack traces or blank screens. All unexpected faults are intercepted by `ErrorBoundary` and routed through `CrashRecoverySystem` to present clear, non-intimidating options:
- **RETRY**: Resumes simulation after isolating corrupted transient state.
- **LOAD CHECKPOINT**: Loads the last safe checkpoint or backup save.
- **RETURN TO MENU**: Returns to the main menu without corrupting progression.

### Non-Critical Subsystem Isolation
- **Audio Failure**: Automatically drops to silent fallback without stalling the game.
- **Optional Effects / Water / Post-Processing**: Disables failing passes and degrades to standard PBR or basic shaders.
- **Distant Simulation / NPC / Wildlife**: Disables or abstracts distant entities while preserving hero interactions.
- **Multiplayer Disconnect**: Drops cleanly back to single-player offline exploration without exiting the game.

---

## 2. WebGL Context Loss & Recovery
1. The canvas listens for `webglcontextlost`.
2. Cancels RAF render loops and freezes simulation.
3. Upon `webglcontextrestored`, Three.js textures, shaders, and framebuffers are reconstructed.
4. Player position, inventory, and quest states are preserved intact.
5. If context loss recurs >= 3 times, `PerformanceSafeModeUI` drops into `SAFE_MODE` (50% render scale, no shadows) to prevent GPU TDR crashes.

---

## 3. Save Atomicity & Corruption Protection
1. State is serialized to a temporary JSON string.
2. `RuntimeValidator.validateSavePayload()` performs schema, size (<5MB), and range checks.
3. Checksum is computed.
4. Payload is written to temporary key `ww_save_temp`.
5. Existing valid save is copied to `ww_save_auto_backup`.
6. Temporary save is committed to `ww_save_auto`.
7. **If validation fails at any point, the existing valid save is never overwritten.**
