# Music & Dynamic Score Pipeline
**Project:** The Whispering Wilds (*Kaattu Vazhi* / காட்டு வழி)  
**Standard Authority:** `DynamicMusicSystem` & `MusicManager`

---

## 1. Score Philosophy & Exploration Balance
- **Subtlety & Ambient Priority:** Music in *The Whispering Wilds* serves the natural world and story atmosphere. It never dominates gameplay; significant stretches of wilderness travel intentionally feature purely organic environmental soundscapes (Rule 84).
- **Original & Authentic:** All music compositions are commissioned works performed on traditional acoustic instruments. No copyrighted film themes or generic synthetic approximations are utilized (Rule 86, 196).

---

## 2. 8 Authoritative Music States
The score is driven by a single finite state machine in `DynamicMusicSystem`:
1. **EXPLORATION:** Dynamic regional open-world exploration motifs.
2. **MYSTERY:** Minimalist ambient textures, drone harmonics, and sparse acoustic pluckings during ancient puzzle searches.
3. **INVESTIGATION:** Focused, steady rhythmic tension during crime and contraband clue discovery.
4. **DISCOVERY:** Brief, elegant musical stingers (2.5–4.5s) acknowledging landmark or secret findings without bombastic fanfare.
5. **FESTIVAL:** Vibrant folk percussion (thavil, urumi) and double-reed nadaswaram during Pongal or Karthigai events.
6. **CINEMATIC:** Authoritative story-scored cutscenes; takes supreme priority over ambient scores.
7. **ENDING:** Climax score reflecting player narrative resolution.
8. **PAUSED:** Low-pass attenuated score maintaining menu ambiance.

---

## 3. 7 Regional Thematic Identifiers
Each region features distinct acoustic palettes and instrument combinations:

| Region | Primary Theme | Acoustic Identity & Instruments |
|---|---|---|
| **Chennai** | *Coromandel Pulse* | Coastal acoustic guitar, subtle electronic drone, mridangam rhythm |
| **Cauvery Delta** | *Kaviri Alai* | Bamboo flute (*pullanguzhal*), acoustic tambura, gentle water chimes |
| **Pichavaram** | *Mangrove Mist* | Deep drone, resonant woodblocks, subtle temple gong |
| **Chettinad** | *Thinnai Memories* | Classical Saraswati veena, kanjira, terracotta pot percussion |
| **Thanjavur** | *Brihadisvara Dawn* | Solemn temple bells, classical violin, mridangam, copper bell resonance |
| **Mamallapuram** | *Stone Shore Song* | Coastal acoustic strums, wind flute, distant sea wave bed |
| **Nilgiris** | *Shola Canopy* | Highland acoustic strings, gentle harp, wind bells, wood flute |

---

## 4. Priority Mixing & Crossfades
- State transitions execute an authored 3.0-second crossfade between current and incoming score stems.
- `CINEMATIC` overrides `EXPLORATION` and locks out standard background changes until the scene sequence finishes.
- `DISCOVERY` stingers play as an overlay layer without restarting or desynchronizing background exploration loops.
