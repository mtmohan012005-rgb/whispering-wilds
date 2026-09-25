# The Whispering Wilds - PC Storefront Release & Distribution Guide

## Storefront Packaging & Release Channels
The Whispering Wilds supports dual-channel distribution:
1. **Direct Distribution**: Standalone NSIS Windows Installer, macOS DMG, and Linux AppImage with zero store dependencies via `GenericPlatformProvider`.
2. **Storefront Distribution**: Steam, Epic Games Store, and GOG release packages via `StorePlatformProvider`.

---

## Release Checklist & Gate Invariants

> [!IMPORTANT]
> The release pipeline will automatically FAIL and block deployment if any of the following gates are violated:

1. **Player Character Model Integrity**:
   - `assets/characters/player/player.glb` must exist with valid GLB header.
   - Zero occurrences of `Xbot`, `mrdoob demo`, or external placeholder humanoids.
2. **Placeholder Assets**:
   - Zero unwhitelisted `PLACEHOLDER` asset tokens across production manifests.
3. **Local Packaging**:
   - Zero reliance on CDNs, localhost dev endpoints, or external runtime texture URLs. All assets packaged locally.
4. **Player Customization Ceiling**:
   - `customizationChangesUsed <= 5` strictly verified across all saves, migrations, and achievements.
5. **Security & Secrets**:
   - Zero hardcoded private API keys, cloud secrets, or credentials committed into source code.
   - Context isolation enabled, Node integration disabled in renderer.
