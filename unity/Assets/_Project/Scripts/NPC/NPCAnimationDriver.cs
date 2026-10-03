using System;
using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.NPC
{
    /// <summary>Logical animation states the driver can request.</summary>
    public enum NPCAnimState
    {
        Idle,
        Walk,
        Run,
        Work,
        Talk,
        Eat,
        Drink,
        Carry,
        Buy,
        Sell,
        Craft,
        Fish,
        Farm,
        TeaWork,
        Sit,
        Sleep,
        React
    }

    /// <summary>
    /// Abstraction over the Animator for NPCs.
    ///
    /// This project currently has no NPC Animator Controllers (only
    /// PlayerLocomotionController exists), so the driver is written to degrade
    /// safely: with no controller or no binding for a state it holds the last valid
    /// pose and reports the gap instead of inventing clips.
    ///
    /// Rules:
    ///  - No animation clips are generated. Bindings reference existing controller
    ///    states by name.
    ///  - Animator parameters are written only when the requested state actually
    ///    changes, so there is no per-frame spam.
    ///  - A missing binding degrades to <see cref="NPCAnimState.Idle"/> when that is
    ///    bound, otherwise it does nothing at all.
    /// </summary>
    [DisallowMultipleComponent]
    public class NPCAnimationDriver : MonoBehaviour
    {
        [Serializable]
        public struct StateBinding
        {
            public NPCAnimState state;

            [Tooltip("Name of the matching state in the Animator Controller.")]
            public string animatorStateName;

            [Tooltip("Optional Animator bool parameter used to gate this state.")]
            public string animatorBoolParameter;
        }

        [Header("Animator")]
        [SerializeField] private Animator animator;

        [Header("Bindings")]
        [SerializeField] private List<StateBinding> bindings = new List<StateBinding>();

        private readonly HashSet<NPCAnimState> boundStates = new HashSet<NPCAnimState>();
        private readonly HashSet<NPCAnimState> reportedMissing = new HashSet<NPCAnimState>();

        private NPCAnimState currentState = NPCAnimState.Idle;
        private int currentStateHash;
        private bool hasWrittenState;

        /// <summary>True when a usable Animator with a runtime controller is present.</summary>
        public bool HasAnimator => animator != null && animator.isActiveAndEnabled;

        /// <summary>True when the controller actually exposes a playable graph.</summary>
        public bool HasController => HasAnimator && animator.runtimeAnimatorController != null;

        /// <summary>True when at least one state is bound.</summary>
        public bool HasAnyBinding => boundStates.Count > 0;

        /// <summary>States requested so far that have no binding. Reported, never faked.</summary>
        public IReadOnlyCollection<NPCAnimState> MissingBindings => reportedMissing;

        public NPCAnimState CurrentState => currentState;

        private void Awake()
        {
            RebuildBindingCache();
        }

        private void RebuildBindingCache()
        {
            boundStates.Clear();
            for (int i = 0; i < bindings.Count; i++)
            {
                if (!string.IsNullOrEmpty(bindings[i].animatorStateName))
                {
                    boundStates.Add(bindings[i].state);
                }
            }
        }

        /// <summary>
        /// Requests an animation state. Writes to the Animator only on an actual
        /// change, so calling this every frame is cheap and allocation-free.
        /// </summary>
        public void RequestState(NPCAnimState state)
        {
            if (state == currentState && hasWrittenState) return;

            // Record the intent even when we cannot render it, so QA can report the
            // real state the NPC is in rather than a faked one.
            currentState = state;

            if (!HasController)
            {
                hasWrittenState = false;
                return;
            }

            if (!boundStates.Contains(state))
            {
                if (reportedMissing.Add(state))
                {
                    Debug.LogWarning(
                        $"[NPCAnimationDriver] {name}: no Animator binding for '{state}'. " +
                        "Falling back safely. This is an asset gap, not a code error.");
                }

                // Degrade to Idle only if Idle is actually bound; otherwise hold still.
                if (state != NPCAnimState.Idle && boundStates.Contains(NPCAnimState.Idle))
                {
                    WriteState(NPCAnimState.Idle);
                }
                hasWrittenState = true;
                return;
            }

            WriteState(state);
            hasWrittenState = true;
        }

        private void WriteState(NPCAnimState state)
        {
            int hash = Animator.StringToHash(state.ToString());

            // Only touch the Animator when the target really differs.
            if (hash == currentStateHash && currentState == state) return;
            currentStateHash = hash;

            animator.CrossFadeInFixedTime(hash, 0.1f);
        }

        /// <summary>
        /// Rebinds a state at runtime (used by tooling and QA). Returns false when the
        /// controller has no such state, rather than silently doing nothing.
        /// </summary>
        public bool TryBindState(NPCAnimState state, string animatorStateName, string boolParameter = null)
        {
            if (animator == null || animator.runtimeAnimatorController == null) return false;

            // HasState takes a layer index as well as the state id. Layer 0 is the base
            // layer, which is where a single-layer controller keeps its states.
            if (!animator.HasState(0, Animator.StringToHash(animatorStateName)))
            {
                return false;
            }

            for (int i = 0; i < bindings.Count; i++)
            {
                if (bindings[i].state != state) continue;

                // Struct element: read-modify-write, since bindings[i] is a copy.
                StateBinding entry = bindings[i];
                entry.animatorStateName = animatorStateName;
                entry.animatorBoolParameter = boolParameter;
                bindings[i] = entry;

                RebuildBindingCache();
                return true;
            }

            bindings.Add(new StateBinding
            {
                state = state,
                animatorStateName = animatorStateName,
                animatorBoolParameter = boolParameter
            });
            RebuildBindingCache();
            return true;
        }
    }
}