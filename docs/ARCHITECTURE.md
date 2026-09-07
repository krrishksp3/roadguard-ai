# ROADGUARD AI — System Architecture & Technical Specifications
**Team: YuvaTech • Smart India Hackathon 2026 (Problem MB-04)**

## 🏗️ Architectural Overview

ROADGUARD AI is architected as an AI-assisted road intelligence and accountability platform that converts citizen road hazard complaints into risk-ranked, jurisdiction-aware, tender-linked, trackable, and verifiable maintenance workflows.

```
Citizen Web / Mobile App
         ↓ (Geo-tagged Photo + Location)
REST API Layer (Node.js / Express / TypeScript)
         ↓
PostgreSQL / SQLite Database via Prisma ORM
         ↓
AI Intelligence Layer (OpenAI / Gemini / Deterministic Demo Provider)
         ↓
0–100 Dynamic Road Risk Engine (6 Configurable Weights)
         ↓
Geospatial Jurisdiction & Department Dispatch (PWD / Nagar Nigam / NHAI)
         ↓
Public Tender Intelligence Layer (UP e-Procurement Linkage)
         ↓
E-Commerce Style Action Lifecycle Tracking
         ↓
AI-Assisted Before/After Repair Verification
         ↓
Road Health & Chronic Recurrence Intelligence
```

---

## 🧩 Component Architecture

### 1. Shared Contract Layer (`shared/types/index.ts`)
- Strict, uniform TypeScript contracts shared identically between backend and frontend.
- Defines domain entities: `RoadReport`, `AIAnalysis`, `PriorityAssessment`, `TenderRecord`, `RoadSegment`, `RepairVerification`, `Department`, `User`.

### 2. Backend Engine (`backend/`)
- **Node.js + Express + TypeScript**: REST API with modular controllers and Zod validation schemas.
- **Prisma ORM**: Data abstraction layer supporting zero-setup local SQLite file database for instant hackathon evaluation, and plug-and-play PostgreSQL connection strings for Supabase/Neon production.
- **Provider-Agnostic AI Architecture**:
  - `AIProvider` interface with runtime selector (`AIService.ts`).
  - `OpenAIProvider`: Multi-modal vision inspection with GPT-4o-mini.
  - `GeminiProvider`: Google Gemini 1.5/2.0 Flash REST integration.
  - `DemoAIProvider`: Deterministic offline/hackathon engine for 100% operational uptime when API keys are absent.
- **Dynamic Road Risk Engine**:
  - Transparent formula: Severity (25%) + Safety Hazard Risk (20%) + Corridor Traffic Importance (20%) + Cluster Density (15%) + Chronic Recurrence (10%) + SLA Urgency (10%).
- **Geospatial & Jurisdiction Mapper**:
  - Haversine distance spatial lookup connecting GPS coordinates to road segments and departments.
- **Repair Verification Engine**:
  - Evaluates Before/After image evidence, scoring location match, visible improvement, and remaining damage.

### 3. Frontend Web Application (`frontend/`)
- **React 18 + Vite + TypeScript + Tailwind CSS**:
  - Fast single-page application with responsive layouts for desktop, tablet, and mobile browsers.
  - **Leaflet & OpenStreetMap**: Interactive geospatial incident visualization with custom color-coded severity pins.
  - **Recharts**: Operational KPI and status distribution charts.
  - **Lucide Icons**: Standard civic-tech visual cues.
