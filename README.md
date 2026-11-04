# 🎓 Smart Attendance Management & Institutional Analytics Platform
**Alpine Degree College Khanpur, Pakistan (Affiliated with IUB)**

A full-stack Attendance Management & Academic Governance System for higher education institutions. Features role-based access control (Admin/Principal, Faculty, Students, and Parents), a Parent & Guardian Portal with multi-child monitoring, classroom attendance registers with print and CSV export, medical leave processing, institutional audit reports, and a Gemini AI-powered Academic Assistant.

---

## 🌟 Key System Modules

### 1. 👁️ Live Camera Attendance Check-In
- Administrators or assigned teachers enroll a student's face with three live camera samples and explicit consent. The face descriptor is generated in the browser with `face-api.js`, stored as a 128-dimensional vector, and linked to the authenticated student record. Students then mark general college attendance from their own portal using the live camera only.
- The browser loads the local detection and landmark models from the project (`/models`) and extracts a descriptor from the live feed before sending only that descriptor to the backend for verification. The server derives identity from the authenticated account, checks that the account is active, applies the configurable `FACE_MATCH_THRESHOLD`, and prevents duplicate daily records.
- Only the face descriptor is stored, encrypted at rest with AES-256-GCM; raw camera frames are not kept after detection. Other application data is currently backed by the server's in-memory demo database; the checked-in MySQL schema is not connected to this Express server.
- Face matching is **not liveness detection** and does not prevent a photo or screen replay. Use this feature only in supervised settings and retain a manual attendance fallback.
- Teachers use the authorized classroom register to mark attendance.

### 2. 👪 Parent Portal with Multi-Child Monitoring & Alerts
- **Dedicated Parent Role & Authentication**:
  - Secure parent login via email, username, or phone number.
  - Strict backend authorization barrier: Parents can **only** access records for their authorized linked children. Cross-student data tampering attempts return `403 Forbidden`.
- **Multi-Child Family View**:
  - Smooth switcher between multiple enrolled siblings under a single parent account (e.g., Dr. Zahra Parveen can monitor both Fatima Zahra and Hamza Ahmed).
  - Multi-guardian support (Father, Mother, Legal Guardian).
- **Today's Attendance Real-Time Status**:
  - Live status indicator (Present with exact recorded time e.g., *09:05 AM*, Absent, Late, or No Class Scheduled).
- **High-Precision Attendance Calculations**:
  - Authoritative formula:
    $$\text{Attendance Percentage} = \frac{\text{Present Sessions} + \text{Late Sessions}}{\text{Total Eligible Sessions Evaluated}} \times 100\%$$
  - Handles zero sessions gracefully (displays 100% baseline).
  - Automatically identifies whether child meets the mandatory institutional minimum threshold (75% for IUB exam eligibility).
- **Subject-Wise Attendance Breakdown**:
  - Course-by-course breakdown: classes held, present days, late arrivals, absences, and percentages.
  - Visual color badges (Green for ≥ 75%, Red for < 75% Low Attendance Alert).
- **Online Parent Leave Application**:
  - Allows guardians to submit official leave notes for medical or personal absence directly to course faculty.
- **Absence Alerts & Automated Notifications**:
  - Real-time in-app notification feed when a child is marked absent or drops below 75%.
  - Monthly attendance report notices.
- **Printable Official Parent Attendance Transcript**:
  - Hard-copy ready transcript with college seal, student particulars, and signature block for parents, HoD, and Principal.

### 3. 📋 Classroom Registers & Institutional Operations
- **Classroom Attendance Marking**: One-click bulk actions (*Mark All Present*, *Mark All Absent*), search filtering, date navigation, and direct switch button to the AI Face Camera.
- **Official Print Media Styles**: Dedicated `@media print` layout formatting A4 attendance sheets with institutional letterheads.
- **Medical Leave Management**: Online student leave requests with PDF review and approval workflows.
- **AI Academic Assistant**: Context-aware assistant powered by Google Gemini to answer questions regarding attendance policies, recovery calculations, and college rules.
- **Security Inactivity Monitor**: Automatic 15-minute idle timeout overlay with a 60-second warning countdown.

---

## 🔑 Demo Access Credentials

The database comes pre-seeded with active accounts for testing all user roles:

| Role | Name | Email / Username | Default Password | Linked Students / Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Admin (Principal)** | Prof. Dr. Tariq Mahmood | `admin@alpine.edu.pk` or `admin` | `password123` | Full access: student directory, parent links, timetable, settings. |
| **Faculty / Teacher 1** | Prof. Hafiz Muhammad Yasir (HoD CS) | `yasir@alpine.edu.pk` or `teacher1` | `password123` | Assigned class registers and leave requests. |
| **Faculty / Teacher 2** | Prof. Aisha Siddiqa | `aisha@alpine.edu.pk` or `teacher2` | `password123` | Assigned course registers. |
| **Student 1** | Muhammad Ali Khan | `ali.khan@student.alpine.edu.pk` or `student1` | `password123` | Roll No: `CS-2022-042`. |
| **Student 2** | Fatima Zahra | `fatima.zahra@student.alpine.edu.pk` or `student2` | `password123` | Roll No: `CS-2022-043`. |
| **Student 3** | Hamza Ahmed | `hamza.ahmed@student.alpine.edu.pk` or `student3` | `password123` | Roll No: `CS-2022-044`. Low attendance scenario (33%). |
| **Parent 1** | Mr. Tariq Khan | `tariq.khan@parents.alpine.edu.pk` or `parent1` | `password123` | Linked to 1 child: **Muhammad Ali Khan** (`CS-2022-042`). |
| **Parent 2** | Dr. Zahra Parveen | `dr.zahra@parents.alpine.edu.pk` or `parent2` | `password123` | Linked to 2 children: **Fatima Zahra** & **Hamza Ahmed** (Multi-child view). |

Sign out before signing in with a different role. Portal access is enforced by the authenticated server session; changing a role in the browser does not grant another account's permissions.

---

## 📸 Live Camera Attendance

An administrator or assigned teacher can select **Face Enrollment** from the student directory, obtain consent from the student or legal guardian, and capture three live camera samples. The local model accepts exactly one detected face per image and stores an averaged face template; it does not store the captured images. Virtual camera simulations and photo-upload enrollment are not available. Students then choose **Verify Face & Mark Attendance** from the live camera attendance screen. The server matches the camera capture against the authenticated student's own template before recording attendance.

This local verifier does not perform liveness/anti-spoofing. A printed photo or display replay may be accepted. Do not use it as the sole attendance control.

---

## 👪 How to Use the Parent Portal

1. Log in using a parent account (e.g., `parent2` or click the **"Parent"** demo button).
2. The **Parent Dashboard** displays:
   - Today's live attendance status (*Present in College*, *Absent*, or *No Records*).
   - Multi-child switcher cards (toggle between *Fatima Zahra* and *Hamza Ahmed*).
   - Cumulative Attendance KPI card with visual progress bar against the 75% requirement.
   - Total classes, present days, late arrivals, and absent days.
3. Explore the sub-tabs:
   - **Subject Breakdown**: Course-by-course attendance rates and faculty details.
   - **Attendance Log History**: Complete dated logs with filters for date range and course.
   - **Submit Parent Leave Note**: Submit a guardian leave note for unexpected sickness or family travel.
   - **Alerts & Notifications**: Absence notices and low-attendance warnings.
4. Click **"Print Official Slip"** to print or export the student's transcript.

---

## 🗄️ Database Changes & MySQL Setup

The MySQL schema is located at `database/database.sql`. To import it into phpMyAdmin / XAMPP:

1. Open phpMyAdmin (`http://localhost/phpmyadmin`).
2. Create a new database named `alpine_attendance_db`.
3. Click the **Import** tab, choose `database.sql`, and click **Go**.

### New Tables Added in this Update:

```sql
-- 1. Facial Biometric Embedding Vault
CREATE TABLE IF NOT EXISTS `face_embeddings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL UNIQUE,
  `embedding_data` LONGTEXT NOT NULL COMMENT '128-dimensional normalized biometric vector',
  `sample_count` INT NOT NULL DEFAULT 3,
  `enrolled_by_user_id` INT NOT NULL,
  `consent_obtained` TINYINT(1) NOT NULL DEFAULT 1,
  `liveness_score_enrolled` FLOAT NOT NULL DEFAULT 0.98,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Parents & Guardians Entity
CREATE TABLE IF NOT EXISTS `parents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(50) NOT NULL,
  `cnic` VARCHAR(50) DEFAULT NULL,
  `occupation` VARCHAR(100) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `status` ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Parent-Student Relationship Mapping (Supports Multi-Child Families)
CREATE TABLE IF NOT EXISTS `parent_students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `parent_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `relationship` VARCHAR(50) NOT NULL DEFAULT 'Father',
  `is_primary` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_parent_student` (`parent_id`, `student_id`),
  FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 🧪 Automated Testing & Verification

The following API checks are useful smoke tests:

```bash
# Run the automated verification test script:
npx tsx -e "
async function runTests() {
  const baseURL = 'http://localhost:3000';
  console.log('Testing API availability...');
  const res = await fetch(baseURL + '/api/face-recognition/students');
  console.log('API Status:', res.status === 200 ? 'OK' : 'FAIL');
}
runTests();
"
```

### Attendance endpoint behavior
- `POST /api/attendance/live-camera-check-in` requires a student session, an enrolled face template, and a valid browser-generated descriptor from the live camera.
- Repeated check-ins for the same student and day return the existing record without creating a duplicate.
- `POST /api/face-recognition/enroll` accepts three to five camera descriptors and explicit consent. It rejects invalid or empty descriptors before saving the enrollment.
- The browser-side face matching path does not require any Python service or external cloud API; model files are served locally from `/models`.

---

## 💻 Local Development Setup (VS Code)

### Prerequisites
- Node.js (v18.0 or higher)
- npm or bun

### Commands
```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env
# Edit .env and enter GEMINI_API_KEY (optional, fallback engine active)

# 3. Start development server
npm run dev

# 4. Verify TypeScript compilation and linter
npm run lint

# 5. Build for production
npm run build
```

The face attendance flow now runs entirely in the browser using `face-api.js` and local model files in `public/models`. The project no longer depends on Python, OpenCV, or a cloud face-recognition service. The UI loads the detector, landmark, and recognition models from `/models`, extracts a 128-dim descriptor from the live video, and sends only that descriptor to the backend for comparison against the student's enrolled template.

Student live-camera check-in records general college attendance, not attendance for a selected subject. A student may record one successful camera check-in per day; these records are stored without a teacher or subject assignment and are excluded from subject-wise attendance breakdowns.

---

## 🔒 Security & Privacy Notice

- **Biometric Data Protection**: Obtain explicit consent before enrollment. Raw frames are transient and not written to disk; face descriptors are encrypted locally and stored only as numeric vectors. Deleting enrollment removes that student's template.
- **Model limitation**: `face-api.js` performs face detection and descriptor matching, not liveness detection. A photo or screen replay may still match. Do not treat a successful face match as proof of a live person; keep supervision and manual attendance controls.
- **Authorization Barrier**: Every parent-facing endpoint enforces relational ownership checks on the server side (`server.ts`).

---

## 🏫 Institutional Profile
- **Institution**: Alpine Degree College Khanpur, Pakistan
- **Affiliation**: The Islamia University of Bahawalpur (IUB)
- **Minimum Attendance Threshold**: 75% for Examination Eligibility
- **System**: Smart Attendance Management & Institutional Analytics Platform
