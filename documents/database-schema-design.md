# SIRW - Database Schema Design Document
## Complete Database Structure & ERD

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Table Definitions](#table-definitions)
4. [Indexes & Performance](#indexes--performance)
5. [Constraints & Validations](#constraints--validations)
6. [Migrations Strategy](#migrations-strategy)
7. [Data Types & Standards](#data-types--standards)
8. [Security Considerations](#security-considerations)

---

## 1. Overview

### Database Information
- **DBMS**: PostgreSQL 15.x
- **Character Set**: UTF8
- **Collation**: en_US.UTF-8
- **Timezone**: UTC (application handles conversion)
- **Connection Pool**: 20 connections

### Design Principles
1. **Normalization**: 3NF (Third Normal Form) with selective denormalization
2. **Soft Deletes**: Use `deleted_at` instead of hard deletes
3. **Audit Trail**: All tables have `created_at`, `updated_at`
4. **UUID Primary Keys**: For security and distributed systems
5. **Indexes**: Strategic indexes on foreign keys and query columns
6. **JSONB**: For flexible, semi-structured data

---

## 2. Entity Relationship Diagram

### Core Entity Relationships

```
┌─────────────┐
│    users    │ 1────────* ┌──────────────┐
└─────────────┘            │  residents   │
      │                    └──────────────┘
      │ 1                         │ 1
      │                           │
      │ *                         │ *
┌─────────────┐            ┌──────────────┐
│ audit_logs  │            │  families    │
└─────────────┘            └──────────────┘
                                  │ 1
                                  │
                                  │ *
                           ┌──────────────────┐
                           │ family_members   │
                           └──────────────────┘

┌──────────────┐  *        ┌──────────────────┐
│  residents   │────────1  │ letter_requests  │
└──────────────┘           └──────────────────┘
      │                            │
      │ 1                          │ *
      │                            │ 1
      │ *                   ┌──────────────────┐
┌──────────────┐            │ letter_templates │
│ transactions │            └──────────────────┘
└──────────────┘
      │ *
      │
      │ 1
┌──────────────┐
│  fee_types   │
└──────────────┘

┌──────────────┐  1        ┌──────────────────┐
│    users     │────────*  │  announcements   │
└──────────────┘           └──────────────────┘
                                  │ 1
                                  │
                                  │ *
                           ┌──────────────────────┐
                           │ announcement_reads   │
                           └──────────────────────┘

┌──────────────┐  1        ┌──────────────────┐
│  residents   │────────*  │   complaints     │
└──────────────┘           └──────────────────┘
                                  │ 1
                                  │
                                  │ *
                           ┌──────────────────────┐
                           │ complaint_timeline   │
                           └──────────────────────┘

┌──────────────┐  1        ┌──────────────────┐
│    users     │────────*  │     events       │
└──────────────┘           └──────────────────┘
                                  │ 1
                                  │
                                  │ *
                           ┌──────────────────┐
                           │  event_gallery   │
                           └──────────────────┘

┌──────────────┐  1        ┌──────────────────┐
│  residents   │────────*  │    documents     │
└──────────────┘           └──────────────────┘
```

---

## 3. Table Definitions

### 3.1 Authentication & User Management

#### `users`
Primary authentication table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'warga',
    -- Roles: super_admin, admin_rw, admin_rt, bendahara, warga, satpam
    
    -- Status flags
    is_active BOOLEAN NOT NULL DEFAULT false,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    phone_verified BOOLEAN NOT NULL DEFAULT false,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    
    -- 2FA
    two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
    two_factor_secret VARCHAR(255),
    
    -- OAuth
    oauth_provider VARCHAR(50), -- google, facebook, null
    oauth_provider_id VARCHAR(255),
    
    -- Session tracking
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT users_email_or_phone_required CHECK (
        email IS NOT NULL OR phone IS NOT NULL
    ),
    CONSTRAINT users_role_valid CHECK (
        role IN ('super_admin', 'admin_rw', 'admin_rt', 'bendahara', 'warga', 'satpam')
    )
);

-- Indexes
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_phone ON users(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_is_active ON users(is_active) WHERE deleted_at IS NULL;

-- Comments
COMMENT ON TABLE users IS 'Primary user authentication and authorization table';
COMMENT ON COLUMN users.role IS 'User role determines permissions in the system';
```

#### `refresh_tokens`
JWT refresh token storage

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info JSONB, -- browser, OS, device type
    ip_address INET,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT refresh_tokens_unique_hash UNIQUE(token_hash)
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

#### `password_resets`
Password reset tokens

```sql
CREATE TABLE password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX idx_password_resets_expires_at ON password_resets(expires_at);
```

---

### 3.2 Resident Data Management

#### `residents`
Complete resident profile information

```sql
CREATE TABLE residents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    
    -- Identity
    nik VARCHAR(16) NOT NULL UNIQUE,
    kk_number VARCHAR(16), -- Can be NULL initially
    full_name VARCHAR(255) NOT NULL,
    
    -- Personal Info
    birth_date DATE NOT NULL,
    birth_place VARCHAR(100) NOT NULL,
    gender VARCHAR(1) NOT NULL, -- M, F
    religion VARCHAR(50),
    blood_type VARCHAR(3),
    marital_status VARCHAR(50),
    nationality VARCHAR(50) DEFAULT 'Indonesia',
    
    -- Contact
    email VARCHAR(255),
    phone VARCHAR(20),
    
    -- Professional
    occupation VARCHAR(100),
    education VARCHAR(100),
    monthly_income DECIMAL(15,2),
    
    -- Residence
    rt_number VARCHAR(10) NOT NULL,
    rw_number VARCHAR(10) NOT NULL,
    address TEXT NOT NULL,
    postal_code VARCHAR(10),
    residence_status VARCHAR(20) NOT NULL, -- owner, tenant, boarding
    
    -- Dates
    move_in_date DATE NOT NULL,
    move_out_date DATE,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_kk_head BOOLEAN NOT NULL DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT residents_gender_valid CHECK (gender IN ('M', 'F')),
    CONSTRAINT residents_residence_status_valid CHECK (
        residence_status IN ('owner', 'tenant', 'boarding')
    ),
    CONSTRAINT residents_nik_format CHECK (nik ~ '^\d{16}$')
);

-- Indexes
CREATE INDEX idx_residents_user_id ON residents(user_id);
CREATE INDEX idx_residents_nik ON residents(nik) WHERE deleted_at IS NULL;
CREATE INDEX idx_residents_kk_number ON residents(kk_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_residents_rt_rw ON residents(rt_number, rw_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_residents_full_name ON residents(full_name);
CREATE INDEX idx_residents_is_active ON residents(is_active) WHERE deleted_at IS NULL;

-- Full-text search
CREATE INDEX idx_residents_search ON residents 
    USING GIN(to_tsvector('indonesian', full_name || ' ' || address)) 
    WHERE deleted_at IS NULL;
```

#### `families`
Family/household grouping

```sql
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kk_number VARCHAR(16) NOT NULL UNIQUE,
    head_resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE RESTRICT,
    
    -- Address (can differ from individual residents)
    address TEXT NOT NULL,
    rt_number VARCHAR(10) NOT NULL,
    rw_number VARCHAR(10) NOT NULL,
    postal_code VARCHAR(10),
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_families_kk_number ON families(kk_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_families_head_resident ON families(head_resident_id);
CREATE INDEX idx_families_rt_rw ON families(rt_number, rw_number);
```

#### `family_members`
Relationship between residents and families

```sql
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    relationship VARCHAR(50) NOT NULL,
    -- head, spouse, child, parent, sibling, grandchild, other
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT family_members_unique_member UNIQUE(family_id, resident_id),
    CONSTRAINT family_members_relationship_valid CHECK (
        relationship IN ('head', 'spouse', 'child', 'parent', 'sibling', 'grandchild', 'other')
    )
);

CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_family_members_resident_id ON family_members(resident_id);
```

---

### 3.3 Letter Management

#### `letter_templates`
Configurable letter templates

```sql
CREATE TABLE letter_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template Info
    code VARCHAR(50) NOT NULL UNIQUE, -- pengantar, domisili, sktm, etc
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Template Content
    template_html TEXT NOT NULL,
    template_variables JSONB NOT NULL DEFAULT '[]',
    -- Example: ["resident_name", "nik", "purpose", "destination"]
    
    -- Workflow Configuration
    approval_workflow JSONB NOT NULL DEFAULT '[]',
    -- Example: [{"level": 1, "role": "admin_rt"}, {"level": 2, "role": "admin_rw"}]
    
    requires_documents JSONB DEFAULT '[]',
    -- Example: ["ktp", "kk"]
    
    -- Validity
    validity_days INTEGER DEFAULT 90,
    
    -- Settings
    numbering_format VARCHAR(100) DEFAULT 'XXX/RT-RW/YYYY',
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_letter_templates_code ON letter_templates(code) WHERE is_active = true;
CREATE INDEX idx_letter_templates_is_active ON letter_templates(is_active);
```

#### `letter_requests`
Letter request submissions

```sql
CREATE TABLE letter_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Requester & Template
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE RESTRICT,
    template_id UUID NOT NULL REFERENCES letter_templates(id) ON DELETE RESTRICT,
    
    -- Request Data
    request_data JSONB NOT NULL,
    -- Contains all form field values specific to letter type
    
    -- Letter Number
    letter_number VARCHAR(100) UNIQUE,
    letter_date DATE,
    
    -- Workflow Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- pending, in_review, approved, rejected, ready
    
    current_approval_level INTEGER DEFAULT 1,
    approval_flow JSONB DEFAULT '[]',
    -- Tracks who approved at each level
    
    -- Rejection
    rejected_by UUID REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    rejected_at TIMESTAMP WITH TIME ZONE,
    
    -- Generated Document
    pdf_url TEXT,
    pdf_generated_at TIMESTAMP WITH TIME ZONE,
    qr_code TEXT, -- QR code for verification
    qr_hash VARCHAR(255) UNIQUE, -- Hash for verification URL
    
    -- Validity
    valid_until DATE,
    
    -- Downloaded
    downloaded_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT letter_requests_status_valid CHECK (
        status IN ('pending', 'in_review', 'approved', 'rejected', 'ready')
    )
);

-- Indexes
CREATE INDEX idx_letter_requests_resident_id ON letter_requests(resident_id);
CREATE INDEX idx_letter_requests_template_id ON letter_requests(template_id);
CREATE INDEX idx_letter_requests_status ON letter_requests(status, created_at);
CREATE INDEX idx_letter_requests_qr_hash ON letter_requests(qr_hash);
CREATE INDEX idx_letter_requests_letter_number ON letter_requests(letter_number);
```

#### `letter_approvals`
Approval history for letters

```sql
CREATE TABLE letter_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    letter_request_id UUID NOT NULL REFERENCES letter_requests(id) ON DELETE CASCADE,
    
    approver_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    approval_level INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL, -- approved, rejected
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT letter_approvals_action_valid CHECK (
        action IN ('approved', 'rejected')
    )
);

CREATE INDEX idx_letter_approvals_letter_request ON letter_approvals(letter_request_id);
CREATE INDEX idx_letter_approvals_approver ON letter_approvals(approver_id);
```

---

### 3.4 Financial Management

#### `fee_types`
Configurable fee types

```sql
CREATE TABLE fee_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    code VARCHAR(50) NOT NULL UNIQUE, -- monthly_trash, monthly_security, etc
    
    amount DECIMAL(15,2) NOT NULL,
    frequency VARCHAR(20) NOT NULL, -- monthly, one_time, annual
    
    -- Applicability
    applies_to JSONB DEFAULT '{"all": true}',
    -- Can be restricted to specific RT/RW or residence status
    
    -- Billing
    due_day INTEGER, -- Day of month for monthly fees
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fee_types_frequency_valid CHECK (
        frequency IN ('monthly', 'one_time', 'annual')
    ),
    CONSTRAINT fee_types_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_fee_types_code ON fee_types(code) WHERE is_active = true;
CREATE INDEX idx_fee_types_is_active ON fee_types(is_active);
```

#### `transactions`
Payment records

```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Payer & Fee
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE RESTRICT,
    fee_type_id UUID NOT NULL REFERENCES fee_types(id) ON DELETE RESTRICT,
    
    -- Transaction Details
    receipt_number VARCHAR(100) NOT NULL UNIQUE,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL, -- cash, transfer
    payment_date DATE NOT NULL,
    
    -- Period (for recurring fees)
    period_month INTEGER, -- 1-12
    period_year INTEGER,
    
    -- Proof
    proof_url TEXT,
    proof_uploaded_at TIMESTAMP WITH TIME ZONE,
    
    -- Verification
    status VARCHAR(30) NOT NULL DEFAULT 'pending_verification',
    -- pending_verification, verified, rejected
    
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_notes TEXT,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT transactions_payment_method_valid CHECK (
        payment_method IN ('cash', 'transfer')
    ),
    CONSTRAINT transactions_status_valid CHECK (
        status IN ('pending_verification', 'verified', 'rejected')
    ),
    CONSTRAINT transactions_amount_positive CHECK (amount > 0)
);

-- Indexes
CREATE INDEX idx_transactions_resident_id ON transactions(resident_id);
CREATE INDEX idx_transactions_fee_type_id ON transactions(fee_type_id);
CREATE INDEX idx_transactions_payment_date ON transactions(payment_date);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_period ON transactions(period_year, period_month);
CREATE INDEX idx_transactions_receipt_number ON transactions(receipt_number);
```

---

### 3.5 Communication

#### `announcements`
Community announcements

```sql
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Content
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- urgent, info, event
    
    -- Author
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    
    -- Targeting
    target_audience JSONB NOT NULL DEFAULT '{"all": true}',
    -- Can target specific RT, RW, or all
    
    -- Media
    media_urls TEXT[] DEFAULT '{}',
    attachment_urls TEXT[] DEFAULT '{}',
    
    -- Scheduling
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN NOT NULL DEFAULT false,
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    unique_view_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT announcements_category_valid CHECK (
        category IN ('urgent', 'info', 'event')
    )
);

-- Indexes
CREATE INDEX idx_announcements_author ON announcements(author_id);
CREATE INDEX idx_announcements_published ON announcements(is_published, published_at DESC);
CREATE INDEX idx_announcements_category ON announcements(category);
CREATE INDEX idx_announcements_scheduled ON announcements(scheduled_at) WHERE is_published = false;

-- Full-text search
CREATE INDEX idx_announcements_search ON announcements 
    USING GIN(to_tsvector('indonesian', title || ' ' || content))
    WHERE deleted_at IS NULL;
```

#### `announcement_reads`
Track who has read announcements

```sql
CREATE TABLE announcement_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT announcement_reads_unique UNIQUE(announcement_id, user_id)
);

CREATE INDEX idx_announcement_reads_announcement ON announcement_reads(announcement_id);
CREATE INDEX idx_announcement_reads_user ON announcement_reads(user_id);
```

---

### 3.6 Complaints & Reports

#### `complaints`
Resident complaints and reports

```sql
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Complaint Details
    complaint_number VARCHAR(100) NOT NULL UNIQUE,
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE RESTRICT,
    
    category VARCHAR(100) NOT NULL,
    -- facility_damage, security, general
    
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location TEXT,
    
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    -- low, normal, high, urgent
    
    -- Assignment
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'new',
    -- new, in_progress, resolved, closed
    
    -- Resolution
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- Media
    media_urls TEXT[] DEFAULT '{}',
    
    -- SLA Tracking
    due_date TIMESTAMP WITH TIME ZONE,
    is_overdue BOOLEAN GENERATED ALWAYS AS (
        status NOT IN ('resolved', 'closed') AND due_date < CURRENT_TIMESTAMP
    ) STORED,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT complaints_priority_valid CHECK (
        priority IN ('low', 'normal', 'high', 'urgent')
    ),
    CONSTRAINT complaints_status_valid CHECK (
        status IN ('new', 'in_progress', 'resolved', 'closed')
    )
);

-- Indexes
CREATE INDEX idx_complaints_resident ON complaints(resident_id);
CREATE INDEX idx_complaints_assigned_to ON complaints(assigned_to);
CREATE INDEX idx_complaints_status ON complaints(status, created_at DESC);
CREATE INDEX idx_complaints_priority ON complaints(priority);
CREATE INDEX idx_complaints_complaint_number ON complaints(complaint_number);
CREATE INDEX idx_complaints_overdue ON complaints(is_overdue) WHERE is_overdue = true;

-- Full-text search
CREATE INDEX idx_complaints_search ON complaints 
    USING GIN(to_tsvector('indonesian', title || ' ' || description));
```

#### `complaint_timeline`
Activity log for complaints

```sql
CREATE TABLE complaint_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    -- created, status_changed, assigned, commented, resolved, closed
    
    old_value TEXT,
    new_value TEXT,
    comment TEXT,
    is_internal BOOLEAN NOT NULL DEFAULT false, -- Internal notes not visible to resident
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_complaint_timeline_complaint ON complaint_timeline(complaint_id, created_at);
CREATE INDEX idx_complaint_timeline_user ON complaint_timeline(user_id);
```

---

### 3.7 Events

#### `events`
Community events

```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    -- social, religious, sports, meeting, other
    
    -- Organizer
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    
    -- Schedule
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    
    -- Participation
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    registration_required BOOLEAN NOT NULL DEFAULT false,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Media
    banner_url TEXT,
    
    -- Reminders
    reminder_sent BOOLEAN NOT NULL DEFAULT false,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'upcoming',
    -- upcoming, ongoing, completed, cancelled
    
    cancelled_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT events_end_after_start CHECK (end_date > start_date),
    CONSTRAINT events_status_valid CHECK (
        status IN ('upcoming', 'ongoing', 'completed', 'cancelled')
    )
);

-- Indexes
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_reminder_pending ON events(reminder_sent, start_date) 
    WHERE reminder_sent = false AND status = 'upcoming';
```

#### `event_gallery`
Event photo gallery

```sql
CREATE TABLE event_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_event_gallery_event ON event_gallery(event_id, created_at DESC);
CREATE INDEX idx_event_gallery_uploaded_by ON event_gallery(uploaded_by);
```

---

### 3.8 Documents & Files

#### `documents`
Uploaded documents for residents

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL,
    -- ktp, kk, contract, other
    
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL, -- in bytes
    mime_type VARCHAR(100) NOT NULL,
    
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    
    -- Verification
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Expiry (for time-limited documents)
    expires_at DATE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT documents_type_valid CHECK (
        type IN ('ktp', 'kk', 'contract', 'other')
    )
);

-- Indexes
CREATE INDEX idx_documents_resident ON documents(resident_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
```

---

### 3.9 System & Audit

#### `audit_logs`
Complete audit trail

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    action VARCHAR(100) NOT NULL,
    -- login, logout, create, update, delete, approve, reject, etc
    
    resource_type VARCHAR(100) NOT NULL,
    -- user, resident, letter, transaction, etc
    
    resource_id UUID,
    
    old_data JSONB,
    new_data JSONB,
    
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Partitioning by month for performance
CREATE TABLE audit_logs_y2025m01 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
-- Add more partitions as needed
```

#### `notifications`
User notification queue

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL,
    -- announcement, letter_status, payment_reminder, complaint_update, etc
    
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    data JSONB, -- Additional data (link, action, etc)
    
    -- Delivery
    channels VARCHAR(20)[] NOT NULL, -- ['email', 'push', 'in_app']
    
    -- Status
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    sent_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT notifications_channels_valid CHECK (
        channels <@ ARRAY['email', 'push', 'in_app']::VARCHAR[]
    )
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(type);
```

#### `system_settings`
Application configuration

```sql
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    
    is_public BOOLEAN NOT NULL DEFAULT false, -- Can be accessed by frontend
    
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_settings_key ON system_settings(key);
```

#### `fcm_tokens`
Firebase Cloud Messaging tokens for push notifications

```sql
CREATE TABLE fcm_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    
    device_info JSONB, -- device type, browser, OS
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fcm_tokens_unique_token UNIQUE(token)
);

CREATE INDEX idx_fcm_tokens_user ON fcm_tokens(user_id);
CREATE INDEX idx_fcm_tokens_active ON fcm_tokens(is_active) WHERE is_active = true;
```

---

## 4. Indexes & Performance

### 4.1 Primary Indexes (Already defined above)

All tables have primary indexes on UUID `id` columns.

### 4.2 Foreign Key Indexes

All foreign key columns have indexes for JOIN performance.

### 4.3 Query-Specific Indexes

#### Composite Indexes for Common Queries

```sql
-- Resident search by RT/RW and status
CREATE INDEX idx_residents_rt_rw_active 
    ON residents(rt_number, rw_number, is_active) 
    WHERE deleted_at IS NULL;

-- Letter requests by resident and status
CREATE INDEX idx_letter_requests_resident_status 
    ON letter_requests(resident_id, status, created_at DESC);

-- Transactions by resident and payment date
CREATE INDEX idx_transactions_resident_date 
    ON transactions(resident_id, payment_date DESC);

-- Transactions by period for financial reports
CREATE INDEX idx_transactions_period_verified 
    ON transactions(period_year, period_month, status) 
    WHERE status = 'verified';

-- Complaints by status and priority
CREATE INDEX idx_complaints_status_priority 
    ON complaints(status, priority, created_at DESC);

-- Announcements for feed
CREATE INDEX idx_announcements_published_feed 
    ON announcements(is_published, published_at DESC, category) 
    WHERE deleted_at IS NULL;
```

### 4.4 Partial Indexes

For filtering active/non-deleted records:

```sql
-- Active users only
CREATE INDEX idx_users_active_role 
    ON users(role, is_active) 
    WHERE deleted_at IS NULL AND is_active = true;

-- Active residents only
CREATE INDEX idx_residents_active_rt_rw 
    ON residents(rt_number, rw_number) 
    WHERE deleted_at IS NULL AND is_active = true;

-- Pending approvals
CREATE INDEX idx_letter_requests_pending 
    ON letter_requests(created_at DESC) 
    WHERE status IN ('pending', 'in_review');

-- Unverified transactions
CREATE INDEX idx_transactions_pending_verification 
    ON transactions(created_at DESC) 
    WHERE status = 'pending_verification';

-- Open complaints
CREATE INDEX idx_complaints_open 
    ON complaints(created_at DESC, priority) 
    WHERE status NOT IN ('resolved', 'closed');
```

### 4.5 Covering Indexes

For frequently accessed data:

```sql
-- Resident list view (includes most-accessed columns)
CREATE INDEX idx_residents_list_covering 
    ON residents(rt_number, rw_number, full_name, nik, residence_status, is_active) 
    WHERE deleted_at IS NULL;
```

---

## 5. Constraints & Validations

### 5.1 Check Constraints

Defined inline in table definitions above. Examples:
- Email OR phone required for users
- Valid enum values (role, status, category)
- Positive amounts for transactions
- Date range validations (end_date > start_date)

### 5.2 Unique Constraints

```sql
-- Prevent duplicate NIK
ALTER TABLE residents ADD CONSTRAINT residents_nik_unique UNIQUE(nik);

-- Prevent duplicate KK number
ALTER TABLE families ADD CONSTRAINT families_kk_unique UNIQUE(kk_number);

-- Prevent duplicate letter numbers
ALTER TABLE letter_requests ADD CONSTRAINT letter_requests_number_unique UNIQUE(letter_number);

-- Prevent duplicate receipt numbers
ALTER TABLE transactions ADD CONSTRAINT transactions_receipt_unique UNIQUE(receipt_number);

-- One read record per user per announcement
ALTER TABLE announcement_reads 
    ADD CONSTRAINT announcement_reads_unique UNIQUE(announcement_id, user_id);

-- One family member record per resident per family
ALTER TABLE family_members 
    ADD CONSTRAINT family_members_unique UNIQUE(family_id, resident_id);
```

### 5.3 Foreign Key Constraints

All foreign keys have been defined with appropriate `ON DELETE` actions:
- `CASCADE`: Delete related records (e.g., family_members when family deleted)
- `RESTRICT`: Prevent deletion if referenced (e.g., can't delete resident with active letters)
- `SET NULL`: Keep record but clear reference (e.g., deleted user in audit logs)

---

## 6. Migrations Strategy

### 6.1 Migration Naming Convention

```
YYYYMMDDHHMMSS_description_of_change.sql

Examples:
20250108100000_create_users_table.sql
20250108100001_create_residents_table.sql
20250108100002_add_index_residents_search.sql
```

### 6.2 Initial Migration (Schema Creation)

```sql
-- migrations/20250108100000_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create all tables in order (respecting dependencies)
-- 1. Independent tables first
-- 2. Tables with foreign keys next
-- 3. Junction tables last

-- See full table definitions above
```

### 6.3 Seed Data Migration

```sql
-- migrations/20250108110000_seed_initial_data.sql

-- Insert default fee types
INSERT INTO fee_types (code, name, description, amount, frequency, is_active) VALUES
    ('monthly_trash', 'Iuran Sampah', 'Iuran bulanan untuk kebersihan dan sampah', 25000, 'monthly', true),
    ('monthly_security', 'Iuran Keamanan', 'Iuran bulanan untuk satpam dan keamanan', 50000, 'monthly', true),
    ('monthly_maintenance', 'Iuran Pemeliharaan', 'Iuran bulanan untuk pemeliharaan fasilitas umum', 30000, 'monthly', true),
    ('social_fund', 'Iuran Sosial', 'Iuran untuk kegiatan sosial dan santunan', 20000, 'monthly', true);

-- Insert default letter templates
INSERT INTO letter_templates (code, name, description, template_html, template_variables, approval_workflow) VALUES
    ('pengantar', 'Surat Pengantar RT/RW', 'Surat pengantar untuk berbagai keperluan', 
     '<html>...</html>', 
     '["resident_name", "nik", "address", "purpose", "destination"]',
     '[{"level": 1, "role": "admin_rt"}, {"level": 2, "role": "admin_rw"}]'),
    
    ('domisili', 'Surat Keterangan Domisili', 'Surat keterangan tempat tinggal', 
     '<html>...</html>', 
     '["resident_name", "nik", "address", "move_in_date"]',
     '[{"level": 1, "role": "admin_rt"}]'),
    
    ('sktm', 'Surat Keterangan Tidak Mampu', 'Surat keterangan untuk bantuan sosial', 
     '<html>...</html>', 
     '["resident_name", "nik", "family_members", "occupation", "income"]',
     '[{"level": 1, "role": "admin_rt"}, {"level": 2, "role": "admin_rw"}]');

-- Insert default system settings
INSERT INTO system_settings (key, value, description, is_public) VALUES
    ('community_name', '{"name": "RW 005", "full_name": "Rukun Warga 005 Kelurahan Example"}', 'Nama komunitas', true),
    ('contact_info', '{"email": "rw005@example.com", "phone": "021-1234567"}', 'Kontak RW', true),
    ('business_hours', '{"open": "08:00", "close": "16:00", "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]}', 'Jam operasional', true);

-- Create super admin user
-- Password: 'Admin123!' (hashed with bcrypt)
INSERT INTO users (email, password_hash, role, is_active, email_verified, is_approved) VALUES
    ('admin@sirw.local', '$2b$12$K8s9kzHQkN8PZ7LMFt3ZEuHvT2rq8VzWxJQoYnKmRpLhDzN3fGtPu', 'super_admin', true, true, true);
```

### 6.4 Example Alter Migration

```sql
-- migrations/20250115000000_add_resident_blood_type.sql

-- Add column
ALTER TABLE residents ADD COLUMN blood_type VARCHAR(3);

-- Add check constraint
ALTER TABLE residents ADD CONSTRAINT residents_blood_type_valid 
    CHECK (blood_type IN ('A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'));

-- Add comment
COMMENT ON COLUMN residents.blood_type IS 'Blood type for emergency purposes';
```

### 6.5 Rollback Strategy

Each migration should have a corresponding rollback:

```sql
-- migrations/20250115000000_add_resident_blood_type.rollback.sql

ALTER TABLE residents DROP COLUMN IF EXISTS blood_type;
```

---

## 7. Data Types & Standards

### 7.1 UUID vs Integer IDs

**Decision**: Use UUID for all primary keys

**Rationale**:
- Security: Non-sequential, harder to enumerate
- Distributed systems: No coordination needed for ID generation
- Merging data: No conflicts when combining databases
- URL obfuscation: Harder to guess resource URLs

**Performance Note**: UUID is 128-bit (16 bytes) vs INT (4 bytes), but benefits outweigh storage cost.

### 7.2 Timestamp Standards

**Always use `TIMESTAMP WITH TIME ZONE`**:
- Store in UTC
- Application converts to user's timezone
- Consistent across distributed systems

**Standard timestamp columns**:
- `created_at`: Record creation time
- `updated_at`: Last modification time
- `deleted_at`: Soft delete timestamp (NULL = not deleted)

### 7.3 Soft Deletes

All major tables include `deleted_at`:
- NULL: Record is active
- Timestamp: Record is deleted
- Allows recovery and audit trail
- Queries must filter: `WHERE deleted_at IS NULL`

### 7.4 Currency & Decimal

**Use `DECIMAL(15,2)` for money**:
- 15 digits total, 2 after decimal
- Max value: 9,999,999,999,999.99 (9+ trillion)
- Exact precision (no floating point errors)

### 7.5 JSONB vs JSON

**Use JSONB (binary JSON)**:
- Faster queries and indexing
- Support for GIN indexes
- More efficient storage
- Downside: Slower writes (negligible for our use case)

### 7.6 Array Types

Use PostgreSQL arrays for:
- `media_urls`: TEXT[]
- `channels`: VARCHAR(20)[]

**Advantage**: Simpler queries, no junction table needed for simple lists

---

## 8. Security Considerations

### 8.1 Password Storage

```sql
-- NEVER store plain text passwords
-- Use bcrypt with cost factor 12
password_hash VARCHAR(255) -- stores bcrypt hash
```

**Application logic**:
```javascript
const bcrypt = require('bcrypt');
const saltRounds = 12;
const hash = await bcrypt.hash(plainPassword, saltRounds);
```

### 8.2 Sensitive Data Encryption

Encrypt at application level before storing:
- Two-factor secrets
- OAuth tokens
- Credit card info (if added later)

```sql
two_factor_secret VARCHAR(255) -- stores encrypted secret
```

### 8.3 Access Control

**Row-Level Security (RLS)** can be enabled:

```sql
-- Example: Residents can only see their own data
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY transactions_user_isolation ON transactions
    FOR ALL
    TO authenticated_user
    USING (resident_id = current_user_resident_id());

-- Function to get current user's resident_id
CREATE FUNCTION current_user_resident_id() RETURNS UUID AS $
    SELECT resident_id FROM users WHERE id = current_setting('app.current_user_id')::UUID;
$ LANGUAGE SQL STABLE;
```

### 8.4 Audit Logging

All sensitive operations logged in `audit_logs`:
- User login/logout
- Data modifications
- Permission changes
- File access

### 8.5 SQL Injection Prevention

**Use parameterized queries**:

```javascript
// BAD - vulnerable to SQL injection
const query = `SELECT * FROM users WHERE email = '${email}'`;

// GOOD - parameterized query
const query = 'SELECT * FROM users WHERE email = $1';
const values = [email];
```

**Prisma ORM provides built-in protection**.

---

## 9. Performance Optimization Tips

### 9.1 Query Optimization

```sql
-- Use EXPLAIN ANALYZE to check query plans
EXPLAIN ANALYZE
SELECT r.full_name, t.amount, t.payment_date
FROM residents r
JOIN transactions t ON r.id = t.resident_id
WHERE r.rt_number = '001' AND t.status = 'verified';

-- Look for:
-- - Seq Scan (bad for large tables) → add index
-- - Index Scan (good)
-- - Nested Loop (bad for large joins) → check indexes
```

### 9.2 Connection Pooling

```javascript
// Prisma connection pool
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Connection pool settings
  connection_limit = 20
  pool_timeout = 10
}
```

### 9.3 Pagination

```sql
-- Always use LIMIT and OFFSET for large result sets
SELECT * FROM residents
WHERE rt_number = '001'
ORDER BY full_name
LIMIT 20 OFFSET 0;

-- Better: Use cursor-based pagination for very large datasets
SELECT * FROM residents
WHERE rt_number = '001' AND id > $cursor
ORDER BY id
LIMIT 20;
```

### 9.4 Batch Operations

```sql
-- Batch inserts are much faster
INSERT INTO transactions (resident_id, fee_type_id, amount, ...)
VALUES
    ('uuid1', 'uuid2', 50000, ...),
    ('uuid3', 'uuid4', 50000, ...),
    ('uuid5', 'uuid6', 50000, ...);
-- vs individual INSERT statements
```

### 9.5 Vacuum & Analyze

```sql
-- Regular maintenance (scheduled via cron)
VACUUM ANALYZE residents;
VACUUM ANALYZE transactions;

-- For heavily updated tables
VACUUM FULL transactions; -- locks table, use carefully
```

---

## 10. Prisma Schema

### 10.1 Prisma Schema File

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                   String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email                String?   @unique @db.VarChar(255)
  phone                String?   @unique @db.VarChar(20)
  passwordHash         String?   @map("password_hash") @db.VarChar(255)
  role                 String    @default("warga") @db.VarChar(50)
  
  isActive             Boolean   @default(false) @map("is_active")
  emailVerified        Boolean   @default(false) @map("email_verified")
  phoneVerified        Boolean   @default(false) @map("phone_verified")
  isApproved           Boolean   @default(false) @map("is_approved")
  
  twoFactorEnabled     Boolean   @default(false) @map("two_factor_enabled")
  twoFactorSecret      String?   @map("two_factor_secret") @db.VarChar(255)
  
  oauthProvider        String?   @map("oauth_provider") @db.VarChar(50)
  oauthProviderId      String?   @map("oauth_provider_id") @db.VarChar(255)
  
  lastLoginAt          DateTime? @map("last_login_at") @db.Timestamptz(6)
  lastLoginIp          String?   @map("last_login_ip")
  failedLoginAttempts  Int       @default(0) @map("failed_login_attempts")
  lockedUntil          DateTime? @map("locked_until") @db.Timestamptz(6)
  
  createdAt            DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt            DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt            DateTime? @map("deleted_at") @db.Timestamptz(6)
  
  // Relations
  resident             Resident?
  refreshTokens        RefreshToken[]
  announcements        Announcement[]
  auditLogs            AuditLog[]
  fcmTokens            FcmToken[]
  
  @@map("users")
}

model Resident {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId           String?   @unique @map("user_id") @db.Uuid
  
  nik              String    @unique @db.VarChar(16)
  kkNumber         String?   @map("kk_number") @db.VarChar(16)
  fullName         String    @map("full_name") @db.VarChar(255)
  
  birthDate        DateTime  @map("birth_date") @db.Date
  birthPlace       String    @map("birth_place") @db.VarChar(100)
  gender           String    @db.VarChar(1)
  religion         String?   @db.VarChar(50)
  bloodType        String?   @map("blood_type") @db.VarChar(3)
  maritalStatus    String?   @map("marital_status") @db.VarChar(50)
  nationality      String    @default("Indonesia") @db.VarChar(50)
  
  email            String?   @db.VarChar(255)
  phone            String?   @db.VarChar(20)
  
  occupation       String?   @db.VarChar(100)
  education        String?   @db.VarChar(100)
  monthlyIncome    Decimal?  @map("monthly_income") @db.Decimal(15, 2)
  
  rtNumber         String    @map("rt_number") @db.VarChar(10)
  rwNumber         String    @map("rw_number") @db.VarChar(10)
  address          String    @db.Text
  postalCode       String?   @map("postal_code") @db.VarChar(10)
  residenceStatus  String    @map("residence_status") @db.VarChar(20)
  
  moveInDate       DateTime  @map("move_in_date") @db.Date
  moveOutDate      DateTime? @map("move_out_date") @db.Date
  
  isActive         Boolean   @default(true) @map("is_active")
  isKkHead         Boolean   @default(false) @map("is_kk_head")
  
  createdAt        DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt        DateTime? @map("deleted_at") @db.Timestamptz(6)
  
  // Relations
  user             User?               @relation(fields: [userId], references: [id])
  letterRequests   LetterRequest[]
  transactions     Transaction[]
  complaints       Complaint[]
  documents        Document[]
  familyMembers    FamilyMember[]
  
  @@map("residents")
  @@index([userId])
  @@index([nik])
  @@index([rtNumber, rwNumber])
}

// Add other models following the same pattern...
```

---

## 11. Database Backup & Maintenance

### 11.1 Backup Strategy

```bash
# Daily automated backup (Cloud SQL)
gcloud sql backups create \
  --instance=sirw-production \
  --description="Daily backup"

# Manual backup before major changes
pg_dump -h localhost -U sirw_user -d sirw_production > backup_$(date +%Y%m%d).sql

# Backup with compression
pg_dump -h localhost -U sirw_user -d sirw_production | gzip > backup_$(date +%Y%m%d).sql.gz
```

### 11.2 Restore Procedure

```bash
# Restore from SQL dump
psql -h localhost -U sirw_user -d sirw_production < backup_20250108.sql

# Restore from compressed backup
gunzip -c backup_20250108.sql.gz | psql -h localhost -U sirw_user -d sirw_production
```

### 11.3 Maintenance Tasks

```sql
-- Weekly maintenance script
-- Run during off-peak hours

-- Update statistics
ANALYZE;

-- Reclaim space
VACUUM;

-- Reindex if needed
REINDEX DATABASE sirw_production;

-- Check for bloat
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-08 | SIRW Team | Initial database schema design |

---
