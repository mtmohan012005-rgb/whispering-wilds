using System.Collections.Generic;
using System.Runtime.InteropServices;
using UnityEngine;
using UnityEngine.Rendering;

namespace WhisperingWilds.PhysicsZones
{
    /// <summary>One spherical field node. Layout must match FieldNode in the .compute file.</summary>
    [System.Serializable]
    public struct FieldNodeData
    {
        public Vector3 center;
        public float radius;
        public float strength;

        public FieldNodeData(Vector3 center, float radius, float strength)
        {
            this.center = center;
            this.radius = radius;
            this.strength = strength;
        }
    }

    public enum FieldSolverBackend
    {
        Cpu,
        Compute
    }

    /// <summary>
    /// Computes per-body acceleration contributions from spherical field nodes.
    ///
    /// This produces FIELD DATA ONLY. It never integrates rigidbodies and never
    /// displaces them. PhysX remains responsible for collision, contacts,
    /// integration, joints and sleeping.
    ///
    /// Compute is optional. If SystemInfo.supportsComputeShaders is false, or the
    /// shader/kernel is unavailable, the identical CPU path runs instead, so
    /// gameplay never depends on a GPU feature.
    ///
    /// Allocation discipline: buffers and arrays are created on demand and grown,
    /// never per call. The compute path uses async readback rather than a
    /// synchronous GetData stall.
    /// </summary>
    [DisallowMultipleComponent]
    public class GravityFieldSolver : MonoBehaviour
    {
        private const string KernelName = "CalculateFields";
        private const int ThreadsPerGroup = 64;

        [Header("Compute (optional)")]
        [SerializeField] private ComputeShader fieldCompute;
        [SerializeField] private bool preferComputeWhenAvailable = true;

        [Header("Field definition")]
        [SerializeField] private List<FieldNodeData> nodes = new List<FieldNodeData>();

        private ComputeBuffer positionBuffer;
        private ComputeBuffer accelerationBuffer;
        private ComputeBuffer nodeBuffer;
        private int kernelIndex = -1;
        private bool computeReady;

        private Vector3[] cpuPositions = System.Array.Empty<Vector3>();
        private Vector3[] cpuAccelerations = System.Array.Empty<Vector3>();
        private FieldNodeData[] cpuNodes = System.Array.Empty<FieldNodeData>();

        private int bufferedCapacity;
        private bool readbackPending;

        /// <summary>Which path actually ran on the most recent solve.</summary>
        public FieldSolverBackend ActiveBackend { get; private set; } = FieldSolverBackend.Cpu;

        /// <summary>Why compute was unavailable, if it was. Null when compute is active.</summary>
        public string ComputeUnavailableReason { get; private set; }

        public int NodeCount => nodes.Count;

        private void OnEnable()
        {
            InitializeCompute();
        }

        private void OnDisable()
        {
            ReleaseBuffers();
        }

        private void OnDestroy()
        {
            ReleaseBuffers();
        }

        /// <summary>
        /// Evaluates the field for the supplied positions. Caller-owned arrays are
        /// reused so the steady state allocates nothing.
        /// </summary>
        /// <param name="positions">Body positions. Length defines the body count.</param>
        /// <param name="accelerations">
        /// Output accelerations. Must be at least as long as positions. Its contents
        /// are only guaranteed fresh on the CPU path; the compute path fills it
        /// asynchronously once the readback lands.
        /// </param>
        /// <returns>True when results in <paramref name="accelerations"/> are valid now.</returns>
        public bool Solve(Vector3[] positions, Vector3[] accelerations)
        {
            if (positions == null || accelerations == null) return false;
            int count = positions.Length;
            if (count == 0) return true;
            if (accelerations.Length < count) return false;

            EnsureCpuCapacity(count);
            LastAccelerations = accelerations;

            for (int i = 0; i < count; i++) cpuPositions[i] = positions[i];

            bool usedCompute = preferComputeWhenAvailable && computeReady && count > 0;
            if (usedCompute)
            {
                usedCompute = SolveOnGpu(count);
            }

            if (!usedCompute)
            {
                SolveOnCpu(count, accelerations);
                ActiveBackend = FieldSolverBackend.Cpu;
                return true;
            }

            ActiveBackend = FieldSolverBackend.Compute;
            return false;
        }

        /// <summary>
        /// True while a compute readback is in flight; results land asynchronously.
        /// </summary>
        public bool IsReadbackPending => readbackPending;

        private void InitializeCompute()
        {
            computeReady = false;
            ComputeUnavailableReason = null;
            kernelIndex = -1;

            if (!preferComputeWhenAvailable)
            {
                ComputeUnavailableReason = "Compute disabled by preference.";
                return;
            }

            if (!SystemInfo.supportsComputeShaders)
            {
                ComputeUnavailableReason = "SystemInfo.supportsComputeShaders is false.";
                return;
            }

            // Compute is only worth using when the results can actually be read back.
            // Dispatching without a readback path would return "valid" while filling
            // nothing, and would re-dispatch every frame for no benefit.
            if (!SystemInfo.supportsAsyncGPUReadback)
            {
                ComputeUnavailableReason = "Async GPU readback unsupported; using CPU path.";
                return;
            }

            if (fieldCompute == null)
            {
                ComputeUnavailableReason = "No ComputeShader assigned; using CPU path.";
                return;
            }

            if (!fieldCompute.HasKernel(KernelName))
            {
                ComputeUnavailableReason = $"Kernel '{KernelName}' missing; using CPU path.";
                return;
            }

            kernelIndex = fieldCompute.FindKernel(KernelName);
            computeReady = true;
        }

        private bool SolveOnGpu(int count)
        {
            EnsureBufferCapacity(count);
            EnsureCpuNodes();

            try
            {
                positionBuffer.SetData(cpuPositions, 0, 0, count);
                nodeBuffer.SetData(cpuNodes, 0, 0, cpuNodes.Length);

                fieldCompute.SetInt("_BodyCount", count);
                fieldCompute.SetInt("_NodeCount", cpuNodes.Length);
                fieldCompute.SetBuffer(kernelIndex, "_Positions", positionBuffer);
                fieldCompute.SetBuffer(kernelIndex, "_Accelerations", accelerationBuffer);
                fieldCompute.SetBuffer(kernelIndex, "_Nodes", nodeBuffer);

                int groups = (count + ThreadsPerGroup - 1) / ThreadsPerGroup;
                fieldCompute.Dispatch(kernelIndex, groups, 1, 1);
            }
            catch (System.Exception e)
            {
                // Never let a GPU problem break gameplay: drop to CPU permanently.
                Debug.LogWarning($"[GravityFieldSolver] Compute dispatch failed, falling back to CPU: {e.Message}");
                computeReady = false;
                ComputeUnavailableReason = "Dispatch failed at runtime; using CPU path.";
                return false;
            }

            RequestAsyncReadback(count);
            return true;
        }

        private void RequestAsyncReadback(int count)
        {
            // AsyncGPUReadback avoids the pipeline stall of a synchronous GetData.
            // When unsupported we deliberately do not block; callers treat the
            // compute path as advisory and the CPU path remains authoritative.
            if (!SystemInfo.supportsAsyncGPUReadback)
            {
                readbackPending = false;
                return;
            }

            if (readbackPending) return;

            readbackPending = true;
            AsyncGPUReadback.Request(accelerationBuffer, request =>
            {
                readbackPending = false;
                if (request.hasError) return;

                var data = request.GetData<Vector3>();
                int n = Mathf.Min(count, data.Length);
                if (LastAccelerations != null)
                {
                    for (int i = 0; i < n && i < LastAccelerations.Length; i++)
                    {
                        LastAccelerations[i] = data[i];
                    }
                }
            });
        }

        // Destination for the async readback completion.
        private Vector3[] LastAccelerations { get; set; }

        private void SolveOnCpu(int count, Vector3[] accelerations)
        {
            EnsureCpuNodes();

            for (int i = 0; i < count; i++)
            {
                Vector3 position = cpuPositions[i];
                Vector3 acc = Vector3.zero;

                for (int n = 0; n < cpuNodes.Length; n++)
                {
                    FieldNodeData node = cpuNodes[n];
                    Vector3 toCenter = position - node.center;
                    float dist = toCenter.magnitude;

                    if (dist < node.radius && dist > 1e-5f)
                    {
                        float influence = (1f - (dist / node.radius)) * node.strength;
                        acc += (toCenter / dist) * influence;
                    }
                }

                accelerations[i] = acc;
            }
        }

        private void EnsureCpuCapacity(int count)
        {
            if (cpuPositions.Length < count)
            {
                cpuPositions = new Vector3[Mathf.NextPowerOfTwo(count)];
                LastAccelerations = null;
            }
        }

        private void EnsureCpuNodes()
        {
            if (cpuNodes.Length != nodes.Count)
            {
                cpuNodes = new FieldNodeData[nodes.Count];
                for (int i = 0; i < nodes.Count; i++) cpuNodes[i] = nodes[i];
            }
        }

        private void EnsureBufferCapacity(int count)
        {
            if (positionBuffer != null && bufferedCapacity >= count) return;

            ReleaseBuffers();
            bufferedCapacity = Mathf.NextPowerOfTwo(Mathf.Max(count, 1));

            // float3 is 12 bytes in an HLSL structured buffer.
            positionBuffer = new ComputeBuffer(bufferedCapacity, sizeof(float) * 3);
            accelerationBuffer = new ComputeBuffer(bufferedCapacity, sizeof(float) * 3);
            nodeBuffer = new ComputeBuffer(Mathf.Max(nodes.Count, 1), Marshal.SizeOf<FieldNodeData>());
        }

        private void ReleaseBuffers()
        {
            if (positionBuffer != null) { positionBuffer.Release(); positionBuffer = null; }
            if (accelerationBuffer != null) { accelerationBuffer.Release(); accelerationBuffer = null; }
            if (nodeBuffer != null) { nodeBuffer.Release(); nodeBuffer = null; }
            bufferedCapacity = 0;
            readbackPending = false;
        }
    }
}