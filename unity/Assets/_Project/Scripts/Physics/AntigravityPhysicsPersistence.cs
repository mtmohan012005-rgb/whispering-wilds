using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Core;

namespace WhisperingWilds.PhysicsZones
{
    /// <summary>
    /// Bridges live <see cref="AntigravityZoneManager"/> state into
    /// <see cref="GameSaveData"/> (schema v3) and back.
    ///
    /// Every value written is sanitised, and every value read is sanitised again
    /// before it touches a Rigidbody. A corrupt or hand-edited payload therefore
    /// cannot fling geometry or the player out of the playable world.
    ///
    /// Deliberately not a MonoBehaviour: capture/restore are driven by the save
    /// system, not by scene lifetime.
    /// </summary>
    public static class AntigravityPhysicsPersistence
    {
        /// <summary>
        /// Writes current zone and body state into the save payload.
        ///
        /// Iterates the scene-wide body registry rather than the zones' active lists, so
        /// resting bodies are recorded too. That makes <see cref="SavedGravityBody.isFloating"/>
        /// carry real information, and lets a reload place a prop back where it was
        /// lying instead of only restoring the ones that happened to be airborne.
        /// </summary>
        public static void Capture(GameSaveData data)
        {
            if (data == null) return;

            if (data.gravityZones == null) data.gravityZones = new List<SavedGravityZone>();
            if (data.floatingBodies == null) data.floatingBodies = new List<SavedGravityBody>();

            data.gravityZones.Clear();
            data.floatingBodies.Clear();

            var zones = AntigravityZoneManager.ActiveZones;
            for (int z = 0; z < zones.Count; z++)
            {
                AntigravityZoneManager zone = zones[z];
                if (zone == null) continue;

                data.gravityZones.Add(new SavedGravityZone
                {
                    zoneId = zone.ZoneId,
                    gravityInverted = zone.ActiveBodyCount > 0
                });
            }

            AntigravityBodyState.EnsureRegistry();
            var allBodies = AntigravityBodyState.Registered;

            for (int b = 0; b < allBodies.Count; b++)
            {
                AntigravityBodyState state = allBodies[b];
                if (state == null) continue;

                Rigidbody rb = state.Body != null ? state.Body : state.GetComponent<Rigidbody>();
                if (rb == null) continue;

                Vector3 pos = SavedGravityPhysics.SanitizePosition(rb.position);
                Quaternion rot = SavedGravityPhysics.SanitizeRotation(rb.rotation);
                Vector3 lin = SavedGravityPhysics.SanitizeLinearVelocity(rb.linearVelocity);
                Vector3 ang = SavedGravityPhysics.SanitizeAngularVelocity(rb.angularVelocity);

                data.floatingBodies.Add(new SavedGravityBody
                {
                    floatingObjectId = state.FloatingObjectId,
                    zoneId = state.ZoneId,
                    posX = pos.x, posY = pos.y, posZ = pos.z,
                    rotX = rot.x, rotY = rot.y, rotZ = rot.z, rotW = rot.w,
                    linearVelocityX = lin.x, linearVelocityY = lin.y, linearVelocityZ = lin.z,
                    angularVelocityX = ang.x, angularVelocityY = ang.y, angularVelocityZ = ang.z,
                    isFloating = state.IsFloating
                });
            }
        }

        /// <summary>
        /// Applies saved zone and body state back onto the live scene.
        ///
        /// Bodies are matched by <see cref="AntigravityBodyState.FloatingObjectId"/> and
        /// looked up in the scene-wide body registry, not in the zones' active lists. On a
        /// fresh load no body has entered a field yet, so an active-list lookup would
        /// match nothing and restore nothing.
        ///
        /// Unmatched saved entries are ignored rather than guessed at.
        /// </summary>
        public static int Restore(GameSaveData data)
        {
            if (data == null || data.floatingBodies == null || data.floatingBodies.Count == 0) return 0;

            AntigravityBodyState.EnsureRegistry();
            var bodies = AntigravityBodyState.Registered;
            int applied = 0;

            for (int b = 0; b < bodies.Count; b++)
            {
                AntigravityBodyState state = bodies[b];
                if (state == null) continue;

                Rigidbody rb = state.Body != null ? state.Body : state.GetComponent<Rigidbody>();
                if (rb == null) continue;

                SavedGravityBody match = FindById(data.floatingBodies, state.FloatingObjectId);
                if (match == null) continue;

                // Saved as resting, but the zone trigger has already claimed this body
                // in the frames since load. Release it, otherwise the field keeps
                // accelerating it away from the restored resting transform.
                if (!match.isFloating && state.IsFloating)
                {
                    var liveZones = AntigravityZoneManager.ActiveZones;
                    for (int z = 0; z < liveZones.Count; z++)
                    {
                        if (liveZones[z] != null) liveZones[z].Release(rb);
                    }
                }

                Vector3 pos = SavedGravityPhysics.SanitizePosition(
                    new Vector3(match.posX, match.posY, match.posZ));
                Quaternion rot = SavedGravityPhysics.SanitizeRotation(
                    new Quaternion(match.rotX, match.rotY, match.rotZ, match.rotW));
                Vector3 lin = SavedGravityPhysics.SanitizeLinearVelocity(
                    new Vector3(match.linearVelocityX, match.linearVelocityY, match.linearVelocityZ));
                Vector3 ang = SavedGravityPhysics.SanitizeAngularVelocity(
                    new Vector3(match.angularVelocityX, match.angularVelocityY, match.angularVelocityZ));

                rb.position = pos;
                rb.rotation = rot;

                // Velocity writes require the body to be simulated, otherwise Unity
                // warns and the assignment is lost.
                if (rb.isKinematic) continue;

                rb.linearVelocity = lin;
                rb.angularVelocity = ang;
                applied++;
            }

            return applied;
        }

        private static SavedGravityBody FindById(List<SavedGravityBody> bodies, string id)
        {
            for (int i = 0; i < bodies.Count; i++)
            {
                SavedGravityBody b = bodies[i];
                if (b != null && b.floatingObjectId == id) return b;
            }
            return null;
        }
    }
}