namespace WhisperingWilds.NPC
{
    public enum NPCState
    {
        Idle,
        GoToTarget,
        Working,
        Serving,
        Talking,
        Interacting,
        Eating,
        Socializing,
        Resting,
        Prayer,
        ReturningHome,
        Sleeping,
        Interrupted,
        RecoveringFromPathFailure
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
