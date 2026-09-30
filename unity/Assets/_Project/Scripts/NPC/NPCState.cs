namespace WhisperingWilds.NPC
{
    public enum NPCState
    {
        Idle,
        GoToTarget,
        Working,
        Interacting,
        Talking,
        Resting,
        Eating,
        Socializing,
        ReturningHome,
        Sleeping,
        Interrupted
    }

    public enum NPCOccupation
    {
        Farmer,
        Fisherman,
        TeaWorker,
        Shopkeeper,
        Elder,
        CraftWorker,
        Resident
    }
}
