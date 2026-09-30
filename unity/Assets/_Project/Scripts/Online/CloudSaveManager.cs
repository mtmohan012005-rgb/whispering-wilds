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
    /// Asynchronous cloud persistence governor connecting to The Whispering Wilds Firebase Admin backend.
    /// Operates completely outside the frame render loop with zero stutter or blocking.
    /// Safely falls back to local SaveSystem and WorldPersistenceManager if network connectivity is absent.
    /// </summary>
    [DisallowMultipleComponent]
    public class CloudSaveManager : MonoBehaviour
    {
        public static CloudSaveManager Instance { get; private set; }

        [Header("Firebase Backend Configuration")]
        [SerializeField] private string firebaseBaseUrl = "http://localhost:3000/api/v1/persistence";
        [SerializeField] private string bearerToken = "dev_session_token";
        [SerializeField] private bool syncEnabled = true;

        public bool IsSyncing { get; private set; } = false;

        public event Action<bool, string> OnCloudSyncComplete;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void SynchronizeSaveToCloud(GameSaveData data)
        {
            if (!syncEnabled || data == null) return;
            if (IsSyncing)
            {
                Debug.LogWarning("[CloudSaveManager] Cloud sync operation already in progress.");
                return;
            }

            StartCoroutine(UploadSaveRoutine(data));
        }

        public void SynchronizeWorldStateToFirebase(WorldStateData worldData)
        {
            if (!syncEnabled || worldData == null) return;
            StartCoroutine(UploadWorldStateRoutine(worldData));
        }

        private IEnumerator UploadSaveRoutine(GameSaveData data)
        {
            IsSyncing = true;
            string jsonPayload = JsonUtility.ToJson(data);

            string endpoint = $"{firebaseBaseUrl}/saves";
            using (UnityWebRequest request = new UnityWebRequest(endpoint, "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonPayload);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                request.SetRequestHeader("Authorization", $"Bearer {bearerToken}");
                request.timeout = 5;

                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.Success)
                {
                    Debug.Log("<color=#00FF99><b>[CloudSaveManager]</b></color> Game save successfully synchronized to Firebase persistence backend.");
                    OnCloudSyncComplete?.Invoke(true, "Firebase sync successful.");
                }
                else
                {
                    // Graceful offline fallback - local persistence remains authoritative
                    Debug.LogWarning($"<color=#FFAA00><b>[CloudSaveManager]</b></color> Firebase sync deferred ({request.error}). Local persistence remains intact.");
                    OnCloudSyncComplete?.Invoke(false, request.error);
                }
            }

            IsSyncing = false;
        }

        private IEnumerator UploadWorldStateRoutine(WorldStateData worldData)
        {
            string jsonPayload = JsonUtility.ToJson(worldData);
            string endpoint = $"{firebaseBaseUrl}/saves"; // Batched into player/world persistence record

            using (UnityWebRequest request = new UnityWebRequest(endpoint, "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonPayload);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                request.SetRequestHeader("Authorization", $"Bearer {bearerToken}");
                request.timeout = 5;

                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.Success)
                {
                    Debug.Log("<color=#00FF99><b>[CloudSaveManager]</b></color> World state snapshot synchronized to Firebase.");
                }
                else
                {
                    // Graceful offline fallback
                    Debug.Log($"[CloudSaveManager] Local world persistence active. Firebase sync offline ({request.responseCode}).");
                }
            }
        }
    }
}
