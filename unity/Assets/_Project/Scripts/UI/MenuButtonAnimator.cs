using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Professional AAA Menu Button Animator for The Whispering Wilds (காட்டு வழி • தடம்).
    /// 
    /// Features:
    /// - Smooth hover scale increase (1.00 -> 1.04) with smooth easing
    /// - Press scale dip (0.97) with instant responsive tactile feedback
    /// - Antique-gold border illumination & background highlight
    /// - Left gold accent indicator reveal
    /// - Audio triggers on hover (ui_hover) and on click (ui_click)
    /// - Full EventSystem support (mouse pointer, keyboard navigation, gamepad selection)
    /// - Operates on unscaled real time (Time.unscaledDeltaTime) so it stays fluid at Time.timeScale = 0
    /// </summary>
    [DisallowMultipleComponent]
    [RequireComponent(typeof(Button))]
    public class MenuButtonAnimator : MonoBehaviour,
        IPointerEnterHandler, IPointerExitHandler,
        IPointerDownHandler, IPointerUpHandler,
        ISelectHandler, IDeselectHandler
    {
        [Header("Visual Settings")]
        [Tooltip("Scale multiplier when hovered")]
        [SerializeField] private float hoverScale = 1.04f;
        [Tooltip("Scale multiplier when pressed")]
        [SerializeField] private float pressScale = 0.97f;
        [Tooltip("How quickly the button scales to its target")]
        [SerializeField] private float transitionSpeed = 14f;

        [Header("Colors")]
        [SerializeField] private Color normalBorderColor = new Color(0.82f, 0.68f, 0.32f, 0.40f);
        [SerializeField] private Color hoverBorderColor = new Color(1.0f, 0.88f, 0.42f, 1.0f);
        [SerializeField] private Color pressedBorderColor = new Color(1.0f, 0.95f, 0.60f, 1.0f);
        [SerializeField] private Color normalTextColor = new Color(0.92f, 0.88f, 0.78f, 0.95f);
        [SerializeField] private Color hoverTextColor = new Color(1.0f, 0.96f, 0.80f, 1.0f);

        [Header("Audio")]
        [SerializeField] private AudioClip hoverClip;
        [SerializeField] private AudioClip clickClip;

        private Button _button;
        private Image _image;
        private Outline _outline;
        private RectTransform _rect;
        private Text _text;
        private Transform _leftAccent;
        private Vector3 _targetScale = Vector3.one;
        private bool _isHovered = false;
        private bool _isPressed = false;
        private bool _isFocused = false;
        private static AudioSource _sharedAudioSource;

        private void Awake()
        {
            _button = GetComponent<Button>();
            _image = GetComponent<Image>();
            _rect = GetComponent<RectTransform>();
            _outline = GetComponent<Outline>();
            _text = GetComponentInChildren<Text>();
            _leftAccent = transform.Find("LeftAccent");

            EnsureOutline();
            EnsureAudioSource();
            LoadAudioClips();
        }

        private void EnsureOutline()
        {
            if (_outline == null)
            {
                _outline = gameObject.AddComponent<Outline>();
                _outline.effectColor = normalBorderColor;
                _outline.effectDistance = new Vector2(1.5f, -1.5f);
                _outline.useGraphicAlpha = true;
            }
        }

        private void EnsureAudioSource()
        {
            if (_sharedAudioSource == null)
            {
                var go = GameObject.Find("UIAudioSource");
                if (go == null)
                {
                    go = new GameObject("UIAudioSource");
                    DontDestroyOnLoad(go);
                    _sharedAudioSource = go.AddComponent<AudioSource>();
                    _sharedAudioSource.playOnAwake = false;
                    _sharedAudioSource.spatialBlend = 0f;
                }
                else
                {
                    _sharedAudioSource = go.GetComponent<AudioSource>();
                }
            }
        }

        private void LoadAudioClips()
        {
            if (hoverClip == null)
            {
                hoverClip = Resources.Load<AudioClip>("Audio/ui_hover") 
                    ?? Resources.Load<AudioClip>("ui_hover");
            }
            if (clickClip == null)
            {
                clickClip = Resources.Load<AudioClip>("Audio/ui_click") 
                    ?? Resources.Load<AudioClip>("ui_click");
            }
        }

        private void OnEnable()
        {
            if (_button != null)
            {
                _button.onClick.AddListener(OnButtonClicked);
            }
            _isHovered = false;
            _isPressed = false;
            _isFocused = false;
            _targetScale = Vector3.one;
            if (_rect != null) _rect.localScale = Vector3.one;
            ApplyVisualState();
        }

        private void OnDisable()
        {
            if (_button != null)
            {
                _button.onClick.RemoveListener(OnButtonClicked);
            }
            _isHovered = false;
            _isPressed = false;
            _isFocused = false;
            _targetScale = Vector3.one;
            if (_rect != null) _rect.localScale = Vector3.one;
            ApplyVisualState();
        }

        public void OnPointerEnter(PointerEventData eventData)
        {
            if (_button != null && !_button.interactable) return;
            _isHovered = true;
            _targetScale = new Vector3(hoverScale, hoverScale, 1f);
            PlayHoverSound();
            ApplyVisualState();
        }

        public void OnPointerExit(PointerEventData eventData)
        {
            _isHovered = false;
            _isPressed = false;
            if (!_isFocused)
            {
                _targetScale = Vector3.one;
            }
            ApplyVisualState();
        }

        public void OnPointerDown(PointerEventData eventData)
        {
            if (_button != null && !_button.interactable) return;
            _isPressed = true;
            _targetScale = new Vector3(pressScale, pressScale, 1f);
            ApplyVisualState();
        }

        public void OnPointerUp(PointerEventData eventData)
        {
            _isPressed = false;
            if (_isHovered || _isFocused)
            {
                _targetScale = new Vector3(hoverScale, hoverScale, 1f);
            }
            else
            {
                _targetScale = Vector3.one;
            }
            ApplyVisualState();
        }

        public void OnSelect(BaseEventData eventData)
        {
            _isFocused = true;
            if (!_isHovered)
            {
                _targetScale = new Vector3(hoverScale, hoverScale, 1f);
                PlayHoverSound();
            }
            ApplyVisualState();
        }

        public void OnDeselect(BaseEventData eventData)
        {
            _isFocused = false;
            if (!_isHovered && !_isPressed)
            {
                _targetScale = Vector3.one;
            }
            ApplyVisualState();
        }

        private void OnButtonClicked()
        {
            PlayClickSound();
            _targetScale = new Vector3(pressScale, pressScale, 1f);
        }

        private void PlayHoverSound()
        {
            if (hoverClip != null && _sharedAudioSource != null)
            {
                _sharedAudioSource.PlayOneShot(hoverClip, 0.45f);
            }
        }

        private void PlayClickSound()
        {
            if (clickClip != null && _sharedAudioSource != null)
            {
                _sharedAudioSource.PlayOneShot(clickClip, 0.65f);
            }
        }

        private void ApplyVisualState()
        {
            bool highlighted = _isHovered || _isFocused;

            if (_outline != null)
            {
                if (_isPressed)
                {
                    _outline.effectColor = pressedBorderColor;
                }
                else if (highlighted)
                {
                    _outline.effectColor = hoverBorderColor;
                }
                else
                {
                    _outline.effectColor = normalBorderColor;
                }
            }

            if (_text != null)
            {
                _text.color = highlighted ? hoverTextColor : normalTextColor;
            }

            if (_leftAccent != null)
            {
                _leftAccent.gameObject.SetActive(highlighted);
            }
        }

        private void Update()
        {
            if (_rect == null) return;

            // Smooth scale transition using unscaled time
            Vector3 current = _rect.localScale;
            Vector3 desired = _targetScale;
            _rect.localScale = Vector3.Lerp(current, desired, Time.unscaledDeltaTime * transitionSpeed);
        }
    }
}
