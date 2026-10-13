# Tamil Font Requirement

## Status: ✓ Noto Sans Tamil integrated (SIL Open Font License 1.1)

The game renders bilingual English/Tamil UI. Tamil requires a font with Unicode
coverage of the assigned **Tamil block U+0B80–U+0BFF** (72 assigned codepoints).
Unity's builtin `LegacyRuntime.ttf` has **no Tamil coverage**, so without a font
asset every Tamil string renders as blank/tofu.

### Integrated font

**Noto Sans Tamil Regular** (`NotoSansTamil-Regular.ttf`) has been added to this
folder and to `Resources/Fonts/TamilFont.ttf` for runtime loading.

- License: SIL Open Font License 1.1 (OFL-1.1)
- Source: Google Fonts / Noto releases
- File: `NotoSansTamil-Regular.ttf` (~38 KB)

### Verified font survey

Coverage was measured by parsing each font's `cmap` table directly (formats 4 and 12) and cross-checking absent codepoints against .NET's Unicode database.

| Font                           | Tamil assigned codepoints | Verdict       |
| ------------------------------ | ------------------------- | ------------- |
| **Nirmala UI** (`Nirmala.ttc`) | **72 / 72**               | Full coverage |
| **Noto Sans Tamil**            | **72 / 72**               | Full coverage |
| Arial                          | 0                         | No Tamil      |
| Tahoma                         | 0                         | No Tamil      |
| Segoe UI                       | 0                         | No Tamil      |

### Font resolution order

`LocalizedFontProvider` resolves the font at runtime in this order:

1. `Resources/Fonts/TamilFont.ttf` — the project font asset (Noto Sans Tamil).
2. An OS-installed Tamil-capable font (development fallback).
3. `LegacyRuntime.ttf`, which cannot render Tamil.

### Testing

Verify Tamil rendering with the EditMode test `TamilFontCoverageTests`, which
walks the assigned Tamil block plus the UI strings the game actually renders.
