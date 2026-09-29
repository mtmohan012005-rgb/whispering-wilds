using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;
using WhisperingWilds.Core;

namespace WhisperingWilds.Online
{
    /// <summary>
    /// Asynchronous cloud save and online profile synchronization via REST/Supabase.
    /// Operates completely outside the frame render loop with zero stutter or blocking.
    /// Safely falls back to local SaveSystem if network connectivity is absent.
    /// </summary>
    [DisallowMultipleComponent]
    public class CloudSaveManager : MonoBehaviour
    {
        public static CloudSaveManager Instance { get; private set; }

        [Header("Cloud Endpoint Configuration")]
        [SerializeField] private string supabaseUrl = "https://your-supabase-project.supabase.co/rest/v1";
        [SerializeField] private string apiKey = "public-anon-key";
        [SerializeField] private bool syncOnSave = true;

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
            if (!syncOnSave) return;
            if (IsSyncing)
            {
                Debug.LogWarning("[CloudSaveManager] Cloud sync operation already in progress.");
                return;
            }

            StartCoroutine(UploadSaveRoutine(data));
        }

        private IEnumerator UploadSaveRoutine(GameSaveData data)
        {
            IsSyncing = true;
            string jsonPayload = JsonUtility.ToJson(data);

            // Construct non-blocking web request
            string endpoint = $"{supabaseUrl}/player_saves";
            using (UnityWebRequest request = new UnityWebRequest(endpoint, "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonPayload);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                request.SetRequestHeader("apikey", apiKey);
                request.SetRequestHeader("Authorization", $"Bearer {apiKey}");
                request.timeout = 10; // 10 second timeout max

                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.Success)
                {
                    Debug.Log("<color=#00FF99><b>[CloudSaveManager]</b></color> Cloud save successfully synchronized to Supabase.");
                    OnCloudSyncComplete?.Invoke(true, "Cloud sync successful.");
                }
                else
                {
                    // Graceful offline fallback - local save remains authoritative
                    Debug.LogWarning($"<color=#FFAA00><b>[CloudSaveManager]</b></color> Cloud sync skipped/failed ({request.error}). Local persistence remains intact.");
                    OnCloudSyncComplete?.Invoke(false, request.error);
                }
            }

            IsSyncing = false;
        }
    }
}
