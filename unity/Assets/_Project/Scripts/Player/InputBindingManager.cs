using System;
using System.Collections.Generic;
using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace WhisperingWilds.Player
{
    /// <summary>
    /// Master enumeration of all rebindable gameplay and interface actions.
    /// </summary>
    public enum GameAction
    {
        MoveForward,
        MoveBackward,
        MoveLeft,
        MoveRight,
        Sprint,
        Jump,
        Crouch,
        Interact,
        PrimaryAction,
        SecondaryAction,
        Reload,
        SwapTool,
        QuickItem,
        Pause,
        Inventory,
        Map,
        Journal
    }

    public enum InputBindingType
    {
        Keyboard,
        MouseButton
    }

    public enum MouseButton
    {
        Left = 0,
        Right = 1,
        Middle = 2
    }

    public enum ActionMode
    {
        Hold = 0,
        Toggle = 1
    }

    [Serializable]
    public class ActionBinding
    {
        public GameAction action;
        public InputBindingType type;
#if ENABLE_INPUT_SYSTEM
        public Key key;
#else
        public int key;
#endif
        public MouseButton mouseButton;

        public ActionBinding() { }

#if ENABLE_INPUT_SYSTEM
        public ActionBinding(GameAction action, Key key)
        {
            this.action = action;
            this.type = InputBindingType.Keyboard;
            this.key = key;
            this.mouseButton = MouseButton.Left;
        }

        public ActionBinding(GameAction action, MouseButton mouseButton)
        {
            this.action = action;
            this.type = InputBindingType.MouseButton;
            this.key = Key.None;
            this.mouseButton = mouseButton;
        }
#endif
    }

    /// <summary>
    /// Centralized input binding manager supporting runtime rebinding, conflict detection,
    /// PlayerPrefs persistence, hold/toggle sprint and crouch modes, and simulation hooks for testing.
    /// </summary>
    [DisallowMultipleComponent]
    public class InputBindingManager : MonoBehaviour
    {
        private static InputBindingManager _instance;
        public static InputBindingManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    _instance = FindObjectOfType<InputBindingManager>();
if (_instance == null)
                {
                    var go = new GameObject("--- InputBindingManager ---");
                    _instance = go.AddComponent<InputBindingManager>();
                    if (Application.isPlaying) DontDestroyOnLoad(go);
                }
                }
                return _instance;
            }
        }

        private ActionMode _sprintMode = ActionMode.Hold;
        public ActionMode sprintMode
        {
            get => _sprintMode;
            set
            {
                _sprintMode = value;
                PlayerPrefs.SetInt("WW_SprintMode", (int)value);
                PlayerPrefs.Save();
            }
        }

        private ActionMode _crouchMode = ActionMode.Hold;
        public ActionMode crouchMode
        {
            get => _crouchMode;
            set
            {
                _crouchMode = value;
                PlayerPrefs.SetInt("WW_CrouchMode", (int)value);
                PlayerPrefs.Save();
            }
        }

        public event Action OnBindingsChanged;

        private readonly Dictionary<GameAction, ActionBinding> _bindings = new Dictionary<GameAction, ActionBinding>();

        // Simulation dictionary for headless/automated unit and integration testing
        private readonly Dictionary<GameAction, bool> _simPressed = new Dictionary<GameAction, bool>();
        private readonly Dictionary<GameAction, bool> _simTriggered = new Dictionary<GameAction, bool>();
        private readonly Dictionary<GameAction, bool> _simReleased = new Dictionary<GameAction, bool>();
        private bool _isSimulationActive = false;

        private void Awake()
        {
            if (_instance != null && _instance != this)
            {
                if (Application.isPlaying) Destroy(gameObject);
                else DestroyImmediate(gameObject);
                return;
            }
            _instance = this;
            if (Application.isPlaying) DontDestroyOnLoad(gameObject);
            LoadBindings();
        }

        private void OnDestroy()
        {
            if (_instance == this) _instance = null;
        }

        public void LoadBindings()
        {
            _bindings.Clear();
            InitializeDefaults();

            // Load overrides from PlayerPrefs
            sprintMode = (ActionMode)PlayerPrefs.GetInt("WW_SprintMode", (int)ActionMode.Hold);
            crouchMode = (ActionMode)PlayerPrefs.GetInt("WW_CrouchMode", (int)ActionMode.Hold);

            foreach (GameAction action in Enum.GetValues(typeof(GameAction)))
            {
                string keyPref = "WW_BindKey_" + action;
                string typePref = "WW_BindType_" + action;
                string mousePref = "WW_BindMouse_" + action;

                if (PlayerPrefs.HasKey(typePref))
                {
                    InputBindingType type = (InputBindingType)PlayerPrefs.GetInt(typePref);
                    if (type == InputBindingType.Keyboard && PlayerPrefs.HasKey(keyPref))
                    {
#if ENABLE_INPUT_SYSTEM
                        Key key = (Key)PlayerPrefs.GetInt(keyPref);
                        _bindings[action] = new ActionBinding(action, key);
#endif
                    }
                    else if (type == InputBindingType.MouseButton && PlayerPrefs.HasKey(mousePref))
                    {
                        MouseButton button = (MouseButton)PlayerPrefs.GetInt(mousePref);
#if ENABLE_INPUT_SYSTEM
                        _bindings[action] = new ActionBinding(action, button);
#endif
                    }
                }
            }

            OnBindingsChanged?.Invoke();
        }

        public void SaveBindings()
        {
            PlayerPrefs.SetInt("WW_SprintMode", (int)sprintMode);
            PlayerPrefs.SetInt("WW_CrouchMode", (int)crouchMode);

            foreach (var kvp in _bindings)
            {
                GameAction action = kvp.Key;
                ActionBinding binding = kvp.Value;

                PlayerPrefs.SetInt("WW_BindType_" + action, (int)binding.type);
#if ENABLE_INPUT_SYSTEM
                PlayerPrefs.SetInt("WW_BindKey_" + action, (int)binding.key);
#endif
                PlayerPrefs.SetInt("WW_BindMouse_" + action, (int)binding.mouseButton);
            }

            PlayerPrefs.Save();
            OnBindingsChanged?.Invoke();
        }

        public void ResetToDefaults()
        {
            _sprintMode = ActionMode.Hold;
            _crouchMode = ActionMode.Hold;

            foreach (GameAction action in Enum.GetValues(typeof(GameAction)))
            {
                PlayerPrefs.DeleteKey("WW_BindKey_" + action);
                PlayerPrefs.DeleteKey("WW_BindType_" + action);
                PlayerPrefs.DeleteKey("WW_BindMouse_" + action);
            }
            PlayerPrefs.DeleteKey("WW_SprintMode");
            PlayerPrefs.DeleteKey("WW_CrouchMode");
            PlayerPrefs.Save();

            _bindings.Clear();
            InitializeDefaults();
            OnBindingsChanged?.Invoke();
        }

        private void InitializeDefaults()
        {
#if ENABLE_INPUT_SYSTEM
            _bindings[GameAction.MoveForward] = new ActionBinding(GameAction.MoveForward, Key.W);
            _bindings[GameAction.MoveBackward] = new ActionBinding(GameAction.MoveBackward, Key.S);
            _bindings[GameAction.MoveLeft] = new ActionBinding(GameAction.MoveLeft, Key.A);
            _bindings[GameAction.MoveRight] = new ActionBinding(GameAction.MoveRight, Key.D);

            _bindings[GameAction.Sprint] = new ActionBinding(GameAction.Sprint, Key.LeftShift);
            _bindings[GameAction.Jump] = new ActionBinding(GameAction.Jump, Key.Space);
            _bindings[GameAction.Crouch] = new ActionBinding(GameAction.Crouch, Key.C);
            _bindings[GameAction.Interact] = new ActionBinding(GameAction.Interact, Key.E);

            _bindings[GameAction.PrimaryAction] = new ActionBinding(GameAction.PrimaryAction, MouseButton.Left);
            _bindings[GameAction.SecondaryAction] = new ActionBinding(GameAction.SecondaryAction, MouseButton.Right);

            _bindings[GameAction.Reload] = new ActionBinding(GameAction.Reload, Key.R);
            _bindings[GameAction.SwapTool] = new ActionBinding(GameAction.SwapTool, Key.Q);
            _bindings[GameAction.QuickItem] = new ActionBinding(GameAction.QuickItem, Key.F);

            _bindings[GameAction.Pause] = new ActionBinding(GameAction.Pause, Key.Escape);
            _bindings[GameAction.Inventory] = new ActionBinding(GameAction.Inventory, Key.I);
            _bindings[GameAction.Map] = new ActionBinding(GameAction.Map, Key.M);
            _bindings[GameAction.Journal] = new ActionBinding(GameAction.Journal, Key.J);
#endif
        }

#if ENABLE_INPUT_SYSTEM
        public bool CheckConflict(GameAction targetAction, Key newKey, out GameAction conflictingAction)
        {
            conflictingAction = targetAction;
            if (newKey == Key.None) return false;

            foreach (var kvp in _bindings)
            {
                if (kvp.Key == targetAction) continue;
                if (kvp.Value.type == InputBindingType.Keyboard && kvp.Value.key == newKey)
                {
                    conflictingAction = kvp.Key;
                    return true;
                }
            }
            return false;
        }

        public bool CheckMouseConflict(GameAction targetAction, MouseButton button, out GameAction conflictingAction)
        {
            conflictingAction = targetAction;
            foreach (var kvp in _bindings)
            {
                if (kvp.Key == targetAction) continue;
                if (kvp.Value.type == InputBindingType.MouseButton && kvp.Value.mouseButton == button)
                {
                    conflictingAction = kvp.Key;
                    return true;
                }
            }
            return false;
        }

        public bool RebindAction(GameAction action, Key newKey)
        {
            if (!_bindings.ContainsKey(action)) InitializeDefaults();
            _bindings[action] = new ActionBinding(action, newKey);
            SaveBindings();
            return true;
        }

        public bool RebindMouseAction(GameAction action, MouseButton button)
        {
            if (!_bindings.ContainsKey(action)) InitializeDefaults();
            _bindings[action] = new ActionBinding(action, button);
            SaveBindings();
            return true;
        }

        public ActionBinding GetBinding(GameAction action)
        {
            if (!_bindings.TryGetValue(action, out var binding))
            {
                InitializeDefaults();
                _bindings.TryGetValue(action, out binding);
            }
            return binding;
        }
#endif

        public string GetBindingDisplayName(GameAction action)
        {
#if ENABLE_INPUT_SYSTEM
            var binding = GetBinding(action);
            if (binding == null) return "None";

            if (binding.type == InputBindingType.MouseButton)
            {
                switch (binding.mouseButton)
                {
                    case MouseButton.Left: return "LMB";
                    case MouseButton.Right: return "RMB";
                    case MouseButton.Middle: return "MMB";
                    default: return "Mouse";
                }
            }
            else
            {
                switch (binding.key)
                {
                    case Key.LeftShift: return "L-Shift";
                    case Key.RightShift: return "R-Shift";
                    case Key.Space: return "Space";
                    case Key.Escape: return "Esc";
                    default: return binding.key.ToString();
                }
            }
#else
            return action.ToString();
#endif
        }

        // ==================== Live Input Queries ====================

        public bool IsActionPressed(GameAction action)
        {
            if (_isSimulationActive)
            {
                return _simPressed.TryGetValue(action, out bool p) && p;
            }

#if ENABLE_INPUT_SYSTEM
            var binding = GetBinding(action);
            if (binding == null) return false;

            if (binding.type == InputBindingType.MouseButton)
            {
                var mouse = Mouse.current;
                if (mouse == null) return false;
                switch (binding.mouseButton)
                {
                    case MouseButton.Left: return mouse.leftButton.isPressed;
                    case MouseButton.Right: return mouse.rightButton.isPressed;
                    case MouseButton.Middle: return mouse.middleButton.isPressed;
                    default: return false;
                }
            }
            else
            {
                var kb = Keyboard.current;
                if (kb == null) return false;
                try
                {
                    return kb[binding.key].isPressed;
                }
                catch
                {
                    return false;
                }
            }
#else
            return false;
#endif
        }

        public bool WasActionTriggered(GameAction action)
        {
            if (_isSimulationActive)
            {
                return _simTriggered.TryGetValue(action, out bool t) && t;
            }

#if ENABLE_INPUT_SYSTEM
            var binding = GetBinding(action);
            if (binding == null) return false;

            if (binding.type == InputBindingType.MouseButton)
            {
                var mouse = Mouse.current;
                if (mouse == null) return false;
                switch (binding.mouseButton)
                {
                    case MouseButton.Left: return mouse.leftButton.wasPressedThisFrame;
                    case MouseButton.Right: return mouse.rightButton.wasPressedThisFrame;
                    case MouseButton.Middle: return mouse.middleButton.wasPressedThisFrame;
                    default: return false;
                }
            }
            else
            {
                var kb = Keyboard.current;
                if (kb == null) return false;
                try
                {
                    return kb[binding.key].wasPressedThisFrame;
                }
                catch
                {
                    return false;
                }
            }
#else
            return false;
#endif
        }

        public bool WasActionReleased(GameAction action)
        {
            if (_isSimulationActive)
            {
                return _simReleased.TryGetValue(action, out bool r) && r;
            }

#if ENABLE_INPUT_SYSTEM
            var binding = GetBinding(action);
            if (binding == null) return false;

            if (binding.type == InputBindingType.MouseButton)
            {
                var mouse = Mouse.current;
                if (mouse == null) return false;
                switch (binding.mouseButton)
                {
                    case MouseButton.Left: return mouse.leftButton.wasReleasedThisFrame;
                    case MouseButton.Right: return mouse.rightButton.wasReleasedThisFrame;
                    case MouseButton.Middle: return mouse.middleButton.wasReleasedThisFrame;
                    default: return false;
                }
            }
            else
            {
                var kb = Keyboard.current;
                if (kb == null) return false;
                try
                {
                    return kb[binding.key].wasReleasedThisFrame;
                }
                catch
                {
                    return false;
                }
            }
#else
            return false;
#endif
        }

        // ==================== Simulation Hooks for Automated Tests ====================

        public void SetSimulatedAction(GameAction action, bool isPressed, bool triggered = false, bool released = false)
        {
            _isSimulationActive = true;
            _simPressed[action] = isPressed;
            _simTriggered[action] = triggered;
            _simReleased[action] = released;
        }

        public void ClearSimulatedActions()
        {
            _isSimulationActive = false;
            _simPressed.ClearSelf();
            _simTriggered.ClearSelf();
            _simReleased.ClearSelf();
        }
    }

    internal static class DictionaryExtensions
    {
        public static void ClearSelf<TKey, TValue>(this Dictionary<TKey, TValue> dict)
        {
            dict?.Clear();
        }
    }
}
