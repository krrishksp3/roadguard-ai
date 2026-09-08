import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

from doc_helpers import (
    set_cell_background,
    set_cell_margins,
    set_table_borders,
    add_callout,
    format_row,
    add_custom_heading,
    add_body_p,
    add_bullet_p,
    add_code_block,
)

def render_section_8_to_15(doc):
    # SECTION 8: KEY FEATURES
    add_custom_heading(doc, "8. Key Features & Implementation Matrix", level=1)
    add_body_p(doc, "The following matrix details all functional modules implemented in ROADGUARD AI, contrasting operational features with planned future enhancements:")
    
    features_data = [
        ("Feature Module", "Functional Capability & Technical Mechanism", "Status / Module"),
        ("Citizen Road Reporting", "Mobile-optimized reporting interface with damage classification, description, and client-side validation.", "Implemented / Frontend"),
        ("Camera & Gallery Input", "Direct device camera capture or local photo selection with real-time thumbnail preview and zoom modal.", "Implemented / Frontend"),
        ("Geospatial Geocoding", "HTML5 Geolocation API with accuracy meter, reverse address resolution, and interactive draggable Leaflet pin.", "Implemented / Frontend & Leaflet"),
        ("Interactive City Map", "Dynamic OpenStreetMap with color-coded severity markers, cluster tooltips, and road segment overlays.", "Implemented / Frontend & Leaflet"),
        ("AI Image Quality Check", "Pre-submission optical inspection evaluating blur, darkness, road presence, and technical clarity score.", "Implemented (Demo Heuristic + Cloud API)"),
        ("AI Damage Classification", "IRC-aligned classification (pothole, alligator crack, surface erosion, waterlogging, edge scour).", "Implemented (Demo Heuristic + Cloud API)"),
        ("Dynamic Road Risk Engine", "Multi-factor algorithm (0-100) scoring severity, safety risk, transit corridor class, density, recurrence, and SLA.", "Implemented / Backend Priority"),
        ("Spatial Deduplication", "Haversine proximity check (<=80m + matching damage type in 14 days) merging duplicate reports.", "Implemented / Backend Duplicate"),
        ("Incident Clustering", "Spatial radius clustering (<=150m) aggregating report density to detect localized structural corridors.", "Implemented / Backend Duplicate"),
        ("Road Segment Health", "Segment-level health index (0-100) factoring open complaints, critical failures, and historical recurrence.", "Implemented / Backend Health"),
        ("Authority Dashboard", "Role-gated operational console with KPI metrics, risk-sorted worklists, and workflow progression tools.", "Implemented / Frontend Authority"),
        ("SLA Urgency Tracking", "Dynamic resolution countdowns (24h to 240h) based on severity, with automated overdue alerts.", "Implemented / Backend SLA"),
        ("Before/After Photo Verification", "Side-by-side photographic evidence viewer enforcing before/after visual proof for all closed repairs.", "Implemented / Frontend & Backend"),
        ("AI Repair Verification", "Visual improvement scoring (0-100), location match confidence, and automated PASS/REINSPECT recommendation.", "Implemented / Backend Verification"),
        ("Public Tender Intelligence", "Cross-references road segments against public procurement tenders, contractors, and Defect Liability Periods.", "Implemented (Demo/Synthetic Dataset)"),
        ("JWT Authentication & RBAC", "Role-Based Access Control enforcing CITIZEN, AUTHORITY, and ADMIN role boundaries using bcrypt & JWT.", "Implemented / Backend Auth"),
        ("PWA & Offline Capability", "Service worker precaching (39 assets) + IndexedDB offline draft storage with auto-sync on reconnect.", "Implemented / PWA & Service Worker"),
        ("Cloud & Local Storage", "Pluggable file storage supporting Cloudinary, Supabase Storage buckets, and local disk fallback.", "Implemented / Backend Storage"),
        ("On-Device Edge Vision (YOLOv8)", "Real-time edge neural network inference directly on browser canvas via WebAssembly/TensorFlow.js.", "Future Enhancement / Planned Feature"),
        ("Automated Municipal ERP Sync", "Direct webhook integration with state municipal ERPs (e.g., e-NagarSewa UP, CPGRAMS API).", "Future Enhancement / Planned Feature"),
        ("Accelerometer Pothole Sensing", "Continuous vehicular telematics detecting road anomalies via smartphone gyroscope & accelerometer.", "Future Enhancement / Planned Feature"),
    ]
    
    tbl_feat = doc.add_table(rows=len(features_data), cols=3)
    tbl_feat.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_feat.autofit = False
    
    for idx, (f_mod, f_desc, f_stat) in enumerate(features_data):
        row = tbl_feat.rows[idx]
        row.cells[0].width = Inches(1.8)
        row.cells[1].width = Inches(3.2)
        row.cells[2].width = Inches(1.5)
        row.cells[0].paragraphs[0].text = f_mod
        row.cells[1].paragraphs[0].text = f_desc
        row.cells[2].paragraphs[0].text = f_stat
        format_row(row, is_header=(idx == 0), is_alt=(idx % 2 == 1 and idx > 0))
        
    set_table_borders(tbl_feat, "CBD5E1")
    add_body_p(doc, "", space_after=4)

    # SECTION 9: USER ROLES
    add_custom_heading(doc, "9. User Roles & Access Control", level=1)
    add_body_p(doc, "ROADGUARD AI enforces strict Role-Based Access Control (RBAC) defined in the Prisma schema and enforced via Express middleware (`requireRoles`). Three distinct actor roles exist within the system:")
    
    add_bullet_p(doc, "Any member of the public can register with an email and phone number. Capabilities: Submit geo-tagged road damage complaints, upload photos, receive AI quality and damage feedback, view personal complaint history (`/my-reports`), track real-time resolution timelines, view public city road health, and inspect public tender data. Permissions: Read-only access to city reports, write access only to self-authored drafts and complaints.", bold_prefix="1. Citizen (Role: CITIZEN): ")
    add_bullet_p(doc, "Designated municipal officers (e.g., Executive Engineers, Assistant Engineers, Junior Engineers) attached to specific departments (UP PWD, Nagar Nigam, NHAI). Capabilities: Access the Authority Operations Dashboard (`/authority`), inspect the priority-sorted complaint queue, filter by jurisdiction and severity, transition report status (IN_REVIEW -> ASSIGNED -> IN_PROGRESS -> REPAIRED), upload official 'After-Repair' photographic proof, trigger AI repair verification, and provide human-in-the-loop closure approvals.", bold_prefix="2. Municipal Authority / Engineer (Role: AUTHORITY): ")
    add_bullet_p(doc, "Departmental system administrators overseeing municipal zones. Capabilities: Manage department registries, configure default SLA turnaround targets, manage road segment spatial definitions, review audit logs, and oversee tender intelligence linkages.", bold_prefix="3. System Administrator (Role: ADMIN): ")

    # SECTION 10: SYSTEM ARCHITECTURE
    add_custom_heading(doc, "10. End-to-End System Architecture", level=1)
    add_body_p(doc, "ROADGUARD AI adopts a decoupled, multi-tier client-server architecture engineered for horizontal scalability, cloud-agnostic deployment, and high operational resilience. The architecture consists of four distinct operational layers:")
    
    add_code_block(doc,
"""+---------------------------------------------------------------------------------------------------------+
|                                    ROADGUARD AI SYSTEM ARCHITECTURE                                     |
+---------------------------------------------------------------------------------------------------------+
  CLIENT LAYER (Progressive Web Application)
  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
  │  React 18 SPA (Vite 6, TypeScript, Tailwind CSS, React Router v6, Lucide Icons, Recharts)           │
  │  ├── Core PWA Subsystem: Service Worker (Workbox precaching 39 assets, offline app shell)           │
  │  ├── Geospatial Subsystem: Leaflet, React-Leaflet, OpenStreetMap Tile Providers, GPS Geolocation   │
  │  └── Client Offline Engine: IndexedDB Storage ('roadguard_offline_db') + Auto Sync Drainer         │
  └───────────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                      │ HTTPS / REST JSON Requests (Axios / Fetch)
                                                      ▼
  API GATEWAY & MIDDLEWARE LAYER
  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
  │  Node.js + Express REST API Server (TypeScript, tsx/tsc)                                            │
  │  ├── Security & Transport: CORS Whitelist, Helmet Security Headers, JSON Body Parser                │
  │  ├── Authentication: Stateless JWT Verification Middleware (HMAC-SHA256, 7-day expiry)              │
  │  ├── Role-Based Access Control (RBAC): requireRoles(['AUTHORITY', 'ADMIN']) Route Guards            │
  │  └── Ingestion & Sanitization: Multer Multipart Middleware (10MB limit, JPG/PNG/WebP MIME filter)   │
  └───────────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                      │
                                                      ▼
  APPLICATION DOMAIN & INTELLIGENCE SERVICES
  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
  │  ├── AIService: Multi-Provider Router (DemoAIProvider / GeminiProvider / OpenAIProvider)            │
  │  ├── RoadRiskEngine: 6-Factor Dynamic Prioritization Calculator (0-100 Score & Explanations)       │
  │  ├── DuplicateDetector: Haversine Distance (<=80m duplicate, <=150m density cluster)               │
  │  ├── RoadHealthService: Segment Health Aggregator (0-100) & Chronic Hotspot Registry                │
  │  ├── SLAService: Dynamic Turnaround Engine (24h to 240h) & Overdue Evaluation Logic                 │
  │  ├── VerificationService: Before/After Computer Vision Comparison & Sign-Off Orchestrator           │
  │  ├── JurisdictionService: Spatial Snapping to UP PWD / Nagar Nigam / NHAI Divisions                 │
  │  └── StorageService: Pluggable Object Storage (Cloudinary / Supabase Bucket / Local Disk Fallback)  │
  └───────────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                      │
                                                      ▼
  DATA PERSISTENCE & STORAGE TIER
  ┌───────────────────────────────────────────────┐   ┌─────────────────────────────────────────────────┐
  │  Relational Database Tier (Prisma ORM 5.22)   │   │  Object Storage Tier (Media Assets)             │
  │  ├── Local Development: SQLite (dev.db)      │   │  ├── Production Cloud: Cloudinary / Supabase    │
  │  ├── Production Deployment: PostgreSQL 16    │   │  └── Local Development: /uploads Directory     │
  │  └── 10 Domain Models & Relational Indexes    │   │      (Static Express Media Server)              │
  └───────────────────────────────────────────────┘   └─────────────────────────────────────────────────┘
+---------------------------------------------------------------------------------------------------------+""")

    # SECTION 11: TECHNOLOGY STACK
    add_custom_heading(doc, "11. Comprehensive Technology Stack", level=1)
    add_body_p(doc, "Every technology utilized in ROADGUARD AI was chosen based on production stability, developer velocity, type-safety, and offline resilience:")
    
    stack_data = [
        ("Layer / Component", "Technology / Library", "Version", "Technical Purpose in ROADGUARD AI"),
        ("Frontend Framework", "React", "18.3.1", "Declarative component-based UI rendering with Virtual DOM."),
        ("Frontend Build Tool", "Vite", "6.0.3", "Ultra-fast ESM bundler with Hot Module Replacement and production rollup."),
        ("Language (Full Stack)", "TypeScript", "5.7.2", "Static type checking across frontend, backend, and shared domain models."),
        ("Styling Framework", "Tailwind CSS", "3.4.16", "Utility-first CSS framework providing sleek modern dark/light styling."),
        ("Icons & Visuals", "Lucide React", "0.468.0", "Tree-shakable SVG civic iconography for road hazards and dashboards."),
        ("Interactive Maps", "Leaflet & React-Leaflet", "1.9.4 / 4.2.1", "Mobile-optimized slippy mapping with OpenStreetMap tiles."),
        ("Charts & Analytics", "Recharts", "2.15.0", "Declarative SVG charting library for road health distribution and trends."),
        ("PWA Subsystem", "vite-plugin-pwa & Workbox", "1.3.0", "Service Worker generation, manifest management, and 39-asset precaching."),
        ("Client Offline DB", "IndexedDB API", "Native W3C", "Browser-native transactional NoSQL storage for offline report drafting."),
        ("Backend Runtime", "Node.js", "20.x LTS", "High-throughput asynchronous event-driven JavaScript server runtime."),
        ("HTTP Server Framework", "Express", "4.21.2", "Lightweight, unopinionated routing framework for RESTful API endpoints."),
        ("Database ORM", "Prisma ORM", "5.22.0", "Type-safe database client, schema migrations, and parameterized query execution."),
        ("Relational Databases", "SQLite / PostgreSQL", "3.x / 16.x", "SQLite for local zero-config dev; PostgreSQL for production cloud deployment."),
        ("File Uploads", "Multer", "1.4.5-lts.1", "Streaming multipart/form-data handler with 10MB memory and disk limits."),
        ("Authentication & Security", "bcryptjs & jsonwebtoken", "2.4.3 / 9.0.2", "Secure password hashing (10 salt rounds) and stateless signed JWTs."),
        ("Data Validation", "Zod", "3.24.1", "Runtime schema validation for AI JSON inference and client request payloads."),
        ("Cloud Object Storage", "Cloudinary & Supabase SDKs", "REST APIs", "Off-server persistent media hosting for citizen before/after photographs."),
        ("Testing Suite", "Jest & ts-jest", "29.7.0 / 29.2.5", "Unit and integration testing framework for API routes and priority engines."),
        ("Cloud Deployment", "Render Blueprint (render.yaml)", "Current Spec", "Infrastructure-as-Code multi-service deployment for Node, PWA, and Postgres."),
    ]
    
    tbl_stk = doc.add_table(rows=len(stack_data), cols=4)
    tbl_stk.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_stk.autofit = False
    
    for idx, (layer, tech, ver, purp) in enumerate(stack_data):
        row = tbl_stk.rows[idx]
        row.cells[0].width = Inches(1.3)
        row.cells[1].width = Inches(1.5)
        row.cells[2].width = Inches(0.8)
        row.cells[3].width = Inches(2.9)
        row.cells[0].paragraphs[0].text = layer
        row.cells[1].paragraphs[0].text = tech
        row.cells[2].paragraphs[0].text = ver
        row.cells[3].paragraphs[0].text = purp
        format_row(row, is_header=(idx == 0), is_alt=(idx % 2 == 1 and idx > 0))
        
    set_table_borders(tbl_stk, "CBD5E1")
    add_body_p(doc, "", space_after=4)

    # SECTION 12: FRONTEND ARCHITECTURE
    add_custom_heading(doc, "12. Frontend Architecture & Modular Design", level=1)
    add_body_p(doc, "The ROADGUARD AI frontend is organized as a single-page application (SPA) structured around modular functional domains. The application emphasizes responsive mobile-first ergonomics, reactive state synchronization, and progressive offline enhancement:")
    
    add_bullet_p(doc, "The application lifecycle is anchored by React 18 Concurrent features and structured routing via `react-router-dom` v6. Routes are partitioned into public discovery views (`/`, `/map`, `/tenders`, `/road-health`), citizen workflows (`/report`, `/my-reports`, `/reports/:id`), and restricted administrative consoles (`/authority`).", bold_prefix="Modular Component Hierarchy: ")
    add_bullet_p(doc, "Global session state is governed via `AuthContext.tsx`, exposing reactive user profiles, login/logout actions, and role flags (`isAuthority`, `isAdmin`). Real-time network connectivity is observed via window event listeners (`online`/`offline`), propagating state to the `offlineSync` service.", bold_prefix="State & Context Architecture: ")
    add_bullet_p(doc, "Located in `src/services/api.ts`, a centralized HTTP client wraps browser Fetch calls, automatically attaching Bearer JWT tokens, intercepting authentication failures, and standardizing server error responses.", bold_prefix="API Abstraction Layer: ")
    add_bullet_p(doc, "Built using Leaflet and React-Leaflet with custom SVG marker icons. Supports hardware GPS acquisition, interactive draggable marker positioning, and zoom boundaries focused on Meerut coordinates (`[28.9845, 77.7064]`).", bold_prefix="Geospatial Mapping Subsystem: ")
    add_bullet_p(doc, "Engineered in `src/services/offlineSync.ts` using the browser IndexedDB API (`roadguard_offline_db`). When offline, report submissions are stored locally with base64 image data and queued with `PENDING_SYNC` status. Upon reconnect, an automatic background drainer uploads photos, submits reports, and broadcasts live progress.", bold_prefix="Offline Storage & Background Sync: ")

    add_body_p(doc, "Actual Frontend Directory Structure:", bold_prefix=None)
    add_code_block(doc,
"""frontend/
├── public/
│   ├── favicon.ico
│   ├── icon-192.png
│   ├── icon-512.png
│   └── manifest.webmanifest      # PWA App Manifest
├── src/
│   ├── assets/                   # Static logos and graphic assets
│   ├── components/
│   │   ├── ai/                   # AI Image Quality Preview & Diagnostic Cards
│   │   ├── dashboard/            # Authority Metric KPI Cards & Priority Tables
│   │   ├── layout/               # Navbar, Footer, Mobile Navigation Bar
│   │   ├── map/                  # Leaflet MapContainer, DraggablePin, ClusterMarkers
│   │   ├── offline/              # Offline Indicator Banner & Sync Status Badge
│   │   ├── pwa/                  # PWA Install Prompt & Service Worker Update Banner
│   │   ├── reports/              # Report Cards, Filter Bars, Damage Selectors
│   │   ├── tender/               # Public Tender Cards & DLP Warranty Badges
│   │   ├── timeline/             # Status Timeline Event Flow & Activity Trackers
│   │   ├── ui/                   # Modal, Button, Badge, Card, Spinner Atoms
│   │   ├── upload/               # Camera/Gallery Selector, Image Zoom Modal
│   │   └── verification/         # Dual-Photo Before/After Slider & Match Scorecard
│   ├── context/
│   │   └── AuthContext.tsx       # Global JWT Session & Role State
│   ├── pages/
│   │   ├── LandingPage.tsx       # Public Civic Hero & Feature Showcase
│   │   ├── LoginPage.tsx         # Citizen & Authority Login with Demo Quick-Buttons
│   │   ├── RegisterPage.tsx      # User Registration Form
│   │   ├── CreateReportPage.tsx  # Mobile-First Damage Reporting Workflow
│   │   ├── MyReportsPage.tsx     # Citizen Personal Dashboard & Offline Sync Queue
│   │   ├── ReportDetailPage.tsx  # In-Depth Complaint Inspection & Evidence Viewer
│   │   ├── AuthorityDashboard.tsx# Municipal Engineer Operations Console
│   │   ├── PublicMapPage.tsx     # Full-Screen Interactive City Incident Map
│   │   ├── TenderIntelligencePage.tsx # Public Civil Tenders & DLP Matrix
│   │   └── RoadHealthPage.tsx    # Municipal Road Segment Health Scorecards
│   ├── services/
│   │   ├── api.ts                # Centralized REST Client with JWT Interceptors
│   │   └── offlineSync.ts        # IndexedDB Storage Engine & Auto Sync Drainer
│   ├── App.tsx                   # Route Definitions & Provider Wiring
│   ├── index.css                 # Tailwind Directives & Custom Scrollbars
│   └── main.tsx                  # React DOM Root Entrypoint
├── vite.config.ts                # Vite Configuration with VitePWA Plugin
└── package.json                  # Frontend Dependencies & Scripts""")

    # SECTION 13: BACKEND ARCHITECTURE
    add_custom_heading(doc, "13. Backend Architecture & Controller Pipeline", level=1)
    add_body_p(doc, "The ROADGUARD AI backend is an enterprise-grade RESTful API service built on Node.js, Express, and TypeScript. The application enforces a strict separation of concerns across Routes, Controllers, Domain Services, and Data Access Layers:")
    
    add_bullet_p(doc, "Centralized in `src/server.ts`. Configures CORS, sets up JSON body parsers, mounts static media handlers for `/uploads`, binds API routers under `/api/*`, and attaches a centralized error handling middleware that intercepts Multer file size errors, Zod validation issues, and database constraint violations.", bold_prefix="Express Server Core: ")
    add_bullet_p(doc, "Organized in `src/routes/` with clean domain partitioning: `authRoutes`, `reportRoutes`, `uploadRoutes`, `roadHealthRoutes`, `tenderRoutes`, `verificationRoutes`, `departmentRoutes`, `analyticsRoutes`, and `notificationRoutes`.", bold_prefix="Modular Route Dispatchers: ")
    add_bullet_p(doc, "Implemented in `src/controllers/`. Responsible for extracting query/body parameters, validating payloads with Zod schemas, orchestrating business domain calls, and returning consistent HTTP JSON envelopes (`{ success: true, data: ... }`).", bold_prefix="Controller Layer: ")
    add_bullet_p(doc, "Encapsulates all civic engineering business logic into isolated, testable single-responsibility classes (`AIService`, `RoadRiskEngine`, `DuplicateDetector`, `RoadHealthService`, `SLAService`, `VerificationService`, `JurisdictionService`, `StorageService`).", bold_prefix="Domain Service Layer: ")
    add_bullet_p(doc, "Powered by Prisma Client (`src/config/prisma.ts`), providing type-safe parameterized SQL execution, automated connection pooling, and resilient transaction management.", bold_prefix="Database & ORM Tier: ")

    add_body_p(doc, "Actual Backend Directory Structure:", bold_prefix=None)
    add_code_block(doc,
"""backend/
├── prisma/
│   ├── schema.prisma             # Complete Relational Database Schema (10 Models)
│   └── seed.ts                   # Authentic Meerut Calibration & Synthetic Seed Data
├── scripts/
│   └── prepare-prisma.js         # Cross-Platform SQLite/PostgreSQL Switcher Script
├── src/
│   ├── config/
│   │   └── prisma.ts             # Prisma Client Singleton Instance
│   ├── controllers/
│   │   ├── analyticsController.ts# Municipal Analytics KPI Aggregators
│   │   ├── authController.ts     # User Registration, Login & Profile Handlers
│   │   ├── reportController.ts   # Report Ingestion, Triage & Status Progression
│   │   ├── roadHealthController.ts # Road Segment Health Metrics & Hotspot Queries
│   │   ├── tenderController.ts   # Public Civil Tender Directory Queries
│   │   └── verificationController.ts # AI Repair Verification & Decision Handlers
│   ├── middleware/
│   │   ├── authMiddleware.ts     # JWT Extraction & Role Guarding (requireRoles)
│   │   └── errorMiddleware.ts    # Centralized HTTP Error & Exception Interceptors
│   ├── routes/
│   │   ├── analyticsRoutes.ts    # /api/analytics
│   │   ├── authRoutes.ts         # /api/auth
│   │   ├── departmentRoutes.ts   # /api/departments
│   │   ├── notificationRoutes.ts # /api/notifications
│   │   ├── reportRoutes.ts       # /api/reports
│   │   ├── roadHealthRoutes.ts   # /api/road-health
│   │   ├── tenderRoutes.ts       # /api/tenders
│   │   ├── uploadRoutes.ts       # /api/upload
│   │   └── verificationRoutes.ts # /api/verification
│   ├── services/
│   │   ├── ai/                   # AIService, DemoAIProvider, Gemini, OpenAI, Schemas
│   │   ├── duplicate/            # DuplicateDetector (Haversine & Radius Clustering)
│   │   ├── jurisdiction/         # JurisdictionService (Spatial Department Snapping)
│   │   ├── notification/         # NotificationService (In-App Alert Dispatcher)
│   │   ├── priority/             # RoadRiskEngine (6-Factor Mathematical Prioritizer)
│   │   ├── roadHealth/           # RoadHealthService (Health Index Recalculator)
│   │   ├── sla/                  # SLAService (Target Hours & Overdue Computations)
│   │   ├── storage/              # StorageService (Cloudinary / Supabase / Local)
│   │   ├── tender/               # TenderService (Contractor & DLP Matrix)
│   │   └── verification/         # VerificationService (Before/After AI Inspection)
│   └── server.ts                 # Express Server Bootstrapper & Static Host
├── tests/
│   ├── ai.test.ts                # AI Provider Schema & IRC Output Tests
│   ├── api.test.ts               # Core HTTP API Endpoint Tests
│   └── priority.test.ts          # Road Risk Engine Weighting & Ranking Tests
└── package.json                  # Backend Scripts, Dependencies & Jest Config""")

    # SECTION 14: DATABASE DESIGN
    add_custom_heading(doc, "14. Relational Database Design & Schema Models", level=1)
    add_body_p(doc, "The database schema is defined in Prisma ORM (`backend/prisma/schema.prisma`). It comprises 10 relational entities supporting multi-role authentication, municipal hierarchy, road segments, public tenders, citizen reports, AI diagnostics, dynamic priority breakdowns, dual-photo repair verification, and timeline audits:")
    
    models_data = [
        ("Entity Name", "Primary Purpose & Role in System", "Key Fields & Relationships"),
        ("User", "Stores registered citizens, municipal engineers, and admins.", "id, email, passwordHash, name, role (CITIZEN/AUTHORITY/ADMIN), departmentId, reports, assignedReports."),
        ("Department", "Municipal bodies (UP PWD, Nagar Nigam Meerut, NHAI PIU).", "id, code (e.g. PWD_MRT), name, jurisdiction, nodalOfficer, contactEmail, slaDaysDefault, roadSegments, tenders."),
        ("RoadSegment", "Physical road corridors (e.g. Jail Chungi Road, MRT-RD-01).", "id, code, name, startLat/Lng, endLat/Lng, lengthKm, departmentId, healthScore (0-100), recurringDamageCount, isRecurringHotspot."),
        ("Tender", "Public works civil procurement contracts & DLP warranties.", "id, tenderId, roadName, workDescription, departmentId, roadSegmentId, tenderValue, workPeriod, tenderStatus, contractor, contractorStatus, DLP."),
        ("RoadReport", "Core incident entity storing citizen damage complaints.", "id, clientReportId, userId, imageUrl, additionalImages, evidenceSource, lat, lng, address, damageType, severity, status, riskScore, isDuplicate, slaDueAt."),
        ("AIAnalysis", "Computer vision diagnostic results & IRC action steps.", "id, reportId, damageType, severity, confidence, roadSafetyRisk, description, recommendedAction, isAcceptableQuality, qualityScore, isBlurry, isTooDark."),
        ("PriorityAssessment", "Mathematical breakdown of 6-factor risk score.", "id, reportId, overallScore (0-100), riskLevel (LOW/MED/HIGH/CRIT), severityScore, safetyRiskScore, densityScore, roadImportanceScore, recurrenceScore, slaUrgencyScore, explanation."),
        ("RepairVerification", "Dual-photo before/after repair inspection records.", "id, reportId, beforeImageUrl, afterImageUrl, locationMatchConfidence, visibleImprovementScore, remainingDamageScore, overallConfidence, recommendation, authorityDecision."),
        ("StatusTimelineEvent", "Immutable audit trail of complaint lifecycle changes.", "id, reportId, status, label, description, timestamp, actorRole, actorName, notes."),
        ("Notification", "In-app notifications for citizens and municipal staff.", "id, userId, title, message, reportId, isRead, type (INFO, ASSIGNMENT, SLA_ALERT, VERIFICATION, RESOLUTION)."),
        ("SyncQueueMetadata", "Tracks client-side offline sync attempts and retries.", "id, clientReportId, status (PENDING_SYNC/SYNCING/SYNCED/FAILED), attempts, lastError."),
    ]
    
    tbl_db = doc.add_table(rows=len(models_data), cols=3)
    tbl_db.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_db.autofit = False
    
    for idx, (m_name, m_purp, m_flds) in enumerate(models_data):
        row = tbl_db.rows[idx]
        row.cells[0].width = Inches(1.5)
        row.cells[1].width = Inches(2.2)
        row.cells[2].width = Inches(2.8)
        row.cells[0].paragraphs[0].text = m_name
        row.cells[1].paragraphs[0].text = m_purp
        row.cells[2].paragraphs[0].text = m_flds
        format_row(row, is_header=(idx == 0), is_alt=(idx % 2 == 1 and idx > 0))
        
    set_table_borders(tbl_db, "CBD5E1")
    add_body_p(doc, "", space_after=4)

    # SECTION 15: API DOCUMENTATION
    add_custom_heading(doc, "15. REST API Documentation & Endpoints", level=1)
    add_body_p(doc, "The backend exposes a structured, RESTful API interface operating over JSON payloads and multipart media uploads. All protected routes require a standard Bearer JWT token passed in the `Authorization` HTTP header:")
    
    apis_data = [
        ("Method", "Endpoint Route", "Purpose & Operation", "Auth / Roles", "Request / Response Summary"),
        ("POST", "/api/auth/register", "Register new citizen or engineer.", "Public", "Body: { email, password, name, phone, role } -> Token & User profile"),
        ("POST", "/api/auth/login", "Authenticate existing user session.", "Public", "Body: { email, password } -> Token, User profile, role flags"),
        ("GET", "/api/auth/profile", "Retrieve active authenticated profile.", "JWT Required", "Headers: Bearer <token> -> User entity with department details"),
        ("GET", "/api/reports", "List all public road damage reports.", "Public", "Query: status, severity, departmentId, roadSegmentId -> Array of RoadReports"),
        ("GET", "/api/reports/my-reports", "List citizen's personal report history.", "JWT (Citizen)", "Returns user's submitted reports with status, timeline, and risk breakdown"),
        ("GET", "/api/reports/:id", "Retrieve complete report dossier.", "Public", "Params: reportId -> Full report with AIAnalysis, Priority, Verification, Timeline"),
        ("POST", "/api/reports", "Submit new road hazard complaint.", "JWT (Citizen)", "Body: { imageUrl, lat, lng, address, damageTypeHint, description } -> Created Report"),
        ("PATCH", "/api/reports/:id/status", "Advance report maintenance status.", "JWT (Authority)", "Body: { status, notes } -> Updates status, generates timeline audit event"),
        ("POST", "/api/reports/:id/after-photo", "Upload contractor after-repair photo.", "JWT (Authority)", "Body: { afterImageUrl } -> Saves repairAfterImageUrl, triggers verification"),
        ("POST", "/api/upload", "Upload photographic evidence file.", "Public / Citizen", "Multipart: photo/image (<=10MB) -> Returns { url, filename, storageProvider }"),
        ("GET", "/api/road-health", "Fetch all road segment health scores.", "Public", "Returns road segments sorted by health score with open/critical counts"),
        ("GET", "/api/road-health/hotspots", "Fetch recurring damage hotspot list.", "Public", "Returns road segments flagged with isRecurringHotspot = true"),
        ("GET", "/api/road-health/resolve", "Resolve jurisdiction from coordinates.", "Public", "Query: lat, lng -> Nearest road segment, department, and active tender"),
        ("GET", "/api/road-health/:id", "Retrieve detailed road segment dossier.", "Public", "Params: segmentId -> Road segment with historical complaint distribution"),
        ("GET", "/api/tenders", "List all public works tender records.", "Public", "Returns procurement tenders with DLP warranty and contractor status"),
        ("GET", "/api/tenders/:id", "Fetch specific tender contract details.", "Public", "Params: tenderId -> Tender record linked to road segment and department"),
        ("POST", "/api/verification/run", "Execute AI repair comparison on demand.", "JWT (Authority)", "Body: { reportId, afterImageUrl } -> AI before/after match scorecard"),
        ("POST", "/api/verification/:id/decision", "Submit final human authority verdict.", "JWT (Authority)", "Body: { decision: 'APPROVED' | 'REJECTED_REINSPECT', notes } -> Final status"),
        ("GET", "/api/departments", "List municipal department authorities.", "Public", "Returns UP PWD, Nagar Nigam, NHAI with active workload counts"),
        ("GET", "/api/analytics/summary", "Retrieve high-level municipal KPIs.", "Public", "Returns totalReports, resolvedReports, criticalCount, avgRiskScore"),
        ("GET", "/api/notifications", "Retrieve citizen/officer notifications.", "JWT Required", "Returns in-app alert notifications for logged-in user"),
        ("PATCH", "/api/notifications/:id/read", "Mark specific notification as read.", "JWT Required", "Params: notificationId -> Updates isRead = true"),
    ]
    
    tbl_api = doc.add_table(rows=len(apis_data), cols=5)
    tbl_api.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_api.autofit = False
    
    for idx, (mth, ep, purp, auth, sum_io) in enumerate(apis_data):
        row = tbl_api.rows[idx]
        row.cells[0].width = Inches(0.7)
        row.cells[1].width = Inches(1.8)
        row.cells[2].width = Inches(1.5)
        row.cells[3].width = Inches(1.0)
        row.cells[4].width = Inches(1.5)
        row.cells[0].paragraphs[0].text = mth
        row.cells[1].paragraphs[0].text = ep
        row.cells[2].paragraphs[0].text = purp
        row.cells[3].paragraphs[0].text = auth
        row.cells[4].paragraphs[0].text = sum_io
        format_row(row, is_header=(idx == 0), is_alt=(idx % 2 == 1 and idx > 0))
        
    set_table_borders(tbl_api, "CBD5E1")
    doc.add_page_break()

print("Section 8-15 renderer ready.")
