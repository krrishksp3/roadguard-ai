# ROADGUARD AI 🛡️
> **"From Road Complaints to Intelligent, Accountable Road Action."**

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH%202026-Problem%20MB--04-0284c7.svg)](https://sih.gov.in)
[![Theme: Smart Infrastructure](https://img.shields.io/badge/Theme-Smart%20Infrastructure%20%26%20Logistics-teal.svg)](#)
[![Team YuvaTech](https://img.shields.io/badge/Team-YuvaTech-amber.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-slate.svg)](LICENSE)

---

## 📌 Executive Summary & Differentiation

Most existing government civic reporting platforms stop at basic photo upload, GPS tagging, and ticket logging. **ROADGUARD AI** transforms this paradigm by delivering an end-to-end **Road Intelligence and Public Accountability Engine**:

1. **AI Road Damage Classification**: Optical analysis detecting pothole, longitudinal cracking, surface stripping, waterlogging, or shoulder erosion with civil engineering repair recommendations.
2. **0–100 Dynamic Road Risk Score**: A transparent, explainable formula weighing defect severity (25%), safety skid/collision hazard (20%), corridor traffic importance (20%), nearby cluster density (15%), chronic recurrence (10%), and SLA urgency (10%).
3. **Public Tender & Contractor Accountability**: Automatically connects affected road corridors with official UP State e-Procurement tender records, work scope, sanctioned values, and contractor liability periods.
4. **E-Commerce Delivery Tracking**: Transparent milestone progress tracking from Citizen Submission → AI Analyzed → Priority Calculated → Department Assigned → Acknowledged → Field Inspection → Repair in Progress → AI Verified → Resolved.
5. **AI-Assisted Repair Verification**: Automated Before/After visual comparison evaluating location match, visible improvement percentage, and remaining damage before authorized engineering sign-off.
6. **Road Health & Chronic Recurrence Intelligence**: Evaluates 0–100 road segment health and flags chronic failure zones receiving repeated complaints to mandate structural renewal over spot repairs.

---

## 🏗️ System Architecture

```
                                  ROADGUARD AI PLATFORM
                                 
      Citizen Web Portal / Mobile                Authority Management Console
      (React + Vite + Leaflet)                   (Dashboard, Map & Verification)
                 │                                              │
                 └──────────────────────┬───────────────────────┘
                                        ▼
                           Express REST API (TypeScript)
                                        │
                 ┌──────────────────────┼───────────────────────┐
                 ▼                      ▼                       ▼
           Prisma ORM            AI Intelligence Layer      Dynamic Risk
         (PostgreSQL/SQLite)      (OpenAI / Gemini / Demo)      Engine
                 │                      │                       │
                 ▼                      ▼                       ▼
         Database Storage         Zod Validation           0-100 Score
```

---

## ⚡ Quick Start & Local Execution

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Clone & Setup
```bash
git clone https://github.com/YuvaTech/roadguard-ai.git
cd roadguard-ai
```

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run start
```
*Backend runs on `http://localhost:5000` with pre-seeded Meerut demo data.*

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@roadguard.demo` | `citizen123` | Public map, reporting, personal complaints |
| **Authority** | `authority@roadguard.demo` | `authority123` | UP PWD Meerut dispatch, repair audit & verification |
| **Admin** | `admin@roadguard.demo` | `admin123` | Full system governance and analytics |

---

## 🧪 Automated Testing
Run the backend test suite:
```bash
cd backend
npm test
```
*All 8 tests across AI schemas, API endpoints, and the Dynamic Risk Engine pass.*

---

## 📚 Complete Documentation
- [TEAM_GUIDE.md](docs/TEAM_GUIDE.md) — Presentation code map & FAQ
- [DEMO_GUIDE.md](docs/DEMO_GUIDE.md) — Step-by-step judge presentation script
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — In-depth architectural blueprint
- [API.md](docs/API.md) — REST API specifications

---

## 👥 Team YuvaTech
- **Smart India Hackathon 2026**
- **Problem Statement**: MB-04 — Smart Road Safety & Accountability Platform
- **Theme**: Smart Infrastructure & Logistics
