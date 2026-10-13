using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.Localization;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// STEP 40 — Cinematic introduction sequence for The Whispering Wilds.
    /// 
    /// Plays a 20-30 second atmospheric opening before the main menu:
    /// 1. Fade from black with ambient soundscape
    /// 2. Reveal Tamil Nadu landscape at dawn
    /// 3. Camera moves toward a mysterious trail
    /// 4. Title fades in with Tamil subtitle
    /// 5. Transition to main menu
    /// 
    /// Supports skip via keyboard, mouse, or controller.
    /// Does not replay when returning from Settings or resuming.
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

        [Header("Timing")]
        [Tooltip("Total duration of the cinematic intro in seconds")]
        [SerializeField] private float totalDuration = 25f;
        [Tooltip("Time when title starts fading in")]
        [SerializeField] private float titleFadeInStart = 14f;
        [Tooltip("Time when title is fully visible")]
        [SerializeField] private float titleFadeInEnd = 18f;
        [Tooltip("Time when intro fades to main menu")]
        [SerializeField] private float menuFadeStart = 21f;
        [Tooltip("Time when intro completes and menu appears")]
        [SerializeField] private float menuFadeEnd = 25f;

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

        private bool _introPlayed = false;
        private bool _skipped = false;
        private bool _isPlaying = false;
        private float _elapsedTime = 0f;
        private Coroutine _introCoroutine;
        private Vector3 _originalCameraPos;
        private Quaternion _originalCameraRot;

        public bool IntroPlayed => _introPlayed;
        public bool IsPlaying => _isPlaying;

        private void Awake()
        {
            // Check if intro was already played this session
            _introPlayed = PlayerPrefs.GetInt("WW_IntroPlayed", 0) == 1;
        }

        private void Start()
        {
            // Hide only the menu content during the intro. The canvas itself stays active
            // so that intro visuals (which are canvas children) remain visible.
            if (menuRoot != null)
            {
                menuRoot.SetActive(false);
            }

            // Setup intro visuals
            SetupIntroVisuals();

            // Start or skip intro
            if (_introPlayed)
            {
                SkipIntro();
            }
            else
            {
                StartIntro();
            }
        }

        private void Update()
        {
            // Skip on any input
            if (_isPlaying && !_skipped && Input.anyKeyDown)
            {
                SkipIntro();
            }
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
            if (introVignette != null) introVignette.SetActive(true);
            if (introTitleGroup != null) introTitleGroup.SetActive(true);
            if (introSkipText != null) introSkipText.gameObject.SetActive(true);

            // Mark intro as played for this session
            PlayerPrefs.SetInt("WW_IntroPlayed", 1);
            PlayerPrefs.Save();
            _introPlayed = true;

            // Start the intro coroutine
            if (_introCoroutine != null) StopCoroutine(_introCoroutine);
            _introCoroutine = StartCoroutine(PlayIntro());
        }

        private IEnumerator PlayIntro()
        {
            float elapsed = 0f;

            while (elapsed < totalDuration && _isPlaying && !_skipped)
            {
                elapsed += Time.deltaTime;
                _elapsedTime = elapsed;

                // Phase 1: Fade in background (0-5s)
                if (elapsed < 5f)
                {
                    float t = elapsed / 5f;
                    if (introBackground != null)
                    {
                        var bgImage = introBackground.GetComponent<Image>();
                        if (bgImage != null)
                        {
                            bgImage.color = new Color(backgroundColor.r, backgroundColor.g, backgroundColor.b, t);
                        }
                    }
                }

                // Phase 2: Show skip text (3-8s)
                if (elapsed >= 3f && elapsed < 8f)
                {
                    float t = Mathf.Clamp01((elapsed - 3f) / 1f);
                    if (introSkipText != null)
                    {
                        introSkipText.color = new Color(0.6f, 0.65f, 0.7f, t * 0.6f);
                    }
                }
                else if (elapsed >= 8f && introSkipText != null)
                {
                    // Fade out skip text
                    float t = Mathf.Clamp01(1f - (elapsed - 8f) / 2f);
                    introSkipText.color = new Color(0.6f, 0.65f, 0.7f, t * 0.6f);
                }

                // Phase 3: Camera movement (5-15s)
                if (elapsed >= 5f && elapsed < 15f && introCamera != null)
                {
                    float t = (elapsed - 5f) / 10f;
                    t = SmoothStep(t);

                    Vector3 pos = Vector3.Lerp(cameraStartOffset, cameraEndOffset, t);
                    Vector3 rot = Vector3.Lerp(cameraStartRotation, cameraEndRotation, t);

                    introCamera.transform.position = _originalCameraPos + pos;
                    introCamera.transform.rotation = Quaternion.Euler(rot);
                }

                // Phase 4: Title fade in (14-18s)
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

                // Phase 5: Fade to menu (21-25s)
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
            _isPlaying = false;

            // Hide intro elements
            if (introBackground != null) introBackground.SetActive(false);
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

            // Reset state
            _introPlayed = false;
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
