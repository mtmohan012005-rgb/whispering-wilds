using UnityEngine;

namespace WhisperingWilds.Atmosphere
{
    [DisallowMultipleComponent]
    public class PuddleDecalController : MonoBehaviour
    {
        [Header("Puddle Settings")]
        [Range(0f, 1f)] public float maxOpacity = 0.85f;
        public float accumulationSpeed = 0.5f;
        public float evaporationSpeed = 0.25f;

        [Header("Runtime State")]
        [Range(0f, 1f)] public float currentOpacity = 0.0f;

        private Renderer _renderer;
        private MaterialPropertyBlock _propBlock;
        private static readonly int BaseColorId = Shader.PropertyToID("_BaseColor");
        private static readonly int ColorId = Shader.PropertyToID("_Color");

        private void Awake()
        {
            _renderer = GetComponent<Renderer>();
            _propBlock = new MaterialPropertyBlock();
            ApplyOpacity(currentOpacity);
        }

        private void Update()
        {
            bool isRaining = false;
            if (TimeAndWeatherManager.Instance != null)
            {
                isRaining = TimeAndWeatherManager.Instance.currentWeather == WeatherState.MonsoonRain;
            }

            float targetOpacity = isRaining ? maxOpacity : 0.0f;
            float rate = isRaining ? accumulationSpeed : evaporationSpeed;

            currentOpacity = Mathf.MoveTowards(currentOpacity, targetOpacity, rate * Time.deltaTime);
            ApplyOpacity(currentOpacity);
        }

        public void ApplyOpacity(float opacity)
        {
            currentOpacity = Mathf.Clamp01(opacity);
            if (_renderer == null) _renderer = GetComponent<Renderer>();
            if (_renderer == null) return;

            if (_propBlock == null) _propBlock = new MaterialPropertyBlock();
            _renderer.GetPropertyBlock(_propBlock);

            Color c = Color.white;
            c.a = currentOpacity;
            _propBlock.SetColor(BaseColorId, c);
            _propBlock.SetColor(ColorId, c);
            _renderer.SetPropertyBlock(_propBlock);

            // Also toggle renderer enabled state if completely evaporated to save draw calls
            _renderer.enabled = currentOpacity > 0.01f;
        }
    }
}
