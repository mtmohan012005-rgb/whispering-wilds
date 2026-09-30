using UnityEngine;

namespace WhisperingWilds.Wildlife
{
    public enum FoodSourceType
    {
        GrassGlade,
        ShrubFoliage,
        FallenFruitPatch,
        WetlandAquaticFlora,
        BambooShootThicket
    }

    /// <summary>
    /// Represents a natural foraging/grazing location for wildlife entities.
    /// Matched against species diet requirements.
    /// </summary>
    [DisallowMultipleComponent]
    public class WildlifeFoodSource : MonoBehaviour
    {
        [SerializeField] private FoodSourceType foodType = FoodSourceType.GrassGlade;
        [SerializeField] private float radius = 5.0f;
        [SerializeField] private int maxSimultaneousAnimals = 5;
        [SerializeField] private float foodAbundance = 1.0f; // 0.0 to 1.0

        public FoodSourceType FoodType => foodType;
        public float Radius => radius;
        public int Capacity => maxSimultaneousAnimals;
        public float Abundance => foodAbundance;

        public Vector3 GetFeedPosition()
        {
            Vector2 offset = Random.insideUnitCircle * (radius * 0.85f);
            return transform.position + new Vector3(offset.x, 0f, offset.y);
        }

        private void OnDrawGizmosSelected()
        {
            Gizmos.color = new Color(0.2f, 0.9f, 0.2f, 0.4f);
            Gizmos.DrawWireSphere(transform.position, radius);
        }
    }
}
