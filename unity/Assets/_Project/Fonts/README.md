# Tamil Font Requirement

## Status: font asset NOT yet committed (licensing)

The game renders bilingual English/Tamil UI. Tamil requires a font with Unicode
coverage of the assigned **Tamil block U+0B80–U+0BFF** (72 assigned codepoints).
Unity's builtin `LegacyRuntime.ttf` has **no Tamil coverage**, so without a font
asset every Tamil string renders as blank/tofu.

### Verified font survey

Coverage was measured by parsing each font's `cmap` table directly (formats 4 and 12) and cross-checking absent codepoints against .NET's Unicode database.

| Font                           | Tamil assigned codepoints | Verdict       |
| ------------------------------ | ------------------------- | ------------- |
| **Nirmala UI** (`Nirmala.ttc`) | **72 / 72**               | Full coverage |
| Arial                          | 0                         | No Tamil      |
| Tahoma                         | 0                         | No Tamil      |
| Segoe UI                       | 0                         | No Tamil      |

Nirmala's 56 absent codepoints in the block were all confirmed
`UnicodeCategory.OtherNotAssigned`, i.e. genuinely unassigned in Unicode rather
than missing glyphs. Full-conjunct and glyph-shaping rendering was **not**
verified, since that requires a rendered Play Mode screenshot.

### Why Nirmala is not committed

Nirmala UI ships with Windows and is licensed by Microsoft. Copying it into a
public repository or redistributing it inside a game build is **not permitted**.
It is used on the development machine only, via OS font lookup, and is never
written into the build.

### Required action before release

Drop a redistributable Tamil-capable font into this folder. **Noto Sans Tamil**
(SIL Open Font License 1.1) is the recommended choice.

1. Download `NotoSansTamil-Regular.ttf` from the Google Fonts / Noto releases.
2. Place it in this folder (`unity/Assets/_Project/Fonts/`).
3. Verify the result with the EditMode test
   `TamilFontCoverageTests`, which walks the assigned Tamil block plus the
   UI strings the game actually renders.

`LocalizedFontProvider` resolves the font at runtime in this order:

1. `TamilFontAsset` — the inspector-assigned project font asset, if set.
2. A font asset found in `Resources/TamilFont`.
3. An OS-installed Tamil-capable font (development only; `Nirmala UI`,
   `Latha`, `Mangal`).
4. `LegacyRuntime.ttf`, which cannot render Tamil. The game still runs and
   English still renders correctly; only Tamil falls back to missing glyphs, and
   `TamilFontCoverageTests` reports the gap.

Steps 1–2 need no code change, so adding the font later is a drop-in.
