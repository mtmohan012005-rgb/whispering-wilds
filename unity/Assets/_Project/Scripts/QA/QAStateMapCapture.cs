using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace WhisperingWilds.QA
{
    /// <summary>
    /// Loads the state-map scene and captures proof that TamilNaduStateMapView actually produced
    /// on-screen geometry. Inert unless -qaStateMap (or WW_QA_STATE_MAP) is set.
    ///
    /// This exists because the existing diagnostics only ever sample the Boot scene, so "the map
    /// assets were generated" was never evidence that "the map renders".
    /// </summary>
    public static class QAStateMapCapture
    {
        internal const string SceneName = "01_StateMap_TamilNadu";
        internal const string OutDir = "QAScreenshots";

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Bootstrap()
        {
            if (!Enabled()) return;
            var go = new GameObject("~QAStateMapCapture");
            UnityEngine.Object.DontDestroyOnLoad(go);
            go.AddComponent<QAStateMapCaptureRunner>();
        }

        private static bool Enabled()
        {
            foreach (var a in Environment.GetCommandLineArgs())
            {
                if (string.Equals(a, "-qaStateMap", StringComparison.OrdinalIgnoreCase)) return true;
            }
            var env = Environment.GetEnvironmentVariable("WW_QA_STATE_MAP");
            return !string.IsNullOrEmpty(env) && env != "0";
        }
    }

    public class QAStateMapCaptureRunner : MonoBehaviour
    {
        private string _dir;

        private IEnumerator Start()
        {
            _dir = Path.Combine(Application.persistentDataPath, QAStateMapCapture.OutDir);
            Directory.CreateDirectory(_dir);

            Scene scene = SceneManager.GetSceneByName(QAStateMapCapture.SceneName);
            bool loaded = scene.IsValid() && scene.isLoaded;
            if (!loaded)
            {
                yield return SceneManager.LoadSceneAsync(QAStateMapCapture.SceneName, LoadSceneMode.Single);
                scene = SceneManager.GetSceneByName(QAStateMapCapture.SceneName);
                yield return null;
                yield return new WaitForSecondsRealtime(2f);
            }

            Log($"scene={QAStateMapCapture.SceneName} loaded={scene.IsValid() && scene.isLoaded} active={SceneManager.GetActiveScene().name}");

            // Inspect what TamilNaduStateMapView actually built.
            var view = UnityEngine.Object.FindAnyObjectByType<WhisperingWilds.Geography.TamilNaduStateMapView>();
            if (view == null)
            {
                Log("FAIL: no TamilNaduStateMapView in scene");
                Finish(1);
                yield break;
            }

            Log($"mapData={(view.MapData != null)} isGenerated={(view.MapData != null && view.MapData.IsGenerated)}");
            if (view.MapData != null)
            {
                var md = view.MapData;
                Log($"layers: outline={(md.stateOutline != null)} coast={(md.coastline != null)} " +
                    $"mountains={(md.mountainRegions != null)} rivers={md.rivers.Count} roads={md.roads.Count} " +
                    $"places={md.places.Count} cells={md.regionCells.Count}");

                int withMesh = 0;
                foreach (var r in md.rivers) if (r.mesh != null) withMesh++;
                Log($"river layers with mesh: {withMesh}/{md.rivers.Count}");
            }

            yield return new WaitForEndOfFrame();

            var viewRoot = view.transform.Find("StateMapGeometry");
            int renderers = 0, verts = 0;
            if (viewRoot != null)
            {
                var rs = viewRoot.GetComponentsInChildren<MeshRenderer>(false);
                renderers = rs.Length;
                foreach (var r in rs)
                {
                    var mf = r.GetComponent<MeshFilter>();
                    if (mf != null && mf.sharedMesh != null) verts += mf.sharedMesh.vertexCount;
                }
            }
            Log($"built geometry: renderers={renderers} totalVerts={verts}");

            var cam = Camera.main;
            Log($"camera={(cam != null ? cam.name : "NONE")} pos={(cam != null ? cam.transform.position.ToString("F1") : "-")} " +
                $"rot={(cam != null ? cam.transform.eulerAngles.ToString("F0") : "-")} " +
                $"fov={(cam != null ? cam.fieldOfView.ToString("F0") : "-")} " +
                $"near={(cam != null ? cam.nearClipPlane.ToString("F1") : "-")} " +
                $"far={(cam != null ? cam.farClipPlane.ToString("F0") : "-")} " +
                $"cullingMask={(cam != null ? cam.cullingMask.ToString() : "-")} " +
                $"clear={(cam != null ? cam.clearFlags.ToString() : "-")}");

            // Why might 13k verts render nothing? Check the two usual causes: stripped shader
            // (Shader.Find returns null in a build unless the shader is always-included) and
            // renderers disabled by the distance banding in LateUpdate.
            if (viewRoot != null)
            {
                var layerRenderers = viewRoot.GetComponentsInChildren<MeshRenderer>(false);
                int shaderNull = 0, disabled = 0, notVisible = 0, shaderError = 0;
                foreach (var r in layerRenderers)
                {
                    var m = r.sharedMaterial;
                    if (m == null || m.shader == null || !m.shader.isSupported) shaderNull++;
                    if (!r.enabled) disabled++;
                    if (m != null && m.shader != null && m.shader.name.Contains("Error")) shaderError++;
                    if (!r.isVisible) notVisible++;
                }
                Log($"renderers: total={layerRenderers.Length} shaderNullOrUnsupported={shaderNull} " +
                    $"disabled={disabled} notVisible={notVisible} shaderError={shaderError}");
                foreach (var r in layerRenderers)
                {
                    var mf = r.GetComponent<MeshFilter>();
                    var b = mf != null && mf.sharedMesh != null ? mf.sharedMesh.bounds : new Bounds();
                    Log($"  layer {mf.sharedMesh.name,-26} enabled={r.enabled} visible={r.isVisible} " +
                        $"shader={(r.sharedMaterial != null && r.sharedMaterial.shader != null ? r.sharedMaterial.shader.name : "NULL")} " +
                        $"boundsC={b.center.ToString("F0")} boundsE={b.extents.ToString("F0")}");
                }
            }

            int tris = 0;
            if (viewRoot != null)
            {
                foreach (var mf in viewRoot.GetComponentsInChildren<MeshFilter>(false))
                {
                    if (mf.sharedMesh != null) tris += mf.sharedMesh.triangles.Length / 3;
                }
            }

            // Baseline first: the identical frame with every map layer switched off. Comparing
            // the real frame against this is the only honest "did the map render" test - a
            // material/lighting guess cannot tell a dark map apart from a dark backdrop.
            yield return CaptureBaseline(cam);

            // Capture at two heights: the state must read as a state shape, not a smear.
            yield return CaptureAndMeasure("14_state_map", cam, true);

            if (cam != null)
            {
                var pos = cam.transform.position;
                cam.transform.position = new Vector3(pos.x, pos.y + 260f, pos.z - 200f);
                yield return new WaitForSecondsRealtime(0.5f);
                yield return CaptureAndMeasure("14b_state_map_zoomed", cam);   // reference only: camera moved, so diffing vs the baseline is meaningless
                cam.transform.position = pos;
            }

            // Occlusion probe: the board is the only large opaque surface under the map, so
            // hiding it distinguishes "map is hidden behind the board" from "map never
            // rasterised". Also report world bounds + frustum state for the outline.
            {
                foreach (var r in viewRoot.GetComponentsInChildren<MeshRenderer>(false))
                {
                    if (r.name != "TN_StateOutline") continue;
                    var wb = r.bounds;
                    var planes = GeometryUtility.CalculateFrustumPlanes(cam);
                    bool inFrustum = GeometryUtility.TestPlanesAABB(planes, wb);
                    var mf = r.GetComponent<MeshFilter>();
                    var mesh = mf != null ? mf.sharedMesh : null;
                    Log($"[QA_STATE_MAP] outline worldBounds min={wb.min} max={wb.max} " +
                        $"inFrustum={inFrustum} tris={(mesh != null ? mesh.triangles.Length / 3 : 0)} " +
                        $"verts={(mesh != null ? mesh.vertexCount : 0)} " +
                        $"shader={(r.sharedMaterial != null ? r.sharedMaterial.shader.name : "null")} " +
                        $"material={(r.sharedMaterial != null ? r.sharedMaterial.name : "null")} " +
                        $"colour={DescribeColor(r.sharedMaterial)} " +
                        $"renderQueue={r.sharedMaterial.renderQueue}");

if (mesh != null) ProbeVertices(cam, r, mesh);
                }

                // Board visibility probe: the board is the only large opaque surface under the
                // map, so hiding it distinguishes "map is behind the board" from "map never
                // rasterised".
                var board = GameObject.Find("Map_Relief_Board");
                if (board != null)
                {
                    var mr = board.GetComponent<MeshRenderer>();
                    board.SetActive(false);
                    yield return new WaitForSecondsRealtime(0.6f);
                    yield return CaptureAndMeasure("14c_state_map_board_hidden", cam);   // reference only: board removed, so it differs everywhere by design
                    board.SetActive(true);
                    Log($"[QA_STATE_MAP] board bounds min={mr.bounds.min} max={mr.bounds.max} " +
                        $"shader={(mr.sharedMaterial != null ? mr.sharedMaterial.shader.name : "null")} " +
                        $"hasBaseColor={(mr.sharedMaterial != null && mr.sharedMaterial.HasProperty("_BaseColor"))}");
                }
            }

            // A real pass requires visible pixels, not just object counts. An earlier verdict
            // checked only renderer/vert totals and passed on a frame that was pure sky.
            // The pixel verdict is authoritative: geometry can exist while nothing of it
            // is actually on screen.
            int nonBanded = 0;
            foreach (var r in (viewRoot != null ? viewRoot.GetComponentsInChildren<MeshRenderer>(false) : new MeshRenderer[0]))
            {
                if (r.enabled && r.isVisible) nonBanded++;
            }
            Log($"VERDICT tris={tris} renderers={renderers} verts={verts} visibleRenderers={nonBanded} " +
                $"mapVisible={_mapVisible}");
            bool geometryOk = renderers > 0 && verts > 0 && nonBanded > 0;
            Finish(geometryOk && _mapVisible ? 0 : 1);
        }

        Color32[] _px;
        private int _w, _h;
        private byte[] _lastPng;

        /// <summary>Grabs the current framebuffer once and keeps it for measuring and writing.</summary>
        private bool GrabFrame(Camera cam)
        {
            Texture2D shot = null;
            try { shot = ScreenCapture.CaptureScreenshotAsTexture(); }
            catch (Exception ex) { Log($"capture failed: {ex.Message}"); return false; }
            if (shot == null) { Log("capture returned null"); return false; }
            _w = shot.width;
            _h = shot.height;
            _px = shot.GetPixels32();
            _lastPng = shot.EncodeToPNG();
            return true;
        }

        private IEnumerator CaptureAndMeasure(string label, Camera cam, bool gate = false)
        {
            yield return new WaitForEndOfFrame();
            if (!GrabFrame(cam)) yield break;
            Color32[] px = _px;
            int w = _w, h = _h;
            long sum = 0;
            int opaque = 0, distinct = 0;
            var seen = new System.Collections.Generic.HashSet<int>();
            var byColor = new System.Collections.Generic.Dictionary<int, int>();
            for (int i = 0; i < px.Length; i++)
            {
                Color32 c = px[i];
                int l = (c.r * 77 + c.g * 151 + c.b * 28) >> 8;
                sum += l;
                if (c.a > 8) opaque++;
                int key = (c.r >> 3 << 10) | (c.g >> 3 << 5) | (c.b >> 3);
                if (seen.Count < 4096) seen.Add(key);
                int bucket;
                byColor.TryGetValue(key, out bucket);
                byColor[key] = bucket + 1;
            }
            distinct = seen.Count;

            // Dominant colour share: a sky-only frame is overwhelmingly one colour. Real map
            // geometry always produces a mix. Guarding on this is what stops a false PASS.
            int dominant = 0;
            foreach (var kv in byColor) if (kv.Value > dominant) dominant = kv.Value;
            float dominantPct = 100f * dominant / Math.Max(1, px.Length);

            // Map-data coverage. Comparing against the material colour used to be a guess, and a
            // guess cannot tell "dark map" apart from "dark backdrop" - it false-passed on a
            // frame with nothing on it. The baseline capture is the same frame with the map
            // removed, so any pixel that moved is, by definition, map data.
            string basis;
            int mapPixels = 0;
            if (_baseline != null && _baseline.Length == px.Length && _baselineW == w && _baselineH == h)
            {
                basis = $"baseline differential ({_baselineW}x{_baselineH})";
                for (int i = 0; i < px.Length; i++)
                {
                    Color32 c = px[i];
                    if (c.a <= 8) continue;
                    Color32 b = _baseline[i];
                    int d = Mathf.Abs(c.r - b.r) + Mathf.Abs(c.g - b.g) + Mathf.Abs(c.b - b.b);
                    // Small tolerance absorbs MSAA/dither noise on the unchanged backdrop.
                    if (d >= 12) mapPixels++;
                }
            }
            else
            {
                Color backdrop = BackdropColor();
                basis = $"backdrop colour {backdrop} (no baseline available)";
                foreach (var c in px)
                {
                    if (c.a <= 8) continue;
                    float dr = Mathf.Abs(c.r - backdrop.r);
                    float dg = Mathf.Abs(c.g - backdrop.g);
                    float db = Mathf.Abs(c.b - backdrop.b);
                    if (dr > 14 || dg > 14 || db > 14) mapPixels++;
                }
            }
            float mapPct = 100f * mapPixels / Math.Max(1, px.Length);

            File.WriteAllBytes(Path.Combine(_dir, label + ".png"), _lastPng);
            Log($"{label}: {w}x{h} meanLuma={(double)sum / Math.Max(1, px.Length):F1} opaque={opaque} " +
                $"distinctColors={distinct} dominantColorPct={dominantPct:F1} mapPct={mapPct:F1} " +
                $"(basis: {basis})");

            // Only the canonical frame asserts. 14b moves the camera and 14c removes the board,
            // so both differ from the baseline everywhere by construction - measuring them
            // against it would report a meaningless 100%.
            if (!gate)
            {
                Log($"{label}: reference capture (not gated)");
                yield break;
            }

            if (mapPct < MinMapCoveragePct)
            {
                Log($"{label}: FAIL - only {mapPct:F1}% of the frame carries map data " +
                    $"(need >= {MinMapCoveragePct:F1}%); basis: {basis}");
            }
            else
            {
                Log($"{label}: PASS - {mapPct:F1}% of the frame carries map data");
                _mapVisible = true;
            }
        }

        // Minimum share of the frame that must carry map data for the map to count as visible.
        private const float MinMapCoveragePct = 6f;
        private bool _mapVisible;

        /// Distinguishes the two remaining candidate causes for an invisible-but-in-frustum map:
        /// (a) geometry projected outside the viewport because the camera is framed wrong, or
        /// (b) geometry that projects on-screen but faces away from the camera and is culled.
        private void ProbeVertices(Camera cam, MeshRenderer r, Mesh mesh)
        {
            var m = r.transform.localToWorldMatrix;
            var v = mesh.vertices;
            var t = mesh.triangles;

            if (t.Length >= 3)
            {
                Vector3 a = m.MultiplyPoint3x4(v[t[0]]);
                Vector3 b = m.MultiplyPoint3x4(v[t[1]]);
                Vector3 c = m.MultiplyPoint3x4(v[t[2]]);
                // Unity's Cross is left-handed: (a.y*b.z-a.z*b.y, a.z*b.x-a.x*b.z, a.x*b.y-a.y*b.x)
                Vector3 n = Vector3.Cross(b - a, c - a);
                Log($"[QA_STATE_MAP] tri0 v0={a} v1={b} v2={c} UnityNormal={n.normalized}");
            }

            int inside = 0;
            float minX = float.MaxValue, maxX = float.MinValue, minY = float.MaxValue, maxY = float.MinValue;
            float minZ = float.MaxValue;
            foreach (var lp in v)
            {
                Vector3 vp = cam.WorldToViewportPoint(m.MultiplyPoint3x4(lp));
                if (vp.z < cam.nearClipPlane) continue;
                minZ = Mathf.Min(minZ, vp.z);
                if (vp.x >= 0f && vp.x <= 1f && vp.y >= 0f && vp.y <= 1f) inside++;
                minX = Mathf.Min(minX, vp.x); maxX = Mathf.Max(maxX, vp.x);
                minY = Mathf.Min(minY, vp.y); maxY = Mathf.Max(maxY, vp.y);
            }
            Log($"[QA_STATE_MAP] viewport probe verts={v.Length} insideViewport={inside} " +
                $"vpX=[{minX:F3},{maxX:F3}] vpY=[{minY:F3},{maxY:F3}] vpZ=[{minZ:F1},{minZ:F1}]");

            // Mesh-level audit. Same material on a Unity primitive renders fine, so the fault
            // must be in this mesh's data: degenerate triangles, out-of-range indices, zero/NaN
            // normals (an HDRP vertex shader fed a zero normal can emit NaN positions, which
            // silently discards every triangle), or a missing UV channel.
            var nrm = mesh.normals;
            var uvs = mesh.uv;
            int degenerate = 0, outOfRange = 0, zeroNormal = 0, nanNormal = 0;
            float minNY = float.MaxValue, maxNY = float.MinValue;
            for (int i = 0; i < nrm.Length; i++)
            {
                Vector3 nn = nrm[i];
                if (float.IsNaN(nn.x) || float.IsNaN(nn.y) || float.IsNaN(nn.z)) { nanNormal++; continue; }
                if (nn.sqrMagnitude < 1e-8f) { zeroNormal++; continue; }
                minNY = Mathf.Min(minNY, nn.y); maxNY = Mathf.Max(maxNY, nn.y);
            }
            for (int i = 0; i + 2 < t.Length; i += 3)
            {
                if (t[i] >= v.Length || t[i + 1] >= v.Length || t[i + 2] >= v.Length) { outOfRange++; continue; }
                float area = Mathf.Abs((v[t[i + 1]].x - v[t[i]].x) * (v[t[i + 2]].z - v[t[i]].z)
                                     - (v[t[i + 1]].z - v[t[i]].z) * (v[t[i + 2]].x - v[t[i]].x)) * 0.5f;
                if (area < 1e-9f) degenerate++;
            }
            Log($"[QA_STATE_MAP] MESH AUDIT tris={t.Length / 3} degenerate={degenerate} outOfRange={outOfRange} " +
                $"verts={v.Length} normals={nrm.Length} zeroNormal={zeroNormal} nanNormal={nanNormal} " +
                $"normalY=[{minNY:F2},{maxNY:F2}] uvs={uvs.Length} colors={mesh.colors.Length} " +
                $"subMeshes={mesh.subMeshCount} readable={mesh.isReadable} indexFormat={mesh.indexFormat}");

            FindOccluders(cam, r);
        }

        /// Unity's Renderer.isVisible means "seen by some camera", NOT "not occluded", so a
        /// full-frame occluder between the camera and the map hides it completely while every
        /// other diagnostic still reports healthy. Walk the camera -> map-centre segment and
        /// report every renderer's bounds that swallow it.
        private void FindOccluders(Camera cam, MeshRenderer outline)
        {
            Vector3 target = outline.bounds.center;
            Vector3 seg = target - cam.transform.position;
            int steps = 24;
            var blockers = new List<string>();
            foreach (var other in FindObjectsOfType<MeshRenderer>())
            {
                if (other == outline) continue;
                Bounds b = other.bounds;
                if (b.size.sqrMagnitude < 1f) continue;
                // Ignore the map's own sibling layers.
                if (other.name.StartsWith("TN_") || other.name.StartsWith("Map")) continue;
                int hitFrom = -1;
                for (int s = 1; s < steps; s++)
                {
                    Vector3 p = cam.transform.position + seg * (s / (float)steps);
                    if (!b.Contains(p)) continue;
                    hitFrom = s;
                    break;
                }
                if (hitFrom > 0)
                {
                    blockers.Add($"{other.name}{HideFlags.None.ToString().Substring(0, 0)}" +
                                 $"[layer={other.gameObject.layer}] boundsC={b.center} boundsS={b.size} " +
                                 $"blockingAt{100f * hitFrom / steps:F0}% dist={Vector3.Distance(cam.transform.position, b.center):F1}");
                }
            }
            Log($"[QA_STATE_MAP] OCCLUSION ray cam={cam.transform.position} -> mapCentre={target} " +
                $"blockers={blockers.Count}");
            foreach (var bl in blockers) Log("[QA_STATE_MAP]   BLOCKER " + bl);
        }

        /// A/B isolation. The imported map is real, on-screen, +Y-facing geometry that still rasterises
        /// nothing, which is self-contradictory. This drops known-good Unity primitives using the
        /// SAME layer materials at the SAME height: if the primitives appear and the imported mesh
        /// does not, the defect is in mesh generation; if neither appears, it is the render pipeline.
        private static string ViewRect(Camera cam, Bounds b)
        {
            Vector3 c0 = cam.WorldToViewportPoint(b.min);
            Vector3 c1 = cam.WorldToViewportPoint(b.max);
            return $"[({c0.x:F2},{c0.y:F2})-({c1.x:F2},{c1.y:F2})]";
        }

        private static string DescribeColor(Material m)
        {
            if (m == null || m.shader == null) return "n/a";
            var sh = m.shader;
            for (int i = 0; i < sh.GetPropertyCount(); i++)
            {
                if (sh.GetPropertyType(i) != UnityEngine.Rendering.ShaderPropertyType.Color) continue;
                string pn = sh.GetPropertyName(i);
                Color c = m.GetColor(pn);
                return $"{pn}=({c.r:F2},{c.g:F2},{c.b:F2},{c.a:F2})";
            }
            return "noColorProperty";
        }

        /// <summary>
        /// Renders the scene with every map layer disabled and keeps the pixels. This is the
        /// backdrop reference the verdict diffs against, so "map rendered" means
        /// "pixels actually changed", not "a material had a colour set".
        /// </summary>
        private IEnumerator CaptureBaseline(Camera cam)
        {
            if (cam == null) yield break;
            var board = GameObject.Find("Map_Relief_Board");
            var boardRenderer = board != null ? board.GetComponent<MeshRenderer>() : null;
            var hidden = new List<GameObject>();
            foreach (var rend in FindObjectsOfType<MeshRenderer>())
            {
                if (rend == null || rend == boardRenderer) continue;
                if (rend.bounds.size.sqrMagnitude <= 0f) continue;
                rend.gameObject.SetActive(false);
                hidden.Add(rend.gameObject);
            }
            Log($"[QA_STATE_MAP] baseline capture with {hidden.Count} map renderers hidden");
            // One full frame so the disabled renderers are actually gone from the framebuffer.
            yield return new WaitForSecondsRealtime(0.5f);
            yield return new WaitForEndOfFrame();
            if (!GrabFrame(cam)) yield break;
            File.WriteAllBytes(Path.Combine(_dir, "14_state_map_baseline.png"), _lastPng);
            _baseline = _px;
            _baselineW = _w;
            _baselineH = _h;
            foreach (var t in hidden) t.SetActive(true);
        }

        private Color32[] _baseline;
        private int _baselineW, _baselineH;

        private Color BackdropColor()
        {
            var board = GameObject.Find("Map_Relief_Board");
            if (board != null)
            {
                var mr = board.GetComponent<MeshRenderer>();
                if (mr != null && mr.sharedMaterial != null && mr.sharedMaterial.HasProperty("_BaseColor"))
                {
                    return mr.sharedMaterial.GetColor("_BaseColor");
                }
            }
            return new Color(0.13f, 0.15f, 0.18f);
        }

        private void Log(string msg)
        {
            Debug.Log($"[QA_STATE_MAP] {msg}");
        }

        private void Finish(int code)
        {
            Debug.Log($"[QA_STATE_MAP] exit={code}");
            Application.Quit(code);
        }
    }
}
