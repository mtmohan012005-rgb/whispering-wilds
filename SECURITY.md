# Security Policy

## Supported versions

Security fixes are applied to the `main` branch. The repository does not yet
publish versioned release binaries, so there are no maintained release branches.

## Reporting a vulnerability

Do **not** open a public GitHub issue for a security problem. Instead, use the
repository's private reporting channel:

<https://github.com/mtmohan012005-rgb/whispering-wilds/security/advisories/new>

Please include:

- A description of the issue and its impact
- Reproduction steps or a proof of concept
- The affected component (Unity client, Node.js server, launcher scripts, or CI)
- Any suggested remediation

You will receive an acknowledgement as soon as the report is triaged. Please
allow reasonable time for a fix before public disclosure.

## Scope

In scope:

- Authentication, session handling, password reset, and email verification in `server/`
- Cloud-save authorization and data isolation
- Firestore rules (`firestore.rules`) and server-owned field protection
- CSRF, rate limiting, and security headers
- PowerShell launcher and release-packaging safety checks that handle file paths
  or downloaded payloads

Out of scope:

- Denial of service through excessive local resource usage
- Vulnerabilities in third-party packages that have no available fix (report them
  upstream, and open a non-sensitive issue here so the dependency can be tracked)
- Social engineering of project maintainers

## Handling secrets

Never commit real credentials. The backend reads configuration from environment
variables; `.env.example` documents the expected names. If a secret is committed
by accident, rotate it immediately and report the exposure privately.
