# ROADGUARD AI — REST API Reference
**Version: 1.0.0-sih2026**

Base URL: `http://localhost:5000/api`

---

## 🔐 Authentication (`/api/auth`)

### `POST /api/auth/register`
Register a new citizen or authority user.
- **Request Body**:
  ```json
  {
    "name": "Arun Kumar",
    "email": "citizen@roadguard.demo",
    "password": "citizen123",
    "role": "CITIZEN"
  }
  ```
- **Response**: `201 Created` with JWT token and user object.

### `POST /api/auth/login`
Authenticate user and receive bearer token.
- **Request Body**:
  ```json
  {
    "email": "citizen@roadguard.demo",
    "password": "citizen123"
  }
  ```
- **Response**: `200 OK` with `{ token, user }`.

### `GET /api/auth/profile`
Get current user profile (requires `Authorization: Bearer <token>`).

---

## 🛣️ Road Complaints (`/api/reports`)

### `GET /api/reports`
List all road complaints with filtering and pagination.
- **Query Parameters**:
  - `status`: `REPORTED`, `ASSIGNED`, `ACKNOWLEDGED`, `REPAIR_IN_PROGRESS`, `RESOLVED`
  - `severity`: `critical`, `high`, `medium`, `low`
  - `search`: string search across ID, description, address

### `POST /api/reports`
Create a new road hazard report.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "imageUrl": "https://...",
    "latitude": 28.9950,
    "longitude": 77.7120,
    "description": "Deep pothole in center lane",
    "damageTypeHint": "pothole",
    "address": "Meerut-Pauri Road, Meerut"
  }
  ```
- **Response**: `201 Created` with analyzed report, AI diagnosis, dynamic risk score, and mapped department.

### `GET /api/reports/:id`
Get detailed report with AI analysis, priority assessment, tender link, and complete status timeline.

### `PATCH /api/reports/:id/status`
Update complaint status (Authority only).
- **Request Body**:
  ```json
  {
    "status": "ACKNOWLEDGED",
    "notes": "Mobilized maintenance contractor."
  }
  ```

---

## 🛠️ Repair Verification (`/api/verification`)

### `POST /api/verification/run`
Run AI computer vision comparison on before/after repair images.
- **Request Body**:
  ```json
  {
    "reportId": "RG-MRT-2026-000101",
    "afterImageUrl": "https://...",
    "notes": "Patching completed."
  }
  ```
- **Response**: `200 OK` with `{ locationMatchConfidence, visibleImprovementScore, remainingDamageScore, recommendation, explanation }`.

### `POST /api/verification/:reportId/decision`
Record authorized civil engineer approval or reinspection directive.
- **Request Body**:
  ```json
  {
    "decision": "APPROVED",
    "notes": "Field inspected by JE."
  }
  ```

---

## 📋 Tender & Road Health (`/api/tenders`, `/api/road-health`)

### `GET /api/tenders`
Returns all public road tender records linked to Meerut segments.

### `GET /api/road-health`
Returns corridor health scores, open/critical counts, and chronic recurrence flags.

### `GET /api/analytics/summary`
Returns executive KPI aggregates for the authority dashboard.
