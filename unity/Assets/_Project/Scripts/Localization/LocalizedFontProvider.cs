using UnityEngine;

namespace WhisperingWilds.Localization
{
    /// <summary>
    /// Resolves the font used for bilingual UI rendering.
    /// </summary>
    /// <remarks>
    /// Tamil needs a font covering the assigned Unicode Tamil block (U+0B80..U+0BFF).
    /// Unity's builtin <c>LegacyRuntime.ttf</c> has no Tamil coverage at all, so Tamil
    /// strings render as blank boxes unless a suitable font is available.
    ///
    /// A redistributable Tamil font must be added under <c>Assets/_Project/Fonts</c> before
    /// release; see the README there. This class resolves in order:
    /// <list type="number">
    /// <item>an inspector-assigned project font asset,</item>
    /// <item>a font asset in <c>Resources/TamilFont</c>,</item>
    /// <item>an OS-installed Tamil-capable font (development machines only),</item>
    /// <item><c>LegacyRuntime.ttf</c>, which cannot render Tamil.</item>
    /// </list>
    /// The fallback keeps the game playable and English intact; only Tamil degrades, and
    /// the Tamil coverage test reports it rather than failing silently.
    /// </remarks>
    public static class LocalizedFontProvider
    {
        public const string ResourcesFontPath = "Fonts/TamilFont";
        public const string FallbackBuiltinFont = "LegacyRuntime.ttf";

        /// <summary>OS fonts known to cover the Tamil block, best first.</summary>
        private static readonly string[] PreferredSystemFonts =
        {
            "Nirmala UI",
            "Latha",
            "Mangal",
            "Noto Sans Tamil",
            "Tamil Sangam MN",
            "Tamil"
        };

        private static Font _resolved;
        private static bool _resolvedTamil;

        /// <summary>True when the active font is expected to render Tamil correctly.</summary>
        public static bool HasTamilCoverage
        {
            get
            {
                EnsureResolved();
                return _resolvedTamil;
            }
        }

        public static Font Font
        {
            get
            {
                EnsureResolved();
                return _resolved;
            }
        }

        /// <summary>
        /// Registers a project font asset at runtime, bypassing the OS lookup. Used by the
        /// Tamil coverage test to prove a candidate font actually satisfies the requirement.
        /// </summary>
        public static void RegisterFont(Font font, bool tamilCapable)
        {
            _resolved = font;
            _resolvedTamil = font != null && tamilCapable;
            _explicit = true;
        }

        /// <summary>Clears a registered font so resolution runs again. Intended for tests.</summary>
        public static void Reset()
        {
            _resolved = null;
            _explicit = false;
            _resolvedTamil = false;
        }

        private static bool _explicit;

        private static void EnsureResolved()
        {
            if (_explicit && _resolved != null) return;
            if (_resolved != null) return;

            // 1. Resources drop-in: adding the OFL font later needs no code change.
            _resolved = Resources.Load<Font>(ResourcesFontPath);
            if (_resolved != null)
            {
                _resolvedTamil = true;
                Debug.Log($"<color=#00FF99><b>[LocalizedFontProvider]</b></color> Using project font asset from Resources/{ResourcesFontPath}: {_resolved.name}");
                return;
            }

            // 2. OS-installed Tamil font. Development machines only: these fonts are not
            //    redistributed in the build, they are resolved at runtime.
            string[] installed = Font.GetOSInstalledFontNames();
            if (installed != null)
            {
                foreach (string candidate in PreferredSystemFonts)
                {
                    if (string.IsNullOrEmpty(candidate)) continue;
                    for (int i = 0; i < installed.Length; i++)
                    {
                        if (!string.Equals(installed[i], candidate, System.StringComparison.OrdinalIgnoreCase)) continue;
                        Font osFont = Font.CreateDynamicFontFromOSFont(candidate, 32);
                        if (osFont != null)
                        {
                            _resolved = osFont;
                            _resolvedTamil = true;
                            Debug.Log($"<color=#FFCC00><b>[LocalizedFontProvider]</b></color> Using OS font '{candidate}'. Not redistributed in builds; add an OFL Tamil font under Assets/_Project/Fonts before release.");
                            return;
                        }
                    }
                }
            }

            // 3. Builtin fallback: English renders, Tamil does not.
            _resolved = Resources.GetBuiltinResource<Font>(FallbackBuiltinFont);
            _resolvedTamil = false;
            Debug.LogWarning($"<color=#FFCC00><b>[LocalizedFontProvider]</b></color> No Tamil-capable font found. Tamil text will not render. See Assets/_Project/Fonts/README.md.");
        }

        /// <summary>
        /// Applies the resolved font to a legacy uGUI label. Safe to call with a null label.
        /// </summary>
        public static void Apply(UnityEngine.UI.Text label)
        {
            if (label == null) return;
            label.font = Font;
        }

        /// <summary>True when the font's OS name matches a known Tamil-capable family.</summary>
        public static bool IsKnownTamilCapable(string fontName)
        {
            if (string.IsNullOrEmpty(fontName)) return false;
            for (int i = 0; i < PreferredSystemFonts.Length; i++)
            {
                if (fontName.IndexOf(PreferredSystemFonts[i], System.StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    return true;
                }
            }
            return false;
        }
    }
}