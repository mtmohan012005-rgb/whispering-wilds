using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Cinematic atmospheric animator and particle orchestrator for the PRO Login Experience.
    ///
    /// Provides AAA Dravidian sanctum aesthetics:
    /// 1. Dynamic procedural golden fireflies / sacred temple embers drifting upward with sine waft and breathing pulse.
    /// 2. Dual atmospheric drifting mist layers with subtle parallax and vertical waft.
    /// 3. Living Ken Burns camera drift and breathing scale on the Dravidian temple hero backdrop.
    /// 4. Breathing golden glow on the card top border and radial backlight.
    /// 5. Staggered, smooth entrance sequence (card slide-up ease, brand elements cascade, title shimmer).
    /// 6. Silky-smooth cross-fade panel transitions (SignIn <-> Register <-> ForgotPassword <-> ResetPassword <-> SignedIn).
    /// 7. Graceful exit transition on Back / Guest.
    ///
    /// All timing runs in unscaled real-time (Time.unscaledDeltaTime) to function seamlessly during Time.timeScale = 0 (MainMenu state).
    /// Safe execution guards ensure instant synchronous updates when running in EditMode test suites.
    /// </summary>
    public class LoginAnimator : MonoBehaviour
    {
        [Header("Background & Atmosphere")]
        [SerializeField] private Image loginBackground;
        [SerializeField] private RectTransform heroBackdrop;
        [SerializeField] private Image heroBackdropImage;
        [SerializeField] private Image backlightGlow;
        [SerializeField] private Image vignetteOverlay;
        [SerializeField] private RectTransform mistLayer1;
        [SerializeField] private Image mistImage1;
        [SerializeField] private RectTransform mistLayer2;
        [SerializeField] private Image mistImage2;
        [SerializeField] private Transform firefliesContainer;
        [SerializeField] private Sprite moteSprite;

        [Header("Brand Showcase (Left Side)")]
        [SerializeField] private CanvasGroup brandCanvasGroup;
        [SerializeField] private RectTransform brandRect;
        [SerializeField] private RectTransform appLogoRect;
        [SerializeField] private Text brandTitleText;
        [SerializeField] private Text brandTamilTitleText;
        [SerializeField] private Transform brandFeaturesGroup;

        [Header("Card Container (Right Side)")]
        [SerializeField] private CanvasGroup cardCanvasGroup;
        [SerializeField] private RectTransform cardContainerRect;
        [SerializeField] private Image cardTopBorder;
        [SerializeField] private Image cardOuterGlow;

        [Header("Animation Settings")]
        [SerializeField] private float entranceDuration = 0.50f;
        [SerializeField] private float cardRiseDistance = 28f;
        [SerializeField] private float exitDuration = 0.18f;
        [SerializeField] private float panelTransitionDuration = 0.20f;
        [SerializeField] private bool enableKenBurnsDrift = true;
        [SerializeField] private bool enableAmbientFireflies = true;
        [SerializeField] private bool reducedMotion = false;

        private class MoteData
        {
            public RectTransform rect;
            public Image image;
            public float speedY;
            public float ampX;
            public float freqX;
            public float phase;
            public float pulseSpeed;
            public float minAlpha;
            public float maxAlpha;
            public float startX;
            public float currentY;
            public Color baseColor;
        }

        private readonly List<MoteData> _fireflyMotes = new List<MoteData>();
        private bool _isInitialized;
        private bool _isEntering;
        private bool _isExiting;
        private float _ambientTime;
        private float _masterAlpha = 1f;

        private Vector2 _cardBasePos;
        private Vector2 _logoBasePos;
        private Vector2 _heroBasePos;
        private Vector2 _brandBasePos;

        private Coroutine _entranceCoroutine;
        private Coroutine _exitCoroutine;
        private Coroutine _panelTransitionCoroutine;

        private void Awake()
        {
            InitializeReferences();
        }

        private void OnEnable()
        {
            if (!_isInitialized)
            {
                InitializeReferences();
            }

            if (Application.isPlaying)
            {
                ResetVisualsToVisible();
                SpawnFirefliesIfEmpty();
            }
        }

        private void OnDisable()
        {
            StopAllRunningCoroutines();
        }

        /// <summary>
        /// Auto-discovers and caches references if not bound in the inspector.
        /// </summary>
        public void InitializeReferences()
        {
            if (_isInitialized) return;

            if (loginBackground == null)
            {
                var bgObj = transform.Find("LoginBackground");
                if (bgObj != null) loginBackground = bgObj.GetComponent<Image>();
            }

            if (heroBackdrop == null)
            {
                var heroObj = transform.Find("LoginHeroBackdrop");
                if (heroObj != null)
                {
                    heroBackdrop = heroObj.GetComponent<RectTransform>();
                    heroBackdropImage = heroObj.GetComponent<Image>();
                }
            }

            if (backlightGlow == null)
            {
                var bglowObj = transform.Find("LoginBacklight");
                if (bglowObj != null) backlightGlow = bglowObj.GetComponent<Image>();
            }

            if (vignetteOverlay == null)
            {
                var vigObj = transform.Find("LoginVignette");
                if (vigObj != null) vignetteOverlay = vigObj.GetComponent<Image>();
            }

            if (mistLayer1 == null)
            {
                var m1 = transform.Find("LoginMistLayer1");
                if (m1 != null)
                {
                    mistLayer1 = m1.GetComponent<RectTransform>();
                    mistImage1 = m1.GetComponent<Image>();
                }
            }

            if (mistLayer2 == null)
            {
                var m2 = transform.Find("LoginMistLayer2");
                if (m2 != null)
                {
                    mistLayer2 = m2.GetComponent<RectTransform>();
                    mistImage2 = m2.GetComponent<Image>();
                }
            }

            if (firefliesContainer == null)
            {
                firefliesContainer = transform.Find("LoginFireflies");
            }

            if (brandRect == null)
            {
                var bObj = transform.Find("BrandShowcase");
                if (bObj != null)
                {
                    brandRect = bObj.GetComponent<RectTransform>();
                    brandCanvasGroup = bObj.GetComponent<CanvasGroup>();
                    if (brandCanvasGroup == null) brandCanvasGroup = bObj.gameObject.AddComponent<CanvasGroup>();

                    var logoObj = bObj.Find("AppLogo");
                    if (logoObj != null) appLogoRect = logoObj.GetComponent<RectTransform>();

                    var tObj = bObj.Find("BrandTitle");
                    if (tObj != null) brandTitleText = tObj.GetComponent<Text>();

                    var ttObj = bObj.Find("BrandTamilTitle");
                    if (ttObj != null) brandTamilTitleText = ttObj.GetComponent<Text>();

                    brandFeaturesGroup = bObj.Find("FeaturesGroup") ?? bObj;
                }
            }

            if (cardContainerRect == null)
            {
                var cObj = transform.Find("CardContainer");
                if (cObj != null)
                {
                    cardContainerRect = cObj.GetComponent<RectTransform>();
                    cardCanvasGroup = cObj.GetComponent<CanvasGroup>();
                    if (cardCanvasGroup == null) cardCanvasGroup = cObj.gameObject.AddComponent<CanvasGroup>();

                    var topBorderObj = cObj.Find("CardTopBorder");
                    if (topBorderObj != null) cardTopBorder = topBorderObj.GetComponent<Image>();

                    var outerGlowObj = cObj.Find("CardOuterGlow");
                    if (outerGlowObj != null) cardOuterGlow = outerGlowObj.GetComponent<Image>();
                }
            }

            // Cache base resting positions
            if (cardContainerRect != null) _cardBasePos = cardContainerRect.anchoredPosition;
            if (appLogoRect != null) _logoBasePos = appLogoRect.anchoredPosition;
            if (heroBackdrop != null) _heroBasePos = heroBackdrop.anchoredPosition;
            if (brandRect != null) _brandBasePos = brandRect.anchoredPosition;

            _isInitialized = true;
        }

        private void Update()
        {
            if (!Application.isPlaying || reducedMotion) return;

            float dt = Time.unscaledDeltaTime;
            _ambientTime += dt;

            // 1. Ken Burns Subtle Camera Drift on Dravidian Temple Hero Backdrop
            if (enableKenBurnsDrift && heroBackdrop != null)
            {
                float zoom = 1.0f + (Mathf.Sin(_ambientTime * 0.08f) * 0.5f + 0.5f) * 0.035f;
                float driftX = Mathf.Sin(_ambientTime * 0.05f) * 12f;
                float driftY = Mathf.Cos(_ambientTime * 0.04f) * 6f;
                heroBackdrop.localScale = new Vector3(zoom, zoom, 1f);
                heroBackdrop.anchoredPosition = _heroBasePos + new Vector2(driftX, driftY);
            }

            // 2. Dual Mist Layers Horizontal Drift & Vertical Waft
            if (mistLayer1 != null)
            {
                float mx1 = Mathf.Sin(_ambientTime * 0.10f) * 40f;
                float my1 = Mathf.Cos(_ambientTime * 0.07f) * 8f;
                mistLayer1.anchoredPosition = new Vector2(mx1, my1);
            }

            if (mistLayer2 != null)
            {
                float mx2 = Mathf.Sin(_ambientTime * 0.08f + 1.8f) * -35f;
                float my2 = Mathf.Sin(_ambientTime * 0.05f + 0.5f) * 10f;
                mistLayer2.anchoredPosition = new Vector2(mx2, my2);
            }

            // 3. Card Top Border Breathing Sangam Gold Accent Pulse
            if (cardTopBorder != null)
            {
                float pulse = 0.70f + (Mathf.Sin(_ambientTime * 2.2f) * 0.5f + 0.5f) * 0.30f;
                Color c = cardTopBorder.color;
                c.a = pulse * _masterAlpha;
                cardTopBorder.color = c;
            }

            // 4. Backlight Radial Glow Breathing
            if (backlightGlow != null)
            {
                float bgPulse = 0.12f + (Mathf.Sin(_ambientTime * 1.4f) * 0.5f + 0.5f) * 0.08f;
                Color bgc = backlightGlow.color;
                bgc.a = bgPulse * _masterAlpha;
                backlightGlow.color = bgc;
            }

            // 5. App Logo Floating Breathing Hover
            if (appLogoRect != null && !_isEntering)
            {
                float hoverY = Mathf.Sin(_ambientTime * 1.5f) * 2.5f;
                appLogoRect.anchoredPosition = _logoBasePos + new Vector2(0f, hoverY);
            }

            // 6. Dynamic Floating Temple Fireflies / Golden Embers
            if (enableAmbientFireflies)
            {
                UpdateFireflies(dt);
            }
        }

        /// <summary>
        /// Plays the high-fidelity entrance sequence when the Login view opens.
        /// </summary>
        public void PlayEntrance()
        {
            if (!Application.isPlaying)
            {
                ResetVisualsToVisible();
                return;
            }

            StopAllRunningCoroutines();
            _entranceCoroutine = StartCoroutine(EntranceSequence());
        }

        private IEnumerator EntranceSequence()
        {
            _isEntering = true;
            _isExiting = false;
            _masterAlpha = 0f;

            // Set initial invisible states
            if (brandCanvasGroup != null) brandCanvasGroup.alpha = 0f;
            if (cardCanvasGroup != null) cardCanvasGroup.alpha = 0f;
            if (cardContainerRect != null)
            {
                cardContainerRect.anchoredPosition = _cardBasePos - new Vector2(0f, cardRiseDistance);
            }
            if (brandRect != null)
            {
                brandRect.anchoredPosition = _brandBasePos - new Vector2(0f, cardRiseDistance);
            }
            if (appLogoRect != null)
            {
                appLogoRect.localScale = Vector3.one * 0.92f;
            }

            float elapsed = 0f;
            while (elapsed < entranceDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = Mathf.Clamp01(elapsed / entranceDuration);
                float easeOutCubic = 1f - Mathf.Pow(1f - t, 3f);
                float smooth = SmoothStep(t);

                _masterAlpha = smooth;

                // 1. Fade & slide card container upward
                if (cardCanvasGroup != null)
                {
                    cardCanvasGroup.alpha = smooth;
                }
                if (cardContainerRect != null)
                {
                    float y = Mathf.Lerp(_cardBasePos.y - cardRiseDistance, _cardBasePos.y, easeOutCubic);
                    cardContainerRect.anchoredPosition = new Vector2(_cardBasePos.x, y);
                }

                // 2. Fade & slide brand showcase upward
                if (brandCanvasGroup != null)
                {
                    brandCanvasGroup.alpha = smooth;
                }
                if (brandRect != null)
                {
                    float y = Mathf.Lerp(_brandBasePos.y - cardRiseDistance, _brandBasePos.y, easeOutCubic);
                    brandRect.anchoredPosition = new Vector2(_brandBasePos.x, y);
                }

                // 3. Logo gentle scale in
                if (appLogoRect != null)
                {
                    float s = Mathf.Lerp(0.92f, 1f, easeOutCubic);
                    appLogoRect.localScale = new Vector3(s, s, 1f);
                }

                yield return null;
            }

            // Snap cleanly to final state
            ResetVisualsToVisible();
            _isEntering = false;
            _entranceCoroutine = null;
        }

        /// <summary>
        /// Plays smooth exit animation on Back or Guest Mode click, then executes callback.
        /// </summary>
        public void PlayExit(Action onComplete)
        {
            if (!Application.isPlaying || reducedMotion)
            {
                onComplete?.Invoke();
                return;
            }

            if (_isExiting) return;

            StopAllRunningCoroutines();
            _exitCoroutine = StartCoroutine(ExitSequence(onComplete));
        }

        private IEnumerator ExitSequence(Action onComplete)
        {
            _isExiting = true;
            _isEntering = false;

            float elapsed = 0f;
            float startAlpha = _masterAlpha;
            Vector2 cardCurrentPos = cardContainerRect != null ? cardContainerRect.anchoredPosition : _cardBasePos;
            Vector2 brandCurrentPos = brandRect != null ? brandRect.anchoredPosition : _brandBasePos;

            while (elapsed < exitDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = Mathf.Clamp01(elapsed / exitDuration);
                float easeInQuad = t * t;
                float currentAlpha = Mathf.Lerp(startAlpha, 0f, t);

                _masterAlpha = currentAlpha;

                if (cardCanvasGroup != null) cardCanvasGroup.alpha = currentAlpha;
                if (brandCanvasGroup != null) brandCanvasGroup.alpha = currentAlpha;
                if (cardContainerRect != null)
                {
                    float y = Mathf.Lerp(cardCurrentPos.y, cardCurrentPos.y - 12f, easeInQuad);
                    cardContainerRect.anchoredPosition = new Vector2(cardCurrentPos.x, y);
                }
                if (brandRect != null)
                {
                    float y = Mathf.Lerp(brandCurrentPos.y, brandCurrentPos.y - 12f, easeInQuad);
                    brandRect.anchoredPosition = new Vector2(brandCurrentPos.x, y);
                }

                yield return null;
            }

            _isExiting = false;
            _exitCoroutine = null;
            onComplete?.Invoke();
        }

        /// <summary>
        /// Smoothly crossfades and slides a newly active panel in.
        /// </summary>
        public void AnimatePanelEntrance(GameObject targetPanel)
        {
            if (targetPanel == null) return;

            if (!Application.isPlaying || reducedMotion)
            {
                var cg = targetPanel.GetComponent<CanvasGroup>();
                if (cg != null) cg.alpha = 1f;
                return;
            }

            var canvasGroup = targetPanel.GetComponent<CanvasGroup>();
            if (canvasGroup == null) canvasGroup = targetPanel.AddComponent<CanvasGroup>();

            var rect = targetPanel.GetComponent<RectTransform>();

            if (_panelTransitionCoroutine != null) StopCoroutine(_panelTransitionCoroutine);
            _panelTransitionCoroutine = StartCoroutine(PanelFadeInCoroutine(canvasGroup, rect));
        }

        private IEnumerator PanelFadeInCoroutine(CanvasGroup cg, RectTransform rect)
        {
            cg.alpha = 0f;
            Vector2 originalPos = rect != null ? rect.anchoredPosition : Vector2.zero;
            Vector2 startPos = originalPos + new Vector2(12f, 0f);

            if (rect != null) rect.anchoredPosition = startPos;

            float elapsed = 0f;
            while (elapsed < panelTransitionDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = Mathf.Clamp01(elapsed / panelTransitionDuration);
                float easeOut = 1f - Mathf.Pow(1f - t, 2f);

                cg.alpha = easeOut;
                if (rect != null)
                {
                    rect.anchoredPosition = Vector2.Lerp(startPos, originalPos, easeOut);
                }

                yield return null;
            }

            cg.alpha = 1f;
            if (rect != null) rect.anchoredPosition = originalPos;
            _panelTransitionCoroutine = null;
        }

        public void ResetVisualsToVisible()
        {
            _masterAlpha = 1f;
            if (brandCanvasGroup != null) brandCanvasGroup.alpha = 1f;
            if (cardCanvasGroup != null) cardCanvasGroup.alpha = 1f;
            if (cardContainerRect != null) cardContainerRect.anchoredPosition = _cardBasePos;
            if (brandRect != null) brandRect.anchoredPosition = _brandBasePos;
            if (appLogoRect != null)
            {
                appLogoRect.anchoredPosition = _logoBasePos;
                appLogoRect.localScale = Vector3.one;
            }
        }

        private void SpawnFirefliesIfEmpty()
        {
            if (firefliesContainer == null)
            {
                var fObj = new GameObject("LoginFireflies", typeof(RectTransform));
                fObj.transform.SetParent(transform, false);
                fObj.transform.SetSiblingIndex(2); // Place right in front of hero backdrop
                firefliesContainer = fObj.transform;
                var rt = fObj.GetComponent<RectTransform>();
                rt.anchorMin = Vector2.zero;
                rt.anchorMax = Vector2.one;
                rt.offsetMin = Vector2.zero;
                rt.offsetMax = Vector2.zero;
            }

            if (_fireflyMotes.Count > 0) return;

            // Check if existing children exist
            if (firefliesContainer.childCount > 0)
            {
                for (int i = 0; i < firefliesContainer.childCount; i++)
                {
                    var child = firefliesContainer.GetChild(i);
                    var img = child.GetComponent<Image>();
                    var rt = child.GetComponent<RectTransform>();
                    if (img != null && rt != null)
                    {
                        AddMoteData(rt, img, i);
                    }
                }
                return;
            }

            // Procedurally spawn 25 golden firefly particles
            Color[] goldPalette = new Color[]
            {
                new Color(1f, 0.92f, 0.50f, 0.85f),  // Bright Radiant Gold
                new Color(0.96f, 0.78f, 0.28f, 0.80f), // Warm Temple Amber
                new Color(1f, 1f, 0.88f, 0.90f),      // Pure Sanctum Spark
                new Color(0.88f, 0.68f, 0.24f, 0.75f), // Antique Sangam Gold
                new Color(0.65f, 0.96f, 0.78f, 0.70f)  // Shola Green Ambient Spark
            };

            for (int i = 0; i < 25; i++)
            {
                var moteObj = new GameObject($"Firefly_{i:00}", typeof(RectTransform), typeof(Image));
                moteObj.transform.SetParent(firefliesContainer, false);
                var rt = moteObj.GetComponent<RectTransform>();
                var img = moteObj.GetComponent<Image>();
                img.raycastTarget = false;
                if (moteSprite != null) img.sprite = moteSprite;

                float size = UnityEngine.Random.Range(8f, 20f);
                rt.sizeDelta = new Vector2(size, size);

                Color col = goldPalette[i % goldPalette.Length];
                img.color = col;

                float startX = UnityEngine.Random.Range(-900f, 900f);
                float startY = UnityEngine.Random.Range(-500f, 500f);
                rt.anchoredPosition = new Vector2(startX, startY);

                AddMoteData(rt, img, i);
            }
        }

        private void AddMoteData(RectTransform rt, Image img, int seed)
        {
            float startX = rt.anchoredPosition.x;
            float startY = rt.anchoredPosition.y;

            var mote = new MoteData
            {
                rect = rt,
                image = img,
                speedY = UnityEngine.Random.Range(18f, 42f),
                ampX = UnityEngine.Random.Range(15f, 35f),
                freqX = UnityEngine.Random.Range(0.4f, 0.9f),
                phase = (seed * 1.37f) % (Mathf.PI * 2f),
                pulseSpeed = UnityEngine.Random.Range(1.2f, 2.5f),
                minAlpha = UnityEngine.Random.Range(0.20f, 0.40f),
                maxAlpha = UnityEngine.Random.Range(0.75f, 1.0f),
                startX = startX,
                currentY = startY,
                baseColor = img.color
            };

            _fireflyMotes.Add(mote);
        }

        private void UpdateFireflies(float dt)
        {
            if (_fireflyMotes == null || _fireflyMotes.Count == 0) return;

            float screenTop = 550f;
            float screenBottom = -550f;

            for (int i = 0; i < _fireflyMotes.Count; i++)
            {
                var mote = _fireflyMotes[i];
                if (mote.rect == null || mote.image == null) continue;

                // Drift upward
                mote.currentY += mote.speedY * dt;

                // Horizontal sine waft
                float xOff = Mathf.Sin(_ambientTime * mote.freqX + mote.phase) * mote.ampX;
                mote.rect.anchoredPosition = new Vector2(mote.startX + xOff, mote.currentY);

                // Breathing pulse alpha
                float pulse = mote.minAlpha + (Mathf.Sin(_ambientTime * mote.pulseSpeed + mote.phase) * 0.5f + 0.5f) * (mote.maxAlpha - mote.minAlpha);
                Color c = mote.baseColor;
                c.a = pulse * _masterAlpha;
                mote.image.color = c;

                // Recycle to bottom when passing top of screen
                if (mote.currentY > screenTop)
                {
                    mote.currentY = screenBottom - UnityEngine.Random.Range(10f, 60f);
                    mote.startX = UnityEngine.Random.Range(-920f, 920f);
                }
            }
        }

        private void StopAllRunningCoroutines()
        {
            if (_entranceCoroutine != null) { StopCoroutine(_entranceCoroutine); _entranceCoroutine = null; }
            if (_exitCoroutine != null) { StopCoroutine(_exitCoroutine); _exitCoroutine = null; }
            if (_panelTransitionCoroutine != null) { StopCoroutine(_panelTransitionCoroutine); _panelTransitionCoroutine = null; }
        }

        private static float SmoothStep(float t)
        {
            return t * t * (3f - 2f * t);
        }
    }
}
