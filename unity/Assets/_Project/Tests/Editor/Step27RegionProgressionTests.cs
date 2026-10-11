using System.Collections.Generic;
using NUnit.Framework;
using WhisperingWilds.World;

namespace WhisperingWilds.Tests.EditMode
{
    /// <summary>
    /// Step 27 EditMode coverage for the full campaign destination ladder.
    ///
    /// Nilgiris is now a gated destination rather than a deferred one: a fresh campaign starts with
    /// Chennai, Pichavaram and Thanjavur, the Chettinad clue opens Mamallapuram, and only a
    /// Mamallapuram clue opens Nilgiris. These tests pin the gate arithmetic on the static unlock
    /// truth so the final route can only ever open by the authored clue chain.
    /// </summary>
    public class Step27RegionProgressionTests
    {
        [SetUp]
        public void SetUp()
        {
            RegionUnlocks.ResetForNewGame();
        }

        private static string[] LockedOrder()
        {
            List<string> locked = RegionUnlocks.LockedProgressionRegions();
            return locked.ToArray();
        }

        [Test]
        public void FreshCampaign_StartsWithThreeAndGatesThree()
        {
            Assert.IsFalse(RegionUnlocks.IsDeferred(RegionUnlocks.NilgirisRegionId),
                "nilgiris must no longer be deferred now that it has a built scene and a gate");

            Assert.IsTrue(RegionUnlocks.IsUnlocked(RegionUnlocks.ChennaiRegionId));
            Assert.IsTrue(RegionUnlocks.IsUnlocked(RegionUnlocks.PichavaramRegionId));
            Assert.IsTrue(RegionUnlocks.IsUnlocked(RegionUnlocks.ThanjavurRegionId));

            Assert.IsFalse(RegionUnlocks.IsUnlocked(RegionUnlocks.ChettinadRegionId));
            Assert.IsFalse(RegionUnlocks.IsUnlocked(RegionUnlocks.MamallapuramRegionId));
            Assert.IsFalse(RegionUnlocks.IsUnlocked(RegionUnlocks.NilgirisRegionId));
        }

        [Test]
        public void FreshCampaign_LockedLadderListsGatesInTravelOrder()
        {
            var locked = LockedOrder();

            Assert.AreEqual(3, locked.Length);
            Assert.AreEqual(RegionUnlocks.ChettinadRegionId, locked[0]);
            Assert.AreEqual(RegionUnlocks.MamallapuramRegionId, locked[1]);
            Assert.AreEqual(RegionUnlocks.NilgirisRegionId, locked[2]);
        }

        [Test]
        public void WrongRegionClues_OpenNothing()
        {
            // Chennai, Pichavaram and Nilgiris produce no gate-firing evidence: Chettinad's gate is
            // keyed to Thanjavur and Mamallapuram's to Chettinad, so clues from these regions must
            // leave every locked destination closed.
            string[] wrongRegions =
            {
                RegionUnlocks.ChennaiRegionId,
                RegionUnlocks.PichavaramRegionId,
                RegionUnlocks.NilgirisRegionId
            };

            for (int i = 0; i < wrongRegions.Length; i++)
            {
                RegionUnlocks.EvaluateClueGate(wrongRegions[i]);

                Assert.IsFalse(RegionUnlocks.IsUnlocked(RegionUnlocks.ChettinadRegionId),
                    "a " + wrongRegions[i] + " clue opened chettinad");
                Assert.IsFalse(RegionUnlocks.IsUnlocked(RegionUnlocks.MamallapuramRegionId),
                    "a " + wrongRegions[i] + " clue opened mamallapuram");
                Assert.IsFalse(RegionUnlocks.IsUnlocked(RegionUnlocks.NilgirisRegionId),
                    "a " + wrongRegions[i] + " clue opened nilgiris");
            }
        }

        [Test]
        public void ChettinadClue_OpensOnlyMamallapuram()
        {
            Assert.IsTrue(RegionUnlocks.EvaluateClueGate(RegionUnlocks.ChettinadRegionId),
                "the chettinad clue must report the mamallapuram unlock");

            Assert.IsTrue(RegionUnlocks.IsUnlocked(RegionUnlocks.MamallapuramRegionId));
            Assert.IsFalse(RegionUnlocks.IsUnlocked(RegionUnlocks.NilgirisRegionId),
                "nilgiris opened before its own gate");

            Assert.IsFalse(RegionUnlocks.EvaluateClueGate(RegionUnlocks.ChettinadRegionId),
                "replaying the chettinad clue must not re-unlock mamallapuram");
        }

        [Test]
        public void MamallapuramClue_OpensNilgirisExactlyOnce()
        {
            // Mamallapuram is still gated by its own clue, but its discovered evidence is what
            // opens Nilgiris. The two gates are independent: a mamallapuram clue on record must
            // open the final destination whether or not Mamallapuram itself was already unlocked.
            Assert.IsTrue(RegionUnlocks.EvaluateClueGate(RegionUnlocks.MamallapuramRegionId),
                "the mamallapuram clue must report the nilgiris unlock");

            Assert.IsTrue(RegionUnlocks.IsUnlocked(RegionUnlocks.NilgirisRegionId));

            Assert.IsFalse(RegionUnlocks.EvaluateClueGate(RegionUnlocks.MamallapuramRegionId),
                "replaying the mamallapuram clue must not re-unlock nilgiris");
        }

        [Test]
        public void FullLadder_ClueChainOpensEveryGateInOrder()
        {
            Assert.IsTrue(RegionUnlocks.EvaluateClueGate(RegionUnlocks.ThanjavurRegionId));
            Assert.IsTrue(RegionUnlocks.IsUnlocked(RegionUnlocks.ChettinadRegionId));

            Assert.IsTrue(RegionUnlocks.EvaluateClueGate(RegionUnlocks.ChettinadRegionId));
            Assert.IsTrue(RegionUnlocks.IsUnlocked(RegionUnlocks.MamallapuramRegionId));
            Assert.IsFalse(RegionUnlocks.IsUnlocked(RegionUnlocks.NilgirisRegionId));

            Assert.IsTrue(RegionUnlocks.EvaluateClueGate(RegionUnlocks.MamallapuramRegionId));
            Assert.IsTrue(RegionUnlocks.IsUnlocked(RegionUnlocks.NilgirisRegionId));

            Assert.AreEqual(0, RegionUnlocks.LockedProgressionRegions().Count,
                "the full ladder must have no locked destination left");
        }

        [Test]
        public void V3Migration_SeedsPreGateDestinationsOnly()
        {
            List<string> migrated = RegionUnlocks.SeedPreGateCampaign();

            Assert.IsFalse(migrated.Contains(RegionUnlocks.MamallapuramRegionId),
                "v3 migration must not seed mamallapuram, a gated destination");
            Assert.IsFalse(migrated.Contains(RegionUnlocks.NilgirisRegionId),
                "v3 migration must not seed nilgiris, the final destination");
            Assert.IsTrue(migrated.Contains(RegionUnlocks.ChettinadRegionId),
                "v3 migration must keep chettinad, which pre-gate players had already reached");
            Assert.IsTrue(migrated.Contains(RegionUnlocks.PichavaramRegionId));
            Assert.IsTrue(migrated.Contains(RegionUnlocks.ThanjavurRegionId));
            Assert.IsTrue(migrated.Contains(RegionUnlocks.ChennaiRegionId));
        }

        [Test]
        public void Nilgiris_NotDeferredButStillClosureCorrect()
        {
            Assert.IsFalse(RegionUnlocks.IsDeferred(RegionUnlocks.NilgirisRegionId));

            // Unlock and snapshot, then restore: Nilgiris is a normal destination now, so a save
            // with it on record must restore identically instead of being dropped as deferred.
            Assert.IsTrue(RegionUnlocks.EvaluateClueGate(RegionUnlocks.ChettinadRegionId));
            Assert.IsTrue(RegionUnlocks.EvaluateClueGate(RegionUnlocks.MamallapuramRegionId));
            Assert.IsTrue(RegionUnlocks.IsUnlocked(RegionUnlocks.NilgirisRegionId));

            List<string> snapshot = RegionUnlocks.Snapshot();
            Assert.IsTrue(snapshot.Contains(RegionUnlocks.NilgirisRegionId));

            RegionUnlocks.Restore(snapshot);
            Assert.IsTrue(RegionUnlocks.IsUnlocked(RegionUnlocks.NilgirisRegionId));
        }

        [Test]
        public void ResetForNewGame_ClosesEveryGatedDestinationAgain()
        {
            Assert.IsTrue(RegionUnlocks.EvaluateClueGate(RegionUnlocks.ChettinadRegionId));
            Assert.IsTrue(RegionUnlocks.EvaluateClueGate(RegionUnlocks.MamallapuramRegionId));
            Assert.IsTrue(RegionUnlocks.IsUnlocked(RegionUnlocks.NilgirisRegionId));

            RegionUnlocks.ResetForNewGame();

            Assert.IsFalse(RegionUnlocks.IsUnlocked(RegionUnlocks.NilgirisRegionId));
            Assert.IsFalse(RegionUnlocks.IsUnlocked(RegionUnlocks.MamallapuramRegionId));
            Assert.IsFalse(RegionUnlocks.IsUnlocked(RegionUnlocks.ChettinadRegionId));
            Assert.IsTrue(RegionUnlocks.IsUnlocked(RegionUnlocks.ChennaiRegionId));
        }
    }
}