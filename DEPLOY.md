# Eman Clinic – Deployment Guide (Yegar Host / cPanel)

This guide covers deploying the Eman Clinic Next.js app to Yegar Host shared hosting (cPanel with CloudLinux Passenger).

---

## Prerequisites

- Node.js 22.x on the server
- MongoDB Atlas connection string
- Clerk production instance (production keys)
- Subdomain: `emc.seidweb.com`

---

## 1. Build & Prepare Deploy Folder (Local)

Run these commands in **Git Bash** from the project root:

```bash
cd ~/Desktop/Eman-Clinic

# Build the app
npm run build

# Create deploy folder
rm -rf deploy
mkdir -p deploy

# Copy standalone output (note: * does NOT include hidden .next folder)
cp -r .next/standalone/* deploy/

# Copy .next explicitly (required - hidden folder is skipped by *)
cp -r .next/standalone/.next deploy/

# Remove node_modules (CloudLinux manages this via Run NPM Install)
rm -rf deploy/node_modules

# Copy static assets
mkdir -p deploy/.next/static
cp -r .next/static/* deploy/.next/static/

# Copy public folder
cp -r public deploy/
```

### Verify before zipping

```bash
ls -la deploy/.next/
```

You should see: `BUILD_ID`, `server/`, `static/`, and manifest files.

---

## 2. Create Zip

**Option A – Git Bash:**
```bash
zip -r eman-clinic-deploy.zip deploy/ -x "*.git*"
```

**Option B – Manual:** Right-click `deploy` folder → **Compress to ZIP file**.

---

## 3. Upload to cPanel

1. Open **cPanel** → **File Manager**
2. Go to `/home/seidweyg/emc.seidweb.com`
3. Enable **Show Hidden Files** (Settings → Show Hidden Files)
4. Upload `eman-clinic-deploy.zip`
5. Right-click zip → **Extract**
6. Move all contents from `deploy/` into the app root (`emc.seidweb.com`)
7. Delete empty `deploy` folder and `eman-clinic-deploy.zip`

---

## 4. Server Configuration

### A. Run NPM Install

1. Open **Setup Node.js App**
2. Select app `emc.seidweb.com`
3. Click **Run NPM Install**

### B. Create `start.sh`

Create `/home/seidweyg/emc.seidweb.com/start.sh`:

```bash
#!/bin/bash
cd /home/seidweyg/emc.seidweb.com
exec node server.js
```

Set permissions to **755**.

### C. Create `.htaccess`

Create `/home/seidweyg/emc.seidweb.com/.htaccess`:

```apache
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
PassengerAppRoot "/home/seidweyg/emc.seidweb.com"
PassengerBaseURI "/"
PassengerNodejs "/home/seidweyg/nodevenv/emc.seidweb.com/22/bin/node"
PassengerAppType node
PassengerStartupFile start.sh
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END
```

### D. Restart App

In **Setup Node.js App** → Click **Restart**

---

## 5. Environment Variables (cPanel)

Ensure these are set in **Setup Node.js App** → Environment variables:

| Variable | Description |
|----------|-------------|
| `MONGODB_URL` | MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | `eman_clinic` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` |
| `CLERK_SECRET_KEY` | `sk_live_...` |
| `CLERK_WEBHOOK_SECRET` | `whsec_...` |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |
| `NEXT_PUBLIC_APP_URL` | `https://emc.seidweb.com` |

---

## 6. Clerk Production Checklist

- [ ] Production instance created
- [ ] DNS records verified (5/5 CNAME)
- [ ] Webhook: `https://emc.seidweb.com/api/webhooks/clerk`
- [ ] Allowed subdomains configured (if applicable)
- [ ] Social login (Google, GitHub) credentials added

---

## Troubleshooting

| Error | Solution |
|------|----------|
| 403 Forbidden | Restore `.htaccess` with Passenger config |
| 503 Service Unavailable | Check `stderr.log`; ensure `.next` has BUILD_ID and server/ |
| "Could not find .next" | Re-upload with `cp -r .next/standalone/.next deploy/` |
| "node_modules not allowed" | Delete `node_modules` from deploy, run NPM Install on server |
| npm ERESOLVE | Add `.npmrc` with `legacy-peer-deps=true` in `emc.seidweb.com` |

---

## Quick Deploy Script (Local)

```bash
# Full deploy preparation
cd ~/Desktop/Eman-Clinic
npm run build
npm run deploy:prepare   # Or run the commands in section 1 manually
zip -r eman-clinic-deploy.zip deploy/ -x "*.git*"
```

Or run manually (see section 1 above).

---

## Live URL

**https://emc.seidweb.com**

---

*Last updated: March 2026*
