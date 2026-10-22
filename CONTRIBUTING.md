# Contributing to The Whispering Wilds

Thanks for your interest in improving the project. This repository contains a
Unity 6 (HDRP) game, a Node.js backend, and the validation tooling that guards
both.

## Prerequisites

- Windows 10/11 x64 (primary target)
- Unity 6 (`6000.6.3f1`) with HDRP, installed through Unity Hub
- Node.js 18+ (20 recommended for CI parity)
- PowerShell 5.1+ for the launcher and release scripts

## Local setup

```powershell
# Backend dependencies
npm ci

# Open the Unity project
# Unity Hub -> Add project from disk -> select the `unity/` folder
```

## Before opening a pull request

Run the repository validation suites and make sure they pass:

```powershell
npm run validate        # game structure + production config + game data manifests
npm run verify-assets   # curated asset manifest and hero GLB integrity
npm test                # backend security, cloud saves, map data, launcher, audit evidence
```

If you changed C# or scenes, also open the project in the Unity Editor and
compile/play the affected scene. Unity batch-mode tests require an activated
Editor license and are not available in CI.

## Commit conventions

- Use short imperative subjects, matching the existing history, for example
  `fix(audit): reconcile evidence totals` or `feat(world): add canal props`.
- Keep generated binaries, build output (`unity/Build/`), and release ZIPs out of
  commits. They are already covered by `.gitignore`.
- Never commit credentials, Firebase service-account JSON, `.env` files, or
  tokens. Use `.env.example` as the template.

## Pull requests

- Describe the player-visible or tooling impact.
- List the exact validation commands you ran and their result.
- Link related audit evidence under `docs/audits/` or `artifacts/` when a claim
  depends on measurements.
- Keep unrelated refactors out of behavioural fixes.

## Asset and cultural review

Content depicting Tamil Nadu places, people, and culture must remain accurate and
respectful. See `docs/CULTURAL_QA_CHECKLIST.md` and the provenance notes in
`docs/AUDIO_LICENSES.md`, `unity/ASSET_LICENSE_MANIFEST.md`, and
`unity/MapData/SOURCES_AND_LICENSES.md` before adding assets.
