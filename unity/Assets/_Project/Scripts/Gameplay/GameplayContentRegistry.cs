namespace WhisperingWilds.Gameplay
{
    /// <summary>
    /// Single entry point that guarantees every code-defined gameplay content registry has run.
    ///
    /// Content lives in static registries keyed by stable ids, and any of them can be asked for
    /// before the region scene that normally seeds them has started: an interactable reports an
    /// event, the journal builds its rows, a save is restored. Rather than have each of those
    /// callers remember which registries exist, they all call this.
    ///
    /// The individual registries stay idempotent, so calling this repeatedly costs one boolean
    /// check each and can never double-register.
    /// </summary>
    public static class GameplayContentRegistry
    {
        /// <summary>
        /// Registers all gameplay content. Safe from Awake, Start, tests, and editor tooling.
        /// </summary>
        public static void EnsureAllInitialized()
        {
            ChennaiOpeningContent.EnsureInitialized();
            ChettinadMansionContent.EnsureInitialized();
            MamallapuramShoreContent.EnsureInitialized();
            PichavaramContent.EnsureInitialized();
        }

        /// <summary>
        /// Registers the opening content plus the content of one region. Used by the region
        /// bootstrap so a region scene does not have to know which registries belong to which
        /// destination.
        /// </summary>
        public static void EnsureRegionInitialized(string regionId)
        {
            ChennaiOpeningContent.EnsureInitialized();

            if (regionId == ChettinadMansionContent.RegionId)
            {
                ChettinadMansionContent.EnsureInitialized();
            }
            else if (regionId == MamallapuramShoreContent.RegionId)
            {
                MamallapuramShoreContent.EnsureInitialized();
            }
            else if (regionId == PichavaramContent.RegionId)
            {
                PichavaramContent.EnsureInitialized();
            }
        }

        /// <summary>
        /// The signature quest of a destination region, or the opening quest for Chennai itself.
        /// null for regions that have not authored a signature quest yet (Thanjavur, Nilgiris).
        /// </summary>
        public static string GetRegionQuestId(string regionId)
        {
            if (regionId == ChettinadMansionContent.RegionId) return ChettinadMansionContent.QuestTheHouseThatRemembers;
            if (regionId == MamallapuramShoreContent.RegionId) return MamallapuramShoreContent.QuestEchoesAlongTheShore;
            if (regionId == PichavaramContent.RegionId) return PichavaramContent.QuestTheNightCurrent;
            if (regionId == ChennaiOpeningContent.RegionId) return ChennaiOpeningContent.QuestFirstDayInGeorgeTown;
            return null;
        }
    }
}
