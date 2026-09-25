# Game Distribution & Patch Pipeline
## Project: The Whispering Wilds (`Kaattu Vazhi`)

---

## 1. Overview
The Whispering Wilds distribution architecture provides verified, cryptographic release packages, manifests, and differential patch deliveries for Windows desktop players.

### Core Principles:
- **Separation of Concerns**: Game binaries and assets are stored in the installation directory (`%LOCALAPPDATA%\TheWhisperingWilds\app` or custom path). Player saves, user settings, screenshots, and logs are stored strictly in `%LOCALAPPDATA%\TheWhisperingWilds\savedata`. Updates and repairs **NEVER touch or overwrite save data**.
- **Cryptographic File Integrity**: Every release asset is hashed using **SHA-256**. Manifests are checked before installation, update, or repair.
- **Atomic Operations**: Installations, updates, and repairs stage files into `.staging_temp` first, verify checksums, and atomically commit. If any step fails or power is interrupted, the existing valid installation is preserved or restored.
- **Rollback Safety**: Previous valid binaries are retained in a rollback snapshot. A failed update triggers automatic rollback to the last verified build without modifying saves.
- **Offline Capable**: Installed valid builds can be launched offline without requiring active internet connectivity.
