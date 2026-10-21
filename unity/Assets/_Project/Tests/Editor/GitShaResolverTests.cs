using System;
using System.IO;
using System.Text.RegularExpressions;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;
using WhisperingWilds.Editor.QA;

namespace WhisperingWilds.Tests.Editor
{
    public class GitShaResolverTests
    {
        [Test]
        public void ResolveRepositoryRoot_ReturnsValidExistingDirectory()
        {
            string root = GitShaResolver.ResolveRepositoryRoot();
            Assert.IsNotNull(root);
            Assert.IsTrue(Directory.Exists(root), $"Repo root '{root}' does not exist");
            Assert.IsTrue(Directory.Exists(Path.Combine(root, ".git")) || File.Exists(Path.Combine(root, ".git")), ".git directory/file must exist at repo root");
        }

        [Test]
        public void ResolveGitSha_ReturnsStrict40HexLowercaseSha()
        {
            string sha = GitShaResolver.ResolveGitSha();
            Assert.IsNotNull(sha);
            Assert.AreEqual(40, sha.Length, "SHA length must be exactly 40");
            Assert.IsTrue(Regex.IsMatch(sha, "^[a-f0-9]{40}$"), $"SHA '{sha}' must be 40 lowercase hexadecimal characters");
        }

        [Test]
        public void ResolveGitBranch_ReturnsNonEmptyBranchName()
        {
            string branch = GitShaResolver.ResolveGitBranch();
            Assert.IsFalse(string.IsNullOrEmpty(branch), "Branch name must not be empty");
            Assert.AreNotEqual("HEAD", branch, "Detached HEAD must be mapped to descriptive value");
            Assert.AreNotEqual("fix/qa-evidence-head-integrity", branch, "Must not return stale hardcoded fallback branch name");
        }

        [Test]
        public void ResolveGitSha_MismatchedEnvVar_ThrowsInvalidOperationException()
        {
            string originalEnv = Environment.GetEnvironmentVariable("WW_AUDIT_SHA");
            try
            {
                // Set an intentional mismatching 40-character hex string
                Environment.SetEnvironmentVariable("WW_AUDIT_SHA", "0000000000000000000000000000000000000000");
                LogAssert.Expect(LogType.Error, new Regex(@"\[GitShaResolver\] \[FATAL\].*"));
                LogAssert.Expect(LogType.Error, new Regex(@"\[GitShaResolver\] ABORTING EXECUTION:.*"));
                Assert.Throws<InvalidOperationException>(() =>
                {
                    GitShaResolver.ResolveGitSha();
                }, "Resolver must reject mismatching SHA assertion");
            }
            finally
            {
                Environment.SetEnvironmentVariable("WW_AUDIT_SHA", originalEnv);
            }
        }

        [Test]
        public void ResolveGitSha_MalformedEnvVar_ThrowsInvalidOperationException()
        {
            string originalEnv = Environment.GetEnvironmentVariable("WW_AUDIT_SHA");
            try
            {
                Environment.SetEnvironmentVariable("WW_AUDIT_SHA", "not-a-valid-40-char-sha");
                LogAssert.Expect(LogType.Error, new Regex(@"\[GitShaResolver\] \[FATAL\].*"));
                LogAssert.Expect(LogType.Error, new Regex(@"\[GitShaResolver\] ABORTING EXECUTION:.*"));
                Assert.Throws<InvalidOperationException>(() =>
                {
                    GitShaResolver.ResolveGitSha();
                }, "Resolver must reject malformed SHA assertion");
            }
            finally
            {
                Environment.SetEnvironmentVariable("WW_AUDIT_SHA", originalEnv);
            }
        }
    }
}
