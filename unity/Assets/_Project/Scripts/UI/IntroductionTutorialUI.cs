using System;
using UnityEngine;
using UnityEngine.UI;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif
using WhisperingWilds.Core;
using WhisperingWilds.Localization;
using WhisperingWilds.Player;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Step 2 Execution: Guided movement & interaction introduction.
    /// Provides responsive, progressive, bilingual tutorial prompts in the starting area:
    /// - Step 1: Walking & Turning (WASD / Left Stick)
    /// - Step 2: Camera Orbit (Mouse / Right Stick)
    /// - Step 3: Sprinting & Crouching (Shift / C / Left Stick Click)
    /// - Step 4: Investigating & Interacting (E / West Button on Murugan / Tea Kadai)
    /// - Step 5: Field Journal & Pause (J / Tab / Esc / Start)
    /// Advances automatically when the player executes each mechanic.
    /// </summary>
    public class IntroductionTutorialUI : MonoBehaviour
    {
        public static IntroductionTutorialUI Instance { get; private set; }

        public const string PrefKeyTutorialCompleted = "WW_TutorialCompleted";

        [Header("Tutorial State")]
        [SerializeField] private int currentStep = 0;
        [SerializeField] private bool isCompleted = false;
        [SerializeField] private bool hideIfCompleted = true;

        [Header("UI Elements")]
        [SerializeField] private GameObject tutorialRoot;
        [SerializeField] private Text titleText;
        [SerializeField] private Text instructionText;
        [SerializeField] private Text stepCounterText;
        [SerializeField] private Button dismissButton;

        private PlayerMovement playerMovement;
        private PlayerInputHandler playerInput;
        private Vector3 lastRecordedPosition;
        private float accumulatedDistance = 0f;
        private float accumulatedYawChange = 0f;
        private float previousCameraYaw = 0f;

        private readonly string[] stepKeys = new string[]
        {
            "tutorial.move",
            "tutorial.look",
            "tutorial.sprint_crouch",
            "tutorial.interact",
            "tutorial.journal_pause"
        };

        public int CurrentStep => currentStep;
        public bool IsCompleted => isCompleted;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;

            isCompleted = PlayerPrefs.GetInt(PrefKeyTutorialCompleted, 0) == 1;

            if (tutorialRoot == null)
            {
                BuildDynamicTutorialUI();
            }

            if (dismissButton != null)
            {
                dismissButton.onClick.AddListener(DismissTutorial);
            }

            if (isCompleted && hideIfCompleted && tutorialRoot != null)
            {
                tutorialRoot.SetActive(false);
            }
        }

        private void OnEnable()
        {
            if (LocalizationManager.Instance != null)
            {
                LocalizationManager.Instance.OnLanguageChanged += OnLanguageChanged;
            }
        }

        private void OnDisable()
        {
            if (LocalizationManager.Instance != null)
            {
                LocalizationManager.Instance.OnLanguageChanged -= OnLanguageChanged;
            }
        }

        private void OnLanguageChanged(Language lang)
        {
            UpdateUI();
        }

        private void Start()
        {
            BindPlayer();
            UpdateUI();
        }

        private void BindPlayer()
        {
            var playerObj = GameObject.FindWithTag("Player");
            if (playerObj != null)
            {
                playerMovement = playerObj.GetComponent<PlayerMovement>();
                playerInput = playerObj.GetComponent<PlayerInputHandler>();
                lastRecordedPosition = playerObj.transform.position;
            }

            if (Camera.main != null)
            {
                previousCameraYaw = Camera.main.transform.eulerAngles.y;
            }
        }

        private void Update()
        {
            if (isCompleted) return;

            if (playerMovement == null || playerInput == null)
            {
                BindPlayer();
                if (playerMovement == null) return;
            }

            // Verify gameplay state
            if (GameManager.Instance != null && GameManager.Instance.CurrentState != GameState.Gameplay)
            {
                return;
            }

            switch (currentStep)
            {
                case 0: // Step 0: Move
                    float moveDist = Vector3.Distance(playerMovement.transform.position, lastRecordedPosition);
                    if (moveDist > 0.01f)
                    {
                        accumulatedDistance += moveDist;
                        lastRecordedPosition = playerMovement.transform.position;
                    }
                    if (accumulatedDistance >= 2.5f || playerMovement.CurrentSpeed > 1.5f)
                    {
                        AdvanceStep();
                    }
                    break;

                case 1: // Step 1: Look
                    if (Camera.main != null)
                    {
                        float currentYaw = Camera.main.transform.eulerAngles.y;
                        accumulatedYawChange += Mathf.Abs(Mathf.DeltaAngle(previousCameraYaw, currentYaw));
                        previousCameraYaw = currentYaw;
                    }
                    if (accumulatedYawChange >= 40f || playerInput.LookInput.sqrMagnitude > 2f)
                    {
                        AdvanceStep();
                    }
                    break;

                case 2: // Step 2: Sprint & Crouch
                    if (playerInput.IsSprinting || playerInput.IsCrouching)
                    {
                        AdvanceStep();
                    }
                    break;

                case 3: // Step 3: Interact
                    if (playerInput.InteractTriggered)
                    {
                        AdvanceStep();
                    }
                    break;

                case 4: // Step 4: Journal / Pause
                    if (playerInput.JournalTriggered || playerInput.CancelTriggered)
                    {
                        CompleteTutorial();
                    }
                    break;
            }
        }

        public void AdvanceStep()
        {
            currentStep++;
            if (currentStep >= stepKeys.Length)
            {
                CompleteTutorial();
            }
            else
            {
                UpdateUI();
            }
        }

        public void CompleteTutorial()
        {
            isCompleted = true;
            PlayerPrefs.SetInt(PrefKeyTutorialCompleted, 1);
            PlayerPrefs.Save();

            if (instructionText != null)
            {
                var mgr = LocalizationManager.Instance;
                instructionText.text = mgr != null
                    ? mgr.GetForDisplay("tutorial.complete")
                    : "Introduction complete! Explore George Town.";
            }

            if (tutorialRoot != null)
            {
                // Auto-fade after 4 seconds
                StartCoroutine(DelayedDismiss(4.0f));
            }
        }

        private System.Collections.IEnumerator DelayedDismiss(float delay)
        {
            yield return new WaitForSecondsRealtime(delay);
            if (tutorialRoot != null) tutorialRoot.SetActive(false);
        }

        public void SetTutorialCompletedState(bool completed)
        {
            isCompleted = completed;
            PlayerPrefs.SetInt(PrefKeyTutorialCompleted, completed ? 1 : 0);
            PlayerPrefs.Save();
            if (tutorialRoot != null && hideIfCompleted)
            {
                tutorialRoot.SetActive(!completed);
            }
        }

        public void DismissTutorial()
        {
            isCompleted = true;
            PlayerPrefs.SetInt(PrefKeyTutorialCompleted, 1);
            PlayerPrefs.Save();
            if (tutorialRoot != null) tutorialRoot.SetActive(false);
        }

        public void ResetTutorial()
        {
            isCompleted = false;
            currentStep = 0;
            accumulatedDistance = 0f;
            accumulatedYawChange = 0f;
            PlayerPrefs.SetInt(PrefKeyTutorialCompleted, 0);
            PlayerPrefs.Save();
            if (tutorialRoot != null) tutorialRoot.SetActive(true);
            UpdateUI();
        }

        private void UpdateUI()
        {
            if (tutorialRoot == null) return;

            var mgr = LocalizationManager.Instance;
            if (titleText != null)
            {
                LocalizedFontProvider.Apply(titleText);
                titleText.text = mgr != null ? mgr.GetForDisplay("tutorial.title") : "EXPLORER GUIDE";
            }

            if (currentStep < stepKeys.Length && instructionText != null)
            {
                LocalizedFontProvider.Apply(instructionText);
                instructionText.text = mgr != null ? mgr.GetForDisplay(stepKeys[currentStep]) : "Follow the prompt";
            }

            if (stepCounterText != null)
            {
                stepCounterText.text = $"{currentStep + 1} / {stepKeys.Length}";
            }

            if (dismissButton != null)
            {
                var txt = dismissButton.GetComponentInChildren<Text>();
                if (txt != null)
                {
                    LocalizedFontProvider.Apply(txt);
                    txt.text = mgr != null ? mgr.GetForDisplay("tutorial.dismiss") : "Dismiss";
                }
            }
        }

        private void BuildDynamicTutorialUI()
        {
            var canvasObj = GameObject.Find("HUD_Canvas");
            Canvas canvas = canvasObj != null ? canvasObj.GetComponent<Canvas>() : FindAnyObjectByType<Canvas>();
            if (canvas == null)
            {
                var newCanvas = new GameObject("Tutorial_Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
                canvas = newCanvas.GetComponent<Canvas>();
                canvas.renderMode = RenderMode.ScreenSpaceOverlay;
                canvas.sortingOrder = 500;
            }

            tutorialRoot = new GameObject("TutorialPanel", typeof(RectTransform), typeof(Image));
            tutorialRoot.transform.SetParent(canvas.transform, false);

            var rt = tutorialRoot.GetComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.5f, 1f);
            rt.anchorMax = new Vector2(0.5f, 1f);
            rt.pivot = new Vector2(0.5f, 1f);
            rt.anchoredPosition = new Vector2(0f, -70f);
            rt.sizeDelta = new Vector2(580f, 74f);

            var bg = tutorialRoot.GetComponent<Image>();
            bg.color = new Color(0.08f, 0.10f, 0.14f, 0.92f);

            // Title
            var titleObj = new GameObject("Title", typeof(RectTransform), typeof(Text));
            titleObj.transform.SetParent(tutorialRoot.transform, false);
            var titleRt = titleObj.GetComponent<RectTransform>();
            titleRt.anchoredPosition = new Vector2(-180f, 18f);
            titleRt.sizeDelta = new Vector2(180f, 24f);
            titleText = titleObj.GetComponent<Text>();
            titleText.fontSize = 13;
            titleText.fontStyle = FontStyle.Bold;
            titleText.color = new Color(0.95f, 0.8f, 0.4f);

            // Step counter
            var counterObj = new GameObject("StepCounter", typeof(RectTransform), typeof(Text));
            counterObj.transform.SetParent(tutorialRoot.transform, false);
            var counterRt = counterObj.GetComponent<RectTransform>();
            counterRt.anchoredPosition = new Vector2(230f, 18f);
            counterRt.sizeDelta = new Vector2(80f, 24f);
            stepCounterText = counterObj.GetComponent<Text>();
            stepCounterText.fontSize = 12;
            stepCounterText.alignment = TextAnchor.MiddleRight;
            stepCounterText.color = new Color(0.6f, 0.7f, 0.8f);

            // Instruction
            var instObj = new GameObject("Instruction", typeof(RectTransform), typeof(Text));
            instObj.transform.SetParent(tutorialRoot.transform, false);
            var instRt = instObj.GetComponent<RectTransform>();
            instRt.anchoredPosition = new Vector2(0f, -10f);
            instRt.sizeDelta = new Vector2(540f, 32f);
            instructionText = instObj.GetComponent<Text>();
            instructionText.fontSize = 15;
            instructionText.alignment = TextAnchor.MiddleCenter;
            instructionText.color = Color.white;

            // Dismiss Button
            var btnObj = new GameObject("Btn_Dismiss", typeof(RectTransform), typeof(Button));
            btnObj.transform.SetParent(tutorialRoot.transform, false);
            var btnRt = btnObj.GetComponent<RectTransform>();
            btnRt.anchoredPosition = new Vector2(265f, 18f);
            btnRt.sizeDelta = new Vector2(24f, 24f);
            dismissButton = btnObj.GetComponent<Button>();
        }
    }
}
