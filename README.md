# SIRW - Sistem Informasi RT/RW

<div align="center">

![SIRW Logo](documents/logo.png)

**Digitizing Community Administration for Better Living**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](package.json)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18.x-blue.svg)](https://reactjs.org/)

[Features](#features) • [Demo](#demo) • [Documentation](#documentation) • [Installation](#installation) • [Contributing](#contributing)

</div>

---

## 📖 Table of Contents

- [About](#about)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the Application](#running-the-application)
- [Documentation](#documentation)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)
- [Acknowledgments](#acknowledgments)

---

## 🎯 About

**SIRW (Sistem Informasi RT/RW)** is a comprehensive web-based platform designed to digitize and streamline residential community (RT/RW) administration in Indonesia. The platform integrates administrative processes with social interaction features to improve efficiency for RT/RW administrators and enhance the quality of life for residents.

### Problem Statement

Most RT/RW administration in Indonesia still relies on manual, paper-based processes, leading to:
- ⏰ Time-consuming administrative tasks
- 📉 Poor communication between administrators and residents
- 💰 Lack of financial transparency
- 📋 Fragmented data management
- 🐌 Slow response to resident complaints

### Solution

SIRW provides a modern, digital solution that:
- ✅ Reduces administrative work by 80%
- 📱 Enables real-time communication
- 💎 Provides complete financial transparency
- 🗂️ Centralizes all resident data
- ⚡ Accelerates complaint resolution

---

## ✨ Features

### 👥 User Management
- **Multi-role System**: Super Admin, Admin RW, Admin RT, Bendahara, Warga, Satpam
- **Self Registration**: Residents can self-register with admin approval
- **Multiple Auth Methods**: Email/Password, Phone/OTP, Social Login (Google, Facebook)
- **Two-Factor Authentication**: Enhanced security with 2FA
- **Profile Management**: Comprehensive user profiles with document uploads

### 📄 Letter Management
- **Digital Letter Generation**: Automated generation of official letters
- **6 Letter Types**: Pengantar, Domisili, SKTM, Usaha, Izin Keramaian, Pindah
- **Flexible Approval Workflow**: Configurable based on letter type
- **Digital Signature**: Electronic signature and official stamp
- **QR Code Verification**: Verify letter authenticity via QR code
- **PDF Export**: Professional, print-ready PDF documents

### 💰 Financial Management
- **Payment Recording**: Track all resident payments (cash & transfer)
- **Payment Proof Upload**: Upload and verify payment receipts
- **Fee Management**: Configure monthly, one-time, and social fees
- **Financial Dashboard**: Real-time income, expenses, and balance
- **Arrears Tracking**: Monitor overdue payments
- **Automated Reminders**: Email/push notifications for payment reminders
- **Financial Reports**: Monthly, annual, and custom reports

### 📢 Communication
- **Announcements**: Broadcast messages to all residents
- **Categories**: Urgent, Information, Event
- **Multi-channel Delivery**: In-app, email, push notifications
- **Rich Media Support**: Text, images, and attachments
- **Read Receipts**: Track announcement engagement

### 🔧 Complaint Management
- **Issue Reporting**: Residents can report facility issues or complaints
- **Photo Upload**: Attach evidence photos
- **Priority Levels**: Normal, High, Urgent
- **Assignment System**: Route complaints to responsible personnel
- **Status Tracking**: Real-time status updates
- **Resolution Timeline**: Complete history of actions taken

### 📅 Event Management
- **Community Calendar**: Centralized event calendar
- **Event Creation**: Admin creates and manages events
- **Automated Reminders**: Email/push reminders before events
- **Photo Gallery**: Post-event photo galleries

### 🚨 Security Features
- **Panic Button**: One-click emergency alert system
- **GPS Location**: Automatic location capture during emergencies
- **Instant Notification**: Alerts sent to admins and security
- **Incident Reporting**: Log and track security incidents

### 📊 Reporting & Analytics
- **Resident Statistics**: Demographics, occupancy, move-in/out trends
- **Financial Reports**: Income, expenses, arrears analysis
- **Activity Reports**: Letter generation, complaint resolution metrics
- **Custom Report Builder**: Create ad-hoc reports
- **Export Capabilities**: Excel, PDF, CSV formats

---

## 🛠️ Technology Stack

### Frontend
- **React 18.x** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Shadcn/UI** - Component library
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Axios** - HTTP client
- **React Query** - Server state management
- **Zustand** - Client state management
- **Workbox** - PWA service worker

### Backend
- **Node.js 20.x** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Prisma** - ORM
- **JWT** - Authentication
- **Joi** - Validation
- **Multer** - File uploads
- **Nodemailer** - Email service
- **Puppeteer** - PDF generation
- **Bull** - Job queue

### Database & Storage
- **PostgreSQL 15.x** - Primary database
- **Redis 7.x** - Caching & queues
- **Google Cloud Storage** - File storage

### Infrastructure
- **Google Cloud Platform** - Cloud provider
- **Kubernetes (GKE)** - Container orchestration
- **Docker** - Containerization
- **Terraform** - Infrastructure as Code
- **GitHub Actions** - CI/CD

### DevOps & Monitoring
- **GCP Cloud Monitoring** - Metrics
- **GCP Cloud Logging** - Logs
- **GCP Cloud Trace** - APM
- **Sentry** - Error tracking (optional)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Desktop    │  │    Tablet    │  │    Mobile    │ │
│  │   Browser    │  │   Browser    │  │     PWA      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                        │
                        ↓ HTTPS
┌─────────────────────────────────────────────────────────┐
│              Google Cloud Load Balancer                  │
│                     + Cloud CDN                          │
└─────────────────────────────────────────────────────────┘
           │                                │
           ↓                                ↓
┌────────────────────┐          ┌────────────────────┐
│   Cloud Run        │          │   GKE Cluster      │
│   (Frontend)       │          │   (Backend API)    │
│                    │          │                    │
│  React + PWA       │          │  Node.js + Express │
└────────────────────┘          └────────────────────┘
           │                                │
           │                                ↓
           │                    ┌────────────────────┐
           │                    │   Cloud SQL        │
           │                    │   (PostgreSQL)     │
           │                    └────────────────────┘
           │                                │
           │                                ↓
           │                    ┌────────────────────┐
           │                    │  Cloud Memorystore │
           │                    │     (Redis)        │
           │                    └────────────────────┘
           │                                │
           └────────────────────┬───────────┘
                                ↓
                    ┌────────────────────┐
                    │  Cloud Storage     │
                    │    (Files/PDFs)    │
                    └────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.0.0 ([Download](https://nodejs.org/))
- **npm** >= 10.0.0 or **yarn** >= 1.22.0
- **PostgreSQL** >= 15.x ([Download](https://www.postgresql.org/download/))
- **Redis** >= 7.x ([Download](https://redis.io/download))
- **Git** ([Download](https://git-scm.com/downloads))
- **Docker** (optional, for containerized development) ([Download](https://www.docker.com/get-started))

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/your-org/sirw.git
cd sirw
```

#### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

#### 3. Set Up Environment Variables

Create `.env` files in both frontend and backend directories:

**Backend `.env`:**
```env
# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sirw_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-this"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Email (Choose one provider)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="noreply@sirw.id"

# Google Cloud Storage
GCS_BUCKET_NAME="sirw-dev-bucket"
GCS_PROJECT_ID="your-gcp-project-id"
GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"

# OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_APP_ID="your-facebook-app-id"
FACEBOOK_APP_SECRET="your-facebook-app-secret"

# Google Maps API
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:5173"
```

**Frontend `.env`:**
```env
# API
VITE_API_BASE_URL=http://localhost:3000/api/v1

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Facebook OAuth
VITE_FACEBOOK_APP_ID=your-facebook-app-id

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Firebase (for push notifications)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

#### 4. Database Setup

```bash
# Navigate to backend directory
cd backend

# Run database migrations
npx prisma migrate dev

# Seed initial data (optional)
npm run seed
```

#### 5. Start Development Servers

**Option A: Using separate terminals**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Option B: Using concurrently (from root)**

```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs

---

## ⚙️ Configuration

### Database Configuration

Edit `backend/prisma/schema.prisma` if you need to modify the database schema.

After changes, run:
```bash
npx prisma migrate dev --name your_migration_name
```

### Email Configuration

For development, you can use:
- **Gmail**: Use App Password (not regular password)
- **Mailtrap**: For testing emails without sending real ones
- **SendGrid**: For production

### File Storage Configuration

For development:
- Use local file system (files stored in `backend/uploads`)
- For production: Use Google Cloud Storage

### Redis Configuration

Default connection: `redis://localhost:6379`

For production, use Cloud Memorystore or Redis Cloud.

---

## 🧪 Testing

### Run All Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Run Specific Test Suites

```bash
# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

### Writing Tests

**Backend Example (Jest):**
```typescript
// backend/src/services/__tests__/auth.service.test.ts
import { AuthService } from '../auth.service';

describe('AuthService', () => {
  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const result = await authService.login('user@example.com', 'password123');
      expect(result).toHaveProperty('access_token');
    });
  });
});
```

**Frontend Example (Vitest + React Testing Library):**
```typescript
// frontend/src/components/__tests__/LoginForm.test.tsx
import { render, screen } from '@testing-library/react';
import { LoginForm } from '../LoginForm';

describe('LoginForm', () => {
  it('should render login form', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });
});
```

---

## 📦 Deployment

### Docker Deployment

#### Build Docker Images

```bash
# Build backend image
docker build -t sirw-backend:latest ./backend

# Build frontend image
docker build -t sirw-frontend:latest ./frontend
```

#### Run with Docker Compose

```bash
docker-compose up -d
```

### Kubernetes Deployment (GKE)

#### 1. Set up GCP Project

```bash
# Authenticate with GCP
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable container.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sqladmin.googleapis.com
```

#### 2. Create GKE Cluster

```bash
gcloud container clusters create sirw-cluster \
  --zone=asia-southeast2-a \
  --num-nodes=3 \
  --machine-type=n1-standard-2
```

#### 3. Deploy to GKE

```bash
# Build and push images to Container Registry
npm run build:docker
npm run push:gcr

# Apply Kubernetes manifests
kubectl apply -f k8s/
```

### Cloud Run Deployment (Serverless)

```bash
# Deploy backend
gcloud run deploy sirw-backend \
  --source ./backend \
  --region asia-southeast2 \
  --allow-unauthenticated

# Deploy frontend
gcloud run deploy sirw-frontend \
  --source ./frontend \
  --region asia-southeast2 \
  --allow-unauthenticated
```

### CI/CD with GitHub Actions

The repository includes GitHub Actions workflows for automated deployment:

- `.github/workflows/ci.yml` - Run tests on PR
- `.github/workflows/deploy-staging.yml` - Deploy to staging
- `.github/workflows/deploy-production.yml` - Deploy to production

---

## 📁 Project Structure

```
sirw/
├── frontend/                  # React frontend application
│   ├── public/               # Static files
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ui/          # Shadcn/UI base components
│   │   │   ├── layout/      # Layout components
│   │   │   ├── features/    # Feature components
│   │   │   └── common/      # Shared components
│   │   ├── pages/           # Route pages
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   ├── store/           # State management
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript types
│   │   ├── constants/       # Constants
│   │   └── assets/          # Images, fonts, etc.
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                   # Node.js backend application
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Data models (Prisma)
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript types
│   │   ├── validators/      # Request validators
│   │   └── workers/         # Background jobs
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── migrations/      # DB migrations
│   │   └── seed.ts          # Seed data
│   ├── tests/               # Test files
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                      # Documentation
│   ├── PRD-HighLevel.md
│   ├── PRD-Technical.md
│   ├── API-Reference.md
│   ├── User-Stories.md
│   └── Deployment-Guide.md
│
├── k8s/                       # Kubernetes manifests
│   ├── backend/
│   ├── frontend/
│   └── database/
│
├── .github/                   # GitHub Actions workflows
│   └── workflows/
│
├── docker-compose.yml         # Docker Compose config
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### 1. Fork the Repository

Click the "Fork" button at the top right of this page.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR-USERNAME/sirw.git
cd sirw
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 4. Make Your Changes

- Write clean, documented code
- Follow the existing code style
- Add tests for new features
- Update documentation as needed

### 5. Commit Your Changes

```bash
git add .
git commit -m "feat: add your feature description"
```

We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

### Code Style

- **TypeScript**: Use TypeScript for type safety
- **ESLint**: Run `npm run lint` before committing
- **Prettier**: Code is auto-formatted on commit
- **Comments**: Add JSDoc comments for functions
- **Testing**: Maintain >80% code coverage

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💬 Support

### Documentation

- [User Manual (Admin)](docs/User-Manual-Admin.md)
- [User Manual (Resident)](docs/User-Manual-Resident.md)
- [API Reference](docs/API-Reference.md)
- [FAQ](docs/FAQ.md)

### Community

- **GitHub Discussions**: [Ask questions and share ideas](https://github.com/your-org/sirw/discussions)
- **Issue Tracker**: [Report bugs](https://github.com/your-org/sirw/issues)

### Contact

- **Email**: support@sirw.id
- **Website**: https://sirw.id

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI Library
- [Shadcn/UI](https://ui.shadcn.com/) - Component Library
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework
- [Node.js](https://nodejs.org/) - Runtime
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Google Cloud Platform](https://cloud.google.com/) - Infrastructure

---

## 🗺️ Roadmap

### Phase 1 - MVP ✅ (Current)
- [x] User authentication & authorization
- [x] Resident data management
- [x] Letter generation system
- [x] Financial management
- [x] Announcements & notifications
- [x] Complaint management
- [x] Event calendar
- [x] Reporting & analytics

### Phase 2 - Enhanced Features (Q2 2025)
- [ ] Forum & discussion board
- [ ] Community voting/polling
- [ ] Newsletter system
- [ ] Enhanced analytics with charts

### Phase 3 - Commerce Features (Q3 2025)
- [ ] Marketplace for residents
- [ ] Online payment gateway
- [ ] Facility booking system
- [ ] WhatsApp Business API integration

### Phase 4 - Mobile & Advanced (Q4 2025)
- [ ] Native mobile apps (Android/iOS)
- [ ] AI-powered insights
- [ ] Advanced analytics dashboard
- [ ] Smart home integration

### Phase 5 - SaaS Platform (2026)
- [ ] Multi-tenant architecture
- [ ] White-label customization
- [ ] Subscription billing
- [ ] Tenant management dashboard

---

<div align="center">

**Made with ❤️ by SIRW Team**

[⬆ Back to Top](#sirw---sistem-informasi-rtrw)

</div>