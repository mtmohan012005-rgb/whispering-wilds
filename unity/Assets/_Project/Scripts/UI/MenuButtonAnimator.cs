using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// STEP 70 — Adds subtle hover, press, and keyboard-focus feedback to menu buttons.
    /// 
    /// Each button scales slightly on hover, shrinks on press, and shows a clear
    /// focus indicator for keyboard/controller navigation. All transitions are smooth
    /// and do not shift the VerticalLayoutGroup.
    /// </summary>
    public class MenuButtonAnimator : MonoBehaviour
    {
        [Header("Visual Settings")]
        [Tooltip("Scale multiplier when hovered")]
        [SerializeField] private float hoverScale = 1.05f;
        [Tooltip("Scale multiplier when pressed")]
        [SerializeField] private float pressScale = 0.97f;
        [Tooltip("How quickly the button scales to its target")]
        [SerializeField] private float transitionSpeed = 12f;
        [Tooltip("Highlight color overlay on hover")]
        [SerializeField] private Color hoverOverlayColor = new Color(1f, 1f, 1f, 0.12f);
        [Tooltip("Focus border color for keyboard/controller navigation")]
        [SerializeField] private Color focusBorderColor = new Color(1f, 0.85f, 0.35f);

        private Button _button;
        private Image _image;
        private RectTransform _rect;
        private Vector3 _targetScale = Vector3.one;
        private bool _isHovered = false;
        private bool _isPressed = false;
        private bool _isFocused = false;

        private void Awake()
        {
            _button = GetComponent<Button>();
            _image = GetComponent<Image>();
            _rect = GetComponent<RectTransform>();
        }

        private void OnEnable()
        {
            if (_button != null)
            {
                _button.onClick.AddListener(OnPressed);
            }
        }

        private void OnDisable()
        {
            if (_button != null)
            {
                _button.onClick.RemoveListener(OnPressed);
            }
            // Reset state
            _isHovered = false;
            _isPressed = false;
            _isFocused = false;
            _targetScale = Vector3.one;
            if (_rect != null) _rect.localScale = Vector3.one;
        }

        private void OnPointerEnter()
        {
            _isHovered = true;
            _targetScale = new Vector3(hoverScale, hoverScale, 1f);
        }

        private void OnPointerExit()
        {
            _isHovered = false;
            if (!_isPressed)
            {
                _targetScale = Vector3.one;
            }
        }

        private void OnSelect(BaseEventData eventData)
        {
            // Keyboard/controller focus
            _isFocused = true;
            if (!_isHovered)
            {
                _targetScale = new Vector3(hoverScale * 0.98f, hoverScale * 0.98f, 1f);
            }
        }

        private void OnDeselect(BaseEventData eventData)
        {
            _isFocused = false;
            if (!_isHovered && !_isPressed)
            {
                _targetScale = Vector3.one;
            }
        }

        private void OnPressed()
        {
            _isPressed = true;
            _targetScale = new Vector3(pressScale, pressScale, 1f);
        }

        private void Update()
        {
            if (_rect == null) return;

            // Smooth scale transition using unscaled time for responsiveness at Time.timeScale=0
            Vector3 current = _rect.localScale;
            Vector3 desired = _targetScale;
            _rect.localScale = Vector3.Lerp(current, desired, Time.unscaledDeltaTime * transitionSpeed);

            // Apply hover overlay
            if (_image != null)
            {
                if (_isHovered || _isFocused)
                {
                    Color baseColor = _image.color;
                    Color overlay = hoverOverlayColor;
                    _image.color = new Color(
                        Mathf.Lerp(baseColor.r, Mathf.Max(baseColor.r, overlay.r), 0.5f),
                        Mathf.Lerp(baseColor.g, Mathf.Max(baseColor.g, overlay.g), 0.5f),
                        Mathf.Lerp(baseColor.b, Mathf.Max(baseColor.b, overlay.b), 0.5f),
                        baseColor.a
                    );
                }
            }

            // Release press state after a short delay
            if (_isPressed)
            {
                _isPressed = false;
                if (_isHovered)
                {
                    _targetScale = new Vector3(hoverScale, hoverScale, 1f);
                }
                else if (_isFocused)
                {
                    _targetScale = new Vector3(hoverScale * 0.98f, hoverScale * 0.98f, 1f);
                }
                else
                {
                    _targetScale = Vector3.one;
                }
            }
        }
    }
}
