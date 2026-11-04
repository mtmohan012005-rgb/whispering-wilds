using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.InputSystem;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Professional Cinematic Animated Main Menu Background & Entrance Controller.
    ///
    /// Inspired by Tamil Nadu's ancient Dravidian temple architecture and golden-hour heritage:
    /// - Slow cinematic background drift & camera zoom
    /// - Interactive gentle mouse parallax across depth layers
    /// - Drifting atmospheric mist layers
    /// - Subtle floating fireflies / golden temple motes
    /// - Soft animated golden dawn light rays
    /// - Atmospheric vignette breathing
    /// - Smooth panel transition fades
    /// - Reduced motion accessibility support
    ///
    /// Operates on unscaled real time so animations run fluidly even when Time.timeScale = 0.
    /// </summary>
    [DisallowMultipleComponent]
    public class MainMenuAnimator : MonoBehaviour
    {
        [Header("Menu Elements")]
        [SerializeField] private Text titleText;
        [SerializeField] private Text subtitleText;
        [SerializeField] private Transform menuContainer;
        [SerializeField] private Text ruleNoticeText;
        [SerializeField] private GameObject accountControl;
        [SerializeField] private Text footerText;

        [Header("Background & Atmosphere Layers")]
        [SerializeField] private Image menuBackground;
        [SerializeField] private GameObject menuMistLayer1;
        [SerializeField] private GameObject menuMistLayer2;
        [SerializeField] private GameObject menuFireflies;
        [SerializeField] private GameObject menuLightRays;
        [SerializeField] private Image menuVignette;
        [SerializeField] private Image menuDimOverlay;

        [Header("Timing")]
        [SerializeField] private float titleStartDelay = 0.2f;
        [SerializeField] private float titleDuration = 1.2f;
        [SerializeField] private float subtitleStartDelay = 0.6f;
        [SerializeField] private float subtitleDuration = 0.8f;
        [SerializeField] private float buttonsStartDelay = 1.1f;
        [SerializeField] private float buttonStagger = 0.08f;
        [SerializeField] private float buttonDuration = 0.45f;
        [SerializeField] private float ruleNoticeDelay = 1.6f;
        [SerializeField] private float ruleNoticeDuration = 0.6f;

        [Header("Visual Effects")]
        [SerializeField] private float titleRiseAmount = 18f;
        [SerializeField] private float buttonSlideAmount = 12f;
        [SerializeField] private Color goldenGlowColor = new Color(1f, 0.85f, 0.35f, 1f);
        [SerializeField] private float glowMaxAlpha = 0.35f;
        [SerializeField] private bool enableParallax = true;
        [SerializeField] private float parallaxStrength = 16f;

        [Header("Reduced Motion Option")]
        [SerializeField] private bool reducedMotion = false;

        public bool ReducedMotion
        {
            get => reducedMotion;
            set
            {
                reducedMotion = value;
                if (reducedMotion) ResetLayerTransforms();
            }
        }

        private bool _isAnimating = false;
        private Coroutine _entranceCoroutine;
        private Coroutine _backgroundAtmosphereCoroutine;

        private Vector2 _screenCenter;
        private Vector2 _currentParallaxOffset = Vector2.zero;
        private RectTransform _bgRect;
        private RectTransform _mist1Rect;
        private RectTransform _mist2Rect;
        private RectTransform _firefliesRect;
        private RectTransform _lightRaysRect;
        private Vector2 _initialTitlePos;
        private Vector2 _initialSubtitlePos;

        private void Awake()
        {
            _screenCenter = new Vector2(Screen.width * 0.5f, Screen.height * 0.5f);
            CacheRectTransforms();
        }

        private void Update()
        {
            Vector2 mousePos;
#if ENABLE_INPUT_SYSTEM
            mousePos = Mouse.current != null ? Mouse.current.position.ReadValue() : new Vector2(Screen.width / 2f, Screen.height / 2f);
#else
            mousePos = Input.mousePosition;
#endif

            if (enableParallax && !reducedMotion && _screenCenter.x > 0f && _screenCenter.y > 0f)
            {
                float normalizedX = Mathf.Clamp((mousePos.x - _screenCenter.x) / _screenCenter.x, -1f, 1f);
                float normalizedY = Mathf.Clamp((mousePos.y - _screenCenter.y) / _screenCenter.y, -1f, 1f);
                Vector2 targetParallax = new Vector2(normalizedX * parallaxStrength, normalizedY * parallaxStrength * 0.6f);
                _currentParallaxOffset = Vector2.Lerp(_currentParallaxOffset, targetParallax, Time.unscaledDeltaTime * 2.5f);
            }
        }

        private void CacheRectTransforms()
        {
            if (menuBackground != null) _bgRect = menuBackground.GetComponent<RectTransform>();
            if (menuMistLayer1 != null) _mist1Rect = menuMistLayer1.GetComponent<RectTransform>();
            if (menuMistLayer2 != null) _mist2Rect = menuMistLayer2.GetComponent<RectTransform>();
            if (menuFireflies != null) _firefliesRect = menuFireflies.GetComponent<RectTransform>();
            if (menuLightRays != null) _lightRaysRect = menuLightRays.GetComponent<RectTransform>();
            if (titleText != null) _initialTitlePos = titleText.rectTransform.anchoredPosition;
            if (subtitleText != null) _initialSubtitlePos = subtitleText.rectTransform.anchoredPosition;

            if (accountControl == null && menuContainer != null && menuContainer.parent != null)
            {
                var acc = menuContainer.parent.Find("AccountControl");
                if (acc != null) accountControl = acc.gameObject;
            }
            if (footerText == null && menuContainer != null && menuContainer.parent != null)
            {
                var ft = menuContainer.parent.Find("FooterText");
                if (ft != null) footerText = ft.GetComponent<Text>();
            }
        }

        public void ResetAnimationState()
        {
            _isAnimating = false;
            if (_entranceCoroutine != null)
            {
                StopCoroutine(_entranceCoroutine);
                _entranceCoroutine = null;
            }

            CacheRectTransforms();

            if (titleText != null)
            {
                SetAlpha(titleText, 0f);
                titleText.rectTransform.anchoredPosition = _initialTitlePos + new Vector2(0f, -titleRiseAmount);
            }
            if (subtitleText != null)
            {
                SetAlpha(subtitleText, 0f);
            }
            if (ruleNoticeText != null)
            {
                SetAlpha(ruleNoticeText, 0f);
            }
            if (footerText != null)
            {
                SetAlpha(footerText, 0f);
            }
            if (accountControl != null)
            {
                var cg = accountControl.GetComponent<CanvasGroup>();
                if (cg == null) cg = accountControl.AddComponent<CanvasGroup>();
                cg.alpha = 0f;
            }

            if (menuContainer != null)
            {
                for (int i = 0; i < menuContainer.childCount; i++)
                {
                    var child = menuContainer.GetChild(i);
                    var label = child.GetComponentInChildren<Text>(true);
                    if (label != null) SetAlpha(label, 0f);
                    var bg = child.GetComponent<Image>();
                    if (bg != null) SetImageAlpha(bg, 0f);
                    var rect = child.GetComponent<RectTransform>();
                    if (rect != null)
                    {
                        rect.anchoredPosition = new Vector2(0f, buttonSlideAmount);
                    }
                }
            }
        }

        public void PlayEntrance()
        {
            if (_isAnimating) return;
            _isAnimating = true;

            ResetAnimationState();
            _isAnimating = true;

            Debug.Log($"<color=#FFD700><b>[MainMenuAnimator]</b></color> PlayEntrance: title={(titleText != null)}, bg={(menuBackground != null)}, container={(menuContainer != null)}");

            // Enable atmospheric layers
            if (menuMistLayer1 != null) menuMistLayer1.SetActive(true);
            if (menuMistLayer2 != null) menuMistLayer2.SetActive(true);
            if (menuFireflies != null) menuFireflies.SetActive(true);
            if (menuLightRays != null) menuLightRays.SetActive(true);

            if (_entranceCoroutine != null) StopCoroutine(_entranceCoroutine);
            _entranceCoroutine = StartCoroutine(EntranceSequence());

            if (_backgroundAtmosphereCoroutine != null) StopCoroutine(_backgroundAtmosphereCoroutine);
            _backgroundAtmosphereCoroutine = StartCoroutine(BackgroundAtmosphereLoop());
        }

        private IEnumerator EntranceSequence()
        {
            float elapsed = 0f;

            float accountDelay = buttonsStartDelay + (menuContainer != null ? menuContainer.childCount * buttonStagger : 0.5f) + 0.1f;
            float footerDelay = accountDelay + 0.15f;

            while (_isAnimating)
            {
                elapsed += Time.unscaledDeltaTime;

                // 1. Title fade in & rise
                if (elapsed >= titleStartDelay && titleText != null)
                {
                    float t = Mathf.Clamp01((elapsed - titleStartDelay) / titleDuration);
                    t = SmoothStep(t);

                    Color c = goldenGlowColor;
                    c.a = t;
                    titleText.color = c;

                    var rect = titleText.GetComponent<RectTransform>();
                    if (rect != null)
                    {
                        rect.anchoredPosition = _initialTitlePos + new Vector2(0f, -titleRiseAmount * (1f - t));
                    }
                }

                // 2. Subtitle fade in
                if (elapsed >= subtitleStartDelay && subtitleText != null)
                {
                    float t = Mathf.Clamp01((elapsed - subtitleStartDelay) / subtitleDuration);
                    t = SmoothStep(t);

                    Color c = subtitleText.color;
                    c.a = t * 0.9f;
                    subtitleText.color = c;
                }

                // 3. Staggered button entrance
                if (elapsed >= buttonsStartDelay && menuContainer != null)
                {
                    for (int i = 0; i < menuContainer.childCount; i++)
                    {
                        float btnDelay = buttonsStartDelay + i * buttonStagger;
                        if (elapsed >= btnDelay)
                        {
                            float t = Mathf.Clamp01((elapsed - btnDelay) / buttonDuration);
                            t = SmoothStep(t);

                            var child = menuContainer.GetChild(i);
                            var label = child.GetComponentInChildren<Text>(true);
                            if (label != null)
                            {
                                Color lc = label.color;
                                lc.a = t;
                                label.color = lc;
                            }
                            var bg = child.GetComponent<Image>();
                            if (bg != null)
                            {
                                Color bc = bg.color;
                                bc.a = t * 0.95f;
                                bg.color = bc;
                            }

                            var rect = child.GetComponent<RectTransform>();
                            if (rect != null)
                            {
                                rect.anchoredPosition = new Vector2(0f, buttonSlideAmount * (1f - t));
                            }
                        }
                    }
                }

                // 4. Account badge fade in
                if (elapsed >= accountDelay && accountControl != null)
                {
                    float t = Mathf.Clamp01((elapsed - accountDelay) / 0.45f);
                    t = SmoothStep(t);
                    var cg = accountControl.GetComponent<CanvasGroup>();
                    if (cg != null) cg.alpha = t;
                }

                // 5. Footer & rule notice fade in
                if (elapsed >= footerDelay)
                {
                    float t = Mathf.Clamp01((elapsed - footerDelay) / ruleNoticeDuration);
                    t = SmoothStep(t);
                    if (footerText != null)
                    {
                        Color fc = footerText.color;
                        fc.a = t * 0.75f;
                        footerText.color = fc;
                    }
                    if (ruleNoticeText != null)
                    {
                        Color rc = ruleNoticeText.color;
                        rc.a = t * 0.65f;
                        ruleNoticeText.color = rc;
                    }
                }

                // Completion check
                float totalTime = footerDelay + ruleNoticeDuration + 0.1f;
                if (elapsed >= totalTime)
                {
                    _isAnimating = false;
                    Debug.Log("<color=#00FF88><b>[MainMenuAnimator]</b></color> Entrance sequence completed.");
                    yield break;
                }

                yield return null;
            }
        }

        private IEnumerator BackgroundAtmosphereLoop()
        {
            float elapsed = 0f;

            while (gameObject.activeInHierarchy)
            {
                elapsed += Time.unscaledDeltaTime;

                if (!reducedMotion)
                {
                    // Parallax offset is computed in Update() using New Input System Mouse.current / fallback
                    // 1. Background Camera Drift & Subtle Zoom Breathing
                    if (_bgRect != null)
                    {
                        float zoom = 1.025f + Mathf.Sin(elapsed * 0.08f) * 0.025f;
                        float panX = Mathf.Sin(elapsed * 0.05f) * 8f - _currentParallaxOffset.x * 0.3f;
                        float panY = Mathf.Cos(elapsed * 0.04f) * 5f - _currentParallaxOffset.y * 0.3f;

                        _bgRect.localScale = new Vector3(zoom, zoom, 1f);
                        _bgRect.anchoredPosition = new Vector2(panX, panY);
                    }

                    // 2. Mist Layer 1: Slow horizontal drifting
                    if (_mist1Rect != null)
                    {
                        float mistX = Mathf.Sin(elapsed * 0.12f) * 40f + _currentParallaxOffset.x * 0.6f;
                        float mistY = Mathf.Cos(elapsed * 0.08f) * 8f + _currentParallaxOffset.y * 0.6f;
                        _mist1Rect.anchoredPosition = new Vector2(mistX, mistY);

                        var img1 = menuMistLayer1.GetComponent<Image>();
                        if (img1 != null)
                        {
                            Color c = img1.color;
                            c.a = 0.28f + Mathf.Sin(elapsed * 0.25f) * 0.08f;
                            img1.color = c;
                        }
                    }

                    // 3. Mist Layer 2: Counter-drifting
                    if (_mist2Rect != null)
                    {
                        float mistX2 = Mathf.Cos(elapsed * 0.09f + 1.2f) * 35f - _currentParallaxOffset.x * 0.8f;
                        float mistY2 = Mathf.Sin(elapsed * 0.07f) * 10f - _currentParallaxOffset.y * 0.8f;
                        _mist2Rect.anchoredPosition = new Vector2(mistX2, mistY2);

                        var img2 = menuMistLayer2.GetComponent<Image>();
                        if (img2 != null)
                        {
                            Color c = img2.color;
                            c.a = 0.22f + Mathf.Cos(elapsed * 0.2f) * 0.06f;
                            img2.color = c;
                        }
                    }

                    // 4. Fireflies / Golden Motes: Floating and gently pulsing
                    if (_firefliesRect != null)
                    {
                        float fireflyX = Mathf.Sin(elapsed * 0.18f + 2f) * 15f + _currentParallaxOffset.x * 1.2f;
                        float fireflyY = Mathf.Sin(elapsed * 0.22f) * 12f + _currentParallaxOffset.y * 1.2f;
                        _firefliesRect.anchoredPosition = new Vector2(fireflyX, fireflyY);

                        var imgF = menuFireflies.GetComponent<Image>();
                        if (imgF != null)
                        {
                            Color c = imgF.color;
                            c.a = 0.45f + Mathf.Sin(elapsed * 0.6f) * 0.2f;
                            imgF.color = c;
                        }
                    }

                    // 5. Light Rays: Soft golden pulsation
                    if (_lightRaysRect != null)
                    {
                        float rayPulse = 0.25f + Mathf.Sin(elapsed * 0.35f) * 0.12f;
                        var imgR = menuLightRays.GetComponent<Image>();
                        if (imgR != null)
                        {
                            Color c = imgR.color;
                            c.a = rayPulse;
                            imgR.color = c;
                        }
                    }

                    // 6. Vignette: Gentle ambient breathing
                    if (menuVignette != null)
                    {
                        float vigAlpha = 0.5f + Mathf.Sin(elapsed * 0.15f) * 0.05f;
                        Color c = menuVignette.color;
                        c.a = vigAlpha;
                        menuVignette.color = c;
                    }
                }
                else
                {
                    // Reduced motion mode: static positioning, minimal subtle alpha pulsation only
                    if (menuVignette != null)
                    {
                        Color c = menuVignette.color;
                        c.a = 0.5f;
                        menuVignette.color = c;
                    }
                }

                yield return null;
            }
        }

        public void TransitionToPanel(GameObject targetPanel)
        {
            if (targetPanel != null)
            {
                targetPanel.SetActive(true);
            }
            if (menuDimOverlay != null)
            {
                StartCoroutine(FadeImageAlpha(menuDimOverlay, 0f, 0.65f, 0.25f));
            }
        }

        public void TransitionFromPanel(GameObject currentPanel)
        {
            if (currentPanel != null)
            {
                currentPanel.SetActive(false);
            }
            if (menuDimOverlay != null)
            {
                StartCoroutine(FadeImageAlpha(menuDimOverlay, 0.65f, 0f, 0.25f));
            }
        }

        private IEnumerator FadeImageAlpha(Image img, float from, float to, float duration)
        {
            if (img == null) yield break;
            img.gameObject.SetActive(true);

            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                Color c = img.color;
                c.a = Mathf.Lerp(from, to, t);
                img.color = c;
                yield return null;
            }

            if (to <= 0f) img.gameObject.SetActive(false);
        }

        private void ResetLayerTransforms()
        {
            if (_bgRect != null)
            {
                _bgRect.localScale = Vector3.one;
                _bgRect.anchoredPosition = Vector2.zero;
            }
            if (_mist1Rect != null) _mist1Rect.anchoredPosition = Vector2.zero;
            if (_mist2Rect != null) _mist2Rect.anchoredPosition = Vector2.zero;
            if (_firefliesRect != null) _firefliesRect.anchoredPosition = Vector2.zero;
            if (_lightRaysRect != null) _lightRaysRect.anchoredPosition = Vector2.zero;
        }

        public void StopAnimations()
        {
            _isAnimating = false;
            if (_entranceCoroutine != null) { StopCoroutine(_entranceCoroutine); _entranceCoroutine = null; }
            if (_backgroundAtmosphereCoroutine != null) { StopCoroutine(_backgroundAtmosphereCoroutine); _backgroundAtmosphereCoroutine = null; }
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
