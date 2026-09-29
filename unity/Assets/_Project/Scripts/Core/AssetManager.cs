using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.Core
{
    [Serializable]
    public class TrackedAssetHandle
    {
        public string address;
        public UnityEngine.Object loadedAsset;
        public int referenceCount;
        public float lastAccessTime;
    }

    /// <summary>
    /// Single authoritative Asset Governor managing Addressables & Resource lifetimes.
    /// Strictly tracks load, retain, release, and unload cycles to prevent duplicate
    /// handles, memory leaks, or dangling asset pointers across regional transitions.
    /// </summary>
    [DisallowMultipleComponent]
    public class AssetManager : MonoBehaviour
    {
        public static AssetManager Instance { get; private set; }

        [SerializeField] private List<TrackedAssetHandle> trackedAssets = new List<TrackedAssetHandle>();
        private Dictionary<string, TrackedAssetHandle> handleLookup = new Dictionary<string, TrackedAssetHandle>();

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

        public void LoadAssetAsync<T>(string assetAddress, Action<T> onComplete) where T : UnityEngine.Object
        {
            if (handleLookup.TryGetValue(assetAddress, out var existingHandle))
            {
                existingHandle.referenceCount++;
                existingHandle.lastAccessTime = Time.time;
                onComplete?.Invoke(existingHandle.loadedAsset as T);
                return;
            }

            StartCoroutine(LoadAssetRoutine<T>(assetAddress, onComplete));
        }

        private IEnumerator LoadAssetRoutine<T>(string assetAddress, Action<T> onComplete) where T : UnityEngine.Object
        {
            // Asynchronously load resource with fallback to Resources folder
            ResourceRequest req = Resources.LoadAsync<T>(assetAddress);
            while (!req.isDone)
            {
                yield return null;
            }

            T asset = req.asset as T;
            if (asset != null)
            {
                var handle = new TrackedAssetHandle
                {
                    address = assetAddress,
                    loadedAsset = asset,
                    referenceCount = 1,
                    lastAccessTime = Time.time
                };

                handleLookup[assetAddress] = handle;
                trackedAssets.Add(handle);
                onComplete?.Invoke(asset);
                Debug.Log($"<color=#00D2FF><b>[AssetManager]</b></color> Loaded and retained asset: {assetAddress}");
            }
            else
            {
                Debug.LogWarning($"<color=#FF9900><b>[AssetManager]</b></color> Asset load returned null for: {assetAddress}");
                onComplete?.Invoke(null);
            }
        }

        public void Retain(string assetAddress)
        {
            if (handleLookup.TryGetValue(assetAddress, out var handle))
            {
                handle.referenceCount++;
                handle.lastAccessTime = Time.time;
            }
        }

        public void Release(string assetAddress)
        {
            if (handleLookup.TryGetValue(assetAddress, out var handle))
            {
                handle.referenceCount--;
                if (handle.referenceCount <= 0)
                {
                    handleLookup.Remove(assetAddress);
                    trackedAssets.Remove(handle);

                    if (handle.loadedAsset != null && !(handle.loadedAsset is GameObject))
                    {
                        Resources.UnloadAsset(handle.loadedAsset);
                    }
                    Debug.Log($"<color=#00FF99><b>[AssetManager]</b></color> Safely released asset: {assetAddress}");
                }
            }
        }

        public void ReleaseAllUnreferenced()
        {
            for (int i = trackedAssets.Count - 1; i >= 0; i--)
            {
                var handle = trackedAssets[i];
                if (handle.referenceCount <= 0)
                {
                    handleLookup.Remove(handle.address);
                    trackedAssets.RemoveAt(i);
                    if (handle.loadedAsset != null && !(handle.loadedAsset is GameObject))
                    {
                        Resources.UnloadAsset(handle.loadedAsset);
                    }
                }
            }
        }
    }
}
