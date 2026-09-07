# RoadGuard AI — Progressive Web App (PWA) Architecture & Guide

Smart Road Safety, Reporting, Prioritization and Accountability Platform  
**Smart India Hackathon 2026 • Problem Statement: MB-04**

---

## 1. Overview

RoadGuard AI is configured as a production-grade Progressive Web Application (PWA). It provides citizens and field road inspectors with an installable, standalone, offline-resilient experience across mobile phones (Android/iOS), tablets, laptops, and desktop computers without sacrificing the web application's existing feature set.

---

## 2. PWA Manifest Configuration

The web application manifest (`manifest.webmanifest`) is configured via `vite-plugin-pwa` in [vite.config.ts](file:///C:/Users/KRRISH/.gemini/antigravity-ide/scratch/roadguard-ai/frontend/vite.config.ts) and served with:

- **Name**: `RoadGuard AI`
- **Short Name**: `RoadGuard`
- **Description**: *"AI-powered smart road safety, reporting, prioritization and accountability platform."*
- **Start URL**: `/`
- **Display**: `standalone` (removes browser URL chrome for native app look & feel)
- **Orientation**: `portrait-primary`
- **Theme Color**: `#0284c7` (Gov Sky Blue)
- **Background Color**: `#f8fafc` (Slate 50)
- **Icons**:
  - `public/icons/icon-192.png` (192x192, any)
  - `public/icons/icon-512.png` (512x512, any)
  - `public/icons/icon-maskable-512.png` (512x512, maskable)
  - `public/icons/icon.svg` (SVG vector)
  - `public/apple-touch-icon.png` (iOS Safari homescreen)
- **Quick Shortcuts**:
  1. *Report Road Distress* (`/report`)
  2. *My Complaints* (`/my-reports`)
  3. *Live Road Map* (`/map`)

---

## 3. Service Worker & Caching Strategy

The service worker is built using Workbox under the `generateSW` strategy. It separates static asset caching from network-only API security:

| Resource Type | Cache Strategy | Cache Name | Max Entries / Expiration | Security / Safety Note |
|---|---|---|---|---|
| **App Shell & Bundles** (`.html`, `.js`, `.css`, `svg`) | Precache on Install (`CacheFirst`) | Workbox Precache v1 | Revision-hashed per build | Ensures zero-latency boot even without network. |
| **API Endpoints** (`/api/*`) | `NetworkOnly` | *None* (Excluded) | 0 | **CRITICAL SECURITY RULE**: Authenticated citizen profiles, JWT tokens, and live authority reports are **NEVER cached in the service worker**. |
| **Evidence Photos** (`/uploads/*`) | `NetworkFirst` | `uploaded-evidence-cache` | 50 entries / 7 days (4s timeout) | Serves cached photos when offline, fetches latest over network. |
| **Map Tiles** (OpenStreetMap) | `CacheFirst` | `osm-tiles` | 200 entries / 7 days | Enables field officers to inspect road maps offline in cached areas. |
| **CDN Libraries** (Leaflet) | `CacheFirst` | `leaflet-cdn-assets` | 20 entries / 30 days | Guarantees mapping scripts load offline. |
| **Google Fonts** (CSS & Webfonts) | `StaleWhileRevalidate` / `CacheFirst` | `google-fonts-*` | 30 webfonts / 1 year | Offline typography rendering. |

---

## 4. Offline-First Reporting Architecture

When a citizen encounters a road hazard with poor or absent mobile network connectivity:

```
[Citizen Captures Photo & GPS Pin]
                │
         [Is Online?]
         ├─── YES ───► [Uploads File + Calls /api/reports] ───► [Server / AI Engine]
         │
         └─── NO (Offline / Weak Link)
                │
                ▼
  [Convert Photo to Local Base64]
                │
                ▼
  [IndexedDB: roadguard_offline_db]
  [Store: pending_reports (id = clientReportId)]
  [Status: 'PENDING_SYNC']
                │
                ▼
  [UI: "Report Queued for Synchronization"]
                │
                ▼
  (User reconnects to Internet / Clicks "Sync Now")
                │
                ▼
  [offlineSync.syncPendingReports()]
  - Uploads evidence photo
  - Submits report with clientReportId
  - Backend performs Idempotency Check (Prevents Duplicate Reports)
  - Removes from IndexedDB on success
  - Live UI updates & notifications
```

### Key Data Fields Stored Locally:
- `id`: Client-generated UUID (`clientReportId`) for idempotency.
- `imageUrl` / `photoBase64`: Captured image stored locally.
- `evidenceSource`: Labeled `'USER_UPLOADED'`, `'LICENSED_EXTERNAL'`, or `'DEMO_SYNTHETIC'`.
- `latitude` & `longitude`: GPS coordinates or manual map placement.
- `address`: Resolved road segment and administrative jurisdiction.
- `description`: Citizen distress description.
- `damageTypeHint`: Citizen observation (pothole, cracking, waterlogging, etc.).
- `status`: `'PENDING_SYNC'` | `'SYNCING'` | `'FAILED'`.

---

## 5. User Interface Integration

1. **Top Navbar Status Pill** ([OfflineIndicator.tsx](file:///C:/Users/KRRISH/.gemini/antigravity-ide/scratch/roadguard-ai/frontend/src/components/pwa/OfflineIndicator.tsx)):
   - Indicates real-time connection state (`Online` vs `Offline`).
   - Displays real-time pending sync count (e.g., `2 Pending Sync`).
   - Provides a one-click manual **"Sync Now"** trigger when reconnected.

2. **Unobtrusive Install Prompt** ([PwaInstallPrompt.tsx](file:///C:/Users/KRRISH/.gemini/antigravity-ide/scratch/roadguard-ai/frontend/src/components/pwa/PwaInstallPrompt.tsx)):
   - Captures `beforeinstallprompt` event without interrupting user workflow.
   - Renders a clean **"Install App"** button in the top navigation header.
   - Hides automatically once installed or dismissed.

3. **My Reports Integration** ([MyReportsPage.tsx](file:///C:/Users/KRRISH/.gemini/antigravity-ide/scratch/roadguard-ai/frontend/src/pages/MyReportsPage.tsx)):
   - Shows a dedicated **"Pending Synchronization"** card section displaying all local offline drafts.
   - Allows users to review, sync, or discard drafts before submission.

---

## 6. How to Test PWA Locally

### Step 1: Ensure Backend and Frontend are Running
```bash
# Backend (Port 5000)
cd backend
npm run dev

# Frontend (Port 5173)
cd frontend
npm run dev
```

### Step 2: Open Application in Chrome / Edge
Open `http://localhost:5173/` in Google Chrome or Microsoft Edge.

### Step 3: Test Web App Manifest & Service Worker in DevTools
1. Press `F12` to open Chrome DevTools.
2. Go to the **Application** tab.
3. Click **Manifest**:
   - Verify name: `RoadGuard AI`
   - Verify icons preview (192x192, 512x512, maskable).
4. Click **Service Workers**:
   - In dev mode, Vite serves the app shell. In production build (`npm run build && npm run preview`), the service worker activates and shows `status: activated and running`.

### Step 4: Test Offline Report Workflow
1. Navigate to `http://localhost:5173/report`.
2. In Chrome DevTools, open the **Network** tab and select **Offline** from the throttling dropdown.
3. Observe the top navigation status change to `OFFLINE`.
4. Capture/select a photo (or pick a Demo Evidence preset), write a description, and click **Submit Report**.
5. RoadGuard AI gracefully catches offline status, saves the draft to IndexedDB, and displays:
   *"Report Queued for Synchronization (Pending Sync)"*.
6. Navigate to `http://localhost:5173/my-reports`.
7. Verify that your report is listed under **"Pending Synchronization"**.
8. In DevTools Network tab, switch back to **No throttling** (Online).
9. Click **"Sync Now"** or let auto-sync run.
10. The draft synchronizes with the backend, triggers AI optical distress analysis, and moves to the live submitted reports list!

---

## 7. Production Deployment Requirements

For production hosting (Vercel, AWS S3/CloudFront, Nginx, or Docker):
1. **HTTPS is Mandatory**: PWAs require a secure context (`https://`) to register Service Workers in production (localhost is exempt for development).
2. **Reverse Proxy Configuration**: Ensure `/api/` requests are proxied to the Node.js Express backend and are not intercepted as static HTML routes.
3. **MIME Types**: Ensure `.webmanifest` is served with `Content-Type: application/manifest+json`.
4. **Cache-Control Headers**:
   - `sw.js`: `Cache-Control: no-cache, no-store, must-revalidate` (ensures users immediately receive updates).
   - `/assets/*`: `Cache-Control: public, max-age=31536000, immutable` (safe for hashed assets).
