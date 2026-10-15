using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif
using WhisperingWilds.Localization;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// STEP 61 — Cinematic introduction sequence for The Whispering Wilds.
    /// 
    /// Plays a 20-30 second atmospheric opening before the main menu:
    /// 1. Fade from black with atmospheric gradient background
    /// 2. Reveal Tamil Nadu landscape at dawn with fog and mist
    /// 3. Camera moves toward a mysterious trail
    /// 4. Title fades in with Tamil subtitle
    /// 5. Transition to main menu
    /// 
    /// Supports skip via keyboard, mouse, or controller.
    /// Plays by default on every launch unless the player explicitly disables it
    /// via the WW_PlayIntroOnStartup preference or the -forceIntro launch argument.
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

        [Header("STEP 69 — Additional Visual Layers")]
        [SerializeField] private GameObject introSkyGradient;
        [SerializeField] private GameObject introTreeline;

        [Header("Timing")]
        [Tooltip("Total duration of the cinematic intro in seconds")]
        [SerializeField] private float totalDuration = 7f;
        [Tooltip("Time when title starts fading in")]
        [SerializeField] private float titleFadeInStart = 1.5f;
        [Tooltip("Time when title is fully visible")]
        [SerializeField] private float titleFadeInEnd = 3f;
        [Tooltip("Time when intro fades to main menu")]
        [SerializeField] private float menuFadeStart = 5.5f;
        [Tooltip("Time when intro completes and menu appears")]
        [SerializeField] private float menuFadeEnd = 7f;

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

        [Header("References")]
        [SerializeField] private Camera introCamera;
        [SerializeField] private GameObject menuRoot;
        [SerializeField] private TitleMenuController titleMenuController;

        private bool _skipped = false;
        private bool _isPlaying = false;
        private float _elapsedTime = 0f;
        private Coroutine _introCoroutine;
        private Vector3 _originalCameraPos;
        private Quaternion _originalCameraRot;

        public bool IsPlaying => _isPlaying;

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
                // Old build set WW_IntroPlayed=1. New build should play by default.
                playIntro = true;
            }
            
            Debug.Log($"<color=#FFD700><b>[CinematicIntro]</b></color> PlayIntroOnStartup={playIntro}");
        }

        private void Start()
        {
            // Determine whether to play the intro
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

            // Hide only the menu content during the intro. The canvas itself stays active
            // so that intro visuals (which are canvas children) remain visible.
            if (menuRoot != null)
            {
                menuRoot.SetActive(false);
            }

            // Setup intro visuals
            SetupIntroVisuals();

            // Start or skip intro based on preference
            if (playIntro)
            {
                StartIntro();
            }
            else
            {
                // Player has disabled the intro — go straight to menu.
                CompleteIntro();
            }
        }

        private void Update()
        {
            // Skip on any input
            if (_isPlaying && !_skipped && IsAnyKeyOrButtonPressed())
            {
                SkipIntro();
            }
        }

        /// <summary>
        /// Detects any key or button press, compatible with both the legacy Input Manager
        /// and the new Input System. The project uses the Input System package, so the
        /// legacy UnityEngine.Input API throws InvalidOperationException at runtime.
        /// </summary>
        private static bool IsAnyKeyOrButtonPressed()
        {
#if ENABLE_INPUT_SYSTEM
            var keyboard = Keyboard.current;
            if (keyboard != null && keyboard.anyKey.wasPressedThisFrame)
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

        private void SetupIntroVisuals()
        {
            // Setup background
            if (introBackground != null)
            {
                var bgImage = introBackground.GetComponent<Image>();
                if (bgImage != null)
                {
                    bgImage.color = new Color(backgroundColor.r, backgroundColor.g, backgroundColor.b, 0f);
                }
            }

            // STEP 69: Setup sky gradient and treeline for visual depth
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

            // Setup vignette
            if (introVignette != null)
            {
                var vigImage = introVignette.GetComponent<Image>();
                if (vigImage != null)
                {
                    vigImage.color = new Color(0f, 0f, 0f, 0.6f);
                }
            }

            // Setup title
            if (introTitleGroup != null)
            {
                introTitleGroup.SetActive(true);
                introTitleGroup.SetActive(false); // Start hidden
            }

            if (introTitleText != null)
            {
                LocalizationManager mgr = LocalizationManager.Instance;
                introTitleText.text = mgr != null ? mgr.GetForDisplay("menu.title") : "THE WHISPERING WILDS";
                introTitleText.color = new Color(1f, 0.85f, 0.35f, 0f); // Start invisible
            }

            if (introSubtitleText != null)
            {
                LocalizationManager mgr = LocalizationManager.Instance;
                introSubtitleText.text = mgr != null ? mgr.GetForDisplay("menu.subtitle") : "A Living Exploration & Cultural Investigation of Tamil Nadu";
                introSubtitleText.color = new Color(0.8f, 0.85f, 0.9f, 0f); // Start invisible
            }

            // Setup skip text
            if (introSkipText != null)
            {
                LocalizationManager mgr = LocalizationManager.Instance;
                introSkipText.text = mgr != null ? mgr.GetForDisplay("intro.skip") : "Press Any Key to Skip";
                introSkipText.color = new Color(0.6f, 0.65f, 0.7f, 0f);
            }

            // Setup camera
            if (introCamera != null)
            {
                _originalCameraPos = introCamera.transform.position;
                _originalCameraRot = introCamera.transform.rotation;
                introCamera.transform.position = _originalCameraPos + cameraStartOffset;
                introCamera.transform.rotation = Quaternion.Euler(cameraStartRotation);
                introCamera.backgroundColor = backgroundColor;
            }

            // Apply atmospheric fog
            RenderSettings.fog = true;
            RenderSettings.fogColor = dawnFogColor;
            RenderSettings.fogDensity = 0.02f;
        }

        private void StartIntro()
        {
            _isPlaying = true;
            _skipped = false;
            _elapsedTime = 0f;

            // Show intro elements
            if (introBackground != null) introBackground.SetActive(true);
            if (introSkyGradient != null) introSkyGradient.SetActive(true);
            if (introTreeline != null) introTreeline.SetActive(true);
            if (introVignette != null) introVignette.SetActive(true);
            if (introTitleGroup != null) introTitleGroup.SetActive(true);
            if (introSkipText != null) introSkipText.gameObject.SetActive(true);

            // Do NOT mark the intro as played yet — it hasn't finished.
            // The flag is set in CompleteIntro() so a crash during the intro
            // does not permanently skip it on the next launch.

            // Start the intro coroutine
            if (_introCoroutine != null) StopCoroutine(_introCoroutine);
            _introCoroutine = StartCoroutine(PlayIntro());
        }

        private IEnumerator PlayIntro()
        {
            float elapsed = 0f;

            // STEP 61: Atmospheric gradient colors for the intro background.
            // Deep forest night → dawn mist → warm sunrise tones.
            Color bgDeepNight = new Color(0.01f, 0.02f, 0.03f);
            Color bgDawnMist = new Color(0.08f, 0.12f, 0.15f);
            Color bgSunrise = new Color(0.15f, 0.18f, 0.22f);

            // Fog density animation: starts thick, thins as dawn breaks
            float fogStartDensity = 0.05f;
            float fogEndDensity = 0.015f;

            while (elapsed < totalDuration && _isPlaying && !_skipped)
            {
                // STEP 69: Use unscaled delta time so the intro advances even when
                // Time.timeScale is 0 (MainMenu state). This is the root cause fix for
                // the stuck intro — the game pauses time at the menu, but the intro
                // coroutine must use real-world time.
                elapsed += Time.unscaledDeltaTime;
                _elapsedTime = elapsed;

                // Phase 1: Fade in background (0-1.5s)
                // Quick transition from deep night to dawn mist so the player sees something immediately
                if (elapsed < 1.5f)
                {
                    float t = elapsed / 1.5f;
                    t = SmoothStep(t);
                    if (introBackground != null)
                    {
                        var bgImage = introBackground.GetComponent<Image>();
                        if (bgImage != null)
                        {
                            Color bg = Color.Lerp(bgDeepNight, bgDawnMist, t);
                            bgImage.color = new Color(bg.r, bg.g, bg.b, t);
                        }
                    }
                    // Animate fog density: thick at start, thinning
                    if (introCamera != null)
                    {
                        float fogT = t;
                        RenderSettings.fogDensity = Mathf.Lerp(fogStartDensity, fogEndDensity, fogT);
                    }
                }

                // Phase 2: Show skip text immediately (0.5-5s)
                // Player should know they can skip within the first second
                if (elapsed >= 0.5f && elapsed < 5f)
                {
                    float t = Mathf.Clamp01((elapsed - 0.5f) / 0.5f);
                    if (introSkipText != null)
                    {
                        introSkipText.color = new Color(0.6f, 0.65f, 0.7f, t * 0.7f);
                    }
                }
                else if (elapsed >= 5f && introSkipText != null)
                {
                    // Fade out skip text as menu transition begins
                    float t = Mathf.Clamp01(1f - (elapsed - 5f) / 0.5f);
                    introSkipText.color = new Color(0.6f, 0.65f, 0.7f, t * 0.7f);
                }

                // Phase 3: Camera movement & background transition (1-4s)
                // Camera slowly pushes forward while background shifts to sunrise tones
                if (elapsed >= 1f && elapsed < 4f && introCamera != null)
                {
                    float t = (elapsed - 1f) / 3f;
                    t = SmoothStep(t);

                    Vector3 pos = Vector3.Lerp(cameraStartOffset, cameraEndOffset, t);
                    Vector3 rot = Vector3.Lerp(cameraStartRotation, cameraEndRotation, t);

                    introCamera.transform.position = _originalCameraPos + pos;
                    introCamera.transform.rotation = Quaternion.Euler(rot);

                    // Background transitions from dawn mist to sunrise
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

                // Phase 4: Title fade in (1.5-3s)
                // Title appears early so the player knows what game they're launching
                if (elapsed >= titleFadeInStart && elapsed < titleFadeInEnd)
                {
                    float t = (elapsed - titleFadeInStart) / (titleFadeInEnd - titleFadeInStart);
                    t = SmoothStep(t);

                    if (introTitleText != null)
                    {
                        introTitleText.color = new Color(1f, 0.85f, 0.35f, t);
                    }
                    if (introSubtitleText != null)
                    {
                        introSubtitleText.color = new Color(0.8f, 0.85f, 0.9f, t * 0.8f);
                    }
                }

                // Phase 5: Fade to menu (5.5-7s)
                if (elapsed >= menuFadeStart && elapsed < menuFadeEnd)
                {
                    float t = (elapsed - menuFadeStart) / (menuFadeEnd - menuFadeStart);
                    t = SmoothStep(t);

                    // Fade out intro elements
                    if (introTitleText != null)
                    {
                        introTitleText.color = new Color(1f, 0.85f, 0.35f, 1f - t);
                    }
                    if (introSubtitleText != null)
                    {
                        introSubtitleText.color = new Color(0.8f, 0.85f, 0.9f, (1f - t) * 0.8f);
                    }
                    if (introVignette != null)
                    {
                        var vigImage = introVignette.GetComponent<Image>();
                        if (vigImage != null)
                        {
                            vigImage.color = new Color(0f, 0f, 0f, 0.6f * (1f - t));
                        }
                    }
                    // Fade out background
                    if (introBackground != null)
                    {
                        var bgImage = introBackground.GetComponent<Image>();
                        if (bgImage != null)
                        {
                            bgImage.color = new Color(bgSunrise.r, bgSunrise.g, bgSunrise.b, 1f - t);
                        }
                    }
                }

                // Phase 6: Complete intro and show menu
                if (elapsed >= menuFadeEnd)
                {
                    CompleteIntro();
                    yield break;
                }

                yield return null;
            }

            // If loop ended without completing (shouldn't happen normally)
            if (_isPlaying && !_skipped)
            {
                CompleteIntro();
            }
        }

        public void SkipIntro()
        {
            if (!_isPlaying || _skipped) return;

            _skipped = true;
            _isPlaying = false;

            if (_introCoroutine != null)
            {
                StopCoroutine(_introCoroutine);
                _introCoroutine = null;
            }

            // Instantly complete the intro
            CompleteIntro();
        }

        private void CompleteIntro()
        {
            // Idempotent: safe to call multiple times.
            if (!_isPlaying && menuRoot != null && menuRoot.activeSelf)
            {
                // Already completed and menu is visible — nothing to do.
                return;
            }

            _isPlaying = false;

            // STEP 61: Do NOT persist the old intro-played flag. The intro plays by default
            // on every launch unless the player explicitly disables WW_PlayIntroOnStartup in
            // settings. This ensures the intro appears on subsequent launches as intended.

            // Hide intro elements
            if (introBackground != null) introBackground.SetActive(false);
            if (introSkyGradient != null) introSkyGradient.SetActive(false);
            if (introTreeline != null) introTreeline.SetActive(false);
            if (introVignette != null) introVignette.SetActive(false);
            if (introTitleGroup != null) introTitleGroup.SetActive(false);
            if (introSkipText != null) introSkipText.gameObject.SetActive(false);

            // Reset camera
            if (introCamera != null)
            {
                introCamera.transform.position = _originalCameraPos;
                introCamera.transform.rotation = _originalCameraRot;
            }

            // Reset fog
            RenderSettings.fog = false;

            // Show main menu
            if (menuRoot != null)
            {
                menuRoot.SetActive(true);
            }

            Debug.Log("<color=#FFD700><b>[CinematicIntro]</b></color> Intro completed, showing main menu");
        }

        private static float SmoothStep(float t)
        {
            return t * t * (3f - 2f * t);
        }

        /// <summary>
        /// Replay the cinematic intro (for testing or optional replay feature).
        /// </summary>
        public void ReplayIntro()
        {
            if (_isPlaying) return;

            // STEP 61: Ensure the intro preference is enabled so a subsequent launch
            // will show the intro again.
            PlayerPrefs.SetInt("WW_PlayIntroOnStartup", 1);
            PlayerPrefs.Save();

            // Reset state
            _skipped = false;
            _elapsedTime = 0f;

            // Hide main menu
            if (menuRoot != null)
            {
                menuRoot.SetActive(false);
            }

            // Setup and start intro
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
            _isPlaying = false;

            // Reset fog
            RenderSettings.fog = false;
        }
    }
}
