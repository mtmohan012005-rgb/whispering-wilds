using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.NPC;

namespace WhisperingWilds.Data
{
    /// <summary>
    /// Whether a character has real authored production art bound to it.
    /// AssetBindingRequired is a first-class state, not an error to be papered over
    /// with primitive stand-ins.
    /// </summary>
    public enum CharacterAssetBindingState
    {
        /// <summary>A real authored model/prefab asset path is assigned.</summary>
        Bound,

        /// <summary>No authored asset exists yet. Visual must not be faked.</summary>
        AssetBindingRequired,

        /// <summary>No authored art required (logical/logic-only character).</summary>
        NotRequired
    }

    /// <summary>One block of a daily routine. Hour range is [startHour, endHour).</summary>
    [Serializable]
    public struct DailyScheduleBlock
    {
        public int startHour;
        public int endHour;
        public NPCScheduleActivity activity;

        /// <summary>Anchor/location id for this block. Null means stay put.</summary>
        public string locationId;

        public DailyScheduleBlock(int startHour, int endHour, NPCScheduleActivity activity, string locationId)
        {
            this.startHour = startHour;
            this.endHour = endHour;
            this.activity = activity;
            this.locationId = locationId;
        }

        public bool Contains(float hour)
        {
            float h = hour;
            if (h < 0f) h += 24f;
            if (h >= 24f) h -= 24f;

            int start = Mathf.Clamp(startHour, 0, 24);
            int end = Mathf.Clamp(endHour, 0, 24);

            // Equal bounds are a full day (e.g. 0-24), which used to match nothing.
            if (start == end) return true;

            // Overnight block (23->5): wraps past midnight.
            if (start > end) return h >= start || h < end;

            return h >= start && h < end;
        }
    }

    /// <summary>Localized identity strings, resolved through LocalizationManager.</summary>
    [Serializable]
    public struct CharacterIdentity
    {
        public string nameEn;
        public string nameTa;

        /// <summary>Localization key for the "Talk to &lt;name&gt;" prompt.</summary>
        public string talkPromptKey;

        public CharacterIdentity(string nameEn, string nameTa, string talkPromptKey)
        {
            this.nameEn = nameEn;
            this.nameTa = nameTa;
            this.talkPromptKey = talkPromptKey;
        }
    }

    /// <summary>Art binding. Never populated with generated or primitive geometry.</summary>
    [Serializable]
    public struct CharacterAppearanceProfile
    {
        /// <summary>Project-relative path to an authored .glb. Empty when unbound.</summary>
        public string modelAssetPath;

        /// <summary>Authored Animator controller. Empty when unbound.</summary>
        public string animatorControllerAssetPath;

        public CharacterAssetBindingState bindingState;

        /// <summary>True only when real art is assigned. Callers must not fake the rest.</summary>
        public bool HasProductionArt => bindingState == CharacterAssetBindingState.Bound
                                       && !string.IsNullOrEmpty(modelAssetPath);

        public static CharacterAppearanceProfile Unbound(string note)
        {
            return new CharacterAppearanceProfile
            {
                modelAssetPath = string.Empty,
                animatorControllerAssetPath = string.Empty,
                bindingState = CharacterAssetBindingState.AssetBindingRequired
            };
        }

        public static CharacterAppearanceProfile Bound(string modelPath, string animatorPath = null)
        {
            return new CharacterAppearanceProfile
            {
                modelAssetPath = modelPath,
                animatorControllerAssetPath = animatorPath,
                bindingState = CharacterAssetBindingState.Bound
            };
        }
    }

    /// <summary>Placeholder voice descriptor. No audio asset is implied.</summary>
    [Serializable]
    public struct CharacterVoiceProfile
    {
        public float pitchMin;
        public float pitchMax;
        public string voiceAssetPath;

        public bool HasVoiceAsset => !string.IsNullOrEmpty(voiceAssetPath);
    }

    /// <summary>Persisted relationship progression.</summary>
    [Serializable]
    public struct CharacterRelationshipState
    {
        public int affinity;
        public int interactions;

        public bool met;
        public bool giftGiven;
    }

    /// <summary>Compact episodic memory flags. Free-form text is deliberately absent.</summary>
    [Serializable]
    public struct CharacterMemoryState
    {
        public int lastInteractionHour;
        public int lastInteractionDay;
        public bool knowsPlayerTradeRole;
        public bool heardMarketRumour;
        public bool witnessedCraftDelivery;
    }

    /// <summary>
    /// Authoritative record for one main character. Compact by design: fixed small
    /// arrays rather than nested object graphs so it stays cheap to hold 17 of these.
    /// </summary>
    [Serializable]
    public class MainCharacterData
    {
        public string characterId;
        public CharacterIdentity identity;
        public NPCOccupation occupation;
        public string regionId;

        public string homeLocationId;
        public string workLocationId;
        public string socialLocationId;

        public DailyScheduleBlock[] dailySchedule;

        /// <summary>Localization key prefix for this character's dialogue bank.</summary>
        public string dialogueKeyPrefix;

        public CharacterAppearanceProfile appearance;
        public CharacterVoiceProfile voice;
        public CharacterRelationshipState relationship;
        public CharacterMemoryState memory;

        /// <summary>True when the character may be spawned with visuals.</summary>
        public bool CanSpawnVisually => appearance.HasProductionArt;

        /// <summary>Schedule block active at the given in-game hour, or null.</summary>
        public DailyScheduleBlock? BlockAt(float hour)
        {
            if (dailySchedule == null) return null;
            for (int i = 0; i < dailySchedule.Length; i++)
            {
                if (dailySchedule[i].Contains(hour)) return dailySchedule[i];
            }
            return null;
        }

        /// <summary>Location id for the block at the given hour; null when idle in place.</summary>
        public string LocationIdAt(float hour)
        {
            var block = BlockAt(hour);
            return block.HasValue ? block.Value.locationId : null;
        }

        public NPCScheduleActivity ActivityAt(float hour)
        {
            var block = BlockAt(hour);
            return block.HasValue ? block.Value.activity : NPCScheduleActivity.Resting;
        }
    }
}