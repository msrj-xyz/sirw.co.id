# SIRW - Technical Product Requirements Document
## Sistem Informasi RT/RW - PRD Teknis

---

# ENGLISH VERSION

## 1. TECHNICAL OVERVIEW

### 1.1 System Architecture
SIRW follows a modern three-tier architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────┐
│           Presentation Layer (Frontend)          │
│     React + Shadcn/UI + Tailwind CSS + PWA      │
└─────────────────────────────────────────────────┘
                        │
                        ↓ HTTPS/REST API
┌─────────────────────────────────────────────────┐
│          Application Layer (Backend)             │
│         Node.js + Express.js + JWT Auth         │
└─────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────┐
│            Data Layer (Database)                 │
│         PostgreSQL + Redis (Cache)               │
└─────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

#### Frontend
- **Framework**: React 18.x
- **UI Components**: Shadcn/UI (Radix UI primitives)
- **Styling**: Tailwind CSS 3.x
- **State Management**: React Context API + Zustand
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **API Client**: Axios with interceptors
- **PWA**: Workbox for service workers
- **Build Tool**: Vite
- **Type Safety**: TypeScript 5.x

#### Backend
- **Runtime**: Node.js 20.x LTS
- **Framework**: Express.js 4.x
- **Authentication**: JWT (JSON Web Tokens)
- **API Documentation**: Swagger/OpenAPI 3.0
- **Validation**: Joi
- **ORM**: Prisma
- **File Upload**: Multer
- **Email**: Nodemailer
- **PDF Generation**: Puppeteer / PDFKit
- **Image Processing**: Sharp
- **Task Queue**: Bull (Redis-based)
- **Type Safety**: TypeScript 5.x

#### Database & Storage
- **Primary Database**: PostgreSQL 15.x
- **Cache**: Redis 7.x
- **Object Storage**: Google Cloud Storage (GCS)
- **Search**: PostgreSQL Full-Text Search

#### Infrastructure (GCP)
- **Compute**: Google Kubernetes Engine (GKE) / Cloud Run
- **Load Balancer**: Google Cloud Load Balancing
- **CDN**: Cloud CDN
- **Monitoring**: Cloud Monitoring + Cloud Trace
- **Logging**: Cloud Logging
- **Secrets**: Secret Manager
- **DNS**: Cloud DNS
- **SSL**: Google-managed SSL certificates

#### DevOps & CI/CD
- **Version Control**: Git (GitHub/GitLab)
- **CI/CD**: GitHub Actions / Cloud Build
- **Container**: Docker
- **Orchestration**: Kubernetes
- **IaC**: Terraform
- **Monitoring**: Grafana + Prometheus (optional)

---

## 2. SYSTEM ARCHITECTURE DETAILS

### 2.1 Frontend Architecture

#### Component Structure
```
src/
├── components/
│   ├── ui/              # Shadcn/UI base components
│   ├── layout/          # Layout components
│   ├── features/        # Feature-specific components
│   └── common/          # Shared components
├── pages/               # Route pages
├── hooks/               # Custom React hooks
├── store/               # State management
├── services/            # API services
├── utils/               # Utility functions
├── types/               # TypeScript types
├── constants/           # Constants and config
└── assets/              # Static assets
```

#### State Management Strategy
- **Local State**: useState for component-specific state
- **Form State**: React Hook Form for complex forms
- **Global State**: Zustand for user auth, notifications
- **Server State**: React Query for data fetching and caching
- **URL State**: React Router for navigation state

#### PWA Implementation
- **Service Worker**: Workbox for caching strategies
- **Offline Mode**: 
  - Cache critical pages and assets
  - Queue API requests when offline
  - Sync when back online
- **Install Prompt**: Custom install banner
- **Push Notifications**: FCM integration
- **Manifest**: Web app manifest with icons and metadata

---

### 2.2 Backend Architecture

#### API Design
**RESTful API** following best practices:
- Resource-based URLs
- HTTP verbs (GET, POST, PUT, PATCH, DELETE)
- Proper status codes
- Versioned API (v1, v2)
- HATEOAS principles where applicable

**API Endpoint Structure**:
```
/api/v1/auth/*              # Authentication
/api/v1/users/*             # User management
/api/v1/residents/*         # Resident data
/api/v1/letters/*           # Letter management
/api/v1/finance/*           # Financial operations
/api/v1/announcements/*     # Announcements
/api/v1/complaints/*        # Complaints/reports
/api/v1/events/*            # Events
/api/v1/reports/*           # Analytics/reports
/api/v1/admin/*             # Admin operations
```

#### Middleware Stack
1. **CORS**: Configured for allowed origins
2. **Helmet**: Security headers
3. **Rate Limiting**: Express-rate-limit (100 req/15min per IP)
4. **Request Logging**: Morgan + Winston
5. **Body Parser**: JSON and URL-encoded
6. **Compression**: Gzip compression
7. **Authentication**: JWT verification
8. **Authorization**: Role-based access control
9. **Validation**: Request validation (Joi)
10. **Error Handler**: Centralized error handling

#### Authentication & Authorization Flow

**JWT Authentication**:
```
1. User Login → Validate credentials
2. Generate JWT (access token + refresh token)
3. Access Token: 15 minutes expiry
4. Refresh Token: 7 days expiry
5. Store refresh token in httpOnly cookie
6. Client stores access token in memory
7. Auto-refresh before expiry
```

**Authorization (RBAC)**:
```typescript
Roles Hierarchy:
- super_admin > admin_rw > admin_rt > bendahara > warga > satpam

Permissions Matrix:
{
  super_admin: ["*"],
  admin_rw: ["manage_rt", "view_all", "manage_letters", ...],
  admin_rt: ["manage_residents", "approve_letters", ...],
  bendahara: ["manage_finance", "view_payments", ...],
  warga: ["view_own", "submit_request", ...],
  satpam: ["create_report", "panic_button", ...]
}
```

---

### 2.3 Database Architecture

#### Database Schema (High-Level)

**Core Entities**:
1. **Users**: Authentication and base user info
2. **Residents**: Detailed resident information
3. **Families**: Family structure and relationships
4. **Letters**: Letter requests and templates
5. **Transactions**: Financial transactions
6. **Announcements**: Community announcements
7. **Complaints**: Reports and complaints
8. **Events**: Community events
9. **Documents**: Uploaded files metadata
10. **AuditLogs**: System audit trail

#### Key Tables Structure

```sql
-- Users (Authentication)
users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),
  role ENUM,
  is_active BOOLEAN,
  email_verified BOOLEAN,
  phone_verified BOOLEAN,
  last_login TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Residents (Profile Data)
residents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  nik VARCHAR(16) UNIQUE,
  full_name VARCHAR(255),
  birth_date DATE,
  birth_place VARCHAR(100),
  gender ENUM('M', 'F'),
  religion VARCHAR(50),
  occupation VARCHAR(100),
  marital_status VARCHAR(50),
  rt_number VARCHAR(10),
  rw_number VARCHAR(10),
  address TEXT,
  residence_status ENUM('owner', 'tenant', 'boarding'),
  move_in_date DATE,
  move_out_date DATE,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Families
families (
  id UUID PRIMARY KEY,
  kk_number VARCHAR(16) UNIQUE,
  head_resident_id UUID REFERENCES residents(id),
  address TEXT,
  rt_number VARCHAR(10),
  rw_number VARCHAR(10),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

family_members (
  id UUID PRIMARY KEY,
  family_id UUID REFERENCES families(id),
  resident_id UUID REFERENCES residents(id),
  relationship VARCHAR(50),
  created_at TIMESTAMP
)

-- Letters
letter_templates (
  id UUID PRIMARY KEY,
  type VARCHAR(50),
  name VARCHAR(255),
  template TEXT,
  required_fields JSONB,
  approval_workflow JSONB,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

letter_requests (
  id UUID PRIMARY KEY,
  resident_id UUID REFERENCES residents(id),
  template_id UUID REFERENCES letter_templates(id),
  request_data JSONB,
  status ENUM('pending', 'approved', 'rejected'),
  approval_flow JSONB,
  current_approver_id UUID,
  approved_by UUID[],
  rejected_by UUID,
  rejection_reason TEXT,
  pdf_url TEXT,
  qr_code TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  approved_at TIMESTAMP
)

-- Finance
fee_types (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  amount DECIMAL(15,2),
  frequency ENUM('monthly', 'one-time', 'annual'),
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

transactions (
  id UUID PRIMARY KEY,
  resident_id UUID REFERENCES residents(id),
  fee_type_id UUID REFERENCES fee_types(id),
  amount DECIMAL(15,2),
  payment_method ENUM('cash', 'transfer'),
  payment_date DATE,
  proof_url TEXT,
  status ENUM('pending', 'verified', 'rejected'),
  verified_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Announcements
announcements (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  content TEXT,
  category ENUM('urgent', 'info', 'event'),
  author_id UUID REFERENCES users(id),
  target_audience JSONB, -- RT/RW filters
  media_urls TEXT[],
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  is_published BOOLEAN,
  view_count INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

announcement_reads (
  id UUID PRIMARY KEY,
  announcement_id UUID REFERENCES announcements(id),
  user_id UUID REFERENCES users(id),
  read_at TIMESTAMP
)

-- Complaints
complaints (
  id UUID PRIMARY KEY,
  resident_id UUID REFERENCES residents(id),
  category VARCHAR(100),
  title VARCHAR(255),
  description TEXT,
  priority ENUM('low', 'medium', 'high', 'urgent'),
  status ENUM('new', 'in_progress', 'resolved', 'closed'),
  assigned_to UUID REFERENCES users(id),
  location TEXT,
  media_urls TEXT[],
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  resolved_at TIMESTAMP
)

complaint_timeline (
  id UUID PRIMARY KEY,
  complaint_id UUID REFERENCES complaints(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100),
  comment TEXT,
  created_at TIMESTAMP
)

-- Events
events (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  category VARCHAR(100),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  location TEXT,
  organizer_id UUID REFERENCES users(id),
  max_participants INTEGER,
  reminder_sent BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

event_gallery (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  image_url TEXT,
  caption TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP
)

-- Documents
documents (
  id UUID PRIMARY KEY,
  resident_id UUID REFERENCES residents(id),
  type VARCHAR(50),
  file_url TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP
)

-- Audit Logs
audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100),
  resource_type VARCHAR(50),
  resource_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP
)
```

#### Indexing Strategy
```sql
-- Performance-critical indexes
CREATE INDEX idx_residents_rt_rw ON residents(rt_number, rw_number);
CREATE INDEX idx_residents_nik ON residents(nik);
CREATE INDEX idx_transactions_resident_date ON transactions(resident_id, payment_date);
CREATE INDEX idx_letters_status ON letter_requests(status, created_at);
CREATE INDEX idx_announcements_published ON announcements(is_published, published_at);
CREATE INDEX idx_complaints_status ON complaints(status, created_at);
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at);

-- Full-text search indexes
CREATE INDEX idx_residents_search ON residents USING GIN(to_tsvector('indonesian', full_name || ' ' || address));
CREATE INDEX idx_announcements_search ON announcements USING GIN(to_tsvector('indonesian', title || ' ' || content));
```

#### Database Optimization
- **Connection Pooling**: Max 20 connections
- **Query Optimization**: Use EXPLAIN ANALYZE for slow queries
- **Partitioning**: Partition audit_logs by month
- **Archiving**: Archive old data (>2 years) to separate tables
- **Vacuum**: Regular VACUUM and ANALYZE
- **Read Replicas**: For reporting queries (future)

---

### 2.4 Caching Strategy

#### Redis Cache Layers
```typescript
// Cache keys structure
user:session:{userId}        // TTL: 15 min (JWT session)
user:profile:{userId}        // TTL: 1 hour
resident:list:{rt}:{rw}     // TTL: 30 min
announcement:list:latest     // TTL: 5 min
finance:dashboard:{month}    // TTL: 1 hour
reports:stats:{date}         // TTL: 24 hours
```

#### Cache Invalidation Strategy
- **Write-through**: Update cache on write operations
- **TTL-based**: Auto-expire after specified time
- **Event-based**: Invalidate on specific events (e.g., new announcement → clear announcement cache)
- **Manual**: Admin can force cache clear

---

### 2.5 File Storage Architecture

#### Google Cloud Storage Structure
```
sirw-production/
├── documents/
│   ├── ktp/
│   ├── kk/
│   └── contracts/
├── letters/
│   └── generated/
├── payments/
│   └── proofs/
├── complaints/
│   └── photos/
├── events/
│   └── gallery/
└── temp/
    └── uploads/
```

#### File Upload Flow
1. Client uploads to backend (multipart/form-data)
2. Backend validates file (type, size, virus scan)
3. Generate unique filename (UUID + extension)
4. Upload to GCS with signed URL
5. Save metadata to database
6. Return public URL to client

#### File Security
- **Signed URLs**: Time-limited access (1 hour)
- **Access Control**: IAM-based permissions
- **Virus Scanning**: ClamAV integration (optional)
- **Size Limits**: 
  - Images: 5 MB
  - Documents: 10 MB
  - PDFs: 5 MB

---

## 3. API SPECIFICATIONS

### 3.1 Authentication Endpoints

#### POST /api/v1/auth/register
**Request**:
```json
{
  "email": "user@example.com",
  "phone": "+628123456789",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "nik": "3201234567890123",
  "rt_number": "001",
  "rw_number": "005"
}
```

**Response** (201):
```json
{
  "status": "success",
  "message": "Registration successful. Please wait for admin approval.",
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "status": "pending_approval"
  }
}
```

#### POST /api/v1/auth/login
**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200):
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "warga",
      "profile": {...}
    }
  }
}
```

#### POST /api/v1/auth/refresh
**Request**:
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response** (200):
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGc..."
  }
}
```

---

### 3.2 Resident Management Endpoints

#### GET /api/v1/residents
**Query Parameters**:
- `page`: integer (default: 1)
- `limit`: integer (default: 20, max: 100)
- `rt_number`: string
- `rw_number`: string
- `search`: string (name, NIK)
- `residence_status`: enum

**Response** (200):
```json
{
  "status": "success",
  "data": {
    "residents": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 500,
      "total_pages": 25
    }
  }
}
```

#### GET /api/v1/residents/:id
**Response** (200):
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "nik": "3201234567890123",
    "full_name": "John Doe",
    "birth_date": "1990-01-01",
    "gender": "M",
    "occupation": "Software Engineer",
    "rt_number": "001",
    "rw_number": "005",
    "address": "Jl. Example No. 123",
    "residence_status": "owner",
    "family": {...},
    "documents": [...]
  }
}
```

#### POST /api/v1/residents/import
**Request**: multipart/form-data with CSV file
**Response** (200):
```json
{
  "status": "success",
  "data": {
    "total_rows": 100,
    "imported": 95,
    "failed": 5,
    "errors": [
      {
        "row": 10,
        "error": "Invalid NIK format"
      }
    ]
  }
}
```

---

### 3.3 Letter Management Endpoints

#### POST /api/v1/letters/request
**Request**:
```json
{
  "template_id": "uuid",
  "request_data": {
    "purpose": "Melamar pekerjaan",
    "destination": "PT. Example Indonesia",
    "additional_info": "..."
  }
}
```

**Response** (201):
```json
{
  "status": "success",
  "message": "Letter request submitted",
  "data": {
    "request_id": "uuid",
    "status": "pending",
    "current_approver": "admin_rt"
  }
}
```

#### GET /api/v1/letters/requests/:id
**Response** (200):
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "template": {...},
    "request_data": {...},
    "status": "approved",
    "approval_flow": [
      {
        "approver": "Admin RT",
        "approved_at": "2025-01-15T10:00:00Z",
        "notes": "Approved"
      }
    ],
    "pdf_url": "https://storage.googleapis.com/...",
    "qr_code": "data:image/png;base64,..."
  }
}
```

#### PATCH /api/v1/letters/requests/:id/approve
**Request**:
```json
{
  "notes": "Approved by RT"
}
```

**Response** (200):
```json
{
  "status": "success",
  "message": "Letter approved",
  "data": {
    "request_id": "uuid",
    "status": "approved",
    "pdf_url": "https://storage.googleapis.com/..."
  }
}
```

---

### 3.4 Financial Management Endpoints

#### POST /api/v1/finance/transactions
**Request**:
```json
{
  "resident_id": "uuid",
  "fee_type_id": "uuid",
  "amount": 50000,
  "payment_method": "transfer",
  "payment_date": "2025-01-15",
  "proof_file": "base64_or_file_upload",
  "notes": "Payment for January 2025"
}
```

**Response** (201):
```json
{
  "status": "success",
  "message": "Transaction recorded",
  "data": {
    "transaction_id": "uuid",
    "status": "pending_verification"
  }
}
```

#### GET /api/v1/finance/dashboard
**Query Parameters**:
- `month`: integer (1-12)
- `year`: integer

**Response** (200):
```json
{
  "status": "success",
  "data": {
    "total_income": 50000000,
    "total_expense": 30000000,
    "net_balance": 20000000,
    "collection_rate": 85,
    "total_arrears": 5000000,
    "income_by_category": [...],
    "expense_by_category": [...]
  }
}
```

#### GET /api/v1/finance/reports/arrears
**Response** (200):
```json
{
  "status": "success",
  "data": {
    "residents_with_arrears": [
      {
        "resident_id": "uuid",
        "name": "John Doe",
        "rt_number": "001",
        "total_arrears": 150000,
        "months_overdue": 3,
        "last_payment_date": "2024-10-15"
      }
    ],
    "total_arrears": 5000000,
    "total_residents": 45
  }
}
```

---

### 3.5 Common API Patterns

#### Success Response Format
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": {...}
}
```

#### Error Response Format
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

#### HTTP Status Codes
- **200**: Success (GET, PATCH)
- **201**: Created (POST)
- **204**: No Content (DELETE)
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (duplicate resource)
- **422**: Unprocessable Entity (business logic error)
- **429**: Too Many Requests (rate limit)
- **500**: Internal Server Error

---

## 4. SECURITY SPECIFICATIONS

### 4.1 Authentication Security
- **Password Hashing**: bcrypt (cost factor: 12)
- **JWT Signing**: RS256 (RSA + SHA-256)
- **Token Storage**: 
  - Access token: Memory (never localStorage)
  - Refresh token: httpOnly secure cookie
- **Token Rotation**: Refresh tokens rotate on use
- **Brute Force Protection**: Account lockout after 5 failed attempts (15 min)

### 4.2 Authorization
```typescript
// Permission check middleware
const requirePermission = (permission: string) => {
  return (req, res, next) => {
    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({
        status: "error",
        error: { code: "FORBIDDEN", message: "Insufficient permissions" }
      });
    }
    next();
  };
};

// Usage
router.post('/letters/approve', 
  authenticate, 
  requirePermission('approve_letters'), 
  approveLetterController
);
```

### 4.3 Data Encryption
- **In Transit**: TLS 1.3
- **At Rest**: 
  - Database: PostgreSQL encryption
  - File Storage: GCS encryption
  - Sensitive fields: Application-level encryption (AES-256)

### 4.4 Security Headers
```javascript
// Helmet configuration
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://storage.googleapis.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
})
```

### 4.5 Input Validation
```typescript
// Joi schema example
const residentSchema = Joi.object({
  nik: Joi.string().length(16).pattern(/^[0-9]+$/).required(),
  full_name: Joi.string().min(3).max(255).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+62[0-9]{9,13}$/).required(),
  birth_date: Joi.date().max('now').required(),
  rt_number: Joi.string().max(10).required(),
  rw_number: Joi.string().max(10).required()
});
```

### 4.6 Rate Limiting
```javascript
// Rate limit configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});

// Strict limits for sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later'
});
```

---

## 5. PERFORMANCE OPTIMIZATION

### 5.1 Frontend Optimization
- **Code Splitting**: Route-based lazy loading
- **Tree Shaking**: Remove unused code
- **Image Optimization**: WebP format, lazy loading
- **Bundle Size**: Target < 200KB initial bundle
- **Caching**: Service worker caching strategy
- **Compression**: Gzip/Brotli compression

### 5.2 Backend Optimization
- **Database Query Optimization**: N+1 query prevention
- **Caching**: Redis for frequently accessed data
- **Connection Pooling**: Reuse database connections
- **Async Operations**: Non-blocking I/O
- **CDN**: Static assets via CDN
- **Response Compression**: Gzip middleware

### 5.3 Database Optimization
- **Indexing**: Strategic indexes on query columns
- **Query Optimization**: EXPLAIN ANALYZE for slow queries
- **Connection Pooling**: pgBouncer for connection management
- **Read Replicas**: Separate read/write operations (future)
- **Partitioning**: Time-based partitioning for logs

---

## 6. MONITORING & OBSERVABILITY

### 6.1 Application Monitoring
```typescript
// GCP Cloud Trace integration
import { TraceAgent } from '@google-cloud/trace-agent';
const traceAgent = TraceAgent.start();

// Custom span for critical operations
const span = traceAgent.createChildSpan({ name: 'generateLetter' });
// ... operation
span.endSpan();
```

### 6.2 Logging Strategy
```typescript
// Winston logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'sirw-api' },
  transports: [
    new winston.transports.Console(),
    new LoggingWinston() // GCP Cloud Logging
  ]
});

// Log levels
logger.error('Critical error', { error, userId, action });
logger.warn('Warning condition', { details });
logger.info('Info message', { metadata });
logger.debug('Debug info', { data });
```

### 6.3 Metrics Collection
```typescript
// Key metrics to track
- API response times (p50, p95, p99)
- Error rates by endpoint
- Database query duration
- Cache hit/miss ratio
- Active users count
- Letter generation rate
- Payment recording rate
```

### 6.4 Alerting Rules
```yaml
# Example alerting configuration
alerts:
  - name: HighErrorRate
    condition: error_rate > 5%
    duration: 5m
    severity: critical
    
  - name: SlowAPIResponse
    condition: p95_response_time > 500ms
    duration: 10m
    severity: warning
    
  - name: DatabaseConnectionPoolExhausted
    condition: db_pool_usage > 90%
    duration: 5m
    severity: critical
```

---

## 7. DEPLOYMENT & INFRASTRUCTURE

### 7.1 Deployment Architecture (GCP)
```
Internet
   │
   ↓
[Cloud Load Balancer + Cloud CDN]
   │
   ├─→ [Cloud Run (Frontend)] → GCS (Static Assets)
   │
   └─→ [GKE Cluster (Backend)]
        │
        ├─→ [API Pods (3 replicas)]
        ├─→ [Worker Pods (2 replicas)]
        │
        ↓
   [Cloud SQL (PostgreSQL)]
   [Cloud Memorystore (Redis)]
   [Cloud Storage (Files)]
```

### 7.2 CI/CD Pipeline
```yaml
# GitHub Actions workflow
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Run unit tests
      - Run integration tests
      - Run linting
      
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - Build Docker images
      - Push to Container Registry
      - Run security scan
      
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - Deploy to GKE/Cloud Run
      - Run smoke tests
      - Health check validation
```

### 7.3 Environment Configuration

#### Development
```yaml
environment: development
replicas: 1
resources:
  cpu: 500m
  memory: 512Mi
database:
  host: localhost
  name: sirw_dev
redis:
  host: localhost
logging_level: debug
```

#### Staging
```yaml
environment: staging
replicas: 2
resources:
  cpu: 1000m
  memory: 1Gi
database:
  host: cloud-sql-proxy
  name: sirw_staging
redis:
  host: memorystore-staging
logging_level: info
```

#### Production
```yaml
environment: production
replicas: 3
resources:
  cpu: 2000m
  memory: 2Gi
autoscaling:
  min_replicas: 3
  max_replicas: 10
  target_cpu: 70%
database:
  host: cloud-sql-proxy
  name: sirw_production
  connection_pool: 20
redis:
  host: memorystore-production
logging_level: warn
```

---

## 8. DATA MIGRATION & IMPORT

### 8.1 CSV Import Specification

#### Expected CSV Format
```csv
NIK,Nama Lengkap,Email,No HP,Tanggal Lahir,Jenis Kelamin,Pekerjaan,RT,RW,Alamat,Status Kepemilikan
3201234567890001,John Doe,john@example.com,081234567890,1990-01-15,L,Karyawan Swasta,001,005,Jl. Example No. 1,Pemilik
3201234567890002,Jane Smith,jane@example.com,081234567891,1992-05-20,P,Wiraswasta,002,005,Jl. Example No. 2,Kontrak
```

#### Import Process Flow
```typescript
1. Upload CSV file
2. Validate file format and size
3. Parse CSV with encoding detection
4. Validate each row:
   - Check required fields
   - Validate data types
   - Check NIK format (16 digits)
   - Validate email format
   - Validate phone number
   - Check for duplicates
5. Preview results (show errors)
6. User confirms import
7. Batch insert to database
8. Send notification emails
9. Return import summary
```

#### Import Error Handling
```json
{
  "status": "partial_success",
  "summary": {
    "total_rows": 500,
    "successful": 480,
    "failed": 20
  },
  "errors": [
    {
      "row": 15,
      "nik": "320123456789",
      "error": "NIK must be 16 digits"
    },
    {
      "row": 42,
      "nik": "3201234567890042",
      "error": "Duplicate NIK found in database"
    }
  ]
}
```

---

## 9. TESTING STRATEGY

### 9.1 Testing Pyramid

```
         /\
        /E2E\         10% - End-to-End Tests
       /------\
      /  API   \      20% - Integration Tests
     /----------\
    /   Unit     \    70% - Unit Tests
   /--------------\
```

### 9.2 Unit Testing
```typescript
// Frontend (React Testing Library + Vitest)
describe('LoginForm', () => {
  it('should submit valid credentials', async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(mockLogin).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123'
    });
  });
});

// Backend (Jest)
describe('AuthService', () => {
  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const result = await authService.login('user@example.com', 'password123');
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });
    
    it('should throw error for invalid credentials', async () => {
      await expect(
        authService.login('user@example.com', 'wrongpass')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

### 9.3 Integration Testing
```typescript
// API Integration Tests (Supertest)
describe('POST /api/v1/letters/request', () => {
  it('should create letter request', async () => {
    const response = await request(app)
      .post('/api/v1/letters/request')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        template_id: templateId,
        request_data: { purpose: 'Test purpose' }
      })
      .expect(201);
      
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('request_id');
  });
  
  it('should return 401 without token', async () => {
    await request(app)
      .post('/api/v1/letters/request')
      .send({ template_id: templateId })
      .expect(401);
  });
});
```

### 9.4 E2E Testing
```typescript
// Playwright/Cypress
describe('Letter Request Flow', () => {
  it('should complete full letter request process', () => {
    // Login as resident
    cy.visit('/login');
    cy.get('[name="email"]').type('resident@example.com');
    cy.get('[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Navigate to letter request
    cy.get('[data-testid="menu-letters"]').click();
    cy.get('[data-testid="btn-new-letter"]').click();
    
    // Fill form
    cy.get('[name="letter_type"]').select('domicile');
    cy.get('[name="purpose"]').type('Job application');
    cy.get('button[type="submit"]').click();
    
    // Verify success
    cy.contains('Letter request submitted').should('be.visible');
    cy.get('[data-testid="request-status"]').should('contain', 'Pending');
  });
});
```

### 9.5 Performance Testing
```javascript
// k6 load testing
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],  // 95% requests < 200ms
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
  },
};

export default function() {
  const response = http.get('https://api.sirw.id/api/v1/announcements');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  sleep(1);
}
```

---

## 10. BACKUP & DISASTER RECOVERY

### 10.1 Backup Strategy

#### Database Backup
```yaml
# Automated daily backups
cloud_sql_backup:
  frequency: daily
  time: "02:00 UTC"
  retention: 30 days
  
# Point-in-time recovery
pitr:
  enabled: true
  retention: 7 days
  
# Manual backup before major changes
manual_backup:
  before_deployment: true
  before_data_migration: true
```

#### File Storage Backup
```yaml
gcs_backup:
  versioning: enabled
  lifecycle_rules:
    - age_days: 90
      action: delete
  object_retention: 30 days
```

### 10.2 Disaster Recovery Plan

#### RTO & RPO Targets
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 24 hours

#### Recovery Procedures
```markdown
1. Database Recovery:
   - Restore from latest automated backup
   - Apply transaction logs if available
   - Validate data integrity
   
2. Application Recovery:
   - Deploy last known good version
   - Restore configuration from Secret Manager
   - Verify all services are running
   
3. File Storage Recovery:
   - Restore from GCS versioning
   - Verify file accessibility
   
4. Validation:
   - Run smoke tests
   - Check critical user flows
   - Monitor error rates
   
5. Communication:
   - Notify users of service restoration
   - Document incident in post-mortem
```

---

## 11. COMPLIANCE & GDPR

### 11.1 Data Protection Implementation

#### Right to Access
```typescript
// GET /api/v1/users/me/data-export
// Returns all user data in JSON format
async exportUserData(userId: string): Promise<UserDataExport> {
  return {
    personal_info: await getResidentData(userId),
    letters: await getLetterRequests(userId),
    transactions: await getTransactions(userId),
    complaints: await getComplaints(userId),
    audit_logs: await getAuditLogs(userId)
  };
}
```

#### Right to Be Forgotten
```typescript
// DELETE /api/v1/users/me/account
async deleteUserAccount(userId: string): Promise<void> {
  // 1. Anonymize personal data
  await anonymizeResidentData(userId);
  
  // 2. Delete uploaded files
  await deleteUserFiles(userId);
  
  // 3. Soft delete user account
  await softDeleteUser(userId);
  
  // 4. Keep audit trail (required by law)
  await logAccountDeletion(userId);
  
  // 5. Send confirmation email
  await sendAccountDeletionConfirmation(userId);
}
```

#### Data Minimization
```typescript
// Only collect necessary data
const residentSchema = {
  required: ['nik', 'full_name', 'rt_number', 'rw_number'],
  optional: ['email', 'phone', 'occupation'],
  not_collected: ['religion', 'political_views', 'health_data']
};
```

#### Consent Management
```typescript
// Track user consent for data processing
consent_records (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  consent_type VARCHAR(50),
  granted BOOLEAN,
  granted_at TIMESTAMP,
  revoked_at TIMESTAMP
)
```

---

## 12. API DOCUMENTATION

### 12.1 OpenAPI/Swagger Setup
```typescript
// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SIRW API',
      version: '1.0.0',
      description: 'API documentation for SIRW platform'
    },
    servers: [
      { url: 'https://api.sirw.id', description: 'Production' },
      { url: 'https://staging-api.sirw.id', description: 'Staging' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.ts']
};
```

### 12.2 Example API Documentation
```typescript
/**
 * @swagger
 * /api/v1/residents:
 *   get:
 *     summary: Get list of residents
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of residents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 */
```

---