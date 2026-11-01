using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Core;
using WhisperingWilds.Campaign;
using WhisperingWilds.NPC;
using WhisperingWilds.Quests;
using WhisperingWilds.UI;

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

            // Accept this region's signature quest on arrival (older registrations were never
            // accepted, so the player could not progress a destination's story). Idempotent for
            // quests already active or completed from a previous visit.
            if (QuestManager.Instance != null)
            {
                QuestManager.Instance.AcceptRegionArrivalQuest(regionId);
            }

            ApplyRegionDialogue();
            EnsurePersistentManagers();
            EnsureRegionUI();
        }

        /// <summary>
        /// Ensures essential region UI systems (Pause Menu and Introduction Tutorial) are present.
        /// </summary>
        private void EnsureRegionUI()
        {
            if (FindAnyObjectByType<InGamePauseMenuUI>() == null)
            {
                var pauseObj = new GameObject("InGamePauseMenuUI", typeof(InGamePauseMenuUI));
            }

            if (regionId == ChennaiOpeningContent.RegionId && FindAnyObjectByType<IntroductionTutorialUI>() == null)
            {
                var tutObj = new GameObject("IntroductionTutorialUI", typeof(IntroductionTutorialUI));
            }

            if (FindAnyObjectByType<ObjectiveTrackerHUD>() == null)
            {
                var objHud = new GameObject("ObjectiveTrackerHUD", typeof(ObjectiveTrackerHUD));
            }
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
            if (regionId == PichavaramContent.RegionId)
            {
                var pichavaram = PichavaramContent.BuildDialogueFor(npcId);
                if (pichavaram.Count > 0) return pichavaram;
            }
            else if (regionId == ThanjavurDeltaContent.RegionId)
            {
                var thanjavur = ThanjavurDeltaContent.BuildDialogueFor(npcId);
                if (thanjavur.Count > 0) return thanjavur;
            }
            else if (regionId == ChettinadMansionContent.RegionId)
            {
                var chettinad = ChettinadMansionContent.BuildDialogueFor(npcId);
                if (chettinad.Count > 0) return chettinad;
            }
            else if (regionId == MamallapuramShoreContent.RegionId)
            {
                var shore = MamallapuramShoreContent.BuildDialogueFor(npcId);
                if (shore.Count > 0) return shore;
            }
            else if (regionId == NilgirisSanctuaryContent.RegionId)
            {
                var nilgiris = NilgirisSanctuaryContent.BuildDialogueFor(npcId);
                if (nilgiris.Count > 0) return nilgiris;
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
            EnsureManager<World.RegionalSceneManager>();
        }

        private static void EnsureManager<T>() where T : MonoBehaviour
        {
            if (FindAnyObjectByType<T>() != null) return;

            var go = new GameObject(typeof(T).Name);
            go.AddComponent<T>();
            // Each manager marks itself DontDestroyOnLoad in Awake.
        }
    }
}
