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

    [Serializable]
    public struct ScheduleSlot
    {
        public float startHour; // 0.0 - 24.0
        public float endHour;
        public NPCScheduleActivity activity;
        public string locationName;
        public Vector3 worldPosition;
        public string animationTrigger;
    }

    /// <summary>
    /// Profession-based daily schedule system simulating realistic Tamil Nadu community routines.
    /// Responds continuously to the 24-hour TimeOfDayManager cycle.
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
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        public void RegisterNPC(NPCCharacter npc)
        {
            if (!registeredNPCs.Contains(npc))
            {
                registeredNPCs.Add(npc);
            }
        }

        public void UnregisterNPC(NPCCharacter npc)
        {
            registeredNPCs.Remove(npc);
        }

        public static NPCScheduleActivity GetMuruganActivity(float currentHour)
        {
            if (currentHour >= 5.0f && currentHour < 6.0f) return NPCScheduleActivity.Commuting;
            if (currentHour >= 6.0f && currentHour < 12.5f) return NPCScheduleActivity.ServingCustomers;
            if (currentHour >= 12.5f && currentHour < 15.5f) return NPCScheduleActivity.Resting;
            if (currentHour >= 15.5f && currentHour < 21.5f) return NPCScheduleActivity.ServingCustomers;
            if (currentHour >= 21.5f && currentHour < 22.5f) return NPCScheduleActivity.Working; // Cleaning
            return NPCScheduleActivity.Sleeping;
        }

        public static NPCScheduleActivity GetVeluActivity(float currentHour)
        {
            if (currentHour >= 6.0f && currentHour < 11.5f) return NPCScheduleActivity.Working;
            if (currentHour >= 11.5f && currentHour < 14.0f) return NPCScheduleActivity.Resting;
            if (currentHour >= 14.0f && currentHour < 20.5f) return NPCScheduleActivity.Working;
            if (currentHour >= 20.5f && currentHour < 22.0f) return NPCScheduleActivity.Socializing;
            return NPCScheduleActivity.Sleeping;
        }

        public static NPCScheduleActivity GetFarmerActivity(float currentHour)
        {
            if (currentHour >= 5.0f && currentHour < 11.5f) return NPCScheduleActivity.Working;
            if (currentHour >= 11.5f && currentHour < 14.5f) return NPCScheduleActivity.Resting;
            if (currentHour >= 14.5f && currentHour < 18.5f) return NPCScheduleActivity.Working;
            if (currentHour >= 18.5f && currentHour < 20.0f) return NPCScheduleActivity.Prayer;
            return NPCScheduleActivity.Sleeping;
        }
    }
}
