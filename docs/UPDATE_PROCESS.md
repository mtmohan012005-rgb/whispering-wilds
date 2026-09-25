# Patch Delivery, Update & Rollback Process
## Project: The Whispering Wilds (`Kaattu Vazhi`)

---

## 1. Differential Update Architecture

Updates in The Whispering Wilds do not require redownloading the entire game. The launcher inspects the local installation against the latest `release-manifest.json`:
1. **Manifest Comparison**: Evaluates file paths and SHA-256 checksums between local files and the remote release manifest.
2. **Differential Download**: Downloads only modified, new, or missing files. Unchanged files (e.g. large audio buffers, textures) are retained untouched.
3. **Resumable Downloads**: Network drops are handled with automatic backoff and chunk resumption without restarting the full download.
4. **Bandwidth Throttling**: Users can select between `Unlimited`, `5 MB/s`, and `1 MB/s` download modes.

---

## 2. Atomic Staging & Rollback Safety

To protect the player's installation against power cuts, network drops, or disk failures:
1. Files are downloaded into `.staging_temp/` in the installation directory.
2. SHA-256 hashes of all staged files are verified.
3. Previous binaries are copied to `.rollback_snapshot/`.
4. Staged files are committed into the main game directory.
5. Post-update verification runs a smoke check.
6. **Automatic Rollback**: If post-update verification fails, `.rollback_snapshot/` is restored, and the launcher logs an alert.
7. **Save Data Isolation**: Player saves, settings, and screenshots live in `%LOCALAPPDATA%\TheWhisperingWilds\savedata` and are **NEVER touched during an update or rollback**.
