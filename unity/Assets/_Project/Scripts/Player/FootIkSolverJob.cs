using Unity.Burst;
using Unity.Collections;
using Unity.Jobs;
using Unity.Mathematics;

namespace WhisperingWilds.Player
{
    /// <summary>
    /// Per-leg inputs for the parallel two-bone foot solver. Plain blittable data so the
    /// struct can live in a <see cref="NativeArray{T}"/> and be consumed by Burst.
    /// </summary>
    public struct FootIkInput
    {
        public float3 hip;
        public float3 target;
        public float3 targetNormal;
        public float3 forward;
        public float3 footUp;
        public float upperLength;
        public float lowerLength;
        public float weight;
        public float clothPitch;
        public float maxAnkleAngle;
    }

    public struct FootIkOutput
    {
        public quaternion thighRotation;
        public quaternion shinRotation;
        public float3 footUp;
        public float weight;
        public int valid;
    }

    /// <summary>
    /// Allocation-free analytic two-bone IK evaluated on the worker pool. The main thread only
    /// gathers bone positions and applies the returned rotations, so the per-frame cost is a
    /// job schedule/complete plus two quaternion slerps per leg.
    /// </summary>
    [BurstCompile]
    public struct FootIkSolverJob : IJobParallelFor
    {
        [ReadOnly] public NativeArray<FootIkInput> inputs;
        [WriteOnly] public NativeArray<FootIkOutput> outputs;

        public void Execute(int index)
        {
            FootIkInput input = inputs[index];
            FootIkOutput output = default;
            output.weight = input.weight;

            if (input.weight <= 0.001f || input.upperLength < 1e-4f || input.lowerLength < 1e-4f)
            {
                outputs[index] = output;
                return;
            }

            float3 toTarget = input.target - input.hip;
            float distance = math.length(toTarget);
            if (distance < 1e-4f)
            {
                outputs[index] = output;
                return;
            }

            float minReach = math.abs(input.upperLength - input.lowerLength) + 1e-3f;
            float maxReach = (input.upperLength + input.lowerLength) * 0.995f;
            float reach = math.clamp(distance, minReach, maxReach);
            float3 direction = toTarget / distance;

            float cosHip = (input.upperLength * input.upperLength + reach * reach
                            - input.lowerLength * input.lowerLength)
                           / (2f * input.upperLength * reach);
            float hipAngle = math.acos(math.clamp(cosHip, -1f, 1f));

            float3 bend = input.forward - direction * math.dot(input.forward, direction);
            if (math.lengthsq(bend) < 1e-6f)
            {
                bend = math.cross(direction, new float3(0f, 1f, 0f));
                if (math.lengthsq(bend) < 1e-6f)
                {
                    bend = new float3(1f, 0f, 0f);
                }
            }
            bend = math.normalize(bend);

            float3 thighDirection = direction * math.cos(hipAngle) + bend * math.sin(hipAngle);
            float thighLengthSq = math.lengthsq(thighDirection);
            if (thighLengthSq < 1e-8f)
            {
                outputs[index] = output;
                return;
            }
            thighDirection *= math.rsqrt(thighLengthSq);

            quaternion desiredThigh = quaternion.LookRotationSafe(bend, -thighDirection);

            if (math.abs(input.clothPitch) > 0.001f)
            {
                float3 pitchAxis = math.cross(direction, bend);
                float pitchAxisSq = math.lengthsq(pitchAxis);
                if (pitchAxisSq > 1e-8f)
                {
                    desiredThigh = math.mul(
                        quaternion.AxisAngle(pitchAxis * math.rsqrt(pitchAxisSq), math.radians(input.clothPitch)),
                        desiredThigh);
                }
            }

            // The solved thigh places the knee analytically, so the shin can be solved in the
            // same job without waiting for the main thread to apply the thigh rotation.
            float3 knee = input.hip + thighDirection * input.upperLength;
            float3 shinDirection = input.target - knee;
            float shinLengthSq = math.lengthsq(shinDirection);
            if (shinLengthSq < 1e-8f)
            {
                outputs[index] = output;
                return;
            }
            shinDirection *= math.rsqrt(shinLengthSq);

            float3 shinBend = bend - shinDirection * math.dot(bend, shinDirection);
            if (math.lengthsq(shinBend) < 1e-6f)
            {
                shinBend = math.cross(shinDirection, new float3(0f, 1f, 0f));
                if (math.lengthsq(shinBend) < 1e-6f)
                {
                    shinBend = new float3(1f, 0f, 0f);
                }
            }
            shinBend = math.normalize(shinBend);

            quaternion desiredShin = quaternion.LookRotationSafe(shinBend, -shinDirection);

            float3 desiredUp = input.targetNormal;
            if (AngleDegrees(input.footUp, desiredUp) > input.maxAnkleAngle)
            {
                float3 axis = math.cross(input.footUp, desiredUp);
                float axisSq = math.lengthsq(axis);
                if (axisSq > 1e-8f)
                {
                    desiredUp = math.mul(
                        quaternion.AxisAngle(axis * math.rsqrt(axisSq), math.radians(input.maxAnkleAngle)),
                        input.footUp);
                }
            }

            output.thighRotation = desiredThigh;
            output.shinRotation = desiredShin;
            output.footUp = desiredUp;
            output.valid = 1;
            outputs[index] = output;
        }

        private static float AngleDegrees(float3 from, float3 to)
        {
            float fromSq = math.lengthsq(from);
            float toSq = math.lengthsq(to);
            if (fromSq < 1e-8f || toSq < 1e-8f)
            {
                return 0f;
            }

            float cosine = math.dot(from, to) * math.rsqrt(fromSq * toSq);
            return math.degrees(math.acos(math.clamp(cosine, -1f, 1f)));
        }
    }
}
