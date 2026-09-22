# 🌿 The Whispering Wilds (காட்டு வழி / Thadam)

### 🌐 [Play Live Online Now (GitHub Pages)](https://mtmohan012005-rgb.github.io/whispering-wilds/)

[![Live Demo](https://img.shields.io/badge/Play%20Live-GitHub%20Pages-2ecc71?style=for-the-badge&logo=github)](https://mtmohan012005-rgb.github.io/whispering-wilds/)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/mtmohan012005-rgb/whispering-wilds)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/mtmohan012005-rgb/whispering-wilds)

An atmospheric open-world exploration, light survival, and narrative mystery adventure set across authentic Tamil Nadu landscapes—shifting from the Indo-Saracenic red-brick gates of the **Madras High Court** to rural red-soil palmyra groves, the tidal **Pichavaram mangrove delta**, and the misty **Nilgiri Western Ghats**.

---

## 🏛️ 1. Main Story & Prologue
* **The Starting Point:** Outside the red-brick gates of the **Madras High Court** in George Town, Chennai.
* **The Inciting Incident:** As you review an inherited century-old architectural blueprint during a sudden Chennai downpour, a mysterious rider on a vintage Royal Enfield 350 speeds past, splashes a massive puddle, and steals critical records.
* **The Goal:** Follow muddy tyre treads across real Tamil Nadu geography, decode ancient Chola hydraulic engineering, and unlock **Pasumai Thadam**—a lost subterranean eco-sanctuary high in the Western Ghats—before a corporate syndicate destroys it.

---

## 🗺️ 2. Progressive Open-World Biomes
1. **Phase 1: Chennai & Red-Soil Plains (0 – 2000px)**:
   - Red clay trails (*semman*), towering *Panai Maram* (Palmyra palms) with weaver bird nests, vintage gas lamps, Panchayat village well, classic Madras black-and-yellow auto-rickshaw, tender coconut cart, and Murugan Annan's Tea Kadai.
2. **Phase 2: Pichavaram Wetlands & Delta (2000 – 4000px)**:
   - Labyrinthine mangrove aerial roots, tidal water channels with real-time wave animation, wooden catamarans (*thoni*), wading white egrets, and the ancient Chola granite waterwheel mechanism.
3. **Phase 3: Nilgiris & Western Ghats (4000 – 6000px)**:
   - Stepped emerald tea terraces, high mountain pines, freezing fog, Sacred Toda tribal barrel-vault huts (*Mund*), rare 12-year Neelakurinji blossoms, endangered Nilgiri Tahr, and the fabled eco-sanctuary portal.

---

## 🎮 3. Controls & Gameplay Guide

| Key | Action |
| :--- | :--- |
| **W / A / S / D** or **Arrow Keys** | Walk through Tamil Nadu landscapes |
| **Left Shift** | Sprint (consumes Stamina / Energy) |
| **Spacebar** | Jump |
| **C / Left Ctrl** | Crouch (stealth / narrow mangrove paths) |
| **E** | Interact with Landmarks, NPCs, Wells, or Tents |
| **F** | Toggle Explorer Camera Viewfinder (Click 📸 to capture snapshot) |
| **J** | Open / Close Diegetic Field Journal & Clue Board |
| **L** | Toggle Brass Belt Lantern for night exploration |
| **B** | Deploy Campfire (requires Wood) |
| **T** | Pitch Canvas Tent (sleep to gain **Well Rested** buff) |
| **M** | Toggle Synthesized Audio / Music Mute |

---

## 🚀 4. Deployment Instructions

### A. Deploy to Netlify (Zero-Config)
1. Fork or push this repository to your GitHub account (`https://github.com/mtmohan012005-rgb/whispering-wilds`).
2. Go to **[Netlify](https://app.netlify.com/)** and click **"Add new site"** $\rightarrow$ **"Import an existing project"**.
3. Select **GitHub** and choose `whispering-wilds`.
4. Netlify will automatically detect `netlify.toml`:
   - **Publish directory:** `.` (root)
   - **Build command:** *(leave blank)*
5. Click **"Deploy site"**. Your game will be live with free SSL in ~15 seconds!

*Or click the one-click button above!*

---

### B. Deploy to Render
1. Go to **[Render Dashboard](https://dashboard.render.com/)**.
2. Click **"New +"** $\rightarrow$ **"Static Site"**.
3. Connect your GitHub repository `whispering-wilds`.
4. Render automatically reads `render.yaml`:
   - **Build Command:** *(leave empty)*
   - **Publish Directory:** `.`
5. Click **"Create Static Site"**.

---

### C. Run Locally
This is a lightweight, zero-dependency HTML5 Canvas application:
```bash
# Option 1: Using npx serve
npx serve .

# Option 2: Using Python (if installed)
python -m http.server 8080

# Option 3: PowerShell (Windows)
powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Port 8080
```
Then open `http://localhost:8080` in any web browser!

---

## 📜 License
MIT License • Created for the Whispering Wilds (Kaattu Vazhi / Thadam) Open-World Adventure.
