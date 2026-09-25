# The Whispering Wilds - Linux Support & Packaging

## Target Architecture & Distribution
- **Target Distributions**: Ubuntu 22.04 LTS+, Debian 12+, Fedora 38+, Arch Linux, SteamOS 3.0+.
- **Architectures**: `x86_64` (x64) and `aarch64` (arm64).
- **Distribution Packages**:
  - Universal `AppImage` (`The-Whispering-Wilds-1.0.0-x86_64.AppImage`).
  - Debian/Ubuntu Package (`the-whispering-wilds_1.0.0_amd64.deb`).
  - Portable Tarball (`the-whispering-wilds-1.0.0-linux-x64.tar.gz`).
- **Save Location**: `$XDG_CONFIG_HOME/TheWhisperingWilds/saves` or `~/.config/TheWhisperingWilds/saves`.

## Key Linux Features
1. **Display Server Support (X11 & Wayland)**:
   - Compatible with native X11 and Wayland sessions (via Ozone platform abstraction).
   - Tested under GNOME, KDE Plasma, and Cinnamon desktop environments.
2. **Graphics & Mesa Drivers**:
   - Vulkan and OpenGL ES 3.0 acceleration via Mesa drivers (RADV, ANV, Iris) and proprietary NVIDIA drivers.
   - Graceful fallback to software rasterization or safe graphics preset if hardware acceleration encounters driver bugs.
3. **Audio Stack Compatibility**:
   - Seamless integration with PulseAudio and PipeWire through Chromium ALSA/Pulse audio sinks.
   - Audio failure recovery: game continues silently without crashing if the audio server restarts.
4. **Desktop Integration**:
   - XDG-compliant `.desktop` launcher and SVG/PNG icon specification.
