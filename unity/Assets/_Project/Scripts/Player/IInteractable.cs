namespace WhisperingWilds.Player
{
    public enum InteractionType
    {
        Talk,
        Inspect,
        Open,
        Pickup,
        Read,
        Collect,
        Photograph,
        Sit,
        Investigate
    }

    /// <summary>
    /// Core interaction contract implemented by NPCs, clues, doors, props, and codex entries.
    /// </summary>
    public interface IInteractable
    {
        string InteractionPrompt { get; }
        InteractionType Type { get; }
        bool CanInteract(PlayerInteractor interactor);
        void Interact(PlayerInteractor interactor);
        void OnFocusEnter();
        void OnFocusExit();
    }
}
