using System;
using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.Wildlife
{
    public enum WildlifeSpecies
    {
        // Forest & Mountain Herbivores
        NilgiriTahr = 0,    // High altitude rocky crags of Nilgiris
        SpottedDeer = 1,    // Chital - deciduous forests, forest clearings
        IndianGaur = 2,     // Western Ghats montane forests & sholas
        AsianElephant = 3,  // Shola corridors, bamboo glades, water channels

        // Omnivores & Primates
        WildBoar = 4,       // Forest undergrowth, root digging
        BonnetMacaque = 5,  // Canopy trees, forest edge, temple groves

        // Birds
        Peafowl = 6,        // Forest glades, scrublands
        Egret = 7,          // Wetland & paddy field water margins
        Kingfisher = 8,     // Mangrove channels, river streams

        // Domestic Rural (Restricted to pastoral farm boundaries)
        Cattle = 9,
        Goat = 10
    }

    public enum WildlifeDietType
    {
        HerbivoreGrazer,   // Grasses, ground foliage
        HerbivoreBrowser,  // Tree leaves, bamboo shoots
        Frugivore,         // Fallen fruits, berries
        Piscivore,         // Small fish, aquatic crustaceans
        OmnivoreScavenger  // Roots, tubers, fallen foliage
    }

    [Serializable]
    public class SpeciesProfile
    {
        public WildlifeSpecies species;
        public string commonTamilName;
        public string englishName;
        public WildlifeDietType diet;
        public float baseWalkSpeed = 1.6f;
        public float baseRunSpeed = 4.5f;
        public float fleeDistance = 8.0f;
        public float noticeDistance = 14.0f;
        public bool isNocturnal = false;
        public bool isSocial = true;
        public int typicalGroupSize = 4;
        public float waterDrinkDuration = 6.0f;
        public float feedingDuration = 8.0f;
        public float restingDuration = 12.0f;

        // Habitat preferences
        public List<string> preferredRegions = new List<string>();
    }

    /// <summary>
    /// Static traits catalog for Tamil Nadu wildlife species.
    /// </summary>
    public static class WildlifeSpeciesCatalog
    {
        private static readonly Dictionary<WildlifeSpecies, SpeciesProfile> Profiles = new Dictionary<WildlifeSpecies, SpeciesProfile>
        {
            {
                WildlifeSpecies.NilgiriTahr,
                new SpeciesProfile
                {
                    species = WildlifeSpecies.NilgiriTahr,
                    commonTamilName = "வரையாடு (Varaiyaadu)",
                    englishName = "Nilgiri Tahr",
                    diet = WildlifeDietType.HerbivoreGrazer,
                    baseWalkSpeed = 1.8f,
                    baseRunSpeed = 5.2f,
                    fleeDistance = 9.0f,
                    noticeDistance = 16.0f,
                    isSocial = true,
                    typicalGroupSize = 5,
                    preferredRegions = new List<string> { "nilgiris" }
                }
            },
            {
                WildlifeSpecies.SpottedDeer,
                new SpeciesProfile
                {
                    species = WildlifeSpecies.SpottedDeer,
                    commonTamilName = "புள்ளி மான் (Pulli Maan)",
                    englishName = "Spotted Deer (Chital)",
                    diet = WildlifeDietType.HerbivoreGrazer,
                    baseWalkSpeed = 2.0f,
                    baseRunSpeed = 6.5f,
                    fleeDistance = 12.0f,
                    noticeDistance = 20.0f,
                    isSocial = true,
                    typicalGroupSize = 6,
                    preferredRegions = new List<string> { "nilgiris", "delta", "pichavaram" }
                }
            },
            {
                WildlifeSpecies.WildBoar,
                new SpeciesProfile
                {
                    species = WildlifeSpecies.WildBoar,
                    commonTamilName = "காட்டுப் பன்றி (Kaattu Panri)",
                    englishName = "Wild Boar",
                    diet = WildlifeDietType.OmnivoreScavenger,
                    baseWalkSpeed = 1.7f,
                    baseRunSpeed = 5.8f,
                    fleeDistance = 7.0f,
                    noticeDistance = 12.0f,
                    isNocturnal = true,
                    isSocial = true,
                    typicalGroupSize = 4,
                    preferredRegions = new List<string> { "nilgiris", "pichavaram", "chettinad" }
                }
            },
            {
                WildlifeSpecies.BonnetMacaque,
                new SpeciesProfile
                {
                    species = WildlifeSpecies.BonnetMacaque,
                    commonTamilName = "குரங்கு (Kurangu)",
                    englishName = "Bonnet Macaque",
                    diet = WildlifeDietType.Frugivore,
                    baseWalkSpeed = 2.2f,
                    baseRunSpeed = 5.0f,
                    fleeDistance = 6.0f,
                    noticeDistance = 14.0f,
                    isSocial = true,
                    typicalGroupSize = 7,
                    preferredRegions = new List<string> { "nilgiris", "mamallapuram", "pichavaram" }
                }
            },
            {
                WildlifeSpecies.Egret,
                new SpeciesProfile
                {
                    species = WildlifeSpecies.Egret,
                    commonTamilName = "வெள்ளைக் கொக்கு (Kokku)",
                    englishName = "Great Egret",
                    diet = WildlifeDietType.Piscivore,
                    baseWalkSpeed = 0.8f,
                    baseRunSpeed = 3.2f,
                    fleeDistance = 10.0f,
                    noticeDistance = 18.0f,
                    isSocial = true,
                    typicalGroupSize = 5,
                    preferredRegions = new List<string> { "pichavaram", "delta", "chennai" }
                }
            },
            {
                WildlifeSpecies.Peafowl,
                new SpeciesProfile
                {
                    species = WildlifeSpecies.Peafowl,
                    commonTamilName = "மயில் (Mayil)",
                    englishName = "Indian Peafowl",
                    diet = WildlifeDietType.OmnivoreScavenger,
                    baseWalkSpeed = 1.4f,
                    baseRunSpeed = 4.2f,
                    fleeDistance = 8.5f,
                    noticeDistance = 15.0f,
                    isSocial = false,
                    typicalGroupSize = 2,
                    preferredRegions = new List<string> { "delta", "chettinad", "nilgiris" }
                }
            },
            {
                WildlifeSpecies.AsianElephant,
                new SpeciesProfile
                {
                    species = WildlifeSpecies.AsianElephant,
                    commonTamilName = "யானை (Aanai)",
                    englishName = "Asian Elephant",
                    diet = WildlifeDietType.HerbivoreBrowser,
                    baseWalkSpeed = 1.5f,
                    baseRunSpeed = 4.0f,
                    fleeDistance = 6.0f,
                    noticeDistance = 22.0f,
                    isSocial = true,
                    typicalGroupSize = 3,
                    preferredRegions = new List<string> { "nilgiris" }
                }
            }
        };

        public static SpeciesProfile GetProfile(WildlifeSpecies species)
        {
            if (Profiles.TryGetValue(species, out var profile))
            {
                return profile;
            }

            // Fallback default
            return new SpeciesProfile
            {
                species = species,
                commonTamilName = species.ToString(),
                englishName = species.ToString(),
                diet = WildlifeDietType.HerbivoreGrazer,
                baseWalkSpeed = 1.5f,
                baseRunSpeed = 4.5f,
                fleeDistance = 8f,
                noticeDistance = 15f
            };
        }
    }
}
