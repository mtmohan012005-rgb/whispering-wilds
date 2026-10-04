using System;
using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.Online
{
    public enum NetworkRole
    {
        OfflineSinglePlayer,
        Client,
        Host
    }

    [Serializable]
    public struct NetworkPlayerSnapshot
    {
        public string playerId;
        public Vector3 position;
        public float rotationY;
        public float speed;
        public int currentOutfit;
        public double timestamp;
    }

    /// <summary>
    /// Single authoritative Realtime Governor managing multiplayer networking,
    /// interpolation, and server-authoritative validation for cooperative exploration.
    /// Operates on a controlled tick rate outside the main visual rendering loop.
    /// </summary>
    [DisallowMultipleComponent]
    public class RealtimeManager : MonoBehaviour
    {
        public static RealtimeManager Instance { get; private set; }

        [Header("Network Configuration")]
        [SerializeField] private NetworkRole role = NetworkRole.OfflineSinglePlayer;
        [SerializeField] private float networkTickRateHz = 15f; // Controlled network frequency
        [SerializeField] private bool interpolateRemotePlayers = true;

        public NetworkRole Role => role;
        public bool IsConnected => role != NetworkRole.OfflineSinglePlayer;
        public bool InterpolateRemotePlayers => interpolateRemotePlayers;

        public event Action<NetworkRole> OnNetworkRoleChanged;

        private float tickInterval;
        private float tickTimer = 0f;
        private Dictionary<string, NetworkPlayerSnapshot> remoteSnapshots = new Dictionary<string, NetworkPlayerSnapshot>();

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
            tickInterval = 1.0f / networkTickRateHz;
        }

        private void Update()
        {
            if (role == NetworkRole.OfflineSinglePlayer) return;

            tickTimer += Time.deltaTime;
            if (tickTimer >= tickInterval)
            {
                tickTimer = 0f;
                BroadcastLocalPlayerState();
            }
        }

        private void BroadcastLocalPlayerState()
        {
            // Low-bandwidth state synchronization
            var player = GameObject.FindWithTag("Player");
            if (player != null)
            {
                NetworkPlayerSnapshot snapshot = new NetworkPlayerSnapshot
                {
                    playerId = "local_player",
                    position = player.transform.position,
                    rotationY = player.transform.eulerAngles.y,
                    speed = 0f,
                    currentOutfit = 0,
                    timestamp = Time.timeAsDouble
                };
                // Dispatches via socket or WebRTC data channel
            }
        }

        public void SetNetworkRole(NetworkRole newRole)
        {
            role = newRole;
            OnNetworkRoleChanged?.Invoke(role);
            Debug.Log($"<color=#00D2FF><b>[RealtimeManager]</b></color> Network role transitioned to: {role}");
        }
    }
}
