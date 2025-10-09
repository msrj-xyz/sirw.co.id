# SIRW - Complete User Stories
## Sistem Informasi RT/RW - User Stories with Acceptance Criteria

---

## 📋 Table of Contents

1. [Epic 1: Authentication & User Management](#epic-1-authentication--user-management)
2. [Epic 2: Resident Data Management](#epic-2-resident-data-management)
3. [Epic 3: Letter Management System](#epic-3-letter-management-system)
4. [Epic 4: Financial Management](#epic-4-financial-management)
5. [Epic 5: Communication & Announcements](#epic-5-communication--announcements)
6. [Epic 6: Complaint & Report Management](#epic-6-complaint--report-management)
7. [Epic 7: Event Management](#epic-7-event-management)
8. [Epic 8: Security & Emergency](#epic-8-security--emergency)
9. [Epic 9: Reporting & Analytics](#epic-9-reporting--analytics)
10. [Epic 10: Admin Operations](#epic-10-admin-operations)

---

## Story Format

Each user story follows this format:

```
### [ID] Story Title

**As a** [role]
**I want to** [action]
**So that** [benefit]

**Priority**: High/Medium/Low
**Story Points**: [1-13]
**Sprint**: [Sprint number]

#### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

#### Technical Notes
- Implementation details
- Dependencies
- API endpoints needed

#### UI/UX Notes
- Screen/component involved
- User flow
- Design considerations
```

---

# EPIC 1: Authentication & User Management

## [US-001] User Registration

**As a** prospective resident
**I want to** register an account in the system
**So that** I can access community services and information

**Priority**: High
**Story Points**: 8
**Sprint**: 1

### Acceptance Criteria
- [ ] User can access registration page from login screen
- [ ] User can register with email OR phone number
- [ ] Required fields: email/phone, password, full name, NIK, RT/RW number
- [ ] Password must meet security requirements (min 8 chars, 1 uppercase, 1 number, 1 special char)
- [ ] System validates NIK format (16 digits)
- [ ] System checks for duplicate email/phone/NIK
- [ ] User receives confirmation email/SMS after registration
- [ ] Account status is "Pending Approval" after registration
- [ ] User sees message: "Your registration has been submitted and is awaiting admin approval"
- [ ] Admin receives notification of new registration

### Technical Notes
- POST `/api/v1/auth/register`
- Send verification email via Nodemailer
- Store password as bcrypt hash (cost factor: 12)
- Create audit log entry

### UI/UX Notes
- Registration form with validation feedback
- Progress indicator for multi-step form
- Clear error messages
- Success confirmation screen

---

## [US-002] User Login

**As a** registered user
**I want to** login to the system
**So that** I can access my account and community features

**Priority**: High
**Story Points**: 5
**Sprint**: 1

### Acceptance Criteria
- [ ] User can login with email + password OR phone + password
- [ ] System validates credentials
- [ ] Failed login shows appropriate error message
- [ ] Successful login redirects to user dashboard
- [ ] System generates JWT access token (15 min expiry)
- [ ] System generates refresh token (7 days expiry, httpOnly cookie)
- [ ] Account lockout after 5 failed attempts (15 minutes)
- [ ] "Remember me" option to extend session
- [ ] Last login timestamp is updated
- [ ] Login activity is logged in audit trail

### Technical Notes
- POST `/api/v1/auth/login`
- JWT with RS256 algorithm
- Rate limiting: 5 attempts per 15 minutes
- Redis for tracking failed attempts

### UI/UX Notes
- Clean login form
- Show/hide password toggle
- "Forgot password" link
- Social login buttons below form

---

## [US-003] Social Login (Google/Facebook)

**As a** user
**I want to** login using my Google or Facebook account
**So that** I don't need to remember another password

**Priority**: Medium
**Story Points**: 5
**Sprint**: 1

### Acceptance Criteria
- [ ] User can click "Login with Google" button
- [ ] User can click "Login with Facebook" button
- [ ] OAuth flow redirects to provider
- [ ] User authorizes the application
- [ ] System receives user profile from provider
- [ ] If email exists, link to existing account (after confirmation)
- [ ] If new user, create account with "Pending Approval" status
- [ ] User is redirected to dashboard on success
- [ ] Error handling for OAuth failures

### Technical Notes
- Google OAuth 2.0 integration
- Facebook Login SDK
- Store OAuth provider info in database
- Link social account to existing user if email matches

### UI/UX Notes
- Prominent social login buttons
- Brand colors for each provider
- Loading state during OAuth flow
- Clear error messages

---

## [US-004] Phone OTP Verification

**As a** user registering with phone number
**I want to** verify my phone with OTP
**So that** the system can confirm my phone number is valid

**Priority**: High
**Story Points**: 5
**Sprint**: 1

### Acceptance Criteria
- [ ] System sends 6-digit OTP to user's phone via SMS
- [ ] OTP is valid for 5 minutes
- [ ] User can enter OTP in verification screen
- [ ] System validates OTP
- [ ] User can request new OTP (max 3 times per 30 minutes)
- [ ] Phone is marked as verified on success
- [ ] Failed attempts are limited (5 max, then temporary block)
- [ ] OTP is stored hashed in database
- [ ] Clear countdown timer showing OTP expiry

### Technical Notes
- SMS gateway integration (Twilio/local provider)
- Store OTP hash in Redis with TTL
- Rate limiting on OTP generation

### UI/UX Notes
- OTP input with auto-focus next digit
- Countdown timer display
- "Resend OTP" button (disabled during cooldown)
- Auto-submit when 6 digits entered

---

## [US-005] Two-Factor Authentication (2FA)

**As a** security-conscious user
**I want to** enable 2FA on my account
**So that** my account is more secure

**Priority**: Medium
**Story Points**: 8
**Sprint**: 2

### Acceptance Criteria
- [ ] User can enable 2FA from profile settings
- [ ] System generates TOTP secret
- [ ] User sees QR code to scan with authenticator app
- [ ] User enters verification code to confirm setup
- [ ] Backup codes are generated (10 codes)
- [ ] User must download/save backup codes before continuing
- [ ] 2FA is enforced on next login
- [ ] User can disable 2FA with password confirmation
- [ ] Admin accounts can be required to use 2FA

### Technical Notes
- Use `speakeasy` library for TOTP
- QR code generation with `qrcode` library
- Store encrypted 2FA secret
- Backup codes stored hashed

### UI/UX Notes
- Step-by-step setup wizard
- QR code display with manual code fallback
- Backup codes in downloadable format
- Clear instructions

---

## [US-006] Password Reset

**As a** user who forgot password
**I want to** reset my password
**So that** I can regain access to my account

**Priority**: High
**Story Points**: 5
**Sprint**: 1

### Acceptance Criteria
- [ ] User clicks "Forgot Password" on login page
- [ ] User enters email or phone number
- [ ] System sends reset link via email (or OTP via SMS)
- [ ] Reset link is valid for 1 hour
- [ ] User clicks link and is redirected to password reset page
- [ ] User enters new password (must meet requirements)
- [ ] User confirms new password
- [ ] Password is updated on successful submission
- [ ] All active sessions are invalidated
- [ ] User receives confirmation email
- [ ] User can login with new password

### Technical Notes
- POST `/api/v1/auth/forgot-password`
- POST `/api/v1/auth/reset-password`
- Generate secure token (crypto.randomBytes)
- Store token hash with expiry in Redis
- Invalidate all refresh tokens on reset

### UI/UX Notes
- Clear instructions on reset email
- Password strength indicator
- Confirm password matching validation
- Success message with login redirect

---

## [US-007] Profile Management

**As a** registered user
**I want to** view and edit my profile information
**So that** my information is accurate and up-to-date

**Priority**: Medium
**Story Points**: 5
**Sprint**: 2

### Acceptance Criteria
- [ ] User can view complete profile information
- [ ] User can edit: full name, email, phone, address, occupation
- [ ] User cannot edit: NIK, RT/RW number (admin only)
- [ ] Profile photo upload (max 5MB, jpg/png)
- [ ] Email change requires verification
- [ ] Phone change requires OTP verification
- [ ] Changes are saved on submit
- [ ] User sees success confirmation
- [ ] Profile changes are logged in audit trail

### Technical Notes
- GET `/api/v1/users/me`
- PATCH `/api/v1/users/me`
- Image upload to GCS
- Email/phone verification flow

### UI/UX Notes
- Profile page with tabs (Personal, Security, Documents)
- Inline editing for better UX
- Avatar cropping tool
- Form validation feedback

---

# EPIC 2: Resident Data Management

## [US-101] View Resident List

**As an** RT/RW admin
**I want to** view a list of all residents in my area
**So that** I can manage community members

**Priority**: High
**Story Points**: 5
**Sprint**: 2

### Acceptance Criteria
- [ ] Admin sees paginated list of residents (20 per page)
- [ ] Each resident card shows: name, NIK, RT/RW, status, photo
- [ ] Admin can search by: name, NIK, address
- [ ] Admin can filter by: RT/RW, residence status, active/inactive
- [ ] Admin can sort by: name, move-in date, RT/RW
- [ ] Clicking resident opens detail view
- [ ] Export list to Excel/CSV
- [ ] Display shows total resident count

### Technical Notes
- GET `/api/v1/residents?page=1&limit=20&search=&filter=`
- Pagination with page/limit
- Full-text search on name, NIK, address
- Export endpoint: GET `/api/v1/residents/export`

### UI/UX Notes
- Grid or list view toggle
- Search bar with debounce (300ms)
- Filter sidebar or dropdown
- Loading skeletons during fetch
- Empty state when no results

---

## [US-102] View Resident Details

**As an** RT/RW admin
**I want to** view detailed information about a resident
**So that** I have complete information when needed

**Priority**: High
**Story Points**: 3
**Sprint**: 2

### Acceptance Criteria
- [ ] Admin can view complete resident profile
- [ ] Display includes: personal info, family members, documents, payment history
- [ ] Show residence status and move-in/out dates
- [ ] Display uploaded documents (KTP, KK, contracts) with preview
- [ ] Show recent activity (letters requested, payments, complaints)
- [ ] Option to print resident information
- [ ] Breadcrumb navigation back to list

### Technical Notes
- GET `/api/v1/residents/:id`
- Includes related data: family, documents, transactions
- Document preview with signed URLs

### UI/UX Notes
- Tabbed interface for different sections
- Document preview modal
- Print-friendly view
- Edit button if admin has permission

---

## [US-103] Add New Resident

**As an** RT admin
**I want to** manually add a new resident
**So that** I can register someone who hasn't self-registered

**Priority**: High
**Story Points**: 5
**Sprint**: 2

### Acceptance Criteria
- [ ] Admin clicks "Add Resident" button
- [ ] Form includes all required fields: NIK, name, birth date/place, gender, RT/RW, address
- [ ] Optional fields: email, phone, occupation, marital status
- [ ] Upload documents: KTP, KK (optional at creation)
- [ ] Select residence status: owner/tenant/boarding
- [ ] System validates NIK uniqueness
- [ ] System validates required fields
- [ ] On submit, resident is created with "Active" status
- [ ] System optionally sends welcome email/SMS with account setup link
- [ ] Success message with link to resident profile

### Technical Notes
- POST `/api/v1/residents`
- Multipart form data for file uploads
- Generate temporary password if email/phone provided
- Send welcome email with account activation link

### UI/UX Notes
- Multi-step form or single page
- File upload with drag-and-drop
- Real-time validation
- Save as draft option

---

## [US-104] Edit Resident Information

**As an** RT admin
**I want to** edit resident information
**So that** I can keep data accurate and current

**Priority**: Medium
**Story Points**: 3
**Sprint**: 2

### Acceptance Criteria
- [ ] Admin can edit all resident fields
- [ ] NIK can only be edited by Super Admin
- [ ] Changes require confirmation
- [ ] All changes are logged with timestamp and admin info
- [ ] Resident receives notification of profile changes
- [ ] Success message on save
- [ ] Validation errors shown inline

### Technical Notes
- PATCH `/api/v1/residents/:id`
- Audit log creation for changes
- Notification to resident

### UI/UX Notes
- Inline editing or edit mode
- Confirmation dialog for major changes
- Highlight changed fields
- Validation feedback

---

## [US-105] Manage Family Members

**As an** admin
**I want to** add and manage family members for a resident
**So that** complete household information is maintained

**Priority**: Medium
**Story Points**: 5
**Sprint**: 3

### Acceptance Criteria
- [ ] Admin can view family members list for a resident
- [ ] Admin can add family member with: name, NIK, relationship, birth date
- [ ] Family member can be linked to existing resident or created new
- [ ] One family member is designated as head of household
- [ ] Admin can edit family member information
- [ ] Admin can remove family member (with confirmation)
- [ ] System validates: one KK number per family, valid relationships
- [ ] Changes are logged

### Technical Notes
- GET `/api/v1/families/:familyId/members`
- POST `/api/v1/families/:familyId/members`
- PATCH `/api/v1/families/:familyId/members/:memberId`
- DELETE `/api/v1/families/:familyId/members/:memberId`

### UI/UX Notes
- Family tree or table view
- Add member modal/drawer
- Relationship selector
- Confirmation dialogs for deletions

---

## [US-106] Import Residents from CSV

**As a** Super Admin
**I want to** bulk import residents from a CSV file
**So that** I can quickly populate the system with existing data

**Priority**: High
**Story Points**: 8
**Sprint**: 3

### Acceptance Criteria
- [ ] Admin can download CSV template
- [ ] Admin uploads CSV file (max 10MB)
- [ ] System validates CSV format and headers
- [ ] System shows preview with validation errors
- [ ] Admin can review and fix errors before import
- [ ] Valid rows are imported, invalid rows are skipped
- [ ] System generates import summary: total, success, failed
- [ ] Failed rows exported to CSV with error descriptions
- [ ] Import is processed in background (for large files)
- [ ] Admin receives notification when import completes

### Technical Notes
- POST `/api/v1/residents/import` (multipart/form-data)
- Background job with Bull queue
- CSV parsing with `papaparse`
- Batch insert for performance
- Transaction rollback on critical errors

### UI/UX Notes
- File upload with drag-and-drop
- Template download link
- Progress bar for upload/processing
- Results table showing errors
- Download failed rows button

---

## [US-107] Mark Resident as Inactive/Moved Out

**As an** RT admin
**I want to** mark a resident as moved out
**So that** the resident list reflects current occupancy

**Priority**: Medium
**Story Points**: 3
**Sprint**: 3

### Acceptance Criteria
- [ ] Admin can mark resident as "Inactive" or "Moved Out"
- [ ] Admin enters move-out date (defaults to today)
- [ ] Optional: move-out reason/destination
- [ ] Inactive residents don't appear in active list by default
- [ ] Filter option to view inactive residents
- [ ] Admin can reactivate resident if marked by mistake
- [ ] Move-out date is recorded and visible in history
- [ ] Resident cannot login after marked inactive (optional policy)

### Technical Notes
- PATCH `/api/v1/residents/:id/status`
- Update `is_active` and `move_out_date` fields
- Keep data for historical records

### UI/UX Notes
- Action menu on resident card
- Modal for move-out confirmation
- Date picker for move-out date
- Reason text field (optional)

---

# EPIC 3: Letter Management System

## [US-201] Request a Letter

**As a** resident
**I want to** request an official letter from RT/RW
**So that** I can obtain required documents for various purposes

**Priority**: High
**Story Points**: 8
**Sprint**: 3

### Acceptance Criteria
- [ ] User can access letter request page
- [ ] System shows available letter types (6 types)
- [ ] User selects letter type
- [ ] Form shows relevant fields based on letter type
- [ ] User fills required information: purpose, destination, etc.
- [ ] User can upload supporting documents if needed
- [ ] System validates all required fields
- [ ] On submit, request is created with "Pending" status
- [ ] User sees confirmation with request ID
- [ ] User receives notification when status changes
- [ ] User can view request status anytime

### Technical Notes
- GET `/api/v1/letters/templates` (get available types)
- POST `/api/v1/letters/requests`
- Email notification on submission
- Support file uploads (max 5MB per file)

### UI/UX Notes
- Letter type selection cards with descriptions
- Dynamic form based on letter type
- Progress indicator for multi-step
- Clear instructions for each field
- Preview before submit

---

## [US-202] View Letter Request Status

**As a** resident
**I want to** track the status of my letter request
**So that** I know when my letter will be ready

**Priority**: High
**Story Points**: 3
**Sprint**: 3

### Acceptance Criteria
- [ ] User can view list of all their letter requests
- [ ] Each request shows: type, date, status, current approver
- [ ] Status options: Pending, In Review, Approved, Rejected, Ready
- [ ] Timeline shows approval flow progress
- [ ] User can click to view request details
- [ ] Approved letters show download PDF button
- [ ] Rejected requests show reason
- [ ] Real-time status updates (no refresh needed)

### Technical Notes
- GET `/api/v1/letters/requests/my`
- GET `/api/v1/letters/requests/:id`
- WebSocket or polling for real-time updates

### UI/UX Notes
- Card or list view of requests
- Status badge with color coding
- Timeline component for approval flow
- Download button for completed letters
- Rejection reason display

---

## [US-203] Approve Letter Request (RT Admin)

**As an** RT admin
**I want to** review and approve letter requests
**So that** I can process resident requests efficiently

**Priority**: High
**Story Points**: 5
**Sprint**: 4

### Acceptance Criteria
- [ ] Admin sees list of pending letter requests for their RT
- [ ] Requests are sorted by date (oldest first)
- [ ] Admin can view request details
- [ ] Admin sees requester's information and history
- [ ] Admin can approve request with optional notes
- [ ] Admin can reject request with mandatory reason
- [ ] On approve: if RT-only letter, PDF is generated immediately
- [ ] On approve: if requires RW approval, forwarded to RW admin
- [ ] Requester receives email/push notification of decision
- [ ] Approved letters are added to admin's signature queue

### Technical Notes
- GET `/api/v1/letters/requests/pending`
- PATCH `/api/v1/letters/requests/:id/approve`
- PATCH `/api/v1/letters/requests/:id/reject`
- Trigger PDF generation on final approval
- Send notifications

### UI/UX Notes
- Dashboard widget showing pending count
- Request review page with all details
- Approve/Reject buttons with confirmation
- Notes/reason text field
- Quick actions menu

---

## [US-204] Generate Letter PDF

**As the** system
**I want to** automatically generate letter PDFs
**So that** residents can download official documents

**Priority**: High
**Story Points**: 8
**Sprint**: 4

### Acceptance Criteria
- [ ] System generates PDF when all approvals complete
- [ ] PDF includes: official header, RT/RW letterhead, logo
- [ ] PDF populates template with request data
- [ ] Digital signature and stamp are embedded
- [ ] QR code for verification is added
- [ ] PDF is uploaded to cloud storage
- [ ] Unique URL is generated
- [ ] PDF is print-ready (A4 format)
- [ ] Letter number is auto-generated sequentially
- [ ] Requester is notified with download link

### Technical Notes
- Background job triggered on approval
- PDF generation with Puppeteer or PDFKit
- HTML template rendering
- QR code generation with `qrcode` library
- Upload to GCS with signed URL
- Update request with PDF URL

### UI/UX Notes
- Professional letter template design
- Official letterhead with logo
- Clear, readable formatting
- Print margins correct

---

## [US-205] Download and Print Letter

**As a** resident
**I want to** download my approved letter as PDF
**So that** I can print and use it for my needs

**Priority**: High
**Story Points**: 2
**Sprint**: 4

### Acceptance Criteria
- [ ] User can see download button for approved letters
- [ ] Clicking download opens PDF in new tab
- [ ] PDF can be saved to device
- [ ] PDF can be printed directly from browser
- [ ] QR code is scannable after printing
- [ ] Letter remains accessible in user's history
- [ ] Download doesn't require re-approval

### Technical Notes
- GET `/api/v1/letters/requests/:id/download`
- Signed URL from GCS (24-hour expiry)
- Content-Disposition: inline for browser view

### UI/UX Notes
- Prominent download button
- Print button alongside download
- Preview modal option
- Clear filename format

---

## [US-206] Verify Letter Authenticity

**As an** external party
**I want to** verify a letter's authenticity by scanning QR code
**So that** I can confirm it's a legitimate document

**Priority**: Medium
**Story Points**: 5
**Sprint**: 4

### Acceptance Criteria
- [ ] Each letter has embedded QR code
- [ ] Scanning QR code opens verification page (public, no login)
- [ ] Page shows: letter type, issue date, requester name (partial), status
- [ ] Page confirms: "This letter is authentic and issued by RT/RW X"
- [ ] Invalid/expired letters show appropriate message
- [ ] Verification page is mobile-friendly
- [ ] No sensitive information exposed

### Technical Notes
- QR code contains: letter ID + verification hash
- GET `/api/v1/public/letters/verify/:hash`
- Public endpoint (no auth required)
- Rate limiting to prevent abuse

### UI/UX Notes
- Clean verification result page
- Green checkmark for valid
- Red X for invalid/expired
- Minimal branding
- Print-friendly

---

## [US-207] Letter Templates Management (Admin)

**As a** Super Admin
**I want to** manage letter templates
**So that** I can customize letters for my community's needs

**Priority**: Low
**Story Points**: 8
**Sprint**: 5

### Acceptance Criteria
- [ ] Admin can view list of letter templates
- [ ] Admin can edit template HTML/text
- [ ] Template uses variables: {{resident_name}}, {{nik}}, etc.
- [ ] Admin can preview template with sample data
- [ ] Admin can add custom fields to template
- [ ] Admin can configure approval workflow per template
- [ ] Changes require confirmation
- [ ] Template versioning (keep history)
- [ ] Can revert to previous version

### Technical Notes
- GET `/api/v1/letters/templates`
- PATCH `/api/v1/letters/templates/:id`
- Template engine: Handlebars or EJS
- Store templates in database

### UI/UX Notes
- Template editor with syntax highlighting
- Variable picker/helper
- Live preview pane
- Version history list
- Confirmation for breaking changes

---

# EPIC 4: Financial Management

## [US-301] Record Manual Payment

**As a** Bendahara (Treasurer)
**I want to** record payments received from residents
**So that** financial records are accurate and up-to-date

**Priority**: High
**Story Points**: 5
**Sprint**: 5

### Acceptance Criteria
- [ ] Bendahara can access payment recording page
- [ ] Select resident from dropdown/search
- [ ] Select fee type (monthly/one-time/social)
- [ ] Enter payment amount (auto-filled from fee type)
- [ ] Select payment method: Cash or Bank Transfer
- [ ] If transfer: upload payment proof image
- [ ] Enter payment date (defaults to today)
- [ ] Add optional notes
- [ ] System validates all required fields
- [ ] On submit, transaction is created with "Verified" status
- [ ] Resident receives payment confirmation notification
- [ ] Receipt number is auto-generated

### Technical Notes
- POST `/api/v1/finance/transactions`
- Image upload to GCS
- Send email/push notification to resident
- Generate unique receipt number

### UI/UX Notes
- Quick record form
- Resident autocomplete search
- Camera upload for payment proof
- Date picker
- Success message with receipt number

---

## [US-302] Upload Payment Proof (Resident)

**As a** resident
**I want to** upload proof of my bank transfer
**So that** my payment can be verified

**Priority**: High
**Story Points**: 3
**Sprint**: 5

### Acceptance Criteria
- [ ] Resident can view outstanding fees
- [ ] Resident clicks "Upload Proof" for a fee
- [ ] Resident uploads image (max 5MB, jpg/png/pdf)
- [ ] Resident enters transfer date and amount
- [ ] Optional: add notes (e.g., bank account used)
- [ ] System creates transaction with "Pending Verification" status
- [ ] Bendahara receives notification of new proof upload
- [ ] Resident can view verification status
- [ ] Resident receives notification when verified/rejected

### Technical Notes
- POST `/api/v1/finance/transactions/upload-proof`
- Image upload to GCS
- Notify treasurers of new proof
- Status: pending_verification

### UI/UX Notes
- Upload button on outstanding fees
- Image preview before upload
- Clear instructions on acceptable proof
- Upload progress indicator
- Pending status indicator

---

## [US-303] Verify Payment Proof

**As a** Bendahara
**I want to** verify payment proofs uploaded by residents
**So that** I can confirm payments are legitimate

**Priority**: High
**Story Points**: 3
**Sprint**: 5

### Acceptance Criteria
- [ ] Bendahara sees list of pending payment verifications
- [ ] Each item shows: resident, amount, date, proof image
- [ ] Bendahara can view full-size proof image
- [ ] Bendahara can approve or reject
- [ ] If reject: must provide reason
- [ ] On approve: status changes to "Verified", resident notified
- [ ] On reject: status changes to "Rejected", resident notified with reason
- [ ] Approved payments update resident's balance
- [ ] Verification decision is logged

### Technical Notes
- GET `/api/v1/finance/transactions/pending`
- PATCH `/api/v1/finance/transactions/:id/verify`
- PATCH `/api/v1/finance/transactions/:id/reject`
- Send notifications

### UI/UX Notes
- Pending queue dashboard
- Image viewer with zoom
- Quick approve/reject buttons
- Rejection reason modal
- Batch actions for multiple items

---

## [US-304] View Payment History

**As a** resident
**I want to** view my payment history
**So that** I can track my contributions and dues

**Priority**: Medium
**Story Points**: 3
**Sprint**: 5

### Acceptance Criteria
- [ ] User can access payment history page
- [ ] List shows all transactions: date, type, amount, status
- [ ] Transactions are paginated (20 per page)
- [ ] User can filter by: year, month, fee type, status
- [ ] User can search by receipt number
- [ ] Each transaction shows payment method
- [ ] User can view/download payment proof
- [ ] User can download payment history as PDF/Excel
- [ ] Total paid amount is displayed

### Technical Notes
- GET `/api/v1/finance/transactions/my`
- GET `/api/v1/finance/transactions/my/export`
- PDF generation for history

### UI/UX Notes
- Table or card view
- Filter sidebar
- Status badges
- Download receipt button per transaction
- Export to Excel button

---

## [US-305] Financial Dashboard

**As a** Bendahara or RW Admin
**I want to** view financial overview dashboard
**So that** I can monitor community finances at a glance

**Priority**: High
**Story Points**: 8
**Sprint**: 6

### Acceptance Criteria
- [ ] Dashboard shows current month summary:
  - Total income
  - Total expenses
  - Net balance
  - Collection rate percentage
- [ ] Display number of residents with arrears
- [ ] Show total arrears amount
- [ ] Chart: Income vs expenses (last 6 months)
- [ ] Chart: Collection rate trend
- [ ] Chart: Income by fee type (pie chart)
- [ ] List of recent transactions (last 10)
- [ ] Quick stats cards with month-over-month comparison
- [ ] Date range selector for custom periods
- [ ] Export dashboard as PDF report

### Technical Notes
- GET `/api/v1/finance/dashboard?month=&year=`
- Aggregate queries for statistics
- Chart data in JSON format
- Server-side PDF generation for reports

### UI/UX Notes
- Grid layout with cards
- Interactive charts (Chart.js or Recharts)
- Color-coded indicators (green/red)
- Responsive layout
- Print-friendly report view

---

## [US-306] Arrears Report

**As an** RT Admin
**I want to** view residents with outstanding payments
**So that** I can follow up on collection

**Priority**: High
**Story Points**: 5
**Sprint**: 6

### Acceptance Criteria
- [ ] Admin can access arrears report page
- [ ] Report shows residents with unpaid fees
- [ ] For each resident: name, RT, total arrears, months overdue
- [ ] Sort by: amount (high to low), months overdue
- [ ] Filter by: RT, minimum amount, months overdue
- [ ] Export to Excel/PDF
- [ ] Bulk action: send payment reminder to selected residents
- [ ] Click resident to view detailed payment history
- [ ] Summary: total residents, total arrears amount

### Technical Notes
- GET `/api/v1/finance/reports/arrears`
- Calculate overdue months from last payment
- Bulk notification endpoint

### UI/UX Notes
- Table with sorting
- Highlight severely overdue (red)
- Checkbox for bulk selection
- Send reminder button
- Export button

---

## [US-307] Send Payment Reminder

**As an** RT Admin
**I want to** send payment reminders to residents
**So that** I can improve collection rates

**Priority**: Medium
**Story Points**: 3
**Sprint**: 6

### Acceptance Criteria
- [ ] Admin can select residents to remind
- [ ] Admin can customize reminder message (optional)
- [ ] Reminder sent via email and push notification
- [ ] Reminder includes: outstanding amount, due date, payment instructions
- [ ] System tracks reminder sent date
- [ ] Residents receive friendly, non-aggressive reminder
- [ ] Admin sees confirmation of sent reminders
- [ ] Rate limit: max 1 reminder per resident per week

### Technical Notes
- POST `/api/v1/finance/reminders`
- Bulk send with queue processing
- Template-based email
- Track last reminder date

### UI/UX Notes
- Bulk select checkboxes
- Preview reminder message
- Send confirmation dialog
- Success message with count sent

---

## [US-308] Manage Fee Types

**As a** Super Admin or RW Admin
**I want to** configure different fee types and amounts
**So that** the system reflects current community fee structure

**Priority**: Medium
**Story Points**: 5
**Sprint**: 6

### Acceptance Criteria
- [ ] Admin can view list of fee types
- [ ] Admin can add new fee type with: name, description, amount, frequency
- [ ] Frequency options: monthly, one-time, annual
- [ ] Admin can edit existing fee types
- [ ] Admin can activate/deactivate fee types
- [ ] Changes affect future payments, not historical
- [ ] Fee history is maintained
- [ ] Default fees are pre-populated on system setup
- [ ] Validation: amount > 0, unique name

### Technical Notes
- GET `/api/v1/finance/fee-types`
- POST `/api/v1/finance/fee-types`
- PATCH `/api/v1/finance/fee-types/:id`
- Keep fee_history table for audit

### UI/UX Notes
- Table with inline editing
- Add fee modal/drawer
- Toggle for active/inactive
- Confirmation for changes
- History view link

---

## [US-309] Financial Reports Export

**As a** Bendahara
**I want to** export financial reports in various formats
**So that** I can share reports with the community or for archival

**Priority**: Medium
**Story Points**: 5
**Sprint**: 7

### Acceptance Criteria
- [ ] Export options: Excel, PDF, CSV
- [ ] Reports available:
  - Monthly income/expense statement
  - Annual financial summary
  - Transaction list (custom date range)
  - Arrears report
  - Collection rate report
- [ ] Admin selects report type and date range
- [ ] Admin clicks export button
- [ ] File is generated and downloaded
- [ ] Excel: formatted with headers, totals, charts
- [ ] PDF: professional layout with letterhead
- [ ] CSV: raw data for further analysis
- [ ] Large exports processed in background with email notification

### Technical Notes
- GET `/api/v1/finance/reports/export?type=&format=&from=&to=`
- Excel generation: `exceljs` library
- PDF generation: Puppeteer
- Background job for large datasets

### UI/UX Notes
- Report selection dropdown
- Date range picker
- Format radio buttons
- Download progress indicator
- Generated files list for download

---

# EPIC 5: Communication & Announcements

## [US-401] Create Announcement

**As an** RT/RW Admin
**I want to** create and publish announcements
**So that** I can communicate important information to residents

**Priority**: High
**Story Points**: 5
**Sprint**: 7

### Acceptance Criteria
- [ ] Admin can access announcement creation page
- [ ] Admin enters: title, content (rich text), category
- [ ] Category options: Urgent, Information, Event
- [ ] Admin can upload images/attachments (max 3 files, 5MB each)
- [ ] Admin selects target audience: All, specific RT(s), specific RW
- [ ] Admin can schedule announcement for future (optional)
- [ ] Admin can save as draft
- [ ] On publish: announcement is visible to target residents
- [ ] Notifications sent via: in-app, email, push
- [ ] Admin can preview before publishing
- [ ] Urgent announcements highlighted in red

### Technical Notes
- POST `/api/v1/announcements`
- Rich text editor: TipTap or Quill
- File upload to GCS
- Schedule with Bull queue
- Multi-channel notification dispatch

### UI/UX Notes
- WYSIWYG editor
- Category selector with icons
- Audience selector (checkboxes)
- Schedule date/time picker
- Preview modal
- Draft/Publish buttons

---

## [US-402] View Announcements

**As a** resident
**I want to** view community announcements
**So that** I stay informed about community news and events

**Priority**: High
**Story Points**: 3
**Sprint**: 7

### Acceptance Criteria
- [ ] User sees announcements on home dashboard
- [ ] Latest 5 announcements shown on dashboard
- [ ] Full announcements list accessible via menu
- [ ] Announcements sorted by date (newest first)
- [ ] Urgent announcements appear at top
- [ ] Each announcement shows: title, category badge, date, author, excerpt
- [ ] Click to view full announcement with images
- [ ] Unread announcements have indicator dot
- [ ] Announcement marked as read when viewed
- [ ] User can filter by category
- [ ] Pagination: 10 per page

### Technical Notes
- GET `/api/v1/announcements?page=1&category=`
- GET `/api/v1/announcements/:id`
- POST `/api/v1/announcements/:id/mark-read`
- Track read status per user

### UI/UX Notes
- Card layout for announcements
- Category badge with color coding
- Unread indicator (blue dot)
- Image gallery for multiple images
- Share button (future feature)

---

## [US-403] Push Notifications

**As a** resident
**I want to** receive push notifications for important announcements
**So that** I don't miss critical information

**Priority**: Medium
**Story Points**: 8
**Sprint**: 8

### Acceptance Criteria
- [ ] User can enable/disable push notifications in settings
- [ ] Browser prompts for notification permission on first use
- [ ] Push notification sent when announcement published
- [ ] Notification shows: title, excerpt, category icon
- [ ] Clicking notification opens announcement
- [ ] Notifications respect user's "Do Not Disturb" settings
- [ ] User can customize notification preferences:
  - All announcements
  - Urgent only
  - None
- [ ] PWA notifications work on mobile
- [ ] Fallback to email if push not available

### Technical Notes
- Firebase Cloud Messaging (FCM) integration
- Service worker for notification handling
- Store FCM tokens in database
- POST `/api/v1/users/notifications/subscribe`
- DELETE `/api/v1/users/notifications/unsubscribe`

### UI/UX Notes
- Permission prompt with explanation
- Notification settings in profile
- Test notification button
- Clear instructions for enabling
- Notification preview

---

## [US-404] Email Notifications

**As a** resident
**I want to** receive email notifications
**So that** I'm informed even when not using the app

**Priority**: Medium
**Story Points**: 5
**Sprint**: 8

### Acceptance Criteria
- [ ] Email sent for: new announcements, letter status, payment reminders
- [ ] Email includes: branded header, content, CTA button
- [ ] Email is mobile-responsive
- [ ] User can control email frequency in settings:
  - Immediate
  - Daily digest
  - Weekly digest
  - None
- [ ] Unsubscribe link in every email
- [ ] Email includes "View in Browser" link
- [ ] Track email open and click rates
- [ ] Bounce and complaint handling

### Technical Notes
- Nodemailer with SendGrid/AWS SES
- HTML email templates with Handlebars
- Queue email jobs with Bull
- Store email preferences in user settings
- Track delivery status

### UI/UX Notes
- Professional email template design
- Clear subject lines
- Mobile-optimized layout
- Prominent CTA buttons
- Footer with contact info and unsubscribe

---

## [US-405] Announcement Analytics

**As an** Admin
**I want to** view announcement engagement metrics
**So that** I can understand communication effectiveness

**Priority**: Low
**Story Points**: 5
**Sprint**: 9

### Acceptance Criteria
- [ ] Admin can view metrics per announcement:
  - Total views
  - Unique viewers
  - View rate (% of target audience)
  - Email open rate
  - Push notification click rate
- [ ] Time-series chart of views over time
- [ ] List of users who haven't viewed
- [ ] Export engagement data to Excel
- [ ] Compare performance across categories
- [ ] Best/worst performing announcements

### Technical Notes
- GET `/api/v1/announcements/:id/analytics`
- Aggregate read receipts
- Track email opens with tracking pixel
- Track push notification clicks

### UI/UX Notes
- Analytics dashboard per announcement
- Charts with Chart.js
- Comparison view
- Export button
- Non-viewer list with reminder option

---

# EPIC 6: Complaint & Report Management

## [US-501] Submit Complaint/Report

**As a** resident
**I want to** submit complaints or reports
**So that** issues in the community can be addressed

**Priority**: High
**Story Points**: 5
**Sprint**: 9

### Acceptance Criteria
- [ ] User can access complaint form
- [ ] User selects category: Facility Damage, Security, General
- [ ] User enters title and detailed description
- [ ] User can set priority: Normal, High, Urgent
- [ ] User can upload up to 3 photos (max 5MB each)
- [ ] Optional: location/address field
- [ ] System validates required fields
- [ ] On submit, complaint gets unique ID
- [ ] Status set to "New"
- [ ] User receives confirmation with complaint ID
- [ ] Admin receives notification of new complaint
- [ ] User can track complaint status

### Technical Notes
- POST `/api/v1/complaints`
- Image upload to GCS
- Send notification to relevant admins
- Auto-assign based on category (future)

### UI/UX Notes
- Simple, mobile-friendly form
- Category icons/cards
- Multi-image upload with preview
- Priority selector
- Success confirmation screen

---

## [US-502] View My Complaints

**As a** resident
**I want to** view all my submitted complaints
**So that** I can track their status and resolution

**Priority**: High
**Story Points**: 3
**Sprint**: 9

### Acceptance Criteria
- [ ] User can view list of their complaints
- [ ] Each complaint shows: ID, title, category, status, date
- [ ] Complaints sorted by date (newest first)
- [ ] Status options: New, In Progress, Resolved, Closed
- [ ] Click complaint to view full details
- [ ] Details include: timeline of actions, assigned person, resolution notes
- [ ] User can see photos they uploaded
- [ ] User can add comments to ongoing complaints
- [ ] Resolved complaints show resolution details

### Technical Notes
- GET `/api/v1/complaints/my`
- GET `/api/v1/complaints/:id`
- Include timeline/comments

### UI/UX Notes
- Card or list view
- Status badges with colors
- Timeline component showing progress
- Comment section
- Photo gallery

---

## [US-503] Manage Complaints (Admin)

**As an** RT/RW Admin
**I want to** manage and respond to complaints
**So that** I can address resident concerns efficiently

**Priority**: High
**Story Points**: 8
**Sprint**: 10

### Acceptance Criteria
- [ ] Admin sees dashboard with complaint statistics
- [ ] Admin can view all complaints or filter by:
  - Status (New, In Progress, Resolved, Closed)
  - Category
  - Priority
  - Date range
- [ ] Admin can assign complaint to team member
- [ ] Admin can update status
- [ ] Admin can add internal notes (not visible to resident)
- [ ] Admin can add public comments (visible to resident)
- [ ] Admin can mark as resolved with resolution notes
- [ ] Resident receives notification on status changes
- [ ] Admin can close complaint (after resolution)
- [ ] SLA tracking: highlight overdue complaints

### Technical Notes
- GET `/api/v1/complaints?status=&category=&priority=`
- PATCH `/api/v1/complaints/:id/assign`
- PATCH `/api/v1/complaints/:id/status`
- POST `/api/v1/complaints/:id/comments`
- Calculate SLA based on priority

### UI/UX Notes
- Kanban board view optional
- Table view with filters
- Complaint detail drawer/modal
- Assignment dropdown
- Status dropdown with confirmation
- Comment section (internal vs public)

---

## [US-504] Complaint Timeline

**As a** resident or admin
**I want to** view complete complaint timeline
**So that** I can see all actions taken

**Priority**: Medium
**Story Points**: 3
**Sprint**: 10

### Acceptance Criteria
- [ ] Timeline shows chronological list of events:
  - Complaint submitted
  - Status changes
  - Assignments
  - Comments added
  - Resolved/closed
- [ ] Each event shows: timestamp, user, action, details
- [ ] Internal notes hidden from residents
- [ ] Timeline auto-updates when new event added
- [ ] Visual timeline component with icons
- [ ] Export timeline as PDF (admin only)

### Technical Notes
- GET `/api/v1/complaints/:id/timeline`
- Store events in complaint_timeline table
- Filter internal notes for residents

### UI/UX Notes
- Vertical timeline component
- Icons for different event types
- Timestamp formatting (relative)
- Expandable event details
- Auto-scroll to latest

---

## [US-505] Complaint Reports

**As an** Admin
**I want to** generate complaint reports
**So that** I can analyze trends and performance

**Priority**: Low
**Story Points**: 5
**Sprint**: 11

### Acceptance Criteria
- [ ] Reports available:
  - Complaints by category (pie chart)
  - Complaints by status (bar chart)
  - Resolution time average
  - Complaints by month (trend)
  - Top reporters
  - Overdue complaints list
- [ ] Date range selector
- [ ] Export to Excel/PDF
- [ ] Dashboard showing key metrics:
  - Total complaints this month
  - Average resolution time
  - % resolved within SLA
  - Most common category
- [ ] Drill-down to complaint details from charts

### Technical Notes
- GET `/api/v1/complaints/reports?from=&to=`
- Aggregate queries
- Chart data in JSON
- Export generation

### UI/UX Notes
- Interactive charts
- Date range picker
- Export buttons
- Metric cards
- Responsive layout

---

# EPIC 7: Event Management

## [US-601] Create Event

**As an** RT/RW Admin
**I want to** create community events
**So that** residents can be informed and participate

**Priority**: Medium
**Story Points**: 5
**Sprint**: 11

### Acceptance Criteria
- [ ] Admin can create event with:
  - Title, description, category
  - Start date/time, end date/time
  - Location
  - Optional: max participants
- [ ] Category options: Social, Religious, Sports, Meeting, Other
- [ ] Admin can upload event banner image
- [ ] Event appears on community calendar
- [ ] Event detail page created
- [ ] Residents receive notification of new event
- [ ] Admin can edit event details
- [ ] Admin can cancel event with reason
- [ ] Recurring events (future feature placeholder)

### Technical Notes
- POST `/api/v1/events`
- PATCH `/api/v1/events/:id`
- Image upload to GCS
- Send notifications to residents

### UI/UX Notes
- Event creation form
- Date/time pickers
- Category selector with icons
- Image upload with crop
- Preview before publish

---

## [US-602] View Event Calendar

**As a** resident
**I want to** view community event calendar
**So that** I can plan and attend events

**Priority**: Medium
**Story Points**: 5
**Sprint**: 11

### Acceptance Criteria
- [ ] User can view calendar in month view
- [ ] Events shown on their scheduled dates
- [ ] Click date to see events on that day
- [ ] Click event to view full details
- [ ] Filter by category
- [ ] Switch between month, week, day views
- [ ] Highlight today's date
- [ ] Upcoming events widget on dashboard
- [ ] Past events archived but viewable

### Technical Notes
- GET `/api/v1/events?from=&to=`
- Return events in date range
- Use FullCalendar.js or similar

### UI/UX Notes
- Interactive calendar component
- Color-coded by category
- Event preview on hover
- Responsive mobile view
- Navigation between months

---

## [US-603] Event Reminders

**As a** resident
**I want to** receive reminders for upcoming events
**So that** I don't forget to attend

**Priority**: Medium
**Story Points**: 3
**Sprint**: 12

### Acceptance Criteria
- [ ] System sends reminder 24 hours before event
- [ ] Reminder sent via email and push notification
- [ ] Reminder includes: event title, date/time, location
- [ ] User can disable event reminders in settings
- [ ] Admin can configure reminder timing (1 day, 1 week)
- [ ] Second reminder option 1 hour before (opt-in)
- [ ] Mark reminder as sent to avoid duplicates

### Technical Notes
- Scheduled job with Bull
- Check events with start_date - 24 hours
- Send batch notifications
- Track reminder_sent flag

### UI/UX Notes
- Clear, actionable notification
- Calendar integration link
- Snooze/dismiss options
- Settings toggle

---

## [US-604] Event Photo Gallery

**As an** Admin or resident
**I want to** upload and view event photos
**So that** we can share memories and document community activities

**Priority**: Low
**Story Points**: 5
**Sprint**: 12

### Acceptance Criteria
- [ ] Admin can upload photos to event (after event)
- [ ] Residents can view event gallery
- [ ] Gallery shows all photos in grid layout
- [ ] Click photo for full-size view
- [ ] Photo viewer with prev/next navigation
- [ ] Caption for each photo (optional)
- [ ] Download photo option
- [ ] Share gallery link (future)
- [ ] Photo upload: max 10 photos per event, 5MB each

### Technical Notes
- POST `/api/v1/events/:id/gallery`
- GET `/api/v1/events/:id/gallery`
- Image upload to GCS
- Thumbnail generation with Sharp

### UI/UX Notes
- Multi-upload with drag-and-drop
- Grid gallery layout
- Lightbox for full view
- Mobile-optimized
- Loading placeholders

---

# EPIC 8: Security & Emergency

## [US-701] Panic Button

**As a** resident
**I want to** quickly alert authorities during emergencies
**So that** help can arrive quickly

**Priority**: High
**Story Points**: 8
**Sprint**: 12

### Acceptance Criteria
- [ ] Panic button prominently displayed on dashboard
- [ ] Clicking panic button shows confirmation (3-second countdown)
- [ ] System captures GPS location automatically
- [ ] User selects emergency type: Fire, Medical, Security, Other
- [ ] Optional: brief description field
- [ ] Alert sent immediately to all admins and security
- [ ] Alert includes: user name, location, type, timestamp
- [ ] Alert shown on admin dashboard with sound/visual alert
- [ ] Admin can acknowledge alert
- [ ] User can cancel panic within 30 seconds
- [ ] False alarm tracking (limit abuse)

### Technical Notes
- POST `/api/v1/emergency/panic`
- Get GPS via browser Geolocation API
- WebSocket or FCM for real-time alert
- High-priority notification
- Log all panic events

### UI/UX Notes
- Large, red panic button
- Confirmation with countdown
- GPS permission prompt
- Quick type selector
- Success confirmation

---

## [US-702] View Emergency Alerts (Admin)

**As an** Admin or Security
**I want to** receive and respond to emergency alerts
**So that** I can coordinate response quickly

**Priority**: High
**Story Points**: 5
**Sprint**: 13

### Acceptance Criteria
- [ ] Admin dashboard shows active emergency alerts
- [ ] Alert card shows: resident, type, location (map), time
- [ ] Visual and audio notification on new alert
- [ ] Admin can acknowledge alert
- [ ] Admin can add response notes
- [ ] Admin can mark alert as resolved
- [ ] Alert history maintained
- [ ] Map shows user location (if available)
- [ ] Quick call/message resident button

### Technical Notes
- GET `/api/v1/emergency/alerts?status=active`
- PATCH `/api/v1/emergency/alerts/:id/acknowledge`
- PATCH `/api/v1/emergency/alerts/:id/resolve`
- Google Maps integration for location
- WebSocket for real-time updates

### UI/UX Notes
- Prominent alert banner
- Map with marker
- Action buttons (acknowledge, resolve)
- Note-taking field
- Alert sound (can be muted)

---

## [US-703] Security Incident Reporting

**As a** Security personnel or Admin
**I want to** log security incidents
**So that** we have record of all security events

**Priority**: Medium
**Story Points**: 5
**Sprint**: 13

### Acceptance Criteria
- [ ] Security can access incident reporting form
- [ ] Form includes: incident type, date/time, location, description
- [ ] Incident types: Theft, Vandalism, Suspicious Activity, Other
- [ ] Upload photos (up to 5)
- [ ] Involved parties (residents or external)
- [ ] Actions taken field
- [ ] Follow-up required checkbox
- [ ] Severity level: Low, Medium, High
- [ ] On submit, incident logged with ID
- [ ] Admin receives notification
- [ ] Incident appears in security log

### Technical Notes
- POST `/api/v1/security/incidents`
- Similar structure to complaints
- Category-specific fields

### UI/UX Notes
- Simple form optimized for mobile
- Quick photo capture
- Date/time picker with "Now" option
- Location autocomplete
- Save draft option

---

# EPIC 9: Reporting & Analytics

## [US-801] Admin Dashboard Overview

**As an** Admin
**I want to** view key metrics on my dashboard
**So that** I can monitor community status at a glance

**Priority**: High
**Story Points**: 8
**Sprint**: 13

### Acceptance Criteria
- [ ] Dashboard shows key metrics:
  - Total residents, households
  - New registrations this month
  - Pending approvals (letters, registrations)
  - Payment collection rate
  - Outstanding complaints
  - Upcoming events (next 7 days)
- [ ] Quick stats cards with icons
- [ ] Trend indicators (up/down from last month)
- [ ] Quick action buttons:
  - Add resident
  - Create announcement
  - Record payment
- [ ] Recent activity feed
- [ ] Chart: Resident growth over time
- [ ] Chart: Monthly income
- [ ] Role-based dashboard (different for RT vs RW vs Super Admin)

### Technical Notes
- GET `/api/v1/dashboard/stats`
- Aggregate multiple data sources
- Cache results (5-minute TTL)
- Real-time updates via WebSocket (optional)

### UI/UX Notes
- Grid layout with cards
- Responsive design
- Loading skeletons
- Chart.js or Recharts
- Color-coded indicators

---

## [US-802] Custom Report Builder

**As an** Admin
**I want to** create custom reports with filters
**So that** I can analyze specific data

**Priority**: Low
**Story Points**: 13
**Sprint**: 14

### Acceptance Criteria
- [ ] Admin selects report type: Residents, Finance, Letters, Complaints
- [ ] Admin selects fields to include
- [ ] Admin adds filters: date range, status, category, etc.
- [ ] Admin selects grouping/aggregation
- [ ] Preview results in table
- [ ] Export to Excel, PDF, CSV
- [ ] Save report configuration for reuse
- [ ] Scheduled reports (daily/weekly/monthly email)
- [ ] Visualizations: tables, charts
- [ ] Drill-down capability

### Technical Notes
- POST `/api/v1/reports/custom`
- Dynamic query building
- Export generation
- Save report config in database

### UI/UX Notes
- Step-by-step wizard
- Field selector (drag-and-drop)
- Filter builder
- Live preview
- Save template feature

---

## [US-803] Data Export

**As an** Admin
**I want to** export system data
**So that** I can backup or analyze data externally

**Priority**: Medium
**Story Points**: 5
**Sprint**: 14

### Acceptance Criteria
- [ ] Admin can export: Residents, Transactions, Letters, Complaints
- [ ] Format options: Excel, CSV
- [ ] Date range selector
- [ ] Filter options per data type
- [ ] Large exports processed in background
- [ ] Admin notified when export ready
- [ ] Download link valid for 24 hours
- [ ] Export includes all related data
- [ ] Proper formatting and headers

### Technical Notes
- GET `/api/v1/export/:type?format=&from=&to=`
- Background job for large datasets
- Streamed export for performance
- Upload to GCS, return signed URL

### UI/UX Notes
- Export page with options
- Progress bar
- Download notifications
- File list with expiry time

---

# EPIC 10: Admin Operations

## [US-901] User Approval Workflow

**As a** Super Admin or RW Admin
**I want to** approve pending user registrations
**So that** only legitimate residents can access the system

**Priority**: High
**Story Points**: 5
**Sprint**: 14

### Acceptance Criteria
- [ ] Admin sees list of pending registrations
- [ ] Each entry shows: name, email, phone, NIK, RT/RW, registration date
- [ ] Admin can view full details
- [ ] Admin can approve or reject
- [ ] On approve: user account activated, welcome email sent
- [ ] On reject: user notified with reason, account deleted
- [ ] Bulk approve option
- [ ] Filter by RT/RW
- [ ] Search by name/NIK
- [ ] Approval history logged

### Technical Notes
- GET `/api/v1/admin/users/pending`
- PATCH `/api/v1/admin/users/:id/approve`
- PATCH `/api/v1/admin/users/:id/reject`
- Send emails on decision

### UI/UX Notes
- Pending queue table
- User detail modal
- Approve/Reject buttons with confirmation
- Bulk select checkboxes
- Rejection reason modal

---

## [US-902] Audit Log Viewer

**As a** Super Admin
**I want to** view system audit logs
**So that** I can track all administrative actions

**Priority**: Medium
**Story Points**: 5
**Sprint**: 15

### Acceptance Criteria
- [ ] Admin can access audit log viewer
- [ ] Logs show: timestamp, user, action, resource, changes
- [ ] Filter by: date range, user, action type, resource type
- [ ] Search by user or resource ID
- [ ] Pagination: 50 logs per page
- [ ] Export to CSV
- [ ] Color-coded by action (create, update, delete)
- [ ] Click log to view full details (old vs new values)
- [ ] Logs are immutable (cannot be edited/deleted)

### Technical Notes
- GET `/api/v1/admin/audit-logs?from=&to=&user=&action=`
- Comprehensive logging middleware
- Logs stored in separate table
- Retention: 2 years minimum

### UI/UX Notes
- Table with advanced filters
- Color-coded action types
- Detail modal showing diff
- Export button
- Date range quick selectors

---

## [US-903] System Settings Management

**As a** Super Admin
**I want to** configure system settings
**So that** the system matches community needs

**Priority**: Medium
**Story Points**: 8
**Sprint**: 15

### Acceptance Criteria
- [ ] Admin can configure:
  - Community name, logo
  - RT/RW structure (numbers)
  - Default fee amounts
  - Email templates
  - Notification settings
  - Letter templates
  - Working hours (for SLA)
- [ ] Settings organized in tabs/sections
- [ ] Changes require confirmation
- [ ] Settings validated before save
- [ ] Change history maintained
- [ ] Can revert to previous settings
- [ ] Some settings affect all users (community level)

### Technical Notes
- GET `/api/v1/admin/settings`
- PATCH `/api/v1/admin/settings`
- Store in settings table with versioning
- Cache settings in Redis

### UI/UX Notes
- Tabbed settings interface
- Form with sections
- Preview for templates
- Save/Cancel buttons
- Confirmation dialogs
- Success notifications

---

## [US-904] Backup & Restore (Future)

**As a** Super Admin
**I want to** backup and restore system data
**So that** data is protected from loss

**Priority**: Low
**Story Points**: 13
**Sprint**: Future

### Acceptance Criteria
- [ ] Admin can trigger manual backup
- [ ] Automatic daily backups
- [ ] Backup includes: database, uploaded files
- [ ] Backup stored in cloud storage
- [ ] Retention: 30 days
- [ ] Admin can download backup
- [ ] Admin can restore from backup
- [ ] Restore requires confirmation and validation
- [ ] Test restore functionality
- [ ] Backup status dashboard

### Technical Notes
- Cloud SQL automated backups
- GCS backup for files
- Point-in-time recovery
- Restoration script

### UI/UX Notes
- Backup/restore page
- Trigger backup button
- Backup list with dates
- Download/restore actions
- Confirmation warnings

---

## Story Estimation Guide

**Story Points based on complexity:**
- 1: Trivial, < 1 hour
- 2: Simple, ~ 2-4 hours
- 3: Small, ~ 1 day
- 5: Medium, ~ 2-3 days
- 8: Large, ~ 1 week
- 13: Very large, ~ 2 weeks
- 21+: Epic, should be split

---

## Priority Definitions

- **High**: Must have for MVP, core functionality
- **Medium**: Important, but can be delayed if needed
- **Low**: Nice to have, future enhancement

---

## Sprint Planning Summary

### Sprint 1-2 (Weeks 1-4): Foundation
- Authentication & User Management
- Basic resident data management

### Sprint 3-4 (Weeks 5-8): Core Features
- Letter management system
- Resident list and import

### Sprint 5-7 (Weeks 9-14): Financial & Communication
- Financial management
- Announcements and notifications
- Complaint management

### Sprint 8-10 (Weeks 15-20): Enhancement
- Event management
- Security features
- Reports and analytics

### Sprint 11+ (Weeks 21+): Polish & Advanced
- Advanced reporting
- Admin tools
- System optimization

---

## Definition of Done

A user story is considered "Done" when:
- [ ] Code implemented and committed
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests passed
- [ ] Code reviewed and approved
- [ ] API documentation updated
- [ ] UI/UX matches design specs
- [ ] Acceptance criteria met
- [ ] Manual QA testing passed
- [ ] Deployed to staging
- [ ] Product owner approval
- [ ] Documentation updated

---

**Document Version**: 1.0
**Last Updated**: 2025-10-08
**Status**: ✅ Ready for Development

---

<div align="center">

**Complete User Stories for SIRW MVP**

Total Stories: 90+
Total Story Points: ~450
Estimated Duration: 15-20 weeks

</div>