# 🎙️ The Whispering Wilds — Tamil Voice Performance Recording Specification

**Subsystem:** Regional NPC Spoken Tamil Barks  
**Status:** `BLOCKED_EXTERNAL_ASSET` — Awaiting Licensed Native Tamil Voice Actors  
**Strict Authenticity Policy:** Synthetic speech, TTS, or unauthorized audio generation is prohibited. Human cultural voice performances must be recorded by native Tamil speakers from respective geographical regions.

---

## 1. Specification & Required Deliverables

All voice assets must be delivered as 48 kHz / 24-bit PCM WAV (master) and 44.1 kHz OGG Vorbis (in-game streaming).

| Filename | Character | Region | Context & Script Line (Tamil & English) | Dialect / Tone |
| :--- | :--- | :--- | :--- | :--- |
| `murugan_intro_01.ogg` | **Murugan**<br>*(Flower Vendor)* | George Town, Chennai | *"வணக்கம் தம்பி! பூ வாங்கலியா? மதுரை மல்லி இன்னைக்கு தான் வந்தது."*<br>(Greetings friend! Won't you buy some flowers? Fresh Madurai jasmine arrived today.) | Madras Tamil, warm elder, energetic street market presence |
| `velu_pichavaram_01.ogg` | **Velu**<br>*(Boatman)* | Pichavaram Wetlands | *"கால்வாய்ல கவனம் வேணும்... அலை ஏற நேரம் ஆச்சு. முதலைங்க நடமாட்டம் இருக்கு."*<br>(Be careful in the mangrove canals... High tide is approaching and estuarine reptiles are active.) | Coastal Cuddalore Tamil, cautious, seafaring baritone |
| `selvam_delta_01.ogg` | **Selvam**<br>*(Paddy Farmer)* | Cauvery Delta, Thanjavur | *"காவிரி தண்ணி வந்தா தான் அடுத்த போகம்... உழவு நல்லா இருக்கும்."*<br>(Only when Cauvery water flows can the next harvest thrive... The soil is ready for tilling.) | Chola Delta Tamil, rhythmic agrarian cadence, grounded |
| `kumaran_kanyakumari_01.ogg` | **Kumaran**<br>*(Navigator)* | Kanyakumari Cape | *"மூன்று கடலும் சேர்ற இடம் இது... அலைகளின் திசையை பாத்து படகை விடணும்."*<br>(This is where the three oceans meet... Watch the ocean wave swells before setting sail.) | Southern Kumari/Tirunelveli Tamil, breezy maritime cadence |
| `siddhar_agasthyamalai_01.ogg` | **Siddhar Maruthuvar**<br>*(Healer)* | Agasthyamalai Wilds | *"மூலிகையின் ரகசியம் காட்டின் இதயத்தில் இருக்கு... பொறுமையோடு தேடு."*<br>(The secret of traditional medicine lies in the forest's heart... Seek with quiet patience.) | Classical literary/Sangam cadence, serene, meditative |

---

## 2. Technical In-Engine Playback Integration

- Component: `WhisperingWilds.NPC.NPCVoiceBarkPlayer`
- Bus Routing: `AudioManager.Instance.voiceVolume * AudioManager.Instance.masterVolume`
- Spatial Blend: $0.75$ (3D world-space roll-off with $2\text{m} - 15\text{m}$ attenuation curve)
- Safe Fallback: When voice clips are unassigned, the system displays bilingual dialogue subtitles in `DialogueBoxUI` without runtime errors or audio gaps.
