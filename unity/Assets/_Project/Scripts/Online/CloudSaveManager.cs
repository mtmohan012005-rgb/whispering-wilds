using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;
using WhisperingWilds.Core;
using WhisperingWilds.Persistence;

namespace WhisperingWilds.Online
{
    /// <summary>
    /// Supplies a valid Firebase ID token for the signed-in player. ID tokens expire
    /// (typically hourly), so the token MUST be fetched per request rather than cached
    /// as a serialized string.
    /// </summary>
    public delegate string IdTokenProvider();

    /// <summary>
    /// Asynchronous cloud persistence governor for The Whispering Wilds backend.
    /// Runs off the render loop and degrades gracefully: if the backend is unreachable
    /// or unconfigured, local persistence (SaveSystem / WorldPersistenceManager) stays
    /// authoritative and the player is never blocked.
    /// </summary>
    /// <remarks>
    /// SECURITY: no credential is baked into this component. The endpoint is supplied at
    /// runtime and the bearer token is produced by <see cref="IdTokenProvider"/>. A
    /// non-development build refuses to talk to a plaintext or loopback endpoint, so a
    /// misconfigured build fails closed to local-only saves instead of leaking a token
    /// over cleartext HTTP.
    /// </remarks>
    [DisallowMultipleComponent]
    public class CloudSaveManager : MonoBehaviour
    {
        public static CloudSaveManager Instance { get; private set; }

        [Header("Persistence Backend")]
        [Tooltip("HTTPS base URL of the persistence backend, e.g. https://api.example.com/api/v1/persistence. Supplied at runtime in release builds.")]
        [SerializeField] private string persistenceBaseUrl = "";

        [Tooltip("Master switch. When false, all sync is skipped and local persistence is used.")]
        [SerializeField] private bool syncEnabled = true;

        [SerializeField] private int requestTimeoutSeconds = 5;

        public bool IsSyncing { get; private set; } = false;

        /// <summary>True once a usable endpoint and token provider are configured.</summary>
        public bool IsConfigured { get; private set; } = false;

        public event Action<bool, string> OnCloudSyncComplete;

        private IdTokenProvider idTokenProvider;
        private bool configurationErrorLogged;

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
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }

        /// <summary>
        /// Supplies the runtime endpoint and ID-token source. Call this once the auth
        /// layer is ready. In the Editor the endpoint may be a localhost development
        /// server; in a player build it must be HTTPS and non-loopback.
        /// </summary>
        public void Configure(string baseUrl, IdTokenProvider provider)
        {
            if (string.IsNullOrWhiteSpace(baseUrl))
            {
                Debug.LogError("[CloudSaveManager] Configure() called with an empty base URL. Cloud sync stays disabled; local saves remain authoritative.");
                idTokenProvider = provider;
                IsConfigured = false;
                return;
            }

            persistenceBaseUrl = baseUrl.TrimEnd('/');
            idTokenProvider = provider;

            if (!IsEndpointAllowed(persistenceBaseUrl))
            {
                if (Application.isEditor)
                {
                    Debug.LogWarning($"[CloudSaveManager] Editor using development endpoint '{persistenceBaseUrl}'. This is permitted in the Editor only and is rejected in player builds.");
                }
                else
                {
                    Debug.LogError($"[CloudSaveManager] Refusing insecure endpoint '{persistenceBaseUrl}' in a player build. Cloud sync is disabled; local saves remain authoritative.");
                    persistenceBaseUrl = "";
                    IsConfigured = false;
                    return;
                }
            }

            IsConfigured = idTokenProvider != null;
            if (!IsConfigured)
            {
                Debug.LogError("[CloudSaveManager] No ID token provider supplied. A signed-in Firebase user is required before cloud sync can authenticate; cloud sync stays disabled.");
            }
        }

        /// <summary>Clears runtime configuration, e.g. on sign-out.</summary>
        public void ClearConfiguration()
        {
            persistenceBaseUrl = "";
            idTokenProvider = null;
            IsConfigured = false;
        }

        /// <summary>
        /// A player build must never send a bearer token over cleartext HTTP or to a
        /// loopback address, which would tie the shipped game to a local dev machine.
        /// </summary>
        private static bool IsEndpointAllowed(string url)
        {
            if (!Uri.TryCreate(url, UriKind.Absolute, out Uri uri))
            {
                Debug.LogError($"[CloudSaveManager] '{url}' is not a valid absolute URL.");
                return false;
            }

            if (uri.Scheme != Uri.UriSchemeHttps)
            {
                return false;
            }

            if (uri.IsLoopback || string.Equals(uri.Host, "localhost", StringComparison.OrdinalIgnoreCase))
            {
                // Allowed only in the Editor; checked by the caller.
                return Application.isEditor;
            }

            return true;
        }

        public void SynchronizeSaveToCloud(GameSaveData data)
        {
            if (!syncEnabled || data == null) return;

            if (!CanSync())
            {
                OnCloudSyncComplete?.Invoke(false, "Cloud sync not configured.");
                return;
            }

            if (IsSyncing)
            {
                Debug.LogWarning("[CloudSaveManager] Cloud sync already in progress; skipping this save upload.");
                return;
            }

            StartCoroutine(UploadRoutine(JsonUtility.ToJson(data), "Game save"));
        }

        public void SynchronizeWorldStateToFirebase(WorldStateData worldData)
        {
            if (!syncEnabled || worldData == null) return;

            if (!CanSync())
            {
                return;
            }

            StartCoroutine(UploadRoutine(JsonUtility.ToJson(worldData), "World state"));
        }

        private bool CanSync()
        {
            if (IsConfigured) return true;

            if (!configurationErrorLogged)
            {
                configurationErrorLogged = true;
                Debug.LogWarning("[CloudSaveManager] Cloud sync unavailable (no backend endpoint / no signed-in Firebase user). Continuing with local persistence only.");
            }
            return false;
        }

        private IEnumerator UploadRoutine(string jsonPayload, string label)
        {
            IsSyncing = true;
            bool succeeded = false;
            string message = "Unknown error.";

            // Fetch the token per request: Firebase ID tokens are short-lived.
            string token = null;
            try
            {
                token = idTokenProvider != null ? idTokenProvider() : null;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[CloudSaveManager] ID token provider threw: {ex.Message}");
            }

            if (string.IsNullOrEmpty(token))
            {
                Debug.LogWarning("[CloudSaveManager] No Firebase ID token available (user not signed in). Falling back to local persistence.");
                message = "No auth token available.";
            }
            else
            {
                string endpoint = $"{persistenceBaseUrl}/saves";
                using (UnityWebRequest request = new UnityWebRequest(endpoint, "POST"))
                {
                    request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(jsonPayload));
                    request.downloadHandler = new DownloadHandlerBuffer();
                    request.SetRequestHeader("Content-Type", "application/json");
                    request.SetRequestHeader("Authorization", $"Bearer {token}");
                    request.timeout = Mathf.Max(1, requestTimeoutSeconds);

                    yield return request.SendWebRequest();

                    // Only a genuine 2xx from the backend is reported as success.
                    bool httpOk = request.responseCode >= 200 && request.responseCode < 300;
                    succeeded = request.result == UnityWebRequest.Result.Success && httpOk;

                    if (succeeded)
                    {
                        Debug.Log($"<color=#00FF99><b>[CloudSaveManager]</b></color> {label} confirmed by backend (HTTP {request.responseCode}).");
                        message = "Sync confirmed by backend.";
                    }
                    else
                    {
                        Debug.LogWarning($"<color=#FFAA00><b>[CloudSaveManager]</b></color> {label} not synced ({request.error}, HTTP {request.responseCode}). Local persistence remains authoritative.");
                        message = string.IsNullOrEmpty(request.error) ? $"HTTP {request.responseCode}" : request.error;
                    }
                }
            }

            IsSyncing = false;
            OnCloudSyncComplete?.Invoke(succeeded, message);
        }
    }
}
