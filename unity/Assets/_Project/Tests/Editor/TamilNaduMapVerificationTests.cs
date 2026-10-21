using System;
using System.Collections.Generic;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;
using WhisperingWilds.Geography;
using WhisperingWilds.World;

namespace WhisperingWilds.Tests.Editor
{
    [TestFixture]
    public class TamilNaduMapVerificationTests
    {
        // Authoritative WGS84 coordinates defined in project requirements
        private static readonly (string id, string name, double lat, double lon, string scene)[] ExpectedAnchors = new[]
        {
            ("chennai", "Chennai George Town", 13.0880, 80.2885, "02_Chennai_GeorgeTown"),
            ("mamallapuram", "Mamallapuram Shore", 12.6186, 80.1983, "06_Mamallapuram_Shore"),
            ("pichavaram", "Pichavaram Mangrove Wetlands", 11.4289, 79.7797, "03_Pichavaram_Wetlands"),
            ("thanjavur", "Thanjavur Brihadisvara Royal Quarter", 10.7828, 79.1318, "04_Thanjavur_Delta"),
            ("chettinad", "Chettinad Kanadukathan Mansions", 10.0673, 78.7844, "05_Chettinad_Mansion"),
            ("nilgiris", "Nilgiris Shola-Tea Biosphere", 11.4102, 76.6950, "07_Nilgiris_Sanctuary")
        };

        [Test]
        public void Test_AllAnchorPoints_MatchGroundedCoordinates()
        {
            foreach (var anchor in ExpectedAnchors)
            {
                bool found = TamilNaduGeography.TryGetRegion(anchor.id, out RegionGeoLocation loc);
                Assert.IsTrue(found, $"Region '{anchor.id}' must exist in TamilNaduGeography.");

                Assert.AreEqual(anchor.lat, loc.latitude, 0.005, $"Latitude mismatch for {anchor.name}");
                Assert.AreEqual(anchor.lon, loc.longitude, 0.005, $"Longitude mismatch for {anchor.name}");
                Assert.AreEqual(anchor.scene, loc.sceneName, $"Scene mapping mismatch for {anchor.name}");
            }
        }

        [Test]
        public void Test_RelativeGeographicDirections_AreAccurate()
        {
            TamilNaduGeography.TryGetRegion("chennai", out var chennai);
            TamilNaduGeography.TryGetRegion("mamallapuram", out var mamalla);
            TamilNaduGeography.TryGetRegion("pichavaram", out var picha);
            TamilNaduGeography.TryGetRegion("thanjavur", out var thanjavur);
            TamilNaduGeography.TryGetRegion("chettinad", out var chettinad);
            TamilNaduGeography.TryGetRegion("nilgiris", out var nilgiris);

            // North-to-South ordering along eastern corridor
            Assert.Greater(chennai.latitude, mamalla.latitude, "Chennai must be north of Mamallapuram");
            Assert.Greater(mamalla.latitude, picha.latitude, "Mamallapuram must be north of Pichavaram");
            Assert.Greater(picha.latitude, thanjavur.latitude, "Pichavaram must be north of Thanjavur");
            Assert.Greater(thanjavur.latitude, chettinad.latitude, "Thanjavur must be north of Chettinad");

            // East-to-West orientation for mountain biosphere
            Assert.Less(nilgiris.longitude, chennai.longitude, "Nilgiris must be west of Chennai");
            Assert.Less(nilgiris.longitude, thanjavur.longitude, "Nilgiris must be west of Thanjavur");
            Assert.Less(nilgiris.longitude, chettinad.longitude, "Nilgiris must be west of Chettinad");
        }

        [Test]
        public void Test_DistanceAssertions_ReflectRealWorldTamilNadu()
        {
            TamilNaduGeography.TryGetRegion("chennai", out var chennai);
            TamilNaduGeography.TryGetRegion("mamallapuram", out var mamalla);
            TamilNaduGeography.TryGetRegion("nilgiris", out var nilgiris);
            TamilNaduGeography.TryGetRegion("thanjavur", out var thanjavur);
            TamilNaduGeography.TryGetRegion("chettinad", out var chettinad);

            // Great-circle haversine calculation
            double dChennaiMamallaKm = CalculateHaversineKm(chennai.latitude, chennai.longitude, mamalla.latitude, mamalla.longitude);
            Assert.GreaterOrEqual(dChennaiMamallaKm, 45.0, "Chennai to Mamallapuram is at least 45 km");
            Assert.LessOrEqual(dChennaiMamallaKm, 65.0, "Chennai to Mamallapuram is at most 65 km");

            double dChennaiNilgirisKm = CalculateHaversineKm(chennai.latitude, chennai.longitude, nilgiris.latitude, nilgiris.longitude);
            Assert.GreaterOrEqual(dChennaiNilgirisKm, 400.0, "Chennai to Nilgiris is at least 400 km");
            Assert.LessOrEqual(dChennaiNilgirisKm, 480.0, "Chennai to Nilgiris is at most 480 km");

            double dThanjavurChettinadKm = CalculateHaversineKm(thanjavur.latitude, thanjavur.longitude, chettinad.latitude, chettinad.longitude);
            Assert.GreaterOrEqual(dThanjavurChettinadKm, 70.0, "Thanjavur to Chettinad is at least 70 km");
            Assert.LessOrEqual(dThanjavurChettinadKm, 110.0, "Thanjavur to Chettinad is at most 110 km");
        }

        [Test]
        public void Test_AllPlayableRegions_MapToValidBuildScenes()
        {
            var buildScenes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var scene in EditorBuildSettings.scenes)
            {
                if (scene.enabled)
                {
                    string sceneName = System.IO.Path.GetFileNameWithoutExtension(scene.path);
                    buildScenes.Add(sceneName);
                }
            }

            foreach (var anchor in ExpectedAnchors)
            {
                Assert.IsTrue(buildScenes.Contains(anchor.scene),
                    $"Playable scene '{anchor.scene}' for region '{anchor.id}' must be present and enabled in EditorBuildSettings.");
            }
        }

        [Test]
        public void Test_RegionUnlocks_EnforcesProgressionAuthoritatively()
        {
            // Chennai must always be unlocked as starting region
            Assert.IsTrue(RegionUnlocks.IsUnlocked("chennai"), "Chennai must be unlocked by default.");

            // Invalid/bogus region IDs must return false
            Assert.IsFalse(RegionUnlocks.IsUnlocked("atlantis"), "Non-existent region must be locked.");
            Assert.IsFalse(RegionUnlocks.IsUnlocked(""), "Empty region string must be locked.");
            Assert.IsFalse(RegionUnlocks.IsUnlocked(null), "Null region must be locked.");
        }

        [Test]
        public void Test_TamilNaduGeoReference_ProjectionParity()
        {
            var geo = TamilNaduGeoReference.Default;
            Assert.IsNotNull(geo, "Default TamilNaduGeoReference must be valid.");

            Vector3 chennaiLocal = geo.LatLonToLocal(13.0880, 80.2885);
            Vector3 mamallaLocal = geo.LatLonToLocal(12.6186, 80.1983);
            Vector3 nilgirisLocal = geo.LatLonToLocal(11.4102, 76.6950);

            // In local coordinate system: +Z is North, +X is East
            Assert.Greater(chennaiLocal.z, mamallaLocal.z, "Chennai local Z must be north of Mamallapuram local Z");
            Assert.Less(nilgirisLocal.x, chennaiLocal.x, "Nilgiris local X must be west of Chennai local X");
        }

        [Test]
        public void Test_UnknownRegionTravel_FailsGracefully()
        {
            bool found = TamilNaduGeography.TryGetRegion("non_existent_zone_99", out var loc);
            Assert.IsFalse(found, "Unknown region must not resolve in TamilNaduGeography.");
            Assert.IsNull(loc.regionId, "Returned regionId should be null or default.");

            string resolved = RegionalSceneManager.ResolveRegionIdFromSceneName("Bogus_Scene_File");
            Assert.IsNull(resolved, "Resolving non-existent scene should return null safely.");
        }

        private static double CalculateHaversineKm(double lat1, double lon1, double lat2, double lon2)
        {
            double r = 6371.0; // Earth radius in km
            double dLat = (lat2 - lat1) * Math.PI / 180.0;
            double dLon = (lon2 - lon1) * Math.PI / 180.0;
            double a = Math.Sin(dLat / 2.0) * Math.Sin(dLat / 2.0) +
                       Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *
                       Math.Sin(dLon / 2.0) * Math.Sin(dLon / 2.0);
            double c = 2.0 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1.0 - a));
            return r * c;
        }
    }
}
