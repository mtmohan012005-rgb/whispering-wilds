# Player Data Safety, Save Protection & Privacy Rules
## Project: The Whispering Wilds (`Kaattu Vazhi`)

---

## 1. Absolute Save Preservation Rules

1. **No Save Erasure on Reinstall / Update**: Reinstalling, repairing, or updating the game never deletes or alters `%LOCALAPPDATA%\TheWhisperingWilds\savedata`.
2. **Explicit User Data Removal**: The uninstaller provides an explicit, un-checked-by-default checkbox: `[ ] Remove player saves and settings`.
3. **Atomic Writes & Backups**: Game saves write to `_tmp`, validate schema and size, copy existing saves to `_backup`, and atomically rename.
4. **Crash Loop Safety**: If the game encounters a startup crash loop (>= 3 times), the launcher prompts Safe Mode or File Verification without wiping local save files.
5. **Customization Invariant**: The **5 permanent customization changes maximum** ceiling is immutable across all patch, update, and rollback cycles.
6. **Privacy & Zero Secret Exposure**: Diagnostic exports and error logs strictly exclude passwords, tokens, session keys, and personal identifiers.
