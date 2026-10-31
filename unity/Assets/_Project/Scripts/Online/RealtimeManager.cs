using System;
using System.Collections;
using System.Collections.Generic;
using System.Text.RegularExpressions;
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
    /// interpolation, and server-authoritative validation for cooperative
    /// exploration. Offline solo play never connects to the backend.
    /// </summary>
    [DisallowMultipleComponent]
    public class RealtimeManager : MonoBehaviour
    {
        private static readonly Regex RoomCodePattern =
            new Regex("^[A-HJ-NP-Z2-9]{6}$", RegexOptions.Compiled);

        public static RealtimeManager Instance { get; private set; }

        [Header("Network Configuration")]
        [SerializeField] private NetworkRole role = NetworkRole.OfflineSinglePlayer;
        [SerializeField] private string serverUrl = "http://localhost:3000";
        [SerializeField] private float networkTickRateHz = 15f;
        [SerializeField] private bool interpolateRemotePlayers = true;

        [Header("Remote Players")]
        [Tooltip("Optional. Falls back to Resources/RemoteExplorerAvatar.")]
        [SerializeField] private GameObject remotePlayerPrefab;
        [SerializeField] private float remoteInterpolationSharpness = 12f;

        public NetworkRole Role => role;
        public bool IsConnected => role != NetworkRole.OfflineSinglePlayer &&
                                   _socket != null &&
                                   _socket.State == SocketIOClient.ConnectionState.Connected;
        public bool InterpolateRemotePlayers => interpolateRemotePlayers;
        public bool IsHost { get; private set; }
        public string CurrentRoom { get; private set; }
        public string LocalPlayerId { get; private set; }
        public string LocalPlayerName { get; private set; }
        public int MaxPlayers { get; private set; } = 5;
        public int PlayerCount => remoteSnapshots.Count + (string.IsNullOrEmpty(LocalPlayerId) ? 0 : 1);
        public string LastError { get; private set; }

        public event Action<NetworkRole> OnNetworkRoleChanged;
        public event Action<string, bool> OnRoomJoined;
        public event Action<string> OnJoinFailed;
        public event Action<string> OnRoomCreated;
        public event Action OnLeftRoom;
        public event Action OnRosterChanged;
        public event Action<string> OnPlayerJoined;
        public event Action<string> OnPlayerLeft;
        public event Action<string, Vector3, float> OnPlayerMoved;
        public event Action<string, string, string> OnChatMessage;
        public event Action<string, Dictionary<string, object>> OnMechanismUpdated;

        private float tickInterval;
        private float tickTimer;
        private Dictionary<string, RemoteAvatar> remoteSnapshots = new Dictionary<string, RemoteAvatar>();
        private Dictionary<string, string> remoteNames = new Dictionary<string, string>();
        private SocketIOClient _socket;
        private PendingRoomAction pendingAction = PendingRoomAction.None;
        private string pendingRoomCode;
        private string pendingPlayerName;
        private int pendingMaxPlayers = 5;
        private bool pendingSent;
        private Transform localPlayerTransform;
        private Vector3 lastBroadcastPosition;
        private bool hasBroadcastPosition;

        private enum PendingRoomAction
        {
            None,
            Create,
            Join
        }

        private sealed class RemoteAvatar
        {
            public GameObject Root;
            public Animator Animator;
            public Vector3 TargetPosition;
            public float TargetRotationY;
            public string TargetAnim = "idle";
            public bool HasSpeedParameter;
            public bool HasMovingParameter;
        }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(this);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
            tickInterval = 1.0f / Mathf.Max(1f, networkTickRateHz);

            var socketObj = new GameObject("SocketIOClient");
            socketObj.hideFlags = HideFlags.HideAndDontSave;
            DontDestroyOnLoad(socketObj);
            _socket = socketObj.AddComponent<SocketIOClient>();
            SetupSocketHandlers();
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
            ClearRemotePlayers();
            if (_socket != null) _socket.Disconnect();
        }

        private void SetupSocketHandlers()
        {
            _socket.OnConnected += HandleConnected;
            _socket.OnDisconnected += HandleDisconnected;
            _socket.OnError += HandleSocketError;

            _socket.On("joinedSuccess", args =>
            {
                var payload = FirstObject(args);
                CurrentRoom = MiniJson.GetString(payload, "roomCode", pendingRoomCode);
                LocalPlayerId = MiniJson.GetString(payload, "playerId", LocalPlayerId);
                LocalPlayerName = MiniJson.GetString(payload, "playerName", pendingPlayerName);
                IsHost = MiniJson.GetBool(payload, "isHost", false);
                MaxPlayers = Mathf.Clamp((int)MiniJson.GetNumber(payload, "maxPlayers", 5), 2, 5);
                LastError = null;
                SetRole(IsHost ? NetworkRole.Host : NetworkRole.Client);

                ClearRemotePlayers();
                var players = GetObjectField(payload, "currentPlayers");
                if (players != null)
                {
                    foreach (var pair in players) SpawnOrUpdateRemote(pair.Key, MiniJson.AsObject(pair.Value));
                }

                pendingAction = PendingRoomAction.None;
                pendingSent = false;
                Debug.Log($"[RealtimeManager] Joined room {CurrentRoom} as {(IsHost ? "host" : "explorer")}");
                OnRosterChanged?.Invoke();
                OnRoomJoined?.Invoke(CurrentRoom, IsHost);
            });

            _socket.On("roomCreated", args =>
            {
                var payload = FirstObject(args);
                string code = MiniJson.GetString(payload, "roomCode", CurrentRoom);
                if (!string.IsNullOrEmpty(code)) CurrentRoom = code;
                OnRoomCreated?.Invoke(code);
            });

            _socket.On("roomRoster", args =>
            {
                var payload = FirstObject(args);
                string hostId = MiniJson.GetString(payload, "hostId");
                IsHost = !string.IsNullOrEmpty(hostId) && hostId == LocalPlayerId;
                SetRole(IsHost ? NetworkRole.Host : NetworkRole.Client);

                var players = GetObjectField(payload, "players");
                if (players == null) return;

                var seen = new HashSet<string>();
                foreach (var pair in players)
                {
                    if (pair.Key == LocalPlayerId) continue;
                    seen.Add(pair.Key);
                    SpawnOrUpdateRemote(pair.Key, MiniJson.AsObject(pair.Value));
                }

                var stale = new List<string>();
                foreach (var id in remoteSnapshots.Keys)
                {
                    if (!seen.Contains(id)) stale.Add(id);
                }
                foreach (string id in stale) RemoveRemote(id);
                OnRosterChanged?.Invoke();
            });

            _socket.On("playerJoined", args =>
            {
                var payload = FirstObject(args);
                if (payload == null) return;
                string id = MiniJson.GetString(payload, "id");
                if (string.IsNullOrEmpty(id) || id == LocalPlayerId) return;
                SpawnOrUpdateRemote(id, payload);
                OnRosterChanged?.Invoke();
                OnPlayerJoined?.Invoke(id);
            });

            _socket.On("playerLeft", args =>
            {
                var payload = FirstObject(args);
                string id = MiniJson.GetString(payload, "id");
                if (string.IsNullOrEmpty(id)) return;
                RemoveRemote(id);
                OnRosterChanged?.Invoke();
                OnPlayerLeft?.Invoke(id);
            });

            _socket.On("playerMoved", args =>
            {
                var payload = FirstObject(args);
                if (payload == null) return;
                string id = MiniJson.GetString(payload, "id");
                if (string.IsNullOrEmpty(id)) return;

                Vector3 position = ReadPosition(payload);
                float rotationY = (float)MiniJson.GetNumber(payload, "rotationY", 0);
                string anim = MiniJson.GetString(payload, "currentAnim", "idle");

                if (remoteSnapshots.TryGetValue(id, out RemoteAvatar avatar))
                {
                    avatar.TargetPosition = position;
                    avatar.TargetRotationY = rotationY;
                    avatar.TargetAnim = anim;
                    if (!interpolateRemotePlayers && avatar.Root != null)
                    {
                        avatar.Root.transform.position = position;
                        avatar.Root.transform.rotation = Quaternion.Euler(0f, rotationY, 0f);
                    }
                }
                OnPlayerMoved?.Invoke(id, position, rotationY);
            });

            _socket.On("chatMessage", args =>
            {
                var payload = FirstObject(args);
                if (payload == null) return;
                string senderId = MiniJson.GetString(payload, "senderId", string.Empty);
                string senderName = MiniJson.GetString(payload, "senderName", "Explorer");
                string text = MiniJson.GetString(payload, "text", string.Empty);
                if (text.Length > 0) OnChatMessage?.Invoke(senderId, senderName, text);
            });

            _socket.On("newHostAssigned", args =>
            {
                var payload = FirstObject(args);
                string hostId = MiniJson.GetString(payload, "hostId");
                if (string.IsNullOrEmpty(hostId)) return;
                IsHost = hostId == LocalPlayerId;
                SetRole(IsHost ? NetworkRole.Host : NetworkRole.Client);
                OnRosterChanged?.Invoke();
                Debug.Log($"[RealtimeManager] New host: {MiniJson.GetString(payload, "hostName", hostId)}");
            });

            _socket.On("joinRejected", args => FailJoin(FirstObject(args), "Unable to join expedition."));
            _socket.On("roomNotFound", args => FailJoin(FirstObject(args), "No expedition found with that code."));
            _socket.On("roomFull", args => FailJoin(FirstObject(args), "That expedition lobby is full."));
            _socket.On("roomCreationFailed", args =>
            {
                var payload = FirstObject(args);
                FailJoin(payload, MiniJson.GetString(payload, "reason", "Unable to create expedition."));
            });

            _socket.On("mechanismUpdated", args =>
            {
                var payload = FirstObject(args);
                if (payload == null) return;
                string mechanismId = MiniJson.GetString(payload, "mechanismId");
                var state = GetObjectField(payload, "state");
                OnMechanismUpdated?.Invoke(mechanismId, state);
            });

            _socket.On("leftRoom", args =>
            {
                ResetRoomState();
                OnLeftRoom?.Invoke();
            });
        }

        private void Update()
        {
            if (role == NetworkRole.OfflineSinglePlayer) return;

            InterpolateRemotes();

            tickTimer += Time.deltaTime;
            if (tickTimer < tickInterval) return;

            tickTimer = 0f;
            BroadcastLocalPlayerState();
        }

        private void InterpolateRemotes()
        {
            if (!interpolateRemotePlayers) return;

            float t = 1f - Mathf.Exp(-remoteInterpolationSharpness * Time.deltaTime);
            foreach (RemoteAvatar avatar in remoteSnapshots.Values)
            {
                if (avatar.Root == null) continue;
                avatar.Root.transform.position = Vector3.Lerp(avatar.Root.transform.position, avatar.TargetPosition, t);
                Quaternion target = Quaternion.Euler(0f, avatar.TargetRotationY, 0f);
                avatar.Root.transform.rotation = Quaternion.Slerp(avatar.Root.transform.rotation, target, t);

                if (avatar.Animator != null)
                {
                    bool moving = avatar.TargetAnim != "idle";
                    if (avatar.HasSpeedParameter) avatar.Animator.SetFloat("Speed", moving ? 1f : 0f);
                    if (avatar.HasMovingParameter) avatar.Animator.SetBool("IsMoving", moving);
                }
            }
        }

        private void BroadcastLocalPlayerState()
        {
            if (!IsConnected || string.IsNullOrEmpty(CurrentRoom)) return;

            if (localPlayerTransform == null)
            {
                GameObject local = GameObject.FindWithTag("Player");
                if (local == null) return;
                localPlayerTransform = local.transform;
            }

            Vector3 position = localPlayerTransform.position;
            float rotationY = localPlayerTransform.eulerAngles.y;

            string anim = "idle";
            if (hasBroadcastPosition)
            {
                float horizontal = Vector3.Distance(
                    new Vector3(position.x, 0f, position.z),
                    new Vector3(lastBroadcastPosition.x, 0f, lastBroadcastPosition.z));
                anim = horizontal > 0.02f ? "walk" : "idle";
            }

            lastBroadcastPosition = position;
            hasBroadcastPosition = true;

            _socket.Emit("playerMove", new Dictionary<string, object>
            {
                { "position", new Dictionary<string, object>
                    {
                        { "x", position.x },
                        { "y", position.y },
                        { "z", position.z }
                    }
                },
                { "rotationY", rotationY },
                { "currentAnim", anim },
                { "deltaTime", tickInterval }
            });
        }

        public void EnterSoloMode()
        {
            if (_socket != null) _socket.Disconnect();
            pendingAction = PendingRoomAction.None;
            pendingSent = false;
            ResetRoomState();
            SetRole(NetworkRole.OfflineSinglePlayer);
        }

        public void CreateRoom(string playerName, int maxPlayers = 5)
        {
            pendingAction = PendingRoomAction.Create;
            pendingPlayerName = SanitizeName(playerName);
            pendingRoomCode = null;
            pendingMaxPlayers = Mathf.Clamp(maxPlayers, 2, 5);
            pendingSent = false;
            BeginPendingAction();
        }

        public void JoinRoom(string roomCode, string playerName)
        {
            string normalized = (roomCode ?? string.Empty).Trim().ToUpperInvariant();
            if (!RoomCodePattern.IsMatch(normalized))
            {
                OnJoinFailed?.Invoke("Enter the six-character invite code.");
                return;
            }

            pendingAction = PendingRoomAction.Join;
            pendingRoomCode = normalized;
            pendingPlayerName = SanitizeName(playerName);
            pendingSent = false;
            BeginPendingAction();
        }

        private void BeginPendingAction()
        {
            if (_socket == null)
            {
                OnJoinFailed?.Invoke("Network client is unavailable.");
                return;
            }

            if (_socket.State == SocketIOClient.ConnectionState.Connected)
            {
                TrySendPending();
                return;
            }

            SetRole(pendingAction == PendingRoomAction.Create ? NetworkRole.Host : NetworkRole.Client);
            _socket.Connect(serverUrl);
        }

        private void HandleConnected()
        {
            Debug.Log("[RealtimeManager] Socket connected");
            pendingSent = false;
            TrySendPending();
        }

        private void HandleDisconnected()
        {
            Debug.LogWarning("[RealtimeManager] Socket disconnected");
            pendingSent = false;
            if (pendingAction != PendingRoomAction.None)
            {
                OnJoinFailed?.Invoke("Lost connection to the expedition server.");
                pendingAction = PendingRoomAction.None;
            }
            ResetRoomState();
            SetRole(NetworkRole.OfflineSinglePlayer);
        }

        private void HandleSocketError(string error)
        {
            if (pendingAction == PendingRoomAction.None) return;
            OnJoinFailed?.Invoke("Could not reach the expedition server.");
            pendingAction = PendingRoomAction.None;
        }

        private void TrySendPending()
        {
            if (pendingSent || pendingAction == PendingRoomAction.None) return;
            pendingSent = true;

            if (pendingAction == PendingRoomAction.Create)
            {
                _socket.Emit("createRoom", new Dictionary<string, object>
                {
                    { "playerName", pendingPlayerName },
                    { "maxPlayers", pendingMaxPlayers }
                });
            }
            else if (pendingAction == PendingRoomAction.Join)
            {
                _socket.Emit("joinRoom", new Dictionary<string, object>
                {
                    { "roomCode", pendingRoomCode },
                    { "playerName", pendingPlayerName }
                });
            }
        }

        public void LeaveRoom()
        {
            if (_socket != null)
            {
                if (IsConnected && !string.IsNullOrEmpty(CurrentRoom))
                {
                    _socket.Emit("leaveRoom", null);
                }
                StartCoroutine(DisconnectAfterPacket());
            }

            ResetRoomState();
            SetRole(NetworkRole.OfflineSinglePlayer);
            OnLeftRoom?.Invoke();
            Debug.Log("[RealtimeManager] Left room");
        }

        private IEnumerator DisconnectAfterPacket()
        {
            yield return null;
            if (_socket != null) _socket.Disconnect();
        }

        public void SendChatMessage(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return;
            if (_socket == null || _socket.State != SocketIOClient.ConnectionState.Connected) return;
            _socket.Emit("chatMessage", new Dictionary<string, object>
            {
                { "text", text.Trim() }
            });
        }

        public void SetNetworkRole(NetworkRole newRole)
        {
            SetRole(newRole);
        }

        private void SetRole(NetworkRole newRole)
        {
            if (role == newRole) return;
            role = newRole;
            OnNetworkRoleChanged?.Invoke(role);
            Debug.Log($"<color=#00D2FF><b>[RealtimeManager]</b></color> Network role: {role}");
        }

        private void ResetRoomState()
        {
            CurrentRoom = null;
            LocalPlayerId = null;
            LocalPlayerName = null;
            IsHost = false;
            pendingAction = PendingRoomAction.None;
            pendingRoomCode = null;
            pendingPlayerName = null;
            pendingSent = false;
            localPlayerTransform = null;
            hasBroadcastPosition = false;
            ClearRemotePlayers();
        }

        private void SpawnOrUpdateRemote(string id, Dictionary<string, object> player)
        {
            if (string.IsNullOrEmpty(id) || id == LocalPlayerId || player == null) return;

            string displayName = MiniJson.GetString(player, "name", "Explorer");
            remoteNames[id] = displayName;
            Vector3 position = ReadPosition(player);
            float rotationY = (float)MiniJson.GetNumber(player, "rotationY", 0);

            if (remoteSnapshots.TryGetValue(id, out RemoteAvatar existing))
            {
                existing.TargetPosition = position;
                existing.TargetRotationY = rotationY;
                return;
            }

            GameObject prefab = remotePlayerPrefab != null
                ? remotePlayerPrefab
                : Resources.Load<GameObject>("RemoteExplorerAvatar");
            if (prefab == null)
            {
                Debug.LogError("[RealtimeManager] Remote player prefab is not assigned and Resources/RemoteExplorerAvatar is missing.");
                return;
            }

            GameObject root = Instantiate(prefab, position, Quaternion.Euler(0f, rotationY, 0f));
            root.name = $"RemoteExplorer_{id}";
            root.tag = "Untagged";

            ConfigureRemoteAvatar(root);

            var avatar = new RemoteAvatar
            {
                Root = root,
                Animator = root.GetComponentInChildren<Animator>(true),
                TargetPosition = position,
                TargetRotationY = rotationY,
                TargetAnim = "idle"
            };

            if (avatar.Animator != null)
            {
                foreach (AnimatorControllerParameter parameter in avatar.Animator.parameters)
                {
                    if (parameter.name == "Speed") avatar.HasSpeedParameter = true;
                    if (parameter.name == "IsMoving") avatar.HasMovingParameter = true;
                }
            }

            AddNameTag(root, displayName);
            remoteSnapshots[id] = avatar;
        }

        private static void ConfigureRemoteAvatar(GameObject root)
        {
            foreach (MonoBehaviour behaviour in root.GetComponentsInChildren<MonoBehaviour>(true))
            {
                if (behaviour is Animator) continue;
                behaviour.enabled = false;
            }

            foreach (CharacterController controller in root.GetComponentsInChildren<CharacterController>(true))
            {
                controller.enabled = false;
            }

            foreach (Camera camera in root.GetComponentsInChildren<Camera>(true))
            {
                camera.enabled = false;
                Destroy(camera);
            }

            foreach (AudioListener listener in root.GetComponentsInChildren<AudioListener>(true))
            {
                listener.enabled = false;
                Destroy(listener);
            }
        }

        private static void AddNameTag(GameObject root, string displayName)
        {
            var labelObj = new GameObject("NameTag");
            labelObj.transform.SetParent(root.transform, false);
            labelObj.transform.localPosition = new Vector3(0f, 2.2f, 0f);

            TextMesh label = labelObj.AddComponent<TextMesh>();
            label.text = displayName;
            label.anchor = TextAnchor.MiddleCenter;
            label.alignment = TextAlignment.Center;
            label.characterSize = 0.12f;
            label.fontSize = 48;
            label.color = new Color(1f, 0.95f, 0.8f);

            Font font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            if (font != null)
            {
                label.font = font;
                labelObj.GetComponent<MeshRenderer>().sharedMaterial = font.material;
            }
        }

        private void RemoveRemote(string id)
        {
            if (!remoteSnapshots.TryGetValue(id, out RemoteAvatar avatar)) return;
            if (avatar.Root != null) Destroy(avatar.Root);
            remoteSnapshots.Remove(id);
            remoteNames.Remove(id);
        }

        private void ClearRemotePlayers()
        {
            foreach (RemoteAvatar avatar in remoteSnapshots.Values)
            {
                if (avatar.Root != null) Destroy(avatar.Root);
            }
            remoteSnapshots.Clear();
            remoteNames.Clear();
        }

        /// <summary>
        /// Names currently visible in the room, local player first.
        /// </summary>
        public List<string> GetRosterNames()
        {
            var names = new List<string>();
            if (!string.IsNullOrEmpty(LocalPlayerId)) names.Add(LocalPlayerName ?? "Explorer");
            foreach (string name in remoteNames.Values) names.Add(name);
            return names;
        }

        public void PlayOffline()
        {
            EnterSoloMode();
        }

        public void SendMechanismInteraction(string mechanismId, Dictionary<string, object> payload)
        {
            if (!IsConnected || string.IsNullOrEmpty(CurrentRoom) || string.IsNullOrEmpty(mechanismId)) return;

            _socket.Emit("interactMechanism", new Dictionary<string, object>
            {
                { "mechanismId", mechanismId },
                { "payload", payload ?? new Dictionary<string, object>() }
            });
        }

        private void FailJoin(Dictionary<string, object> payload, string fallback)
        {
            string reason = MiniJson.GetString(payload, "reason", fallback);
            string message = MiniJson.GetString(payload, "message", reason);
            pendingAction = PendingRoomAction.None;
            pendingSent = false;
            if (_socket != null) _socket.Disconnect();
            ResetRoomState();
            SetRole(NetworkRole.OfflineSinglePlayer);
            LastError = string.IsNullOrEmpty(message) ? fallback : message;
            OnJoinFailed?.Invoke(LastError);
        }

        private static Dictionary<string, object> FirstObject(object[] args)
        {
            if (args == null || args.Length == 0) return null;
            return MiniJson.AsObject(args[0]);
        }

        private static Dictionary<string, object> GetObjectField(Dictionary<string, object> payload, string key)
        {
            if (payload == null || !payload.TryGetValue(key, out object value)) return null;
            return MiniJson.AsObject(value);
        }

        private static Vector3 ReadPosition(Dictionary<string, object> payload)
        {
            var position = GetObjectField(payload, "position");
            if (position == null) return Vector3.zero;
            return new Vector3(
                (float)MiniJson.GetNumber(position, "x", 0),
                (float)MiniJson.GetNumber(position, "y", 0),
                (float)MiniJson.GetNumber(position, "z", 0));
        }

        private static string SanitizeName(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "Explorer";
            string trimmed = name.Trim();
            return trimmed.Length > 24 ? trimmed.Substring(0, 24) : trimmed;
        }
    }
}
