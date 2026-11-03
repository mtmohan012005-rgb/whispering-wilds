using System;
using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.Audio
{
    [System.Serializable]
    public class SwaraEntry
    {
        public string swaraName;
        public string tamilSyllable;
        public float frequencyHz;
        public AudioClip clip;
    }

    [CreateAssetMenu(fileName = "CarnaticSwaraLibrary", menuName = "Whispering Wilds/Audio/Carnatic Swara Library")]
    public class CarnaticSwaraLibrary : ScriptableObject
    {
        [Header("Tonic Base")]
        public float baseTonicFrequency = 220.0f; // A3 = 220Hz

        [Header("Carnatic Scale Notes")]
        public List<SwaraEntry> swaras = new List<SwaraEntry>();

        public AudioClip GetClipBySwaraName(string name)
        {
            if (string.IsNullOrEmpty(name)) return null;
            var entry = swaras.Find(s => string.Equals(s.swaraName, name, StringComparison.OrdinalIgnoreCase));
            return entry?.clip;
        }

        public AudioClip GetClipByIndex(int index)
        {
            if (index >= 0 && index < swaras.Count)
            {
                return swaras[index].clip;
            }
            return null;
        }

        /// <summary>
        /// Returns the 5 Mohanam swara clips: Sa (0), Ri (1), Ga (2), Pa (4), Dha (5)
        /// in the standard Carnatic heptatonic scale.
        /// </summary>
        public AudioClip[] GetMohanamClips()
        {
            // Sa, Ri, Ga, Pa, Dha
            int[] mohanamIndices = { 0, 1, 2, 4, 5 };
            var clips = new List<AudioClip>();
            foreach (var idx in mohanamIndices)
            {
                if (idx < swaras.Count && swaras[idx].clip != null)
                {
                    clips.Add(swaras[idx].clip);
                }
            }
            return clips.ToArray();
        }
    }
}
