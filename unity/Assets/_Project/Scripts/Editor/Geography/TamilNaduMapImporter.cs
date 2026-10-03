using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text;
using UnityEditor;
using UnityEngine;
using WhisperingWilds.Geography;

namespace WhisperingWilds.Editor.Geography
{
    /// <summary>
    /// Editor-only geographic import pipeline (offline authoring time; never runs at runtime).
    ///
    ///   RAW GIS (unity/MapData/Raw/*.geojson, already clipped to Tamil Nadu by
    ///          MapData/Tools/clip-to-tamilnadu.mjs)
    ///     -> parse + coordinate validation
    ///     -> simplification (Douglas-Peucker, per-layer tolerance)
    ///     -> projection via TamilNaduGeoReference (local origin, precision-safe)
    ///     -> outline triangulation + line ribbons
    ///     -> Unity meshes + TamilNaduMapData + RegionCell ScriptableObjects
    ///
    /// Raw data provenance and licences: unity/MapData/SOURCES_AND_LICENSES.md
    /// </summary>
    public static class TamilNaduMapImporter
    {
        // unity/MapData is a sibling of unity/Assets, so it sits outside the asset database.
        // Resolve it from Application.dataPath rather than Directory.GetCurrentDirectory(),
        // which in -batchmode is the Unity install directory, not the project.
        private static string RawDirectory =>
            Path.GetFullPath(Path.Combine(Path.GetDirectoryName(Application.dataPath) ?? "", "MapData", "Raw"));
private const string GeneratedRoot = "Assets/_Project/Resources/Geography/Generated";
    private const string CellsRoot = "Assets/_Project/Resources/Geography/RegionCells";

        [MenuItem("Whispering Wilds/Geography/Import Tamil Nadu Map Data", priority = 10)]
        public static void ImportAll()
        {
            string rawDir = RawDirectory;
            if (!Directory.Exists(rawDir))
            {
                Debug.LogError($"[TamilNaduMapImporter] Raw directory not found: {rawDir}");
                return;
            }

            EnsureFolder(GeneratedRoot);
            EnsureFolder(CellsRoot);

            Debug.Log($"[TamilNaduMapImporter] rawDir='{rawDir}' dirExists={Directory.Exists(rawDir)} " +
                      $"dataPath='{Application.dataPath}' geojsonFiles=" +
                      (Directory.Exists(rawDir) ? Directory.GetFiles(rawDir, "*.geojson").Length : -1));

            // Probe the parser so a silent zero-result cannot be mistaken for a missing file.
            foreach (string probe in new[] { "tn_boundary.geojson", "tn_10m_coastline.geojson", "tn_10m_populated_places.geojson" })
            {
                string probePath = Path.Combine(rawDir, probe);
                if (!File.Exists(probePath)) { Debug.Log($"[probe] {probe}: FILE MISSING"); continue; }
                string text = File.ReadAllText(probePath);
                object parsed = MiniJson.Parse(text);
                var feats = MiniJson.Features(parsed);
                int rings = 0, lines = 0, pts = 0;
                foreach (var f in feats)
                {
                    rings += MiniJson.PolygonRings(f).Count;
                    lines += MiniJson.LineStrings(f).Count;
                    if (MiniJson.TryGetPoint(f, out _, out _)) pts++;
                }
                Debug.Log($"[probe] {probe}: bytes={text.Length} firstChar=U+{(int)text[0]:X4} " +
                          $"rootType={parsed?.GetType().Name ?? "null"} features={feats.Count} rings={rings} lines={lines} points={pts}");
            }

            var geo = TamilNaduGeoReference.Default;
            string geoAssetPath = GeneratedRoot + "/TamilNaduGeoReference.asset";
            AssetDatabase.CreateAsset(geo, geoAssetPath);

            var mapData = ScriptableObject.CreateInstance<TamilNaduMapData>();
            mapData.geoReference = geo;
            string mapAssetPath = GeneratedRoot + "/TamilNaduMapData.asset";
            AssetDatabase.CreateAsset(mapData, mapAssetPath);

            mapData.stateOutlineSource = "Natural Earth 10m admin-1 (Tamil Nadu) - public domain";
            mapData.generatedByPipeline = "TamilNaduMapImporter v1";
            mapData.generatedAtUtc = DateTime.UtcNow.ToString("u", CultureInfo.InvariantCulture);

            int step = 0;
            var stats = new List<string>();

            // ---- 1. State outline -------------------------------------------------
            step++;
            var outline = LoadRings(rawDir, "tn_boundary.geojson");
            if (outline != null && outline.Count > 0)
            {
                var largest = LargestRing(outline);
                var simplified = SimplifyRing(largest, 0.004);
                var mesh = BuildFilledPolygonMesh(simplified, geo, 0f);
                mesh.name = "TN_StateOutline";
                SaveMesh(mesh, GeneratedRoot + "/TN_StateOutline.asset");
                mapData.stateOutline = mesh;
                stats.Add($"outline: ring {largest.Count} -> {simplified.Count} pts, {mesh.vertexCount} verts");
            }
else if (!File.Exists(Path.Combine(rawDir, "tn_boundary.geojson")))
            {
                stats.Add("outline: FILE MISSING tn_boundary.geojson");
            }
            else
            {
                stats.Add("outline: FILE PRESENT but produced no rings (parse/triangulation failure)");
            }

            // ---- 2. Coastline ----------------------------------------------------
            step++;
            var coast = LoadLineStrings(rawDir, "tn_10m_coastline.geojson");
            if (coast.Count > 0)
            {
                var mesh = BuildRibbonMesh(coast, geo, 2.6f, 0.002f, "TN_Coastline", 0.30f);
                SaveMesh(mesh, GeneratedRoot + "/TN_Coastline.asset");
                mapData.coastline = mesh;
                stats.Add($"coastline: {coast.Count} lines");
            }
            else if (!File.Exists(Path.Combine(rawDir, "tn_10m_coastline.geojson")))
                stats.Add("coastline: FILE MISSING");
            else stats.Add("coastline: FILE PRESENT but produced no geometry (parse failure)");

            // ---- 3. Rivers --------------------------------------------------------
            var rivers = new List<MapLineLayer>();
            AddRiverLayer(rawDir, "tn_10m_rivers_lake_centerlines.geojson", geo, mapData, rivers, stats);
            AddRiverLayer(rawDir, "tn_50m_rivers_lake_centerlines.geojson", geo, mapData, rivers, stats);
            AddRiverLayer(rawDir, "osm_rivers_named.geojson", geo, mapData, rivers, stats);
            mapData.rivers = rivers;

            // ---- 4. Roads ---------------------------------------------------------
            var roads = new List<MapLineLayer>();
            var roadLines = LoadLineStrings(rawDir, "tn_10m_roads.geojson");
            if (roadLines.Count > 0)
            {
                var byName = new Dictionary<string, List<List<Vector2>>>();
                var roadNames = LoadNamedLineStrings(rawDir, "tn_10m_roads.geojson");
                foreach (var kv in roadNames)
                {
                    if (!byName.TryGetValue(kv.Key, out var list)) byName[kv.Key] = list = new List<List<Vector2>>();
                    list.AddRange(kv.Value);
                }
                foreach (var kv in byName)
                {
                    var m = BuildRibbonMesh(kv.Value, geo, 1.6f, 0.01f, "TN_Road_" + Sanitize(kv.Key), 0.75f);
                    SaveMesh(m, GeneratedRoot + "/roads/TN_Road_" + Sanitize(kv.Key) + ".asset");
                    roads.Add(new MapLineLayer { label = kv.Key, sourceDataset = "Natural Earth 10m roads (public domain)", mesh = m, featureCount = kv.Value.Count });
                }
                stats.Add($"roads: {roads.Count} named classes, {roadLines.Count} lines");
            }
            else stats.Add("roads: none");
            mapData.roads = roads;

            // ---- 5. Mountain / physiographic regions -------------------------------
            var ranges = LoadPolygons(rawDir, "tn_10m_geography_regions_polys.geojson");
            if (ranges.Count > 0)
            {
                var combined = new List<List<Vector2>>();
                foreach (var poly in ranges)
                {
                    var name = poly.Key ?? "region";
                    var ring = SimplifyRing(poly.Value, 0.01);
                    if (ring.Count < 3) continue;
                    if (name.IndexOf("INDIA", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        name.IndexOf("ASIA", StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        continue;
                    }
                    combined.Add(ring);
                }
                if (combined.Count > 0)
                {
                    var m = BuildFilledPolygonsMesh(combined, geo, 0.15f);
                    m.name = "TN_MountainRegions";
                    SaveMesh(m, GeneratedRoot + "/TN_MountainRegions.asset");
                    mapData.mountainRegions = m;
                    stats.Add($"physiographic regions: {combined.Count}");
                }
            }

            // ---- 6. Places ---------------------------------------------------------
            var places = LoadPlaces(rawDir, "tn_10m_populated_places.geojson", geo);
            places.Sort((a, b) => b.population.CompareTo(a.population));
            mapData.places = places;
            stats.Add($"places: {places.Count}");

            // ---- 7. Region cells ----------------------------------------------------
            var cells = BuildRegionCells(places, mapData);
            mapData.regionCells = cells;
            stats.Add($"region cells: {cells.Count} ({cells.FindAll(c => c != null && c.implemented).Count} implemented, {cells.FindAll(c => c != null && !c.implemented).Count} reserved)");

            EditorUtility.SetDirty(mapData);
            EditorUtility.SetDirty(geo);
            SaveLayerMaterials();
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            Debug.Log($"[TamilNaduMapImporter] Import complete (step {step}).\n  " + string.Join("\n  ", stats));
        }

        // =====================================================================
        // Region cells
        // =====================================================================

        private struct CellSpec
        {
            public string Id, English, Tamil, Kind, Scene, BiomeKey, TerrainKey, Roads, Pois, Wildlife;
            public double Lat, Lon;
            public bool Implemented;
            public double RadiusKm;
        }

        private static readonly CellSpec[] Specs =
        {
            new CellSpec { Id="chennai", English="Chennai", Tamil="சென்னை", Lat=13.0827, Lon=80.2707,
                Scene="02_Chennai_GeorgeTown", BiomeKey="UrbanCoastal", TerrainKey="Urban", Implemented=true, RadiusKm=18,
                Roads="NH32, NH48, SH58", Pois="George Town, Fort St George, High Court, Marina Beach, Egmore",
                Wildlife="urban birds, stray dogs" },

            new CellSpec { Id="mamallapuram", English="Mamallapuram", Tamil="மாமல்லபுரம்", Lat=12.6196, Lon=80.1936,
                Scene="06_Mamallapuram_Shore", BiomeKey="HeritageCoast", TerrainKey="CoastalRock", Implemented=true, RadiusKm=12,
                Roads="ECR / SH58", Pois="Shore Temple, Mamallapuram, Pancha Rathas, Govindarajapuram",
                Wildlife="lizard, coastal birds" },

            new CellSpec { Id="pichavaram", English="Pichavaram", Tamil="பிச்சாவரம்", Lat=11.5202, Lon=79.3396,
                Scene="03_Pichavaram_Wetlands", BiomeKey="MangroveWetland", TerrainKey="FlatWetland", Implemented=true, RadiusKm=20,
                Roads="NH45, SH86", Pois="Pichavaram Bird Sanctuary, Manompithe waterfall, Killai backwaters",
                Wildlife="migratory shorebirds, spoonbill, Rhizophora mangrove" },

            new CellSpec { Id="thanjavur", English="Thanjavur", Tamil="தஞ்சாவூர்", Lat=10.7870, Lon=79.1378,
                Scene="04_Thanjavur_Delta", BiomeKey="RiverDelta", TerrainKey="FlatAlluvial", Implemented=true, RadiusKm=22,
                Roads="NH83, SH2", Pois="Brihadeeswarar Temple, Thanjavur Maratha Fort, Kumbakonam, Cauvery delta canals",
                Wildlife="paddy heron, black-crowned night heron" },

            new CellSpec { Id="chettinad", English="Chettinad", Tamil="செட்டிநாடு", Lat=10.0728, Lon=78.7795,
                Scene="05_Chettinad_Mansion", BiomeKey="ChettiarCountry", TerrainKey="LateriteUpland", Implemented=true, RadiusKm=20,
                Roads="NH45, SH22", Pois="Chettinad mansions, Athangudi tile works, Kanchipuram, Karaikudi",
                Wildlife="bullock cart, scrub jungle birds" },

            new CellSpec { Id="nilgiris", English="Nilgiris", Tamil="நீலகிரி", Lat=11.4127, Lon=76.7031,
                Scene="07_Nilgiris_Sanctuary", BiomeKey="MontaneSholaTea", TerrainKey="Mountain", Implemented=true, RadiusKm=25,
                Roads="NH766 (Mysore Ooty road)", Pois="Ooty, Coonoor tea estates, Shola forest, Toda settlements",
                Wildlife="Nilgiri tahr, gaur, shola birds" },

            // Reserved future cells: real coordinates, explicitly not implemented.
            new CellSpec { Id="madurai", English="Madurai", Tamil="மதுரை", Lat=9.9252, Lon=78.1198, RadiusKm=18,
                Scene="", BiomeKey="DryScrubForest", TerrainKey="RollingPlateau", Roads="NH45, NH44", Pois="Meenakshi Temple, Alagar Kovil" },
            new CellSpec { Id="coimbatore", English="Coimbatore", Tamil="கோயம்புத்தூர்", Lat=11.0168, Lon=76.9558, RadiusKm=18,
                Scene="", BiomeKey="InteriorPlateau", TerrainKey="RollingPlateau", Roads="NH12, NH47", Pois="Marudamalai, Pollachi" },
            new CellSpec { Id="kumbakonam", English="Kumbakonam", Tamil="கும்பகோணம்", Lat=10.9629, Lon=79.4879, RadiusKm=10,
                Scene="", BiomeKey="RiverDelta", TerrainKey="FlatAlluvial", Roads="NH83", Pois="Kumbakonam temples, Cauvery" },
            new CellSpec { Id="thoothukudi", English="Thoothukudi", Tamil="தூத்துக்குடி", Lat=8.7642, Lon=78.1348, RadiusKm=14,
                Scene="", BiomeKey="CoastalPlain", TerrainKey="FlatWetland", Roads="NH7, NH45A", Pois="Gulf of Mannar, Manakudi" },
            new CellSpec { Id="vellore", English="Vellore", Tamil="வேலூர்", Lat=12.9165, Lon=79.1325, RadiusKm=14,
                Scene="", BiomeKey="InteriorPlateau", TerrainKey="RollingPlateau", Roads="NH40", Pois="Vellore Fort, Jawad" },
            new CellSpec { Id="tirunelveli", English="Tirunelveli", Tamil="திருநெல்வேலி", Lat=8.7139, Lon=77.7567, RadiusKm=16,
                Scene="", BiomeKey="DryScrubForest", TerrainKey="RollingPlateau", Roads="NH7, SH39", Pois="Nellaiappar temple, Tamiraparani" },
        };

        private static List<RegionCell> BuildRegionCells(List<MapPlace> places, TamilNaduMapData mapData)
        {
            var result = new List<RegionCell>();
            for (int i = 0; i < Specs.Length; i++)
            {
                var spec = Specs[i];
                var cell = ScriptableObject.CreateInstance<RegionCell>();
                cell.regionId = spec.Id;
                cell.displayNameEnglish = spec.English;
                cell.displayNameTamil = spec.Tamil;
                cell.localizationKey = "region." + spec.Id;

                // Prefer an authoritative position from the imported populated-places data.
                int matchIndex = places.FindIndex(p => string.Equals(p.nameEnglish, spec.English, StringComparison.OrdinalIgnoreCase));
                if (matchIndex >= 0 && places[matchIndex].latitude != 0)
                {
                    cell.latitude = (float)places[matchIndex].latitude;
                    cell.longitude = (float)places[matchIndex].longitude;
                }
                else
                {
                    cell.latitude = (float)spec.Lat;
                    cell.longitude = (float)spec.Lon;
                }

                cell.boundsKilometres = new Vector2((float)spec.RadiusKm, (float)spec.RadiusKm);
                cell.biome = ParseEnum<TamilNaduBiome>(spec.BiomeKey);
                cell.terrainType = ParseEnum<TamilNaduTerrainType>(spec.TerrainKey);
                cell.playableSceneName = spec.Scene;
                cell.streamingRadiusKm = (float)(spec.RadiusKm * 1.6);
                cell.implemented = spec.Implemented;
                cell.allowedWildlife = SplitList(spec.Wildlife);
                cell.majorRoads = SplitList(spec.Roads);
                cell.pointsOfInterest = SplitList(spec.Pois);

                string path = $"{CellsRoot}/RegionCell_{spec.Id}.asset";
                AssetDatabase.CreateAsset(cell, path);
                result.Add(cell);
            }
            return result;
        }

        private static T ParseEnum<T>(string value) where T : struct
        {
            return Enum.TryParse<T>(value, true, out var parsed) ? parsed : default;
        }

        private static List<string> SplitList(string csv)
        {
            var list = new List<string>();
            if (string.IsNullOrWhiteSpace(csv)) return list;
            foreach (var part in csv.Split(','))
            {
                var trimmed = part.Trim();
                if (trimmed.Length > 0) list.Add(trimmed);
            }
            return list;
        }

        private static string Sanitize(string name)
        {
            var sb = new StringBuilder();
            foreach (char c in name)
            {
                sb.Append(char.IsLetterOrDigit(c) ? c : '_');
            }
            return sb.ToString();
        }

        // =====================================================================
        // Layer helpers
        // =====================================================================

        private static void AddRiverLayer(string rawDir, string file, TamilNaduGeoReference geo,
            TamilNaduMapData mapData, List<MapLineLayer> target, List<string> stats)
        {
            var named = LoadNamedLineStrings(rawDir, file);
            if (named.Count == 0) return;

            foreach (var kv in named)
            {
                if (kv.Value.Count == 0) continue;
                string meshName = "TN_River_" + Sanitize(kv.Key);
                var m = BuildRibbonMesh(kv.Value, geo, 2.0f, 0.004f, meshName, 0.52f);
                SaveMesh(m, $"{GeneratedRoot}/rivers/{meshName}.asset");
                target.Add(new MapLineLayer
                {
                    label = kv.Key,
                    sourceDataset = file,
                    mesh = m,
                    featureCount = kv.Value.Count
                });
            }
            stats.Add($"rivers from {file}: {named.Count} named");
        }

        // =====================================================================
        // Raw GeoJSON loading
        // =====================================================================

        private static string RawPath(string rawDir, string file)
        {
            return Path.Combine(rawDir, file);
        }

        private static List<List<Vector2>> LoadLineStrings(string rawDir, string file)
        {
            var result = new List<List<Vector2>>();
            foreach (var kv in LoadNamedLineStrings(rawDir, file))
            {
                result.AddRange(kv.Value);
            }
            return result;
        }

        private static Dictionary<string, List<List<Vector2>>> LoadNamedLineStrings(string rawDir, string file)
        {
            var result = new Dictionary<string, List<List<Vector2>>>();
            string path = RawPath(rawDir, file);
            if (!File.Exists(path)) return result;

            var doc = MiniJson.Parse(File.ReadAllText(path));
            var features = MiniJson.Features(doc);
            foreach (var f in features)
            {
                // Natural Earth roads often carry an empty `name`; fall back through the other
                // identifying fields so highway classes stay separable instead of collapsing
                // into one "unnamed" bucket.
                string name = FirstNonEmpty(f, "name", "NAME", "label", "type", "featurecla") ?? "unnamed";
                var lines = MiniJson.LineStrings(f);
                if (lines.Count == 0) continue;
                if (!result.TryGetValue(name, out var list)) result[name] = list = new List<List<Vector2>>();
                list.AddRange(lines);
            }
            return result;
        }

        private static string FirstNonEmpty(Dictionary<string, object> feature, params string[] keys)
        {
            foreach (string key in keys)
            {
                string value = MiniJson.PropertyString(feature, key);
                if (!string.IsNullOrEmpty(value) && value.Trim().Length > 0) return value;
            }
            return null;
        }

        private static List<KeyValuePair<string, List<Vector2>>> LoadPolygons(string rawDir, string file)
        {
            var result = new List<KeyValuePair<string, List<Vector2>>>();
            string path = RawPath(rawDir, file);
            if (!File.Exists(path)) return result;

            var doc = MiniJson.Parse(File.ReadAllText(path));
            foreach (var f in MiniJson.Features(doc))
            {
                string name = MiniJson.PropertyString(f, "name") ?? MiniJson.PropertyString(f, "NAME") ?? "region";
                foreach (var ring in MiniJson.PolygonRings(f))
                {
                    if (ring.Count > 2) result.Add(new KeyValuePair<string, List<Vector2>>(name, ring));
                }
            }
            return result;
        }

        private static List<List<Vector2>> LoadRings(string rawDir, string file)
        {
            string path = RawPath(rawDir, file);
            if (!File.Exists(path)) return null;
            return MiniJson.PolygonRingsFromFeatures(MiniJson.Features(MiniJson.Parse(File.ReadAllText(path))));
        }

        private static List<MapPlace> LoadPlaces(string rawDir, string file, TamilNaduGeoReference geo)
        {
            var result = new List<MapPlace>();
            string path = RawPath(rawDir, file);
            if (!File.Exists(path)) return result;

            var doc = MiniJson.Parse(File.ReadAllText(path));
            foreach (var f in MiniJson.Features(doc))
            {
                if (!MiniJson.TryGetPoint(f, out double lon, out double lat)) continue;
                string english = MiniJson.PropertyString(f, "name") ?? MiniJson.PropertyString(f, "NAME");
                if (string.IsNullOrEmpty(english)) continue;

                TamilPlaceNames.TryGetTamil(english, out string tamil);
                long pop = MiniJson.PropertyLong(f, "POP_MAX") + MiniJson.PropertyLong(f, "POP_MIN");

                result.Add(new MapPlace
                {
                    nameEnglish = english,
                    nameTamil = tamil ?? english,
                    kind = MiniJson.PropertyString(f, "featurecla") ?? "settlement",
                    latitude = lat,
                    longitude = lon,
                    worldPosition = geo.LatLonToLocal(lat, lon),
                    population = pop
                });
            }
            return result;
        }

        private static List<Vector2> LargestRing(List<List<Vector2>> rings)
        {
            var best = new List<Vector2>();
            foreach (var r in rings)
            {
                if (r.Count > best.Count) best = r;
            }
            return best;
        }

        // =====================================================================
        // Simplification (Douglas-Peucker)
        // =====================================================================

        public static List<Vector2> SimplifyRing(List<Vector2> points, double tolerance)
        {
            if (points == null || points.Count < 3 || tolerance <= 0) return points;
            var keep = new bool[points.Count];
            keep[0] = keep[points.Count - 1] = true;
            DouglasPeucker(points, 0, points.Count - 1, (float)tolerance, keep);

            var result = new List<Vector2>();
            for (int i = 0; i < points.Count; i++)
            {
                if (keep[i]) result.Add(points[i]);
            }
            return result.Count >= 3 ? result : points;
        }

        private static void DouglasPeucker(List<Vector2> pts, int first, int last, float tol, bool[] keep)
        {
            if (last <= first + 1) return;
            float maxDist = 0f;
            int index = -1;
            var a = pts[first];
            var b = pts[last];

            for (int i = first + 1; i < last; i++)
            {
                float d = PerpDistance(pts[i], a, b);
                if (d > maxDist) { maxDist = d; index = i; }
            }

            if (maxDist > tol && index > 0)
            {
                keep[index] = true;
                DouglasPeucker(pts, first, index, tol, keep);
                DouglasPeucker(pts, index, last, tol, keep);
            }
        }

        private static float PerpDistance(Vector2 point, Vector2 a, Vector2 b)
        {
            float dx = b.x - a.x;
            float dy = b.y - a.y;
            if (dx == 0f && dy == 0f) return Vector2.Distance(point, a);
            float t = ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy);
            t = Mathf.Clamp01(t);
            return Vector2.Distance(point, new Vector2(a.x + t * dx, a.y + t * dy));
        }

        // =====================================================================
        // Mesh construction
        // =====================================================================

        private static void SaveMesh(Mesh mesh, string assetPath)
        {
            string dir = Path.GetDirectoryName(assetPath);
            if (!string.IsNullOrEmpty(dir)) EnsureFolder(dir.Replace('\\', '/'));
            AssetDatabase.CreateAsset(mesh, assetPath);
        }

        public const string MaterialsRoot = "Assets/_Project/Resources/Geography/Materials";

        /// <summary>
        /// Pre-authors the state-map layer materials as real .mat assets.
        /// Runtime "new Material(Shader.Find(...))" produced materials whose HDRP/Unlit shader
        /// variants are not reliably compiled into a player build, so every map layer rendered
        /// zero fragments in the built game even though the renderer reported isVisible=true.
        /// Shipping the materials as assets under Resources guarantees both the shader and its
        /// variants are included.
        /// </summary>
        public static void SaveLayerMaterials()
        {
            EnsureFolder(MaterialsRoot);
            Shader shader = Shader.Find("HDRP/Unlit") ?? Shader.Find("Unlit/Color");
            if (shader == null)
            {
                Debug.LogError("[TamilNaduMapImporter] no unlit shader found for layer materials");
                return;
            }

            // Do NOT hardcode a colour property name. HDRP/Unlit in this package version does not
            // expose _BaseColor (HasProperty returned false), so every layer material was created
            // with Unity's default WHITE and the whole state map washed out to a blank frame.
            // Discover the shader's real colour property instead.
            string colourProp = null;
            var colourProps = new List<string>();
            for (int i = 0; i < shader.GetPropertyCount(); i++)
            {
                if (shader.GetPropertyType(i) != UnityEngine.Rendering.ShaderPropertyType.Color) continue;
                string pn = shader.GetPropertyName(i);
                colourProps.Add(pn);
                if (colourProp == null) colourProp = pn;
            }
            if (colourProp == null) colourProp = "_BaseColor";
            Debug.Log($"[TamilNaduMapImporter] shader='{shader.name}' colourProperties=[{string.Join(",", colourProps)}] using '{colourProp}'");

            // The state outline is a FILLED landmass, not a border line. It was previously
            // (0.10,0.13,0.18) - almost identical to the (0.13,0.15,0.18) board, so even a
            // correctly-rendered map was invisible. Keep every layer clearly separable.
            var layers = new (string key, float r, float g, float b)[]
            {
                ("Outline",   0.44f, 0.41f, 0.30f),
                ("Coast",     0.10f, 0.45f, 0.78f),
                ("Terrain",   0.26f, 0.19f, 0.13f),
                ("River",     0.15f, 0.58f, 0.92f),
                ("Road",      0.88f, 0.80f, 0.55f),
                ("Marker",    0.98f, 0.96f, 0.90f),
                ("Backdrop",  0.07f, 0.08f, 0.10f),
            };

            foreach (var (key, r, g, b) in layers)
            {
                string path = $"{MaterialsRoot}/Layer_{key}.mat";
                var existing = AssetDatabase.LoadAssetAtPath<Material>(path);
                var mat = existing != null ? existing : new Material(shader);
                mat.shader = shader;
                mat.name = $"Layer_{key}";
                mat.SetColor(colourProp, new Color(r, g, b, 1f));
                // Common colour property aliases, harmless when absent.
                foreach (string alias in new[] { "_BaseColor", "_Color" })
                {
                    if (alias != colourProp && mat.HasProperty(alias)) mat.SetColor(alias, new Color(r, g, b, 1f));
                }
                // Flat single-sided map layers: never let a winding slip hide the whole map.
                if (mat.HasProperty("_Cull")) mat.SetFloat("_Cull", (float)UnityEngine.Rendering.CullMode.Off);
                if (existing == null) AssetDatabase.CreateAsset(mat, path);
                else EditorUtility.SetDirty(mat);
            }
            AssetDatabase.SaveAssets();
            Debug.Log($"[TamilNaduMapImporter] wrote {layers.Length} layer materials to {MaterialsRoot}");
        }

        /// <summary>Ear-clipping triangulation of a simple ring, projected into the XZ plane.</summary>
        public static Mesh BuildFilledPolygonMesh(List<Vector2> ring, TamilNaduGeoReference geo, float yOffset)
        {
            var projected = new List<Vector3>(ring.Count);
            foreach (var p in ring)
            {
                projected.Add(geo.LatLonToLocal(p.y, p.x));
            }
            return TriangulateProjected(projected, yOffset, "TN_StateOutline");
        }

        public static Mesh BuildFilledPolygonsMesh(List<List<Vector2>> rings, TamilNaduGeoReference geo, float yOffset)
        {
            var verts = new List<Vector3>();
            var tris = new List<int>();

            foreach (var ring in rings)
            {
                var projected = new List<Vector3>(ring.Count);
                foreach (var p in ring)
                {
                    projected.Add(geo.LatLonToLocal(p.y, p.x));
                }
                TriangulateInto(projected, yOffset, verts, tris);
            }

            return FinalizeMesh("TN_Regions", verts, tris);
        }

        private static Mesh FinalizeMesh(string name, List<Vector3> verts, List<int> tris)
        {
            var mesh = new Mesh { name = name };
            if (verts.Count > 65000) mesh.indexFormat = UnityEngine.Rendering.IndexFormat.UInt32;
            mesh.SetVertices(verts);
            mesh.SetTriangles(tris, 0);

            // Ship a UV channel. These meshes previously had none, which left them the only
            // renderers in the scene without TEXCOORD0.
            if (verts.Count > 0)
            {
                float minX = float.MaxValue, maxX = float.MinValue, minZ = float.MaxValue, maxZ = float.MinValue;
                foreach (var v in verts)
                {
                    minX = Mathf.Min(minX, v.x); maxX = Mathf.Max(maxX, v.x);
                    minZ = Mathf.Min(minZ, v.z); maxZ = Mathf.Max(maxZ, v.z);
                }
                float spanX = Mathf.Max(1e-5f, maxX - minX);
                float spanZ = Mathf.Max(1e-5f, maxZ - minZ);
                var uvs = new Vector2[verts.Count];
                for (int i = 0; i < verts.Count; i++)
                {
                    uvs[i] = new Vector2((verts[i].x - minX) / spanX, (verts[i].z - minZ) / spanZ);
                }
                mesh.uv = uvs;
            }

            mesh.RecalculateNormals();

            // RecalculateNormals leaves zero-length normals on vertices no triangle references.
            // A normalising vertex shader turns those into NaN, and a NaN vertex position kills
            // the whole primitive. Flat map layers all face up.
            var normals = mesh.normals;
            bool patched = false;
            for (int i = 0; i < normals.Length; i++)
            {
                if (normals[i].sqrMagnitude > 1e-8f) continue;
                normals[i] = Vector3.up;
                patched = true;
            }
            if (patched) mesh.normals = normals;

            mesh.RecalculateBounds();
            return mesh;
        }

        private static Mesh TriangulateProjected(List<Vector3> loop, float yOffset, string name)
        {
            var verts = new List<Vector3>();
            var tris = new List<int>();
            TriangulateInto(loop, yOffset, verts, tris);
            return FinalizeMesh(name, verts, tris);
        }

        private static void TriangulateInto(List<Vector3> loop, float yOffset, List<Vector3> verts, List<int> tris)
        {
            int n = loop.Count;
            if (n < 3) return;

            // Only this ring's triangles may be reversed. Scanning the whole shared list
            // re-flipped every previously emitted ring on each pass, so multi-ring layers
            // (mountain regions) ended up with alternating winding.
            int firstTri = tris.Count;
            int offset = verts.Count;
            for (int i = 0; i < n; i++)
            {
                var v = loop[i];
                verts.Add(new Vector3(v.x, v.y + yOffset, v.z));
            }

            var indices = new List<int>(n);
            for (int i = 0; i < n; i++) indices.Add(i);

            int guard = 0;
            while (indices.Count > 3 && guard < indices.Count * indices.Count)
            {
                guard++;
                bool clipped = false;
                for (int i = 0; i < indices.Count; i++)
                {
                    int ia = indices[(i - 1 + indices.Count) % indices.Count];
                    int ib = indices[i];
                    int ic = indices[(i + 1) % indices.Count];

                    var a = verts[offset + ia];
                    var b = verts[offset + ib];
                    var c = verts[offset + ic];

                    float cross = (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
                    if (cross <= 0f) continue;

                    bool contains = false;
                    for (int j = 0; j < indices.Count; j++)
                    {
                        int idx = indices[j];
                        if (idx == ia || idx == ib || idx == ic) continue;
                        if (PointInTriangle(verts[offset + idx], a, b, c)) { contains = true; break; }
                    }
                    if (contains) continue;

                    tris.Add(offset + ia);
                    tris.Add(offset + ib);
                    tris.Add(offset + ic);

                    indices.RemoveAt(i);
                    clipped = true;
                    break;
                }
                if (!clipped) break;
            }
            if (indices.Count == 3)
            {
                tris.Add(offset + indices[0]);
                tris.Add(offset + indices[1]);
                tris.Add(offset + indices[2]);
            }

            // GeoJSON rings are wound for a lon/lat plane where +Y is north. Projecting to
            // Unity's +Z-north XZ plane flips the apparent winding, so an overhead map camera
            // backface-culls the whole layer. The ear test above only accepts cross > 0, which
            // under UnityEngine.Vector3.Cross yields a -Y (downward) normal, so reversing the
            // indices here puts every normal on +Y.
            // This lives in TriangulateInto so ALL callers (state outline via
            // TriangulateProjected, plus the region polygons) get the same fix.
            // Callers must NOT flip again.
            for (int i = firstTri; i + 2 < tris.Count; i += 3)
            {
                int t = tris[i];
                tris[i] = tris[i + 2];
                tris[i + 2] = t;
            }
        }

        private static bool PointInTriangle(Vector2 p, Vector3 a, Vector3 b, Vector3 c)
        {
            float d1 = Sign2(p, a, b);
            float d2 = Sign2(p, b, c);
            float d3 = Sign2(p, c, a);
            bool hasNeg = d1 < 0f || d2 < 0f || d3 < 0f;
            bool hasPos = d1 > 0f || d2 > 0f || d3 > 0f;
            return !(hasNeg && hasPos);
        }

        private static float Sign2(Vector2 p, Vector3 a, Vector3 b)
        {
            return (p.x - b.x) * (a.z - b.z) - (a.x - b.x) * (p.y - b.z);
        }

        /// <summary>Expands polylines into flat XZ ribbons. Cheap and reliable for map geometry.</summary>
        public static Mesh BuildRibbonMesh(List<List<Vector2>> lines, TamilNaduGeoReference geo, float width, double simplifyTolerance, string name, float yOffset = 0f)
        {
            var verts = new List<Vector3>();
            var tris = new List<int>();
            var uv = new List<Vector2>();

            foreach (var line in lines)
            {
                if (line == null || line.Count < 2) continue;
                var simple = SimplifyRing(line, simplifyTolerance);
                if (simple.Count < 2) continue;

                var projected = new List<Vector3>(simple.Count);
                foreach (var p in simple) projected.Add(geo.LatLonToLocal(p.y, p.x) + new Vector3(0f, yOffset, 0f));

                for (int i = 0; i < projected.Count - 1; i++)
                {
                    var a = projected[i];
                    var b = projected[i + 1];
                    var dir = b - a;
                    dir.y = 0f;
                    if (dir.sqrMagnitude < 1e-8f) continue;
                    dir.Normalize();
                    var side = new Vector3(-dir.z, 0f, dir.x) * (width * 0.5f);

                    int baseIndex = verts.Count;
                    verts.Add(a - side); uv.Add(new Vector2(0f, i / (float)projected.Count));
                    verts.Add(a + side); uv.Add(new Vector2(1f, i / (float)projected.Count));
                    verts.Add(b + side); uv.Add(new Vector2(1f, (i + 1) / (float)projected.Count));
                    verts.Add(b - side); uv.Add(new Vector2(0f, (i + 1) / (float)projected.Count));

                    tris.Add(baseIndex + 0); tris.Add(baseIndex + 2); tris.Add(baseIndex + 1);
                    tris.Add(baseIndex + 0); tris.Add(baseIndex + 3); tris.Add(baseIndex + 2);
                }
            }

            // Same lon/lat -> XZ winding flip as the polygon fill, so ribbon faces point +Y.
            for (int i = 0; i < tris.Count; i += 3)
            {
                int t = tris[i];
                tris[i] = tris[i + 2];
                tris[i + 2] = t;
            }

            var mesh = new Mesh { name = name };
            if (verts.Count > 65000) mesh.indexFormat = UnityEngine.Rendering.IndexFormat.UInt32;
            mesh.SetVertices(verts);
            if (uv.Count == verts.Count) mesh.SetUVs(0, uv);
            mesh.SetTriangles(tris, 0);
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            return mesh;
        }

        private static void EnsureFolder(string folder)
        {
            if (AssetDatabase.IsValidFolder(folder)) return;
            string parent = Path.GetDirectoryName(folder);
            string leaf = Path.GetFileName(folder);
            if (!string.IsNullOrEmpty(parent) && !AssetDatabase.IsValidFolder(parent))
            {
                EnsureFolder(parent.Replace('\\', '/'));
            }
            AssetDatabase.CreateFolder(parent ?? "Assets", leaf);
        }
    }
}