# Local Setup & Developer Guide — The Whispering Wilds (காட்டு வழி • தடம்)

This document provides setup instructions for playing, developing, testing, and building the native **Unity 6 (HDRP)** game and its supporting **Node.js** multiplayer/persistence backend.

---

## 1. System Requirements & Prerequisites

### Minimum Hardware
- **Operating System:** Windows 10/11 64-bit
- **Processor:** Intel Core i5 (8th Gen) / AMD Ryzen 5 or better
- **Memory:** 8 GB RAM minimum (16 GB recommended for Unity Editor)
- **Graphics:** DirectX 11 or DirectX 12 compatible GPU with minimum 4 GB VRAM (Intel Iris Xe, NVIDIA GTX 1050+, AMD Radeon RX 560+)
- **Storage:** 10 GB available SSD storage

### Required Software
- **Unity Engine:** **Unity 6 (6000.6.3f1)** installed via Unity Hub
- **Render Pipeline:** High Definition Render Pipeline (HDRP 17.7.0)
- **Node.js Runtime:** Node.js **>= 18.0.0** and npm **>= 9.0.0**
- **Git:** Git for Windows (with Git LFS support)
- **Shell:** Windows PowerShell 5.1+ or PowerShell 7

---

## 2. Repository Setup

Clone the repository and inspect the branch structure:

```powershell
git clone https://github.com/mtmohan012005-rgb/whispering-wilds.git
cd whispering-wilds
```

Install backend dependencies:

```powershell
npm install
```

---

## 3. Playing the Standalone PC Game

The canonical executable path for the native game is:

```
unity/Build/Windows/TheWhisperingWilds.exe
```

### Launch Options
- **PowerShell:**
  ```powershell
  .\Launch-Game-PC.ps1
  ```
- **Command Prompt / Windows Explorer:**
  Double-click `Launch-Game-PC.bat`.

If the executable has not been built yet, the launcher will display a warning explaining that a Unity build is required and point to this guide.

---

## 4. Opening the Project in Unity Editor

1. Open **Unity Hub**.
2. Click **Add** $\rightarrow$ **Add project from disk**.
3. Select the `unity/` subdirectory inside the repository root (`<repo-root>/unity`).
4. Ensure the Editor version is set to **6000.6.3f1**.
5. Once opened, navigate to:
   `Assets/_Project/Scenes/00_Boot.unity`
6. Press the **Play** button in the Editor to test the game in PlayMode.

### Scene Structure
- `Assets/_Project/Scenes/00_Boot.unity` — Title menu, settings, campaign intro
- `Assets/_Project/Scenes/01_StateMap_TamilNadu.unity` — Overworld macro travel map
- `Assets/_Project/Scenes/02_Chennai_GeorgeTown.unity` — Region 1: Chennai High Court & Tea Kadai
- `Assets/_Project/Scenes/03_Pichavaram_Wetlands.unity` — Region 2: Mangrove wetlands & waterwheel
- `Assets/_Project/Scenes/04_Thanjavur_Delta.unity` — Region 3: Cauvery delta & bronze workshop
- `Assets/_Project/Scenes/05_Chettinad_Mansion.unity` — Region 4: Heritage mansion courtyards
- `Assets/_Project/Scenes/06_Mamallapuram_Shore.unity` — Region 5: Shore temples & granite carvings
- `Assets/_Project/Scenes/07_Nilgiris_Sanctuary.unity` — Region 6: Western Ghats Toda mund & finale

---

## 5. Building the Game

### From Unity Editor
1. In the top menu bar, select:
   **Tools** $\rightarrow$ **Whispering Wilds** $\rightarrow$ **Build Production Windows x64 (Retail)**
2. The automated build pipeline will:
   - Regenerate authoritative scenes (`00_Boot` through `07_Nilgiris`)
   - Populate scheduled NPC district populations
   - Bake static NavMesh for all regions
   - Build the Windows x64 executable to `unity/Build/Windows/TheWhisperingWilds.exe`

### From Command Line (Batch Mode)
Run the automated build method headless:

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" `
  -batchmode -quit -nographics `
  -projectPath "$((Get-Location).Path)\unity" `
  -executeMethod "WhisperingWilds.Editor.BuildPipelineAutomation.BuildProductionWindowsFromCommandLine"
```

---

## 6. Running the Node.js Backend Server

The Node.js server provides optional co-op multiplayer (up to 5 players per room), session management, and cloud-save persistence.

### Starting Local Development Server
```powershell
npm start
```
By default, the server runs on `http://localhost:3000`:
- **Local Transactional Storage:** Operates in file-backed mode using `server/data/auth_database.json` when `DATABASE_URL` is omitted.
- **Liveness probe:** `http://localhost:3000/health`
- **Readiness probe:** `http://localhost:3000/ready`
- **Socket.IO:** Real-time multiplayer synchronization on port 3000.

---

## 7. Automated Testing & Verification

Run the full automated test and verification suite:

```powershell
npm test
```

This executes:
1. **`test:backend`** — 31 backend security and save validation tests (CSRF, HMAC/FNV-1a checksums, 5-customization appearance cap, optimistic concurrency control).
2. **`verify-game`** — 15-point Unity project integrity check (scenes, asmdefs, packages, fonts, models).
3. **`verify-production`** — Server security, room caps, and production configuration check.
4. **`verify-assets`** — 3D model and skeletal rig validation (`player.glb`, animations, licensing metadata).

### Running Unity EditMode Unit Tests
Run the NUnit test suite in Unity 6:

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" `
  -batchmode -projectPath "$((Get-Location).Path)\unity" `
  -runTests -testPlatform editmode -testResults "test-results.xml"
```
Test results will be written to `test-results.xml` (or `unity/test-results.xml`).
