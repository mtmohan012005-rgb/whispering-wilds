using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.Editor.Characters
{
    /// <summary>
    /// Minimal part-based mesh assembler used by the character factory. Parts are generated in
    /// local space, optionally rotated, then translated into the character's authoring space.
    /// Triangles are accumulated per sub-mesh so one <c>SkinnedMeshRenderer</c> can carry
    /// several materials (skin / facial features / hair) while every vertex carries a single
    /// dominant bone weight.
    /// </summary>
    public sealed class MeshBuilder
    {
        public readonly List<Vector3> Verts = new List<Vector3>();
        public readonly List<Vector2> Uvs = new List<Vector2>();
        public readonly List<BoneWeight> Weights = new List<BoneWeight>();
        public readonly List<List<int>> SubmeshTris = new List<List<int>>();
        public int BoneCount { get; private set; }

        public void EnsureSubmesh(int submesh)
        {
            while (SubmeshTris.Count <= submesh) SubmeshTris.Add(new List<int>());
        }

        public void Append(MeshBuilderPart part, int boneIndex, int submesh)
        {
            EnsureSubmesh(submesh);
            int baseV = Verts.Count;
            for (int i = 0; i < part.Positions.Length; i++)
            {
                Verts.Add(part.Positions[i]);
                Uvs.Add(part.Uvs[i]);
                Weights.Add(new BoneWeight { boneIndex0 = boneIndex, weight0 = 1f, boneIndex1 = 0, weight1 = 0f, boneIndex2 = 0, weight2 = 0f, boneIndex3 = 0, weight3 = 0f });
            }
            for (int i = 0; i < part.Tris.Length; i++)
            {
                SubmeshTris[submesh].Add(baseV + part.Tris[i]);
            }
            if (boneIndex >= BoneCount) BoneCount = boneIndex + 1;
        }

        public void AppendWeighted(MeshBuilderPart part, int[] vertexBoneIndex, int submesh)
        {
            EnsureSubmesh(submesh);
            int baseV = Verts.Count;
            for (int i = 0; i < part.Positions.Length; i++)
            {
                Verts.Add(part.Positions[i]);
                Uvs.Add(part.Uvs[i]);
                int b = vertexBoneIndex[i];
                Weights.Add(new BoneWeight { boneIndex0 = b, weight0 = 1f, boneIndex1 = 0, weight1 = 0f, boneIndex2 = 0, weight2 = 0f, boneIndex3 = 0, weight3 = 0f });
                if (b >= BoneCount) BoneCount = b + 1;
            }
            for (int i = 0; i < part.Tris.Length; i++)
            {
                SubmeshTris[submesh].Add(baseV + part.Tris[i]);
            }
        }

        public Mesh Finalize(string name)
        {
            var mesh = new Mesh { name = name };
            mesh.SetVertices(Verts);
            mesh.SetUVs(0, Uvs);
            mesh.subMeshCount = SubmeshTris.Count;
            for (int i = 0; i < SubmeshTris.Count; i++) mesh.SetTriangles(SubmeshTris[i], i);
            mesh.boneWeights = Weights.ToArray();
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            mesh.RecalculateTangents();
            return mesh;
        }
    }

    /// <summary>Pre-transformed geometry fragment in the authoring coordinate space.</summary>
    public sealed class MeshBuilderPart
    {
        public Vector3[] Positions;
        public Vector2[] Uvs;
        public int[] Tris;
    }

    /// <summary>Primitive generators used to build humanoid parts from simple shapes.</summary>
    public static class PartFactory
    {
        private static MeshBuilderPart Box(Vector3 size, Quaternion rot)
        {
            var uv = new Vector2[]
            {
                new Vector2(0, 0), new Vector2(0, 1), new Vector2(1, 1), new Vector2(1, 0),
                new Vector2(0, 0), new Vector2(0, 1), new Vector2(1, 1), new Vector2(1, 0),
            };
            Vector3 ext = size * 0.5f;
            var p = new Vector3[]
            {
                new Vector3(-ext.x, -ext.y, -ext.z), new Vector3(-ext.x,  ext.y, -ext.z),
                new Vector3( ext.x,  ext.y, -ext.z), new Vector3( ext.x, -ext.y, -ext.z),
                new Vector3(-ext.x, -ext.y,  ext.z), new Vector3(-ext.x,  ext.y,  ext.z),
                new Vector3( ext.x,  ext.y,  ext.z), new Vector3( ext.x, -ext.y,  ext.z),
            };
            var t = new int[]
            {
                0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 3, 7, 4, 3, 4, 0,
                1, 5, 6, 1, 6, 2, 0, 4, 5, 0, 5, 1, 2, 6, 7, 2, 7, 3,
            };
            return Part(p, uv, t, rot);
        }

        private static Vector3[] CircleRing(float radius, int sides)
        {
            var ring = new Vector3[sides];
            for (int i = 0; i < sides; i++)
            {
                float a = (i * Mathf.PI * 2f) / sides;
                ring[i] = new Vector3(Mathf.Cos(a) * radius, 0f, Mathf.Sin(a) * radius);
            }
            return ring;
        }

        /// <summary>Cylinder along Y with user vertex count; optionally two caps.</summary>
        private static MeshBuilderPart CylinderY(float radius, float length, int sides, bool caps, Quaternion rot)
        {
            var ring = CircleRing(radius, sides);
            var p = new List<Vector3>();
            var uv = new List<Vector2>();
            var t = new List<int>();

            int topIdx = -1, botIdx = -1;
            if (caps)
            {
                topIdx = p.Count; p.Add(new Vector3(0f, length * 0.5f, 0f)); uv.Add(new Vector2(0.5f, 0.5f));
                botIdx = p.Count; p.Add(new Vector3(0f, -length * 0.5f, 0f)); uv.Add(new Vector2(0.5f, 0.5f));
            }

            int sideBase = p.Count;
            for (int i = 0; i < sides; i++)
            {
                p.Add(ring[i] + new Vector3(0f, -length * 0.5f, 0f));
                uv.Add(new Vector2((float)i / (sides - 1), 0f));
                p.Add(ring[i] + new Vector3(0f, length * 0.5f, 0f));
                uv.Add(new Vector2((float)i / (sides - 1), 1f));
            }

            for (int i = 0; i < sides; i++)
            {
                int next = (i + 1) % sides;
                int b0 = sideBase + i * 2, b1 = sideBase + i * 2 + 1;
                int b2 = sideBase + next * 2, b3 = sideBase + next * 2 + 1;
                t.Add(b0); t.Add(b2); t.Add(b1);
                t.Add(b1); t.Add(b2); t.Add(b3);
                if (caps)
                {
                    t.Add(topIdx); t.Add(b1); t.Add(b3);
                    t.Add(botIdx); t.Add(b3); t.Add(b1);
                }
            }

            var part = new MeshBuilderPart
            {
                Positions = p.ToArray(),
                Uvs = uv.ToArray(),
                Tris = t.ToArray(),
            };
            return Transform(part, rot);
        }

        /// <summary>Sphere (or upper cap) with latitude/longitude subdivision.</summary>
        private static MeshBuilderPart Sphere(float radius, int lats, int lons, bool topCapOnly, Quaternion rot)
        {
            var p = new List<Vector3>();
            var uv = new List<Vector2>();
            int latMin = topCapOnly ? lats / 2 : 0;
            var t = new List<int>();

            for (int lat = latMin; lat <= lats; lat++)
            {
                float theta = (lat / (float)lats) * Mathf.PI;
                float y = Mathf.Cos(theta) * radius;
                float r = Mathf.Sin(theta) * radius;
                for (int lon = 0; lon < lons; lon++)
                {
                    float phi = (lon / (float)lons) * Mathf.PI * 2f;
                    p.Add(new Vector3(Mathf.Cos(phi) * r, y, Mathf.Sin(phi) * r));
                    uv.Add(new Vector2((float)lon / (lons - 1), (float)lat / lats));
                }
            }

            int rowLen = lons;
            int rowCount = lats - latMin + 1;
            for (int lat = 0; lat < rowCount - 1; lat++)
            {
                for (int lon = 0; lon < lons; lon++)
                {
                    int cur = lat * rowLen + lon;
                    int nxt = lat * rowLen + (lon + 1) % lons;
                    int curN = (lat + 1) * rowLen + lon;
                    int nxtN = (lat + 1) * rowLen + (lon + 1) % lons;
                    t.Add(cur); t.Add(nxt); t.Add(nxtN);
                    t.Add(cur); t.Add(nxtN); t.Add(curN);
                }
            }

            if (topCapOnly)
            {
                // Bowl: close the open ring with a fan to a single centre vertex slightly inset.
                int ringBase = (rowCount - 1) * rowLen;
                int center = p.Count;
                p.Add(new Vector3(0f, Mathf.Cos((latMin / (float)lats) * Mathf.PI) * radius - radius * 0.04f, 0f));
                uv.Add(new Vector2(0.5f, 0.5f));
                for (int lon = 0; lon < lons; lon++)
                {
                    int cur = ringBase + lon;
                    int nxt = ringBase + (lon + 1) % lons;
                    t.Add(center); t.Add(nxt); t.Add(cur);
                }
            }

            var part = new MeshBuilderPart
            {
                Positions = p.ToArray(),
                Uvs = uv.ToArray(),
                Tris = t.ToArray(),
            };
            return Transform(part, rot);
        }

        public static MeshBuilderPart BoxPart(Vector3 center, Vector3 size, Quaternion rot = default)
        {
            MeshBuilderPart part = Box(size, rot == default ? Quaternion.identity : rot);
            return Translate(part, center);
        }

        public static MeshBuilderPart CylinderPart(Vector3 center, float radius, float length, int sides, bool caps, Quaternion rot = default)
        {
            MeshBuilderPart part = CylinderY(radius, length, sides, caps, rot == default ? Quaternion.identity : rot);
            return Translate(part, center);
        }

        public static MeshBuilderPart SpherePart(Vector3 center, float radius, int lats, int lons, Quaternion rot = default)
        {
            MeshBuilderPart part = Sphere(radius, lats, lons, false, rot == default ? Quaternion.identity : rot);
            return Translate(part, center);
        }

        public static MeshBuilderPart HairCapPart(Vector3 center, float radius, int lats, int lons, Quaternion rot = default)
        {
            MeshBuilderPart part = Sphere(radius, lats, lons, true, rot == default ? Quaternion.identity : rot);
            return Translate(part, center);
        }

        /// <summary>Vertices are around the given axis at unit scale; used for ears/pelvis discs.</summary>
        public static MeshBuilderPart DiscPart(Vector3 center, float radius, int sides, Quaternion rot)
        {
            var ring = CircleRing(radius, sides);
            var p = new List<Vector3>(ring.Length + 1);
            var uv = new List<Vector2>();
            foreach (var v in ring) { p.Add(v); uv.Add(new Vector2(v.x * 0.5f + 0.5f, v.z * 0.5f + 0.5f)); }
            int c = p.Count;
            p.Add(Vector3.zero); uv.Add(new Vector2(0.5f, 0.5f));
            var t = new List<int>();
            for (int i = 0; i < ring.Length; i++)
            {
                int nxt = (i + 1) % ring.Length;
                t.Add(c); t.Add(nxt); t.Add(i);
                t.Add(c); t.Add(i); t.Add(nxt);
            }
            var part = new MeshBuilderPart { Positions = p.ToArray(), Uvs = uv.ToArray(), Tris = t.ToArray() };
            return Transform(part, rot);
        }

        // ------ transforms (about origin) / translation ------
        private static MeshBuilderPart Part(Vector3[] p, Vector2[] uv, int[] t, Quaternion rot)
        {
            var part = new MeshBuilderPart { Positions = p, Uvs = uv, Tris = t };
            if (rot != default && rot != Quaternion.identity) part = Transform(part, rot);
            return part;
        }

        private static MeshBuilderPart Translate(MeshBuilderPart part, Vector3 offset)
        {
            if (offset == Vector3.zero) return part;
            var p = new Vector3[part.Positions.Length];
            for (int i = 0; i < p.Length; i++) p[i] = part.Positions[i] + offset;
            return new MeshBuilderPart { Positions = p, Uvs = part.Uvs, Tris = part.Tris };
        }

        private static MeshBuilderPart Transform(MeshBuilderPart part, Quaternion rot)
        {
            if (rot == Quaternion.identity) return part;
            var p = new Vector3[part.Positions.Length];
            for (int i = 0; i < p.Length; i++) p[i] = rot * part.Positions[i];
            return new MeshBuilderPart { Positions = p, Uvs = part.Uvs, Tris = part.Tris };
        }
    }
}