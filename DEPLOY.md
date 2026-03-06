# Deploy Major Pain to Production

Production runs on a DigitalOcean droplet at **https://majorpain.devinhansen.com**, shared with Brocation. The app uses Next.js `next start` on port 3001, managed by PM2, behind Nginx.

---

## Deploy (CI — preferred)

Build runs in GitHub Actions; the server receives pre-built artifacts. **~30–60 seconds** on the server (no local Next.js build).

### 1. Push your changes

```powershell
git add -A
git commit -m "Your commit message"
git push origin master
```

### 2. Deploy when ready

Go to **GitHub → Actions → Deploy to production** → **Run workflow**. Choose the branch (default: `master`) and click **Run workflow**.

No auto-deploy on push—you decide when to deploy.

### One-time setup: GitHub secrets

Add these to **Settings → Secrets and variables → Actions**:

| Secret                      | Value                                           |
|-----------------------------|-------------------------------------------------|
| `DEPLOY_HOST`               | `157.230.172.202` (or your droplet IP)          |
| `SSH_PRIVATE_KEY`           | Contents of your `~/.ssh/id_ed25519` (or equivalent) |
| `MAJOR_PAIN_WRITE_SECRET`   | Same value as `MAJOR_PAIN_WRITE_SECRET` in server `.env` (required for admin/draft writes) |

---

## Deploy (manual fallback)

Use this if CI is unavailable or you need to deploy without pushing.

### 1. Commit and push (local)

```powershell
git add -A
git commit -m "Your commit message"
git push origin master
```

### 2. Run deploy script on server

```powershell
ssh root@157.230.172.202 "cd ~/majorpain && ./deploy.sh"
```

The server script pulls, builds, and restarts. This is slower than CI (~2–5 min) because it builds on the server.

---

## Verify

- Visit https://majorpain.devinhansen.com
- Try the login flow
- Do a quick smoke test (draft, results, season)

---

## Quick reference

| Resource           | Value                               |
|--------------------|-------------------------------------|
| Domain             | https://majorpain.devinhansen.com   |
| Port               | 3001                                |
| Directory          | `~/majorpain`                       |
| Frontend           | `~/majorpain/FrontEnd`              |
| PM2 process        | `major-pain`                        |
| Database           | `major_pain` (PostgreSQL)           |

---

## Troubleshooting

**502 Bad Gateway**

- App likely crashed. Check logs: `pm2 logs major-pain --lines 50`
- Look for missing `prerender-manifest.json` or build errors; re-run `rm -rf .next && npm run build`

**`prerender-manifest.json` missing**

- Usually caused by prerender errors during build (e.g. `useSearchParams` without Suspense)
- Fix the underlying build error and rebuild

**PM2 shows "errored"**

- `pm2 logs major-pain` for the stack trace
- Or run manually: `cd ~/majorpain/FrontEnd && PORT=3001 npm start` (see errors, then Ctrl+C)

**New migrations**

- Run migrations before restart: `cd ~/majorpain/FrontEnd && npm run migrate`
- For schema-only: `cat ~/majorpain/migrations/XXX_name.sql | sudo -u postgres psql -d major_pain`

**Unauthorized when saving (admin, tournament state, draft)**

- The write secret must match between client build and server runtime.
- **CI deploy:** Ensure `MAJOR_PAIN_WRITE_SECRET` is set in GitHub Actions secrets and matches the server `.env`. The workflow bakes it into the client at build time.
- **Manual deploy:** The server build needs both `MAJOR_PAIN_WRITE_SECRET` and `NEXT_PUBLIC_MAJOR_PAIN_WRITE_SECRET` in `FrontEnd/.env` (same value).
- After fixing: run a fresh deploy; client bundles are built at deploy time.

---

## Initial setup (one-time)

The initial deployment (create DB, Nginx, SSL, PM2, env) is documented in the Phase 4 deployment checklist. This file covers **redeploying** an already-configured app.
