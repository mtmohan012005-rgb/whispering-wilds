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

        [Test]
        public void Test_TamilNaduGeoReference_CanonicalOriginAndScale()
        {
            var geo = TamilNaduGeoReference.Default;
            Assert.AreEqual(10.79, geo.originLatitude, 0.001, "Canonical origin latitude must be 10.79° N.");
            Assert.AreEqual(78.37, geo.originLongitude, 0.001, "Canonical origin longitude must be 78.37° E.");
            Assert.AreEqual(0.001, geo.unitsPerMetre, 1e-6, "Canonical unitsPerMetre must be 0.001 (1 scene unit = 1 km).");
            Assert.AreEqual(1000.0, geo.MetresPerUnit, 0.1, "MetresPerUnit must be 1000 metres.");

            // Orientation verification: +X = East, +Z = North
            Vector3 eastProbe = geo.LatLonToLocal(10.79, 79.37);
            Assert.Greater(eastProbe.x, 100f, "Advancing longitude east must increase +X in local space.");
            Assert.AreEqual(0f, eastProbe.z, 0.5f, "Pure longitudinal probe must not shift Z.");

            Vector3 northProbe = geo.LatLonToLocal(11.79, 78.37);
            Assert.Greater(northProbe.z, 100f, "Advancing latitude north must increase +Z in local space.");
            Assert.AreEqual(0f, northProbe.x, 0.5f, "Pure latitudinal probe must not shift X.");

            // Rough state bounds
            Vector3 southBound = geo.LatLonToLocal(8.08, 77.55); // Kanniyakumari
            Assert.Less(southBound.z, -280f, "Kanniyakumari must be at least 280 scene units south of origin.");
            Assert.Less(southBound.x, -70f, "Kanniyakumari must be west of origin.");

            Vector3 northBound = geo.LatLonToLocal(13.50, 80.32); // Pulicat
            Assert.Greater(northBound.z, 280f, "Pulicat must be at least 280 scene units north of origin.");
            Assert.Greater(northBound.x, 180f, "Pulicat must be east of origin.");

            // Projection vs Haversine distance accuracy within declared 2.5% planar tolerance
            foreach (var anchor in ExpectedAnchors)
            {
                double haversineKm = CalculateHaversineKm(geo.originLatitude, geo.originLongitude, anchor.lat, anchor.lon);
                Vector3 projectedLocal = geo.LatLonToLocal(anchor.lat, anchor.lon);
                float projectedDistanceUnits = new Vector2(projectedLocal.x, projectedLocal.z).magnitude; // 1 unit = 1 km

                double relativeError = Math.Abs(projectedDistanceUnits - haversineKm) / haversineKm;
                Assert.Less(relativeError, 0.025, $"Projected distance to {anchor.name} must match Haversine within 2.5% tolerance.");
            }
        }

        [Test]
        public void Test_StateMapCameraController_ZoomLimitsAndClamping()
        {
            var go = new GameObject("TestMapCamera");
            try
            {
                var cam = go.AddComponent<Camera>();
                var controller = go.AddComponent<StateMapCameraController>();

                Assert.AreEqual(150f, controller.MinHeight, 0.1f, "Camera minHeight must be 150 scene units.");
                Assert.AreEqual(2800f, controller.MaxHeight, 0.1f, "Camera maxHeight must be 2800 scene units.");
                Assert.IsTrue(controller.IsClampingEnabled, "enableClamping must be true by default.");

                controller.SetInitialFrame(new Vector3(0f, 1000f, 0f), Quaternion.identity);

                // Test min zoom clamping
                controller.SetTargetPositionForTesting(new Vector3(0f, 50f, 0f));
                Assert.AreEqual(150f, controller.TargetPosition.y, 0.1f, "Zoom below minHeight must clamp to 150.");

                // Test max zoom clamping
                controller.SetTargetPositionForTesting(new Vector3(0f, 4000f, 0f));
                Assert.AreEqual(2800f, controller.TargetPosition.y, 0.1f, "Zoom above maxHeight must clamp to 2800.");

                // Test reset view
                controller.ResetView();
                Assert.AreEqual(1000f, controller.TargetPosition.y, 0.1f, "ResetView must restore initial camera height.");
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(go);
            }
        }

        [Test]
        public void Test_AllCampaignRegions_LockedDestinationEnforcement()
        {
            var hudGo = new GameObject("TestHUD");
            var markerGo = new GameObject("TestMarker");
            try
            {
                var hud = hudGo.AddComponent<StateMapHUDController>();
                var marker = markerGo.AddComponent<StateMapRegionMarker>();

                // 1. Starting destinations check
                Assert.IsTrue(RegionUnlocks.IsUnlocked("chennai"), "Chennai must be unlocked by default.");
                Assert.IsFalse(RegionUnlocks.IsUnlocked("nilgiris"), "Nilgiris must be locked by default.");
                Assert.IsFalse(RegionUnlocks.IsUnlocked("chettinad"), "Chettinad must be locked by default.");

                // 2. Test locked marker rejection in HUD
                marker.regionId = "nilgiris";
                marker.sceneName = "07_Nilgiris_Sanctuary";
                marker.isUnlocked = false;

                hud.SelectRegion(marker);
                hud.TravelToSelectedRegion();

                // 3. Fallback entry should refuse locked region
                RegionalSceneManager.EnterCampaignRegionFallback("nilgiris");
                RegionalSceneManager.EnterCampaignRegionFallback("chettinad");

                // 4. Unknown/null/empty markers
                hud.SelectRegion(null);
                hud.TravelToSelectedRegion(); // Safe no-op

                marker.regionId = "invalid_nonexistent_zone";
                hud.SelectRegion(marker);
                hud.TravelToSelectedRegion(); // Safe rejection
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(markerGo);
                UnityEngine.Object.DestroyImmediate(hudGo);
            }
        }

        [Test]
        public void Test_GenerateCampaignHubsGeographicReport()
        {
            var geo = TamilNaduGeoReference.Default;
            Assert.IsNotNull(geo);

            var sb = new System.Text.StringBuilder();
            sb.AppendLine("\n================================================================================");
            sb.AppendLine("AUTHORITATIVE CAMPAIGN HUBS GEOGRAPHIC & PROJECTION REPORT");
            sb.AppendLine($"Origin: {geo.originLatitude:F2}° N, {geo.originLongitude:F2}° E | Scale: {geo.unitsPerMetre} units/m (1 unit = 1 km)");
            sb.AppendLine("================================================================================");
            sb.AppendLine(string.Format("{0,-14} | {1,-28} | {2,-16} | {3,-18} | {4,-24} | {5,-12} | {6,-8}",
                "Hub ID", "Region Name", "Lat, Lon", "Unity (X, Z)", "Playable Scene", "Dist to Next", "Bearing"));
            sb.AppendLine(new string('-', 120));

            for (int i = 0; i < ExpectedAnchors.Length; i++)
            {
                var cur = ExpectedAnchors[i];
                var next = ExpectedAnchors[(i + 1) % ExpectedAnchors.Length];

                Vector3 curPos = geo.LatLonToLocal(cur.lat, cur.lon);
                double haversineDist = CalculateHaversineKm(cur.lat, cur.lon, next.lat, next.lon);
                double bearing = CalculateBearingDegrees(cur.lat, cur.lon, next.lat, next.lon);

                string distStr = $"{haversineDist:F1} km";
                string brngStr = $"{bearing:F0}°";

                sb.AppendLine(string.Format("{0,-14} | {1,-28} | {2,6:F4}N, {3,6:F4}E | X:{4,6:F1}, Z:{5,6:F1} | {6,-24} | {7,-12} | {8,-8}",
                    cur.id, cur.name, cur.lat, cur.lon, curPos.x, curPos.z, cur.scene, distStr, brngStr));
            }
            sb.AppendLine("================================================================================");
            Debug.Log(sb.ToString());
        }

        private static double CalculateBearingDegrees(double lat1, double lon1, double lat2, double lon2)
        {
            double dLon = (lon2 - lon1) * Math.PI / 180.0;
            double lat1Rad = lat1 * Math.PI / 180.0;
            double lat2Rad = lat2 * Math.PI / 180.0;
            double y = Math.Sin(dLon) * Math.Cos(lat2Rad);
            double x = Math.Cos(lat1Rad) * Math.Sin(lat2Rad) - Math.Sin(lat1Rad) * Math.Cos(lat2Rad) * Math.Cos(dLon);
            double brng = Math.Atan2(y, x) * 180.0 / Math.PI;
            return (brng + 360.0) % 360.0;
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
