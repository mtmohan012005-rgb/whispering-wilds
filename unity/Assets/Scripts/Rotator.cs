using UnityEngine;

namespace MyProject
{
    /// <summary>
    /// Smoothly rotates the GameObject at a configurable speed.
    /// </summary>
    public class Rotator : MonoBehaviour
    {
        [Header("Rotation Settings")]
        [Tooltip("Degrees per second around each axis")]
        [SerializeField] private Vector3 rotationSpeed = new Vector3(0f, 45f, 0f);

        private void Update()
        {
            transform.Rotate(rotationSpeed * Time.deltaTime, Space.Self);
        }
    }
}
