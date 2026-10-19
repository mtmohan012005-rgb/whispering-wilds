# The Whispering Wilds — Test Environment & Provenance

**Test Run Identifier:** `20261019-111500-4f73ddb`  
**Execution Timestamp:** 2026-10-19 16:43:00 – 16:50:30 IST  

---

## 1. Host Machine Specification

| Parameter | Proven Value | Source / Detection Method |
|---|---|---|
| **Operating System** | Microsoft Windows 11 Home 64-bit | `[System.Environment]::OSVersion` |
| **OS Build** | 10.0.26100 (24H2) | System Info |
| **CPU Architecture** | Intel64 Family 6 Model 190 Stepping 0 (Intel Core i3-N305) | Windows WMI / Unity `Player.log` |
| **CPU Core / Thread Count**| 8 Cores / 8 Logical Processors | WMI Processor query |
| **Physical RAM** | 8,054 MB (~8 GB DDR5/LPDDR5) | System Information |
| **Graphics Adapter** | Intel(R) UHD Graphics | Direct3D 11 Driver Info / `Player.log` |
| **DirectX Version** | Direct3D 11.0 [level 11.1] | Unity Engine initialization log |
| **VRAM Dedicated** | 128 MB (shared dynamic system memory up to 4 GB) | DXDIAG / Unity Player.log |
| **Screen Resolution** | 1920 x 1080 @ 60 Hz | Display Settings |

---

## 2. Software & Tooling Baseline

| Tool | Version | Path / Executable |
|---|---|---|
| **Unity Editor** | `6000.6.3f1` (64-bit) | `C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe` |
| **Unity Render Pipeline**| HDRP 17.7.0 (High Definition Render Pipeline) | `unity/Packages/manifest.json` |
| **Node.js** | `v24.19.0` | `node --version` |
| **npm** | `11.1.0` | `npm --version` |
| **PowerShell** | `7.x / 5.1 (Core & Desktop)` | `$PSVersionTable` |
| **Git** | `2.47.0.windows.1` | `git --version` |

---

## 3. Git Repository & Provenance State

| Property | Value |
|---|---|
| **Repository URL** | `https://github.com/mtmohan012005-rgb/whispering-wilds.git` |
| **Workspace Root** | `C:\Users\mohan\.gemini\antigravity-ide\scratch\whispering-wilds` |
| **Target Commit (Base)** | `4f73ddbe232a8e39e19b7c40eb268478e993bf4a` |
| **Base Commit Message** | `docs: add fresh QA reports with live test evidence (2026-10-19)` |
| **Active Repair Branch** | `fix/gameplay-runtime-repair-20261019` |
| **Staged / Modified Files** | `scripts/Run-QaTests.ps1`, `scripts/run-all-tests.js`, `scripts/test-cloud-save-regression.js`, `scripts/validate-links.js`, `server/auth/auth-service.js` |

---

## 4. Standalone Windows Executable Provenance

- **Binary Path:** `unity/Build/Windows/TheWhisperingWilds.exe`
- **Binary Size:** 667,136 bytes
- **Data Folder:** `unity/Build/Windows/TheWhisperingWilds_Data/`
  - `boot.config` (122 bytes)
  - `globalgamemanagers` (16,384 bytes)
  - `data.unity3d` (158,543,872 bytes)
- **Total Windows Build Size:** ~158.75 MB
- **Tested Process ID (PID):** `18084`
- **Log Destination:** `%USERPROFILE%\AppData\LocalLow\Whispering Wilds Studios\The Whispering Wilds\Player.log`
