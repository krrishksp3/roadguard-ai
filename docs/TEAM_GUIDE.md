# ROADGUARD AI — Team Explanation & Code Map Guide
**Team: YuvaTech • Smart India Hackathon 2026 (Problem MB-04)**

This guide is designed for hackathon team members during judging presentations. When an evaluator asks *"How does X work?"* or *"Where is Y implemented?"*, use this guide to navigate directly to the code and explain with authority.

---

## 🗺️ Team Explanation Map

| Feature | Key Files / Path | What the Code Does | How to Explain to Judges |
| :--- | :--- | :--- | :--- |
| **AI Road Damage Analysis** | [`backend/src/services/ai/`](file:///backend/src/services/ai/)<br>• `AIService.ts`<br>• `DemoAIProvider.ts`<br>• `OpenAIProvider.ts`<br>• `schemas.ts` | Evaluates road photos using computer vision. Extracts defect type, severity, safety hazard risk, and quality checks. Output is strictly validated with Zod. | *"We built an extensible AI layer supporting cloud vision models (OpenAI/Gemini) and an offline deterministic civil engineering engine for guaranteed hackathon reliability."* |
| **Dynamic Road Risk Score (0–100)** | [`backend/src/services/priority/riskEngine.ts`](file:///backend/src/services/priority/riskEngine.ts) | Computes a transparent 0–100 composite risk score factoring severity (25%), safety risk (20%), corridor importance (20%), density clustering (15%), chronic recurrence (10%), and SLA urgency (10%). | *"Existing apps only rank by complaint date or raw severity. We calculate a multi-factor risk score so authorities know which hazard endangers lives most urgently."* |
| **Jurisdiction & Authority Mapping** | [`backend/src/services/jurisdiction/jurisdictionService.ts`](file:///backend/src/services/jurisdiction/jurisdictionService.ts) | Matches report GPS coordinates to the nearest classified road segment and administrative department (UP PWD Meerut, Nagar Nigam, or NHAI). | *"Citizens don't need to know which department owns the road. Our system automatically routes the complaint to the exact responsible executive division."* |
| **Tender & Procurement Intelligence** | [`backend/src/services/tender/tenderService.ts`](file:///backend/src/services/tender/tenderService.ts)<br>[`frontend/src/pages/TenderIntelligencePage.tsx`](file:///frontend/src/pages/TenderIntelligencePage.tsx) | Connects road segments with public UP e-Procurement records, work scope, sanctioned values, contractor names, and defect liability periods. | *"We introduce public procurement accountability: when a road breaks down, authorities and citizens can immediately inspect the contractor warranty status."* |
| **AI-Assisted Repair Verification** | [`backend/src/services/verification/verificationService.ts`](file:///backend/src/services/verification/verificationService.ts)<br>[`frontend/src/components/verification/BeforeAfterComparison.tsx`](file:///frontend/src/components/verification/BeforeAfterComparison.tsx) | Compares Before & After repair evidence photos. Analyzes location match confidence, visible improvement, and remaining defect before formal sign-off. | *"AI acts as a decision support system for civil engineers to audit repair quality before closing complaints. Final sign-off remains under human control."* |
| **Road Health & Chronic Hotspots** | [`backend/src/services/roadHealth/roadHealthService.ts`](file:///backend/src/services/roadHealth/roadHealthService.ts)<br>[`frontend/src/pages/RoadHealthPage.tsx`](file:///frontend/src/pages/RoadHealthPage.tsx) | Computes 0–100 corridor health scores. Detects chronic failure zones (>=3 repairs in 6 months) and recommends structural reconstruction over spot patching. | *"Instead of wasting taxpayer money on endless temporary pothole patches, our system flags recurring failure zones requiring comprehensive road resurfacing."* |
| **Complaint Delivery Timeline** | [`frontend/src/components/timeline/ComplaintTimeline.tsx`](file:///frontend/src/components/timeline/ComplaintTimeline.tsx) | Renders an e-commerce delivery-style progress tracker from Citizen Report -> AI Analyzed -> Priority Calculated -> Assigned -> Acknowledged -> Repaired -> Verified -> Resolved. | *"Civic complaints should feel as transparent as tracking an online delivery. Citizens and officials see each operational milestone in real time."* |
| **Interactive Geospatial Map** | [`frontend/src/components/map/ReportsMap.tsx`](file:///frontend/src/components/map/ReportsMap.tsx)<br>[`frontend/src/pages/PublicMapPage.tsx`](file:///frontend/src/pages/PublicMapPage.tsx) | Leaflet + OpenStreetMap displaying color-coded severity markers, clickable incident modals, and coordinate picking. | *"Our map gives city engineers a live spatial heatmap of road distress across the city, filterable by severity and department."* |
| **Authority Management Dashboard** | [`frontend/src/pages/AuthorityDashboard.tsx`](file:///frontend/src/pages/AuthorityDashboard.tsx) | Real-time operations console showing Total Reports, Open, Critical, Overdue SLA, Resolved, with priority-ranked table and one-click dispatch actions. | *"City engineers get an actionable command center to triage high-risk hazards, schedule junior engineer inspections, and track overdue SLA breaches."* |

---

## 🛠️ "If You Want to Change X, Edit Y"

- **Change AI Provider**: Edit [`backend/src/services/ai/AIService.ts`](file:///backend/src/services/ai/AIService.ts) or update `AI_PROVIDER` in `backend/.env`.
- **Tune Risk Score Weights**: Edit `WEIGHTS` object in [`backend/src/services/priority/riskEngine.ts`](file:///backend/src/services/priority/riskEngine.ts).
- **Update Meerut Tender Data**: Edit [`backend/prisma/seed.ts`](file:///backend/prisma/seed.ts) and run `npx tsx prisma/seed.ts`.
- **Change Database Schema**: Edit [`backend/prisma/schema.prisma`](file:///backend/prisma/schema.prisma) then run `npx prisma db push`.
- **Modify Web UI & Styles**: Edit [`frontend/src/index.css`](file:///frontend/src/index.css) and [`frontend/tailwind.config.js`](file:///frontend/tailwind.config.js).
- **Add Citizen Form Fields**: Edit [`frontend/src/pages/CreateReportPage.tsx`](file:///frontend/src/pages/CreateReportPage.tsx) and validation in [`backend/src/validators/schemas.ts`](file:///backend/src/validators/schemas.ts).

---

## 👥 Presentation Roles for YuvaTech

1. **Presenter 1 (Problem & Positioning)**: Introduces MB-04, explains why simple reporting apps fail, and presents ROADGUARD AI as an intelligence & accountability layer.
2. **Presenter 2 (Live Demo Execution)**: Demonstrates citizen reporting with photo & GPS, real-time AI classification, Dynamic Risk Score, and delivery timeline.
3. **Presenter 3 (Authority & Verification)**: Shows Authority Dashboard, tender intelligence cards, and runs the Before/After AI Repair Verification audit.
4. **Presenter 4 (Civil Engineering & Architecture)**: Explains the multi-factor risk formula, recurring damage hotspot detection, and technical tech stack.
