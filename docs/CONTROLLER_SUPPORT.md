# The Whispering Wilds - Controller & Gamepad Architecture

## Controller Philosophy
*The Whispering Wilds* provides seamless plug-and-play controller support across Windows, macOS, and Linux via standard W3C Gamepad API and desktop input bridging.

---

## Supported Controller Hardware
- **Xbox Controllers**: Xbox Wireless Controller, Xbox Elite Series 2, Xbox 360/One Controllers.
- **PlayStation Controllers**: Sony DualSense (PS5), DualShock 4 (PS4).
- **Generic Gamepads**: Standard XInput and DirectInput PC gamepads.
- **Keyboard & Mouse**: Fully supported and always concurrent (never disabled when a gamepad is connected).

---

## Hotplug & Dynamic Glyph Adaptation
1. **Hotplug Support**: Players can connect or disconnect gamepads at any moment during gameplay without stutter or crash.
2. **Context-Sensitive Glyphs**:
   - When an Xbox controller is active, on-screen prompts display `[A]`, `[B]`, `[X]`, `[Y]`, `[LT]`, `[RT]`.
   - When a PlayStation controller is active, prompts dynamically switch to `[✕]`, `[○]`, `[□]`, `[△]`, `[L2]`, `[R2]`.
   - When using Keyboard & Mouse, prompts display `[E]`, `[Space]`, `[Shift]`, `[Esc]`, `[J]`, `[M]`.
3. **Deadzone & Pacing**:
   - Analog sticks feature calibrated radial deadzones to prevent drift during third-person camera and exploration traversal.
