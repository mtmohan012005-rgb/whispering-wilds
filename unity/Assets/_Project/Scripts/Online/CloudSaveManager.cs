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
    /// Returns the current session token for the signed-in player. The persistence
    /// backend uses session-based auth (matching /api/auth/login), so the session
    /// token is the correct credential.
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
        /// Supplies the runtime endpoint and token source. Call this once the auth
        /// layer is ready. The persistence backend uses session-based auth, so the
        /// token provider returns the session token from AuthService. In the Editor
        /// the endpoint may be a localhost development server; in a player build it
        /// must be HTTPS and non-loopback.
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

            IsConfigured = provider != null;
            if (!IsConfigured)
            {
                Debug.LogError("[CloudSaveManager] No token provider supplied. A signed-in user is required before cloud sync can authenticate; cloud sync stays disabled.");
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

        /// <summary>
        /// Callback invoked when a cloud download completes.
        /// </summary>
        public event Action<bool, GameSaveData, string> OnCloudDownloadComplete;

        /// <summary>Current cloud revision, updated after each successful upload.</summary>
        public int CurrentCloudRevision { get; private set; }

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

            // Send raw GameSaveData — the server wraps it automatically for backwards compatibility.
            // The server-side persistence-service.js validates checksum, schema version, and
            // strips privileged fields (currency, achievements, etc.) before persisting.
            // Include revision and idempotency key for optimistic concurrency and safe retries.
            string idempotencyKey = System.Guid.NewGuid().ToString("N");
            StartCoroutine(UploadRoutineWithRevision(JsonUtility.ToJson(data), CurrentCloudRevision, idempotencyKey, "Game save"));
        }

        /// <summary>
        /// Downloads a save from the cloud backend and attempts to restore it.
        /// If the download fails or the save data is corrupted, the callback reports
        /// failure and the local save remains untouched.
        /// </summary>
        /// <param name="saveId">The save slot identifier, e.g. "slot_0"</param>
        public void DownloadSaveFromCloud(string saveId)
        {
            if (!syncEnabled) return;

            if (!CanSync())
            {
                OnCloudDownloadComplete?.Invoke(false, null, "Cloud sync not configured.");
                return;
            }

            if (IsSyncing)
            {
                Debug.LogWarning("[CloudSaveManager] Cloud sync already in progress; skipping this download.");
                return;
            }

            StartCoroutine(DownloadRoutine(saveId));
        }

        public void SynchronizeWorldStateToFirebase(WorldStateData worldData)
        {
            if (!syncEnabled || worldData == null) return;

            if (!CanSync())
            {
                Debug.LogWarning("[CloudSaveManager] World state sync skipped — cloud not configured. World state remains local-only.");
                return;
            }

            // WorldStateData has a different schema than GameSaveData. The persistence
            // endpoint expects GameSaveData. Until a dedicated world-state endpoint is
            // implemented, world state is explicitly local-only.
            Debug.LogWarning("[CloudSaveManager] World state synchronization is local-only. No cloud endpoint for WorldStateData exists yet.");
        }

        private bool CanSync()
        {
            if (IsConfigured) return true;

            if (!configurationErrorLogged)
            {
                configurationErrorLogged = true;
                Debug.LogWarning("[CloudSaveManager] Cloud sync unavailable (no backend endpoint / no signed-in user). Continuing with local persistence only.");
            }
            return false;
        }

        private IEnumerator UploadRoutine(string jsonPayload, string label)
        {
            // Legacy path — no revision tracking. Kept for backwards compatibility.
            return UploadRoutineWithRevision(jsonPayload, 0, null, label);
        }

        private IEnumerator UploadRoutineWithRevision(string jsonPayload, int baseRevision, string idempotencyKey, string label)
        {
            IsSyncing = true;
            bool succeeded = false;
            string message = "Unknown error.";

            // Fetch the session token per request
            string token = null;
            try
            {
                token = idTokenProvider != null ? idTokenProvider() : null;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[CloudSaveManager] Token provider threw: {ex.Message}");
            }

            if (string.IsNullOrEmpty(token))
            {
                Debug.LogWarning("[CloudSaveManager] No auth token available (user not signed in). Falling back to local persistence.");
                message = "No auth token available.";
            }
            else
            {
                string endpoint = $"{persistenceBaseUrl}/saves";
                
                // Build the request envelope so the server receives revision and idempotencyKey.
                // The server wraps raw GameSaveData automatically, but it reads baseRevision
                // and idempotencyKey from the request body. If we send raw JSON, those fields
                // are missing and baseRevision defaults to 0, causing stale-revision conflicts.
                string requestBody = BuildUploadEnvelope(jsonPayload, baseRevision, idempotencyKey);
                
                using (UnityWebRequest request = new UnityWebRequest(endpoint, "POST"))
                {
                    request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(requestBody));
                    request.downloadHandler = new DownloadHandlerBuffer();
                    request.SetRequestHeader("Content-Type", "application/json");
                    request.SetRequestHeader("Authorization", $"Bearer {token}");
                    request.SetRequestHeader("X-WW-CSRF", "1");
                    request.timeout = Mathf.Max(1, requestTimeoutSeconds);

                    yield return request.SendWebRequest();

                    // Only a genuine 2xx from the backend is reported as success.
                    bool httpOk = request.responseCode >= 200 && request.responseCode < 300;
                    succeeded = request.result == UnityWebRequest.Result.Success && httpOk;

                    if (succeeded)
                    {
                        // The server returns { success: true, revision: N, savedAt, region, replayed, requestId }
                        // Parse the top-level "revision" field from the upload response.
                        // A valid revision is REQUIRED to confirm the save — without it we cannot
                        // trust that the backend actually persisted the data, so we treat it as a failure.
                        string response = request.downloadHandler.text;
                        int newRevision = ParseRevisionFromUploadResponse(response);
                        if (newRevision > 0)
                        {
                            CurrentCloudRevision = newRevision;
                            Debug.Log($"<color=#00FF99><b>[CloudSaveManager]</b></color> {label} confirmed by backend (HTTP {request.responseCode}, revision {CurrentCloudRevision}).");
                            message = "Sync confirmed by backend.";
                        }
                        else
                        {
                            // HTTP 2xx but no revision — the response is malformed.
                            // Do NOT report success because we cannot confirm the save was persisted.
                            succeeded = false;
                            Debug.LogWarning($"<color=#FFAA00><b>[CloudSaveManager]</b></color> {label} response missing revision (HTTP {request.responseCode}). Cannot confirm save was persisted. Local persistence remains authoritative.");
                            message = "Backend response missing revision — save not confirmed.";
                        }
                    }
                    else if (request.responseCode == 409)
                    {
                        // Conflict — stale revision
                        Debug.LogWarning($"<color=#FFAA00><b>[CloudSaveManager]</b></color> {label} conflict (HTTP 409). Another save modified this data. Download the latest save first.");
                        message = "Save conflict — data has changed on the server.";
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

        /// <summary>
        /// Extracts the "revision" field from the upload response.
        /// The upload response is { success: true, revision: N, savedAt, region, replayed, requestId }.
        /// Returns 0 if the field is not found or the response is malformed.
        /// </summary>
        private static int ParseRevisionFromUploadResponse(string jsonResponse)
        {
            if (string.IsNullOrEmpty(jsonResponse)) return 0;
            int index = jsonResponse.IndexOf("\"revision\"");
            if (index < 0) return 0;
            int colonIndex = jsonResponse.IndexOf(':', index + 10);
            if (colonIndex < 0) return 0;
            int numStart = colonIndex + 1;
            while (numStart < jsonResponse.Length && char.IsWhiteSpace(jsonResponse[numStart]))
                numStart++;
            int numEnd = numStart;
            while (numEnd < jsonResponse.Length && char.IsDigit(jsonResponse[numEnd]))
                numEnd++;
            if (numEnd <= numStart) return 0;
            if (int.TryParse(jsonResponse.Substring(numStart, numEnd - numStart), out int revision))
                return revision;
            return 0;
        }

        /// <summary>
        /// Downloads a save from the cloud backend. The endpoint expects a GET request
        /// to {baseUrl}/saves/{saveId} with a valid Bearer token.
        /// On success, the JSON response is deserialized and returned via the callback.
        /// On failure, the callback reports the error and the local save is untouched.
        /// </summary>
        private IEnumerator DownloadRoutine(string saveId)
        {
            IsSyncing = true;
            bool succeeded = false;
            GameSaveData downloadedData = null;
            string message = "Unknown error.";

            // Fetch the token per request
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
                Debug.LogWarning("[CloudSaveManager] No auth token available. Cloud download failed.");
                message = "No auth token available.";
            }
            else
            {
                string endpoint = $"{persistenceBaseUrl}/saves/{saveId}";
                using (UnityWebRequest request = new UnityWebRequest(endpoint, "GET"))
                {
                    request.downloadHandler = new DownloadHandlerBuffer();
                    request.SetRequestHeader("Authorization", $"Bearer {token}");
                    request.SetRequestHeader("Accept", "application/json");
                    request.timeout = Mathf.Max(1, requestTimeoutSeconds);

                    yield return request.SendWebRequest();

                    if (request.result == UnityWebRequest.Result.Success && request.responseCode == 200)
                    {
                        string json = request.downloadHandler.text;
                        try
                        {
                            // The server returns { success: true, save: { data: {...}, revision: N, ... }, requestId: "..." }
                            // The actual GameSaveData is nested in save.data, not in save itself.
                            // We extract save.data and update CurrentCloudRevision from save.revision.
                            string dataJson = ExtractSaveDataField(json);
                            if (string.IsNullOrEmpty(dataJson))
                            {
                                downloadedData = null;
                                message = "Server response missing 'save.data' field.";
                                Debug.LogWarning("[CloudSaveManager] Cloud save response has no 'save.data' field.");
                            }
                            else
                            {
                                downloadedData = JsonUtility.FromJson<GameSaveData>(dataJson);
                                if (downloadedData != null)
                                {
                                    // Basic integrity check: verify the save has a valid schema version
                                    if (downloadedData.schemaVersion > 0)
                                    {
                                        // Update CurrentCloudRevision from the downloaded save's revision
                                        int downloadedRevision = ExtractRevisionFromSave(json);
                                        if (downloadedRevision > 0)
                                        {
                                            CurrentCloudRevision = downloadedRevision;
                                        }
                                        succeeded = true;
                                        message = "Cloud save downloaded successfully.";
                                        Debug.Log($"<color=#00FF99><b>[CloudSaveManager]</b></color> Cloud save downloaded (schema v{downloadedData.schemaVersion}, revision {CurrentCloudRevision}).");
                                    }
                                    else
                                    {
                                        // Capture the schema value BEFORE clearing downloadedData to avoid NullReferenceException
                                        int badSchema = downloadedData.schemaVersion;
                                        downloadedData = null;
                                        message = "Downloaded save has invalid schema version.";
                                        Debug.LogWarning($"[CloudSaveManager] Corrupted cloud save rejected (schema version: {badSchema}).");
                                    }
                                }
                                else
                                {
                                    message = "Failed to deserialize cloud save data.";
                                    Debug.LogWarning("[CloudSaveManager] Cloud save JSON deserialization returned null.");
                                }
                            }
                        }
                        catch (System.Exception ex)
                        {
                            downloadedData = null;
                            message = $"Deserialization error: {ex.Message}";
                            Debug.LogError($"[CloudSaveManager] Failed to parse cloud save JSON: {ex.Message}");
                        }
                    }
                    else if (request.responseCode == 404)
                    {
                        message = "No cloud save found for this slot.";
                        Debug.Log("[CloudSaveManager] No cloud save exists for this slot (HTTP 404).");
                    }
                    else
                    {
                        message = string.IsNullOrEmpty(request.error) ? $"HTTP {request.responseCode}" : request.error;
                        Debug.LogWarning($"<color=#FFAA00><b>[CloudSaveManager]</b></color> Cloud download failed ({message}).");
                    }
                }
            }

            IsSyncing = false;
            OnCloudDownloadComplete?.Invoke(succeeded, downloadedData, message);
        }

        /// <summary>
        /// Builds the upload request envelope that includes revision and idempotencyKey.
        /// The server wraps raw GameSaveData automatically, but it reads baseRevision
        /// and idempotencyKey from the request body. Without this envelope, baseRevision
        /// defaults to 0, causing stale-revision conflicts on every upload.
        /// </summary>
        private static string BuildUploadEnvelope(string gameSaveJson, int baseRevision, string idempotencyKey)
        {
            // The gameSaveJson is the raw GameSaveData. We need to wrap it so the server
            // receives: { saveId, saveVersion, data: {...}, checksum, baseRevision, idempotencyKey }
            // But since the server auto-wraps raw GameSaveData (detecting schemaVersion without data),
            // we need to include baseRevision and idempotencyKey in the raw payload itself so the
            // server's wrapper picks them up.
            //
            // Strategy: inject baseRevision and idempotencyKey into the raw GameSaveData JSON.
            // The server's wrapper reads body.revision and body.idempotencyKey from the raw body.
            // GameSaveData doesn't have these fields, so we add them as extra JSON properties.
            
            if (string.IsNullOrEmpty(gameSaveJson)) return "{}";
            
            // Remove the closing brace, add our extra fields, then close
            string json = gameSaveJson.Trim();
            if (!json.EndsWith("}")) return json; // malformed, send as-is
            
            string withoutClosingBrace = json.Substring(0, json.Length - 1);
            
            // Add baseRevision and idempotencyKey as extra fields
            string extraFields = $",\"revision\":{baseRevision}";
            if (!string.IsNullOrEmpty(idempotencyKey))
            {
                extraFields += $",\"idempotencyKey\":\"{idempotencyKey}\"";
            }
            
            return withoutClosingBrace + extraFields + "}";
        }
        
        /// <summary>
        /// Extracts the nested "data" field from the server's save envelope.
        /// The server returns { success: true, save: { data: {...}, revision: N, ... }, requestId: "..." }.
        /// The actual GameSaveData is in save.data, not in save itself.
        /// This method finds save.data and returns it as JSON.
        /// </summary>
        private static string ExtractSaveDataField(string jsonResponse)
        {
            if (string.IsNullOrEmpty(jsonResponse)) return null;

            // Find "save":{...} in the JSON response
            int saveIndex = jsonResponse.IndexOf("\"save\"");
            if (saveIndex < 0) return null;

            // Find the colon after "save"
            int colonIndex = jsonResponse.IndexOf(':', saveIndex + 6);
            if (colonIndex < 0) return null;

            // Find the opening brace of the save object
            int saveBraceStart = jsonResponse.IndexOf('{', colonIndex + 1);
            if (saveBraceStart < 0) return null;

            // Find the matching closing brace of the save object
            int saveBraceEnd = FindMatchingBrace(jsonResponse, saveBraceStart);
            if (saveBraceEnd < 0) return null;
            
            // Now find "data":{...} inside the save object
            string saveObject = jsonResponse.Substring(saveBraceStart, saveBraceEnd - saveBraceStart + 1);
            int dataIndex = saveObject.IndexOf("\"data\"");
            if (dataIndex < 0) return null;
            
            int dataColonIndex = saveObject.IndexOf(':', dataIndex + 6);
            if (dataColonIndex < 0) return null;
            
            int dataBraceStart = saveObject.IndexOf('{', dataColonIndex + 1);
            if (dataBraceStart < 0) return null;
            
            int dataBraceEnd = FindMatchingBrace(saveObject, dataBraceStart);
            if (dataBraceEnd < 0) return null;
            
            return saveObject.Substring(dataBraceStart, dataBraceEnd - dataBraceStart + 1);
        }
        
        /// <summary>
        /// Extracts the "revision" field from the server's save envelope.
        /// The server returns { success: true, save: { revision: N, ... }, ... }.
        /// </summary>
        private static int ExtractRevisionFromSave(string jsonResponse)
        {
            if (string.IsNullOrEmpty(jsonResponse)) return 0;
            
            // Find "save":{...} first
            int saveIndex = jsonResponse.IndexOf("\"save\"");
            if (saveIndex < 0) return 0;
            
            int colonIndex = jsonResponse.IndexOf(':', saveIndex + 6);
            if (colonIndex < 0) return 0;
            
            int saveBraceStart = jsonResponse.IndexOf('{', colonIndex + 1);
            if (saveBraceStart < 0) return 0;
            
            int saveBraceEnd = FindMatchingBrace(jsonResponse, saveBraceStart);
            if (saveBraceEnd < 0) return 0;
            
            string saveObject = jsonResponse.Substring(saveBraceStart, saveBraceEnd - saveBraceStart + 1);
            
            // Find "revision":N inside the save object
            int revIndex = saveObject.IndexOf("\"revision\"");
            if (revIndex < 0) return 0;
            
            int revColonIndex = saveObject.IndexOf(':', revIndex + 10);
            if (revColonIndex < 0) return 0;
            
            int numStart = revColonIndex + 1;
            while (numStart < saveObject.Length && char.IsWhiteSpace(saveObject[numStart]))
                numStart++;
            int numEnd = numStart;
            while (numEnd < saveObject.Length && char.IsDigit(saveObject[numEnd]))
                numEnd++;
            if (numEnd <= numStart) return 0;
            
            if (int.TryParse(saveObject.Substring(numStart, numEnd - numStart), out int revision))
                return revision;
            return 0;
        }
        
        /// <summary>
        /// Finds the matching closing brace for an opening brace at the given index,
        /// properly handling nested braces and string literals.
        /// </summary>
        private static int FindMatchingBrace(string json, int braceStart)
        {
            int depth = 0;
            for (int i = braceStart; i < json.Length; i++)
            {
                char c = json[i];
                if (c == '{') depth++;
                else if (c == '}')
                {
                    depth--;
                    if (depth == 0) return i;
                }
                else if (c == '"')
                {
                    i++;
                    while (i < json.Length && json[i] != '"')
                    {
                        if (json[i] == '\\') i++;
                        i++;
                    }
                }
            }
            return -1;
        }
    }
}
