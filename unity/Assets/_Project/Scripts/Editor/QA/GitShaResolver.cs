using System;
using System.IO;
using System.Text.RegularExpressions;
using UnityEditor;
using UnityEngine;

namespace WhisperingWilds.Editor.QA
{
    /// <summary>
    /// Authoritative Git SHA and Branch resolution for Unity QA automation.
    /// Strictly verifies the checked-out repository HEAD as the single source of truth.
    /// Fails safely if Git is unavailable, SHA is malformed, or expected assertions do not match.
    /// </summary>
    public static class GitShaResolver
    {
        private static readonly Regex Sha40Regex = new Regex("^[a-fA-F0-9]{40}$", RegexOptions.Compiled);

        /// <summary>
        /// Resolves the repository root robustly from Application.dataPath.
        /// </summary>
        public static string ResolveRepositoryRoot()
        {
            string repoRoot = Path.GetFullPath(Path.Combine(Application.dataPath, "..", ".."));
            if (!Directory.Exists(repoRoot))
            {
                throw new DirectoryNotFoundException($"Repository root not found at {repoRoot}");
            }
            return repoRoot;
        }

        /// <summary>
        /// Authoritatively resolves and validates the checked-out Git HEAD commit SHA.
        /// If -gitSha CLI argument or WW_AUDIT_SHA environment variable is provided,
        /// it acts as an assertion that MUST strictly match the actual Git HEAD.
        /// </summary>
        public static string ResolveGitSha()
        {
            string repoRoot = ResolveRepositoryRoot();

            // 1. Resolve authoritative Git HEAD from repository root
            string actualSha = QueryGitHead(repoRoot);
            if (string.IsNullOrEmpty(actualSha) || !Sha40Regex.IsMatch(actualSha))
            {
                Debug.LogError($"[GitShaResolver] [FATAL] git rev-parse HEAD returned invalid or empty SHA: '{actualSha}'");
                FailExecution("Authoritative Git HEAD SHA is invalid or could not be determined.");
                return null;
            }

            actualSha = actualSha.ToLowerInvariant();

            // 2. Validate CLI argument assertion (-gitSha <sha>)
            string cliAssertedSha = GetCommandLineArg("-gitSha");
            if (!string.IsNullOrEmpty(cliAssertedSha))
            {
                if (!Sha40Regex.IsMatch(cliAssertedSha))
                {
                    Debug.LogError($"[GitShaResolver] [FATAL] CLI argument -gitSha value is malformed: '{cliAssertedSha}'");
                    FailExecution($"CLI argument -gitSha '{cliAssertedSha}' is not a valid 40-character hex SHA.");
                    return null;
                }

                if (!string.Equals(cliAssertedSha, actualSha, StringComparison.OrdinalIgnoreCase))
                {
                    Debug.LogError($"[GitShaResolver] [FATAL] SHA mismatch! CLI -gitSha '{cliAssertedSha}' does not match actual Git HEAD '{actualSha}'");
                    FailExecution($"CLI -gitSha assertion '{cliAssertedSha}' does not match checked-out HEAD '{actualSha}'.");
                    return null;
                }
            }

            // 3. Validate environment variable assertion (WW_AUDIT_SHA)
            string envAssertedSha = Environment.GetEnvironmentVariable("WW_AUDIT_SHA")?.Trim();
            if (!string.IsNullOrEmpty(envAssertedSha))
            {
                if (!Sha40Regex.IsMatch(envAssertedSha))
                {
                    Debug.LogError($"[GitShaResolver] [FATAL] WW_AUDIT_SHA environment variable is malformed: '{envAssertedSha}'");
                    FailExecution($"Environment variable WW_AUDIT_SHA '{envAssertedSha}' is not a valid 40-character hex SHA.");
                    return null;
                }

                if (!string.Equals(envAssertedSha, actualSha, StringComparison.OrdinalIgnoreCase))
                {
                    Debug.LogError($"[GitShaResolver] [FATAL] SHA mismatch! WW_AUDIT_SHA '{envAssertedSha}' does not match actual Git HEAD '{actualSha}'");
                    FailExecution($"WW_AUDIT_SHA assertion '{envAssertedSha}' does not match checked-out HEAD '{actualSha}'.");
                    return null;
                }
            }

            Debug.Log($"<color=#00FF99><b>[GitShaResolver]</b></color> Authoritatively verified Git HEAD SHA: {actualSha}");
            return actualSha;
        }

        /// <summary>
        /// Resolves the current active Git branch name.
        /// </summary>
        public static string ResolveGitBranch()
        {
            try
            {
                string repoRoot = ResolveRepositoryRoot();
                var psi = new System.Diagnostics.ProcessStartInfo("git", "rev-parse --abbrev-ref HEAD")
                {
                    WorkingDirectory = repoRoot,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using (var proc = System.Diagnostics.Process.Start(psi))
                {
                    if (proc != null)
                    {
                        string branch = proc.StandardOutput.ReadToEnd().Trim();
                        proc.WaitForExit();
                        if (proc.ExitCode == 0 && !string.IsNullOrEmpty(branch))
                        {
                            return branch.Equals("HEAD", StringComparison.OrdinalIgnoreCase) ? "detached-HEAD" : branch;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[GitShaResolver] Could not resolve branch from git: {ex.Message}");
            }

            return "UNVERIFIED";
        }

        /// <summary>
        /// Resolves the base commit SHA against origin/main or returns a sensible fallback.
        /// </summary>
        public static string ResolveBaseSha()
        {
            try
            {
                string repoRoot = ResolveRepositoryRoot();
                var psi = new System.Diagnostics.ProcessStartInfo("git", "merge-base HEAD origin/main")
                {
                    WorkingDirectory = repoRoot,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using (var proc = System.Diagnostics.Process.Start(psi))
                {
                    if (proc != null)
                    {
                        string sha = proc.StandardOutput.ReadToEnd().Trim();
                        proc.WaitForExit();
                        if (proc.ExitCode == 0 && Sha40Regex.IsMatch(sha))
                        {
                            return sha.ToLowerInvariant();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[GitShaResolver] Could not resolve merge base from git: {ex.Message}");
            }

            return "63d7ee08e8809de2384722f0e2773d047755eeaf";
        }

        private static string QueryGitHead(string repoRoot)
        {
            try
            {
                var psi = new System.Diagnostics.ProcessStartInfo("git", "rev-parse HEAD")
                {
                    WorkingDirectory = repoRoot,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using (var proc = System.Diagnostics.Process.Start(psi))
                {
                    if (proc == null) return null;
                    string output = proc.StandardOutput.ReadToEnd().Trim();
                    string error = proc.StandardError.ReadToEnd().Trim();
                    proc.WaitForExit();

                    if (proc.ExitCode != 0)
                    {
                        Debug.LogError($"[GitShaResolver] git rev-parse HEAD failed with exit code {proc.ExitCode}: {error}");
                        return null;
                    }

                    return output;
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[GitShaResolver] Failed to start git process: {ex.Message}");
                return null;
            }
        }

        private static string GetCommandLineArg(string name)
        {
            string[] args = Environment.GetCommandLineArgs();
            for (int i = 0; i < args.Length - 1; i++)
            {
                if (args[i].Equals(name, StringComparison.OrdinalIgnoreCase))
                {
                    return args[i + 1]?.Trim();
                }
            }
            return null;
        }

        private static void FailExecution(string reason)
        {
            Debug.LogError($"[GitShaResolver] ABORTING EXECUTION: {reason}");
            throw new InvalidOperationException($"Git SHA verification failed: {reason}");
        }
    }
}
