using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Quality;

namespace WhisperingWilds.Wildlife
{
    /// <summary>
    /// Regional wildlife population manager balancing animal density with active QualityPreset.
    /// Spawns habitat-appropriate species (e.g., Tahr in Nilgiris, Egrets in Delta, Stray Dogs in Chennai).
    /// </summary>
    [DisallowMultipleComponent]
    public class WildlifeManager : MonoBehaviour
    {
        public static WildlifeManager Instance { get; private set; }

        [Header("Regional Settings")]
        [SerializeField] private string currentBiome = "Chennai";
        public string CurrentBiome => currentBiome;
        [SerializeField] private List<WildlifeEntity> activeEntities = new List<WildlifeEntity>();

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            RefreshActiveEntities();
        }

        public void RefreshActiveEntities()
        {
            activeEntities.Clear();
            activeEntities.AddRange(Object.FindObjectsByType<WildlifeEntity>());
        }

        public void ApplyDensityFactor(float factor)
        {
            // Disable or enable entities to match performance budget
            int targetCount = Mathf.RoundToInt(activeEntities.Count * factor);
            for (int i = 0; i < activeEntities.Count; i++)
            {
                if (activeEntities[i] != null)
                {
                    activeEntities[i].gameObject.SetActive(i < targetCount);
                }
            }
        }
    }
}
