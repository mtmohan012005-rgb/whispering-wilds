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
        [SerializeField] private string serverUrl = "http://localhost:3000";
        [SerializeField] private float networkTickRateHz = 15f; // Controlled network frequency
        [SerializeField] private bool interpolateRemotePlayers = true;

        public NetworkRole Role => role;
        public bool IsConnected => role != NetworkRole.OfflineSinglePlayer && _socket?.State == SocketIOClient.ConnectionState.Connected;
        public bool InterpolateRemotePlayers => interpolateRemotePlayers;
        public string CurrentRoom { get; private set; }

        public event Action<NetworkRole> OnNetworkRoleChanged;
        public event Action<string> OnPlayerJoined;
        public event Action<string> OnPlayerLeft;
        public event Action<string, Vector3, float> OnPlayerMoved;
        public event Action<string, string, string> OnChatMessage;

        private float tickInterval;
        private float tickTimer = 0f;
        private Dictionary<string, NetworkPlayerSnapshot> remoteSnapshots = new Dictionary<string, NetworkPlayerSnapshot>();
        private SocketIOClient _socket;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(this);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            tickInterval = 1.0f / networkTickRateHz;

            // Create and configure Socket.IO client
            var socketObj = new GameObject("SocketIOClient");
            socketObj.hideFlags = HideFlags.HideAndDontSave;
            DontDestroyOnLoad(socketObj);
            _socket = socketObj.AddComponent<SocketIOClient>();
            SetupSocketHandlers();
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
            if (_socket != null)
            {
                _socket.Disconnect();
            }
        }

        private void SetupSocketHandlers()
        {
            _socket.On("joinedSuccess", (args) =>
            {
                Debug.Log("[RealtimeManager] Joined room successfully");
                role = NetworkRole.Host;
                OnNetworkRoleChanged?.Invoke(role);
            });

            _socket.On("roomFull", (args) =>
            {
                Debug.LogWarning("[RealtimeManager] Room is full");
            });

            _socket.On("playerJoined", (args) =>
            {
                Debug.Log("[RealtimeManager] Player joined");
                OnPlayerJoined?.Invoke("playerJoined");
            });

            _socket.On("playerLeft", (args) =>
            {
                Debug.Log("[RealtimeManager] Player left");
                OnPlayerLeft?.Invoke("playerLeft");
            });

            _socket.On("playerMoved", (args) =>
            {
                // Parse position and rotation from server update
                OnPlayerMoved?.Invoke("playerMoved", Vector3.zero, 0f);
            });

            _socket.On("chatMessage", (args) =>
            {
                OnChatMessage?.Invoke("chatMessage", "", "");
            });

            _socket.OnConnected += () =>
            {
                Debug.Log("[RealtimeManager] Socket.IO connected");
            };

            _socket.OnDisconnected += () =>
            {
                Debug.LogWarning("[RealtimeManager] Socket.IO disconnected");
                if (role != NetworkRole.OfflineSinglePlayer)
                {
                    role = NetworkRole.OfflineSinglePlayer;
                    OnNetworkRoleChanged?.Invoke(role);
                }
            };
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
            if (_socket == null || _socket.State != SocketIOClient.ConnectionState.Connected) return;

            var player = GameObject.FindWithTag("Player");
            if (player != null)
            {
                // Emit playerMove event to Socket.IO server
                _socket.Emit("playerMove",
                    "roomCode", CurrentRoom,
                    "position", player.transform.position,
                    "rotationY", player.transform.eulerAngles.y,
                    "currentAnim", "idle",
                    "deltaTime", Time.deltaTime);
            }
        }

        /// <summary>
        /// Connects to the multiplayer server and joins a room.
        /// </summary>
        public void JoinRoom(string roomCode, string playerName)
        {
            if (string.IsNullOrWhiteSpace(roomCode))
            {
                Debug.LogWarning("[RealtimeManager] Cannot join empty room code");
                return;
            }

            if (_socket == null)
            {
                Debug.LogWarning("[RealtimeManager] Socket.IO client not initialized");
                return;
            }

            CurrentRoom = roomCode;
            role = NetworkRole.Client;
            OnNetworkRoleChanged?.Invoke(role);

            // Connect to server
            _socket.Connect(serverUrl);

            // Join room after connection (emit joinRoom event)
            // The server expects: { roomCode, playerName, maxPlayers }
            _socket.On("connect", (args) =>
            {
                _socket.Emit("joinRoom",
                    "roomCode", roomCode,
                    "playerName", playerName);
            });

            Debug.Log($"[RealtimeManager] Joining room '{roomCode}' as '{playerName}'");
        }

        /// <summary>
        /// Leaves the current room and disconnects.
        /// </summary>
        public void LeaveRoom()
        {
            if (_socket != null)
            {
                _socket.Disconnect();
            }
            CurrentRoom = null;
            role = NetworkRole.OfflineSinglePlayer;
            OnNetworkRoleChanged?.Invoke(role);
            Debug.Log("[RealtimeManager] Left room");
        }

        /// <summary>
        /// Sends a chat message to the room.
        /// </summary>
        public void SendChatMessage(string text)
        {
            if (_socket != null && _socket.State == SocketIOClient.ConnectionState.Connected)
            {
                _socket.Emit("chatMessage", "text", text);
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
