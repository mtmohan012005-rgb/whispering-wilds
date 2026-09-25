# Voice Acting & Dialogue Pipeline
**Project:** The Whispering Wilds (*Kaattu Vazhi* / காட்டு வழி)  
**Standard Authority:** `VoiceManager` & `DialogueVoiceSystem`

---

## 1. Core Voice Acting Principles
- **Real Human Talent Only:** All dialogue lines are performed by commissioned human voice talent. The use of runtime AI text-to-speech or synthetic voices for final character delivery is strictly prohibited (Rule 7, 195).
- **Casting Consistency:** Each story character is bound to a single dedicated voice actor throughout the game to maintain tone, age portrayal, and acoustic identity across all chapters (Rule 8).
- **Authentic Dialects:** Tamil voice acting emphasizes natural, regional phrasing rather than caricatures or exaggerated accents (Rule 9):
  - *Murugan Annan:* Colloquial George Town Madras Tamil.
  - *Farmer Selvam:* Lyrical, grounded Cauvery Delta agrarian cadence.
  - *Sthapathi Sundaram:* Reverent Swamimalai bronze-artisan diction.
  - *Auto Driver Velu:* Rhythmic North Chennai guild vernacular.
  - *Forest Guide Mani:* Soft-spoken, vigilant Nilgiris montane delivery.

---

## 2. Character Casting Registry
| Character ID | Character Name | Actor / Talent | Dialect / Style | Language |
|---|---|---|---|---|
| `player` | Tamizh Iniyan (தமிழ் இனியன்) | Siddharth Rangarajan | Urban Chennai, observant, 24 yrs | Bilingual (Tamil primary) |
| `murugan` | Murugan Annan (முருகன் அண்ணன்) | S. Ramamoorthy | Warm, raspy George Town tea stall elder | Colloquial Madras Tamil |
| `velu` | Auto Driver Velu (ஆட்டோ வேலு) | G. Karthikeyan | Energetic North Chennai auto driver | North Chennai Tamil |
| `selvam` | Farmer Selvam (விவசாயி செல்வம்) | M. Dharmalingam | Thanjavur paddy farmer, reflective | Cauvery Delta Tamil |
| `sundaram` | Sthapathi Sundaram (சிற்பி சுந்தரம்) | K. S. Narayanan | Swamimalai master bronze caster | Classical Artisan Tamil |
| `mani` | Forest Guide Mani (வன வழிகாட்டி மணி) | J. Bojan | Mudumalai / Nilgiris indigenous tracker | Nilgiris Montane Tamil |

---

## 3. Bilingual Support & Synchronization
- Spoken language can be toggled between Tamil (`ta`) and English (`en`) at any time via the Settings UI.
- English dubbing preserves cultural names, geographic terms, and diegetic Tamil vocatives (*Annan*, *Thambi*, *Thalaiva*).
- Both language tracks feature precision timestamps for subtitle synchronization.

---

## 4. Lip-Sync & Viseme Pipeline
1. **Authored Phonemes:** Important NPC dialogue lines include authored `{ time, open }` viseme keyframes in `VoiceData.LINES`.
2. **Facial Animation Bridge:** `DialogueVoiceSystem` evaluates active phoneme timestamps and interpolates target mouth openness on character rigs via `onVoiceStarted()`.
3. **Safe Envelope Fallback:** If a custom line lacks authored phoneme data, the system computes a smooth sinusoidal mouth openness envelope derived from voice duration and intensity, ensuring NPC mouths open and close naturally without facial mesh distortion (Rule 19).

---

## 5. Subtitle System & Accessibility
- **Speaker Badging:** Displays subtle speaker badges in the active language (`முருகன் அண்ணன்:` or `Murugan Annan:`).
- **Sound Cues:** In-game environmental cues (e.g. `[ இடி முழக்கம் / Thunderclap ]`) appear alongside dialogue for hearing-impaired players.
- **Accessibility Controls:**
  - Font scaling (0.8x to 1.6x).
  - High contrast mode (pure black background with bright yellow text).
  - Subtitle on/off toggle.

---

## 6. Missing Voice Fallback Safety
If a specific voice audio asset fails to load or is unrecorded in the selected language:
- The game displays the full dialogue subtitle on screen.
- A callback executes after the anticipated reading duration.
- Story progression continues seamlessly without halting gameplay or deadlocking scenes (Rule 151, 152).
