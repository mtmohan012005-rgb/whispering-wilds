# Production Deployment — The Whispering Wilds

## Architecture Overview

The Whispering Wilds consists of three deployment targets:

1. **Unity 6 Windows x64 standalone game** — Primary product
2. **Node.js backend server** — Multiplayer and cloud-save services
3. **GitHub Pages landing page** — Project website

## Unity Game Deployment

### Building for Release

1. Open the project in Unity 6000.6.3f1.
2. **File** → **Build Settings** → **Windows** → **Build and Run**.
3. Output: `unity/Build/Windows/TheWhisperingWilds.exe` (~192 MB with data folder).

### Distribution

Package the executable and its `_Data` folder for distribution. Use GitHub Releases for versioned releases:

1. Tag the commit: `git tag -a v1.0.0 -m "Release v1.0.0"`
2. Push the tag: `git push origin v1.0.0`
3. Create a release on GitHub and attach the build artifacts.

### System Requirements

- Windows 10/11 x64
- DirectX 11/12 compatible GPU
- 4 GB RAM minimum
- 500 MB disk space

## Backend Server Deployment

### Platform: Render (Recommended)

Render hosts the Node.js backend with PostgreSQL persistence.

#### Environment Variables (Configure in Render Dashboard)

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | `production` |
| `PORT` | Port to bind (Render provides this) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Session signing secret (use a strong random string) |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key |

#### Start Command

```
node server.js
```

#### Health Check

The server exposes a health endpoint at `/api/health`. Configure Render to use this for readiness checks.

### Database

Use Render PostgreSQL or an external PostgreSQL instance. The database schema is bootstrapped automatically on first connection (see `server/auth/db.js`).

### Firebase Configuration

For cloud saves and authentication:

1. Create a Firebase project.
2. Enable Authentication (Email/Password).
3. Create a service account and download the JSON key.
4. Configure the environment variables above.
5. Set restrictive Firestore security rules.

**Do not commit Firebase service account keys or private credentials to the repository.**

## GitHub Pages Deployment

The landing page is deployed via GitHub Actions (`.github/workflows/pages.yml`).

### Triggering Deployment

- Push changes to `docs/landing/` or `.github/workflows/pages.yml` on `main`.
- Or manually trigger: **Actions** → **Deploy GitHub Pages** → **Run workflow**.

### Pages Settings

In GitHub repository settings:
1. Go to **Settings** → **Pages**.
2. Set **Source** to **GitHub Actions**.
3. The workflow handles deployment automatically.

The live page is at: `https://mtmohan012005-rgb.github.io/whispering-wilds/`

## Smoke Testing After Deployment

### Backend

```powershell
# Check health endpoint
curl https://your-backend-url.com/api/health

# Verify authentication endpoints respond
curl -X POST https://your-backend-url.com/api/auth/register -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"Test1234!"}'
```

### Unity Game

Run the standalone executable and verify:
- Game launches without errors
- Main menu displays correctly
- New Game starts the campaign
- Save and load work correctly

### GitHub Pages

Visit `https://mtmohan012005-rgb.github.io/whispering-wilds/` and verify the landing page loads.

## Rollback Procedures

### Unity Game

Keep previous build artifacts tagged in GitHub Releases. To rollback:
1. Download the previous release.
2. Replace the current build files.

### Backend

1. Revert the code: `git revert <commit>` and push.
2. Redeploy on Render (auto-deploys on `main` push).
3. If database migration caused issues, restore from backup.

### GitHub Pages

1. Revert the landing page changes.
2. Push to `main` to trigger redeployment.

## Security Checklist

- [ ] Firebase service account keys are in environment variables, not code
- [ ] JWT secret is strong and unique
- [ ] CORS is configured for production domains
- [ ] Rate limiting is enabled on authentication endpoints
- [ ] Firestore rules are restrictive (not allowing unrestricted read/write)
- [ ] No secrets are logged in server output
- [ ] Session cookies use `Secure` and `HttpOnly` flags in production
