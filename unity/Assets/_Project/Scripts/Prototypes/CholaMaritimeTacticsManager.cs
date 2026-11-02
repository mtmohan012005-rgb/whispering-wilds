using System;
using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.Prototypes
{
    public enum MonsoonWindSeason
    {
        SouthwestMonsoon, // June to September: Favorable eastward passage to Malacca
        NortheastMonsoon  // October to January: Favorable westward return to Coromandel Coast
    }

    [System.Serializable]
    public struct CholaFleetVessel
    {
        public string vesselId;
        public string vesselClass; // "Kalam" (Warship), "Thoni" (Merchant), "Navai" (Flagship)
        public int cargoCapacity;
        public int combatStrength;
        public float hullIntegrity; // 0 to 100
    }

    /// <summary>
    /// Tactical Prototype 1: Chola Maritime Tactics.
    /// Simulates historical Indian Ocean nautical commerce, seasonal monsoon wind currents,
    /// Chola imperial naval expedition routes, and tactical trade port exchanges.
    /// </summary>
    public class CholaMaritimeTacticsManager : MonoBehaviour
    {
        [Header("Season & Ocean Current")]
        public MonsoonWindSeason currentMonsoon = MonsoonWindSeason.SouthwestMonsoon;
        public float windSpeedKnots = 18f;

        [Header("Fleet State")]
        public List<CholaFleetVessel> fleetVessels = new List<CholaFleetVessel>();
        public int spicesCargo = 0;
        public int silkCargo = 0;
        public int goldCoins = 1000;

        public event Action<MonsoonWindSeason> OnSeasonShifted;
        public event Action<string, int> OnCargoExchanged;

        private void Awake()
        {
            InitializeFlagshipFleet();
        }

        public void InitializeFlagshipFleet()
        {
            fleetVessels.Clear();
            fleetVessels.Add(new CholaFleetVessel
            {
                vesselId = "rajendra_navai_01",
                vesselClass = "Navai",
                cargoCapacity = 200,
                combatStrength = 85,
                hullIntegrity = 100f
            });

            fleetVessels.Add(new CholaFleetVessel
            {
                vesselId = "poompuhar_thoni_02",
                vesselClass = "Thoni",
                cargoCapacity = 350,
                combatStrength = 30,
                hullIntegrity = 100f
            });
        }

        /// <summary>
        /// Calculates fleet travel duration across the Bay of Bengal taking into account monsoon seasonal assistance.
        /// </summary>
        public float CalculatePassageTimeDays(float nauticalMiles, bool sailingEastward)
        {
            float baseSpeedKnots = 6f;

            // Southwest monsoon assists eastward sailing; Northeast assists westward
            bool isAssisted = (currentMonsoon == MonsoonWindSeason.SouthwestMonsoon && sailingEastward) ||
                              (currentMonsoon == MonsoonWindSeason.NortheastMonsoon && !sailingEastward);

            float effectiveSpeed = isAssisted ? (baseSpeedKnots + windSpeedKnots * 0.4f) : Mathf.Max(2f, baseSpeedKnots - windSpeedKnots * 0.3f);
            return (nauticalMiles / (effectiveSpeed * 24f));
        }

        public void SetMonsoonSeason(MonsoonWindSeason season)
        {
            currentMonsoon = season;
            OnSeasonShifted?.Invoke(season);
        }

        public bool TradeAtPort(string commodity, int quantity, int unitPrice, bool isBuying)
        {
            int totalCost = quantity * unitPrice;
            if (isBuying)
            {
                if (goldCoins < totalCost) return false;
                goldCoins -= totalCost;
                if (commodity == "spices") spicesCargo += quantity;
                else if (commodity == "silk") silkCargo += quantity;
            }
            else
            {
                if (commodity == "spices" && spicesCargo < quantity) return false;
                if (commodity == "silk" && silkCargo < quantity) return false;

                if (commodity == "spices") spicesCargo -= quantity;
                else if (commodity == "silk") silkCargo -= quantity;
                goldCoins += totalCost;
            }

            OnCargoExchanged?.Invoke(commodity, quantity);
            return true;
        }
    }
}
