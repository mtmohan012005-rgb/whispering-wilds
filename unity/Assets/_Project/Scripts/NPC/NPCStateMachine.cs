using System;
using UnityEngine;

namespace WhisperingWilds.NPC
{
    /// <summary>
    /// Discrete state machine managing state entry, exit, update ticks, and interrupted state resumption
    /// for authentic Tamil Nadu community resident behaviors.
    /// </summary>
    [Serializable]
    public class NPCStateMachine
    {
        [SerializeField] private NPCState currentState = NPCState.Idle;
        [SerializeField] private NPCState previousState = NPCState.Idle;
        [SerializeField] private NPCState scheduledState = NPCState.Idle;
        [SerializeField] private float stateTimer = 0f;

        public NPCState CurrentState => currentState;
        public NPCState PreviousState => previousState;
        public NPCState ScheduledState => scheduledState;
        public float StateTimer => stateTimer;

        public event Action<NPCState, NPCState> OnStateTransition;

        public void Initialize(NPCState initialState)
        {
            currentState = initialState;
            previousState = initialState;
            scheduledState = initialState;
            stateTimer = 0f;
        }

        public void TransitionTo(NPCState newState)
        {
            if (currentState == newState) return;

            NPCState oldState = currentState;
            previousState = oldState;
            currentState = newState;
            stateTimer = 0f;

            OnStateTransition?.Invoke(oldState, newState);
        }

        public void SetScheduledState(NPCState state)
        {
            scheduledState = state;
        }

        public void Tick(float dt)
        {
            stateTimer += dt;
        }

        /// <summary>
        /// Resumes normal schedule after temporary dialogue, distraction, or interruption.
        /// </summary>
        public void ResumeScheduledState()
        {
            TransitionTo(scheduledState != NPCState.Interrupted && scheduledState != NPCState.Talking ? scheduledState : NPCState.Idle);
        }
    }
}
