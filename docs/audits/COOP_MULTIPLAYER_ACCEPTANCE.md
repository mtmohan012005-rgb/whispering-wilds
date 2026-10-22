# Co-op Multiplayer Acceptance

Status date: 2026-10-23
Branch: `fix/coop-six-char-room-lifecycle-20261022`

## Scope

- Server-generated six-character invite codes (`A-Z` minus `I`/`O`, `2-9` minus `0`/`1`).
- Separate `createRoom` and `joinRoom` lifecycle. Joining never creates a room.
- Five-player cap enforced synchronously on the server.
- Room isolation: movement, chat, mechanism state and customization events use the
  socket's authoritative room, not a client-supplied code.
- Host reassignment when the host leaves, with empty rooms removed.
- Offline solo play does not connect to the network.
- Unity lobby UI built with uGUI and the project Tamil font resolver; no IMGUI.
- Remote explorers use `PlayerCharacter.prefab` (via `Resources/RemoteExplorerAvatar`),
  not cubes or capsules.

## Automated Evidence

| Check | Command | Result |
| --- | --- | --- |
| Invite code + room lifecycle (38 assertions) | `npm run test:room-lifecycle` | 38 passed, 0 failed |
| Full repository suite (11 suites) | `npm test` | 11 passed, 0 failed |
| Unity C# compilation | `powershell -ExecutionPolicy Bypass -File scripts/run-unity-audits.ps1 -Action compile` | exit 0 |

Server coverage includes code format and uniqueness, create/join separation, rejection of
short, unknown and legacy codes, no auto-create, capacity clamp at five, movement isolation,
host reassignment, empty-room cleanup, explicit leave, mechanism allowlist, and chat
sanitization.

## Manual Acceptance Matrix

| Scenario | Status |
| --- | --- |
| Host creates room and receives a six-character code | `NOT_TESTED_MULTI_CLIENT` |
| Second client joins with that code | `NOT_TESTED_MULTI_CLIENT` |
| Remote avatar appears with the player model and name tag | `NOT_TESTED_MULTI_CLIENT` |
| Movement, animation and chat replicate between clients | `NOT_TESTED_MULTI_CLIENT` |
| Sixth player is rejected | `NOT_TESTED_MULTI_CLIENT` |
| Host leaves; remaining player gains host role | `NOT_TESTED_MULTI_CLIENT` |
| Solo campaign starts without a network connection | `NOT_TESTED_HUMAN` |
| Tamil labels render correctly in the lobby | `NOT_TESTED_HUMAN` |

These remain open until two independent Unity clients and a human walkthrough are recorded.
Automated server tests and compilation do not substitute for that evidence.

## Manual Procedure

1. Start the backend with `npm start`.
2. Launch two Unity clients against the same server URL.
3. In client A open **Co-op Expedition** (`F8` also toggles it), choose **Host Expedition**.
4. In client B choose **Join Expedition**, enter A's six-character code.
5. Verify both clients show two explorers, matching names and smooth movement.
6. Close client A and confirm client B is promoted to **Host**.
7. Start a new solo campaign and confirm no server connection is opened.
