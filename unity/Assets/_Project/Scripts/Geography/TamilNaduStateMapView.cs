using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;

namespace WhisperingWilds.Geography
{
    /// <summary>
    /// Lightweight state-scale overview of Tamil Nadu, driven entirely by the assets produced by
    /// TamilNaduMapImporter. This is a map/journal view, not the playable world.
    ///
    /// Streaming (see milestone section 20): the whole state is tiny simplified geometry, but it is
    /// still banded so that distant detail is culled. Outline and place labels are always shown;
    /// coast, rivers, roads and terrain regions fade in only within their distance band. Nothing
    /// here ever loads a detailed region scene - that is RegionCell.streamingRadiusKm's job.
    /// </summary>
    [ExecuteAlways]
    public class TamilNaduStateMapView : MonoBehaviour
    {
        [SerializeField] private TamilNaduMapData mapData;

        [Header("Bands (game units; 1 unit = 1 km by default)")]
        [Tooltip("State-map overview mode: keeps the camera directly above the map, where the\n" +
                 "player can never get close to any layer. Bands are ignored so the whole state\n" +
                 "stays visible.")]
        [SerializeField] private bool overviewMode = true;
        [SerializeField] private float coastBand = 700f;
        [SerializeField] private float terrainBand = 600f;
        [SerializeField] private float riverBand = 420f;
        [SerializeField] private float roadBand = 320f;
        [SerializeField] private float placeLabelBand = 500f;

        [Tooltip("Height above the relief board (top face at y=-1) where state layers are drawn.")]
        [SerializeField] private float LayerLiftY = 0.5f;

        [Header("Labels")]
        [SerializeField] private bool showPlaceLabels = true;
        [SerializeField] private float labelHeight = 2.5f;
        [SerializeField] private float labelSize = 9f;

        private readonly List<Renderer> _bandedRenderers = new List<Renderer>();
        private readonly List<float> _bandDistances = new List<float>();
        private readonly List<GameObject> _placeMarkers = new List<GameObject>();
        private bool _placeLabelsHidden;
        private Transform _root;

        public TamilNaduMapData MapData => mapData;

        public void SetMapData(TamilNaduMapData data)
        {
            mapData = data;
            Rebuild();
        }

        private void OnEnable()
        {
            // The production build regenerates 01_StateMap_TamilNadu from code every time
            // (BuildPipelineAutomation -> AssembleAllRegions), so anything hand-placed in that
            // scene is destroyed before the build. Self-construct instead of relying on the scene.
            if (mapData == null)
            {
                mapData = Resources.Load<TamilNaduMapData>("Geography/Generated/TamilNaduMapData");
            }
            if (_root == null) Rebuild();
        }

        public void Rebuild()
        {
            Clear();
            if (mapData == null) return;

            _root = new GameObject("StateMapGeometry").transform;
            _root.SetParent(transform, false);

            if (mapData.stateOutline != null) Spawn(mapData.stateOutline, "Outline", Color32(0.44f, 0.41f, 0.30f, 1f), 0f);
            if (mapData.coastline != null) Spawn(mapData.coastline, "Coast", Color32(0.10f, 0.45f, 0.78f, 1f), coastBand);
            if (mapData.mountainRegions != null) Spawn(mapData.mountainRegions, "Terrain", Color32(0.26f, 0.19f, 0.13f, 1f), terrainBand);

            for (int i = 0; i < mapData.rivers.Count; i++)
            {
                if (mapData.rivers[i].mesh != null)
                {
                    Spawn(mapData.rivers[i].mesh, "River", Color32(0.15f, 0.58f, 0.92f, 1f), riverBand);
                }
            }
            for (int i = 0; i < mapData.roads.Count; i++)
            {
                if (mapData.roads[i].mesh != null)
                {
                    Spawn(mapData.roads[i].mesh, "Road", Color32(0.88f, 0.80f, 0.55f, 1f), roadBand);
                }
            }

            BuildPlaceMarkers();
        }

        private void BuildPlaceMarkers()
        {
            if (!showPlaceLabels || mapData == null) return;

            for (int i = 0; i < mapData.places.Count; i++)
            {
                var place = mapData.places[i];
                var go = new GameObject("place_" + Sanitize(place.nameEnglish));
                go.transform.SetParent(_root, false);
                go.transform.localPosition = place.worldPosition + new Vector3(0f, LayerLiftY + labelHeight, 0f);

                var marker = go.AddComponent<MeshFilter>();
                marker.sharedMesh = BuildMarkerMesh(labelSize);

                var renderer = go.AddComponent<MeshRenderer>();
                renderer.sharedMaterial = LayerMaterial("Marker", Color32(0.95f, 0.93f, 0.85f, 1f));
                renderer.shadowCastingMode = ShadowCastingMode.Off;
                renderer.receiveShadows = false;

                var label = new MapLabel { English = place.nameEnglish, Tamil = place.nameTamil };
                go.AddComponent<MapLabelBillboard>().Bind(label);

                _placeMarkers.Add(go);
            }
        }

        private void LateUpdate()
        {
            if (_root == null || mapData == null) return;
            if (Camera.main == null) return;

            // In overview mode every layer stays on. The bands are a ground-camera LOD device;
            // measured from a map camera 3000+ units above the state they would hide everything,
            // which is exactly the bug that made 9 of 10 layers invisible.
            if (overviewMode)
            {
                for (int i = 0; i < _bandedRenderers.Count; i++)
                {
                    if (!_bandedRenderers[i].enabled) _bandedRenderers[i].enabled = true;
                }
                if (_placeLabelsHidden)
                {
                    _placeLabelsHidden = false;
                    for (int i = 0; i < _placeMarkers.Count; i++) _placeMarkers[i].SetActive(showPlaceLabels);
                }
                return;
            }

            Vector3 cam = Camera.main.transform.position;
            for (int i = 0; i < _bandedRenderers.Count; i++)
            {
                bool visible = Vector3.Distance(cam, _bandedRenderers[i].transform.position) <= _bandDistances[i];
                if (_bandedRenderers[i].enabled != visible) _bandedRenderers[i].enabled = visible;
            }

            bool labelsVisible = Vector3.Distance(cam, transform.position) <= placeLabelBand + placeLabelBand;
            _placeLabelsHidden = !labelsVisible;
            for (int i = 0; i < _placeMarkers.Count; i++)
            {
                if (_placeMarkers[i].activeSelf != labelsVisible) _placeMarkers[i].SetActive(labelsVisible);
            }
        }

        private void Spawn(Mesh mesh, string materialKey, Color color, float band)
        {
            var go = new GameObject(mesh.name);
            go.transform.SetParent(_root, false);
            // Lift clear of the Map_Relief_Board surface (top face at y = -1) so the state
            // layers never z-fight with the board they are drawn on.
            go.transform.localPosition = new Vector3(0f, LayerLiftY, 0f);
            go.AddComponent<MeshFilter>().sharedMesh = mesh;

            var renderer = go.AddComponent<MeshRenderer>();
            renderer.sharedMaterial = LayerMaterial(materialKey, color);
            renderer.shadowCastingMode = ShadowCastingMode.Off;
            renderer.receiveShadows = false;

            if (band > 0f)
            {
                _bandedRenderers.Add(renderer);
                _bandDistances.Add(band);
            }
        }

        /// Loads a pre-authored layer material shipped under Resources. Runtime
        /// "new Material(Shader.Find(...))" produced HDRP/Unlit materials whose shader variants are
        /// not reliably present in a player build: every layer reported isVisible=true yet
        /// rasterised zero fragments. The .mat assets guarantee the shader and variants ship.
        private static Material LayerMaterial(string key, Color color)
        {
            var asset = Resources.Load<Material>("Geography/Materials/Layer_" + key);
            if (asset != null) return asset;

            Debug.LogWarning($"[TamilNaduStateMapView] layer material '{key}' not found; " +
                             "re-run the Tamil Nadu map importer to generate Resources/Geography/Materials.");
            Shader shader = Shader.Find("HDRP/Unlit") ?? Shader.Find("Unlit/Color") ?? Shader.Find("Sprites/Default");
            if (shader == null) return null;
            var material = new Material(shader) { name = "StateMapLayer_" + key };
            material.SetColor("_BaseColor", color);
            material.SetColor("_Color", color);
            if (material.HasProperty("_Cull")) material.SetFloat("_Cull", (float)UnityEngine.Rendering.CullMode.Off);
            return material;
        }

        private static Mesh BuildMarkerMesh(float size)
        {
            var mesh = new Mesh { name = "MapMarkerQuad" };
            mesh.SetVertices(new List<Vector3>
            {
                new Vector3(-size, -size, 0f), new Vector3(size, -size, 0f),
                new Vector3(size, size, 0f), new Vector3(-size, size, 0f)
            });
            mesh.SetUVs(0, new List<Vector2> { new Vector2(0, 0), new Vector2(1, 0), new Vector2(1, 1), new Vector2(0, 1) });
            mesh.SetTriangles(new[] { 0, 2, 1, 0, 3, 2 }, 0);
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            return mesh;
        }

        private static Color Color32(float r, float g, float b, float a)
        {
            return new Color(r, g, b, a);
        }

        private static string Sanitize(string name)
        {
            if (string.IsNullOrEmpty(name)) return "unnamed";
            return name.Replace(" ", "_");
        }

        private void Clear()
        {
            _bandedRenderers.Clear();
            _bandDistances.Clear();
            _placeMarkers.Clear();

            for (int i = transform.childCount - 1; i >= 0; i--)
            {
                DestroySafe(transform.GetChild(i).gameObject);
            }
            _root = null;
        }

        private static void DestroySafe(GameObject go)
        {
            if (Application.isPlaying) Destroy(go);
            else DestroyImmediate(go);
        }
    }

    public class MapLabel
    {
        public string English;
        public string Tamil;
    }

    /// <summary>Keeps a place marker facing the camera; holds both language strings.</summary>
    [ExecuteAlways]
    public class MapLabelBillboard : MonoBehaviour
    {
        private MapLabel _label;

        public void Bind(MapLabel label)
        {
            _label = label;
        }

        private void LateUpdate()
        {
            if (Camera.main == null) return;
            transform.rotation = Quaternion.LookRotation(
                transform.position - Camera.main.transform.position, Vector3.up);
        }

        public string CurrentText(bool tamil)
        {
            if (_label == null) return string.Empty;
            return tamil ? _label.Tamil : _label.English;
        }
    }
}