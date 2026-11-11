using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif
using WhisperingWilds.Audio;
using WhisperingWilds.Localization;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// AAA PREMIUM CINEMATIC INTRO & TITLE SCREEN CONTROLLER
    /// for The Whispering Wilds (காட்டு வழி • தடம்).
    /// 
    /// Launch Experience Sequence:
    /// 1. Fade from black: Tamil Nadu dawn sky gradient & mountain horizons.
    /// 2. Morning birds & distant jungle ambience begin playing.
    /// 3. Ancient Dravidian temple sanctum emerges from the morning mist.
    /// 4. Resonant temple bell chimes as granite Gopuram architecture is unveiled (t ~ 1.6s).
    /// 5. Volumetric light, floating golden dust motes, and layered mist drift across depth.
    /// 6. Centered Animated Title Card fades in at true screen center:
    ///    - "THE WHISPERING WILDS" in radiant antique gold.
    ///    - "காட்டு வழி • தடம்" in soft celadon green shortly after.
    ///    - Antique gold radial halo and floating golden motes.
    /// 7. START Button appears beneath the title card with dark obsidian glass and gold border.
    ///    - Hover scale/glow, click audio feedback.
    /// 8. Player clicks START (or presses Enter/Space/Gamepad South):
    ///    - Title card smoothly fades away.
    ///    - Reveals the Complete Main Menu with full navigation.
    /// 
    /// Skip Intro Option:
    /// - Clearly visible "Skip Intro" option during the intro.
    /// - Skipping transitions smoothly and immediately to the Centered Title Card + START button.
    /// 
    /// Operates on unscaled real time so animations advance smoothly even when Time.timeScale = 0.
    /// </summary>
    public class CinematicIntroController : MonoBehaviour
    {
        [Header("Intro Visuals")]
        [SerializeField] private GameObject introBackground;
        [SerializeField] private GameObject introVignette;
        [SerializeField] private GameObject introTitleGroup;
        [SerializeField] private Text introTitleText;
        [SerializeField] private Text introSubtitleText;
        [SerializeField] private Text introSkipText;

        [Header("Title Screen & START Button")]
        [SerializeField] private Button startButton;
        [SerializeField] private CanvasGroup titleCardCanvasGroup;
        [SerializeField] private Image titleBackGlow;
        [SerializeField] private GameObject titleCardContainer;
        [SerializeField] private Button introSkipButton;

        [Header("STEP 69 — Additional Visual Layers")]
        [SerializeField] private GameObject introSkyGradient;
        [SerializeField] private GameObject introTreeline;
        [SerializeField] private GameObject introTempleLayer;
        [SerializeField] private GameObject introMist;

        [Header("Timing")]
        // Historical default totalDuration = 7f; tuned to 9.5f for smooth cinematic pacing
        [Tooltip("Total duration of the cinematic intro in seconds")]
        [SerializeField] private float totalDuration = 9.5f;
        [Tooltip("Time when title starts fading in")]
        [SerializeField] private float titleFadeInStart = 1.5f;
        [Tooltip("Time when title is fully visible")]
        [SerializeField] private float titleFadeInEnd = 3f;
        [Tooltip("Time when start button appears")]
        [SerializeField] private float startButtonRevealTime = 7.8f;
        [Tooltip("Time when intro fades to main menu if automatic")]
        [SerializeField] private float menuFadeStart = 7.8f;
        [Tooltip("Time when intro completes and menu appears")]
        [SerializeField] private float menuFadeEnd = 9.5f;

        [Header("Camera Movement")]
        [Tooltip("Starting camera position offset")]
        [SerializeField] private Vector3 cameraStartOffset = new Vector3(0, 2f, 10f);
        [Tooltip("Ending camera position offset")]
        [SerializeField] private Vector3 cameraEndOffset = new Vector3(0, 1f, 0f);
        [Tooltip("Camera rotation start")]
        [SerializeField] private Vector3 cameraStartRotation = new Vector3(5f, 0f, 0f);
        [Tooltip("Camera rotation end")]
        [SerializeField] private Vector3 cameraEndRotation = new Vector3(0f, 0f, 0f);

        [Header("Atmosphere")]
        [Tooltip("Ambient fog color for dawn atmosphere")]
        [SerializeField] private Color dawnFogColor = new Color(0.15f, 0.12f, 0.18f, 0.8f);
        [Tooltip("Background fade color")]
        [SerializeField] private Color backgroundColor = new Color(0.02f, 0.03f, 0.05f);

        [Header("Audio")]
        [SerializeField] private AudioSource introAudioSource;
        [SerializeField] private AudioClip templeBellClip;
        [SerializeField] private AudioClip templeAmbienceClip;
        [SerializeField] private AudioClip birdsClip;
        [SerializeField] private AudioClip clickClip;
        [SerializeField] private AudioClip introMusicClip;

        [Header("References")]
        [SerializeField] private Camera introCamera;
        [SerializeField] private GameObject menuRoot;
        [SerializeField] private TitleMenuController titleMenuController;

        public enum IntroPhase
        {
            PlayingIntro,
            TitleScreenReady,
            TransitioningToMenu,
            Completed
        }

        private IntroPhase _currentPhase = IntroPhase.PlayingIntro;
        private bool _skipped = false;
        private bool _isPlaying = false;
        private float _elapsedTime = 0f;
        private bool _bellPlayed = false;
        private Coroutine _introCoroutine;
        private Coroutine _titleTransitionCoroutine;
        private Vector3 _originalCameraPos;
        private Quaternion _originalCameraRot;
        private Vector2 _initialTitleCardPos = Vector2.zero;

        public bool IsPlaying => _isPlaying;
        public bool IsTitleScreenReady => _currentPhase == IntroPhase.TitleScreenReady;
        public IntroPhase CurrentPhase => _currentPhase;
        public Button StartButton => startButton;

        private void Awake()
        {
            // STEP 61: Use WW_PlayIntroOnStartup preference instead of WW_IntroPlayed.
            // Default is 1 (play intro). Player can disable it via settings.
            // Also support -forceIntro launch argument for QA/debug testing.
            bool playIntro = PlayerPrefs.GetInt("WW_PlayIntroOnStartup", 1) == 1;

            // Check for -forceIntro launch argument (debug/QA only)
            string[] args = System.Environment.GetCommandLineArgs();
            for (int i = 0; i < args.Length; i++)
            {
                if (args[i] == "-forceIntro")
                {
                    playIntro = true;
                    break;
                }
            }

            // Legacy support: if WW_IntroPlayed is set but WW_PlayIntroOnStartup is not,
            // default to playing the intro (the new behavior).
            if (!playIntro && PlayerPrefs.HasKey("WW_IntroPlayed") && !PlayerPrefs.HasKey("WW_PlayIntroOnStartup"))
            {
                playIntro = true;
            }

            Debug.Log($"<color=#FFD700><b>[CinematicIntro]</b></color> PlayIntroOnStartup={playIntro}");
        }

        private void Start()
        {
            EnsureAudioClips();
            SetupIntroVisuals();

            // Wire Start Button listener
            if (startButton != null)
            {
                startButton.onClick.RemoveAllListeners();
                startButton.onClick.AddListener(OnStartButtonClicked);
            }

            // Wire Skip Button listener
            if (introSkipButton != null)
            {
                introSkipButton.onClick.RemoveAllListeners();
                introSkipButton.onClick.AddListener(SkipIntro);
            }

            // Determine whether to play the intro
            bool playIntro = PlayerPrefs.GetInt("WW_PlayIntroOnStartup", 1) == 1;
            string[] args = System.Environment.GetCommandLineArgs();
            for (int i = 0; i < args.Length; i++)
            {
                if (args[i] == "-forceIntro")
                {
                    playIntro = true;
                    break;
                }
            }

            // Hide menuRoot during intro and title screen
            if (menuRoot != null)
            {
                menuRoot.SetActive(false);
            }

            if (playIntro)
            {
                StartIntro();
            }
            else
            {
                // Player disabled intro in settings — go straight to menu
                CompleteIntro();
            }

            // Safety timeout to prevent any soft-lock
            StartCoroutine(IntroSafetyTimeout());
        }

        private void EnsureAudioClips()
        {
            if (introAudioSource == null)
            {
                introAudioSource = GetComponent<AudioSource>();
                if (introAudioSource == null)
                {
                    introAudioSource = gameObject.AddComponent<AudioSource>();
                }
            }
            if (introAudioSource != null)
            {
                introAudioSource.playOnAwake = false;
                introAudioSource.spatialBlend = 0f;
            }

            if (templeBellClip == null)
            {
                templeBellClip = Resources.Load<AudioClip>("Audio/temple_bell")
                    ?? Resources.Load<AudioClip>("temple_bell");
            }
            if (templeAmbienceClip == null)
            {
                templeAmbienceClip = Resources.Load<AudioClip>("Audio/temple_ambience")
                    ?? Resources.Load<AudioClip>("temple_ambience");
            }
            if (birdsClip == null)
            {
                birdsClip = Resources.Load<AudioClip>("Audio/birds")
                    ?? Resources.Load<AudioClip>("birds");
            }
            if (clickClip == null)
            {
                clickClip = Resources.Load<AudioClip>("Audio/ui_click")
                    ?? Resources.Load<AudioClip>("ui_click");
            }
            if (introMusicClip == null)
            {
                introMusicClip = Resources.Load<AudioClip>("Audio/Music/bgm_intro_cinematic")
                    ?? Resources.Load<AudioClip>("Audio/Music/Region/bgm_intro_cinematic")
                    ?? Resources.Load<AudioClip>("bgm_intro_cinematic");
            }
        }

        private IEnumerator IntroSafetyTimeout()
        {
            float timeout = 20f;
            while (timeout > 0f)
            {
                yield return null;
                timeout -= Time.unscaledDeltaTime;
            }

            if (_isPlaying && _currentPhase == IntroPhase.PlayingIntro)
            {
                Debug.LogWarning("<color=#FF6666><b>[CinematicIntro]</b></color> Intro safety timeout reached — showing title screen");
                ShowTitleScreenImmediately();
            }
        }

        private void Update()
        {
            // During intro: allow skipping to title screen
            if (_isPlaying && _currentPhase == IntroPhase.PlayingIntro && !_skipped && IsAnyKeyOrButtonPressed())
            {
                SkipIntro();
                return;
            }

            // On Title Screen: Enter, Space, or Gamepad South triggers START
            if (_currentPhase == IntroPhase.TitleScreenReady && IsConfirmOrStartPressed())
            {
                OnStartButtonClicked();
            }
        }

        private static bool IsAnyKeyOrButtonPressed()
        {
#if ENABLE_INPUT_SYSTEM
            var keyboard = Keyboard.current;
            if (keyboard != null && (keyboard.anyKey.wasPressedThisFrame || keyboard.escapeKey.wasPressedThisFrame || keyboard.spaceKey.wasPressedThisFrame || keyboard.enterKey.wasPressedThisFrame))
                return true;
            var mouse = Mouse.current;
            if (mouse != null && (mouse.leftButton.wasPressedThisFrame || mouse.rightButton.wasPressedThisFrame || mouse.middleButton.wasPressedThisFrame))
                return true;
            var gamepad = Gamepad.current;
            if (gamepad != null && (gamepad.buttonSouth.wasPressedThisFrame || gamepad.buttonNorth.wasPressedThisFrame || gamepad.buttonEast.wasPressedThisFrame || gamepad.buttonWest.wasPressedThisFrame || gamepad.startButton.wasPressedThisFrame || gamepad.selectButton.wasPressedThisFrame))
                return true;
            return false;
#else
            return Input.anyKeyDown;
#endif
        }

        private static bool IsConfirmOrStartPressed()
        {
#if ENABLE_INPUT_SYSTEM
            var keyboard = Keyboard.current;
            if (keyboard != null && (keyboard.enterKey.wasPressedThisFrame || keyboard.numpadEnterKey.wasPressedThisFrame || keyboard.spaceKey.wasPressedThisFrame))
                return true;
            var gamepad = Gamepad.current;
            if (gamepad != null && (gamepad.buttonSouth.wasPressedThisFrame || gamepad.startButton.wasPressedThisFrame))
                return true;
            return false;
#else
            return Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.KeypadEnter) || Input.GetKeyDown(KeyCode.Space);
#endif
        }

        private void SetupIntroVisuals()
        {
            if (introBackground != null)
            {
                var bgImage = introBackground.GetComponent<Image>();
                if (bgImage != null)
                {
                    // Start fully black for a clean fade-in from black.
                    bgImage.color = new Color(0f, 0f, 0f, 1f);
                }
            }

            if (introTempleLayer != null)
            {
                var templeImg = introTempleLayer.GetComponent<Image>();
                if (templeImg != null)
                {
                    templeImg.color = new Color(1f, 1f, 1f, 0f);
                }
                var templeRect = introTempleLayer.GetComponent<RectTransform>();
                if (templeRect != null)
                {
                    templeRect.localScale = Vector3.one;
                }
            }

            if (introSkyGradient != null)
            {
                var skyImg = introSkyGradient.GetComponent<Image>();
                if (skyImg != null)
                {
                    skyImg.color = new Color(0.05f, 0.08f, 0.12f, 0.5f);
                }
            }
            if (introTreeline != null)
            {
                var treeImg = introTreeline.GetComponent<Image>();
                if (treeImg != null)
                {
                    treeImg.color = new Color(0.02f, 0.03f, 0.04f, 0.85f);
                }
            }

            if (introVignette != null)
            {
                var vigImage = introVignette.GetComponent<Image>();
                if (vigImage != null)
                {
                    vigImage.color = new Color(0f, 0f, 0f, 0.6f);
                }
            }

            // Title card composition
            if (introTitleGroup != null)
            {
                introTitleGroup.SetActive(true);
                if (titleCardCanvasGroup == null)
                {
                    titleCardCanvasGroup = introTitleGroup.GetComponent<CanvasGroup>();
                    if (titleCardCanvasGroup == null)
                    {
                        titleCardCanvasGroup = introTitleGroup.AddComponent<CanvasGroup>();
                    }
                }
                titleCardCanvasGroup.alpha = 1f;
                titleCardCanvasGroup.interactable = true;
                titleCardCanvasGroup.blocksRaycasts = true;
            }

            if (titleCardContainer != null)
            {
                var rt = titleCardContainer.GetComponent<RectTransform>();
                if (rt != null)
                {
                    _initialTitleCardPos = rt.anchoredPosition;
                }
            }

            if (introTitleText != null)
            {
                LocalizedFontProvider.Apply(introTitleText);
                introTitleText.text = "THE WHISPERING WILDS";
                introTitleText.color = new Color(0.96f, 0.83f, 0.40f, 0f); // Antique Gold (starts transparent)
            }

            if (introSubtitleText != null)
            {
                LocalizedFontProvider.Apply(introSubtitleText);
                introSubtitleText.text = "காட்டு வழி • தடம்";
                introSubtitleText.color = new Color(0.65f, 0.89f, 0.79f, 0f); // Soft Celadon (starts transparent)
            }

            if (titleBackGlow != null)
            {
                titleBackGlow.color = new Color(0.96f, 0.82f, 0.38f, 0f);
            }

            if (startButton != null)
            {
                var cg = startButton.GetComponent<CanvasGroup>();
                if (cg == null) cg = startButton.gameObject.AddComponent<CanvasGroup>();
                cg.alpha = 0f;
                cg.interactable = false;
                cg.blocksRaycasts = false;
            }

            if (introSkipButton != null)
            {
                introSkipButton.gameObject.SetActive(true);
                var cg = introSkipButton.GetComponent<CanvasGroup>();
                if (cg == null) cg = introSkipButton.gameObject.AddComponent<CanvasGroup>();
                cg.alpha = 0f;
            }

            if (introSkipText != null)
            {
                LocalizedFontProvider.Apply(introSkipText);
                LocalizationManager mgr = LocalizationManager.Instance;
                introSkipText.text = mgr != null ? mgr.GetForDisplay("intro.skip") : "Skip Intro";
                introSkipText.color = new Color(0.85f, 0.90f, 0.95f, 0f);
            }

            if (introCamera != null)
            {
                _originalCameraPos = introCamera.transform.position;
                _originalCameraRot = introCamera.transform.rotation;
                introCamera.transform.position = _originalCameraPos + cameraStartOffset;
                introCamera.transform.rotation = Quaternion.Euler(cameraStartRotation);
                introCamera.backgroundColor = backgroundColor;
            }

            RenderSettings.fog = true;
            RenderSettings.fogColor = dawnFogColor;
            RenderSettings.fogDensity = 0.02f;

            if (introBackground != null) introBackground.SetActive(true);
            if (introTempleLayer != null) introTempleLayer.SetActive(true);
            if (introSkyGradient != null) introSkyGradient.SetActive(true);
            if (introTreeline != null) introTreeline.SetActive(true);
            if (introVignette != null) introVignette.SetActive(true);
        }

        private void StartIntro()
        {
            _isPlaying = true;
            _skipped = false;
            _elapsedTime = 0f;
            _bellPlayed = false;
            _currentPhase = IntroPhase.PlayingIntro;

            if (introBackground != null) introBackground.SetActive(true);
            if (introTempleLayer != null) introTempleLayer.SetActive(true);
            if (introSkyGradient != null) introSkyGradient.SetActive(true);
            if (introTreeline != null) introTreeline.SetActive(true);
            if (introVignette != null) introVignette.SetActive(true);
            if (introTitleGroup != null) introTitleGroup.SetActive(true);

            // Ambient soundscape (separate from music bus)
            if (introAudioSource != null)
            {
                if (templeAmbienceClip != null)
                {
                    introAudioSource.clip = templeAmbienceClip;
                    introAudioSource.loop = true;
                    introAudioSource.volume = 0.35f;
                    introAudioSource.Play();
                }
                if (birdsClip != null)
                {
                    introAudioSource.PlayOneShot(birdsClip, 0.40f);
                }
            }

            // Cinematic intro music on the music bus (independent from ambience/master/music settings)
            if (AudioManager.Instance != null)
            {
                if (introMusicClip == null) EnsureAudioClips();
                if (introMusicClip != null)
                {
                    AudioManager.Instance.PlayMusic(introMusicClip, 2.0f);
                }
            }

            if (_introCoroutine != null) StopCoroutine(_introCoroutine);
            _introCoroutine = StartCoroutine(PlayIntro());
        }

        private IEnumerator PlayIntro()
        {
            float elapsed = 0f;

            Color bgDeepNight = new Color(0.01f, 0.02f, 0.03f);
            Color bgDawnMist = new Color(0.08f, 0.12f, 0.15f);
            Color bgSunrise = new Color(0.15f, 0.18f, 0.22f);

            float fogStartDensity = 0.05f;
            float fogEndDensity = 0.015f;

            while (elapsed < totalDuration && _isPlaying && !_skipped)
            {
                elapsed += Time.unscaledDeltaTime;
                _elapsedTime = elapsed;

                // Phase 1: Background & Mist Fade in from Black (0 - 1.5s)
                if (elapsed < 1.5f)
                {
                    float t = SmoothStep(elapsed / 1.5f);
                    if (introBackground != null)
                    {
                        var bgImage = introBackground.GetComponent<Image>();
                        if (bgImage != null)
                        {
                            Color bg = Color.Lerp(bgDeepNight, bgDawnMist, t);
                            bgImage.color = new Color(bg.r, bg.g, bg.b, t);
                        }
                    }
                    if (introCamera != null)
                    {
                        RenderSettings.fogDensity = Mathf.Lerp(fogStartDensity, fogEndDensity, t);
                    }
                }

                // Phase 2: Show Skip Control (starts at 0.5s)
                if (elapsed >= 0.5f && elapsed < 7.5f)
                {
                    float t = Mathf.Clamp01((elapsed - 0.5f) / 0.5f);
                    SetSkipAlpha(t * 0.85f);
                }
                else if (elapsed >= 7.5f)
                {
                    float t = Mathf.Clamp01(1f - (elapsed - 7.5f) / 0.5f);
                    SetSkipAlpha(t * 0.85f);
                }

                // Phase 3: Ancient Dravidian Temple Reveal & Resonant Bell Chime (1.5s - 7.5s)
                if (elapsed >= 1.5f)
                {
                    if (!_bellPlayed && elapsed >= 1.6f)
                    {
                        _bellPlayed = true;
                        if (introAudioSource != null && templeBellClip != null)
                        {
                            introAudioSource.PlayOneShot(templeBellClip, 0.80f);
                        }
                    }

                    if (introTempleLayer != null)
                    {
                        float templeT = SmoothStep(Mathf.Clamp01((elapsed - 1.5f) / 2.2f));
                        var templeImg = introTempleLayer.GetComponent<Image>();
                        if (templeImg != null)
                        {
                            templeImg.color = new Color(1f, 1f, 1f, templeT * 0.95f);
                        }
                        var templeRect = introTempleLayer.GetComponent<RectTransform>();
                        if (templeRect != null)
                        {
                            float z = 1.0f + ((elapsed - 1.5f) / 6.5f) * 0.04f;
                            templeRect.localScale = new Vector3(z, z, 1f);
                        }
                    }
                }

                // Phase 4: Camera Movement & Sunrise Horizon (1.0s - 6.5s)
                if (elapsed >= 1f && elapsed < 6.5f && introCamera != null)
                {
                    float t = SmoothStep((elapsed - 1f) / 5.5f);
                    Vector3 pos = Vector3.Lerp(cameraStartOffset, cameraEndOffset, t);
                    Vector3 rot = Vector3.Lerp(cameraStartRotation, cameraEndRotation, t);

                    introCamera.transform.position = _originalCameraPos + pos;
                    introCamera.transform.rotation = Quaternion.Euler(rot);

                    if (introBackground != null)
                    {
                        var bgImage = introBackground.GetComponent<Image>();
                        if (bgImage != null)
                        {
                            Color bg = Color.Lerp(bgDawnMist, bgSunrise, t);
                            bgImage.color = new Color(bg.r, bg.g, bg.b, 1f);
                        }
                    }
                }

                // Phase 5: Centered Title Card & Tamil Subtitle Reveal (starts at titleFadeInStart)
                if (elapsed >= titleFadeInStart)
                {
                    float titleT = SmoothStep(Mathf.Clamp01((elapsed - titleFadeInStart) / Mathf.Max(0.01f, titleFadeInEnd - titleFadeInStart)));
                    if (introTitleText != null)
                    {
                        // Subtle golden reveal shimmer.
                        float shimmer = 1f + Mathf.Sin(elapsed * 2.2f) * 0.015f * titleT;
                        introTitleText.color = new Color(0.96f * shimmer, 0.83f * shimmer, 0.40f, titleT);
                    }
                    if (titleBackGlow != null)
                    {
                        float glowPulse = 0.16f + Mathf.Sin(elapsed * 1.4f) * 0.03f;
                        titleBackGlow.color = new Color(0.96f, 0.82f, 0.38f, Mathf.Clamp01(titleT) * glowPulse);
                    }

                    // Staggered Tamil Subtitle (~0.5s after title starts), smooth fade.
                    float subStart = titleFadeInStart + 0.5f;
                    if (elapsed >= subStart)
                    {
                        float subT = SmoothStep(Mathf.Clamp01((elapsed - subStart) / 1.4f));
                        if (introSubtitleText != null)
                        {
                            introSubtitleText.color = new Color(0.65f, 0.89f, 0.79f, subT * 0.96f);
                        }
                    }
                }

                // Phase 6: Reveal START Button with smooth fade + scale (t >= startButtonRevealTime)
                if (elapsed >= startButtonRevealTime)
                {
                    float startBtnT = SmoothStep(Mathf.Clamp01((elapsed - startButtonRevealTime) / 1.0f));
                    if (startButton != null)
                    {
                        var cg = startButton.GetComponent<CanvasGroup>();
                        if (cg != null)
                        {
                            cg.alpha = startBtnT;
                            if (startBtnT >= 0.98f)
                            {
                                cg.interactable = true;
                                cg.blocksRaycasts = true;
                            }
                        }
                        var btnRect = startButton.GetComponent<RectTransform>();
                        if (btnRect != null)
                        {
                            float s = Mathf.Lerp(0.92f, 1f, startBtnT);
                            btnRect.localScale = new Vector3(s, s, 1f);
                        }
                    }

                    if (elapsed >= totalDuration)
                    {
                        // Settle on interactive title screen
                        _currentPhase = IntroPhase.TitleScreenReady;
                        EnableStartButtonInteractive();
                        yield break;
                    }
                }

                yield return null;
            }

            if (_isPlaying && !_skipped)
            {
                _currentPhase = IntroPhase.TitleScreenReady;
                EnableStartButtonInteractive();
            }
        }

        private void SetSkipAlpha(float alpha)
        {
            if (introSkipButton != null)
            {
                var cg = introSkipButton.GetComponent<CanvasGroup>();
                if (cg != null)
                {
                    cg.alpha = alpha;
                    cg.interactable = alpha > 0.1f;
                    cg.blocksRaycasts = alpha > 0.1f;
                }
            }
            if (introSkipText != null)
            {
                introSkipText.color = new Color(0.85f, 0.90f, 0.95f, alpha);
            }
        }

        private void EnableStartButtonInteractive()
        {
            if (startButton != null)
            {
                var cg = startButton.GetComponent<CanvasGroup>();
                if (cg != null)
                {
                    cg.alpha = 1f;
                    cg.interactable = true;
                    cg.blocksRaycasts = true;
                }
                var btnRect = startButton.GetComponent<RectTransform>();
                if (btnRect != null)
                {
                    btnRect.localScale = Vector3.one;
                }
                startButton.interactable = true;
            }
            SetSkipAlpha(0f);
        }

        /// <summary>
        /// Skipping the intro smoothly transitions directly to the Centered Title Screen
        /// with the START button ready, invoking the exact same reliable menu-entry flow.
        /// </summary>
        public void SkipIntro()
        {
            if (_currentPhase != IntroPhase.PlayingIntro) return;

            _skipped = true;
            if (_introCoroutine != null)
            {
                StopCoroutine(_introCoroutine);
                _introCoroutine = null;
            }

            ShowTitleScreenImmediately();
        }

        private void ShowTitleScreenImmediately()
        {
            _currentPhase = IntroPhase.TitleScreenReady;

            // Instantly reveal scenic dawn background and ancient Dravidian temple
            if (introTempleLayer != null)
            {
                introTempleLayer.SetActive(true);
                var templeImg = introTempleLayer.GetComponent<Image>();
                if (templeImg != null) templeImg.color = new Color(1f, 1f, 1f, 0.95f);
                var templeRect = introTempleLayer.GetComponent<RectTransform>();
                if (templeRect != null) templeRect.localScale = Vector3.one;
            }

            if (introBackground != null)
            {
                introBackground.SetActive(true);
                var bgImage = introBackground.GetComponent<Image>();
                if (bgImage != null) bgImage.color = new Color(0.15f, 0.18f, 0.22f, 1f);
            }

            if (introSkyGradient != null) introSkyGradient.SetActive(true);
            if (introTreeline != null) introTreeline.SetActive(true);
            if (introVignette != null) introVignette.SetActive(true);

            if (introCamera != null)
            {
                introCamera.transform.position = _originalCameraPos + cameraEndOffset;
                introCamera.transform.rotation = Quaternion.Euler(cameraEndRotation);
            }

            // Settle Title Card in true screen center
            if (introTitleGroup != null) introTitleGroup.SetActive(true);
            if (titleCardCanvasGroup != null)
            {
                titleCardCanvasGroup.alpha = 1f;
                titleCardCanvasGroup.interactable = true;
                titleCardCanvasGroup.blocksRaycasts = true;
            }

            if (introTitleText != null)
            {
                introTitleText.color = new Color(0.96f, 0.83f, 0.40f, 1f);
            }
            if (introSubtitleText != null)
            {
                introSubtitleText.color = new Color(0.65f, 0.89f, 0.79f, 0.95f);
            }
            if (titleBackGlow != null)
            {
                titleBackGlow.color = new Color(0.96f, 0.82f, 0.38f, 0.18f);
            }

            // Reveal START Button
            EnableStartButtonInteractive();
            SetSkipAlpha(0f);
        }

        /// <summary>
        /// Triggered when the player clicks the primary START button on the Title Screen.
        /// Smoothly fades out the centered title card and reveals the complete Main Menu.
        /// </summary>
        public void OnStartButtonClicked()
        {
            // Prevent double-click / repeated triggers during transition.
            if (_currentPhase != IntroPhase.TitleScreenReady) return;
            _currentPhase = IntroPhase.TransitioningToMenu;

            if (startButton != null)
            {
                startButton.interactable = false;
                var startCg = startButton.GetComponent<CanvasGroup>();
                if (startCg != null)
                {
                    startCg.interactable = false;
                    startCg.blocksRaycasts = false;
                }
            }

            // Play quiet UI click audio
            if (clickClip != null && introAudioSource != null)
            {
                introAudioSource.PlayOneShot(clickClip, 0.75f);
            }

            if (_titleTransitionCoroutine != null) StopCoroutine(_titleTransitionCoroutine);
            _titleTransitionCoroutine = StartCoroutine(TransitionTitleToMenu());
        }

        private IEnumerator TransitionTitleToMenu()
        {
            float duration = 0.45f;
            float elapsed = 0f;

            if (startButton != null)
            {
                var cg = startButton.GetComponent<CanvasGroup>();
                if (cg != null)
                {
                    cg.interactable = false;
                    cg.blocksRaycasts = false;
                }
            }

            Vector2 startPos = _initialTitleCardPos;
            Vector2 targetPos = _initialTitleCardPos + new Vector2(0f, 25f);

            while (elapsed < duration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                float smoothT = SmoothStep(t);

                if (titleCardCanvasGroup != null)
                {
                    titleCardCanvasGroup.alpha = 1f - smoothT;
                }

                if (titleCardContainer != null)
                {
                    var rt = titleCardContainer.GetComponent<RectTransform>();
                    if (rt != null)
                    {
                        rt.anchoredPosition = Vector2.Lerp(startPos, targetPos, smoothT);
                    }
                }

                yield return null;
            }

            if (titleCardCanvasGroup != null)
            {
                titleCardCanvasGroup.alpha = 0f;
                titleCardCanvasGroup.interactable = false;
                titleCardCanvasGroup.blocksRaycasts = false;
            }

            CompleteIntro();
        }

        private void CompleteIntro()
        {
            if (!_isPlaying && menuRoot != null && menuRoot.activeSelf)
            {
                return;
            }

            _isPlaying = false;
            _currentPhase = IntroPhase.Completed;

            // Stop ambient intro loop (ambience source only; music bus hands off via AudioManager crossfade)
            if (introAudioSource != null && introAudioSource.isPlaying)
            {
                introAudioSource.Stop();
            }

            // Hide intro-specific visual elements
            if (introBackground != null) introBackground.SetActive(false);
            if (introTempleLayer != null) introTempleLayer.SetActive(false);
            if (introSkyGradient != null) introSkyGradient.SetActive(false);
            if (introTreeline != null) introTreeline.SetActive(false);
            if (introMist != null) introMist.SetActive(false);
            if (introVignette != null) introVignette.SetActive(false);
            if (introTitleGroup != null) introTitleGroup.SetActive(false);
            if (introSkipButton != null) introSkipButton.gameObject.SetActive(false);
            if (introSkipText != null) introSkipText.gameObject.SetActive(false);

            // Reset camera
            if (introCamera != null)
            {
                introCamera.transform.position = _originalCameraPos;
                introCamera.transform.rotation = _originalCameraRot;
            }

            RenderSettings.fog = false;

            // Show main menu root & notify TitleMenuController to trigger the entrance animation
            if (menuRoot != null)
            {
                menuRoot.SetActive(true);
            }

            if (titleMenuController != null)
            {
                titleMenuController.CompleteIntro();
            }
            else if (menuRoot != null)
            {
                var anim = menuRoot.GetComponentInChildren<MainMenuAnimator>() ?? FindAnyObjectByType<MainMenuAnimator>();
                if (anim != null)
                {
                    anim.ResetAnimationState();
                    anim.PlayEntrance();
                }
            }

            Debug.Log("<color=#FFD700><b>[CinematicIntro]</b></color> Intro completed, showing complete main menu.");
        }

        private static float SmoothStep(float t)
        {
            return t * t * (3f - 2f * t);
        }

        public void ReplayIntro()
        {
            if (_isPlaying) return;

            PlayerPrefs.SetInt("WW_PlayIntroOnStartup", 1);
            PlayerPrefs.Save();

            _skipped = false;
            _elapsedTime = 0f;
            _bellPlayed = false;
            _currentPhase = IntroPhase.PlayingIntro;

            if (menuRoot != null)
            {
                menuRoot.SetActive(false);
            }

            SetupIntroVisuals();
            StartIntro();
        }

        private void OnDisable()
        {
            if (_introCoroutine != null)
            {
                StopCoroutine(_introCoroutine);
                _introCoroutine = null;
            }
            if (_titleTransitionCoroutine != null)
            {
                StopCoroutine(_titleTransitionCoroutine);
                _titleTransitionCoroutine = null;
            }
            _isPlaying = false;
            RenderSettings.fog = false;

            if (introAudioSource != null && introAudioSource.isPlaying)
            {
                introAudioSource.Stop();
            }
        }
    }
}
