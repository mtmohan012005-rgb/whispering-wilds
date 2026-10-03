using System.Collections.Generic;
using WhisperingWilds.Data;

namespace WhisperingWilds.NPC
{
    /// <summary>
    /// The single authoritative source of character identity, schedule, art binding
    /// and relationship state for the five main characters, plus the autonomous
    /// resident roster.
    ///
    /// Design rules enforced here:
    ///  - No generated or primitive geometry. A character without authored art is
    ///    recorded as CharacterAssetBindingState.AssetBindingRequired and must not be
    ///    spawned with visuals.
    ///  - Built once, then read-only. No per-frame allocation or rebuild.
    /// </summary>
    public static class MainCharacterRegistry
    {
        public const string MeenakshiId = "meenakshi";
        public const string MuruganId = "murugan";
        public const string SelvamId = "selvam";
        public const string VeluId = "velu";
        public const string KannanId = "kannan";

        private const string NpcModelRoot = "Assets/_Project/Art/Models/Characters/NPCs/";

        private static List<MainCharacterData> mainCharacters;
        private static List<MainCharacterData> residents;

        /// <summary>The five main characters. Never null; built on first access.</summary>
        public static IReadOnlyList<MainCharacterData> All
        {
            get
            {
                EnsureBuilt();
                return mainCharacters;
            }
        }

        /// <summary>Autonomous residents in addition to the main cast.</summary>
        public static IReadOnlyList<MainCharacterData> Residents
        {
            get
            {
                EnsureBuilt();
                return residents;
            }
        }

        public static int MainCount
        {
            get
            {
                EnsureBuilt();
                return mainCharacters.Count;
            }
        }

        public static int ResidentCount
        {
            get
            {
                EnsureBuilt();
                return residents.Count;
            }
        }

        public static bool TryGet(string characterId, out MainCharacterData data)
        {
            EnsureBuilt();
            for (int i = 0; i < mainCharacters.Count; i++)
            {
                if (mainCharacters[i].characterId == characterId)
                {
                    data = mainCharacters[i];
                    return true;
                }
            }
            for (int i = 0; i < residents.Count; i++)
            {
                if (residents[i].characterId == characterId)
                {
                    data = residents[i];
                    return true;
                }
            }
            data = null;
            return false;
        }

        /// <summary>
        /// Characters that still need authored production art. These must be reported
        /// as MISSING_PRODUCTION_ASSET rather than substituted with primitives.
        /// </summary>
        public static void CollectMissingAssetBindings(List<MainCharacterData> results)
        {
            EnsureBuilt();
            for (int i = 0; i < mainCharacters.Count; i++)
            {
                if (!mainCharacters[i].CanSpawnVisually) results.Add(mainCharacters[i]);
            }
            for (int i = 0; i < residents.Count; i++)
            {
                if (!residents[i].CanSpawnVisually) results.Add(residents[i]);
            }
        }

        private static void EnsureBuilt()
        {
            if (mainCharacters != null) return;
            mainCharacters = BuildMainCharacters();
            residents = BuildResidents();
        }

        // ---------------------------------------------------------------------
        // Main cast
        // ---------------------------------------------------------------------

        private static List<MainCharacterData> BuildMainCharacters()
        {
            return new List<MainCharacterData>(5)
            {
                // Meenakshi — tea-kadai owner, George Town. Opens early, closes late.
                MakeMain(
                    MeenakshiId,
                    new CharacterIdentity("Meenakshi", "மீனாட்சி", "talk.meenakshi"),
                    NPCOccupation.Shopkeeper,
                    "chennai",
                    "chennai.home.meenakshi",
                    "chennai.shop.tea_kadai",
                    "chennai.social.temple",
                    NpcModelRoot + "meenakshi.glb",
                    new[]
                    {
                        new DailyScheduleBlock(5, 6, NPCScheduleActivity.Commuting, "chennai.shop.tea_kadai"),
                        new DailyScheduleBlock(6, 10, NPCScheduleActivity.ServingCustomers, "chennai.shop.tea_kadai"),
                        new DailyScheduleBlock(10, 12, NPCScheduleActivity.Resting, "chennai.social.temple"),
                        new DailyScheduleBlock(12, 14, NPCScheduleActivity.Resting, "chennai.shop.tea_kadai"),
                        new DailyScheduleBlock(14, 21, NPCScheduleActivity.ServingCustomers, "chennai.shop.tea_kadai"),
                        new DailyScheduleBlock(21, 23, NPCScheduleActivity.Socializing, "chennai.social.temple"),
                        new DailyScheduleBlock(23, 5, NPCScheduleActivity.Sleeping, "chennai.home.meenakshi"),
                    }),

                // Murugan — paddy farmer, Thanjavur delta. Field work dominates daylight.
                MakeMain(
                    MuruganId,
                    new CharacterIdentity("Murugan", "முருகன்", "talk.murugan"),
                    NPCOccupation.Farmer,
                    "thanjavur",
                    "delta.home.murugan",
                    "delta.field.murugan",
                    "delta.social.waterside",
                    NpcModelRoot + "murugan.glb",
                    new[]
                    {
                        new DailyScheduleBlock(5, 6, NPCScheduleActivity.Commuting, "delta.field.murugan"),
                        new DailyScheduleBlock(6, 11, NPCScheduleActivity.Working, "delta.field.murugan"),
                        new DailyScheduleBlock(11, 13, NPCScheduleActivity.Resting, "delta.field.shed"),
                        new DailyScheduleBlock(13, 17, NPCScheduleActivity.Working, "delta.field.murugan"),
                        new DailyScheduleBlock(17, 19, NPCScheduleActivity.Commuting, "delta.social.waterside"),
                        new DailyScheduleBlock(19, 22, NPCScheduleActivity.Socializing, "delta.home.murugan"),
                        new DailyScheduleBlock(22, 5, NPCScheduleActivity.Sleeping, "delta.home.murugan"),
                    }),

                // Selvam — Pichavaram fisherman. Starts before dawn, markets at first light.
                MakeMain(
                    SelvamId,
                    new CharacterIdentity("Selvam", "செல்வம்", "talk.selvam"),
                    NPCOccupation.Fisherman,
                    "pichavaram",
                    "pichavaram.home.selvam",
                    "pichavaram.waterfront.selvam",
                    "pichavaram.social.jetty",
                    NpcModelRoot + "selvam.glb",
                    new[]
                    {
                        new DailyScheduleBlock(4, 5, NPCScheduleActivity.Commuting, "pichavaram.waterfront.selvam"),
                        new DailyScheduleBlock(5, 9, NPCScheduleActivity.Working, "pichavaram.waterfront.selvam"),
                        new DailyScheduleBlock(9, 11, NPCScheduleActivity.Commuting, "pichavaram.social.jetty"),
                        new DailyScheduleBlock(11, 13, NPCScheduleActivity.Resting, "pichavaram.home.selvam"),
                        new DailyScheduleBlock(13, 18, NPCScheduleActivity.Working, "pichavaram.waterfront.selvam"),
                        new DailyScheduleBlock(18, 20, NPCScheduleActivity.Socializing, "pichavaram.social.jetty"),
                        new DailyScheduleBlock(20, 22, NPCScheduleActivity.Resting, "pichavaram.home.selvam"),
                        new DailyScheduleBlock(22, 4, NPCScheduleActivity.Sleeping, "pichavaram.home.selvam"),
                    }),

                // Velu — Chettinad craftsman. Workshop rhythm, long craft sessions.
                MakeMain(
                    VeluId,
                    new CharacterIdentity("Velu", "வேலு", "talk.velu"),
                    NPCOccupation.CraftWorker,
                    "chettinad",
                    "chettinad.home.velu",
                    "chettinad.workshop.velu",
                    "chettinad.social.courtyard",
                    NpcModelRoot + "velu.glb",
                    new[]
                    {
                        new DailyScheduleBlock(6, 8, NPCScheduleActivity.Commuting, "chettinad.workshop.velu"),
                        new DailyScheduleBlock(8, 12, NPCScheduleActivity.Working, "chettinad.workshop.velu"),
                        new DailyScheduleBlock(12, 14, NPCScheduleActivity.Resting, "chettinad.social.courtyard"),
                        new DailyScheduleBlock(14, 19, NPCScheduleActivity.Working, "chettinad.workshop.velu"),
                        new DailyScheduleBlock(19, 21, NPCScheduleActivity.Socializing, "chettinad.social.courtyard"),
                        new DailyScheduleBlock(21, 23, NPCScheduleActivity.Resting, "chettinad.home.velu"),
                        new DailyScheduleBlock(23, 6, NPCScheduleActivity.Sleeping, "chettinad.home.velu"),
                    }),

                // Kannan — Nilgiri tea worker. ASSET BINDING REQUIRED:
                // no authored model exists under Art/Models/Characters/NPCs.
                // Do not fabricate one. See MISSING_PRODUCTION_ASSET.
                MakeMain(
                    KannanId,
                    new CharacterIdentity("Kannan", "கண்ணன்", "talk.kannan"),
                    NPCOccupation.TeaWorker,
                    "nilgiris",
                    "nilgiris.home.kannan",
                    "nilgiris.estate.kannan",
                    "nilgiris.social.tea_stall",
                    null,
                    new[]
                    {
                        new DailyScheduleBlock(5, 6, NPCScheduleActivity.Commuting, "nilgiris.estate.kannan"),
                        new DailyScheduleBlock(6, 11, NPCScheduleActivity.Working, "nilgiris.estate.kannan"),
                        new DailyScheduleBlock(11, 13, NPCScheduleActivity.Resting, "nilgiris.social.tea_stall"),
                        new DailyScheduleBlock(13, 17, NPCScheduleActivity.Working, "nilgiris.estate.kannan"),
                        new DailyScheduleBlock(17, 20, NPCScheduleActivity.Socializing, "nilgiris.social.tea_stall"),
                        new DailyScheduleBlock(20, 22, NPCScheduleActivity.Resting, "nilgiris.home.kannan"),
                        new DailyScheduleBlock(22, 5, NPCScheduleActivity.Sleeping, "nilgiris.home.kannan"),
                    }),
            };
        }

        private static MainCharacterData MakeMain(
            string id,
            CharacterIdentity identity,
            NPCOccupation occupation,
            string regionId,
            string homeId,
            string workId,
            string socialId,
            string modelPathOrNull,
            DailyScheduleBlock[] schedule)
        {
            return new MainCharacterData
            {
                characterId = id,
                identity = identity,
                occupation = occupation,
                regionId = regionId,
                homeLocationId = homeId,
                workLocationId = workId,
                socialLocationId = socialId,
                dailySchedule = schedule,
                dialogueKeyPrefix = id,
                // No Animator controllers exist for NPCs yet, so the bound state
                // carries a model only. Animation falls back safely (see NPCAnimationDriver).
                appearance = string.IsNullOrEmpty(modelPathOrNull)
                    ? CharacterAppearanceProfile.Unbound("no authored model")
                    : CharacterAppearanceProfile.Bound(modelPathOrNull),
                voice = new CharacterVoiceProfile { pitchMin = 0.95f, pitchMax = 1.05f, voiceAssetPath = null },
                relationship = new CharacterRelationshipState(),
                memory = new CharacterMemoryState()
            };
        }

        // ---------------------------------------------------------------------
        // Autonomous residents
        // ---------------------------------------------------------------------

        private static List<MainCharacterData> BuildResidents()
        {
            // Roles follow the Step 10 roster. Only four authored occupational models
            // exist (farmer, fisher, artisan, forest-guide), so residents needing other
            // occupations are recorded as AssetBindingRequired rather than given a
            // mismatched or primitive body.
            return new List<MainCharacterData>(12)
            {
                MakeResident("resident_01", "Farmer", NPCOccupation.Farmer, "delta", "farmer.glb"),
                MakeResident("resident_02", "Shopkeeper", NPCOccupation.Shopkeeper, "chennai", null),
                MakeResident("resident_03", "Fisherman", NPCOccupation.Fisherman, "mamallapuram", "fisher.glb"),
                MakeResident("resident_04", "Artisan", NPCOccupation.CraftWorker, "chettinad", "artisan.glb"),
                MakeResident("resident_05", "TeaWorker", NPCOccupation.TeaWorker, "nilgiris", null),
                MakeResident("resident_06", "Resident", NPCOccupation.Resident, "chennai", null),
                MakeResident("resident_07", "Elder", NPCOccupation.Elder, "chennai", null),
                MakeResident("resident_08", "DeliveryWorker", NPCOccupation.Resident, "chennai", null),
                MakeResident("resident_09", "MarketWorker", NPCOccupation.Shopkeeper, "chennai", null),
                MakeResident("resident_10", "CraftWorker", NPCOccupation.CraftWorker, "chettinad", "artisan.glb"),
                MakeResident("resident_11", "Farmer", NPCOccupation.Farmer, "thanjavur", "farmer.glb"),
                MakeResident("resident_12", "Fisherman", NPCOccupation.Fisherman, "pichavaram", "fisher.glb"),
            };
        }

        /// <summary>
        /// Deterministic 0-3 stagger derived from the id. FNV-1a over the id characters
        /// so the same id always yields the same offset, in this and any later run.
        /// </summary>
        private static int StableHash4(string value)
        {
            unchecked
            {
                uint hash = 2166136261u;
                for (int i = 0; i < value.Length; i++)
                {
                    hash ^= value[i];
                    hash *= 16777619u;
                }
                return (int)(hash & 3u);
            }
        }

        /// <summary>
        /// Tamil name for a resident's occupation.
        ///
        /// Residents are identified by role rather than by invented personal names:
        /// the project has not authored resident cast names yet, and fabricating them
        /// would be the same class of problem as inventing model assets.
        /// </summary>
        private static string TamilRoleName(NPCOccupation occupation)
        {
            switch (occupation)
            {
                case NPCOccupation.Farmer: return "விவசாயி";
                case NPCOccupation.Fisherman: return "மீனவர்";
                case NPCOccupation.Shopkeeper: return "கடைக்காரர்";
                case NPCOccupation.TeaWorker: return "தேயிலைப் பணியாளர்";
                case NPCOccupation.CraftWorker: return "கைத்தொழிலாளர்";
                case NPCOccupation.Elder: return "முதிர்ந்தோர்";
                case NPCOccupation.Resident:
                default: return "குடிமகர்";
            }
        }

        private static MainCharacterData MakeResident(
            string id, string roleName, NPCOccupation occupation, string regionId, string modelFileOrNull)
        {
            // Stagger start times so residents are not all ticking in lockstep.
            // Stable FNV-1a, not string.GetHashCode(): the latter is randomized per
            // process, which made every resident's schedule differ between runs.
            int offset = StableHash4(id);

            return new MainCharacterData
            {
                characterId = id,
                identity = new CharacterIdentity(roleName, TamilRoleName(occupation), "talk." + id),
                occupation = occupation,
                regionId = regionId,
                homeLocationId = regionId + ".home." + id,
                workLocationId = regionId + ".work." + id,
                socialLocationId = regionId + ".social." + id,
                dialogueKeyPrefix = id,
                dailySchedule = new[]
                {
                    new DailyScheduleBlock(5 + offset, 7, NPCScheduleActivity.Commuting, regionId + ".work." + id),
                    new DailyScheduleBlock(7, 12, NPCScheduleActivity.Working, regionId + ".work." + id),
                    new DailyScheduleBlock(12, 14, NPCScheduleActivity.Resting, regionId + ".social." + id),
                    new DailyScheduleBlock(14, 18, NPCScheduleActivity.Working, regionId + ".work." + id),
                    new DailyScheduleBlock(18, 20, NPCScheduleActivity.Commuting, regionId + ".social." + id),
                    new DailyScheduleBlock(20, 22, NPCScheduleActivity.Resting, regionId + ".home." + id),
                    new DailyScheduleBlock(22, 5, NPCScheduleActivity.Sleeping, regionId + ".home." + id),
                },
                appearance = string.IsNullOrEmpty(modelFileOrNull)
                    ? CharacterAppearanceProfile.Unbound("no authored occupational model")
                    : CharacterAppearanceProfile.Bound(NpcModelRoot + modelFileOrNull),
                voice = new CharacterVoiceProfile { pitchMin = 0.9f, pitchMax = 1.1f, voiceAssetPath = null },
                relationship = new CharacterRelationshipState(),
                memory = new CharacterMemoryState()
            };
        }
    }
}