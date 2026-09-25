# Version Compatibility & SemVer Matrix
## Project: The Whispering Wilds (`Kaattu Vazhi`)

---

## 1. Versioning Standard

The Whispering Wilds adheres to Semantic Versioning (`MAJOR.MINOR.PATCH`):

| Type | Impact on Game Files | Impact on Save Data | Rollback Allowed? |
| :--- | :--- | :--- | :--- |
| **PATCH** (`1.2.0` -> `1.2.1`) | Minor code/asset fixes | 100% backward & forward compatible (Save Schema unaltered) | Yes, seamless |
| **MINOR** (`1.1.0` -> `1.2.0`) | New biomes, features, systems | Additive save migration with backup; older saves safely loadable | Yes |
| **MAJOR** (`1.x` -> `2.0.0`) | Fundamental architectural changes | Requires explicit schema migration (`SaveManager.migrate()`) | Requires user approval |

---

## 2. Save Schema Compatibility

- **Current Save Schema Version**: `3`
- **Minimum Supported Save Schema**: `1`
- **Ownership Rule**: The **game itself** owns all save data deserialization and schema migration. The launcher treats save files as read-only opaque user assets.
- **Progression Ceiling**: In all versions, **`0 <= customizationChangesUsed <= 5`** is strictly enforced. No patch or version migration may increase or reset this ceiling.
