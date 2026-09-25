# The Whispering Wilds - Authored Achievements & Localization

## Achievement Design Principles
1. **Meaningful Progression**: Rewarding observation, story discovery, wildlife encounters, cultural learning, and environmental puzzles. Zero artificial grinding or arbitrary repetitive counters.
2. **Bilingual Localization**: Every achievement is authored with native Tamil and English titles and descriptions.
3. **One-Time Unlock**: Achievements unlock strictly once. Duplicate calls are safely ignored without repeated notifications.
4. **Offline Resiliency**: Unlocked achievements while offline are safely staged in `pendingOfflineQueue` and synced with bounded retry on reconnection.
5. **Absolute Customization Rule**: No achievement or cosmetic reward can grant an extra customization change. The player customization ceiling (`<= 5`) is permanent and inviolable.

---

## Core Authored Achievements

| ID | English Title | Tamil Title | Category | Condition Description |
| :--- | :--- | :--- | :--- | :--- |
| `ach_first_clue` | First Clue | முதல் தடம் | STORY | Discover the first major investigation clue in George Town |
| `ach_following_trail` | Following the Trail | தொடரும் தடம் | STORY | Complete the first investigation chapter |
| `ach_above_mist` | Above the Mist | பனி மூட்டத்திற்கு மேலே | STORY | Reach the Nilgiris highlands story chapter |
| `ach_shore_secrets` | Secrets of the Shore | கடற்கரை ரகசியங்கள் | EXPLORATION | Uncover ancient coastal carvings at Mamallapuram |
| `ach_mangrove_navigator`| Mangrove Navigator | சதுப்புநில மாலுமி | EXPLORATION | Navigate the dense waterways of Pichavaram |
| `ach_wildlife_watcher` | Wildlife Watcher | வன விலங்கு பார்வையாளர் | WILDLIFE | Observe and log the endangered Nilgiri Tahr in its habitat |
| `ach_art_of_threshold` | Art of the Threshold | வாசல் கலை | CULTURE | Reconstruct an intricate rice-flour Kolam pattern at dawn |
| `ach_lens_of_wilds` | Lens of the Wilds | காட்டுப் பார்வை | PHOTOGRAPHY | Capture a high-depth wildlife portrait in Photo Mode |
| `ach_safe_haven` | Safe Haven | புகலிடம் | SURVIVAL | Successfully build and rest beside a mountain campfire |
