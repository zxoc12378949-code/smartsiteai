# SmartSite AI
## Database Schema + API Specification

Version: 1.0

---

# 1. System Overview

本文件定義 SmartSite AI 之：

- Database Schema（資料庫結構）
- REST API Specification（後端介面規格）

系統為智慧工地巡檢與缺失管理平台，支援：

- 巡檢管理
- 缺失追蹤
- 風險分析
- 使用者與權限管理
- 報表與統計

---

# 2. Database Schema

採用關聯式資料庫設計（PostgreSQL / MySQL 皆適用）

---

# 2.1 Users Table

## users

| Field | Type | Description |
|------|------|-------------|
| id | UUID | User ID |
| name | VARCHAR | 使用者名稱 |
| email | VARCHAR | 登入帳號 |
| password_hash | VARCHAR | 密碼（加密） |
| role | ENUM | inspector / manager / supervisor / admin |
| department | VARCHAR | 所屬部門 |
| created_at | TIMESTAMP | 建立時間 |
| updated_at | TIMESTAMP | 更新時間 |

---

# 2.2 Projects Table

## projects

| Field | Type |
|------|------|
| id | UUID |
| name | VARCHAR |
| location | VARCHAR |
| status | ENUM(active, archived) |
| created_at | TIMESTAMP |

---

# 2.3 Inspections Table

## inspections

| Field | Type | Description |
|------|------|-------------|
| id | UUID | 巡檢ID |
| project_id | UUID | 工地ID |
| inspector_id | UUID | 巡檢人 |
| inspection_date | DATE | 巡檢日期 |
| work_area | VARCHAR | 工區 |
| status | ENUM(pass, warning, fail) | 巡檢結果 |
| notes | TEXT | 備註 |
| created_at | TIMESTAMP | 建立時間 |

---

# 2.4 Inspection Items Table

## inspection_items

| Field | Type |
|------|------|
| id | UUID |
| inspection_id | UUID |
| item_name | VARCHAR |
| result | ENUM(normal, abnormal) |

---

# 2.5 Defects Table

## defects

| Field | Type | Description |
|------|------|-------------|
| id | UUID |
| project_id | UUID |
| inspection_id | UUID (nullable) |
| title | VARCHAR |
| description | TEXT |
| work_area | VARCHAR |
| risk_level | ENUM(low, medium, high) |
| status | ENUM(open, in_progress, resolved, closed) |
| responsible_user_id | UUID |
| due_date | DATE |
| created_by | UUID |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

---

# 2.6 Defect Attachments Table

## defect_attachments

| Field | Type |
|------|------|
| id | UUID |
| defect_id | UUID |
| file_url | TEXT |
| file_type | VARCHAR |

---

# 2.7 Risk Analysis Table

## risk_assessments

| Field | Type |
|------|------|
| id | UUID |
| defect_id | UUID |
| severity | INT | 1–5 |
| probability | INT | 1–5 |
| risk_score | INT | computed |
| ai_suggestion | TEXT |
| created_at | TIMESTAMP |

---

# 2.8 Notifications Table

## notifications

| Field | Type |
|------|------|
| id | UUID |
| user_id | UUID |
| type | ENUM(defect_created, due_soon, overdue, resolved) |
| message | TEXT |
| is_read | BOOLEAN |
| created_at | TIMESTAMP |

---

# 3. API Specification

Base URL:

```
/api/v1
```

---

# 3.1 Authentication APIs

---

## POST /auth/login

### Request

```json
{
  "email": "string",
  "password": "string"
}
```

### Response

```json
{
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "name": "string",
    "role": "string"
  }
}
```

---

## POST /auth/register

（optional internal use）

---

# 3.2 Users APIs

## GET /users

Get all users

---

## GET /users/{id}

Get user detail

---

## POST /users

Create user

---

## PUT /users/{id}

Update user

---

## DELETE /users/{id}

Delete user

---

# 3.3 Projects APIs

## GET /projects

## POST /projects

## GET /projects/{id}

## PUT /projects/{id}

## DELETE /projects/{id}

---

# 3.4 Inspections APIs

## GET /inspections

Query params:
- project_id
- inspector_id
- date_from
- date_to

---

## POST /inspections

### Request

```json
{
  "project_id": "uuid",
  "inspector_id": "uuid",
  "inspection_date": "2026-01-01",
  "work_area": "3F East",
  "status": "pass",
  "notes": "string"
}
```

---

## GET /inspections/{id}

---

## POST /inspections/{id}/items

```json
{
  "item_name": "Safety Helmet",
  "result": "normal"
}
```

---

# 3.5 Defects APIs

## GET /defects

Filters:
- status
- risk_level
- project_id

---

## POST /defects

```json
{
  "project_id": "uuid",
  "inspection_id": "uuid",
  "title": "Unsafe scaffold condition",
  "description": "Description here",
  "work_area": "3F",
  "risk_level": "high",
  "responsible_user_id": "uuid",
  "due_date": "2026-01-10"
}
```

---

## GET /defects/{id}

---

## PUT /defects/{id}

Update defect status or details

---

## PATCH /defects/{id}/status

```json
{
  "status": "in_progress"
}
```

---

# 3.6 Risk Analysis APIs

## POST /risk/calculate

### Request

```json
{
  "severity": 5,
  "probability": 4
}
```

### Response

```json
{
  "risk_score": 20,
  "level": "high"
}
```

---

## GET /risk/defect/{id}

Get risk analysis by defect

---

# 3.7 Notifications APIs

## GET /notifications

## PATCH /notifications/{id}/read

---

# 3.8 Dashboard APIs

## GET /dashboard/summary

### Response

```json
{
  "total_inspections": 120,
  "open_defects": 35,
  "high_risk_defects": 8,
  "completion_rate": 0.87
}
```

---

## GET /dashboard/charts

Returns:

- defect distribution
- inspection trend
- risk trend

---

# 4. Business Logic

---

# 4.1 Risk Calculation

```
Risk Score = Severity × Probability
```

| Score | Level |
|------|------|
| 1–5 | Low |
| 6–15 | Medium |
| 16–25 | High |

---

# 4.2 Defect Lifecycle

Open → In Progress → Resolved → Closed

---

# 4.3 Notification Triggers

- defect created
- due date approaching (3 days)
- overdue
- status changed to resolved

---

# 5. Security Requirements

- JWT authentication
- Role-based access control (RBAC)
- Password hashing (bcrypt)
- API rate limiting (optional)

---

# 6. Performance Requirements

- API response < 300ms (95%)
- Support 1,000+ concurrent users (target MVP scale)

---

# 7. Future Extensions

- AI image recognition API
- BIM integration API
- Mobile SDK
- Offline mode support
- WebSocket real-time updates

---

# Final Note

This specification is designed for direct implementation by development tools (e.g., Antigravity 2.0, Cursor, Lovable, Bolt).

It should be treated as a **production-grade backend blueprint** for a construction safety inspection SaaS platform.