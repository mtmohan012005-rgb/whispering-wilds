using System.Collections.Generic;
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
            GameplayContentRegistry.EnsureRegionInitialized(regionId);

            if (GameManager.Instance != null)
            {
                GameManager.Instance.SetRegion(regionId);
            }

            // The region scene owns QuestManager, so the opening quests are seeded once it exists.
            CampaignFlow.ConsumeNewGameRequest();

            ApplyRegionDialogue();
            EnsurePersistentManagers();
        }

        /// <summary>
        /// Gives each resident in this region the opening conversation for its stable npc id.
        /// Residents with no authored graph keep whatever the scene serialized.
        ///
        /// The lookup is region-scoped: a destination's content owns its own dialogue, so an NPC
        /// reused across regions gets the conversation that belongs to where the player actually met
        /// them rather than whichever content module happened to be asked first.
        /// </summary>
        private void ApplyRegionDialogue()
        {
            var residents = FindObjectsByType<NPCCharacter>();
            for (int i = 0; i < residents.Length; i++)
            {
                var resident = residents[i];
                if (resident == null || string.IsNullOrEmpty(resident.NpcId)) continue;

                var nodes = BuildDialogueForRegion(resident.NpcId);
                if (nodes.Count == 0) continue;

                resident.SetDialogueNodes(nodes);
            }
        }

        /// <summary>
        /// Resolves the authored dialogue for a resident in this region, falling back to the Chennai
        /// opening content so a region that has not authored its own conversations yet still gives
        /// its residents the shared opening graph.
        /// </summary>
        private List<DialogueNode> BuildDialogueForRegion(string npcId)
        {
            if (regionId == ChettinadMansionContent.RegionId)
            {
                var chettinad = ChettinadMansionContent.BuildDialogueFor(npcId);
                if (chettinad.Count > 0) return chettinad;
            }
            else if (regionId == MamallapuramShoreContent.RegionId)
            {
                var shore = MamallapuramShoreContent.BuildDialogueFor(npcId);
                if (shore.Count > 0) return shore;
            }

            return ChennaiOpeningContent.BuildDialogueFor(npcId);
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