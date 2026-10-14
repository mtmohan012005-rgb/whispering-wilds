# Local Setup — The Whispering Wilds

## Prerequisites

- **Unity Editor:** 6000.6.3f1 (Unity 6)
- **Render Pipeline:** HDRP 17.7.0 (installed via package manifest)
- **Node.js:** 18.x or 20.x (for backend server and tests)
- **OS:** Windows 10/11 x64 (for standalone builds)

## Opening the Project

1. Install Unity 6000.6.3f1 via Unity Hub.
2. Click **Add** → **Add project from drive**.
3. Navigate to and select the `unity/` folder in the repository root.
4. Open the project. Unity will import assets and resolve packages on first load.

## Building the Windows x64 Game

### Option A: Unity Editor

1. Open `Assets/_Project/Scenes/00_Boot.unity`.
2. Go to **File** → **Build Settings**.
3. Select **Windows** platform.
4. Click **Build and Run**.

The executable is generated at:

```
unity/Build/Windows/TheWhisperingWilds.exe
```

### Option B: Command Line

Use the build pipeline automation script from within the Unity Editor:

```
Assets/_Project/Scripts/Editor/BuildPipelineAutomation.cs
```

Or run via Unity's command line (requires licensed Unity Editor):

```powershell
"Unity\Editor\Unity.exe" -batchmode -nographics -projectPath unity -executeMethod WhisperingWilds.Editor.BuildPipelineAutomation.BuildProductionWindowsFromCommandLine -quit
```

## Launching the Game

After building, launch via PowerShell:

```powershell
.\Launch-Game-PC.ps1
```

Or directly:

```powershell
.\Launch-Game-Unity.ps1
```

If the executable is not found, build the game first (see above).

## Backend Server

The Node.js backend provides multiplayer and cloud-save services.

### Installation

```powershell
npm ci
```

### Required Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `FIREBASE_PROJECT_ID` | Firebase project identifier | Production |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | Production |
| `FIREBASE_PRIVATE_KEY` | Firebase service account key | Production |
| `DATABASE_URL` | PostgreSQL connection string | Optional (production) |
| `JWT_SECRET` | Session signing secret | Production |
| `NODE_ENV` | `development` or `production` | Recommended |

For local development without Firebase, the server runs in a limited mode with file-backed persistence.

### Starting the Server

```powershell
node server.js
```

The server starts on port 3000 by default.

## Running Tests

### Backend Tests

```powershell
npm run test:backend
```

Runs 31 security and authentication tests. No production credentials required.

### Game Verification

```powershell
npm run verify-game
```

Checks 15 Unity project structure criteria (scenes, asmdefs, assets, etc.).

### Asset Validation

```powershell
npm run verify-assets
```

Validates required 3D models, fonts, and textures.

### Production Readiness

```powershell
npm run verify-production
```

Checks deployment configuration, security endpoints, and documentation.

## Unity Tests

EditMode and PlayMode tests require the Unity Editor Test Runner window:

1. Open Unity Editor.
2. Go to **Window** → **General** → **Test Runner**.
3. Select **EditMode** or **PlayMode**.
4. Click **Run All**.

Tests cannot run in headless batch mode due to Unity licensing validation.

## Common Issues

### Unity Licensing Error

If you see "Unity License not found" or similar errors:
- Ensure you have a valid Unity license (Personal or Pro).
- Sign in via Unity Hub with your Unity account.

### Missing HDRP Package

If HDRP is not found:
- Verify `unity/Packages/manifest.json` contains `com.unity.render-pipelines.high-definition`.
- Let Unity resolve packages automatically on project open.

### Tamil Font Missing

The Tamil font (`NotoSansTamil-Regular.ttf`) is located at:
- `unity/Assets/_Project/Resources/Fonts/TamilFont.ttf`
- `unity/Assets/_Project/Fonts/NotoSansTamil-Regular.ttf`

If Tamil text renders as boxes, verify the font is imported and the `LocalizedFontProvider` can find it.

### NavMesh Warnings

NPC navigation uses the built-in `UnityEngine.AI` module. If you see NavMesh warnings:
- Verify the scene has a `NavMeshSurface` component with baked data.
- Check that NPC spawn positions are on walkable surfaces.
