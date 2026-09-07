# RoadGuard AI — Production Deployment Guide

Smart Road Safety, Reporting, Prioritization and Accountability Platform  
**Smart India Hackathon 2026 • Problem Statement: MB-04**

---

## 1. Production Architecture Overview

The production architecture separates the compute, persistence, and static delivery layers so that the system remains online 24/7 independently of the developer's laptop:

```
                      ┌─────────────────────────────────────────┐
                      │        End Users & Field Agents         │
                      │   (Mobile Android / iOS / Desktop PWA)  │
                      └────────────────────┬────────────────────┘
                                           │ HTTPS
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │          Frontend Static Host           │
                      │     (Render Static Site / Vercel)       │
                      │   - React 18 SPA + Vite                 │
                      │   - PWA Service Worker & Manifest       │
                      │   - Offline IndexedDB Draft Queue       │
                      └────────────────────┬────────────────────┘
                                           │ REST API (HTTPS)
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │          Backend Web Service            │
                      │       (Render Node.js Web Service)      │
                      │   - Express API (Port assigned by host) │
                      │   - AI Pavement Assessment Engine       │
                      │   - Risk / Priority Engine (IRC specs)  │
                      │   - SLA & Duplicate Detection           │
                      └─────────────┬───────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌─────────────────────────────┐           ┌─────────────────────────────────────┐
│  Production PostgreSQL DB   │           │    Persistent Object Storage        │
│    (Render / Supabase)      │           │   (Cloudinary / Supabase Storage)   │
│ - Prisma ORM                │           │ - Citizen-uploaded road evidence    │
│ - 8 Meerut Road Segments    │           │ - Before/after repair photos        │
│ - 32 Calibrated Incidents   │           │ - Permanent public HTTPS URLs       │
│ - Real-time SLA Timelines   │           └─────────────────────────────────────┘
└─────────────────────────────┘
```

---

## 2. Option A: One-Click Render Blueprint Deployment (Recommended)

Render provides free/starter tiers for PostgreSQL, Node Web Services, and Static Sites, making it ideal for the SIH 2026 Hackathon prototype.

The repository includes a ready-to-use [`render.yaml`](file:///C:/Users/KRRISH/.gemini/antigravity-ide/scratch/roadguard-ai/render.yaml) blueprint:

### Step 1: Push Project to GitHub
1. Initialize git and commit:
   ```bash
   git init
   git add .
   git commit -m "feat: production deployment configuration"
   ```
2. Create a new repository on your GitHub account (`https://github.com/new`, e.g. named `roadguard-ai`).
3. Push your code:
   ```bash
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/roadguard-ai.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy on Render
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** > **Blueprint**.
3. Connect your `roadguard-ai` GitHub repository.
4. Render automatically detects `render.yaml` and provisions:
   - **`roadguard-db`**: Managed PostgreSQL database.
   - **`roadguard-backend`**: Node.js web service running `npm run build && npm run start`.
   - **`roadguard-frontend`**: High-performance static site publishing `./dist` with SPA routing.
5. Click **Apply**.
6. Render builds the database, pushes the Prisma schema, seeds the Meerut dataset, and assigns live HTTPS URLs:
   - Frontend: `https://roadguard-frontend.onrender.com`
   - Backend: `https://roadguard-backend.onrender.com`

---

## 3. Option B: Vercel (Frontend) + Render / Railway (Backend)

If you prefer Vercel for the frontend:

### Backend (Render or Railway):
1. Create a Web Service pointing to `./backend`.
2. Build command: `npm install && npm run build`
3. Start command: `npm run prisma:push && npm run seed && npm start`
4. Environment variables:
   - `DATABASE_URL`: `postgresql://...`
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: `<random-32-char-string>`
   - `FRONTEND_URL`: `https://roadguard-ai.vercel.app`
   - `STORAGE_PROVIDER`: `cloudinary` (optional)
   - `CLOUDINARY_CLOUD_NAME`: `<your_cloud_name>`

### Frontend (Vercel):
1. Import repository on [Vercel](https://vercel.com/new).
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Vite`.
4. Add Environment Variable:
   - `VITE_API_URL`: `https://<YOUR_RENDER_BACKEND_URL>/api`
5. Click **Deploy**. Vercel uses [`vercel.json`](file:///C:/Users/KRRISH/.gemini/antigravity-ide/scratch/roadguard-ai/frontend/vercel.json) to configure SPA deep links and PWA caching headers automatically.

---

## 4. Option C: Docker Container Deployment

For private servers, VPS (DigitalOcean, AWS EC2), or local container clusters:
```bash
docker-compose up -d --build
```
This boots:
- PostgreSQL on `localhost:5432`
- Express API on `localhost:5000`
- Nginx + Frontend PWA on `localhost:80`

---

## 5. Production Environment Variables Reference

| Variable | Service | Purpose | Example |
|---|---|---|---|
| `PORT` | Backend | Port listened to by web service | `5000` (auto-assigned by host) |
| `NODE_ENV` | Backend | Environment flag | `production` |
| `DATABASE_URL` | Backend | PostgreSQL connection string | `postgresql://user:pass@host:5432/roadguard_ai?schema=public` |
| `JWT_SECRET` | Backend | Cryptographic secret for citizen & authority JWTs | `a-strong-random-32-character-secret` |
| `FRONTEND_URL` | Backend | Allowed CORS origin(s) | `https://roadguard-frontend.onrender.com` |
| `AI_PROVIDER` | Backend | Pavement inspection AI mode | `demo` (offline calibrated) or `gemini` |
| `STORAGE_PROVIDER` | Backend | Object storage provider | `cloudinary` or `supabase` or `local` |
| `CLOUDINARY_CLOUD_NAME` | Backend | Cloudinary cloud name | `your-cloud-name` |
| `VITE_API_URL` | Frontend | Backend API base URL for browser | `https://roadguard-backend.onrender.com/api` |

---

## 6. Verifying Production PWA & Offline Functionality

Once deployed to HTTPS:
1. Open your production frontend URL on an Android phone in Google Chrome.
2. Notice the browser address bar presents the install icon or menu item:
   **"Install RoadGuard AI"**.
3. Tap **Install** to add RoadGuard AI to your mobile home screen with the official icon.
4. Launch the standalone app:
   - Zero browser navigation bar (runs full-screen standalone).
   - Test offline mode: Turn on Airplane Mode; the app shell and cached map tiles load instantly.
   - Capture a road issue offline; the app stores it locally as **Pending Sync**.
   - Turn off Airplane Mode; tap **Sync Now** to upload citizen evidence and begin AI distress analysis.
