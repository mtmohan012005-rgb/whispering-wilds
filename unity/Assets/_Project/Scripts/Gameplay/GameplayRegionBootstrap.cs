using UnityEngine;
using WhisperingWilds.Core;
using WhisperingWilds.Campaign;
using WhisperingWilds.NPC;

namespace WhisperingWilds.Gameplay
{
    /// <summary>
    /// Region-scoped hand-off between the campaign shell (menu, save governor, game state) and the
    /// scene-bound gameplay managers (quests, investigation, inventory, crafting).
    ///
    /// It also pushes catalogue-authored dialogue onto the residents of this region. Dialogue lives
    /// in code next to the clues and quests it references, so a choice cannot reveal a clue id the
    /// quest objectives do not use.
    /// </summary>
    [DisallowMultipleComponent]
    public class GameplayRegionBootstrap : MonoBehaviour
    {
        [Header("Region")]
        [SerializeField] private string regionId = ChennaiOpeningContent.RegionId;

        public string RegionId => regionId;

        private void Start()
        {
            ChennaiOpeningContent.EnsureInitialized();

            if (GameManager.Instance != null)
            {
                GameManager.Instance.SetRegion(regionId);
            }

            // The Chennai scene owns QuestManager, so the opening quests are seeded once it exists.
            CampaignFlow.ConsumeNewGameRequest();

            ApplyOpeningDialogue();
            EnsurePersistentManagers();
        }

        /// <summary>
        /// Gives each resident in this region the opening conversation for its stable npc id.
        /// Residents with no authored graph keep whatever the scene serialized.
        /// </summary>
        private void ApplyOpeningDialogue()
        {
            var residents = FindObjectsByType<NPCCharacter>();
            for (int i = 0; i < residents.Length; i++)
            {
                var resident = residents[i];
                if (resident == null || string.IsNullOrEmpty(resident.NpcId)) continue;

                var nodes = ChennaiOpeningContent.BuildDialogueFor(resident.NpcId);
                if (nodes.Count == 0) continue;

                resident.SetDialogueNodes(nodes);
            }
        }

        /// <summary>
        /// Creates the DontDestroyOnLoad managers if they are not present in this scene. The boot
        /// scene normally owns them; this keeps a direct Chennai scene load playable.
        /// </summary>
        private static void EnsurePersistentManagers()
        {
            EnsureManager<SaveManager>();
            EnsureManager<GameManager>();
            EnsureManager<CampaignFlow>();
        }

        private static void EnsureManager<T>() where T : MonoBehaviour
        {
            if (FindObjectOfType<T>(true) != null) return;

            var go = new GameObject(typeof(T).Name);
            go.AddComponent<T>();
            // Each manager marks itself DontDestroyOnLoad in Awake.
        }
    }
}