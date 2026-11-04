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
    /// STEP 61 & AAA REDESIGN — Cinematic introduction sequence for The Whispering Wilds (காட்டு வழி • தடம்).
    /// 
    /// Plays an atmospheric opening sequence before the main menu:
    /// 1. Fade from black with atmospheric dawn gradient background
    /// 2. Morning birds & distant temple ambience begin playing
    /// 3. Reveal Tamil Nadu Western Ghats landscape at dawn with fog and mist
    /// 4. Temple reveal: ancient Dravidian stone sanctum emerges from the morning mist
    /// 5. Resonant temple bell chimes as the ancient granite Gopuram is unveiled
    /// 6. Game title fades in with golden sunrise glow: THE WHISPERING WILDS
    /// 7. Tamil subtitle revealed: காட்டு வழி • தடம்
    /// 8. Camera slowly moves forward, mist drifts across depth layers
    /// 9. Seamless transition into the interactive main menu
    /// 
    /// Supports skip via keyboard, mouse, or controller.
    /// Plays by default on every launch unless the player explicitly disables it
    /// via the WW_PlayIntroOnStartup preference or the -forceIntro launch argument.
    /// Operates on unscaled real time so the intro advances even when Time.timeScale = 0.
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
        [Tooltip("Time when intro fades to main menu")]
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

        [Header("References")]
        [SerializeField] private Camera introCamera;
        [SerializeField] private GameObject menuRoot;
        [SerializeField] private TitleMenuController titleMenuController;

        private bool _skipped = false;
        private bool _isPlaying = false;
        private float _elapsedTime = 0f;
        private bool _bellPlayed = false;
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
            EnsureAudioClips();

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

            // STEP 78: Safety timeout — if the intro coroutine never starts or gets stuck
            // force-show the menu after 10s so the player is never stranded on a blank screen.
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
        }

        private IEnumerator IntroSafetyTimeout()
        {
            // Wait 14 unscaled seconds (safety threshold exceeding 9.5s total duration)
            float timeout = 14f;
            while (timeout > 0f)
            {
                yield return null;
                timeout -= Time.unscaledDeltaTime;
            }

            if (_isPlaying)
            {
                Debug.LogWarning("<color=#FF6666><b>[CinematicIntro]</b></color> Intro safety timeout reached — forcing menu display");
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
            // Setup background — start with dark color so first frame is not blank
            if (introBackground != null)
            {
                var bgImage = introBackground.GetComponent<Image>();
                if (bgImage != null)
                {
                    bgImage.color = new Color(0.01f, 0.02f, 0.03f, 1f);
                }
            }

            // Temple layer for ancient Dravidian reveal
            if (introTempleLayer != null)
            {
                var templeImg = introTempleLayer.GetComponent<Image>();
                if (templeImg != null)
                {
                    templeImg.color = new Color(1f, 1f, 1f, 0f); // Start hidden
                }
                var templeRect = introTempleLayer.GetComponent<RectTransform>();
                if (templeRect != null)
                {
                    templeRect.localScale = Vector3.one;
                }
            }

            // Sky gradient and treeline for visual depth
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
            }

            if (introTitleText != null)
            {
                LocalizedFontProvider.Apply(introTitleText);
                introTitleText.text = "THE WHISPERING WILDS";
                introTitleText.color = new Color(1f, 0.85f, 0.35f, 0f); // Start invisible
            }

            if (introSubtitleText != null)
            {
                LocalizedFontProvider.Apply(introSubtitleText);
                introSubtitleText.text = "காட்டு வழி • தடம்";
                introSubtitleText.color = new Color(0.70f, 0.88f, 0.78f, 0f); // Start invisible
            }

            // Setup skip text
            if (introSkipText != null)
            {
                LocalizedFontProvider.Apply(introSkipText);
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

            if (introBackground != null) introBackground.SetActive(true);
            if (introTempleLayer != null) introTempleLayer.SetActive(true);
            if (introSkyGradient != null) introSkyGradient.SetActive(true);
            if (introTreeline != null) introTreeline.SetActive(true);
            if (introVignette != null) introVignette.SetActive(true);
            if (introTitleGroup != null) introTitleGroup.SetActive(true);
            if (introSkipText != null) introSkipText.gameObject.SetActive(true);
        }

        private void StartIntro()
        {
            _isPlaying = true;
            _skipped = false;
            _elapsedTime = 0f;
            _bellPlayed = false;

            if (introBackground != null) introBackground.SetActive(true);
            if (introTempleLayer != null) introTempleLayer.SetActive(true);
            if (introSkyGradient != null) introSkyGradient.SetActive(true);
            if (introTreeline != null) introTreeline.SetActive(true);
            if (introVignette != null) introVignette.SetActive(true);
            if (introTitleGroup != null) introTitleGroup.SetActive(true);
            if (introSkipText != null) introSkipText.gameObject.SetActive(true);

            // Play ambient temple soundscape
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
                // STEP 69: Use unscaled delta time so the intro advances even when Time.timeScale is 0
                elapsed += Time.unscaledDeltaTime;
                _elapsedTime = elapsed;

                // Phase 1: Fade in background & mist (0-1.5s)
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
                    if (introCamera != null)
                    {
                        RenderSettings.fogDensity = Mathf.Lerp(fogStartDensity, fogEndDensity, t);
                    }
                }

                // Phase 2: Show skip text early (0.5-7.2s)
                if (elapsed >= 0.5f && elapsed < 7.2f)
                {
                    float t = Mathf.Clamp01((elapsed - 0.5f) / 0.5f);
                    if (introSkipText != null)
                    {
                        introSkipText.color = new Color(0.6f, 0.65f, 0.7f, t * 0.7f);
                    }
                }
                else if (elapsed >= 7.2f && introSkipText != null)
                {
                    float t = Mathf.Clamp01(1f - (elapsed - 7.2f) / 0.5f);
                    introSkipText.color = new Color(0.6f, 0.65f, 0.7f, t * 0.7f);
                }

                // Phase 3: Temple Reveal & Bell Chime (1.5-7.8s)
                if (elapsed >= 1.5f && elapsed < 7.8f)
                {
                    // Resonant temple bell chime at temple reveal
                    if (!_bellPlayed && elapsed >= 1.6f)
                    {
                        _bellPlayed = true;
                        if (introAudioSource != null && templeBellClip != null)
                        {
                            introAudioSource.PlayOneShot(templeBellClip, 0.75f);
                        }
                    }

                    // Temple layer dissolves in and zooms slowly
                    if (introTempleLayer != null)
                    {
                        float templeT = Mathf.Clamp01((elapsed - 1.5f) / 2.2f);
                        templeT = SmoothStep(templeT);
                        var templeImg = introTempleLayer.GetComponent<Image>();
                        if (templeImg != null)
                        {
                            templeImg.color = new Color(1f, 1f, 1f, templeT * 0.95f);
                        }
                        var templeRect = introTempleLayer.GetComponent<RectTransform>();
                        if (templeRect != null)
                        {
                            float z = 1.0f + ((elapsed - 1.5f) / 6.3f) * 0.04f;
                            templeRect.localScale = new Vector3(z, z, 1f);
                        }
                    }
                }

                // Phase 4: Camera movement & background transition (1-6.5s)
                if (elapsed >= 1f && elapsed < 6.5f && introCamera != null)
                {
                    float t = (elapsed - 1f) / 5.5f;
                    t = SmoothStep(t);

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

                // Phase 5: Title fade in & Tamil subtitle reveal (1.5-3s), stays visible until menuFadeStart
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
                        introSubtitleText.color = new Color(0.70f, 0.88f, 0.78f, t * 0.95f);
                    }
                }

                // Phase 6: Fade to menu (7.8-9.5s)
                if (elapsed >= menuFadeStart && elapsed < menuFadeEnd)
                {
                    float t = (elapsed - menuFadeStart) / (menuFadeEnd - menuFadeStart);
                    t = SmoothStep(t);

                    if (introTitleText != null)
                    {
                        introTitleText.color = new Color(1f, 0.85f, 0.35f, 1f - t);
                    }
                    if (introSubtitleText != null)
                    {
                        introSubtitleText.color = new Color(0.70f, 0.88f, 0.78f, (1f - t) * 0.95f);
                    }
                    if (introTempleLayer != null)
                    {
                        var templeImg = introTempleLayer.GetComponent<Image>();
                        if (templeImg != null)
                        {
                            templeImg.color = new Color(1f, 1f, 1f, (1f - t) * 0.95f);
                        }
                    }
                    if (introVignette != null)
                    {
                        var vigImage = introVignette.GetComponent<Image>();
                        if (vigImage != null)
                        {
                            vigImage.color = new Color(0f, 0f, 0f, 0.6f * (1f - t));
                        }
                    }
                    if (introBackground != null)
                    {
                        var bgImage = introBackground.GetComponent<Image>();
                        if (bgImage != null)
                        {
                            bgImage.color = new Color(bgSunrise.r, bgSunrise.g, bgSunrise.b, 1f - t);
                        }
                    }
                }

                // Phase 7: Complete intro and show menu
                if (elapsed >= menuFadeEnd)
                {
                    CompleteIntro();
                    yield break;
                }

                yield return null;
            }

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

            CompleteIntro();
        }

        private void CompleteIntro()
        {
            if (!_isPlaying && menuRoot != null && menuRoot.activeSelf)
            {
                return;
            }

            _isPlaying = false;

            // Stop intro audio
            if (introAudioSource != null && introAudioSource.isPlaying)
            {
                introAudioSource.Stop();
            }

            // Hide intro visual elements
            if (introBackground != null) introBackground.SetActive(false);
            if (introTempleLayer != null) introTempleLayer.SetActive(false);
            if (introSkyGradient != null) introSkyGradient.SetActive(false);
            if (introTreeline != null) introTreeline.SetActive(false);
            if (introMist != null) introMist.SetActive(false);
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

            Debug.Log("<color=#FFD700><b>[CinematicIntro]</b></color> Intro completed, showing main menu");
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
            _isPlaying = false;
            RenderSettings.fog = false;

            if (introAudioSource != null && introAudioSource.isPlaying)
            {
                introAudioSource.Stop();
            }
        }
    }
}
