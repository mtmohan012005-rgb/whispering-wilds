# PC Installation, Directory Hierarchy & Disk Safety
## Project: The Whispering Wilds (`Kaattu Vazhi`)

---

## 1. Directory Structure

The Whispering Wilds strictly separates **Game Binaries** from **User Data**:

```
C:\Users\<User>\AppData\Local\TheWhisperingWilds\
├── app/                              # Mutable game files (updated by launcher)
│   ├── index.html
│   ├── js/
│   ├── css/
│   ├── assets/
│   ├── current-manifest.json
│   └── .rollback_snapshot/          # Safety snapshot for automatic rollback
│
└── savedata/                         # Permanent user data (NEVER modified by launcher)
    ├── saves/                        # Local save files (ww_save_auto, backup)
    ├── settings/                     # User preferences & hardware settings
    ├── profiles/                     # Offline & guest profiles
    ├── screenshots/                  # Photo Mode captures
    └── logs/                         # Crash & diagnostic reports
```

---

## 2. Disk Space & Permission Checks

Before any installation or update begins, the launcher verifies:
1. **Target Directory Write Permissions**: Warns the user if the selected folder is read-only or requires elevated administrator permissions.
2. **Total Space Calculation**:
   - Required game installation footprint
   - Temporary download and staging buffer
   - Rollback snapshot buffer
3. **Safety Abort**: If available disk space is less than the required space, the operation aborts gracefully without touching existing game files.
