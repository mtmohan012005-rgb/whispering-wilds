using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Player;
using WhisperingWilds.World;

namespace WhisperingWilds.NPC
{
    [Serializable]
    public class DialogueChoice
    {
        public string choiceTextEn;
        public string choiceTextTa;
        public int nextNodeIndex;
        public string requiredClueId;
        public string questTriggerId;
    }

    [Serializable]
    public class DialogueNode
    {
        public int nodeIndex;
        [TextArea(2, 4)] public string speakerTextEn;
        [TextArea(2, 4)] public string speakerTextTa;
        public List<DialogueChoice> choices = new List<DialogueChoice>();
    }

    [Serializable]
    public struct ScheduleWaypoint
    {
        public int hour24;
        public Vector3 position;
        public string activityDescription;
    }

    /// <summary>
    /// Regional NPC character handling living schedules, memory of player choices,
    /// and branching bilingual dialogue interactions.
    /// </summary>
    public class NPCCharacter : MonoBehaviour, IInteractable
    {
        [Header("Identity")]
        [SerializeField] private string npcId;
        [SerializeField] private string displayNameEn;
        [SerializeField] private string displayNameTa;
        [SerializeField] private string profession;

        [Header("Dialogue Content")]
        [SerializeField] private List<DialogueNode> dialogueNodes = new List<DialogueNode>();

        [Header("Daily Schedule")]
        [SerializeField] private List<ScheduleWaypoint> schedule = new List<ScheduleWaypoint>();

        // NPC Memory: Stores choices, favors, clues discussed
        private HashSet<string> memoryFlags = new HashSet<string>();

        // IInteractable implementation
        public string InteractionPrompt => $"Talk to {displayNameEn} ({displayNameTa})";
        public InteractionType Type => InteractionType.Talk;

        public event Action<NPCCharacter, DialogueNode> OnDialogueStarted;

        public void SetCharacterProfile(string nameEn, string nameTa, string prof, string initialDialogue)
        {
            displayNameEn = nameEn;
            displayNameTa = nameTa;
            profession = prof;
            npcId = nameEn.ToLowerInvariant().Replace(" ", "_");

            if (dialogueNodes == null) dialogueNodes = new List<DialogueNode>();
            if (dialogueNodes.Count == 0)
            {
                dialogueNodes.Add(new DialogueNode
                {
                    nodeIndex = 0,
                    speakerTextEn = $"Vanakkam! I am {nameEn}. Welcome to {profession}.",
                    speakerTextTa = $"வணக்கம்! நான் {nameTa}. {initialDialogue}",
                    choices = new List<DialogueChoice>()
                });
            }
        }

        private void Start()
        {
            if (TimeOfDayManager.Instance != null)
            {
                TimeOfDayManager.Instance.OnHourChanged += HandleHourChanged;
            }
        }

        private void OnDestroy()
        {
            if (TimeOfDayManager.Instance != null)
            {
                TimeOfDayManager.Instance.OnHourChanged -= HandleHourChanged;
            }
        }

        public bool CanInteract(PlayerInteractor interactor) => true;

        public void Interact(PlayerInteractor interactor)
        {
            if (dialogueNodes != null && dialogueNodes.Count > 0)
            {
                Debug.Log($"<color=#00D2FF><b>[Dialogue]</b></color> Engaged in conversation with {displayNameEn}");
                OnDialogueStarted?.Invoke(this, dialogueNodes[0]);
            }
        }

        public void OnFocusEnter()
        {
            // Optional: Subtle outline or look-at player
        }

        public void OnFocusExit()
        {
            // Reset focus
        }

        private void HandleHourChanged(int currentHour)
        {
            foreach (var waypoint in schedule)
            {
                if (waypoint.hour24 == currentHour)
                {
                    Debug.Log($"<color=#FFAA00><b>[Schedule]</b></color> {displayNameEn} is now: {waypoint.activityDescription}");
                    // Navigate to position if NavMeshAgent is present
                    var agent = GetComponent<UnityEngine.AI.NavMeshAgent>();
                    if (agent != null && agent.isOnNavMesh)
                    {
                        agent.SetDestination(waypoint.position);
                    }
                    else
                    {
                        transform.position = waypoint.position;
                    }
                    break;
                }
            }
        }

        public void RecordMemory(string key)
        {
            if (!memoryFlags.Contains(key))
            {
                memoryFlags.Add(key);
                Debug.Log($"<color=#00FF88><b>[NPC Memory]</b></color> {displayNameEn} remembers: {key}");
            }
        }

        public bool HasMemory(string key) => memoryFlags.Contains(key);
    }
}
