using UnityEngine;

namespace WhisperingWilds.Photography
{
    /// <summary>
    /// Marks a scene object as photographable and gives it a stable identifier.
    ///
    /// The identifier is what a PhotographTarget objective matches against, so it must equal the
    /// targetId declared in content. A collider is required for the photo camera's ray to find it.
    /// </summary>
    [DisallowMultipleComponent]
    [RequireComponent(typeof(Collider))]
    public class PhotoTarget : MonoBehaviour
    {
        [Tooltip("Stable photo target id. Must match the quest objective targetId.")]
        [SerializeField] private string targetId;

        [Tooltip("Optional display name shown in the photo journal.")]
        [SerializeField] private string displayNameEn;
        [SerializeField] private string displayNameTa;

        public string TargetId => targetId;
        public string DisplayNameEn => displayNameEn;
        public string DisplayNameTa => displayNameTa;
    }
}