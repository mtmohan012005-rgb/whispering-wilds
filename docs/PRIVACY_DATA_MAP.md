# The Whispering Wilds - Privacy & Data Mapping (GDPR / Privacy-Safe Design)

## Data Processing Summary

| Category | Specific Data | Purpose | Storage Location | Retention | Third-Party Sharing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Game Saves** | Story chapter, quest flags, player position, inventory, customization count | Persistent player progress | Local `%APPDATA%` / `Application Support` / `.config` + Optional Cloud | Player managed | None |
| **Settings** | Resolution, graphics preset, audio volume, keybindings | User display & audio preferences | Local `settings.json` | Player managed | None |
| **Crash Diagnostics** | OS release, CPU model, total RAM, sanitized breadcrumbs | Bug reporting & safe mode recovery | Local `crash.log` (capped at 2MB) | Local rotation | None (Local only) |
| **Platform Identity** | Public display name, storefront ID | Achievement unlock & cloud sync attribution | In-memory session | Cleared on shutdown | None |

---

## Privacy Invariants
1. **Zero Credential Collection**: The game never asks for, receives, or stores user passwords or storefront authentication tokens.
2. **Zero Telemetry Tracking**: No analytics trackers, ad trackers, or third-party behavioral profiling scripts.
3. **Redacted Logs**: Breadcrumbs and crash logs automatically scrub bearer tokens, passwords, and sensitive keys.
4. **Local Sovereignty**: Uninstalling the game leaves save files intact unless the player explicitly deletes their user data directory.
