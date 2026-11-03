# 🌿 The Whispering Wilds — Wildlife Sound Design Specification

**Subsystem:** Environmental & Ecological Wildlife Audio  
**Status:** `SYNTHETIC_SOUND_DESIGN` — Placeholder Acoustic Assets Awaiting Licensed Field Recordings  
**Authenticity Policy:** The current WAV audio assets (`call_elephant.wav`, `call_nilgiri_tahr.wav`, `call_peafowl.wav`) are synthetically modeled procedural sound-design cues created to validate 3D spatial audio attenuation and event-driven AI behavior. They are **NOT** authentic wild bioacoustic field recordings.

---

## 1. Asset Inventory & Provenance

| Filename | Species / Entity | In-Game Region | Provenance & Acoustic Nature | Production Status |
| :--- | :--- | :--- | :--- | :--- |
| `call_nilgiri_tahr.wav` | **Nilgiri Tahr** (*Nilgiritragus hylocrius*) | Nilgiris Sanctuary & Agasthyamalai Wilds | Synthetic alert whistle/snort designed with bandpass-filtered noise and formant resonance. | Placeholder sound design. Awaiting authentic Western Ghats field recordings. |
| `call_elephant.wav` | **Asian Elephant** (*Elephas maximus indicus*) | Pichavaram & Anamalai/Nilgiri Corridors | Synthetic low-frequency infrasonic rumble and resonant trumpet burst. | Placeholder sound design. Awaiting licensed wild Asian elephant recordings. |
| `call_peafowl.wav` | **Indian Peafowl** (*Pavo cristatus*) | Thanjavur Delta & Madurai Bazaars | Synthetic two-tone screaming call (*may-awe*) frequency-modulated synthesis. | Placeholder sound design. Awaiting licensed wild Indian peafowl recordings. |

---

## 2. Technical In-Engine Integration

- **Component:** `WhisperingWilds.Audio.WildlifeAudioObserver`
- **Spatial Blend:** `1.0` (Fully 3D spatialized with logarithmic distance roll-off)
- **Attenuation Distances:** $3\text{m}$ (minimum) to $35\text{m}$ (maximum)
- **Bus Routing:** `AudioManager.Instance.sfxVolume * AudioManager.Instance.masterVolume`
- **Behavior Trigger:** Automatically wired to `AnimalAIController` alert and ambient wander states.
