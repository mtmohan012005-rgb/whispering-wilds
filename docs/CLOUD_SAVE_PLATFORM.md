# The Whispering Wilds - Cloud Save Platform & Conflict Resolution

## Architecture & Priority Hierarchy
The Whispering Wilds employs a **Local-First Authoritative Architecture**:

```
[Save Event Triggered]
         ↓
1. Write to Local Filesystem Atomic Buffer
         ↓
2. Validate Save Integrity & Checksum
         ↓
3. Commit Local Save (AUTHORITATIVE)
         ↓
4. If Online & Cloud Enabled → Dispatch Cloud Sync
```

### Key Principles
1. **Local Save Never Sacrificed**: Network interruptions or storefront cloud outages never prevent or delay local gameplay saves.
2. **Platform-Neutral Save Structure**:
   - Zero OS-specific file paths (`C:\...`, `/Users/...`) in save payloads.
   - Saves contain only logical region identifiers (`chennai`, `nilgiris`), story progress flags, and player vitals.
   - Cross-platform portability: A save created on Windows is 100% readable on macOS and Linux.
3. **Explicit Conflict Resolution**:
   - If local and cloud saves diverge, the game displays an explicit resolution modal comparing:
     - Save Timestamps
     - Regional Locations
     - Story Progress Chapters
     - Total Playtime
   - The user selects whether to keep `LOCAL` or load `CLOUD`. No silent overwrites occur.
4. **Customization Ceiling Guard**:
   - All cloud packages are validated on download and upload to ensure `player.customizationChangesUsed <= 5`. Any package exceeding 5 is rejected as corrupt.
