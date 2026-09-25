# The Whispering Wilds - macOS Support & Packaging

## Target Architecture & Distribution
- **Target OS**: macOS 12 Monterey, macOS 13 Ventura, macOS 14 Sonoma, macOS 15 Sequoia.
- **Architectures**:
  - Apple Silicon (`arm64` - M1, M2, M3, M4 series).
  - Intel 64-bit (`x64` - Core i5/i7/i9 where supported).
- **Distribution Packages**:
  - Signed DMG with `/Applications` drag-and-drop link (`The-Whispering-Wilds-1.0.0-arm64.dmg`, `The-Whispering-Wilds-1.0.0-x64.dmg`).
  - Standalone Application Bundle (`The Whispering Wilds.app`).
- **Save Location**: `~/Library/Application Support/TheWhisperingWilds/saves`.

## Key macOS Features
1. **Apple Silicon Native Performance**:
   - Zero translation overhead via dedicated arm64 binary.
   - Metal graphics translation via Chromium ANGLE.
2. **Retina & Dynamic DPR Management**:
   - High-DPI UI scaling with sharp text and crisp vector icons.
   - 3D WebGL render scale dynamically managed via `PerformanceManager` to prevent overheating or excess memory draw on entry-level MacBooks.
3. **Security, Hardened Runtime & Notarization**:
   - Code signing with Apple Developer ID certificate.
   - Hardened Runtime enabled with minimal entitlements (`allow-jit`, `allow-unsigned-executable-memory`).
   - Zero intrusive permission requests (no camera, microphone, or address book requests).
4. **App Bundle Isolation**:
   - User saves, logs, and screenshots reside strictly outside the `.app` bundle to guarantee persistence across application updates.
