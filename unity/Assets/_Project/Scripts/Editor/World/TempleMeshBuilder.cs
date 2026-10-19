using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;

namespace WhisperingWilds.Editor
{
    /// <summary>
    /// Deterministic Editor mesh-generation utility for ancient Tamil Nadu temple architecture.
    /// Creates carved granite slabs, circular puzzle dials, sanctum door leaves, and the
    /// Kaveri Star Seal medallion with stable GUIDs and proper PBR normals and UVs.
    /// </summary>
    public static class TempleMeshBuilder
    {
        private const string MeshRoot = "Assets/_Project/Art/Meshes/Temple";

        /// <summary>
        /// Generates or loads a beveled stone slab mesh.
        /// </summary>
        public static Mesh GetOrCreateBeveledSlabMesh(string assetPath, float width, float height, float depth, float bevel)
        {
            if (string.IsNullOrEmpty(assetPath)) assetPath = $"{MeshRoot}/BeveledSlab_{width}x{height}x{depth}.asset";
            EnsureFolder(Path.GetDirectoryName(assetPath));

            var existing = AssetDatabase.LoadAssetAtPath<Mesh>(assetPath);
            if (existing != null) return existing;

            Mesh mesh = new Mesh { name = Path.GetFileNameWithoutExtension(assetPath) };

            float hw = width * 0.5f;
            float hh = height * 0.5f;
            float hd = depth * 0.5f;
            float b = Mathf.Min(bevel, Mathf.Min(hw, Mathf.Min(hh, hd)) * 0.4f);

            List<Vector3> verts = new List<Vector3>();
            List<Vector3> norms = new List<Vector3>();
            List<Vector2> uvs = new List<Vector2>();
            List<int> tris = new List<int>();

            void AddQuad(Vector3 v0, Vector3 v1, Vector3 v2, Vector3 v3, Vector3 normal)
            {
                int baseIdx = verts.Count;
                verts.Add(v0); verts.Add(v1); verts.Add(v2); verts.Add(v3);
                norms.Add(normal); norms.Add(normal); norms.Add(normal); norms.Add(normal);
                uvs.Add(new Vector2(0f, 0f));
                uvs.Add(new Vector2(1f, 0f));
                uvs.Add(new Vector2(1f, 1f));
                uvs.Add(new Vector2(0f, 1f));

                tris.Add(baseIdx + 0);
                tris.Add(baseIdx + 2);
                tris.Add(baseIdx + 1);
                tris.Add(baseIdx + 0);
                tris.Add(baseIdx + 3);
                tris.Add(baseIdx + 2);
            }

            // Front face (Z = +hd) with beveled border
            AddQuad(new Vector3(-hw + b, -hh + b, hd), new Vector3(hw - b, -hh + b, hd),
                    new Vector3(hw - b, hh - b, hd), new Vector3(-hw + b, hh - b, hd), Vector3.forward);

            // Back face (Z = -hd)
            AddQuad(new Vector3(hw - b, -hh + b, -hd), new Vector3(-hw + b, -hh + b, -hd),
                    new Vector3(-hw + b, hh - b, -hd), new Vector3(hw - b, hh - b, -hd), Vector3.back);

            // Left face (X = -hw)
            AddQuad(new Vector3(-hw, -hh + b, -hd + b), new Vector3(-hw, -hh + b, hd - b),
                    new Vector3(-hw, hh - b, hd - b), new Vector3(-hw, hh - b, -hd + b), Vector3.left);

            // Right face (X = +hw)
            AddQuad(new Vector3(hw, -hh + b, hd - b), new Vector3(hw, -hh + b, -hd + b),
                    new Vector3(hw, hh - b, -hd + b), new Vector3(hw, hh - b, hd - b), Vector3.right);

            // Top face (Y = +hh)
            AddQuad(new Vector3(-hw + b, hh, -hd + b), new Vector3(-hw + b, hh, hd - b),
                    new Vector3(hw - b, hh, hd - b), new Vector3(hw - b, hh, -hd + b), Vector3.up);

            // Bottom face (Y = -hh)
            AddQuad(new Vector3(-hw + b, -hh, hd - b), new Vector3(-hw + b, -hh, -hd + b),
                    new Vector3(hw - b, -hh, -hd + b), new Vector3(hw - b, -hh, hd - b), Vector3.down);

            // Front chamfer edges
            // Top front
            AddQuad(new Vector3(-hw + b, hh - b, hd), new Vector3(hw - b, hh - b, hd),
                    new Vector3(hw - b, hh, hd - b), new Vector3(-hw + b, hh, hd - b),
                    (Vector3.forward + Vector3.up).normalized);
            // Bottom front
            AddQuad(new Vector3(hw - b, -hh + b, hd), new Vector3(-hw + b, -hh + b, hd),
                    new Vector3(-hw + b, -hh, hd - b), new Vector3(hw - b, -hh, hd - b),
                    (Vector3.forward + Vector3.down).normalized);
            // Left front
            AddQuad(new Vector3(-hw, -hh + b, hd - b), new Vector3(-hw, hh - b, hd - b),
                    new Vector3(-hw + b, hh - b, hd), new Vector3(-hw + b, -hh + b, hd),
                    (Vector3.forward + Vector3.left).normalized);
            // Right front
            AddQuad(new Vector3(hw - b, -hh + b, hd), new Vector3(hw - b, hh - b, hd),
                    new Vector3(hw, hh - b, hd - b), new Vector3(hw, -hh + b, hd - b),
                    (Vector3.forward + Vector3.right).normalized);

            mesh.SetVertices(verts);
            mesh.SetNormals(norms);
            mesh.SetUVs(0, uvs);
            mesh.SetTriangles(tris, 0);
            mesh.RecalculateBounds();
            mesh.RecalculateTangents();

            AssetDatabase.CreateAsset(mesh, assetPath);
            return mesh;
        }

        /// <summary>
        /// Generates or loads a carved circular stone dial mesh with radial position notches for mechanisms.
        /// </summary>
        public static Mesh GetOrCreateCarvedStoneDialMesh(string assetPath, float radius, float thickness, int segments = 24)
        {
            if (string.IsNullOrEmpty(assetPath)) assetPath = $"{MeshRoot}/CarvedStoneDial_R{radius}.asset";
            EnsureFolder(Path.GetDirectoryName(assetPath));

            var existing = AssetDatabase.LoadAssetAtPath<Mesh>(assetPath);
            if (existing != null) return existing;

            Mesh mesh = new Mesh { name = Path.GetFileNameWithoutExtension(assetPath) };

            List<Vector3> verts = new List<Vector3>();
            List<Vector3> norms = new List<Vector3>();
            List<Vector2> uvs = new List<Vector2>();
            List<int> tris = new List<int>();

            float halfH = thickness * 0.5f;

            // Center top
            int topCenterIdx = verts.Count;
            verts.Add(new Vector3(0, halfH, 0));
            norms.Add(Vector3.up);
            uvs.Add(new Vector2(0.5f, 0.5f));

            // Top rim vertices with slight bevel
            int topRimStart = verts.Count;
            for (int i = 0; i <= segments; i++)
            {
                float angle = (i % segments) * Mathf.PI * 2f / segments;
                float x = Mathf.Cos(angle) * (radius * 0.95f);
                float z = Mathf.Sin(angle) * (radius * 0.95f);
                verts.Add(new Vector3(x, halfH, z));
                norms.Add(Vector3.up);
                uvs.Add(new Vector2(0.5f + Mathf.Cos(angle) * 0.45f, 0.5f + Mathf.Sin(angle) * 0.45f));
            }

            for (int i = 0; i < segments; i++)
            {
                tris.Add(topCenterIdx);
                tris.Add(topRimStart + i);
                tris.Add(topRimStart + i + 1);
            }

            // Cylinder side wall
            for (int i = 0; i < segments; i++)
            {
                float a0 = i * Mathf.PI * 2f / segments;
                float a1 = (i + 1) * Mathf.PI * 2f / segments;

                Vector3 p0Top = new Vector3(Mathf.Cos(a0) * radius, halfH, Mathf.Sin(a0) * radius);
                Vector3 p1Top = new Vector3(Mathf.Cos(a1) * radius, halfH, Mathf.Sin(a1) * radius);
                Vector3 p0Bot = new Vector3(Mathf.Cos(a0) * radius, -halfH, Mathf.Sin(a0) * radius);
                Vector3 p1Bot = new Vector3(Mathf.Cos(a1) * radius, -halfH, Mathf.Sin(a1) * radius);

                Vector3 n0 = new Vector3(Mathf.Cos(a0), 0, Mathf.Sin(a0));
                Vector3 n1 = new Vector3(Mathf.Cos(a1), 0, Mathf.Sin(a1));

                int bIdx = verts.Count;
                verts.Add(p0Top); verts.Add(p1Top); verts.Add(p1Bot); verts.Add(p0Bot);
                norms.Add(n0); norms.Add(n1); norms.Add(n1); norms.Add(n0);
                uvs.Add(new Vector2((float)i / segments, 1f));
                uvs.Add(new Vector2((float)(i + 1) / segments, 1f));
                uvs.Add(new Vector2((float)(i + 1) / segments, 0f));
                uvs.Add(new Vector2((float)i / segments, 0f));

                tris.Add(bIdx + 0); tris.Add(bIdx + 1); tris.Add(bIdx + 2);
                tris.Add(bIdx + 0); tris.Add(bIdx + 2); tris.Add(bIdx + 3);
            }

            // Bottom disc
            int botCenterIdx = verts.Count;
            verts.Add(new Vector3(0, -halfH, 0));
            norms.Add(Vector3.down);
            uvs.Add(new Vector2(0.5f, 0.5f));

            int botRimStart = verts.Count;
            for (int i = 0; i <= segments; i++)
            {
                float angle = (i % segments) * Mathf.PI * 2f / segments;
                float x = Mathf.Cos(angle) * radius;
                float z = Mathf.Sin(angle) * radius;
                verts.Add(new Vector3(x, -halfH, z));
                norms.Add(Vector3.down);
                uvs.Add(new Vector2(0.5f + Mathf.Cos(angle) * 0.45f, 0.5f + Mathf.Sin(angle) * 0.45f));
            }

            for (int i = 0; i < segments; i++)
            {
                tris.Add(botCenterIdx);
                tris.Add(botRimStart + i + 1);
                tris.Add(botRimStart + i);
            }

            mesh.SetVertices(verts);
            mesh.SetNormals(norms);
            mesh.SetUVs(0, uvs);
            mesh.SetTriangles(tris, 0);
            mesh.RecalculateBounds();
            mesh.RecalculateTangents();

            AssetDatabase.CreateAsset(mesh, assetPath);
            return mesh;
        }

        /// <summary>
        /// Generates the Kaveri Star Seal medallion mesh: an 8-pointed stellar ceremonial seal
        /// representing the celestial constellation of the Kaveri river with faceted relief rays.
        /// </summary>
        public static Mesh GetOrCreateStarSealMesh(string assetPath, int points = 8, float outerRadius = 0.45f, float innerRadius = 0.25f, float thickness = 0.10f)
        {
            if (string.IsNullOrEmpty(assetPath)) assetPath = $"{MeshRoot}/KaveriStarSealMedallion.asset";
            EnsureFolder(Path.GetDirectoryName(assetPath));

            var existing = AssetDatabase.LoadAssetAtPath<Mesh>(assetPath);
            if (existing != null) return existing;

            Mesh mesh = new Mesh { name = Path.GetFileNameWithoutExtension(assetPath) };

            List<Vector3> verts = new List<Vector3>();
            List<Vector3> norms = new List<Vector3>();
            List<Vector2> uvs = new List<Vector2>();
            List<int> tris = new List<int>();

            int totalTips = points * 2;
            float step = Mathf.PI * 2f / totalTips;
            float topApexY = thickness * 0.6f;
            float botApexY = -thickness * 0.6f;

            // Top apex
            int topApex = verts.Count;
            verts.Add(new Vector3(0, topApexY, 0));
            norms.Add(Vector3.up);
            uvs.Add(new Vector2(0.5f, 0.5f));

            // Perimeter vertices for top half
            int topPerimStart = verts.Count;
            for (int i = 0; i < totalTips; i++)
            {
                float r = (i % 2 == 0) ? outerRadius : innerRadius;
                float angle = i * step;
                float x = Mathf.Cos(angle) * r;
                float z = Mathf.Sin(angle) * r;

                Vector3 pos = new Vector3(x, 0f, z);
                Vector3 normal = Vector3.Cross(
                    new Vector3(Mathf.Cos(angle + step) * ((i + 1) % 2 == 0 ? outerRadius : innerRadius) - x, 0,
                                Mathf.Sin(angle + step) * ((i + 1) % 2 == 0 ? outerRadius : innerRadius) - z),
                    new Vector3(0, topApexY, 0) - pos
                ).normalized;

                verts.Add(pos);
                norms.Add(normal == Vector3.zero ? Vector3.up : normal);
                uvs.Add(new Vector2(0.5f + Mathf.Cos(angle) * 0.48f, 0.5f + Mathf.Sin(angle) * 0.48f));
            }

            for (int i = 0; i < totalTips; i++)
            {
                int next = (i + 1) % totalTips;
                tris.Add(topApex);
                tris.Add(topPerimStart + i);
                tris.Add(topPerimStart + next);
            }

            // Bottom apex
            int botApex = verts.Count;
            verts.Add(new Vector3(0, botApexY, 0));
            norms.Add(Vector3.down);
            uvs.Add(new Vector2(0.5f, 0.5f));

            int botPerimStart = verts.Count;
            for (int i = 0; i < totalTips; i++)
            {
                float r = (i % 2 == 0) ? outerRadius : innerRadius;
                float angle = i * step;
                float x = Mathf.Cos(angle) * r;
                float z = Mathf.Sin(angle) * r;

                verts.Add(new Vector3(x, 0f, z));
                norms.Add(Vector3.down);
                uvs.Add(new Vector2(0.5f + Mathf.Cos(angle) * 0.48f, 0.5f + Mathf.Sin(angle) * 0.48f));
            }

            for (int i = 0; i < totalTips; i++)
            {
                int next = (i + 1) % totalTips;
                tris.Add(botApex);
                tris.Add(botPerimStart + next);
                tris.Add(botPerimStart + i);
            }

            mesh.SetVertices(verts);
            mesh.SetNormals(norms);
            mesh.SetUVs(0, uvs);
            mesh.SetTriangles(tris, 0);
            mesh.RecalculateBounds();
            mesh.RecalculateTangents();

            AssetDatabase.CreateAsset(mesh, assetPath);
            return mesh;
        }

        /// <summary>
        /// Generates a carved Dravidian temple door leaf with panel borders and relief bevels.
        /// </summary>
        public static Mesh GetOrCreateDoorLeafMesh(string assetPath, float width, float height, float thickness)
        {
            if (string.IsNullOrEmpty(assetPath)) assetPath = $"{MeshRoot}/TempleDoorLeaf_{width}x{height}.asset";
            EnsureFolder(Path.GetDirectoryName(assetPath));

            var existing = AssetDatabase.LoadAssetAtPath<Mesh>(assetPath);
            if (existing != null) return existing;

            Mesh mesh = new Mesh { name = Path.GetFileNameWithoutExtension(assetPath) };

            float hw = width * 0.5f;
            float hh = height * 0.5f;
            float hd = thickness * 0.5f;
            float frame = 0.22f; // outer frame width
            float panelDepth = 0.05f; // recessed relief panel depth

            List<Vector3> verts = new List<Vector3>();
            List<Vector3> norms = new List<Vector3>();
            List<Vector2> uvs = new List<Vector2>();
            List<int> tris = new List<int>();

            void AddQuad(Vector3 v0, Vector3 v1, Vector3 v2, Vector3 v3, Vector3 n)
            {
                int idx = verts.Count;
                verts.Add(v0); verts.Add(v1); verts.Add(v2); verts.Add(v3);
                norms.Add(n); norms.Add(n); norms.Add(n); norms.Add(n);
                uvs.Add(new Vector2(0f, 0f));
                uvs.Add(new Vector2(1f, 0f));
                uvs.Add(new Vector2(1f, 1f));
                uvs.Add(new Vector2(0f, 1f));

                tris.Add(idx + 0); tris.Add(idx + 2); tris.Add(idx + 1);
                tris.Add(idx + 0); tris.Add(idx + 3); tris.Add(idx + 2);
            }

            // Back face (flat)
            AddQuad(new Vector3(hw, -hh, -hd), new Vector3(-hw, -hh, -hd),
                    new Vector3(-hw, hh, -hd), new Vector3(hw, hh, -hd), Vector3.back);

            // Left side
            AddQuad(new Vector3(-hw, -hh, -hd), new Vector3(-hw, -hh, hd),
                    new Vector3(-hw, hh, hd), new Vector3(-hw, hh, -hd), Vector3.left);

            // Right side
            AddQuad(new Vector3(hw, -hh, hd), new Vector3(hw, -hh, -hd),
                    new Vector3(hw, hh, -hd), new Vector3(hw, hh, hd), Vector3.right);

            // Top
            AddQuad(new Vector3(-hw, hh, -hd), new Vector3(-hw, hh, hd),
                    new Vector3(hw, hh, hd), new Vector3(hw, hh, -hd), Vector3.up);

            // Bottom
            AddQuad(new Vector3(-hw, -hh, hd), new Vector3(-hw, -hh, -hd),
                    new Vector3(hw, -hh, -hd), new Vector3(hw, -hh, hd), Vector3.down);

            // Front face stiles and rails (raised frame)
            // Left stile
            AddQuad(new Vector3(-hw, -hh, hd), new Vector3(-hw + frame, -hh, hd),
                    new Vector3(-hw + frame, hh, hd), new Vector3(-hw, hh, hd), Vector3.forward);
            // Right stile
            AddQuad(new Vector3(hw - frame, -hh, hd), new Vector3(hw, -hh, hd),
                    new Vector3(hw, hh, hd), new Vector3(hw - frame, hh, hd), Vector3.forward);
            // Top rail
            AddQuad(new Vector3(-hw + frame, hh - frame, hd), new Vector3(hw - frame, hh - frame, hd),
                    new Vector3(hw - frame, hh, hd), new Vector3(-hw + frame, hh, hd), Vector3.forward);
            // Bottom rail
            AddQuad(new Vector3(-hw + frame, -hh, hd), new Vector3(hw - frame, -hh, hd),
                    new Vector3(hw - frame, -hh + frame, hd), new Vector3(-hw + frame, -hh + frame, hd), Vector3.forward);
            // Middle mullion / center rail
            float midY = 0f;
            float midH = 0.15f;
            AddQuad(new Vector3(-hw + frame, midY - midH, hd), new Vector3(hw - frame, midY - midH, hd),
                    new Vector3(hw - frame, midY + midH, hd), new Vector3(-hw + frame, midY + midH, hd), Vector3.forward);

            // Recessed upper panel (Z = hd - panelDepth)
            AddQuad(new Vector3(-hw + frame, midY + midH, hd - panelDepth),
                    new Vector3(hw - frame, midY + midH, hd - panelDepth),
                    new Vector3(hw - frame, hh - frame, hd - panelDepth),
                    new Vector3(-hw + frame, hh - frame, hd - panelDepth), Vector3.forward);

            // Recessed lower panel (Z = hd - panelDepth)
            AddQuad(new Vector3(-hw + frame, -hh + frame, hd - panelDepth),
                    new Vector3(hw - frame, -hh + frame, hd - panelDepth),
                    new Vector3(hw - frame, midY - midH, hd - panelDepth),
                    new Vector3(-hw + frame, midY - midH, hd - panelDepth), Vector3.forward);

            mesh.SetVertices(verts);
            mesh.SetNormals(norms);
            mesh.SetUVs(0, uvs);
            mesh.SetTriangles(tris, 0);
            mesh.RecalculateBounds();
            mesh.RecalculateTangents();

            AssetDatabase.CreateAsset(mesh, assetPath);
            return mesh;
        }

        private static void EnsureFolder(string folder)
        {
            if (string.IsNullOrEmpty(folder)) return;
            folder = folder.Replace('\\', '/');
            if (!folder.StartsWith("Assets")) return;
            if (AssetDatabase.IsValidFolder(folder)) return;

            string[] parts = folder.Split('/');
            string current = parts[0];
            for (int i = 1; i < parts.Length; i++)
            {
                string next = current + "/" + parts[i];
                if (!AssetDatabase.IsValidFolder(next))
                {
                    AssetDatabase.CreateFolder(current, parts[i]);
                }
                current = next;
            }
        }
    }
}
