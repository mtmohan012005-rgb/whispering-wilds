# The Whispering Wilds (காட்டு வழி • தடம்)
## Production Survival & Environmental Balance Specification Report

> **GAME DESIGN PHILOSOPHY:** Exploration + Investigation + Discovery + Atmosphere.
> Combat is not the primary gameplay. Hardcore punishing survival is strictly avoided.
> All numbers below are **GAMEPLAY VALUES** calibrated to provide immersive environmental tension without interrupting exploration.

---

### 1. Authoritative Stat Ranges & Bounds (GAMEPLAY VALUES)

All vitals use a single authoritative schema located at `GameState.player.survival`.

| Stat | Minimum | Maximum | Default Baseline | Critical Threshold | Severe Impact Rate |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Health** | 0.0 | 100.0 | 100.0 | $\le 20.0$ | At 0 HP $\rightarrow$ `DOWNED` (Safe Haven Respawn) |
| **Energy** | 0.0 | 100.0 | 100.0 | $\le 10.0$ | Sprint disabled, movement speed $\times 0.65$ |
| **Hydration** | 0.0 | 100.0 | 100.0 | $\le 12.0$ | Energy drain $+35\%$, health decay $-0.08$ HP/sec |
| **Hunger** | 0.0 | 100.0 | 100.0 | $\le 15.0$ | Energy recovery halted, health decay $-0.05$ HP/sec |
| **Warmth** | 0.0 | 100.0 | 80.0 | $\le 25.0$ | Energy drain $+25\%$, health decay $-0.10$ HP/sec |
| **Wetness** | 0.0 | 100.0 | 0.0 | $\ge 70.0$ | Cold exposure $+80\%$, warmth loss $\times 1.8$ |

*All stats enforce strict boundary clamping: `0.0 <= value <= max`. Values of `NaN`, `Infinity`, and negatives are rejected.*

---

### 2. Locomotion Energy Drain Rates (GAMEPLAY VALUES)

Energy consumption is evaluated strictly once per frame via `updateSurvival(deltaTime, context)`:

| Movement State | Base Energy Drain (pts/sec) | Exploration Duration from 100% | Gameplay Purpose |
| :--- | :---: | :---: | :--- |
| **IDLE** | 0.08 | ~20.8 minutes | Gentle resting metabolic drain |
| **WALK** | 0.45 | ~3.7 minutes | Comfortable steady observational traversal |
| **RUN** | 1.10 | ~1.5 minutes | Standard overland exploration travel |
| **SPRINT** | 2.80 | ~35.7 seconds | Short bursts for dodging hazards or crossing storms |
| **CLIMB** | 2.20 | ~45.4 seconds | Ascending mountain cliffs and temple gopuram scaffolding |
| **SWIM** | 2.50 | ~40.0 seconds | Navigating mangrove lagoons; wetness set to 100% |
| **BOAT** | 0.35 | ~4.7 minutes | Paddling through Pichavaram mangrove waterways |

---

### 3. Regional Temperature Calibration (GAMEPLAY VALUES)

Base ambient temperatures vary across Tamil Nadu's diverse geographical zones:

| Geographic Region | Climate Profile | Base Temp (°C) | Diurnal Delta (°C) | Humidity | Exposure Modifier |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Chennai (George Town)** | Coastal Urban Heat & Humidity | 32.5 | $\pm 4.0$ | High (78%) | Moderate Heat Drain |
| **Cauvery Delta (Thanjavur)** | Warm Agricultural Plains | 31.0 | $\pm 6.5$ | Moderate (65%) | Standard Baseline |
| **Pichavaram Mangroves** | Wetland Canal Ecosystem | 29.5 | $\pm 4.5$ | Very High (92%) | High Water & Wetness Exposure |
| **Chettinad** | Semi-Arid Heat & Dry Monsoons | 34.0 | $\pm 8.0$ | Low (42%) | High Hydration Drain |
| **Mamallapuram** | Saline Coastal Breeze | 30.0 | $\pm 3.5$ | High (80%) | Moderate Exposure |
| **Nilgiris (Western Ghats)** | High-Altitude Mountain Frost | 14.5 | $\pm 7.5$ | High (85%) | High Cold & Warmth Drain |

- **Elevation Lapse Rate**: Ambient temperature drops by $-0.18^\circ\text{C}$ per $10\text{m}$ elevation above sea level.
- **Diurnal Curve**: Lowest temperature occurs at 04:30 (Dawn $-4.5^\circ\text{C}$); Peak temperature occurs at 14:00 (Afternoon $+5.0^\circ\text{C}$).

---

### 4. Weather Modifiers on Exposure (GAMEPLAY VALUES)

| Weather Condition | Temperature Offset (°C) | Warmth Decay Modifier | Wetness Gain (pts/sec) | Exposure Rating |
| :--- | :---: | :---: | :---: | :--- |
| **CLEAR / SUNNY** | $+2.0$ | $\times 1.0$ (Baseline) | $0.0$ | Normal pleasant exploration |
| **MIST / FOG** | $-2.5$ | $\times 1.35$ | $+0.25$ | Moderate exposure, damp air |
| **RAIN** | $-4.0$ | $\times 1.85$ | $+1.40$ | High warmth loss; damp clothing |
| **HEAVY RAIN / STORM** | $-6.5$ | $\times 2.60$ | $+3.20$ | Severe wind chill; rapid soaking |

---

### 5. Cultural Clothing & Outfit Insulation (GAMEPLAY VALUES)

No single garment is universally superior; each provides tailored protection:

| Outfit ID | Tamil Label | Cold Insulation | Heat Resistance | Mobility Modifier | Best Usage |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `everyday_veshti` | அன்றாட வேஷ்டி | 0.20 | 0.85 | $+10\%$ | Chennai, Delta, Thanjavur plains |
| `village_workwear` | கிராமத்து வேலை உடை | 0.45 | 0.70 | $+5\%$ | Fieldwork, agriculture, general exploration |
| `urban_explorer` | நவீன ஆய்வாளர் உடை | 0.55 | 0.55 | $\pm 0\%$ | Balanced exploration & ruins investigation |
| `festival_veshti` | பட்டு வேஷ்டி & சட்டை | 0.25 | 0.60 | $-5\%$ | Cultural temple rituals & festival gatherings |
| `nilgiri_warmwear` | நீலகிரி கம்பளி சூட் | 0.90 | 0.15 | $-8\%$ | Mandatory for Nilgiri frost & highland caves |

---

### 6. Camping & Shelter Parameters (GAMEPLAY VALUES)

- **Campfire**:
  - Initial fuel on ignition: $240\text{ seconds}$ (4 minutes).
  - Maximum fuel capacity: $720\text{ seconds}$ (12 minutes).
  - Fuel consumption: $1.0\text{ fuel unit / second}$.
  - Warmth Aura Radius: $6.5\text{ meters}$.
  - Wetness drying rate near fire: $-4.5\text{ pts / sec}$.
  - Fuel replenishment: Firewood (`+180s`), Wood logs (`+120s`), Twigs (`+45s`).
- **Shelters**:
  - Types: `house`, `tea_shop`, `heritage_house`, `forest_station`, `camp_tent`, `ancient_mantapam`.
  - Weather protection factor: $0.70 - 0.95$ (indoor spaces eliminate $85-95\%$ of outdoor rain/wind chill).
  - Auto-cleanup: Temporary camps farther than $250\text{ meters}$ despawn automatically to conserve memory. Persistent camps are marked `isPersistent: true` and serialized.

---

### 7. Rest System Recovery Profiles (GAMEPLAY VALUES)

Resting advances the authoritative `GameState.world.time` clock:

| Rest Type | Duration | Energy Restored | Health Restored | Warmth & Drying | Stat Cost | Buff Awarded |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **SHORT REST** | $45\text{ mins}$ | $+35\%$ | $+15\%$ | Warmth to $75\%$, dries $40\%$ | $-5\%$ Hydration | Stamina refresh |
| **LONG REST** | Advances to Dawn ($06:30$) | $+85\%$ | $+45\%$ | Warmth to $95\%$, dries $100\%$ | $-12\%$ Hunger, $-15\%$ Hydration | `RESTED` ($+30\%$ stamina regen for 12m) |

*Rest is strictly blocked while swimming, airborne/falling, in active combat/hazard zones, or during cinematic story scenes.*

---

### 8. Provisions & Culinary Item Values (GAMEPLAY VALUES)

Items restore vitals through `SurvivalProductionSystem.consumeItem()` and are managed by `InventorySystem`:

| Item Key | Display Name | Hunger Restore | Hydration Restore | Energy Restore | Health Restore | Special Property |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `cutting_chai` | Cutting Chai (கட்டிங் டீ) | $+5$ | $+15$ | $+25$ | $0$ | Murugan Annan's tea kadai brew |
| `kumbakonam_degree_coffee` | Degree Coffee (டிகிரி காபி) | $+8$ | $+10$ | $+40$ | $0$ | Sharpens focus, restores stamina |
| `elaneer` | Tender Coconut (இளநீர்) | $+10$ | $+55$ | $+18$ | $+5$ | Rapid hydration & cooling |
| `banana_leaf_meal` | Virundhu Meals (வாழை இலை சாப்பாடு) | $+75$ | $+25$ | $+60$ | $+45$ | Full culinary nourishment |
| `parotta_salna` | Madurai Parotta & Salna | $+55$ | $+10$ | $+45$ | $+15$ | Hearty, high-energy comfort food |
| `panchayat_well_water` | Boiled / Filtered Well Water | $0$ | $+40$ | $+5$ | $0$ | Safe clean water canteen refill |

---

### 9. Fall Damage Calibration (GAMEPLAY VALUES)

Evaluated strictly once on physical impact via vertical landing velocity:

- **Impact Velocity $< 15.0\text{ m/s}$** ($< 3.2\text{m}$ fall): **$0.0\text{ Damage}$** (Safe jump).
- **Impact Velocity $15.0 - 24.0\text{ m/s}$** ($3.2 - 8.0\text{m}$ fall): **$5.0 - 25.0\text{ Damage}$** (Moderate fall, minor injury).
- **Impact Velocity $> 24.0\text{ m/s}$** ($> 8.0\text{m}$ fall): **$30.0 - 75.0\text{ Damage}$** (Severe fall, heavy stumble).
- *Single-impact guarantee: Velocity is immediately zeroed upon ground contact to prevent duplicate tick damage.*

---

### 10. Downed State & Safe Haven Respawn Protocol (GAMEPLAY VALUES)

If Health reaches $0.0$, the player transitions to `DOWNED` (exploration game standard):

1. **Non-Destructive Guarantee**:
   - Inventory items are **NEVER** deleted.
   - Rupee currency balance is **NEVER** deducted.
   - Quest progression and journal discoveries remain **$100\%$ INTACT**.
   - Customization change counter remains fixed: `customizationChangesUsed <= 5`.
2. **Safe Respawn Checkpoints**:
   - Player wakes up at the nearest cultural safe haven (e.g. *Murugan Annan's Tea Kadai*, *Thanjavur Chola Resthouse*, or *Ooty Forest Outpost*).
   - Recovery Vitals Granted: Health $= 40.0$, Energy $= 45.0$, Hydration $= 50.0$, Warmth $= 75.0$.

---

### 11. Accessibility Assist Mode (GAMEPLAY VALUES)

Configurable in Pause Menu Settings (`NORMAL` vs `ASSISTED`):

- **ASSISTED Mode Modifiers**:
  - Movement energy drain: $\times 0.50$ (half stamina consumption).
  - Hydration & hunger decay: $\times 0.50$ (extended wilderness journeys).
  - Temperature & cold exposure penalty: $\times 0.40$.
  - Environmental fall damage: $\times 0.35$.
  - Vitals recovery during rest: $+30\%$ bonus.
