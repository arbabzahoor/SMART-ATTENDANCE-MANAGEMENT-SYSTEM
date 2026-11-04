-- ====================================================================
-- ALPINE DEGREE COLLEGE KHANPUR - ATTENDANCE & ACADEMIC SYSTEM
-- MySQL Database Schema & Sample Seed Data
-- Import this SQL file into phpMyAdmin (XAMPP / MySQL)
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `alpine_attendance_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `alpine_attendance_db`;

-- --------------------------------------------------------
-- Table structure for `system_settings`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `institution_name` VARCHAR(255) NOT NULL DEFAULT 'Alpine Degree College Khanpur, Pakistan',
  `min_attendance_percentage` INT NOT NULL DEFAULT 75,
  `attendance_edit_days` INT NOT NULL DEFAULT 7,
  `academic_session` VARCHAR(50) NOT NULL DEFAULT '2025-2026',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `system_settings` (`id`, `institution_name`, `min_attendance_percentage`, `attendance_edit_days`, `academic_session`) VALUES
(1, 'Alpine Degree College Khanpur, Pakistan', 75, 7, '2025-2026');

-- --------------------------------------------------------
-- Table structure for `departments`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `departments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `departments` (`id`, `code`, `name`, `description`) VALUES
(1, 'CS', 'Computer Science', 'Department of Computer Science & Information Technology'),
(2, 'IT', 'Information Technology', 'Department of Information Technology & Software Systems'),
(3, 'AI', 'Artificial Intelligence', 'Department of Artificial Intelligence & Data Sciences'),
(4, 'ECE', 'Electronics Engineering', 'Department of Electronics & Communication Systems');

-- --------------------------------------------------------
-- Table structure for `programs`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `programs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `department_id` INT NOT NULL,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `duration_years` INT DEFAULT 4,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `programs` (`id`, `department_id`, `code`, `name`, `duration_years`) VALUES
(1, 1, 'BSCS', 'Bachelor of Science in Computer Science', 4),
(2, 2, 'BSIT', 'Bachelor of Science in Information Technology', 4),
(3, 3, 'BSAI', 'Bachelor of Science in Artificial Intelligence', 4),
(4, 1, 'BSSE', 'Bachelor of Science in Software Engineering', 4);

-- --------------------------------------------------------
-- Table structure for `classes`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `classes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `program_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `semester` INT NOT NULL,
  `section` VARCHAR(10) NOT NULL,
  `academic_session` VARCHAR(50) NOT NULL,
  `batch` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `classes` (`id`, `program_id`, `name`, `semester`, `section`, `academic_session`, `batch`) VALUES
(1, 1, 'BSCS - 6A', 6, 'A', '2025-2026', '2022-2026'),
(2, 1, 'BSCS - 6B', 6, 'B', '2025-2026', '2022-2026'),
(3, 2, 'BSIT - 4A', 4, 'A', '2025-2026', '2023-2027'),
(4, 3, 'BSAI - 2A', 2, 'A', '2025-2026', '2024-2028');

-- --------------------------------------------------------
-- Table structure for `users`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `role` ENUM('ADMIN', 'TEACHER', 'STUDENT', 'PARENT') NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `status` ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  `avatar` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `users` (`id`, `username`, `email`, `role`, `full_name`, `status`, `avatar`) VALUES
(1, 'admin', 'admin@alpine.edu.pk', 'ADMIN', 'Prof. Dr. Tariq Mahmood (Principal)', 'ACTIVE', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'),
(2, 'teacher1', 'yasir@alpine.edu.pk', 'TEACHER', 'Prof. Hafiz Muhammad Yasir', 'ACTIVE', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'),
(3, 'teacher2', 'aisha@alpine.edu.pk', 'TEACHER', 'Prof. Aisha Siddiqa', 'ACTIVE', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'),
(4, 'student1', 'ali.khan@student.alpine.edu.pk', 'STUDENT', 'Muhammad Ali Khan', 'ACTIVE', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200'),
(5, 'student2', 'fatima.zahra@student.alpine.edu.pk', 'STUDENT', 'Fatima Zahra', 'ACTIVE', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'),
(6, 'student3', 'hamza.ahmed@student.alpine.edu.pk', 'STUDENT', 'Hamza Ahmed', 'ACTIVE', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200');

-- --------------------------------------------------------
-- Table structure for `teachers`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `teachers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `teacher_code` VARCHAR(50) NOT NULL UNIQUE,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(50) DEFAULT NULL,
  `department_id` INT NOT NULL,
  `designation` VARCHAR(100) NOT NULL DEFAULT 'Lecturer',
  `status` ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  `avatar` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `teachers` (`id`, `user_id`, `teacher_code`, `full_name`, `email`, `phone`, `department_id`, `designation`, `status`, `avatar`) VALUES
(1, 2, 'TCH-1001', 'Prof. Hafiz Muhammad Yasir', 'yasir@alpine.edu.pk', '+92 300 1234567', 1, 'Associate Professor & HoD CS', 'ACTIVE', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'),
(2, 3, 'TCH-1002', 'Prof. Aisha Siddiqa', 'aisha@alpine.edu.pk', '+92 301 7654321', 1, 'Assistant Professor', 'ACTIVE', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'),
(3, NULL, 'TCH-1003', 'Prof. Dr. Muhammad Usman', 'usman@alpine.edu.pk', '+92 302 9876543', 2, 'Assistant Professor', 'ACTIVE', 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200'),
(4, NULL, 'TCH-1004', 'Prof. Zainab Bibi', 'zainab@alpine.edu.pk', '+92 303 4567890', 1, 'Lecturer', 'ACTIVE', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200');

-- --------------------------------------------------------
-- Table structure for `students`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `student_code` VARCHAR(50) NOT NULL UNIQUE,
  `roll_number` VARCHAR(50) NOT NULL UNIQUE,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(50) DEFAULT NULL,
  `guardian_phone` VARCHAR(50) DEFAULT NULL,
  `gender` ENUM('MALE', 'FEMALE', 'OTHER') DEFAULT 'MALE',
  `dob` DATE DEFAULT '2003-01-01',
  `department_id` INT NOT NULL,
  `program_id` INT NOT NULL,
  `class_id` INT NOT NULL,
  `semester` INT DEFAULT 1,
  `batch` VARCHAR(50) DEFAULT '2025-2029',
  `status` ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  `avatar` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `students` (`id`, `user_id`, `student_code`, `roll_number`, `full_name`, `email`, `phone`, `guardian_phone`, `gender`, `dob`, `department_id`, `program_id`, `class_id`, `semester`, `batch`, `status`, `avatar`) VALUES
(1, 4, 'STU-2022-001', 'CS-2022-042', 'Muhammad Ali Khan', 'ali.khan@student.alpine.edu.pk', '+92 333 1112222', '+92 300 4567891', 'MALE', '2002-05-14', 1, 1, 1, 6, '2022-2026', 'ACTIVE', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200'),
(2, 5, 'STU-2022-002', 'CS-2022-043', 'Fatima Zahra', 'fatima.zahra@student.alpine.edu.pk', '+92 333 3334444', '+92 300 9876542', 'FEMALE', '2002-08-22', 1, 1, 1, 6, '2022-2026', 'ACTIVE', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'),
(3, 6, 'STU-2022-003', 'CS-2022-044', 'Hamza Ahmed', 'hamza.ahmed@student.alpine.edu.pk', '+92 333 5556666', '+92 300 9876542', 'MALE', '2001-11-30', 1, 1, 1, 6, '2022-2026', 'ACTIVE', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'),
(4, NULL, 'STU-2022-004', 'CS-2022-045', 'Usman Raza', 'usman.raza@student.alpine.edu.pk', '+92 333 7778888', NULL, 'MALE', '2002-03-12', 1, 1, 1, 6, '2022-2026', 'ACTIVE', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'),
(5, NULL, 'STU-2022-005', 'CS-2022-046', 'Ayesha Malik', 'ayesha.malik@student.alpine.edu.pk', '+92 333 9990000', NULL, 'FEMALE', '2003-01-25', 1, 1, 1, 6, '2022-2026', 'ACTIVE', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200');

-- --------------------------------------------------------
-- Table structure for `subjects`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subjects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `credit_hours` INT DEFAULT 3,
  `department_id` INT NOT NULL,
  `class_id` INT NOT NULL,
  `teacher_id` INT NOT NULL,
  `semester` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `subjects` (`id`, `code`, `name`, `credit_hours`, `department_id`, `class_id`, `teacher_id`, `semester`) VALUES
(1, 'CS-301', 'Database Systems', 4, 1, 1, 1, 6),
(2, 'CS-302', 'Software Engineering Principles', 3, 1, 1, 2, 6),
(3, 'CS-303', 'Web Technologies & Cloud Computing', 3, 1, 1, 1, 6),
(4, 'CS-304', 'Artificial Intelligence & ML', 4, 1, 1, 2, 6);

-- --------------------------------------------------------
-- Table structure for `timetable`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `timetable` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `class_id` INT NOT NULL,
  `subject_id` INT NOT NULL,
  `teacher_id` INT NOT NULL,
  `day_of_week` ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL,
  `start_time` VARCHAR(10) NOT NULL,
  `end_time` VARCHAR(10) NOT NULL,
  `room_number` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `timetable` (`id`, `class_id`, `subject_id`, `teacher_id`, `day_of_week`, `start_time`, `end_time`, `room_number`) VALUES
(1, 1, 1, 1, 'Monday', '09:00', '10:30', 'Lab-A'),
(2, 1, 2, 2, 'Monday', '10:45', '12:15', 'Room-302'),
(3, 1, 3, 1, 'Tuesday', '09:00', '10:30', 'Lab-B'),
(4, 1, 4, 2, 'Wednesday', '11:00', '12:30', 'Room-405'),
(5, 1, 1, 1, 'Thursday', '09:00', '10:30', 'Lab-A');

-- --------------------------------------------------------
-- Table structure for `attendance`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `teacher_id` INT DEFAULT NULL,
  `class_id` INT NOT NULL,
  `subject_id` INT DEFAULT NULL,
  `date` DATE NOT NULL,
  `time` VARCHAR(10) NOT NULL,
  `status` ENUM('PRESENT', 'ABSENT', 'LATE', 'LEAVE') NOT NULL,
  `remarks` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `attendance` (`id`, `student_id`, `teacher_id`, `class_id`, `subject_id`, `date`, `time`, `status`, `remarks`) VALUES
(1, 1, 1, 1, 1, '2026-08-01', '09:05', 'PRESENT', 'On time'),
(2, 2, 1, 1, 1, '2026-08-01', '09:05', 'PRESENT', 'On time'),
(3, 3, 1, 1, 1, '2026-08-01', '09:12', 'LATE', 'Traffic delay in Khanpur'),
(4, 1, 1, 1, 1, '2026-08-03', '09:02', 'PRESENT', 'On time'),
(5, 2, 1, 1, 1, '2026-08-03', '09:00', 'PRESENT', 'On time'),
(6, 3, 1, 1, 1, '2026-08-03', '09:00', 'ABSENT', 'Sick'),
(7, 1, 1, 1, 1, '2026-08-05', '09:00', 'PRESENT', 'On time'),
(8, 2, 1, 1, 1, '2026-08-05', '09:00', 'ABSENT', 'Uninformed'),
(9, 3, 1, 1, 1, '2026-08-05', '09:00', 'ABSENT', 'Uninformed'),
(10, 1, 2, 1, 2, '2026-08-02', '10:45', 'PRESENT', 'On time'),
(11, 2, 2, 1, 2, '2026-08-02', '10:45', 'PRESENT', 'On time'),
(12, 3, 2, 1, 2, '2026-08-02', '10:50', 'LATE', 'Slightly late');

-- --------------------------------------------------------
-- Table structure for `leave_requests`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `leave_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `from_date` DATE NOT NULL,
  `to_date` DATE NOT NULL,
  `reason` TEXT NOT NULL,
  `attachment_url` LONGTEXT,
  `attachment_name` VARCHAR(255) DEFAULT NULL,
  `attachment_size` VARCHAR(50) DEFAULT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  `teacher_remarks` TEXT,
  `reviewed_by` INT DEFAULT NULL,
  `reviewed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `leave_requests` (`id`, `student_id`, `from_date`, `to_date`, `reason`, `attachment_name`, `attachment_size`, `status`, `teacher_remarks`, `reviewed_by`, `reviewed_at`) VALUES
(1, 3, '2026-08-10', '2026-08-12', 'Attending Inter-College Academic Competition in Lahore representing Alpine Degree College.', 'Permission_Letter_Lahore.pdf', '240 KB', 'PENDING', NULL, NULL, NULL),
(2, 2, '2026-08-04', '2026-08-05', 'Fever and doctor recommended 2 days rest.', 'Doctor_Medical_Certificate.pdf', '315 KB', 'APPROVED', 'Medical certificate verified by department.', 2, '2026-08-04 10:00:00');

-- --------------------------------------------------------
-- Table structure for `announcements`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `target_audience` ENUM('ALL', 'STUDENTS', 'TEACHERS') DEFAULT 'ALL',
  `publish_date` DATE NOT NULL,
  `expiry_date` DATE NOT NULL,
  `status` ENUM('ACTIVE', 'EXPIRED') DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `announcements` (`id`, `title`, `description`, `target_audience`, `publish_date`, `expiry_date`, `status`) VALUES
(1, 'Alpine Degree College Khanpur Mid-Term Schedule', 'The upcoming mid-term examinations for BS Computer Science and BS IT will begin on August 20th. Please check your department notice board for details.', 'ALL', '2026-08-01', '2026-08-25', 'ACTIVE'),
(2, 'Seminar on Modern Information Technology in Pakistan', 'Special seminar on Software Engineering and AI Career Opportunities in the Main Hall at 11:00 AM on Friday.', 'STUDENTS', '2026-08-05', '2026-08-15', 'ACTIVE');

-- --------------------------------------------------------
-- Table structure for `activity_logs`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `user_name` VARCHAR(150) NOT NULL,
  `user_role` VARCHAR(50) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `ip_address` VARCHAR(50) DEFAULT '127.0.0.1',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `activity_logs` (`id`, `user_id`, `user_name`, `user_role`, `action`, `description`, `ip_address`) VALUES
(1, 1, 'Prof. Dr. Tariq Mahmood (Principal)', 'ADMIN', 'LOGIN', 'Principal admin logged in successfully', '127.0.0.1'),
(2, 2, 'Prof. Hafiz Muhammad Yasir', 'TEACHER', 'ATTENDANCE_MARKED', 'Marked attendance for BSCS-6A Database Systems on 2026-08-05', '127.0.0.1');

-- --------------------------------------------------------
-- Table structure for `face_embeddings` (Biometric Facial Templates)
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- Table structure for `parents`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `parents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(50) NOT NULL,
  `whatsapp_number` VARCHAR(50) DEFAULT NULL,
  `cnic` VARCHAR(50) DEFAULT NULL,
  `occupation` VARCHAR(100) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `status` ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `parent_students` (Relationship mapping)
-- --------------------------------------------------------
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

-- Seed Parent Accounts & Mappings
INSERT INTO `users` (`id`, `username`, `email`, `role`, `full_name`, `status`, `avatar`) VALUES
(7, 'parent1', 'tariq.khan@parents.alpine.edu.pk', 'PARENT', 'Mr. Tariq Khan', 'ACTIVE', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'),
(8, 'parent2', 'dr.zahra@parents.alpine.edu.pk', 'PARENT', 'Dr. Zahra Parveen', 'ACTIVE', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200');

INSERT INTO `parents` (`id`, `user_id`, `full_name`, `email`, `phone`, `whatsapp_number`, `cnic`, `occupation`, `address`, `status`) VALUES
(1, 7, 'Mr. Tariq Khan', 'tariq.khan@parents.alpine.edu.pk', '+92 300 4567891', '+92 300 4567891', '31201-1234567-1', 'Civil Engineer', 'Model Town, Khanpur, Punjab', 'ACTIVE'),
(2, 8, 'Dr. Zahra Parveen', 'dr.zahra@parents.alpine.edu.pk', '+92 300 9876542', '+92 300 9876542', '31201-7654321-2', 'Consultant Physician', 'Civil Lines, Khanpur, Punjab', 'ACTIVE');

-- Link Parent 1 to Muhammad Ali Khan (Student 1)
-- Link Parent 2 to Fatima Zahra (Student 2) AND Hamza Ahmed (Student 3) -> Multi-child demonstration!
INSERT INTO `parent_students` (`id`, `parent_id`, `student_id`, `relationship`, `is_primary`) VALUES
(1, 1, 1, 'Father', 1),
(2, 2, 2, 'Mother', 1),
(3, 2, 3, 'Mother', 1);

-- --------------------------------------------------------
-- Table structure for `fee_categories`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fee_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `is_recurring` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `fee_categories` (`id`, `code`, `name`, `description`, `is_recurring`) VALUES
(1, 'TUI', 'Tuition Fee', 'Regular semester academic tuition and lecture instruction charges', 1),
(2, 'ADM', 'Admission & Enrollment Fee', 'One-time registration and departmental admission processing', 0),
(3, 'EXM', 'Semester Examination Fee', 'Internal assessments, mid-terms, and final semester evaluation', 1),
(4, 'LAB', 'Computer Systems & AI Lab Fee', 'High-performance computing lab access, cloud tools, and practical experiments', 1),
(5, 'LIB', 'Central Library & Digital Resources', 'Textbook lending, IEEE digital subscriptions, and research database access', 1),
(6, 'SPT', 'Sports & Student Co-Curricular', 'Sports facilities, gymnasiums, and inter-college tournaments', 1),
(7, 'TRN', 'Campus Transport Facility', 'Daily college bus shuttle routes across Khanpur and surrounding regions', 1),
(8, 'DEV', 'Campus Infrastructure & Development', 'Smart classroom amenities, generators, and institutional development fund', 0);

-- --------------------------------------------------------
-- Table structure for `fee_structures`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fee_structures` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `class_id` INT DEFAULT NULL,
  `program_id` INT DEFAULT NULL,
  `semester` INT NOT NULL DEFAULT 1,
  `academic_session` VARCHAR(50) NOT NULL DEFAULT '2025-2026',
  `items_json` LONGTEXT NOT NULL COMMENT 'JSON array of {category_id, category_name, amount}',
  `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `due_days_limit` INT NOT NULL DEFAULT 15,
  `late_fine_amount` DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
  `status` ENUM('ACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `fee_discounts`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fee_discounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `type` ENUM('PERCENTAGE', 'FIXED') NOT NULL DEFAULT 'PERCENTAGE',
  `value` DECIMAL(10,2) NOT NULL,
  `category` ENUM('MERIT', 'NEED_BASED', 'KINSHIP', 'STAFF', 'SPORTS') NOT NULL,
  `description` TEXT,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `fee_invoices` (Challans)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fee_invoices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `challan_number` VARCHAR(50) NOT NULL UNIQUE,
  `student_id` INT NOT NULL,
  `class_id` INT NOT NULL,
  `semester` INT NOT NULL DEFAULT 1,
  `fee_structure_id` INT DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `academic_session` VARCHAR(50) NOT NULL DEFAULT '2025-2026',
  `issue_date` DATE NOT NULL,
  `due_date` DATE NOT NULL,
  `items_json` LONGTEXT NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `discount_reason` VARCHAR(255) DEFAULT NULL,
  `late_fine` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `paid_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `balance_due` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'REFUNDED') DEFAULT 'UNPAID',
  `payment_date` TIMESTAMP NULL DEFAULT NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `fee_payments` (Transactions)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fee_payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `transaction_id` VARCHAR(100) NOT NULL UNIQUE,
  `invoice_id` INT NOT NULL,
  `challan_number` VARCHAR(50) NOT NULL,
  `student_id` INT NOT NULL,
  `amount_paid` DECIMAL(10,2) NOT NULL,
  `payment_method` ENUM('CARD', 'BANK_TRANSFER', 'WALLET', 'CASH_CHALLAN') NOT NULL,
  `payment_channel` VARCHAR(100) NOT NULL,
  `transaction_reference` VARCHAR(100) NOT NULL,
  `card_last4` VARCHAR(10) DEFAULT NULL,
  `receipt_number` VARCHAR(50) NOT NULL UNIQUE,
  `paid_by_user_id` INT DEFAULT NULL,
  `paid_by_name` VARCHAR(150) NOT NULL,
  `paid_by_role` VARCHAR(50) NOT NULL,
  `payment_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `payment_status` ENUM('SUCCESS', 'PENDING_VERIFICATION', 'FAILED') DEFAULT 'SUCCESS',
  `slip_url` TEXT,
  `notes` TEXT,
  FOREIGN KEY (`invoice_id`) REFERENCES `fee_invoices`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

COMMIT;
