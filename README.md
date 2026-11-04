# 🎓 Smart Attendance Management & Institutional Analytics Platform


### Alpine Degree College Khanpur, Pakistan | Affiliated with The Islamia University of Bahawalpur (IUB)

A modern, full-stack **Smart Attendance Management and Academic Governance System** designed to digitize institutional attendance operations, improve academic transparency, strengthen parent-teacher communication, and simplify administrative management.

The platform combines AI-powered facial recognition, role-based authentication, real-time attendance monitoring, parent and guardian dashboards, academic analytics, and an AI-powered academic assistant into one integrated system.

---

## 🌟 Project Overview

Traditional attendance systems often rely on manual registers, disconnected records, and limited communication between institutions and parents.

This project aims to address these challenges through a centralized digital platform that enables administrators, faculty members, students, and parents to interact with academic attendance records through dedicated portals.

**Developed for:** Alpine Degree College Khanpur, Pakistan  
**Institutional Affiliation:** The Islamia University of Bahawalpur (IUB)  
**Project Category:** Full-Stack Web Application / EdTech / AI Integration

## ✨ Key Features

### 1. 👁️ AI-Powered Facial Recognition Attendance
- Live camera-based student face enrollment.
- Three-sample facial enrollment with explicit consent.
- Browser-based facial recognition using face-api.js.
- 128-dimensional facial descriptor extraction.
- AES-256-GCM encryption for stored facial templates.
- Authenticated student identity verification.
- Configurable face matching threshold.
- Duplicate daily attendance prevention.
- Local facial recognition models served from the project.
- Manual attendance fallback for reliability.

**Privacy & Security:** Raw camera images are not retained by the described enrollment and verification flow. Only encrypted facial descriptors are stored.

**Important Limitation:** The current face-matching implementation does not provide liveness detection or anti-spoofing protection. Supervision and manual verification remain necessary.

### 2. 👪 Parent & Guardian Portal

A dedicated parent portal that provides transparent access to authorized children's academic attendance information.

**Features:**
- Dedicated parent authentication.
- Secure parent-student relationship mapping.
- Multi-child monitoring through one account.
- Support for multiple guardians.
- Today's attendance status.
- Attendance history and statistics.
- Subject-wise attendance breakdown.
- Attendance percentage calculations.
- Low attendance warnings.
- Online parent leave applications.
- Absence notifications.
- Monthly attendance reporting.
- Printable official attendance transcripts.

**Multi-Child Monitoring:** Parents can switch between multiple linked children without requiring separate accounts.

### 3. 📊 Academic Attendance Analytics

The system provides attendance insights to help institutions monitor academic participation.

**Attendance Calculation:**

Attendance Percentage = ((Present Sessions + Late Sessions) / Total Eligible Sessions) × 100

Key capabilities:
- Total classes conducted.
- Present, absent, and late session counts.
- Subject-wise attendance percentages.
- Attendance threshold monitoring.
- Low attendance identification.
- Zero-session handling.

The application uses a configurable institutional threshold of 75% in its current demonstration setup. Official examination eligibility policies should be verified against applicable IUB regulations.

### 4. 📋 Faculty & Classroom Management

Teachers can efficiently manage classroom attendance through dedicated faculty dashboards.

**Features:**
- Assigned course attendance registers.
- One-click Mark All Present.
- One-click Mark All Absent.
- Student search and filtering.
- Date-based attendance navigation.
- Attendance editing through authorized workflows.
- CSV attendance export.
- A4 printable attendance sheets.
- Official institutional letterhead formatting.
- Medical leave review and approval workflows.

### 5. 🏛️ Administration & Principal Dashboard

A centralized administration interface for institutional management.

**Features:**
- Student directory management.
- Faculty and user management.
- Parent and guardian linking.
- Timetable management.
- Institutional attendance monitoring.
- Administrative settings.
- Institutional audit and reporting capabilities.

### 6. 🤖 Gemini AI Academic Assistant

An AI-powered assistant designed to help users understand institutional attendance information and academic policies.

**Capabilities:**
- Attendance policy questions.
- Attendance percentage explanations.
- Attendance recovery calculations.
- Academic guidance.
- Institutional rule-related assistance.

Powered by Google Gemini API, with a fallback response engine when API access is unavailable.

### 7. 🔐 Security & Access Control

Security is implemented through server-side authentication and role-based authorization.

**Supported Roles:**
- Administrator / Principal
- Faculty / Teachers
- Students
- Parents / Guardians

Additional security features:
- Authenticated server sessions.
- Role-based route protection.
- Parent-child ownership validation.
- Unauthorized access prevention.
- HTTP 403 responses for forbidden parent access.
- Facial descriptor encryption.
- 15-minute inactivity monitoring.
- 60-second inactivity warning countdown.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| JavaScript / TypeScript | Application logic |
| Node.js | Backend runtime |
| Express.js | Backend API and server |
| face-api.js | Facial recognition |
| HTML / CSS | User interface |
| React (if enabled in project frontend) | Frontend development |
| MySQL | Prepared database schema |
| Google Gemini API | AI Academic Assistant |
| AES-256-GCM | Biometric data encryption |
| npm | Dependency management |
| VS Code | Development environment |

*Note: The exact frontend framework and dependencies should match the final project source code.*

---

## 🏗️ System Architecture

The application follows a client-server architecture.

**Frontend**
- Role-based dashboards.
- Camera access and face detection.
- Attendance registers.
- Parent and student portals.
- Academic analytics.

**Backend**
- Express.js API.
- Authentication and authorization.
- Attendance verification.
- Parent-child access validation.
- Attendance record processing.
- Facial descriptor matching.

**Data Storage**
- Current Express server: In-memory demonstration database.
- MySQL: Prepared database schema available in `database/database.sql`.
- Biometric templates: Encrypted facial descriptors.

**Important Database Note:** The checked-in MySQL schema is not currently connected to the Express server. Persistent production database integration remains a deployment requirement.

---

## 👥 Demo Accounts

The following accounts are provided for local demonstration and role-based testing.

| Role | Username | Password |
|---|---|---|
| Administrator | admin | password123 |
| Faculty 1 | teacher1 | password123 |
| Faculty 2 | teacher2 | password123 |
| Student 1 | student1 | password123 |
| Student 2 | student2 | password123 |
| Student 3 | student3 | password123 |
| Parent 1 | parent1 | password123 |
| Parent 2 | parent2 | password123 |

**Demo Scenarios:**
- Administrator: Institutional management.
- Faculty: Classroom attendance and leave processing.
- Student: Personal attendance dashboard and camera check-in.
- Parent 1: Single-child attendance monitoring.
- Parent 2: Multi-child monitoring.
- Student 3: Low attendance demonstration scenario.

These are demonstration credentials only. Never use them in a publicly deployed production system.

---

## 🚀 Installation & Local Setup

### Prerequisites

- Node.js v18 or higher.
- npm or bun.
- Visual Studio Code.
- Modern web browser.
- Webcam for facial recognition testing.

### Step 1: Clone Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### Step 2: Navigate to Project

```bash
cd YOUR_PROJECT_FOLDER
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Configure the required environment variables.

```env
GEMINI_API_KEY=your_gemini_api_key
FACE_MATCH_THRESHOLD=your_configured_threshold
```

Use the actual environment variable names and values supported by your application. Never commit real API keys or secrets.

### Step 5: Start Development Server

```bash
npm run dev
```

### Step 6: Verify Project

Run linting:

```bash
npm run lint
```

Build the application:

```bash
npm run build
```

Open the local application using the development server URL shown in your terminal.

---

## 🗄️ Database Setup

A MySQL database schema is provided in:

```text
database/database.sql
```

To import the schema using XAMPP and phpMyAdmin:

1. Start MySQL and Apache in XAMPP.
2. Open `http://localhost/phpmyadmin`.
3. Create a database named `alpine_attendance_db`.
4. Select the database.
5. Open the Import tab.
6. Upload `database/database.sql`.
7. Execute the import.

**Note:** This schema is currently provided as a database preparation resource. The Express backend still uses an in-memory demo database and requires MySQL integration before persistent production use.

---

## 🧪 Testing & Verification

A basic API availability check:

```bash
npx tsx -e '
async function runTests() {
  const baseURL = "http://localhost:3000";

  console.log("Testing API availability...");

  const res = await fetch(
    baseURL + "/api/face-recognition/students"
  );

  console.log("API Status:", res.status);
}

runTests();
'
```

Additional recommended testing areas:

- Authentication and role permissions.
- Parent-child ownership validation.
- Unauthorized access attempts.
- Duplicate attendance prevention.
- Facial enrollment validation.
- Face matching threshold behavior.
- Attendance percentage calculations.
- CSV exports and printable reports.
- Leave application workflows.

---

## 🔒 Privacy, Security & Limitations

This project handles sensitive student and biometric information. Responsible deployment requires:

- Explicit consent before biometric enrollment.
- Appropriate parental or guardian consent where required.
- Secure encryption key management.
- HTTPS in production.
- Secure session and cookie configuration.
- Strong password hashing and password policies.
- Regular backups and access auditing.
- A manual attendance alternative.
- A defined biometric retention and deletion policy.

**Facial Recognition Limitation:** Face descriptor matching is not equivalent to liveness detection. Photos and screen replays may be accepted. The system must not rely exclusively on facial recognition for attendance verification.

**Production Readiness:** MySQL integration, persistent storage, production security hardening, and independent biometric testing are required before institutional deployment.

---

## 🎯 Project Objectives

1. Digitize traditional classroom attendance operations.
2. Improve transparency between parents and educational institutions.
3. Introduce AI-assisted attendance verification.
4. Provide centralized academic attendance analytics.
5. Reduce manual administrative workload.
6. Improve communication between students, parents, and faculty.
7. Establish a scalable foundation for future institutional automation.

---

## 🔮 Future Enhancements

- Production MySQL integration.
- Advanced liveness detection and anti-spoofing.
- Mobile application for parents and students.
- SMS, WhatsApp, and email notifications.
- Advanced institutional analytics dashboards.
- Automated monthly PDF reports.
- Cloud deployment and backup infrastructure.
- Multi-campus institutional support.
- Enhanced audit trails and security monitoring.

---

## 🏫 Institutional Information

**Institution:** Alpine Degree College Khanpur  
**Affiliation:** The Islamia University of Bahawalpur (IUB)  
**Country:** Pakistan  
**System Name:** Smart Attendance Management & Institutional Analytics Platform

---

## 👨‍💻 Project Purpose

This project demonstrates the practical application of full-stack web development, AI integration, biometric verification, role-based access control, database design, and academic information management in the education sector.

It is designed to provide a modern digital foundation for educational institutions seeking more efficient, transparent, and technology-driven academic administration.

---

⭐ If you find this project interesting, consider giving the repository a star!
