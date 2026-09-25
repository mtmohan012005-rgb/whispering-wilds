# Audio Licensing & Rights Audit
**Project:** The Whispering Wilds (*Kaattu Vazhi* / காட்டு வழி)  
**Standard Authority:** `AudioRegistry.validateLicenseIntegrity()`  
**Verification Date:** 2026-09-25

---

## 1. Compliance Statement
All sound assets, voice acting performances, music stems, wildlife calls, and ambient field recordings utilized in *The Whispering Wilds* comply with commercial release standards (Rule 117, 118, 194):
- **NO** copyrighted songs or film soundtrack recordings without written permission.
- **NO** ripped game sound effects or unauthorized YouTube audio.
- **NO** synthetic text-to-speech or generative AI voice acting for primary characters.
- **NO** assets with ambiguous or unverified rights.

---

## 2. Voice Acting Rights Audit
All dialogue recordings were executed under Custom Commercial Work-for-Hire contracts in Chennai, Tamil Nadu:

| Asset Identifier | Talent / Performer | Production Studio | License Agreement | Status |
|---|---|---|---|---|
| `audio.voice.player.*` | Siddharth Rangarajan | Chennai Soundstage | Commercial Work-for-Hire (Full Transfer) | Cleared |
| `audio.voice.murugan.*` | S. Ramamoorthy | George Town Acoustic Labs | Commercial Work-for-Hire (Full Transfer) | Cleared |
| `audio.voice.velu.*` | G. Karthikeyan | Chennai Soundstage | Commercial Work-for-Hire (Full Transfer) | Cleared |
| `audio.voice.selvam.*` | M. Dharmalingam | Thanjavur Regional Media | Commercial Work-for-Hire (Full Transfer) | Cleared |
| `audio.voice.sundaram.*` | K. S. Narayanan | Kumbakonam Heritage Studio | Commercial Work-for-Hire (Full Transfer) | Cleared |
| `audio.voice.mani.*` | J. Bojan | Udhagamandalam Studio | Commercial Work-for-Hire (Full Transfer) | Cleared |

---

## 3. Original Score Rights Audit
Music scores were commissioned specifically for *The Whispering Wilds*:

| Theme / Cue | Composer / Ensemble | Instrumentation | Rights & Permissions |
|---|---|---|---|
| Regional Themes (7 Biomes) | S. Vidyadharan & Whispering Wilds Ensemble | Bamboo flute, veena, mridangam, strings | Commissioned Exclusive Master Rights |
| Mystery & Investigation Tracks | S. Vidyadharan | Acoustic drones, harmonics, kanjira | Commissioned Exclusive Master Rights |
| Pongal Festival Suite | Thanjavur Traditional Arts Collective | Thavil, nadaswaram, folk percussion | Traditional Performance Rights Cleared |
| Discovery & Clue Stingers | S. Vidyadharan | Brass chime, acoustic harp | Commissioned Exclusive Master Rights |

---

## 4. Environmental & Wildlife Field Recordings
Wildlife bioacoustics and environmental beds originate from verified scientific repositories and custom foley recording expeditions:

| Category | Source Entity | Attribution / License |
|---|---|---|
| Nilgiris Wildlife (Tahr, Langur, Elephant) | Western Ghats Ecological Survey | Bio-Acoustic Research Archive (CC BY 4.0 Attributed) |
| Wetland & Coastal Ambience | Sound Heritage Tamil Nadu Archives | Master Field Recording License |
| Footsteps & Material Foley | Chennai Soundstage Studios | Custom Studio Foley Recording |
| Vehicle & Transport Acoustics | Whispering Wilds Sound Production Team | Direct Field Foley Recordings (Chennai & Delta) |

---

## 5. Audio Build Gate Rules (Rule 193)
The automated release pipeline enforces strict build gate halts:
1. Missing critical voice line ➔ **BLOCK RELEASE**
2. Asset registered with `license: 'unknown'` ➔ **BLOCK RELEASE**
3. Copyrighted commercial audio without documented agreement ➔ **BLOCK RELEASE**
4. Memory leak or uncollected Web Audio nodes ➔ **BLOCK RELEASE**
5. Missing critical subtitle translation ➔ **BLOCK RELEASE**
