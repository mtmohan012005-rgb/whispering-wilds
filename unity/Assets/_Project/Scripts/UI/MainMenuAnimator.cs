using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// STEP 70 — Animates the main menu entrance after the cinematic intro completes.
    /// 
    /// All animations use unscaled real time so they work when Time.timeScale = 0 (MainMenu state).
    /// 
    /// Sequence:
    /// 1. Title fades in and rises into position with a subtle golden glow sweep
    /// 2. Subtitle fades in slightly after the title
    /// 3. Buttons fade in one by one with staggered timing
    /// 4. Rule notice fades in at the bottom
    /// 5. Background mist layers drift slowly
    /// 6. Fireflies float gently
    /// </summary>
    public class MainMenuAnimator : MonoBehaviour
    {
        [Header("Menu Elements")]
        [SerializeField] private Text titleText;
        [SerializeField] private Text subtitleText;
        [SerializeField] private Transform menuContainer; // Holds the buttons
        [SerializeField] private Text ruleNoticeText;

        [Header("Background Layers")]
        [SerializeField] private Image menuBackground;
        [SerializeField] private GameObject menuMistLayer1;
        [SerializeField] private GameObject menuMistLayer2;
        [SerializeField] private GameObject menuFireflies;
        [SerializeField] private Image menuVignette;

        [Header("Timing")]
        [Tooltip("When the title starts fading in (seconds after menu appears)")]
        [SerializeField] private float titleStartDelay = 0.2f;
        [Tooltip("How long the title fade+rise animation takes")]
        [SerializeField] private float titleDuration = 1.2f;
        [Tooltip("When the subtitle starts fading in")]
        [SerializeField] private float subtitleStartDelay = 0.6f;
        [Tooltip("How long the subtitle fade takes")]
        [SerializeField] private float subtitleDuration = 0.8f;
        [Tooltip("When the first button starts appearing")]
        [SerializeField] private float buttonsStartDelay = 1.2f;
        [Tooltip("Time between each button entrance")]
        [SerializeField] private float buttonStagger = 0.12f;
        [Tooltip("How long each button fade+slide takes")]
        [SerializeField] private float buttonDuration = 0.5f;
        [Tooltip("When the rule notice fades in")]
        [SerializeField] private float ruleNoticeDelay = 1.8f;
        [Tooltip("How long the rule notice fade takes")]
        [SerializeField] private float ruleNoticeDuration = 0.6f;

        [Header("Visual Settings")]
        [Tooltip("How many pixels the title rises during entrance")]
        [SerializeField] private float titleRiseAmount = 15f;
        [Tooltip("How many pixels each button slides up during entrance")]
        [SerializeField] private float buttonSlideAmount = 10f;
        [Tooltip("Golden glow color for the title sweep")]
        [SerializeField] private Color goldenGlowColor = new Color(1f, 0.85f, 0.35f);
        [Tooltip("Maximum glow alpha during the sweep")]
        [SerializeField] private float glowMaxAlpha = 0.3f;

        [Header("Reduced Motion")]
        [Tooltip("If true, skip parallax and continuous animation; only do simple fades")]
        [SerializeField] private bool reducedMotion = false;

        private bool _isAnimating = false;
        private Coroutine _entranceCoroutine;
        private Coroutine _mistCoroutine;
        private Coroutine _fireflyCoroutine;

        /// <summary>
        /// Start the menu entrance animation. Call this when the menu becomes visible.
        /// </summary>
        public void PlayEntrance()
        {
            if (_isAnimating) return;
            _isAnimating = true;

            // STEP 70: Diagnostic logging to verify references are bound
            Debug.Log($"<color=#FFD700><b>[MainMenuAnimator]</b></color> PlayEntrance called - titleText={(titleText != null ? "OK" : "NULL")}, subtitleText={(subtitleText != null ? "OK" : "NULL")}, menuContainer={(menuContainer != null ? "OK" : "NULL")}, ruleNoticeText={(ruleNoticeText != null ? "OK" : "NULL")}");

            // Hide everything initially
            SetAlpha(titleText, 0f);
            SetAlpha(subtitleText, 0f);
            if (ruleNoticeText != null) SetAlpha(ruleNoticeText, 0f);
            if (menuContainer != null)
            {
                for (int i = 0; i < menuContainer.childCount; i++)
                {
                    var btn = menuContainer.GetChild(i).GetComponent<Button>();
                    if (btn != null)
                    {
                        var label = btn.GetComponentInChildren<Text>(true);
                        if (label != null) SetAlpha(label, 0f);
                        var bg = menuContainer.GetChild(i).GetComponent<Image>();
                        if (bg != null) SetImageAlpha(bg, 0f);
                    }
                }
            }

            // Hide background layers initially
            if (menuMistLayer1 != null) menuMistLayer1.SetActive(false);
            if (menuMistLayer2 != null) menuMistLayer2.SetActive(false);
            if (menuFireflies != null) menuFireflies.SetActive(false);

            if (_entranceCoroutine != null) StopCoroutine(_entranceCoroutine);
            _entranceCoroutine = StartCoroutine(EntranceSequence());

            // Start continuous background animation after entrance
            if (!reducedMotion)
            {
                if (_mistCoroutine != null) StopCoroutine(_mistCoroutine);
                _mistCoroutine = StartCoroutine(MistDrift());
                if (_fireflyCoroutine != null) StopCoroutine(_fireflyCoroutine);
                _fireflyCoroutine = StartCoroutine(FireflyFloat());
            }
        }

        private IEnumerator EntranceSequence()
        {
            float elapsed = 0f;

            while (_isAnimating)
            {
                elapsed += Time.unscaledDeltaTime;

                // 1. Title fade in + rise + golden glow sweep
                if (elapsed >= titleStartDelay)
                {
                    float titleElapsed = elapsed - titleStartDelay;
                    float t = Mathf.Clamp01(titleElapsed / titleDuration);
                    t = SmoothStep(t);

                    if (titleText != null)
                    {
                        // Fade in
                        float alpha = t;
                        // Golden glow sweep: peak at 50% of animation, then settle
                        float glowT = titleElapsed < titleDuration * 0.5f
                            ? titleElapsed / (titleDuration * 0.5f)
                            : 1f - (titleElapsed - titleDuration * 0.5f) / (titleDuration * 0.5f);
                        glowT = Mathf.Clamp01(glowT);
                        float glowAlpha = glowT * glowMaxAlpha;

                        Color titleColor = goldenGlowColor;
                        titleColor.a = alpha;
                        titleText.color = titleColor;

                        // Rise upward
                        var rect = titleText.GetComponent<RectTransform>();
                        if (rect != null)
                        {
                            rect.anchoredPosition = new Vector2(0f, -titleRiseAmount * (1f - t));
                        }
                    }
                }

                // 2. Subtitle fade in
                if (elapsed >= subtitleStartDelay)
                {
                    float subElapsed = elapsed - subtitleStartDelay;
                    float t = Mathf.Clamp01(subElapsed / subtitleDuration);
                    t = SmoothStep(t);

                    if (subtitleText != null)
                    {
                        Color subColor = subtitleText.color;
                        subColor.a = t * 0.8f;
                        subtitleText.color = subColor;
                    }
                }

                // 3. Buttons staggered entrance
                if (elapsed >= buttonsStartDelay && menuContainer != null)
                {
                    for (int i = 0; i < menuContainer.childCount; i++)
                    {
                        float btnDelay = buttonsStartDelay + i * buttonStagger;
                        if (elapsed >= btnDelay)
                        {
                            float btnElapsed = elapsed - btnDelay;
                            float t = Mathf.Clamp01(btnElapsed / buttonDuration);
                            t = SmoothStep(t);

                            var child = menuContainer.GetChild(i);
                            var label = child.GetComponentInChildren<Text>(true);
                            if (label != null)
                            {
                                Color labelColor = label.color;
                                labelColor.a = t;
                                label.color = labelColor;
                            }
                            var bg = child.GetComponent<Image>();
                            if (bg != null)
                            {
                                Color bgColor = bg.color;
                                bgColor.a = t * bgColor.a; // Preserve original button color alpha
                                bg.color = bgColor;
                            }

                            // Slide up
                            var rect = child.GetComponent<RectTransform>();
                            if (rect != null)
                            {
                                rect.anchoredPosition = new Vector2(0f, buttonSlideAmount * (1f - t));
                            }
                        }
                    }
                }

                // 4. Rule notice fade in
                if (elapsed >= ruleNoticeDelay && ruleNoticeText != null)
                {
                    float ruleElapsed = elapsed - ruleNoticeDelay;
                    float t = Mathf.Clamp01(ruleElapsed / ruleNoticeDuration);
                    t = SmoothStep(t);

                    Color ruleColor = ruleNoticeText.color;
                    ruleColor.a = t * 0.6f;
                    ruleNoticeText.color = ruleColor;
                }

                // 5. Show background layers after title appears
                if (elapsed >= titleStartDelay + 0.5f)
                {
                    if (menuMistLayer1 != null && !menuMistLayer1.activeSelf) menuMistLayer1.SetActive(true);
                    if (menuMistLayer2 != null && !menuMistLayer2.activeSelf) menuMistLayer2.SetActive(true);
                    if (menuFireflies != null && !menuFireflies.activeSelf) menuFireflies.SetActive(true);
                }

                // Check if all animations are complete
                bool allDone = true;
                if (elapsed < titleStartDelay + titleDuration + 0.1f) allDone = false;
                if (elapsed < subtitleStartDelay + subtitleDuration + 0.1f) allDone = false;
                if (menuContainer != null)
                {
                    float lastBtnTime = buttonsStartDelay + (menuContainer.childCount - 1) * buttonStagger + buttonDuration + 0.1f;
                    if (elapsed < lastBtnTime) allDone = false;
                }
                if (ruleNoticeText != null && elapsed < ruleNoticeDelay + ruleNoticeDuration + 0.1f) allDone = false;

                if (allDone)
                {
                    _isAnimating = false;
                    Debug.Log("<color=#FFD700><b>[MainMenuAnimator]</b></color> Entrance animation complete");
                    yield break;
                }

                yield return null;
            }
        }

        /// <summary>
        /// Slowly drifts mist layers for atmospheric depth.
        /// </summary>
        private IEnumerator MistDrift()
        {
            float elapsed = 0f;

            while (gameObject.activeInHierarchy)
            {
                elapsed += Time.unscaledDeltaTime;

                // Layer 1: slow horizontal drift
                if (menuMistLayer1 != null && menuMistLayer1.activeSelf)
                {
                    var rect = menuMistLayer1.GetComponent<RectTransform>();
                    if (rect != null)
                    {
                        float offset = Mathf.Sin(elapsed * 0.15f) * 30f;
                        rect.anchoredPosition = new Vector2(offset, 0f);
                    }
                }

                // Layer 2: slightly different speed and direction
                if (menuMistLayer2 != null && menuMistLayer2.activeSelf)
                {
                    var rect = menuMistLayer2.GetComponent<RectTransform>();
                    if (rect != null)
                    {
                        float offset = Mathf.Sin(elapsed * 0.1f + 1f) * 20f;
                        rect.anchoredPosition = new Vector2(offset, 0f);
                    }
                }

                yield return null;
            }
        }

        /// <summary>
        /// Floats firefly particles gently.
        /// </summary>
        private IEnumerator FireflyFloat()
        {
            float elapsed = 0f;

            while (gameObject.activeInHierarchy)
            {
                elapsed += Time.unscaledDeltaTime;

                if (menuFireflies != null && menuFireflies.activeSelf)
                {
                    var img = menuFireflies.GetComponent<Image>();
                    if (img != null)
                    {
                        // Gentle pulsing opacity
                        float pulse = 0.3f + Mathf.Sin(elapsed * 0.5f) * 0.15f;
                        Color c = img.color;
                        c.a = pulse;
                        img.color = c;
                    }

                    var rect = menuFireflies.GetComponent<RectTransform>();
                    if (rect != null)
                    {
                        float yOff = Mathf.Sin(elapsed * 0.2f) * 5f;
                        float xOff = Mathf.Sin(elapsed * 0.15f + 2f) * 8f;
                        rect.anchoredPosition = new Vector2(xOff, yOff);
                    }
                }

                yield return null;
            }
        }

        /// <summary>
        /// Stop all animations and clean up. Call before scene transitions.
        /// </summary>
        public void StopAnimations()
        {
            _isAnimating = false;
            if (_entranceCoroutine != null) { StopCoroutine(_entranceCoroutine); _entranceCoroutine = null; }
            if (_mistCoroutine != null) { StopCoroutine(_mistCoroutine); _mistCoroutine = null; }
            if (_fireflyCoroutine != null) { StopCoroutine(_fireflyCoroutine); _fireflyCoroutine = null; }
        }

        private void OnDisable()
        {
            StopAnimations();
        }

        private static void SetAlpha(Text text, float alpha)
        {
            if (text == null) return;
            Color c = text.color;
            c.a = alpha;
            text.color = c;
        }

        private static void SetImageAlpha(Image image, float alpha)
        {
            if (image == null) return;
            Color c = image.color;
            c.a = alpha;
            image.color = c;
        }

        private static float SmoothStep(float t)
        {
            return t * t * (3f - 2f * t);
        }
    }
}
