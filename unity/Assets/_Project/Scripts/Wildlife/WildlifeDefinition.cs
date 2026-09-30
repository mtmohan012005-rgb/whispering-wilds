using System;
using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.Wildlife
{
    /// <summary>
    /// Scriptable definition profile for wildlife species traits, movement parameters,
    /// audio cues, perception ranges, and habitat compatibility.
    /// </summary>
    [CreateAssetMenu(fileName = "NewWildlifeDefinition", menuName = "Whispering Wilds/Wildlife/Species Definition")]
    public class WildlifeDefinition : ScriptableObject
    {
        [Header("Species Metadata")]
        public WildlifeSpecies species;
        public string commonTamilName;
        public string englishName;
        public WildlifeDietType dietType;
        public bool isDomestic;

        [Header("Locomotion Dynamics")]
        public float baseWalkSpeed = 1.6f;
        public float baseRunSpeed = 4.5f;
        public float baseFlySpeed = 7.0f;
        public bool canFly = false;
        public bool canClimb = false;
        public float flightAltitudeMin = 3.0f;
        public float flightAltitudeMax = 12.0f;

        [Header("Perception & Proximity Reaction")]
        public float noticeDistance = 15.0f;
        public float alertDistance = 11.0f;
        public float fleeDistance = 8.0f;
        public bool isNocturnal = false;
        public bool isSocial = true;
        public int typicalGroupSize = 4;

        [Header("Regional Habitat Affinity")]
        public List<string> allowedRegions = new List<string>();

        public SpeciesProfile ToProfile()
        {
            return new SpeciesProfile
            {
                species = this.species,
                commonTamilName = this.commonTamilName,
                englishName = this.englishName,
                diet = this.dietType,
                baseWalkSpeed = this.baseWalkSpeed,
                baseRunSpeed = this.baseRunSpeed,
                baseFlySpeed = this.baseFlySpeed,
                canFly = this.canFly,
                canClimb = this.canClimb,
                isDomestic = this.isDomestic,
                flightAltitudeMin = this.flightAltitudeMin,
                flightAltitudeMax = this.flightAltitudeMax,
                noticeDistance = this.noticeDistance,
                alertDistance = this.alertDistance,
                fleeDistance = this.fleeDistance,
                isNocturnal = this.isNocturnal,
                isSocial = this.isSocial,
                typicalGroupSize = this.typicalGroupSize,
                preferredRegions = new List<string>(this.allowedRegions)
            };
        }
    }
}
