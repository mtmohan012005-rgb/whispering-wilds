using UnityEngine;

namespace WhisperingWilds.Wildlife
{
    public enum WaterSourceType
    {
        RiverBank,
        ForestStream,
        WetlandChannel,
        Pond,
        WaterfallBasin
    }

    /// <summary>
    /// Represents a localized natural drinking zone for wildlife entities.
    /// Animals sample drink positions along the perimeter or center.
    /// </summary>
    [DisallowMultipleComponent]
    public class WildlifeWaterSource : MonoBehaviour
    {
        [SerializeField] private WaterSourceType waterType = WaterSourceType.ForestStream;
        [SerializeField] private float radius = 4.0f;
        [SerializeField] private int maxSimultaneousAnimals = 4;
        [SerializeField] private bool activeInDrySeason = true;

        public WaterSourceType WaterType => waterType;
        public float Radius => radius;
        public int Capacity => maxSimultaneousAnimals;
        public bool IsAvailable => activeInDrySeason || (World.WorldTimeSystem.Instance == null || World.WorldTimeSystem.Instance.CurrentSeason != World.TamilNaduSeason.Summer);

        public Vector3 GetDrinkPosition()
        {
            Vector2 offset = Random.insideUnitCircle * (radius * 0.8f);
            return transform.position + new Vector3(offset.x, 0f, offset.y);
        }

        private void OnDrawGizmosSelected()
        {
            Gizmos.color = new Color(0f, 0.7f, 1f, 0.4f);
            Gizmos.DrawWireSphere(transform.position, radius);
        }
    }
}
