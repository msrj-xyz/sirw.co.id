# SIRW - Neighborhood Information System

**A comprehensive digital platform for Indonesian RT/RW (neighborhood) administration and community engagement**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Project Scope](#project-scope)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [Development Timeline](#development-timeline)
- [Contributing](#contributing)
- [License](#license)

---

## 🏘️ Overview

SIRW (Sistem Informasi RT/RW) is a modern web-based platform designed to digitize and streamline neighborhood administration in Indonesia. The system integrates administrative functions with social interaction features to improve efficiency for RT/RW administrators and enhance convenience for residents.

### Key Objectives
- **Administrative Digitization**: Reduce manual processes by up to 80%
- **Enhanced Communication**: Provide centralized platform for resident communication
- **Transparency**: Improve transparency in fee management and neighborhood information
- **Operational Efficiency**: Optimize administrator time in serving residents

---

## 🎯 Project Scope

### Pilot Approach
This project follows a **pilot-first strategy**, starting with validation in **1 RW (neighborhood community)** before broader scaling:

- **Target**: 1 RW (estimated 200-500 households)
- **Duration**: 8-12 weeks for pilot development
- **Focus**: Proof-of-concept and user validation
- **Budget**: $20K - 30K for pilot phase

### Success Metrics
- **User Adoption**: 60% of households within 2 months
- **Administrative Efficiency**: 40% time reduction in document processing
- **User Satisfaction**: 4.0/5.0 rating
- **System Usage**: 80% monthly active users

---

## ⚡ Features

### 🏛️ Core Administrative Features
- **Comprehensive Resident Database**: 32-field resident information system with demographics, status tracking, and family relationships
- **Advanced Search & Filtering**: Multi-criteria search with combinations of status, demographics, and geographic filters
- **Bulk Data Management**: CSV import/export with validation, batch operations, and data quality assurance
- **Document Request System**: Digital reference letter processing with approval workflows
- **Payment & Status Tracking**: Fee status, BPJS status, residency status management
- **Comprehensive Reporting**: Demographics, status distribution, geographic analysis with charts and visualizations
- **Admin Dashboard**: Real-time analytics, data quality metrics, and administrative control panel

### 👥 Community Engagement Features
- **Community Forum**: Categorized discussion platform
- **Announcements**: Official announcements and important notices
- **Timeline Feed**: Community activity and social interaction
- **Notification System**: Real-time updates and alerts

### 📱 User Experience Features
- **Responsive Design**: Mobile-first approach for smartphone users
- **Role-based Access**: Different interfaces for admins and residents
- **Multi-language Support**: Indonesian language optimization
- **Offline Capability**: Progressive Web App functionality

---

## 🛠️ Technology Stack

### Frontend
```
- React 18 + Hooks
- Shadcn/UI + Tailwind CSS
- MidOne Template (React Version)
- Redux Toolkit (State Management)
- React Router DOM
- React Hook Form
- Axios (HTTP Client)
```

### Backend
```
- Node.js 22 LTS
- Express.js 4.18+
- PostgreSQL 17+
- Prisma ORM
- JWT Authentication
- Redis (Caching & Sessions)
- Multer (File Upload)
- Nodemailer (Email Service)
```

### DevOps & Infrastructure
```
- Docker (Containerization)
- GitHub Actions (CI/CD)
- Nginx (Web Server)
- PM2 (Process Manager)
- SSL/TLS Encryption
```

---

## 🏗️ Architecture

### System Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React App)   │◄──►│   (Express.js)  │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        ▼                        │
         │              ┌─────────────────┐                │
         │              │     Redis       │                │
         │              │   (Caching)     │                │
         │              └─────────────────┘                │
         │                                                 │
         ▼                                                 ▼
┌─────────────────┐                            ┌─────────────────┐
│  File Storage   │                            │   Email Service │
│   (Local/Cloud) │                            │   (Nodemailer)  │
└─────────────────┘                            └─────────────────┘
```

## 🚀 Getting Started

### Prerequisites
- Node.js 22 LTS or higher
- PostgreSQL 17+
- Redis (optional for pilot)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/msrj-xyz/sirw.co.id.git
   cd sirw.co.id
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd client
   npm install
   cd ..
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Configure your environment variables
   # - Database connection
   # - JWT secrets
   # - Email service configuration
   ```

4. **Database Setup**
   ```bash
   # Run database migrations
   npx prisma migrate dev
   
   # Seed initial data (optional)
   npx prisma db seed
   ```

5. **Start Development Server**
   ```bash
   # Start backend server
   npm run dev
   
   # In another terminal, start frontend
   cd client
   npm start
   ```

6. **Access the Application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`
   - API Documentation: `http://localhost:5000/docs`

---

## 📚 Documentation

### Analysis Documents
- **[High-Level Business Analysis (EN)](./documents/sirw-high-level-analysis-en.md)** - Business case and strategic analysis
- **[Technical Architecture Analysis (EN)](./documents/sirw-technical-analysis-en.md)** - Technical implementation details

### Key Findings from Data Analysis
- **Data Complexity**: Actual RW data contains **32 comprehensive fields** vs initial 8-field assumption
- **Enterprise Features Required**: Advanced search, reporting, analytics, data quality management
- **Professional System**: Solution evolved from basic digitization to enterprise-grade platform
- **Enhanced Investment**: 44% budget increase justified by comprehensive feature requirements

### API Documentation
- RESTful API endpoints
- Authentication & authorization
- Request/response examples
- Error handling guidelines

### Development Guidelines
- Code style and conventions
- Testing requirements
- Deployment procedures
- Security best practices

---

## 🤝 Contributing

We welcome contributions to the SIRW project! Please read our contributing guidelines before submitting pull requests.

### Development Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow ESLint configuration
- Write meaningful commit messages
- Include tests for new features
- Update documentation as needed

### Issue Reporting
- Use issue templates
- Provide detailed reproduction steps
- Include environment information
- Label issues appropriately

---

## 🛡️ Security

SIRW implements comprehensive security measures:
- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control
- **Data Protection**: Encryption for sensitive data
- **Input Validation**: Server-side validation
- **XSS Protection**: DOMPurify and CSP headers
- **Regular Audits**: Security assessments and updates

---

## 📞 Support

### Getting Help
- **Documentation**: Check the docs folder for detailed guides
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Community discussions in GitHub Discussions
- **Email**: Contact the development team at [msrj.xyz@gmail.com]

### Community
- **GitHub**: [@msrj-xyz/sirw.co.id](https://github.com/msrj-xyz/sirw.co.id)
- **Website**: [https://sirw.co.id](https://sirw.co.id)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **RT/RW Communities** for providing valuable insights and requirements
- **Open Source Community** for the amazing tools and libraries
- **Beta Testers** for their feedback and patience
- **Contributors** who help make this project better

---

<div align="center">

**Made with ❤️ for Indonesian Communities**

[Website](https://sirw.co.id) • [Documentation](./documents/) • [Issues](https://github.com/msrj-xyz/sirw.co.id/issues) • [Discussions](https://github.com/msrj-xyz/sirw.co.id/discussions)

</div>