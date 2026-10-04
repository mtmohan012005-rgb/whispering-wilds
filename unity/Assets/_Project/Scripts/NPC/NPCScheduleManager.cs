using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.World;

namespace WhisperingWilds.NPC
{
    public enum NPCScheduleActivity
    {
        Sleeping,
        Commuting,
        Working,
        ServingCustomers,
        Resting,
        Prayer,
        Socializing
    }

    /// <summary>
    /// Community schedule coordinator managing NPC registrations and daily routine broadcasts.
    /// Responds continuously to the authoritative WorldTimeSystem calendar.
    /// </summary>
    [DisallowMultipleComponent]
    public class NPCScheduleManager : MonoBehaviour
    {
        public static NPCScheduleManager Instance { get; private set; }

        [SerializeField] private List<NPCCharacter> registeredNPCs = new List<NPCCharacter>();

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                // Destroy only the duplicate component. Destroy(gameObject) here would take
                // every sibling manager on the shared '--- MANAGERS ---' object with it.
                Destroy(this);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            if (WorldTimeSystem.Instance != null)
            {
                WorldTimeSystem.Instance.OnHourChanged += BroadcastHourToNPCs;
            }
        }

        private void OnDestroy()
        {
            if (WorldTimeSystem.Instance != null)
            {
                WorldTimeSystem.Instance.OnHourChanged -= BroadcastHourToNPCs;
            }
        }

        public void RegisterNPC(NPCCharacter npc)
        {
            if (npc != null && !registeredNPCs.Contains(npc))
            {
                registeredNPCs.Add(npc);
            }
        }

        public void UnregisterNPC(NPCCharacter npc)
        {
            if (npc != null)
            {
                registeredNPCs.Remove(npc);
            }
        }

        public void ForceEvaluateAllSchedules()
        {
            int hour = WorldTimeSystem.Instance != null ? WorldTimeSystem.Instance.WholeHour : 9;
            BroadcastHourToNPCs(hour);
        }

        private void BroadcastHourToNPCs(int hour)
        {
            for (int i = registeredNPCs.Count - 1; i >= 0; i--)
            {
                var npc = registeredNPCs[i];
                if (npc != null)
                {
                    npc.HandleHourChanged(hour);
                }
                else
                {
                    registeredNPCs.RemoveAt(i);
                }
            }
        }
    }
}
