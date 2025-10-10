# SIRW - API Contract & Swagger Documentation
## Complete REST API Specification

---

## 📋 Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Common Patterns](#common-patterns)
4. [API Endpoints](#api-endpoints)
   - [Authentication](#authentication-endpoints)
   - [User Management](#user-management-endpoints)
   - [Residents](#residents-endpoints)
   - [Letters](#letters-endpoints)
   - [Finance](#finance-endpoints)
   - [Announcements](#announcements-endpoints)
   - [Complaints](#complaints-endpoints)
   - [Events](#events-endpoints)
   - [Admin](#admin-endpoints)
5. [OpenAPI/Swagger Spec](#openapi-swagger-spec)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)

---

## 1. API Overview

### Base Information

```yaml
Base URL: https://api.sirw.id/api/v1
Protocol: HTTPS only
Content-Type: application/json
Character Encoding: UTF-8
API Version: 1.0.0
```

### API Design Principles

- **RESTful**: Resource-based URLs, HTTP verbs
- **Stateless**: No server-side session, JWT-based auth
- **Versioned**: API version in URL path (/api/v1)
- **Consistent**: Uniform response structure
- **Paginated**: Large datasets use pagination
- **Filterable**: Query parameters for filtering
- **Documented**: OpenAPI 3.0 specification

### Supported HTTP Methods

- **GET**: Retrieve resources
- **POST**: Create new resources
- **PUT**: Replace entire resource
- **PATCH**: Partial update resource
- **DELETE**: Remove resource

---

## 2. Authentication

### Authentication Methods

#### JWT Bearer Token

All authenticated endpoints require JWT token in header:

```http
Authorization: Bearer <access_token>
```

#### Token Structure

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

#### Token Payload

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "warga",
  "iat": 1704672000,
  "exp": 1704672900
}
```

### Authentication Flow

```
1. User Login → POST /auth/login
2. Server returns access_token (15 min) + refresh_token (7 days)
3. Client stores access_token in memory
4. Client includes token in Authorization header
5. Before expiry, client refreshes → POST /auth/refresh
6. Server returns new access_token
```

---

## 3. Common Patterns

### Request Headers

```http
Content-Type: application/json
Authorization: Bearer <token>
Accept: application/json
X-Request-ID: <uuid> (optional, for tracing)
Accept-Language: id-ID (optional, for i18n)
```

### Success Response Format

```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  },
  "meta": {
    // Optional metadata (pagination, etc)
  }
}
```

### Error Response Format

```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "code": "INVALID_FORMAT"
      }
    ]
  }
}
```

### Pagination

```json
{
  "status": "success",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 500,
      "total_pages": 25,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

### Filtering & Sorting

**Query Parameters**:
- `filter[field]`: Filter by field value
- `search`: Full-text search
- `sort`: Sort field (prefix with - for descending)

**Example**:
```
GET /api/v1/residents?filter[rt_number]=001&search=john&sort=-created_at&page=1&limit=20
```

---

## 4. API Endpoints

### Authentication Endpoints

#### POST /auth/register

Register new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "phone": "+628123456789",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "nik": "3201234567890123",
  "rt_number": "001",
  "rw_number": "005",
  "address": "Jl. Example No. 123"
}
```

** (200 OK):
```json
{
  "status": "success",
  "message": "Payment verified successfully"
}
```

---

#### PATCH /finance/transactions/:id/reject

Reject payment proof (bendahara only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "reason": "Bukti transfer tidak jelas"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Payment proof rejected"
}
```

---

#### GET /finance/dashboard

Get financial dashboard.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `month`: 1-12 (default: current month)
- `year`: 2025 (default: current year)

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "total_income": 50000000,
    "total_expense": 30000000,
    "net_balance": 20000000,
    "collection_rate": 85.5,
    "total_arrears": 5000000,
    "residents_with_arrears": 45,
    "income_by_category": [
      {
        "category": "Iuran Sampah",
        "amount": 25000000
      }
    ],
    "expense_by_category": [...],
    "monthly_trend": [
      {
        "month": "2024-12",
        "income": 45000000,
        "expense": 28000000
      }
    ]
  }
}
```

**Permissions**: bendahara, admin_rw, super_admin

---

#### GET /finance/reports/arrears

Get arrears report.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `filter[rt_number]`: Filter by RT
- `min_amount`: Minimum arrears amount
- `months_overdue`: Minimum months overdue

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "summary": {
      "total_residents": 45,
      "total_arrears": 5000000
    },
    "residents": [
      {
        "resident_id": "...",
        "full_name": "John Doe",
        "rt_number": "001",
        "total_arrears": 150000,
        "months_overdue": 3,
        "last_payment_date": "2024-10-15",
        "outstanding_fees": [
          {
            "fee_type": "Iuran Sampah",
            "amount": 75000,
            "periods": ["2024-11", "2024-12", "2025-01"]
          }
        ]
      }
    ]
  }
}
```

**Permissions**: bendahara, admin_rt, admin_rw, super_admin

---

#### POST /finance/reminders

Send payment reminders.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "resident_ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "..."
  ],
  "message": "Optional custom message"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Reminders sent to 45 residents",
  "data": {
    "sent": 45,
    "failed": 0
  }
}
```

**Permissions**: admin_rt, admin_rw, super_admin

---

### Announcements Endpoints

#### POST /announcements

Create announcement (admin only).

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body**:
```
title: Important Community Update
content: <html content>
category: urgent
target_audience: {"all": true}
scheduled_at: 2025-01-09T08:00:00Z (optional)
media: <file1>, <file2> (optional, max 3 files)
```

**Response** (201 Created):
```json
{
  "status": "success",
  "message": "Announcement created successfully",
  "data": {
    "id": "...",
    "status": "published",
    "published_at": "2025-01-08T10:00:00Z"
  }
}
```

**Permissions**: admin_rt, admin_rw, super_admin

---

#### GET /announcements

Get announcements.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page`, `limit`: Pagination
- `filter[category]`: urgent, info, event
- `filter[is_published]`: true/false
- `search`: Search in title and content
- `sort`: Sort field (default: -published_at)

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "...",
        "title": "Important Community Update",
        "content": "Full content here...",
        "excerpt": "Short preview...",
        "category": "urgent",
        "author": {
          "id": "...",
          "full_name": "Admin RT"
        },
        "media_urls": [
          "https://storage.googleapis.com/..."
        ],
        "published_at": "2025-01-08T10:00:00Z",
        "view_count": 125,
        "is_read": false
      }
    ],
    "pagination": {...}
  }
}
```

---

#### GET /announcements/:id

Get announcement details.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": "...",
    "title": "Important Community Update",
    "content": "Full HTML content...",
    "category": "urgent",
    "author": {
      "full_name": "Admin RT"
    },
    "media_urls": [...],
    "published_at": "2025-01-08T10:00:00Z",
    "view_count": 125,
    "unique_view_count": 98,
    "is_read": true,
    "read_at": "2025-01-08T11:00:00Z"
  }
}
```

---

#### POST /announcements/:id/mark-read

Mark announcement as read.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Announcement marked as read"
}
```

---

#### GET /announcements/:id/analytics

Get announcement analytics (admin only).

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "total_views": 125,
    "unique_views": 98,
    "view_rate": 78.4,
    "email_open_rate": 65.2,
    "push_click_rate": 45.8,
    "views_over_time": [
      {
        "date": "2025-01-08",
        "views": 50
      }
    ],
    "non_viewers": [
      {
        "resident_id": "...",
        "full_name": "John Doe"
      }
    ]
  }
}
```

**Permissions**: admin_rt, admin_rw, super_admin

---

### Complaints Endpoints

#### POST /complaints

Submit complaint.

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body**:
```
category: facility_damage
title: Broken street lamp
description: Street lamp at Blok A is broken
priority: high
location: Blok A, near gate
media: <file1>, <file2> (optional, max 3 files)
```

**Response** (201 Created):
```json
{
  "status": "success",
  "message": "Complaint submitted successfully",
  "data": {
    "id": "...",
    "complaint_number": "CMP-20250108-001",
    "status": "new",
    "created_at": "2025-01-08T10:00:00Z"
  }
}
```

---

#### GET /complaints

Get complaints.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page`, `limit`: Pagination
- `filter[status]`: new, in_progress, resolved, closed
- `filter[category]`: facility_damage, security, general
- `filter[priority]`: low, normal, high, urgent
- `filter[resident_id]`: Filter by resident (admin only)
- `filter[assigned_to]`: Filter by assignee (admin only)
- `search`: Search in title and description
- `sort`: Sort field

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "...",
        "complaint_number": "CMP-20250108-001",
        "resident": {
          "full_name": "John Doe"
        },
        "category": "facility_damage",
        "title": "Broken street lamp",
        "priority": "high",
        "status": "in_progress",
        "assigned_to": {
          "full_name": "Admin RT"
        },
        "is_overdue": false,
        "created_at": "2025-01-08T10:00:00Z",
        "updated_at": "2025-01-08T11:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

**Permissions**:
- Own complaints: warga
- All complaints: admin_rt, admin_rw, satpam, super_admin

---

#### GET /complaints/:id

Get complaint details.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": "...",
    "complaint_number": "CMP-20250108-001",
    "resident": {
      "full_name": "John Doe",
      "phone": "+628123456789"
    },
    "category": "facility_damage",
    "title": "Broken street lamp",
    "description": "Street lamp at Blok A is broken",
    "location": "Blok A, near gate",
    "priority": "high",
    "status": "in_progress",
    "assigned_to": {
      "id": "...",
      "full_name": "Admin RT"
    },
    "media_urls": [
      "https://storage.googleapis.com/..."
    ],
    "timeline": [
      {
        "id": "...",
        "user": {
          "full_name": "John Doe"
        },
        "action": "created",
        "comment": "Complaint submitted",
        "created_at": "2025-01-08T10:00:00Z"
      },
      {
        "id": "...",
        "user": {
          "full_name": "Admin RT"
        },
        "action": "assigned",
        "comment": "Assigned to maintenance team",
        "created_at": "2025-01-08T10:30:00Z"
      }
    ],
    "due_date": "2025-01-10T10:00:00Z",
    "is_overdue": false,
    "created_at": "2025-01-08T10:00:00Z",
    "updated_at": "2025-01-08T11:00:00Z"
  }
}
```

---

#### PATCH /complaints/:id/assign

Assign complaint (admin only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "assigned_to": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Complaint assigned successfully"
}
```

**Permissions**: admin_rt, admin_rw, super_admin

---

#### PATCH /complaints/:id/status

Update complaint status (admin only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "status": "in_progress",
  "comment": "Maintenance team has been dispatched"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Complaint status updated"
}
```

---

#### PATCH /complaints/:id/resolve

Mark complaint as resolved (admin only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "resolution_notes": "Street lamp has been fixed. Verified on-site."
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Complaint marked as resolved"
}
```

---

#### POST /complaints/:id/comments

Add comment to complaint.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "comment": "Thank you for the update",
  "is_internal": false
}
```

**Response** (201 Created):
```json
{
  "status": "success",
  "message": "Comment added successfully"
}
```

---

### Events Endpoints

#### POST /events

Create event (admin only).

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body**:
```
title: Community Gathering
description: Monthly community gathering
category: social
start_date: 2025-01-15T16:00:00Z
end_date: 2025-01-15T20:00:00Z
location: Community Hall
max_participants: 100 (optional)
registration_required: true
banner: <file> (optional)
```

**Response** (201 Created):
```json
{
  "status": "success",
  "message": "Event created successfully",
  "data": {
    "id": "...",
    "title": "Community Gathering",
    "start_date": "2025-01-15T16:00:00Z"
  }
}
```

**Permissions**: admin_rt, admin_rw, super_admin

---

#### GET /events

Get events.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `from`: Start date (ISO 8601)
- `to`: End date (ISO 8601)
- `filter[category]`: social, religious, sports, meeting, other
- `filter[status]`: upcoming, ongoing, completed, cancelled
- `sort`: Sort field (default: start_date)

**Response** (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "id": "...",
      "title": "Community Gathering",
      "description": "Monthly community gathering",
      "category": "social",
      "start_date": "2025-01-15T16:00:00Z",
      "end_date": "2025-01-15T20:00:00Z",
      "location": "Community Hall",
      "organizer": {
        "full_name": "Admin RT"
      },
      "max_participants": 100,
      "current_participants": 45,
      "banner_url": "https://...",
      "status": "upcoming"
    }
  ]
}
```

---

#### GET /events/:id

Get event details.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": "...",
    "title": "Community Gathering",
    "description": "Monthly community gathering",
    "category": "social",
    "start_date": "2025-01-15T16:00:00Z",
    "end_date": "2025-01-15T20:00:00Z",
    "location": "Community Hall",
    "organizer": {
      "full_name": "Admin RT"
    },
    "max_participants": 100,
    "current_participants": 45,
    "registration_required": true,
    "registration_deadline": "2025-01-14T23:59:59Z",
    "banner_url": "https://...",
    "status": "upcoming",
    "gallery": [
      {
        "image_url": "https://...",
        "thumbnail_url": "https://...",
        "caption": "Event photo"
      }
    ],
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

#### POST /events/:id/gallery

Upload event photos (admin only).

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body**:
```
images: <file1>, <file2>, ... (max 10 files)
captions: ["Caption 1", "Caption 2", ...]
```

**Response** (201 Created):
```json
{
  "status": "success",
  "message": "Photos uploaded successfully",
  "data": {
    "uploaded": 5
  }
}
```

**Permissions**: admin_rt, admin_rw, super_admin

---

### Admin Endpoints

#### GET /admin/users/pending

Get pending user approvals.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page`, `limit`: Pagination
- `filter[rt_number]`, `filter[rw_number]`: Filters

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "...",
        "email": "user@example.com",
        "phone": "+628123456789",
        "full_name": "John Doe",
        "nik": "3201234567890123",
        "rt_number": "001",
        "rw_number": "005",
        "address": "...",
        "created_at": "2025-01-08T10:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

**Permissions**: admin_rt, admin_rw, super_admin

---

#### PATCH /admin/users/:id/approve

Approve user registration.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "notes": "Approved after verification"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "User approved successfully"
}
```

**Permissions**: admin_rt, admin_rw, super_admin

---

#### PATCH /admin/users/:id/reject

Reject user registration.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "reason": "Invalid NIK or incomplete information"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "User registration rejected"
}
```

---

#### GET /admin/audit-logs

Get audit logs.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page`, `limit`: Pagination (max 100)
- `filter[user_id]`: Filter by user
- `filter[action]`: Filter by action type
- `filter[resource_type]`: Filter by resource
- `from`, `to`: Date range

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "...",
        "user": {
          "full_name": "Admin RT"
        },
        "action": "approve",
        "resource_type": "letter_request",
        "resource_id": "...",
        "old_data": {...},
        "new_data": {...},
        "ip_address": "192.168.1.1",
        "created_at": "2025-01-08T10:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

**Permissions**: super_admin

---

#### GET /admin/settings

Get system settings.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "community_name": {
      "name": "RW 005",
      "full_name": "Rukun Warga 005"
    },
    "contact_info": {
      "email": "rw005@example.com",
      "phone": "021-1234567"
    },
    "business_hours": {
      "open": "08:00",
      "close": "16:00",
      "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
    }
  }
}
```

**Permissions**: Public settings accessible to all; private settings for admins only

---

#### PATCH /admin/settings

Update system settings.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "community_name": {
    "name": "RW 005",
    "full_name": "Rukun Warga 005 Kelurahan Example"
  }
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Settings updated successfully"
}
```

**Permissions**: super_admin

---

## 5. OpenAPI/Swagger Spec

### Complete OpenAPI 3.0 Specification

```yaml
openapi: 3.0.0
info:
  title: SIRW API
  description: API documentation for SIRW (Sistem Informasi RT/RW)
  version: 1.0.0
  contact:
    name: SIRW Support
    email: support@sirw.id
    url: https://sirw.id
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.sirw.id/api/v1
    description: Production server
  - url: https://staging-api.sirw.id/api/v1
    description: Staging server
  - url: http://localhost:3000/api/v1
    description: Development server

tags:
  - name: Authentication
    description: User authentication and authorization
  - name: Users
    description: User profile management
  - name: Residents
    description: Resident data management
  - name: Letters
    description: Letter generation and approval
  - name: Finance
    description: Financial management and payments
  - name: Announcements
    description: Community announcements
  - name: Complaints
    description: Complaint and report management
  - name: Events
    description: Community events
  - name: Admin
    description: Administrative operations

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT access token

  schemas:
    Error:
      type: object
      properties:
        status:
          type: string
          enum: [error]
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: array
              items:
                type: object
                properties:
                  field:
                    type: string
                  message:
                    type: string
                  code:
                    type: string

    Success:
      type: object
      properties:
        status:
          type: string
          enum: [success]
        message:
          type: string
        data:
          type: object

    Pagination:
      type: object
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
        total_pages:
          type: integer
        has_next:
          type: boolean
        has_prev:
          type: boolean

    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        phone:
          type: string
        role:
          type: string
          enum: [super_admin, admin_rw, admin_rt, bendahara, warga, satpam]
        is_active:
          type: boolean
        email_verified:
          type: boolean
        phone_verified:
          type: boolean

    Resident:
      type: object
      properties:
        id:
          type: string
          format: uuid
        nik:
          type: string
          pattern: '^\d{16}** (201 Created):
```json
{
  "status": "success",
  "message": "Registration successful. Please wait for admin approval.",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "status": "pending_approval"
  }
}
```

**Validation Rules**:
- `email`: Valid email format, unique
- `phone`: Valid Indonesian phone format (+628...), unique
- `password`: Min 8 chars, 1 uppercase, 1 number, 1 special char
- `nik`: Exactly 16 digits, unique
- `full_name`: Min 3 chars, max 255 chars
- At least one of email or phone required

**Errors**:
- `400`: Validation error
- `409`: Email/phone/NIK already exists

---

#### POST /auth/login

Authenticate user and get tokens.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Alternative** (login with phone):
```json
{
  "phone": "+628123456789",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "token_type": "Bearer",
    "expires_in": 900,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "role": "warga",
      "full_name": "John Doe",
      "is_active": true
    }
  }
}
```

**Errors**:
- `400`: Missing credentials
- `401`: Invalid credentials
- `403`: Account not approved/active
- `423`: Account locked (too many failed attempts)

---

#### POST /auth/refresh

Refresh access token using refresh token.

**Request Body**:
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGc...",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

**Errors**:
- `401`: Invalid or expired refresh token

---

#### POST /auth/logout

Logout and invalidate refresh token.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

#### POST /auth/forgot-password

Request password reset link.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Password reset link sent to your email"
}
```

**Note**: Always returns success (don't reveal if email exists)

---

#### POST /auth/reset-password

Reset password with token.

**Request Body**:
```json
{
  "token": "reset-token-from-email",
  "password": "NewSecurePass123!",
  "password_confirmation": "NewSecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Password reset successfully"
}
```

**Errors**:
- `400`: Invalid or expired token
- `422`: Passwords don't match

---

#### POST /auth/verify-email

Verify email with token.

**Request Body**:
```json
{
  "token": "email-verification-token"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Email verified successfully"
}
```

---

#### POST /auth/send-otp

Send OTP to phone number.

**Request Body**:
```json
{
  "phone": "+628123456789"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "OTP sent to your phone",
  "data": {
    "expires_in": 300
  }
}
```

**Rate Limit**: 3 requests per 30 minutes per phone

---

#### POST /auth/verify-otp

Verify phone with OTP.

**Request Body**:
```json
{
  "phone": "+628123456789",
  "otp": "123456"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Phone verified successfully"
}
```

**Errors**:
- `400`: Invalid OTP
- `410`: OTP expired

---

#### POST /auth/social/google

Login with Google OAuth.

**Request Body**:
```json
{
  "id_token": "google-id-token-from-client"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "is_new_user": false,
    "user": {...}
  }
}
```

---

### User Management Endpoints

#### GET /users/me

Get current user profile.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "phone": "+628123456789",
    "role": "warga",
    "is_active": true,
    "email_verified": true,
    "phone_verified": true,
    "two_factor_enabled": false,
    "resident": {
      "id": "...",
      "nik": "3201234567890123",
      "full_name": "John Doe",
      "rt_number": "001",
      "rw_number": "005",
      "address": "...",
      "residence_status": "owner"
    },
    "created_at": "2025-01-01T00:00:00Z",
    "last_login_at": "2025-01-08T10:00:00Z"
  }
}
```

---

#### PATCH /users/me

Update current user profile.

**Headers**: `Authorization: Bearer <token>`

**Request Body** (partial update):
```json
{
  "full_name": "John Doe Updated",
  "phone": "+628123456788",
  "occupation": "Software Engineer"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "data": {
    "id": "...",
    "full_name": "John Doe Updated",
    ...
  }
}
```

**Note**: Email/phone changes require verification

---

#### POST /users/me/avatar

Upload profile avatar.

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body**:
```
avatar: <file> (max 5MB, jpg/png)
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Avatar uploaded successfully",
  "data": {
    "avatar_url": "https://storage.googleapis.com/..."
  }
}
```

---

#### POST /users/me/password

Change password.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "current_password": "OldPass123!",
  "new_password": "NewPass123!",
  "new_password_confirmation": "NewPass123!"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Password changed successfully"
}
```

---

#### POST /users/me/2fa/enable

Enable two-factor authentication.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "qr_code": "data:image/png;base64,...",
    "secret": "JBSWY3DPEHPK3PXP",
    "backup_codes": [
      "12345678",
      "87654321",
      ...
    ]
  }
}
```

---

#### POST /users/me/2fa/verify

Verify and activate 2FA.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "code": "123456"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Two-factor authentication enabled"
}
```

---

### Residents Endpoints

#### GET /residents

Get list of residents (admin only).

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `search`: Search by name, NIK, address
- `filter[rt_number]`: Filter by RT
- `filter[rw_number]`: Filter by RW
- `filter[residence_status]`: owner/tenant/boarding
- `filter[is_active]`: true/false
- `sort`: Sort field (e.g., full_name, -created_at)

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "nik": "3201234567890123",
        "full_name": "John Doe",
        "email": "user@example.com",
        "phone": "+628123456789",
        "rt_number": "001",
        "rw_number": "005",
        "address": "Jl. Example No. 123",
        "residence_status": "owner",
        "is_active": true,
        "move_in_date": "2020-01-01",
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 500,
      "total_pages": 25,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

**Permissions**: admin_rt, admin_rw, super_admin

---

#### GET /residents/:id

Get resident details.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nik": "3201234567890123",
    "kk_number": "3201234567890001",
    "full_name": "John Doe",
    "birth_date": "1990-01-15",
    "birth_place": "Jakarta",
    "gender": "M",
    "religion": "Islam",
    "marital_status": "Married",
    "occupation": "Software Engineer",
    "education": "S1",
    "email": "user@example.com",
    "phone": "+628123456789",
    "rt_number": "001",
    "rw_number": "005",
    "address": "Jl. Example No. 123",
    "residence_status": "owner",
    "move_in_date": "2020-01-01",
    "is_active": true,
    "family": {
      "id": "...",
      "kk_number": "3201234567890001",
      "members": [
        {
          "id": "...",
          "full_name": "Jane Doe",
          "relationship": "spouse"
        }
      ]
    },
    "documents": [
      {
        "id": "...",
        "type": "ktp",
        "file_url": "https://...",
        "uploaded_at": "2025-01-01T00:00:00Z"
      }
    ],
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-08T10:00:00Z"
  }
}
```

**Permissions**: 
- Own data: warga
- All residents: admin_rt, admin_rw, super_admin

---

#### POST /residents

Create new resident (admin only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "nik": "3201234567890123",
  "full_name": "John Doe",
  "birth_date": "1990-01-15",
  "birth_place": "Jakarta",
  "gender": "M",
  "email": "user@example.com",
  "phone": "+628123456789",
  "rt_number": "001",
  "rw_number": "005",
  "address": "Jl. Example No. 123",
  "residence_status": "owner",
  "move_in_date": "2020-01-01"
}
```

**Response** (201 Created):
```json
{
  "status": "success",
  "message": "Resident created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    ...
  }
}
```

**Permissions**: admin_rt, admin_rw, super_admin

---

#### PATCH /residents/:id

Update resident information.

**Headers**: `Authorization: Bearer <token>`

**Request Body** (partial):
```json
{
  "phone": "+628123456788",
  "occupation": "Engineer",
  "address": "New Address"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Resident updated successfully",
  "data": {...}
}
```

---

#### POST /residents/import

Bulk import residents from CSV.

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body**:
```
file: <csv_file> (max 10MB)
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Import completed",
  "data": {
    "total_rows": 100,
    "successful": 95,
    "failed": 5,
    "errors": [
      {
        "row": 10,
        "nik": "320123456789",
        "error": "NIK must be 16 digits"
      }
    ]
  }
}
```

**Permissions**: admin_rw, super_admin

---

#### GET /residents/export

Export residents to CSV/Excel.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `format`: csv or xlsx (default: csv)
- `filter[rt_number]`: Optional RT filter
- `filter[rw_number]`: Optional RW filter

**Response** (200 OK):
Returns file download with appropriate Content-Type

**Permissions**: admin_rt, admin_rw, super_admin

---

### Letters Endpoints

#### GET /letters/templates

Get available letter templates.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "code": "pengantar",
      "name": "Surat Pengantar RT/RW",
      "description": "Surat pengantar untuk berbagai keperluan",
      "template_variables": [
        "resident_name",
        "nik",
        "purpose",
        "destination"
      ],
      "approval_workflow": [
        {"level": 1, "role": "admin_rt"},
        {"level": 2, "role": "admin_rw"}
      ],
      "is_active": true
    }
  ]
}
```

---

#### POST /letters/requests

Submit letter request.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "template_id": "550e8400-e29b-41d4-a716-446655440000",
  "request_data": {
    "purpose": "Melamar pekerjaan",
    "destination": "PT. Example Indonesia",
    "additional_info": "Urgency: High"
  }
}
```

**Response** (201 Created):
```json
{
  "status": "success",
  "message": "Letter request submitted successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "letter_number": null,
    "status": "pending",
    "current_approval_level": 1,
    "created_at": "2025-01-08T10:00:00Z"
  }
}
```

---

#### GET /letters/requests

Get letter requests.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page`, `limit`: Pagination
- `filter[status]`: pending, in_review, approved, rejected
- `filter[resident_id]`: Filter by resident (admin only)
- `sort`: Sort field

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "...",
        "letter_number": "001/RT-005/RW-002/2025",
        "template": {
          "name": "Surat Pengantar RT/RW"
        },
        "resident": {
          "full_name": "John Doe"
        },
        "status": "approved",
        "pdf_url": "https://...",
        "created_at": "2025-01-08T10:00:00Z",
        "approved_at": "2025-01-08T11:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

**Permissions**:
- Own requests: warga
- All requests: admin_rt, admin_rw, super_admin

---

#### GET /letters/requests/:id

Get letter request details.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "letter_number": "001/RT-005/RW-002/2025",
    "template": {
      "name": "Surat Pengantar RT/RW"
    },
    "resident": {
      "full_name": "John Doe",
      "nik": "3201234567890123"
    },
    "request_data": {
      "purpose": "Melamar pekerjaan",
      "destination": "PT. Example Indonesia"
    },
    "status": "approved",
    "approval_flow": [
      {
        "level": 1,
        "approver": "Admin RT",
        "approved_at": "2025-01-08T10:30:00Z",
        "notes": "Approved"
      },
      {
        "level": 2,
        "approver": "Admin RW",
        "approved_at": "2025-01-08T11:00:00Z",
        "notes": "Approved"
      }
    ],
    "pdf_url": "https://storage.googleapis.com/...",
    "qr_code": "data:image/png;base64,...",
    "valid_until": "2025-04-08",
    "created_at": "2025-01-08T10:00:00Z",
    "approved_at": "2025-01-08T11:00:00Z"
  }
}
```

---

#### PATCH /letters/requests/:id/approve

Approve letter request (admin only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "notes": "Approved by RT"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Letter request approved",
  "data": {
    "id": "...",
    "status": "approved",
    "pdf_url": "https://..."
  }
}
```

**Permissions**: Depends on approval workflow level

---

#### PATCH /letters/requests/:id/reject

Reject letter request (admin only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "reason": "Dokumen pendukung tidak lengkap"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Letter request rejected"
}
```

---

#### GET /letters/requests/:id/download

Download approved letter PDF.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
Returns PDF file with `Content-Type: application/pdf`

---

#### GET /public/letters/verify/:hash

Verify letter authenticity (public, no auth).

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "is_valid": true,
    "letter_number": "001/RT-005/RW-002/2025",
    "letter_type": "Surat Pengantar RT/RW",
    "issue_date": "2025-01-08",
    "requester_name": "J*** D***",
    "valid_until": "2025-04-08"
  }
}
```

---

### Finance Endpoints

#### GET /finance/fee-types

Get fee types.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "id": "...",
      "code": "monthly_trash",
      "name": "Iuran Sampah",
      "description": "Iuran bulanan untuk kebersihan",
      "amount": 25000,
      "frequency": "monthly",
      "is_active": true
    }
  ]
}
```

---

#### POST /finance/transactions

Record payment (bendahara only).

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data` (if uploading proof)

**Request Body**:
```json
{
  "resident_id": "550e8400-e29b-41d4-a716-446655440000",
  "fee_type_id": "...",
  "amount": 25000,
  "payment_method": "cash",
  "payment_date": "2025-01-08",
  "notes": "Payment for January 2025"
}
```

**With proof**:
```
resident_id: uuid
fee_type_id: uuid
amount: 25000
payment_method: transfer
payment_date: 2025-01-08
proof: <file>
```

**Response** (201 Created):
```json
{
  "status": "success",
  "message": "Payment recorded successfully",
  "data": {
    "id": "...",
    "receipt_number": "RCP-20250108-001",
    "status": "verified"
  }
}
```

**Permissions**: bendahara

---

#### POST /finance/transactions/upload-proof

Upload payment proof (resident).

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body**:
```
fee_type_id: uuid
amount: 25000
payment_date: 2025-01-08
proof: <file>
notes: Transfer via BCA
```

**Response** (201 Created):
```json
{
  "status": "success",
  "message": "Payment proof uploaded. Waiting for verification.",
  "data": {
    "id": "...",
    "status": "pending_verification"
  }
}
```

---

#### GET /finance/transactions

Get transactions.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page`, `limit`: Pagination
- `filter[resident_id]`: Filter by resident
- `filter[status]`: verified, pending_verification, rejected
- `filter[payment_method]`: cash, transfer
- `filter[period_month]`: 1-12
- `filter[period_year]`: 2025
- `sort`: Sort field

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "...",
        "receipt_number": "RCP-20250108-001",
        "resident": {
          "full_name": "John Doe"
        },
        "fee_type": {
          "name": "Iuran Sampah"
        },
        "amount": 25000,
        "payment_method": "cash",
        "payment_date": "2025-01-08",
        "status": "verified",
        "verified_at": "2025-01-08T10:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

**Permissions**:
- Own transactions: warga
- All transactions: bendahara, admin_rw, super_admin

---

#### PATCH /finance/transactions/:id/verify

Verify payment proof (bendahara only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "notes": "Verified, payment received"
}
```

**Response
        full_name:
          type: string
        birth_date:
          type: string
          format: date
        gender:
          type: string
          enum: [M, F]
        rt_number:
          type: string
        rw_number:
          type: string
        address:
          type: string
        residence_status:
          type: string
          enum: [owner, tenant, boarding]

  responses:
    Unauthorized:
      description: Unauthorized - Invalid or missing token
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            status: error
            error:
              code: UNAUTHORIZED
              message: Invalid or missing authentication token

    Forbidden:
      description: Forbidden - Insufficient permissions
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            status: error
            error:
              code: FORBIDDEN
              message: You don't have permission to perform this action

    NotFound:
      description: Not Found - Resource doesn't exist
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            status: error
            error:
              code: NOT_FOUND
              message: Resource not found

    ValidationError:
      description: Validation Error - Invalid input data
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            status: error
            error:
              code: VALIDATION_ERROR
              message: Invalid input data
              details:
                - field: email
                  message: Invalid email format
                  code: INVALID_FORMAT

security:
  - bearerAuth: []

paths:
  /auth/register:
    post:
      tags:
        - Authentication
      summary: Register new user
      description: Register a new user account. Account requires admin approval before activation.
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - password
                - full_name
                - nik
                - rt_number
                - rw_number
                - address
              properties:
                email:
                  type: string
                  format: email
                phone:
                  type: string
                  pattern: '^\+628\d{9,13}** (201 Created):
```json
{
  "status": "success",
  "message": "Registration successful. Please wait for admin approval.",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "status": "pending_approval"
  }
}
```

**Validation Rules**:
- `email`: Valid email format, unique
- `phone`: Valid Indonesian phone format (+628...), unique
- `password`: Min 8 chars, 1 uppercase, 1 number, 1 special char
- `nik`: Exactly 16 digits, unique
- `full_name`: Min 3 chars, max 255 chars
- At least one of email or phone required

**Errors**:
- `400`: Validation error
- `409`: Email/phone/NIK already exists

---

#### POST /auth/login

Authenticate user and get tokens.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Alternative** (login with phone):
```json
{
  "phone": "+628123456789",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "token_type": "Bearer",
    "expires_in": 900,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "role": "warga",
      "full_name": "John Doe",
      "is_active": true
    }
  }
}
```

**Errors**:
- `400`: Missing credentials
- `401`: Invalid credentials
- `403`: Account not approved/active
- `423`: Account locked (too many failed attempts)

---

#### POST /auth/refresh

Refresh access token using refresh token.

**Request Body**:
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGc...",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

**Errors**:
- `401`: Invalid or expired refresh token

---

#### POST /auth/logout

Logout and invalidate refresh token.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

#### POST /auth/forgot-password

Request password reset link.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Password reset link sent to your email"
}
```

**Note**: Always returns success (don't reveal if email exists)

---

#### POST /auth/reset-password

Reset password with token.

**Request Body**:
```json
{
  "token": "reset-token-from-email",
  "password": "NewSecurePass123!",
  "password_confirmation": "NewSecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Password reset successfully"
}
```

**Errors**:
- `400`: Invalid or expired token
- `422`: Passwords don't match

---

#### POST /auth/verify-email

Verify email with token.

**Request Body**:
```json
{
  "token": "email-verification-token"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Email verified successfully"
}
```

---

#### POST /auth/send-otp

Send OTP to phone number.

**Request Body**:
```json
{
  "phone": "+628123456789"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "OTP sent to your phone",
  "data": {
    "expires_in": 300
  }
}
```

**Rate Limit**: 3 requests per 30 minutes per phone

---

#### POST /auth/verify-otp

Verify phone with OTP.

**Request Body**:
```json
{
  "phone": "+628123456789",
  "otp": "123456"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Phone verified successfully"
}
```

**Errors**:
- `400`: Invalid OTP
- `410`: OTP expired

---

#### POST /auth/social/google

Login with Google OAuth.

**Request Body**:
```json
{
  "id_token": "google-id-token-from-client"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "is_new_user": false,
    "user": {...}
  }
}
```

---

### User Management Endpoints

#### GET /users/me

Get current user profile.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "phone": "+628123456789",
    "role": "warga",
    "is_active": true,
    "email_verified": true,
    "phone_verified": true,
    "two_factor_enabled": false,
    "resident": {
      "id": "...",
      "nik": "3201234567890123",
      "full_name": "John Doe",
      "rt_number": "001",
      "rw_number": "005",
      "address": "...",
      "residence_status": "owner"
    },
    "created_at": "2025-01-01T00:00:00Z",
    "last_login_at": "2025-01-08T10:00:00Z"
  }
}
```

---

#### PATCH /users/me

Update current user profile.

**Headers**: `Authorization: Bearer <token>`

**Request Body** (partial update):
```json
{
  "full_name": "John Doe Updated",
  "phone": "+628123456788",
  "occupation": "Software Engineer"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "data": {
    "id": "...",
    "full_name": "John Doe Updated",
    ...
  }
}
```

**Note**: Email/phone changes require verification

---

#### POST /users/me/avatar

Upload profile avatar.

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body**:
```
avatar: <file> (max 5MB, jpg/png)
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Avatar uploaded successfully",
  "data": {
    "avatar_url": "https://storage.googleapis.com/..."
  }
}
```

---

#### POST /users/me/password

Change password.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "current_password": "OldPass123!",
  "new_password": "NewPass123!",
  "new_password_confirmation": "NewPass123!"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Password changed successfully"
}
```

---

#### POST /users/me/2fa/enable

Enable two-factor authentication.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "qr_code": "data:image/png;base64,...",
    "secret": "JBSWY3DPEHPK3PXP",
    "backup_codes": [
      "12345678",
      "87654321",
      ...
    ]
  }
}
```

---

#### POST /users/me/2fa/verify

Verify and activate 2FA.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "code": "123456"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Two-factor authentication enabled"
}
```

---

### Residents Endpoints

#### GET /residents

Get list of residents (admin only).

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `search`: Search by name, NIK, address
- `filter[rt_number]`: Filter by RT
- `filter[rw_number]`: Filter by RW
- `filter[residence_status]`: owner/tenant/boarding
- `filter[is_active]`: true/false
- `sort`: Sort field (e.g., full_name, -created_at)

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "nik": "3201234567890123",
        "full_name": "John Doe",
        "email": "user@example.com",
        "phone": "+628123456789",
        "rt_number": "001",
        "rw_number": "005",
        "address": "Jl. Example No. 123",
        "residence_status": "owner",
        "is_active": true,
        "move_in_date": "2020-01-01",
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 500,
      "total_pages": 25,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

**Permissions**: admin_rt, admin_rw, super_admin

---

#### GET /residents/:id

Get resident details.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nik": "3201234567890123",
    "kk_number": "3201234567890001",
    "full_name": "John Doe",
    "birth_date": "1990-01-15",
    "birth_place": "Jakarta",
    "gender": "M",
    "religion": "Islam",
    "marital_status": "Married",
    "occupation": "Software Engineer",
    "education": "S1",
    "email": "user@example.com",
    "phone": "+628123456789",
    "rt_number": "001",
    "rw_number": "005",
    "address": "Jl. Example No. 123",
    "residence_status": "owner",
    "move_in_date": "2020-01-01",
    "is_active": true,
    "family": {
      "id": "...",
      "kk_number": "3201234567890001",
      "members": [
        {
          "id": "...",
          "full_name": "Jane Doe",
          "relationship": "spouse"
        }
      ]
    },
    "documents": [
      {
        "id": "...",
        "type": "ktp",
        "file_url": "https://...",
        "uploaded_at": "2025-01-01T00:00:00Z"
      }
    ],
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-08T10:00:00Z"
  }
}
```

**Permissions**: 
- Own data: warga
- All residents: admin_rt, admin_rw, super_admin

---

#### POST /residents

Create new resident (admin only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "nik": "3201234567890123",
  "full_name": "John Doe",
  "birth_date": "1990-01-15",
  "birth_place": "Jakarta",
  "gender": "M",
  "email": "user@example.com",
  "phone": "+628123456789",
  "rt_number": "001",
  "rw_number": "005",
  "address": "Jl. Example No. 123",
  "residence_status": "owner",
  "move_in_date": "2020-01-01"
}
```

**Response** (201 Created):
```json
{
  "status": "success",
  "message": "Resident created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    ...
  }
}
```

**Permissions**: admin_rt, admin_rw, super_admin

---

#### PATCH /residents/:id

Update resident information.

**Headers**: `Authorization: Bearer <token>`

**Request Body** (partial):
```json
{
  "phone": "+628123456788",
  "occupation": "Engineer",
  "address": "New Address"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Resident updated successfully",
  "data": {...}
}
```

---

#### POST /residents/import

Bulk import residents from CSV.

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body**:
```
file: <csv_file> (max 10MB)
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Import completed",
  "data": {
    "total_rows": 100,
    "successful": 95,
    "failed": 5,
    "errors": [
      {
        "row": 10,
        "nik": "320123456789",
        "error": "NIK must be 16 digits"
      }
    ]
  }
}
```

**Permissions**: admin_rw, super_admin

---

#### GET /residents/export

Export residents to CSV/Excel.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `format`: csv or xlsx (default: csv)
- `filter[rt_number]`: Optional RT filter
- `filter[rw_number]`: Optional RW filter

**Response** (200 OK):
Returns file download with appropriate Content-Type

**Permissions**: admin_rt, admin_rw, super_admin

---

### Letters Endpoints

#### GET /letters/templates

Get available letter templates.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "code": "pengantar",
      "name": "Surat Pengantar RT/RW",
      "description": "Surat pengantar untuk berbagai keperluan",
      "template_variables": [
        "resident_name",
        "nik",
        "purpose",
        "destination"
      ],
      "approval_workflow": [
        {"level": 1, "role": "admin_rt"},
        {"level": 2, "role": "admin_rw"}
      ],
      "is_active": true
    }
  ]
}
```

---

#### POST /letters/requests

Submit letter request.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "template_id": "550e8400-e29b-41d4-a716-446655440000",
  "request_data": {
    "purpose": "Melamar pekerjaan",
    "destination": "PT. Example Indonesia",
    "additional_info": "Urgency: High"
  }
}
```

**Response** (201 Created):
```json
{
  "status": "success",
  "message": "Letter request submitted successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "letter_number": null,
    "status": "pending",
    "current_approval_level": 1,
    "created_at": "2025-01-08T10:00:00Z"
  }
}
```

---

#### GET /letters/requests

Get letter requests.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page`, `limit`: Pagination
- `filter[status]`: pending, in_review, approved, rejected
- `filter[resident_id]`: Filter by resident (admin only)
- `sort`: Sort field

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "...",
        "letter_number": "001/RT-005/RW-002/2025",
        "template": {
          "name": "Surat Pengantar RT/RW"
        },
        "resident": {
          "full_name": "John Doe"
        },
        "status": "approved",
        "pdf_url": "https://...",
        "created_at": "2025-01-08T10:00:00Z",
        "approved_at": "2025-01-08T11:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

**Permissions**:
- Own requests: warga
- All requests: admin_rt, admin_rw, super_admin

---

#### GET /letters/requests/:id

Get letter request details.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "letter_number": "001/RT-005/RW-002/2025",
    "template": {
      "name": "Surat Pengantar RT/RW"
    },
    "resident": {
      "full_name": "John Doe",
      "nik": "3201234567890123"
    },
    "request_data": {
      "purpose": "Melamar pekerjaan",
      "destination": "PT. Example Indonesia"
    },
    "status": "approved",
    "approval_flow": [
      {
        "level": 1,
        "approver": "Admin RT",
        "approved_at": "2025-01-08T10:30:00Z",
        "notes": "Approved"
      },
      {
        "level": 2,
        "approver": "Admin RW",
        "approved_at": "2025-01-08T11:00:00Z",
        "notes": "Approved"
      }
    ],
    "pdf_url": "https://storage.googleapis.com/...",
    "qr_code": "data:image/png;base64,...",
    "valid_until": "2025-04-08",
    "created_at": "2025-01-08T10:00:00Z",
    "approved_at": "2025-01-08T11:00:00Z"
  }
}
```

---

#### PATCH /letters/requests/:id/approve

Approve letter request (admin only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "notes": "Approved by RT"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Letter request approved",
  "data": {
    "id": "...",
    "status": "approved",
    "pdf_url": "https://..."
  }
}
```

**Permissions**: Depends on approval workflow level

---

#### PATCH /letters/requests/:id/reject

Reject letter request (admin only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "reason": "Dokumen pendukung tidak lengkap"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Letter request rejected"
}
```

---

#### GET /letters/requests/:id/download

Download approved letter PDF.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
Returns PDF file with `Content-Type: application/pdf`

---

#### GET /public/letters/verify/:hash

Verify letter authenticity (public, no auth).

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "is_valid": true,
    "letter_number": "001/RT-005/RW-002/2025",
    "letter_type": "Surat Pengantar RT/RW",
    "issue_date": "2025-01-08",
    "requester_name": "J*** D***",
    "valid_until": "2025-04-08"
  }
}
```

---

### Finance Endpoints

#### GET /finance/fee-types

Get fee types.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "id": "...",
      "code": "monthly_trash",
      "name": "Iuran Sampah",
      "description": "Iuran bulanan untuk kebersihan",
      "amount": 25000,
      "frequency": "monthly",
      "is_active": true
    }
  ]
}
```

---

#### POST /finance/transactions

Record payment (bendahara only).

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data` (if uploading proof)

**Request Body**:
```json
{
  "resident_id": "550e8400-e29b-41d4-a716-446655440000",
  "fee_type_id": "...",
  "amount": 25000,
  "payment_method": "cash",
  "payment_date": "2025-01-08",
  "notes": "Payment for January 2025"
}
```

**With proof**:
```
resident_id: uuid
fee_type_id: uuid
amount: 25000
payment_method: transfer
payment_date: 2025-01-08
proof: <file>
```

**Response** (201 Created):
```json
{
  "status": "success",
  "message": "Payment recorded successfully",
  "data": {
    "id": "...",
    "receipt_number": "RCP-20250108-001",
    "status": "verified"
  }
}
```

**Permissions**: bendahara

---

#### POST /finance/transactions/upload-proof

Upload payment proof (resident).

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body**:
```
fee_type_id: uuid
amount: 25000
payment_date: 2025-01-08
proof: <file>
notes: Transfer via BCA
```

**Response** (201 Created):
```json
{
  "status": "success",
  "message": "Payment proof uploaded. Waiting for verification.",
  "data": {
    "id": "...",
    "status": "pending_verification"
  }
}
```

---

#### GET /finance/transactions

Get transactions.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page`, `limit`: Pagination
- `filter[resident_id]`: Filter by resident
- `filter[status]`: verified, pending_verification, rejected
- `filter[payment_method]`: cash, transfer
- `filter[period_month]`: 1-12
- `filter[period_year]`: 2025
- `sort`: Sort field

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "...",
        "receipt_number": "RCP-20250108-001",
        "resident": {
          "full_name": "John Doe"
        },
        "fee_type": {
          "name": "Iuran Sampah"
        },
        "amount": 25000,
        "payment_method": "cash",
        "payment_date": "2025-01-08",
        "status": "verified",
        "verified_at": "2025-01-08T10:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

**Permissions**:
- Own transactions: warga
- All transactions: bendahara, admin_rw, super_admin

---

#### PATCH /finance/transactions/:id/verify

Verify payment proof (bendahara only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "notes": "Verified, payment received"
}
```

**Response
                password:
                  type: string
                  minLength: 8
                full_name:
                  type: string
                  minLength: 3
                  maxLength: 255
                nik:
                  type: string
                  pattern: '^\d{16}** (201 Created):
```json
{
  "status": "success",
  "message": "Registration successful. Please wait for admin approval.",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "status": "pending_approval"
  }
}
```

**Validation Rules**:
- `email`: Valid email format, unique
- `phone`: Valid Indonesian phone format (+628...), unique
- `password`: Min 8 chars, 1 uppercase, 1 number, 1 special char
- `nik`: Exactly 16 digits, unique
- `full_name`: Min 3 chars, max 255 chars
- At least one of email or phone required

**Errors**:
- `400`: Validation error
- `409`: Email/phone/NIK already exists

---

#### POST /auth/login

Authenticate user and get tokens.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Alternative** (login with phone):
```json
{
  "phone": "+628123456789",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "token_type": "Bearer",
    "expires_in": 900,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "role": "warga",
      "full_name": "John Doe",
      "is_active": true
    }
  }
}
```

**Errors**:
- `400`: Missing credentials
- `401`: Invalid credentials
- `403`: Account not approved/active
- `423`: Account locked (too many failed attempts)

---

#### POST /auth/refresh

Refresh access token using refresh token.

**Request Body**:
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGc...",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

**Errors**:
- `401`: Invalid or expired refresh token

---

#### POST /auth/logout

Logout and invalidate refresh token.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

#### POST /auth/forgot-password

Request password reset link.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Password reset link sent to your email"
}
```

**Note**: Always returns success (don't reveal if email exists)

---

#### POST /auth/reset-password

Reset password with token.

**Request Body**:
```json
{
  "token": "reset-token-from-email",
  "password": "NewSecurePass123!",
  "password_confirmation": "NewSecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Password reset successfully"
}
```

**Errors**:
- `400`: Invalid or expired token
- `422`: Passwords don't match

---

#### POST /auth/verify-email

Verify email with token.

**Request Body**:
```json
{
  "token": "email-verification-token"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Email verified successfully"
}
```

---

#### POST /auth/send-otp

Send OTP to phone number.

**Request Body**:
```json
{
  "phone": "+628123456789"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "OTP sent to your phone",
  "data": {
    "expires_in": 300
  }
}
```

**Rate Limit**: 3 requests per 30 minutes per phone

---

#### POST /auth/verify-otp

Verify phone with OTP.

**Request Body**:
```json
{
  "phone": "+628123456789",
  "otp": "123456"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Phone verified successfully"
}
```

**Errors**:
- `400`: Invalid OTP
- `410`: OTP expired

---

#### POST /auth/social/google

Login with Google OAuth.

**Request Body**:
```json
{
  "id_token": "google-id-token-from-client"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "is_new_user": false,
    "user": {...}
  }
}
```

---

### User Management Endpoints

#### GET /users/me

Get current user profile.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "phone": "+628123456789",
    "role": "warga",
    "is_active": true,
    "email_verified": true,
    "phone_verified": true,
    "two_factor_enabled": false,
    "resident": {
      "id": "...",
      "nik": "3201234567890123",
      "full_name": "John Doe",
      "rt_number": "001",
      "rw_number": "005",
      "address": "...",
      "residence_status": "owner"
    },
    "created_at": "2025-01-01T00:00:00Z",
    "last_login_at": "2025-01-08T10:00:00Z"
  }
}
```

---

#### PATCH /users/me

Update current user profile.

**Headers**: `Authorization: Bearer <token>`

**Request Body** (partial update):
```json
{
  "full_name": "John Doe Updated",
  "phone": "+628123456788",
  "occupation": "Software Engineer"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "data": {
    "id": "...",
    "full_name": "John Doe Updated",
    ...
  }
}
```

**Note**: Email/phone changes require verification

---

#### POST /users/me/avatar

Upload profile avatar.

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body**:
```
avatar: <file> (max 5MB, jpg/png)
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Avatar uploaded successfully",
  "data": {
    "avatar_url": "https://storage.googleapis.com/..."
  }
}
```

---

#### POST /users/me/password

Change password.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "current_password": "OldPass123!",
  "new_password": "NewPass123!",
  "new_password_confirmation": "NewPass123!"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Password changed successfully"
}
```

---

#### POST /users/me/2fa/enable

Enable two-factor authentication.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "qr_code": "data:image/png;base64,...",
    "secret": "JBSWY3DPEHPK3PXP",
    "backup_codes": [
      "12345678",
      "87654321",
      ...
    ]
  }
}
```

---

#### POST /users/me/2fa/verify

Verify and activate 2FA.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "code": "123456"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Two-factor authentication enabled"
}
```

---

### Residents Endpoints

#### GET /residents

Get list of residents (admin only).

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `search`: Search by name, NIK, address
- `filter[rt_number]`: Filter by RT
- `filter[rw_number]`: Filter by RW
- `filter[residence_status]`: owner/tenant/boarding
- `filter[is_active]`: true/false
- `sort`: Sort field (e.g., full_name, -created_at)

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "nik": "3201234567890123",
        "full_name": "John Doe",
        "email": "user@example.com",
        "phone": "+628123456789",
        "rt_number": "001",
        "rw_number": "005",
        "address": "Jl. Example No. 123",
        "residence_status": "owner",
        "is_active": true,
        "move_in_date": "2020-01-01",
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 500,
      "total_pages": 25,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

**Permissions**: admin_rt, admin_rw, super_admin

---

#### GET /residents/:id

Get resident details.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nik": "3201234567890123",
    "kk_number": "3201234567890001",
    "full_name": "John Doe",
    "birth_date": "1990-01-15",
    "birth_place": "Jakarta",
    "gender": "M",
    "religion": "Islam",
    "marital_status": "Married",
    "occupation": "Software Engineer",
    "education": "S1",
    "email": "user@example.com",
    "phone": "+628123456789",
    "rt_number": "001",
    "rw_number": "005",
    "address": "Jl. Example No. 123",
    "residence_status": "owner",
    "move_in_date": "2020-01-01",
    "is_active": true,
    "family": {
      "id": "...",
      "kk_number": "3201234567890001",
      "members": [
        {
          "id": "...",
          "full_name": "Jane Doe",
          "relationship": "spouse"
        }
      ]
    },
    "documents": [
      {
        "id": "...",
        "type": "ktp",
        "file_url": "https://...",
        "uploaded_at": "2025-01-01T00:00:00Z"
      }
    ],
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-08T10:00:00Z"
  }
}
```

**Permissions**: 
- Own data: warga
- All residents: admin_rt, admin_rw, super_admin

---

#### POST /residents

Create new resident (admin only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "nik": "3201234567890123",
  "full_name": "John Doe",
  "birth_date": "1990-01-15",
  "birth_place": "Jakarta",
  "gender": "M",
  "email": "user@example.com",
  "phone": "+628123456789",
  "rt_number": "001",
  "rw_number": "005",
  "address": "Jl. Example No. 123",
  "residence_status": "owner",
  "move_in_date": "2020-01-01"
}
```

**Response** (201 Created):
```json
{
  "status": "success",
  "message": "Resident created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    ...
  }
}
```

**Permissions**: admin_rt, admin_rw, super_admin

---

#### PATCH /residents/:id

Update resident information.

**Headers**: `Authorization: Bearer <token>`

**Request Body** (partial):
```json
{
  "phone": "+628123456788",
  "occupation": "Engineer",
  "address": "New Address"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Resident updated successfully",
  "data": {...}
}
```

---

#### POST /residents/import

Bulk import residents from CSV.

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body**:
```
file: <csv_file> (max 10MB)
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Import completed",
  "data": {
    "total_rows": 100,
    "successful": 95,
    "failed": 5,
    "errors": [
      {
        "row": 10,
        "nik": "320123456789",
        "error": "NIK must be 16 digits"
      }
    ]
  }
}
```

**Permissions**: admin_rw, super_admin

---

#### GET /residents/export

Export residents to CSV/Excel.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `format`: csv or xlsx (default: csv)
- `filter[rt_number]`: Optional RT filter
- `filter[rw_number]`: Optional RW filter

**Response** (200 OK):
Returns file download with appropriate Content-Type

**Permissions**: admin_rt, admin_rw, super_admin

---

### Letters Endpoints

#### GET /letters/templates

Get available letter templates.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "code": "pengantar",
      "name": "Surat Pengantar RT/RW",
      "description": "Surat pengantar untuk berbagai keperluan",
      "template_variables": [
        "resident_name",
        "nik",
        "purpose",
        "destination"
      ],
      "approval_workflow": [
        {"level": 1, "role": "admin_rt"},
        {"level": 2, "role": "admin_rw"}
      ],
      "is_active": true
    }
  ]
}
```

---

#### POST /letters/requests

Submit letter request.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "template_id": "550e8400-e29b-41d4-a716-446655440000",
  "request_data": {
    "purpose": "Melamar pekerjaan",
    "destination": "PT. Example Indonesia",
    "additional_info": "Urgency: High"
  }
}
```

**Response** (201 Created):
```json
{
  "status": "success",
  "message": "Letter request submitted successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "letter_number": null,
    "status": "pending",
    "current_approval_level": 1,
    "created_at": "2025-01-08T10:00:00Z"
  }
}
```

---

#### GET /letters/requests

Get letter requests.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page`, `limit`: Pagination
- `filter[status]`: pending, in_review, approved, rejected
- `filter[resident_id]`: Filter by resident (admin only)
- `sort`: Sort field

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "...",
        "letter_number": "001/RT-005/RW-002/2025",
        "template": {
          "name": "Surat Pengantar RT/RW"
        },
        "resident": {
          "full_name": "John Doe"
        },
        "status": "approved",
        "pdf_url": "https://...",
        "created_at": "2025-01-08T10:00:00Z",
        "approved_at": "2025-01-08T11:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

**Permissions**:
- Own requests: warga
- All requests: admin_rt, admin_rw, super_admin

---

#### GET /letters/requests/:id

Get letter request details.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "letter_number": "001/RT-005/RW-002/2025",
    "template": {
      "name": "Surat Pengantar RT/RW"
    },
    "resident": {
      "full_name": "John Doe",
      "nik": "3201234567890123"
    },
    "request_data": {
      "purpose": "Melamar pekerjaan",
      "destination": "PT. Example Indonesia"
    },
    "status": "approved",
    "approval_flow": [
      {
        "level": 1,
        "approver": "Admin RT",
        "approved_at": "2025-01-08T10:30:00Z",
        "notes": "Approved"
      },
      {
        "level": 2,
        "approver": "Admin RW",
        "approved_at": "2025-01-08T11:00:00Z",
        "notes": "Approved"
      }
    ],
    "pdf_url": "https://storage.googleapis.com/...",
    "qr_code": "data:image/png;base64,...",
    "valid_until": "2025-04-08",
    "created_at": "2025-01-08T10:00:00Z",
    "approved_at": "2025-01-08T11:00:00Z"
  }
}
```

---

#### PATCH /letters/requests/:id/approve

Approve letter request (admin only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "notes": "Approved by RT"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Letter request approved",
  "data": {
    "id": "...",
    "status": "approved",
    "pdf_url": "https://..."
  }
}
```

**Permissions**: Depends on approval workflow level

---

#### PATCH /letters/requests/:id/reject

Reject letter request (admin only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "reason": "Dokumen pendukung tidak lengkap"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Letter request rejected"
}
```

---

#### GET /letters/requests/:id/download

Download approved letter PDF.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
Returns PDF file with `Content-Type: application/pdf`

---

#### GET /public/letters/verify/:hash

Verify letter authenticity (public, no auth).

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "is_valid": true,
    "letter_number": "001/RT-005/RW-002/2025",
    "letter_type": "Surat Pengantar RT/RW",
    "issue_date": "2025-01-08",
    "requester_name": "J*** D***",
    "valid_until": "2025-04-08"
  }
}
```

---

### Finance Endpoints

#### GET /finance/fee-types

Get fee types.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "id": "...",
      "code": "monthly_trash",
      "name": "Iuran Sampah",
      "description": "Iuran bulanan untuk kebersihan",
      "amount": 25000,
      "frequency": "monthly",
      "is_active": true
    }
  ]
}
```

---

#### POST /finance/transactions

Record payment (bendahara only).

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data` (if uploading proof)

**Request Body**:
```json
{
  "resident_id": "550e8400-e29b-41d4-a716-446655440000",
  "fee_type_id": "...",
  "amount": 25000,
  "payment_method": "cash",
  "payment_date": "2025-01-08",
  "notes": "Payment for January 2025"
}
```

**With proof**:
```
resident_id: uuid
fee_type_id: uuid
amount: 25000
payment_method: transfer
payment_date: 2025-01-08
proof: <file>
```

**Response** (201 Created):
```json
{
  "status": "success",
  "message": "Payment recorded successfully",
  "data": {
    "id": "...",
    "receipt_number": "RCP-20250108-001",
    "status": "verified"
  }
}
```

**Permissions**: bendahara

---

#### POST /finance/transactions/upload-proof

Upload payment proof (resident).

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body**:
```
fee_type_id: uuid
amount: 25000
payment_date: 2025-01-08
proof: <file>
notes: Transfer via BCA
```

**Response** (201 Created):
```json
{
  "status": "success",
  "message": "Payment proof uploaded. Waiting for verification.",
  "data": {
    "id": "...",
    "status": "pending_verification"
  }
}
```

---

#### GET /finance/transactions

Get transactions.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page`, `limit`: Pagination
- `filter[resident_id]`: Filter by resident
- `filter[status]`: verified, pending_verification, rejected
- `filter[payment_method]`: cash, transfer
- `filter[period_month]`: 1-12
- `filter[period_year]`: 2025
- `sort`: Sort field

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "...",
        "receipt_number": "RCP-20250108-001",
        "resident": {
          "full_name": "John Doe"
        },
        "fee_type": {
          "name": "Iuran Sampah"
        },
        "amount": 25000,
        "payment_method": "cash",
        "payment_date": "2025-01-08",
        "status": "verified",
        "verified_at": "2025-01-08T10:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

**Permissions**:
- Own transactions: warga
- All transactions: bendahara, admin_rw, super_admin

---

#### PATCH /finance/transactions/:id/verify

Verify payment proof (bendahara only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "notes": "Verified, payment received"
}
```

**Response
                rt_number:
                  type: string
                rw_number:
                  type: string
                address:
                  type: string
            example:
              email: user@example.com
              phone: "+628123456789"
              password: SecurePass123!
              full_name: John Doe
              nik: "3201234567890123"
              rt_number: "001"
              rw_number: "005"
              address: Jl. Example No. 123
      responses:
        '201':
          description: Registration successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Success'
        '400':
          $ref: '#/components/responses/ValidationError'
        '409':
          description: Conflict - Email/phone/NIK already exists

  /auth/login:
    post:
      tags:
        - Authentication
      summary: User login
      description: Authenticate user and receive JWT tokens
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - password
              properties:
                email:
                  type: string
                  format: email
                phone:
                  type: string
                password:
                  type: string
            example:
              email: user@example.com
              password: SecurePass123!
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                  data:
                    type: object
                    properties:
                      access_token:
                        type: string
                      refresh_token:
                        type: string
                      token_type:
                        type: string
                      expires_in:
                        type: integer
                      user:
                        $ref: '#/components/schemas/User'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'

# ... (More endpoints following the same pattern)
```

---

## 6. Error Handling

### Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `UNPROCESSABLE_ENTITY` | 422 | Business logic error |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

### Error Response Examples

#### Validation Error
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "code": "INVALID_FORMAT"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters",
        "code": "TOO_SHORT"
      }
    ]
  }
}
```

#### Authentication Error
```json
{
  "status": "error",
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

#### Permission Error
```json
{
  "status": "error",
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to perform this action",
    "details": [
      {
        "required_role": "admin_rt",
        "your_role": "warga"
      }
    ]
  }
}
```

---

## 7. Rate Limiting

### Rate Limit Headers

All API responses include rate limit headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704672900
```

### Rate Limits by Endpoint Category

| Category | Limit | Window |
|----------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| Read Operations | 100 requests | 15 minutes |
| Write Operations | 50 requests | 15 minutes |
| File Uploads | 10 requests | 15 minutes |

###** (201 Created):
```json
{
  "status": "success",
  "message": "Registration successful. Please wait for admin approval.",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "status": "pending_approval"
  }
}
```

**Validation Rules**:
- `email`: Valid email format, unique
- `phone`: Valid Indonesian phone format (+628...), unique
- `password`: Min 8 chars, 1 uppercase, 1 number, 1 special char
- `nik`: Exactly 16 digits, unique
- `full_name`: Min 3 chars, max 255 chars
- At least one of email or phone required

**Errors**:
- `400`: Validation error
- `409`: Email/phone/NIK already exists

---

#### POST /auth/login

Authenticate user and get tokens.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Alternative** (login with phone):
```json
{
  "phone": "+628123456789",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "token_type": "Bearer",
    "expires_in": 900,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "role": "warga",
      "full_name": "John Doe",
      "is_active": true
    }
  }
}
```

**Errors**:
- `400`: Missing credentials
- `401`: Invalid credentials
- `403`: Account not approved/active
- `423`: Account locked (too many failed attempts)

---

#### POST /auth/refresh

Refresh access token using refresh token.

**Request Body**:
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGc...",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

**Errors**:
- `401`: Invalid or expired refresh token

---

#### POST /auth/logout

Logout and invalidate refresh token.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

#### POST /auth/forgot-password

Request password reset link.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Password reset link sent to your email"
}
```

**Note**: Always returns success (don't reveal if email exists)

---

#### POST /auth/reset-password

Reset password with token.

**Request Body**:
```json
{
  "token": "reset-token-from-email",
  "password": "NewSecurePass123!",
  "password_confirmation": "NewSecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Password reset successfully"
}
```

**Errors**:
- `400`: Invalid or expired token
- `422`: Passwords don't match

---

#### POST /auth/verify-email

Verify email with token.

**Request Body**:
```json
{
  "token": "email-verification-token"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Email verified successfully"
}
```

---

#### POST /auth/send-otp

Send OTP to phone number.

**Request Body**:
```json
{
  "phone": "+628123456789"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "OTP sent to your phone",
  "data": {
    "expires_in": 300
  }
}
```

**Rate Limit**: 3 requests per 30 minutes per phone

---

#### POST /auth/verify-otp

Verify phone with OTP.

**Request Body**:
```json
{
  "phone": "+628123456789",
  "otp": "123456"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Phone verified successfully"
}
```

**Errors**:
- `400`: Invalid OTP
- `410`: OTP expired

---

#### POST /auth/social/google

Login with Google OAuth.

**Request Body**:
```json
{
  "id_token": "google-id-token-from-client"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "is_new_user": false,
    "user": {...}
  }
}
```

---

### User Management Endpoints

#### GET /users/me

Get current user profile.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "phone": "+628123456789",
    "role": "warga",
    "is_active": true,
    "email_verified": true,
    "phone_verified": true,
    "two_factor_enabled": false,
    "resident": {
      "id": "...",
      "nik": "3201234567890123",
      "full_name": "John Doe",
      "rt_number": "001",
      "rw_number": "005",
      "address": "...",
      "residence_status": "owner"
    },
    "created_at": "2025-01-01T00:00:00Z",
    "last_login_at": "2025-01-08T10:00:00Z"
  }
}
```

---

#### PATCH /users/me

Update current user profile.

**Headers**: `Authorization: Bearer <token>`

**Request Body** (partial update):
```json
{
  "full_name": "John Doe Updated",
  "phone": "+628123456788",
  "occupation": "Software Engineer"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "data": {
    "id": "...",
    "full_name": "John Doe Updated",
    ...
  }
}
```

**Note**: Email/phone changes require verification

---

#### POST /users/me/avatar

Upload profile avatar.

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body**:
```
avatar: <file> (max 5MB, jpg/png)
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Avatar uploaded successfully",
  "data": {
    "avatar_url": "https://storage.googleapis.com/..."
  }
}
```

---

#### POST /users/me/password

Change password.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "current_password": "OldPass123!",
  "new_password": "NewPass123!",
  "new_password_confirmation": "NewPass123!"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Password changed successfully"
}
```

---

#### POST /users/me/2fa/enable

Enable two-factor authentication.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "qr_code": "data:image/png;base64,...",
    "secret": "JBSWY3DPEHPK3PXP",
    "backup_codes": [
      "12345678",
      "87654321",
      ...
    ]
  }
}
```

---

#### POST /users/me/2fa/verify

Verify and activate 2FA.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "code": "123456"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Two-factor authentication enabled"
}
```

---

### Residents Endpoints

#### GET /residents

Get list of residents (admin only).

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `search`: Search by name, NIK, address
- `filter[rt_number]`: Filter by RT
- `filter[rw_number]`: Filter by RW
- `filter[residence_status]`: owner/tenant/boarding
- `filter[is_active]`: true/false
- `sort`: Sort field (e.g., full_name, -created_at)

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "nik": "3201234567890123",
        "full_name": "John Doe",
        "email": "user@example.com",
        "phone": "+628123456789",
        "rt_number": "001",
        "rw_number": "005",
        "address": "Jl. Example No. 123",
        "residence_status": "owner",
        "is_active": true,
        "move_in_date": "2020-01-01",
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 500,
      "total_pages": 25,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

**Permissions**: admin_rt, admin_rw, super_admin

---

#### GET /residents/:id

Get resident details.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nik": "3201234567890123",
    "kk_number": "3201234567890001",
    "full_name": "John Doe",
    "birth_date": "1990-01-15",
    "birth_place": "Jakarta",
    "gender": "M",
    "religion": "Islam",
    "marital_status": "Married",
    "occupation": "Software Engineer",
    "education": "S1",
    "email": "user@example.com",
    "phone": "+628123456789",
    "rt_number": "001",
    "rw_number": "005",
    "address": "Jl. Example No. 123",
    "residence_status": "owner",
    "move_in_date": "2020-01-01",
    "is_active": true,
    "family": {
      "id": "...",
      "kk_number": "3201234567890001",
      "members": [
        {
          "id": "...",
          "full_name": "Jane Doe",
          "relationship": "spouse"
        }
      ]
    },
    "documents": [
      {
        "id": "...",
        "type": "ktp",
        "file_url": "https://...",
        "uploaded_at": "2025-01-01T00:00:00Z"
      }
    ],
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-08T10:00:00Z"
  }
}
```

**Permissions**: 
- Own data: warga
- All residents: admin_rt, admin_rw, super_admin

---

#### POST /residents

Create new resident (admin only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "nik": "3201234567890123",
  "full_name": "John Doe",
  "birth_date": "1990-01-15",
  "birth_place": "Jakarta",
  "gender": "M",
  "email": "user@example.com",
  "phone": "+628123456789",
  "rt_number": "001",
  "rw_number": "005",
  "address": "Jl. Example No. 123",
  "residence_status": "owner",
  "move_in_date": "2020-01-01"
}
```

**Response** (201 Created):
```json
{
  "status": "success",
  "message": "Resident created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    ...
  }
}
```

**Permissions**: admin_rt, admin_rw, super_admin

---

#### PATCH /residents/:id

Update resident information.

**Headers**: `Authorization: Bearer <token>`

**Request Body** (partial):
```json
{
  "phone": "+628123456788",
  "occupation": "Engineer",
  "address": "New Address"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Resident updated successfully",
  "data": {...}
}
```

---

#### POST /residents/import

Bulk import residents from CSV.

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body**:
```
file: <csv_file> (max 10MB)
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Import completed",
  "data": {
    "total_rows": 100,
    "successful": 95,
    "failed": 5,
    "errors": [
      {
        "row": 10,
        "nik": "320123456789",
        "error": "NIK must be 16 digits"
      }
    ]
  }
}
```

**Permissions**: admin_rw, super_admin

---

#### GET /residents/export

Export residents to CSV/Excel.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `format`: csv or xlsx (default: csv)
- `filter[rt_number]`: Optional RT filter
- `filter[rw_number]`: Optional RW filter

**Response** (200 OK):
Returns file download with appropriate Content-Type

**Permissions**: admin_rt, admin_rw, super_admin

---

### Letters Endpoints

#### GET /letters/templates

Get available letter templates.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "code": "pengantar",
      "name": "Surat Pengantar RT/RW",
      "description": "Surat pengantar untuk berbagai keperluan",
      "template_variables": [
        "resident_name",
        "nik",
        "purpose",
        "destination"
      ],
      "approval_workflow": [
        {"level": 1, "role": "admin_rt"},
        {"level": 2, "role": "admin_rw"}
      ],
      "is_active": true
    }
  ]
}
```

---

#### POST /letters/requests

Submit letter request.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "template_id": "550e8400-e29b-41d4-a716-446655440000",
  "request_data": {
    "purpose": "Melamar pekerjaan",
    "destination": "PT. Example Indonesia",
    "additional_info": "Urgency: High"
  }
}
```

**Response** (201 Created):
```json
{
  "status": "success",
  "message": "Letter request submitted successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "letter_number": null,
    "status": "pending",
    "current_approval_level": 1,
    "created_at": "2025-01-08T10:00:00Z"
  }
}
```

---

#### GET /letters/requests

Get letter requests.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page`, `limit`: Pagination
- `filter[status]`: pending, in_review, approved, rejected
- `filter[resident_id]`: Filter by resident (admin only)
- `sort`: Sort field

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "...",
        "letter_number": "001/RT-005/RW-002/2025",
        "template": {
          "name": "Surat Pengantar RT/RW"
        },
        "resident": {
          "full_name": "John Doe"
        },
        "status": "approved",
        "pdf_url": "https://...",
        "created_at": "2025-01-08T10:00:00Z",
        "approved_at": "2025-01-08T11:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

**Permissions**:
- Own requests: warga
- All requests: admin_rt, admin_rw, super_admin

---

#### GET /letters/requests/:id

Get letter request details.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "letter_number": "001/RT-005/RW-002/2025",
    "template": {
      "name": "Surat Pengantar RT/RW"
    },
    "resident": {
      "full_name": "John Doe",
      "nik": "3201234567890123"
    },
    "request_data": {
      "purpose": "Melamar pekerjaan",
      "destination": "PT. Example Indonesia"
    },
    "status": "approved",
    "approval_flow": [
      {
        "level": 1,
        "approver": "Admin RT",
        "approved_at": "2025-01-08T10:30:00Z",
        "notes": "Approved"
      },
      {
        "level": 2,
        "approver": "Admin RW",
        "approved_at": "2025-01-08T11:00:00Z",
        "notes": "Approved"
      }
    ],
    "pdf_url": "https://storage.googleapis.com/...",
    "qr_code": "data:image/png;base64,...",
    "valid_until": "2025-04-08",
    "created_at": "2025-01-08T10:00:00Z",
    "approved_at": "2025-01-08T11:00:00Z"
  }
}
```

---

#### PATCH /letters/requests/:id/approve

Approve letter request (admin only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "notes": "Approved by RT"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Letter request approved",
  "data": {
    "id": "...",
    "status": "approved",
    "pdf_url": "https://..."
  }
}
```

**Permissions**: Depends on approval workflow level

---

#### PATCH /letters/requests/:id/reject

Reject letter request (admin only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "reason": "Dokumen pendukung tidak lengkap"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "message": "Letter request rejected"
}
```

---

#### GET /letters/requests/:id/download

Download approved letter PDF.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
Returns PDF file with `Content-Type: application/pdf`

---

#### GET /public/letters/verify/:hash

Verify letter authenticity (public, no auth).

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "is_valid": true,
    "letter_number": "001/RT-005/RW-002/2025",
    "letter_type": "Surat Pengantar RT/RW",
    "issue_date": "2025-01-08",
    "requester_name": "J*** D***",
    "valid_until": "2025-04-08"
  }
}
```

---

### Finance Endpoints

#### GET /finance/fee-types

Get fee types.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": [
    {
      "id": "...",
      "code": "monthly_trash",
      "name": "Iuran Sampah",
      "description": "Iuran bulanan untuk kebersihan",
      "amount": 25000,
      "frequency": "monthly",
      "is_active": true
    }
  ]
}
```

---

#### POST /finance/transactions

Record payment (bendahara only).

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data` (if uploading proof)

**Request Body**:
```json
{
  "resident_id": "550e8400-e29b-41d4-a716-446655440000",
  "fee_type_id": "...",
  "amount": 25000,
  "payment_method": "cash",
  "payment_date": "2025-01-08",
  "notes": "Payment for January 2025"
}
```

**With proof**:
```
resident_id: uuid
fee_type_id: uuid
amount: 25000
payment_method: transfer
payment_date: 2025-01-08
proof: <file>
```

**Response** (201 Created):
```json
{
  "status": "success",
  "message": "Payment recorded successfully",
  "data": {
    "id": "...",
    "receipt_number": "RCP-20250108-001",
    "status": "verified"
  }
}
```

**Permissions**: bendahara

---

#### POST /finance/transactions/upload-proof

Upload payment proof (resident).

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body**:
```
fee_type_id: uuid
amount: 25000
payment_date: 2025-01-08
proof: <file>
notes: Transfer via BCA
```

**Response** (201 Created):
```json
{
  "status": "success",
  "message": "Payment proof uploaded. Waiting for verification.",
  "data": {
    "id": "...",
    "status": "pending_verification"
  }
}
```

---

#### GET /finance/transactions

Get transactions.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page`, `limit`: Pagination
- `filter[resident_id]`: Filter by resident
- `filter[status]`: verified, pending_verification, rejected
- `filter[payment_method]`: cash, transfer
- `filter[period_month]`: 1-12
- `filter[period_year]`: 2025
- `sort`: Sort field

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "...",
        "receipt_number": "RCP-20250108-001",
        "resident": {
          "full_name": "John Doe"
        },
        "fee_type": {
          "name": "Iuran Sampah"
        },
        "amount": 25000,
        "payment_method": "cash",
        "payment_date": "2025-01-08",
        "status": "verified",
        "verified_at": "2025-01-08T10:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

**Permissions**:
- Own transactions: warga
- All transactions: bendahara, admin_rw, super_admin

---

#### PATCH /finance/transactions/:id/verify

Verify payment proof (bendahara only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "notes": "Verified, payment received"
}
```

**Response