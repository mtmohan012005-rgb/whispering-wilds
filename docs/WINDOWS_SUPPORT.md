# The Whispering Wilds - Windows Support & Packaging

## Target Architecture & Distribution
- **Target OS**: Windows 10 (Build 19041+) and Windows 11 (64-bit).
- **Target CPU Architecture**: x64 (AMD64 / Intel 64-bit).
- **Installer Type**: NSIS Native Installer (`The-Whispering-Wilds-Setup-1.0.0-x64.exe`) and Portable Zip.
- **Save Location**: `%APPDATA%\TheWhisperingWilds\saves` (e.g. `C:\Users\<User>\AppData\Roaming\TheWhisperingWilds\saves`).

## Key Windows Features
1. **Unicode & Non-English Path Support**:
   - Fully tested with non-ASCII user profiles, spaces in directory paths, and Tamil filenames (`விளையாட்டு`).
   - Uses platform-safe path normalization and UTF-8 encoding across all filesystem interactions.
2. **GPU & Driver Acceleration**:
   - Supports DirectX 11/12 and Vulkan rendering backends via ANGLE in Chromium.
   - Tested across Intel Integrated Graphics (HD 620, Iris Xe), AMD APU (Radeon Vega/680M), and Dedicated GPUs (NVIDIA GTX/RTX, AMD Radeon).
3. **Safe Mode & Hardware Recovery**:
   - Automatically detects GPU initialization stalls or context losses (`webglcontextlost`) and provides safe recovery presets.
4. **Installer Safety**:
   - Custom NSIS uninstall macro ensures user saves, profiles, and screenshots are never deleted during uninstall or update.
