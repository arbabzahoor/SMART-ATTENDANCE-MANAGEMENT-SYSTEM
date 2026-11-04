import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Gemini Client Helper
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MOCK_KEY' || key.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ==========================================
// IN-MEMORY DATABASE ENGINE (Mirrors MySQL database.sql)
// ==========================================

let dbSettings = {
  institution_name: 'Alpine Degree College Khanpur, Pakistan',
  min_attendance_percentage: 75,
  attendance_edit_days: 7,
  academic_session: '2025-2026',
};

let dbUsers = [
  { id: 1, username: 'admin', email: 'admin@alpine.edu.pk', role: 'ADMIN', full_name: 'Prof. Dr. Tariq Mahmood (Principal)', status: 'ACTIVE', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200' },
  { id: 2, username: 'teacher1', email: 'yasir@alpine.edu.pk', role: 'TEACHER', full_name: 'Prof. Hafiz Muhammad Yasir', status: 'ACTIVE', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200' },
  { id: 3, username: 'teacher2', email: 'aisha@alpine.edu.pk', role: 'TEACHER', full_name: 'Prof. Aisha Siddiqa', status: 'ACTIVE', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200' },
  { id: 4, username: 'student1', email: 'ali.khan@student.alpine.edu.pk', role: 'STUDENT', full_name: 'Muhammad Ali Khan', status: 'ACTIVE', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200' },
  { id: 5, username: 'student2', email: 'fatima.zahra@student.alpine.edu.pk', role: 'STUDENT', full_name: 'Fatima Zahra', status: 'ACTIVE', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
  { id: 6, username: 'student3', email: 'hamza.ahmed@student.alpine.edu.pk', role: 'STUDENT', full_name: 'Hamza Ahmed', status: 'ACTIVE', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
  { id: 7, username: 'parent1', email: 'tariq.khan@parents.alpine.edu.pk', role: 'PARENT', full_name: 'Mr. Tariq Khan (Guardian of Ali Khan)', status: 'ACTIVE', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
  { id: 8, username: 'parent2', email: 'dr.zahra@parents.alpine.edu.pk', role: 'PARENT', full_name: 'Dr. Zahra Parveen (Mother of Fatima & Hamza)', status: 'ACTIVE', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200' },
];

type AppUser = (typeof dbUsers)[number];
const passwordHashes = new Map<number, string>();
const authSessions = new Map<string, { userId: number; expiresAt: number }>();
const hashPassword = (password: string, salt = randomBytes(16).toString('hex')) =>
  `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
const verifyPassword = (password: string, stored: string | undefined) => {
  if (!stored) return false;
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, 'hex');
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
};
dbUsers.forEach(user => passwordHashes.set(user.id, hashPassword('password123')));

declare global {
  namespace Express {
    interface Request {
      authenticatedUser?: AppUser;
    }
  }
}

let dbDepartments = [
  { id: 1, code: 'CS', name: 'Computer Science', description: 'Department of Computer Science & Information Technology' },
  { id: 2, code: 'IT', name: 'Information Technology', description: 'Department of Information Technology & Software Systems' },
  { id: 3, code: 'AI', name: 'Artificial Intelligence', description: 'Department of Artificial Intelligence & Data Sciences' },
  { id: 4, code: 'ECE', name: 'Electronics Engineering', description: 'Department of Electronics & Communication Systems' },
];

let dbPrograms = [
  { id: 1, department_id: 1, code: 'BSCS', name: 'Bachelor of Science in Computer Science', duration_years: 4 },
  { id: 2, department_id: 2, code: 'BSIT', name: 'Bachelor of Science in Information Technology', duration_years: 4 },
  { id: 3, department_id: 3, code: 'BSAI', name: 'Bachelor of Science in Artificial Intelligence', duration_years: 4 },
  { id: 4, department_id: 1, code: 'BSSE', name: 'Bachelor of Science in Software Engineering', duration_years: 4 },
];

let dbClasses = [
  { id: 1, program_id: 1, name: 'BSCS - 6A', semester: 6, section: 'A', academic_session: '2025-2026', batch: '2022-2026' },
  { id: 2, program_id: 1, name: 'BSCS - 6B', semester: 6, section: 'B', academic_session: '2025-2026', batch: '2022-2026' },
  { id: 3, program_id: 2, name: 'BSIT - 4A', semester: 4, section: 'A', academic_session: '2025-2026', batch: '2023-2027' },
  { id: 4, program_id: 3, name: 'BSAI - 2A', semester: 2, section: 'A', academic_session: '2025-2026', batch: '2024-2028' },
];

let dbTeachers = [
  { id: 1, user_id: 2, teacher_code: 'TCH-1001', full_name: 'Prof. Hafiz Muhammad Yasir', email: 'yasir@alpine.edu.pk', phone: '+92 300 1234567', department_id: 1, designation: 'Associate Professor & HoD CS', status: 'ACTIVE', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200' },
  { id: 2, user_id: 3, teacher_code: 'TCH-1002', full_name: 'Prof. Aisha Siddiqa', email: 'aisha@alpine.edu.pk', phone: '+92 301 7654321', department_id: 1, designation: 'Assistant Professor', status: 'ACTIVE', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200' },
  { id: 3, user_id: 0, teacher_code: 'TCH-1003', full_name: 'Prof. Dr. Muhammad Usman', email: 'usman@alpine.edu.pk', phone: '+92 302 9876543', department_id: 2, designation: 'Assistant Professor', status: 'ACTIVE', avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200' },
  { id: 4, user_id: 0, teacher_code: 'TCH-1004', full_name: 'Prof. Zainab Bibi', email: 'zainab@alpine.edu.pk', phone: '+92 303 4567890', department_id: 1, designation: 'Lecturer', status: 'ACTIVE', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200' },
];

let dbStudents = [
  { id: 1, user_id: 4, student_code: 'STU-2022-001', roll_number: 'CS-2022-042', full_name: 'Muhammad Ali Khan', email: 'ali.khan@student.alpine.edu.pk', phone: '+92 333 1112222', guardian_phone: '+92 300 4567891', gender: 'MALE', dob: '2002-05-14', department_id: 1, program_id: 1, class_id: 1, semester: 6, batch: '2022-2026', status: 'ACTIVE', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200' },
  { id: 2, user_id: 5, student_code: 'STU-2022-002', roll_number: 'CS-2022-043', full_name: 'Fatima Zahra', email: 'fatima.zahra@student.alpine.edu.pk', phone: '+92 333 3334444', guardian_phone: '+92 300 9876542', gender: 'FEMALE', dob: '2002-08-22', department_id: 1, program_id: 1, class_id: 1, semester: 6, batch: '2022-2026', status: 'ACTIVE', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
  { id: 3, user_id: 6, student_code: 'STU-2022-003', roll_number: 'CS-2022-044', full_name: 'Hamza Ahmed', email: 'hamza.ahmed@student.alpine.edu.pk', phone: '+92 333 5556666', guardian_phone: '+92 300 9876542', gender: 'MALE', dob: '2001-11-30', department_id: 1, program_id: 1, class_id: 1, semester: 6, batch: '2022-2026', status: 'ACTIVE', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
  { id: 4, user_id: 0, student_code: 'STU-2022-004', roll_number: 'CS-2022-045', full_name: 'Usman Raza', email: 'usman.raza@student.alpine.edu.pk', phone: '+92 333 7778888', guardian_phone: null, gender: 'MALE', dob: '2002-03-12', department_id: 1, program_id: 1, class_id: 1, semester: 6, batch: '2022-2026', status: 'ACTIVE', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200' },
  { id: 5, user_id: 0, student_code: 'STU-2022-005', roll_number: 'CS-2022-046', full_name: 'Ayesha Malik', email: 'ayesha.malik@student.alpine.edu.pk', phone: '+92 333 9990000', guardian_phone: null, gender: 'FEMALE', dob: '2003-01-25', department_id: 1, program_id: 1, class_id: 1, semester: 6, batch: '2022-2026', status: 'ACTIVE', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
];

let dbSubjects = [
  { id: 1, code: 'CS-301', name: 'Database Systems', credit_hours: 4, department_id: 1, class_id: 1, teacher_id: 1, semester: 6 },
  { id: 2, code: 'CS-302', name: 'Software Engineering Principles', credit_hours: 3, department_id: 1, class_id: 1, teacher_id: 2, semester: 6 },
  { id: 3, code: 'CS-303', name: 'Web Technologies & Cloud Computing', credit_hours: 3, department_id: 1, class_id: 1, teacher_id: 1, semester: 6 },
  { id: 4, code: 'CS-304', name: 'Artificial Intelligence & ML', credit_hours: 4, department_id: 1, class_id: 1, teacher_id: 2, semester: 6 },
];

let dbTimetable = [
  { id: 1, class_id: 1, subject_id: 1, teacher_id: 1, day_of_week: 'Monday', start_time: '09:00', end_time: '10:30', room_number: 'Lab-A' },
  { id: 2, class_id: 1, subject_id: 2, teacher_id: 2, day_of_week: 'Monday', start_time: '10:45', end_time: '12:15', room_number: 'Room-302' },
  { id: 3, class_id: 1, subject_id: 3, teacher_id: 1, day_of_week: 'Tuesday', start_time: '09:00', end_time: '10:30', room_number: 'Lab-B' },
  { id: 4, class_id: 1, subject_id: 4, teacher_id: 2, day_of_week: 'Wednesday', start_time: '11:00', end_time: '12:30', room_number: 'Room-405' },
  { id: 5, class_id: 1, subject_id: 1, teacher_id: 1, day_of_week: 'Thursday', start_time: '09:00', end_time: '10:30', room_number: 'Lab-A' },
];

type AttendanceEntry = {
  id: number;
  student_id: number;
  teacher_id: number | null;
  class_id: number;
  subject_id: number | null;
  date: string;
  time: string;
  status: string;
  remarks: string;
  method?: 'MANUAL' | 'FACE_RECOGNITION' | 'CAMERA_CHECK_IN';
  confidence_score?: number;
};

let dbAttendance: AttendanceEntry[] = [
  // Student 1 (Muhammad Ali Khan): Present 3, Late 1 -> 100%
  { id: 1, student_id: 1, teacher_id: 1, class_id: 1, subject_id: 1, date: '2026-08-01', time: '09:05', status: 'PRESENT', remarks: 'On time' },
  { id: 2, student_id: 2, teacher_id: 1, class_id: 1, subject_id: 1, date: '2026-08-01', time: '09:05', status: 'PRESENT', remarks: 'On time' },
  { id: 3, student_id: 3, teacher_id: 1, class_id: 1, subject_id: 1, date: '2026-08-01', time: '09:12', status: 'LATE', remarks: 'Traffic delay in Khanpur' },
  { id: 4, student_id: 1, teacher_id: 1, class_id: 1, subject_id: 1, date: '2026-08-03', time: '09:02', status: 'PRESENT', remarks: 'On time' },
  { id: 5, student_id: 2, teacher_id: 1, class_id: 1, subject_id: 1, date: '2026-08-03', time: '09:00', status: 'PRESENT', remarks: 'On time' },
  { id: 6, student_id: 3, teacher_id: 1, class_id: 1, subject_id: 1, date: '2026-08-03', time: '09:00', status: 'ABSENT', remarks: 'Sick' },
  { id: 7, student_id: 1, teacher_id: 1, class_id: 1, subject_id: 1, date: '2026-08-05', time: '09:00', status: 'PRESENT', remarks: 'On time' },
  { id: 8, student_id: 2, teacher_id: 1, class_id: 1, subject_id: 1, date: '2026-08-05', time: '09:00', status: 'ABSENT', remarks: 'Uninformed' },
  { id: 9, student_id: 3, teacher_id: 1, class_id: 1, subject_id: 1, date: '2026-08-05', time: '09:00', status: 'ABSENT', remarks: 'Uninformed' },
  // Student 3 (Hamza Ahmed) has 1 Late, 2 Absents out of 3 Database Systems classes = 33% attendance -> Low Attendance Warning!
  { id: 10, student_id: 1, teacher_id: 2, class_id: 1, subject_id: 2, date: '2026-08-02', time: '10:45', status: 'PRESENT', remarks: 'On time' },
  { id: 11, student_id: 2, teacher_id: 2, class_id: 1, subject_id: 2, date: '2026-08-02', time: '10:45', status: 'PRESENT', remarks: 'On time' },
  { id: 12, student_id: 3, teacher_id: 2, class_id: 1, subject_id: 2, date: '2026-08-02', time: '10:50', status: 'LATE', remarks: 'Slightly late' },
];

let dbLeaveRequests = [
  { id: 1, student_id: 3, from_date: '2026-08-10', to_date: '2026-08-12', reason: 'Attending Inter-College Academic Competition in Lahore representing Alpine Degree College.', attachment_url: 'data:application/pdf;base64,JVBERi0xLjQKJcO34MiNCjEgMCBvYmoKPDwvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlIC9QYWdlcyAvQ291bnQgMSAvS2lkcyBbMyAwIFJdPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9SZXNvdXJjZXMgPDwvRm9udCA8PC9GMCA8PC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvQmFzZUZvbnQgL0hlbHZldGljYT4+Pj4+IC9NZWRpYUJveCBbMCAwIDYxMiA3OTJdIC9Db250ZW50cyA0IDAgUj4+CmVuZG9iago0IDAgb2JqCjw8L0xlbmd0aCAxMzA+PgpzdHJlYW0KQlQKL0YwIDI0IFRmCjcyIDcxMCBUZAkKKEFMUElORSBERUdSRUUgQ09MTEVHRSAoTFVCRUFLQU4pKSBUagovRjAgMTIgVGYKNzIgNjg0IFRkCihPRkZJQ0lAVL1PTEI1M1JUSU5HIExFQVZFIEFUVEFDSE1FTlQpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKdHJhaWxlcgo8PC9Sb290IDEgMCBSL1NpemUgNT4+CiVFT0Y=', attachment_name: 'Permission_Letter_Lahore.pdf', attachment_size: '240 KB', status: 'PENDING', teacher_remarks: null, reviewed_by: null, reviewed_at: null, created_at: new Date().toISOString() },
  { id: 2, student_id: 2, from_date: '2026-08-04', to_date: '2026-08-05', reason: 'Fever and doctor recommended 2 days rest.', attachment_url: 'data:application/pdf;base64,JVBERi0xLjQKJcO34MiNCjEgMCBvYmoKPDwvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlIC9QYWdlcyAvQ291bnQgMSAvS2lkcyBbMyAwIFJdPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9SZXNvdXJjZXMgPDwvRm9udCA8PC9GMCA8PC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvQmFzZUZvbnQgL0hlbHZldGljYT4+Pj4+IC9NZWRpYUJveCBbMCAwIDYxMiA3OTJdIC9Db250ZW50cyA0IDAgUj4+CmVuZG9iago0IDAgb2JqCjw8L0xlbmd0aCAxMzA+PgpzdHJlYW0KQlQKL0YwIDI0IFRmCjcyIDcxMCBUZAkKKEFMUElORSBERUdSRUUgQ09MTEVHRSAoTFVCRUFLQU4pKSBUagovRjAgMTIgVGYKNzIgNjg0IFRkCihPRkZJQ0lAVL1PTEI1M1JUSU5HIExFQVZFIEFUVEFDSE1FTlQpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKdHJhaWxlcgo8PC9Sb290IDEgMCBSL1NpemUgNT4+CiVFT0Y=', attachment_name: 'Doctor_Medical_Certificate.pdf', attachment_size: '315 KB', status: 'APPROVED', teacher_remarks: 'Medical certificate verified by department.', reviewed_by: 2, reviewed_at: '2026-08-04T10:00:00Z', created_at: '2026-08-04T08:30:00Z' },
  { id: 3, student_id: 3, from_date: '2026-07-15', to_date: '2026-07-16', reason: 'Severe viral throat infection and high fever.', attachment_url: 'data:application/pdf;base64,JVBERi0xLjQKJcO34MiNCjEgMCBvYmoKPDwvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlIC9QYWdlcyAvQ291bnQgMSAvS2lkcyBbMyAwIFJdPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9SZXNvdXJjZXMgPDwvRm9udCA8PC9GMCA8PC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvQmFzZUZvbnQgL0hlbHZldGljYT4+Pj4+IC9NZWRpYUJveCBbMCAwIDYxMiA3OTJdIC9Db250ZW50cyA0IDAgUj4+CmVuZG9iago0IDAgb2JqCjw8L0xlbmd0aCAxMzA+PgpzdHJlYW0KQlQKL0YwIDI0IFRmCjcyIDcxMCBUZAkKKEFMUElORSBERUdSRUUgQ09MTEVHRSAoTFVCRUFLQU4pKSBUagovRjAgMTIgVGYKNzIgNjg0IFRkCihPRkZJQ0lAVL1PTEI1M1JUSU5HIExFQVZFIEFUVEFDSE1FTlQpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKdHJhaWxlcgo8PC9Sb290IDEgMCBSL1NpemUgNT4+CiVFT0Y=', attachment_name: 'Medical_Prescription_Slip.pdf', attachment_size: '180 KB', status: 'APPROVED', teacher_remarks: 'Approved. Doctor prescription verified by HoD.', reviewed_by: 2, reviewed_at: '2026-07-15T09:15:00Z', created_at: '2026-07-14T18:20:00Z' },
  { id: 4, student_id: 3, from_date: '2026-06-01', to_date: '2026-06-02', reason: 'Unplanned family trip during regular lecture schedule.', attachment_url: '', attachment_name: '', attachment_size: '', status: 'REJECTED', teacher_remarks: 'Rejected: Non-medical absence without prior official department permission.', reviewed_by: 2, reviewed_at: '2026-06-01T11:00:00Z', created_at: '2026-05-30T14:10:00Z' },
];

let dbNotifications = [
  { id: 1, user_id: 6, title: 'Low Attendance Alert!', message: 'Your Database Systems attendance is 33.3%. Minimum required is 75%. Please attend upcoming classes at Alpine Degree College Khanpur.', type: 'WARNING', is_read: false, created_at: new Date().toISOString() },
  { id: 2, user_id: 5, title: 'Leave Request Approved', message: 'Your medical leave request for Aug 4 - Aug 5 has been approved.', type: 'LEAVE', is_read: true, created_at: new Date().toISOString() },
  { id: 3, user_id: 4, title: 'Mid-Semester Timetable Update', message: 'Please check your student timetable for updated lab allocations.', type: 'INFO', is_read: false, created_at: new Date().toISOString() },
];

let dbAnnouncements = [
  { id: 1, title: 'Alpine Degree College Khanpur Mid-Term Schedule', description: 'The upcoming mid-term examinations for BS Computer Science and BS IT will begin on August 20th. Please check your department notice board for details.', target_audience: 'ALL', publish_date: '2026-08-01', expiry_date: '2026-08-25', status: 'ACTIVE', created_at: new Date().toISOString() },
  { id: 2, title: 'Seminar on Modern Information Technology in Pakistan', description: 'Special seminar on Software Engineering and AI Career Opportunities in the Main Hall at 11:00 AM on Friday.', target_audience: 'STUDENTS', publish_date: '2026-08-05', expiry_date: '2026-08-15', status: 'ACTIVE', created_at: new Date().toISOString() },
];

let dbActivityLogs = [
  { id: 1, user_id: 1, user_name: 'Prof. Dr. Tariq Mahmood (Principal)', user_role: 'ADMIN', action: 'LOGIN', description: 'Principal admin logged in successfully', ip_address: '127.0.0.1', created_at: new Date().toISOString() },
  { id: 2, user_id: 2, user_name: 'Prof. Hafiz Muhammad Yasir', user_role: 'TEACHER', action: 'ATTENDANCE_MARKED', description: 'Marked attendance for BSCS-6A Database Systems on 2026-08-05', ip_address: '127.0.0.1', created_at: new Date().toISOString() },
];

// ==========================================
// BIOMETRICS & PARENT DATA STORES
// ==========================================

let dbParents = [
  {
    id: 1,
    user_id: 7,
    full_name: 'Mr. Tariq Khan',
    email: 'tariq.khan@parents.alpine.edu.pk',
    phone: '+92 300 4567891',
    whatsapp_number: '+923004567891',
    cnic: '31201-1234567-1',
    occupation: 'Civil Engineer',
    address: 'Model Town, Khanpur, Punjab',
    status: 'ACTIVE' as const,
    created_at: '2026-08-01T08:00:00Z',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 2,
    user_id: 8,
    full_name: 'Dr. Zahra Parveen',
    email: 'dr.zahra@parents.alpine.edu.pk',
    phone: '+92 300 9876542',
    whatsapp_number: '+923009876542',
    cnic: '31201-7654321-2',
    occupation: 'Consultant Physician',
    address: 'Civil Lines, Khanpur, Punjab',
    status: 'ACTIVE' as const,
    created_at: '2026-08-01T08:00:00Z',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
  },
];

let dbParentStudents = [
  { id: 1, parent_id: 1, student_id: 1, relationship: 'Father', is_primary: true, created_at: '2026-08-01T08:00:00Z' },
  { id: 2, parent_id: 2, student_id: 2, relationship: 'Mother', is_primary: true, created_at: '2026-08-01T08:00:00Z' },
  { id: 3, parent_id: 2, student_id: 3, relationship: 'Mother', is_primary: true, created_at: '2026-08-01T08:00:00Z' },
];

const seedUserIds = new Set(dbUsers.map(user => user.id));
const seedStudentIds = new Set(dbStudents.map(student => student.id));
const seedTeacherIds = new Set(dbTeachers.map(teacher => teacher.id));
const seedParentIds = new Set(dbParents.map(parent => parent.id));
const seedParentStudentKeys = new Set(dbParentStudents.map(link => `${link.parent_id}:${link.student_id}`));
const authStorePath = process.env.AUTH_STORE_PATH || path.join(process.cwd(), 'data', 'auth-store.json');

function persistAuthState() {
  try {
    fs.mkdirSync(path.dirname(authStorePath), { recursive: true });
    fs.writeFileSync(authStorePath, JSON.stringify({
      users: dbUsers.filter(user => !seedUserIds.has(user.id)),
      students: dbStudents.filter(student => !seedStudentIds.has(student.id)),
      teachers: dbTeachers.filter(teacher => !seedTeacherIds.has(teacher.id)),
      parents: dbParents.filter(parent => !seedParentIds.has(parent.id)),
      parentStudentLinks: dbParentStudents.filter(link => !seedParentStudentKeys.has(`${link.parent_id}:${link.student_id}`)),
      studentPortalLinks: dbStudents.map(student => ({ id: student.id, user_id: student.user_id })),
      cameraAttendanceRecords: dbAttendance.filter(record => record.method === 'CAMERA_CHECK_IN'),
      passwordHashes: [...passwordHashes.entries()],
    }, null, 2), { mode: 0o600 });
  } catch (error) {
    console.error('Failed to persist account and parent-link data:', error);
    throw error;
  }
}

function restoreAuthState() {
  if (!fs.existsSync(authStorePath)) return;
  try {
    const saved = JSON.parse(fs.readFileSync(authStorePath, 'utf8'));
    if (Array.isArray(saved.users)) dbUsers.push(...saved.users.filter((user: AppUser) => user && Number.isSafeInteger(user.id) && !dbUsers.some(current => current.id === user.id)));
    if (Array.isArray(saved.students)) dbStudents.push(...saved.students.filter((student: typeof dbStudents[number]) => student && Number.isSafeInteger(student.id) && !dbStudents.some(current => current.id === student.id)));
    if (Array.isArray(saved.studentPortalLinks)) {
      for (const link of saved.studentPortalLinks) {
        const student = link && Number.isSafeInteger(link.id)
          ? dbStudents.find(current => current.id === link.id)
          : undefined;
        if (student && Number.isSafeInteger(link.user_id)) student.user_id = link.user_id;
      }
    }
    if (Array.isArray(saved.teachers)) dbTeachers.push(...saved.teachers.filter((teacher: typeof dbTeachers[number]) => teacher && Number.isSafeInteger(teacher.id) && !dbTeachers.some(current => current.id === teacher.id)));
    if (Array.isArray(saved.parents)) dbParents.push(...saved.parents.filter((parent: typeof dbParents[number]) => parent && Number.isSafeInteger(parent.id) && !dbParents.some(current => current.id === parent.id)));
    if (Array.isArray(saved.parentStudentLinks)) {
      dbParentStudents.push(...saved.parentStudentLinks.filter((link: typeof dbParentStudents[number]) =>
        link && Number.isSafeInteger(link.id) &&
        !dbParentStudents.some(current => current.parent_id === link.parent_id && current.student_id === link.student_id)
      ));
    }
    if (Array.isArray(saved.passwordHashes)) {
      saved.passwordHashes.forEach((entry: unknown) => {
        if (Array.isArray(entry) && Number.isSafeInteger(entry[0]) && typeof entry[1] === 'string' && /^[a-f0-9]{32}:[a-f0-9]{128}$/i.test(entry[1])) {
          passwordHashes.set(entry[0], entry[1]);
        }
      });
    }
    if (Array.isArray(saved.cameraAttendanceRecords)) {
      for (const record of saved.cameraAttendanceRecords as AttendanceEntry[]) {
        if (
          record &&
          Number.isSafeInteger(record.id) &&
          Number.isSafeInteger(record.student_id) &&
          (record.teacher_id === null || Number.isSafeInteger(record.teacher_id)) &&
          Number.isSafeInteger(record.class_id) &&
          (record.subject_id === null || Number.isSafeInteger(record.subject_id)) &&
          /^\d{4}-\d{2}-\d{2}$/.test(record.date) &&
          /^\d{2}:\d{2}$/.test(record.time) &&
          record.status === 'PRESENT' &&
          record.method === 'CAMERA_CHECK_IN' &&
          !dbAttendance.some(existing => existing.id === record.id)
        ) {
          dbAttendance.push(record);
        }
      }
    }
  } catch (error) {
    console.error(`Failed to restore account data from ${authStorePath}:`, error);
    throw error;
  }
}

restoreAuthState();

interface FaceEmbeddingRecord {
  id: number;
  student_id: number;
  embedding: number[];
  sample_count: number;
  enrolled_by_user_id: number;
  consent_obtained: boolean;
  liveness_score_enrolled: number;
  created_at: string;
  updated_at: string;
}

let dbFaceEmbeddings: FaceEmbeddingRecord[] = [];
const faceEmbeddingsPath = path.join(process.cwd(), 'data', 'face-embeddings.json');
const faceEncryptionKeyPath = path.join(process.cwd(), 'data', 'face-embeddings.key');

function getFaceEncryptionKey(): Buffer {
  fs.mkdirSync(path.dirname(faceEncryptionKeyPath), { recursive: true });
  if (!fs.existsSync(faceEncryptionKeyPath)) {
    fs.writeFileSync(faceEncryptionKeyPath, randomBytes(32), { mode: 0o600, flag: 'wx' });
  }
  const key = fs.readFileSync(faceEncryptionKeyPath);
  if (key.length !== 32) throw new Error('The local face-embedding encryption key is invalid.');
  return key;
}

function persistFaceEmbeddings(records: FaceEmbeddingRecord[]) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getFaceEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(records), 'utf8'), cipher.final()]);
  const payload = {
    version: 1,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: encrypted.toString('base64'),
  };
  const temporaryPath = `${faceEmbeddingsPath}.tmp`;
  fs.mkdirSync(path.dirname(faceEmbeddingsPath), { recursive: true });
  fs.writeFileSync(temporaryPath, JSON.stringify(payload), { mode: 0o600 });
  fs.renameSync(temporaryPath, faceEmbeddingsPath);
}

function restoreFaceEmbeddings() {
  if (!fs.existsSync(faceEmbeddingsPath)) return;
  try {
    const payload = JSON.parse(fs.readFileSync(faceEmbeddingsPath, 'utf8'));
    if (payload.version !== 1) throw new Error('Unsupported face-template storage version.');
    const decipher = createDecipheriv(
      'aes-256-gcm',
      getFaceEncryptionKey(),
      Buffer.from(payload.iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(payload.data, 'base64')),
      decipher.final(),
    ]).toString('utf8');
    const saved = JSON.parse(plaintext);
    if (!Array.isArray(saved) || saved.some(record =>
      !Number.isSafeInteger(record.student_id) ||
      !Array.isArray(record.embedding) ||
      record.embedding.length !== 128 ||
      record.embedding.some((value: unknown) => typeof value !== 'number' || !Number.isFinite(value))
    )) {
      throw new Error('Stored face templates are malformed.');
    }
    dbFaceEmbeddings = saved;
  } catch (error) {
    console.error(`Failed to restore encrypted face templates from ${faceEmbeddingsPath}:`, error);
    throw error;
  }
}

restoreFaceEmbeddings();

const FACE_MATCH_THRESHOLD = Number(process.env.FACE_MATCH_THRESHOLD || 0.58);
if (!Number.isFinite(FACE_MATCH_THRESHOLD) || FACE_MATCH_THRESHOLD <= 0 || FACE_MATCH_THRESHOLD > 1) {
  throw new Error('FACE_MATCH_THRESHOLD must be a number greater than 0 and no greater than 1.');
}

function normalizeEmbedding(values: unknown[], fieldName = 'face descriptor'): number[] {
  const normalized = Array.isArray(values) ? values.map(value => Number(value)) : [];
  if (normalized.length !== 128 || normalized.some(value => !Number.isFinite(value))) {
    throw new Error(`The ${fieldName} is invalid. Expected 128 numeric values.`);
  }
  return normalized;
}

function cosineSimilarity(left: number[], right: number[]): number {
  const dot = left.reduce((sum, value, index) => sum + value * right[index], 0);
  const leftNorm = Math.sqrt(left.reduce((sum, value) => sum + value * value, 0));
  const rightNorm = Math.sqrt(right.reduce((sum, value) => sum + value * value, 0));
  if (leftNorm === 0 || rightNorm === 0) return 0;
  return dot / (leftNorm * rightNorm);
}

let dbEmailLogs: any[] = [
  {
    id: 1,
    student_id: 3,
    recipient_email: 'hamza.ahmed@student.alpine.edu.pk',
    recipient_name: 'Hamza Ahmed',
    roll_number: 'CS-2022-044',
    subject: 'URGENT: Low Attendance Academic Warning (< 75%)',
    body_html: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <div style="border-bottom: 2px solid #312e81; padding-bottom: 12px; margin-bottom: 20px; text-align: center;">
        <h2 style="color: #312e81; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">ALPINE DEGREE COLLEGE KHANPUR</h2>
        <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; font-weight: 600;">Office of Academic Affairs & Student Records</p>
      </div>
      <p style="font-size: 14px;">Dear <strong>Hamza Ahmed</strong> (Roll Number: <code>CS-2022-044</code>, Class: BSCS - 6A),</p>
      <p style="font-size: 14px; line-height: 1.5;">This automated communication serves as official notification that your overall attendance standing is <strong>33%</strong>, which is below the required <strong>75%</strong> minimum threshold.</p>
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-left: 5px solid #dc2626; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin: 0 0 8px 0; color: #991b1b; font-size: 15px; font-weight: 700;">Academic Warning Metrics</h4>
        <p style="margin: 4px 0; font-size: 13px; color: #7f1d1d;">• Total Sessions Evaluated: <strong>3</strong></p>
        <p style="margin: 4px 0; font-size: 13px; color: #7f1d1d;">• Sessions Attended: <strong>1</strong></p>
        <p style="margin: 4px 0; font-size: 13px; color: #7f1d1d;">• Current Percentage: <strong>33%</strong> (Required Minimum: 75%)</p>
        <p style="margin: 4px 0; font-size: 13px; color: #7f1d1d;">• Estimated Classes Needed to Reach 75%: <strong>4 consecutive sessions</strong></p>
      </div>
      <p style="font-size: 13px; line-height: 1.5; color: #475569;">
        Students failing to meet the minimum attendance threshold may be restricted from sitting in upcoming mid-term or final examinations. Please contact your department coordinator or submit authorized leave applications immediately if applicable.
      </p>
      <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8;">
        Simulated Email Delivery Service • Sent to hamza.ahmed@student.alpine.edu.pk • Alpine Degree College Khanpur, Pakistan
      </div>
    </div>`,
    attendance_pct: 33,
    trigger_type: 'AUTOMATED_THRESHOLD',
    sent_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'DELIVERED',
  }
];

function sendSimulatedEmailAlert(studentId: number, triggerType: 'AUTOMATED_THRESHOLD' | 'MANUAL_ALERT' | 'ATTENDANCE_UPDATE' = 'AUTOMATED_THRESHOLD', customNote?: string) {
  const stu = dbStudents.find(s => s.id === Number(studentId));
  if (!stu) return null;

  const stuRecords = dbAttendance.filter(a => a.student_id === Number(studentId));
  const total = stuRecords.length;
  const attended = stuRecords.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
  const pct = total > 0 ? Math.round((attended / total) * 100) : 100;
  const minThreshold = dbSettings.min_attendance_percentage;
  const cls = dbClasses.find(c => c.id === stu.class_id);

  const needed = Math.ceil((minThreshold * total - 100 * attended) / (100 - minThreshold));

  const subject = `URGENT: Attendance Warning Notice (${pct}% < ${minThreshold}%) - ${stu.full_name}`;
  const body_html = `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
    <div style="border-bottom: 2px solid #312e81; padding-bottom: 12px; margin-bottom: 20px; text-align: center;">
      <h2 style="color: #312e81; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">ALPINE DEGREE COLLEGE KHANPUR</h2>
      <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; font-weight: 600;">Office of Academic Affairs & Student Records</p>
    </div>
    <p style="font-size: 14px;">Dear <strong>${stu.full_name}</strong> (Roll Number: <code>${stu.roll_number}</code>, Class: ${cls?.name || 'BS CS'}),</p>
    <p style="font-size: 14px; line-height: 1.5;">This automated communication serves as official notification that your current attendance standing is <strong>${pct}%</strong>, which is below the required <strong>${minThreshold}%</strong> minimum threshold.</p>
    
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-left: 5px solid #dc2626; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin: 0 0 8px 0; color: #991b1b; font-size: 15px; font-weight: 700;">Academic Warning Metrics</h4>
      <p style="margin: 4px 0; font-size: 13px; color: #7f1d1d;">• Total Sessions Evaluated: <strong>${total}</strong></p>
      <p style="margin: 4px 0; font-size: 13px; color: #7f1d1d;">• Sessions Attended: <strong>${attended}</strong></p>
      <p style="margin: 4px 0; font-size: 13px; color: #7f1d1d;">• Current Percentage: <strong>${pct}%</strong> (Required Minimum: ${minThreshold}%)</p>
      <p style="margin: 4px 0; font-size: 13px; color: #7f1d1d;">• Estimated Classes Needed to Reach ${minThreshold}%: <strong>${needed > 0 ? needed : 1} consecutive sessions</strong></p>
    </div>

    ${customNote ? `<div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 6px; font-size: 13px; color: #1e40af; margin-bottom: 20px;"><strong>Note from Administration:</strong> ${customNote}</div>` : ''}

    <p style="font-size: 13px; line-height: 1.5; color: #475569;">
      Students failing to meet the minimum attendance threshold may be restricted from sitting in upcoming mid-term or final examinations. Please contact your department coordinator or submit authorized leave applications immediately if applicable.
    </p>

    <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8;">
      Simulated Email Delivery Service • Sent to ${stu.email} • Alpine Degree College Khanpur, Pakistan
    </div>
  </div>`;

  const newEmail = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    student_id: stu.id,
    recipient_email: stu.email,
    recipient_name: stu.full_name,
    roll_number: stu.roll_number,
    subject,
    body_html,
    attendance_pct: pct,
    trigger_type: triggerType,
    sent_at: new Date().toISOString(),
    status: 'DELIVERED',
  };

  dbEmailLogs.unshift(newEmail);

  // Send corresponding in-app notification
  dbNotifications.unshift({
    id: Date.now() + Math.floor(Math.random() * 1000),
    user_id: stu.user_id,
    title: 'Email Alert Dispatched: Low Attendance Warning',
    message: `An automated warning email was sent to ${stu.email}. Your attendance is ${pct}% (Minimum required: ${minThreshold}%).`,
    type: 'WARNING',
    is_read: false,
    created_at: new Date().toISOString(),
  });

  logActivity(
    currentSessionUser.id,
    currentSessionUser.full_name,
    currentSessionUser.role,
    'EMAIL_ALERT_SENT',
    `Automated email alert dispatched to ${stu.full_name} (${stu.email}) for low attendance (${pct}%)`
  );

  return newEmail;
}

// Helper to log audit activity
function logActivity(userId: number, userName: string, userRole: string, action: string, description: string) {
  dbActivityLogs.unshift({
    id: Date.now(),
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    action,
    description,
    ip_address: '127.0.0.1',
    created_at: new Date().toISOString(),
  });
}

// Current logged in user session helper (Defaults to Admin user 1)
let currentSessionUser = dbUsers[0];

function normalizeUniqueValue(value?: string | number | null): string {
  return String(value ?? '').trim().toLowerCase();
}

function nextRecordId(ids: number[]): number {
  let nextId = Math.max(Date.now(), ...ids.map(id => id + 1));
  while (ids.includes(nextId)) nextId += 1;
  return nextId;
}

function normalizePhoneNumber(value: unknown): string | null {
  let phone = String(value ?? '').trim().replace(/[\s\-().]/g, '');
  if (phone.startsWith('00')) phone = `+${phone.slice(2)}`;
  if (/^0[0-9]{10}$/.test(phone)) phone = `+92${phone.slice(1)}`;
  if (/^92[0-9]{10}$/.test(phone)) phone = `+${phone}`;
  return /^\+[1-9][0-9]{7,14}$/.test(phone) ? phone : null;
}

function getCurrentStudentRecord(actor: AppUser) {
  if (!actor || actor.role !== 'STUDENT') return null;

  return dbStudents.find(s =>
    s.user_id === actor.id ||
    normalizeUniqueValue(s.email) === normalizeUniqueValue(actor.email)
  ) || null;
}

function canManageStudentBiometrics(studentId: number, actor: AppUser) {
  if (!actor) return false;
  if (actor.role === 'ADMIN') return true;
  if (actor.role === 'TEACHER') return teacherCanAccessStudent(actor, studentId);
  if (actor.role === 'STUDENT') {
    const myStudent = getCurrentStudentRecord(actor);
    return !!myStudent && myStudent.id === Number(studentId);
  }
  return false;
}

function getParentRecord(actor: AppUser) {
  if (actor.role !== 'PARENT') return null;
  return dbParents.find(p => p.user_id === actor.id || normalizeUniqueValue(p.email) === normalizeUniqueValue(actor.email)) || null;
}

function getTeacherRecord(actor: AppUser) {
  if (actor.role !== 'TEACHER') return null;
  return dbTeachers.find(t => t.user_id === actor.id || normalizeUniqueValue(t.email) === normalizeUniqueValue(actor.email)) || null;
}

function teacherClassIds(actor: AppUser): number[] {
  const teacher = getTeacherRecord(actor);
  if (!teacher) return [];
  return [...new Set(dbSubjects.filter(s => s.teacher_id === teacher.id).map(s => s.class_id))];
}

function visibleClassIds(actor: AppUser): number[] {
  if (actor.role === 'ADMIN') return dbClasses.map(cls => cls.id);
  if (actor.role === 'TEACHER') return teacherClassIds(actor);
  if (actor.role === 'STUDENT') {
    const self = getCurrentStudentRecord(actor);
    return self ? [self.class_id] : [];
  }
  if (actor.role === 'PARENT') {
    const parent = getParentRecord(actor);
    const childIds = new Set(dbParentStudents.filter(link => link.parent_id === parent?.id).map(link => link.student_id));
    return [...new Set(dbStudents.filter(student => childIds.has(student.id)).map(student => student.class_id))];
  }
  return [];
}

function teacherCanAccessStudent(actor: AppUser, studentId: number): boolean {
  const student = dbStudents.find(s => s.id === Number(studentId));
  return !!student && teacherClassIds(actor).includes(student.class_id);
}

function parentCanAccessStudent(actor: AppUser, studentId: number): boolean {
  const parent = getParentRecord(actor);
  return !!parent && dbParentStudents.some(link => link.parent_id === parent.id && link.student_id === Number(studentId));
}

function canAccessStudent(actor: AppUser, studentId: number): boolean {
  if (actor.role === 'ADMIN') return true;
  if (actor.role === 'STUDENT') return getCurrentStudentRecord(actor)?.id === Number(studentId);
  if (actor.role === 'PARENT') return parentCanAccessStudent(actor, studentId);
  if (actor.role === 'TEACHER') return teacherCanAccessStudent(actor, studentId);
  return false;
}

function accessibleStudents(actor: AppUser) {
  return dbStudents.filter(student => canAccessStudent(actor, student.id));
}

function canAccessInvoice(actor: AppUser, invoice: { student_id: number }): boolean {
  return canAccessStudent(actor, invoice.student_id);
}

function canAccessPayment(actor: AppUser, payment: { student_id: number }): boolean {
  return canAccessStudent(actor, payment.student_id);
}

function setSessionCookie(res: Response, token: string) {
  res.setHeader('Set-Cookie', `attendance_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}

function actorFor(req: Request): AppUser {
  if (!req.authenticatedUser) {
    throw new Error('Authenticated API middleware did not attach a user.');
  }
  return req.authenticatedUser;
}

app.use('/api', (req: Request, res: Response, next) => {
  const isPublicAuthRoute =
    (req.path === '/auth/login' && req.method === 'POST') ||
    (req.path === '/auth/register' && req.method === 'POST') ||
    (req.path === '/auth/me' && req.method === 'GET');
  if (isPublicAuthRoute) return next();

  const cookieHeader = req.headers.cookie || '';
  const token = cookieHeader.match(/(?:^|;\s*)attendance_session=([a-f0-9]+)/)?.[1];
  const session = token ? authSessions.get(token) : undefined;
  const userId = session && session.expiresAt > Date.now() ? session.userId : undefined;
  const user = dbUsers.find(candidate => candidate.id === userId && candidate.status === 'ACTIVE');
  if (!user) return res.status(401).json({ error: 'Authentication required. Please sign in again.' });

  req.authenticatedUser = user;
  next();
});

// ==========================================
// API ROUTES
// ==========================================

// 1. AUTH ROUTES
app.get('/api/auth/me', (req: Request, res: Response) => {
  const token = (req.headers.cookie || '').match(/(?:^|;\s*)attendance_session=([a-f0-9]+)/)?.[1];
  const session = token ? authSessions.get(token) : undefined;
  const userId = session && session.expiresAt > Date.now() ? session.userId : undefined;
  const user = dbUsers.find(candidate => candidate.id === userId && candidate.status === 'ACTIVE');
  res.json({ user: user || null });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const inputStr = normalizeUniqueValue(username);
  const passwordInput = typeof password === 'string' ? password : '';

  if (!inputStr) {
    return res.status(400).json({ error: 'Email, Student ID, Roll Number, or Teacher ID is required' });
  }
  if (!passwordInput) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  // Resolve student identifiers before numeric user IDs so a roll/registration
  // number cannot accidentally select an unrelated account with the same ID.
  const studentMatch = dbStudents.find(s =>
    normalizeUniqueValue(s.email) === inputStr ||
    normalizeUniqueValue(s.roll_number) === inputStr ||
    normalizeUniqueValue(s.student_code) === inputStr ||
    ( /^\d+$/.test(inputStr) && s.id.toString() === inputStr)
  );

  let user: AppUser | undefined;
  if (studentMatch) {
    user = dbUsers.find(candidate =>
      candidate.role === 'STUDENT' &&
      (candidate.id === studentMatch.user_id ||
        normalizeUniqueValue(candidate.email) === normalizeUniqueValue(studentMatch.email))
    );

    // Older institution roster records may predate portal user rows. Reconcile
    // by their verified roster relationship; do not create accounts at login.
    if (!user && studentMatch.user_id) {
      user = dbUsers.find(candidate => candidate.id === studentMatch.user_id && candidate.role === 'STUDENT');
    }
  }

  // Resolve normal usernames/emails, then legacy numeric account IDs.
  if (!user) user = dbUsers.find(candidate =>
    normalizeUniqueValue(candidate.username) === inputStr ||
    normalizeUniqueValue(candidate.email) === inputStr
  );
  if (!user && /^\d+$/.test(inputStr)) {
    user = dbUsers.find(candidate => candidate.id.toString() === inputStr);
  }

  // Existing accounts made through older admin flows sometimes stored the
  // roster record but omitted the linked portal user. Only provision when a
  // roster ID explicitly references a student user ID and a password was set.
  if (!user && studentMatch?.user_id) {
    const rosterUser = dbUsers.find(candidate =>
      candidate.id === studentMatch.user_id &&
      normalizeUniqueValue(candidate.email) === normalizeUniqueValue(studentMatch.email)
    );
    if (rosterUser?.role === 'STUDENT') user = rosterUser;
  }

  // Keep roster-only lookups for teacher and parent records.
  if (!user) {
    const teacherMatch = dbTeachers.find(t =>
      normalizeUniqueValue(t.email) === inputStr ||
      normalizeUniqueValue(t.teacher_code) === inputStr ||
      t.id.toString() === inputStr
    );

    if (teacherMatch) {
      const existingUser = dbUsers.find(u => u.id === teacherMatch.user_id || normalizeUniqueValue(u.email) === normalizeUniqueValue(teacherMatch.email));
      if (existingUser) {
        user = existingUser;
      } else {
        const newUserId = teacherMatch.user_id || 2_000_000_000 + teacherMatch.id;
        user = {
          id: newUserId,
          username: teacherMatch.email ? teacherMatch.email.split('@')[0] : `teacher_${teacherMatch.id}`,
          email: teacherMatch.email ? teacherMatch.email.toLowerCase() : `${teacherMatch.teacher_code.toLowerCase()}@alpine.edu.pk`,
          role: 'TEACHER',
          full_name: teacherMatch.full_name,
          status: 'ACTIVE',
          avatar: teacherMatch.avatar || getGenderSpecificAvatar(teacherMatch.full_name),
        };
        dbUsers.push(user);
        teacherMatch.user_id = newUserId;
        if (!passwordHashes.has(newUserId)) passwordHashes.set(newUserId, hashPassword('password123'));
      }
    }
  }

  // 4. Search in dbParents by email, phone, cnic, or parent ID
  if (!user) {
    const parentMatch = dbParents.find(p =>
      normalizeUniqueValue(p.email) === inputStr ||
      normalizePhoneNumber(p.phone) === normalizePhoneNumber(inputStr) ||
      normalizePhoneNumber(p.whatsapp_number) === normalizePhoneNumber(inputStr) ||
      (p.cnic && p.cnic.replace(/[\s-]/g, '') === inputStr.replace(/[\s-]/g, '')) ||
      p.id.toString() === inputStr
    );

    if (parentMatch) {
      const existingUser = dbUsers.find(u => u.id === parentMatch.user_id || normalizeUniqueValue(u.email) === normalizeUniqueValue(parentMatch.email));
      if (existingUser) {
        user = existingUser;
      } else {
        const newUserId = parentMatch.user_id || 3_000_000_000 + parentMatch.id;
        user = {
          id: newUserId,
          username: parentMatch.email.split('@')[0],
          email: parentMatch.email.toLowerCase(),
          role: 'PARENT',
          full_name: parentMatch.full_name,
          status: 'ACTIVE',
          avatar: parentMatch.avatar || getGenderSpecificAvatar(parentMatch.full_name),
        };
        dbUsers.push(user);
        parentMatch.user_id = newUserId;
        if (!passwordHashes.has(newUserId)) passwordHashes.set(newUserId, hashPassword('password123'));
      }
    }
  }

  if (!user) {
    return res.status(401).json({
      error: 'No account found matching this Email, Roll Number, Teacher ID, or Parent Phone. Please check your credentials.'
    });
  }

  if (user.status !== 'ACTIVE') {
    return res.status(403).json({ error: 'This account is inactive. Contact the institution administrator.' });
  }
  if (!verifyPassword(passwordInput, passwordHashes.get(user.id))) {
    return res.status(401).json({ error: 'Invalid username or password. Use the email or roll/registration number associated with your account.' });
  }

  currentSessionUser = user;
  const token = randomBytes(32).toString('hex');
  authSessions.set(token, { userId: user.id, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
  setSessionCookie(res, token);
  logActivity(user.id, user.full_name, user.role, 'LOGIN', `${user.role} user logged in (${user.email || user.username})`);
  res.json({ user });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { full_name, email, password, role, roll_number, class_id, guardian_phone, relationship, student_roll_number, whatsapp_number, student_identifier } = req.body;

  if (!email || !full_name || !password || String(password).length < 8) {
    return res.status(400).json({ error: 'Full name, email, and a password of at least 8 characters are required.' });
  }
  if (typeof full_name !== 'string' || full_name.trim().length < 2 || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Enter a valid full name and email address.' });
  }
  if (role === 'PARENT') {
    const existingUser = dbUsers.find(u => normalizeUniqueValue(u.email) === normalizeUniqueValue(email));
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }
    const relationshipValue = String(relationship || '');
    const whatsappInput = String(whatsapp_number ?? '').trim().replace(/[\s\-().]/g, '');
    const hasCountryPrefix = whatsappInput.startsWith('+') || whatsappInput.startsWith('00') || whatsappInput.startsWith('92');
    const whatsapp = normalizePhoneNumber(whatsapp_number);
    if (!hasCountryPrefix || !whatsapp || !['Father', 'Mother', 'Guardian'].includes(relationshipValue) || typeof student_identifier !== 'string' || !student_identifier.trim()) {
      return res.status(400).json({ error: 'Provide a valid WhatsApp number with country code, relationship, and Student ID / Registration Number.' });
    }

    const identifier = normalizeUniqueValue(student_identifier);
    const student = dbStudents.find(candidate =>
      normalizeUniqueValue(candidate.student_code) === identifier ||
      normalizeUniqueValue(candidate.roll_number) === identifier
    );
    if (!student || normalizePhoneNumber(student.guardian_phone) !== whatsapp) {
      return res.status(403).json({ error: 'The Student ID / Registration Number and WhatsApp number could not be verified against the registered guardian details. Contact the institution to request verification.' });
    }

    if (dbParentStudents.some(link => link.student_id === student.id && dbParents.some(parent => parent.id === link.parent_id && normalizeUniqueValue(parent.email) === normalizeUniqueValue(email)))) {
      return res.status(409).json({ error: 'This parent account is already linked to the student.' });
    }
    const newUserId = nextRecordId(dbUsers.map(user => user.id));
    const parentId = nextRecordId(dbParents.map(parent => parent.id));
    const avatar = getGenderSpecificAvatar(full_name);
    const newUser: AppUser = {
      id: newUserId,
      username: email.trim().split('@')[0],
      email: email.trim().toLowerCase(),
      full_name: full_name.trim(),
      role: 'PARENT',
      status: 'ACTIVE',
      avatar,
    };
    const newParent = {
      id: parentId,
      user_id: newUserId,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone: whatsapp,
      whatsapp_number: whatsapp,
      cnic: '',
      occupation: '',
      address: '',
      status: 'ACTIVE' as const,
      created_at: new Date().toISOString(),
      avatar,
    };

    dbUsers.push(newUser);
    dbParents.push(newParent);
    dbParentStudents.push({
      id: nextRecordId(dbParentStudents.map(link => link.id)),
      parent_id: parentId,
      student_id: student.id,
      relationship: relationshipValue,
      is_primary: true,
      created_at: new Date().toISOString(),
    });
    passwordHashes.set(newUserId, hashPassword(String(password)));
    persistAuthState();
    const token = randomBytes(32).toString('hex');
    authSessions.set(token, { userId: newUserId, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
    setSessionCookie(res, token);
    logActivity(newUserId, newUser.full_name, newUser.role, 'REGISTER', `Parent account registered and verified for student ${student.student_code}`);
    return res.status(201).json({
      success: true,
      message: 'Parent account created and child verified. Opening your parent portal…',
      user: newUser,
    });
  }

  const newUserId = nextRecordId(dbUsers.map(user => user.id));
  const avatar = getGenderSpecificAvatar(full_name);
  if (role === 'TEACHER' || role === 'ADMIN') {
    return res.status(403).json({ error: 'Privileged accounts and parent-child links must be created or verified by an administrator.' });
  }

  const userRole = 'STUDENT';
  const normalizedEmail = normalizeUniqueValue(email);
  const normalizedRoll = normalizeUniqueValue(roll_number);
  if (!roll_number) {
    return res.status(400).json({ error: 'An institution-issued roll number is required for student registration.' });
  }

  const rosterStudent = dbStudents.find(student =>
    normalizeUniqueValue(student.email) === normalizedEmail &&
    normalizeUniqueValue(student.roll_number) === normalizedRoll
  );
  if (rosterStudent) {
    const submittedGuardianPhone = normalizePhoneNumber(guardian_phone);
    if (!submittedGuardianPhone || !rosterStudent.guardian_phone ||
        submittedGuardianPhone !== normalizePhoneNumber(rosterStudent.guardian_phone)) {
      return res.status(403).json({
        error: 'This student is already in the institution roster. To activate the portal login, enter the registered email, roll number, and guardian WhatsApp number exactly as recorded by the institution.',
      });
    }

    let linkedUser = dbUsers.find(candidate =>
      candidate.role === 'STUDENT' &&
      (candidate.id === rosterStudent.user_id ||
        normalizeUniqueValue(candidate.email) === normalizedEmail)
    );
    if (linkedUser && passwordHashes.has(linkedUser.id)) {
      return res.status(409).json({
        error: 'A portal account already exists for this student. Sign in using the registered email or roll number, or ask an administrator to reset the password.',
      });
    }

    if (!linkedUser) {
      const linkedUserId = nextRecordId(dbUsers.map(candidate => candidate.id));
      linkedUser = {
        id: linkedUserId,
        username: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        full_name: rosterStudent.full_name,
        role: 'STUDENT',
        status: 'ACTIVE',
        avatar: rosterStudent.avatar || getGenderSpecificAvatar(rosterStudent.full_name, rosterStudent.gender),
      };
      dbUsers.push(linkedUser);
    }

    rosterStudent.user_id = linkedUser.id;
    passwordHashes.set(linkedUser.id, hashPassword(String(password)));
    persistAuthState();
    const token = randomBytes(32).toString('hex');
    authSessions.set(token, { userId: linkedUser.id, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
    setSessionCookie(res, token);
    logActivity(linkedUser.id, linkedUser.full_name, linkedUser.role, 'STUDENT_PORTAL_ACTIVATED', `Activated portal credentials for roster student ${rosterStudent.student_code}`);
    return res.status(201).json({
      success: true,
      message: 'Student portal account activated. You can now sign in with your email or roll number.',
      user: linkedUser,
    });
  }

  const existingUser = dbUsers.find(u => normalizeUniqueValue(u.email) === normalizedEmail);
  if (existingUser || dbStudents.some(student =>
    normalizeUniqueValue(student.email) === normalizedEmail ||
    normalizeUniqueValue(student.roll_number) === normalizedRoll ||
    normalizeUniqueValue(student.student_code) === normalizeUniqueValue(roll_number)
  )) {
    return res.status(409).json({ error: 'A student account or roster record already exists with that email or roll number. Verify the registered email, roll number, and guardian phone to activate its portal login.' });
  }

  const newUser = {
    id: newUserId,
    username: email.split('@')[0],
    email: email.toLowerCase(),
    full_name,
    role: userRole as 'TEACHER' | 'STUDENT' | 'PARENT',
    status: 'ACTIVE' as const,
    avatar,
  };
  dbUsers.push(newUser);
  passwordHashes.set(newUserId, hashPassword(String(password)));

  if (userRole === 'STUDENT') {
    const studentId = nextRecordId(dbStudents.map(student => student.id));
    const assignedClassId = Number(class_id) || 1;
    const cls = dbClasses.find(c => c.id === assignedClassId);

    const newStudent = {
      id: studentId,
      user_id: newUserId,
      student_code: `STU-2022-${Math.floor(100 + Math.random() * 899)}`,
      roll_number: roll_number || `CS-2022-${Math.floor(10 + Math.random() * 89)}`,
      full_name,
      email: email.toLowerCase(),
      phone: guardian_phone || '+92 300 0000000',
      guardian_phone: normalizePhoneNumber(guardian_phone),
      gender: 'MALE' as const,
      dob: '2003-01-01',
      department_id: 1,
      program_id: 1,
      class_id: assignedClassId,
      semester: cls?.semester || 6,
      batch: cls?.batch || '2022-2026',
      status: 'ACTIVE' as const,
      avatar,
    };
    dbStudents.push(newStudent);
  }

  persistAuthState();
  currentSessionUser = newUser;
  const token = randomBytes(32).toString('hex');
  authSessions.set(token, { userId: newUserId, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
  setSessionCookie(res, token);
  logActivity(newUserId, full_name, userRole, 'REGISTER', `New ${userRole} account registered`);

  res.json({ success: true, user: newUser });
});

app.post('/api/auth/switch-user', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only administrators may switch demonstration accounts.' });
  }
  const { role } = req.body;
  const targetUser = dbUsers.find(u => u.role === role);
  if (targetUser) {
    currentSessionUser = targetUser;
    const token = randomBytes(32).toString('hex');
    authSessions.set(token, { userId: targetUser.id, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
    setSessionCookie(res, token);
    logActivity(targetUser.id, targetUser.full_name, targetUser.role, 'SWITCH_ROLE', `Switched session to role ${role}`);
    return res.json({ user: currentSessionUser });
  }
  res.status(400).json({ error: 'Role user not found' });
});

app.post('/api/auth/change-password', (req: Request, res: Response) => {
  const actor = actorFor(req);
  const { current_password, new_password } = req.body;
  if (!verifyPassword(String(current_password || ''), passwordHashes.get(actor.id))) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }
  if (typeof new_password !== 'string' || new_password.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }
  passwordHashes.set(actor.id, hashPassword(new_password));
  persistAuthState();
  logActivity(actor.id, actor.full_name, actor.role, 'CHANGE_PASSWORD', 'User updated account password');
  res.json({ success: true, message: 'Password updated successfully' });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = (req.headers.cookie || '').match(/(?:^|;\s*)attendance_session=([a-f0-9]+)/)?.[1];
  if (token) authSessions.delete(token);
  res.setHeader('Set-Cookie', 'attendance_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
  res.json({ success: true });
});

app.post('/api/user/avatar', (req: Request, res: Response) => {
  const actor = actorFor(req);
  const { avatar, phone, address, full_name } = req.body;

  if (avatar) {
    actor.avatar = avatar;
  }
  if (full_name) {
    actor.full_name = full_name;
  }

  const usr = dbUsers.find(u => u.id === actor.id);
  if (usr) {
    if (avatar) usr.avatar = avatar;
    if (full_name) usr.full_name = full_name;
  }

  const std = dbStudents.find(s => s.user_id === actor.id || normalizeUniqueValue(s.email) === normalizeUniqueValue(actor.email));
  if (std) {
    if (avatar) std.avatar = avatar;
    if (phone) std.phone = phone;
    if (full_name) std.full_name = full_name;
  }

  const tch = dbTeachers.find(t => t.user_id === actor.id || normalizeUniqueValue(t.email) === normalizeUniqueValue(actor.email));
  if (tch) {
    if (avatar) tch.avatar = avatar;
    if (phone) tch.phone = phone;
    if (full_name) tch.full_name = full_name;
  }

  logActivity(actor.id, actor.full_name, actor.role, 'UPDATE_PROFILE', 'Updated user profile picture and account details');

  res.json({ success: true, user: actor });
});

// 2. SETTINGS
app.get('/api/settings', (req: Request, res: Response) => {
  const actor = actorFor(req);
  if (actor.role === 'ADMIN') return res.json(dbSettings);
  res.json({
    institution_name: dbSettings.institution_name,
    min_attendance_percentage: dbSettings.min_attendance_percentage,
    academic_session: dbSettings.academic_session,
  });
});

app.put('/api/settings', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required.' });
  dbSettings = { ...dbSettings, ...req.body };
  logActivity(currentSessionUser.id, currentSessionUser.full_name, currentSessionUser.role, 'SETTINGS_UPDATED', 'Updated system attendance settings');
  res.json({ success: true, settings: dbSettings });
});

// 3. DEPARTMENTS & PROGRAMS
app.get('/api/departments', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required.' });
  const result = dbDepartments.map(d => ({
    ...d,
    student_count: dbStudents.filter(s => s.department_id === d.id).length,
    teacher_count: dbTeachers.filter(t => t.department_id === d.id).length,
  }));
  res.json(result);
});

app.post('/api/departments', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required.' });
  const newDept = { id: Date.now(), ...req.body };
  dbDepartments.push(newDept);
  logActivity(currentSessionUser.id, currentSessionUser.full_name, currentSessionUser.role, 'DEPARTMENT_CREATED', `Created department ${newDept.name}`);
  res.json(newDept);
});

app.get('/api/programs', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required.' });
  const result = dbPrograms.map(p => {
    const dept = dbDepartments.find(d => d.id === p.department_id);
    return { ...p, department_name: dept ? dept.name : 'Unknown' };
  });
  res.json(result);
});

app.post('/api/programs', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required.' });
  const newProg = { id: Date.now(), ...req.body };
  dbPrograms.push(newProg);
  logActivity(currentSessionUser.id, currentSessionUser.full_name, currentSessionUser.role, 'PROGRAM_CREATED', `Created program ${newProg.name}`);
  res.json(newProg);
});

// 4. CLASSES & SECTIONS
app.get('/api/classes', (req: Request, res: Response) => {
  const actor = actorFor(req);
  const classIds = new Set(visibleClassIds(actor));
  const result = dbClasses.filter(c => classIds.has(c.id)).map(c => {
    const prog = dbPrograms.find(p => p.id === c.program_id);
    return {
      ...c,
      program_name: prog ? prog.name : '',
      ...(actor.role === 'STUDENT' || actor.role === 'PARENT'
        ? {}
        : { student_count: dbStudents.filter(s => s.class_id === c.id).length }),
    };
  });
  res.json(result);
});

app.post('/api/classes', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required.' });
  const newClass = { id: Date.now(), ...req.body };
  dbClasses.push(newClass);
  logActivity(currentSessionUser.id, currentSessionUser.full_name, currentSessionUser.role, 'CLASS_CREATED', `Created class section ${newClass.name}`);
  res.json(newClass);
});

// 5. SUBJECTS
app.get('/api/subjects', (req: Request, res: Response) => {
  const actor = actorFor(req);
  const visibleClasses = new Set(visibleClassIds(actor));
  const result = dbSubjects.filter(sub =>
    visibleClasses.has(sub.class_id) && (actor.role !== 'TEACHER' || sub.teacher_id === getTeacherRecord(actor)?.id)
  ).map(sub => {
    const dept = dbDepartments.find(d => d.id === sub.department_id);
    const cls = dbClasses.find(c => c.id === sub.class_id);
    const tch = dbTeachers.find(t => t.id === sub.teacher_id);
    return {
      ...sub,
      department_name: dept?.name,
      class_name: cls?.name,
      teacher_name: tch?.full_name,
    };
  });
  res.json(result);
});

app.post('/api/subjects', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required.' });
  const newSub = { id: Date.now(), ...req.body };
  dbSubjects.push(newSub);
  logActivity(currentSessionUser.id, currentSessionUser.full_name, currentSessionUser.role, 'SUBJECT_CREATED', `Created subject ${newSub.name}`);
  res.json(newSub);
});

// 6. TEACHERS
app.get('/api/teachers', (req: Request, res: Response) => {
  const actor = actorFor(req);
  const visibleTeachers = actor.role === 'ADMIN'
    ? dbTeachers
    : actor.role === 'TEACHER'
      ? dbTeachers.filter(t => t.user_id === actor.id)
      : [];
  const result = visibleTeachers.map(t => {
    const dept = dbDepartments.find(d => d.id === t.department_id);
    const assignedSubs = dbSubjects.filter(s => s.teacher_id === t.id);
    return {
      ...t,
      department_name: dept?.name,
      assigned_subjects_count: assignedSubs.length,
    };
  });
  res.json(result);
});

function getGenderSpecificAvatar(fullName: string, gender?: string): string {
  const nameLower = fullName.toLowerCase();
  
  const isFemale = gender === 'FEMALE' || 
    nameLower.includes('aisha') || 
    nameLower.includes('fatima') || 
    nameLower.includes('ayesha') || 
    nameLower.includes('zainab') || 
    nameLower.includes('zoya') || 
    nameLower.includes('maria') || 
    nameLower.includes('sara') || 
    nameLower.includes('sana') || 
    nameLower.includes('maryam') || 
    nameLower.includes('sadia') || 
    nameLower.includes('bushra') || 
    nameLower.includes('mrs.') || 
    nameLower.includes('ms.') || 
    nameLower.includes('miss');

  const femalePhotos = [
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200'
  ];

  const malePhotos = [
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'
  ];

  const photos = isFemale ? femalePhotos : malePhotos;
  let hash = 0;
  for (let i = 0; i < fullName.length; i++) {
    hash = (hash << 5) - hash + fullName.charCodeAt(i);
  }
  const index = Math.abs(hash) % photos.length;
  return photos[index];
}

app.post('/api/teachers', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required.' });
  const { full_name, email, password, phone, department_id, designation, teacher_code, gender } = req.body;
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'A teacher account password of at least 8 characters is required.' });
  }
  if (dbTeachers.some(t => t.email === email || t.teacher_code === teacher_code)) {
    return res.status(400).json({ error: 'Duplicate Teacher ID or Email address' });
  }
  const userId = nextRecordId(dbUsers.map(user => user.id));
  const avatar = req.body.avatar || getGenderSpecificAvatar(full_name, gender);
  const newTeacher = {
    id: nextRecordId(dbTeachers.map(teacher => teacher.id)),
    user_id: userId,
    teacher_code: teacher_code || `TCH-${Math.floor(1000 + Math.random() * 9000)}`,
    full_name,
    email,
    phone,
    department_id: Number(department_id),
    designation: designation || 'Lecturer',
    status: 'ACTIVE' as const,
    avatar,
  };
  dbTeachers.push(newTeacher);
  dbUsers.push({
    id: userId,
    username: email.split('@')[0],
    email,
    role: 'TEACHER',
    full_name,
    status: 'ACTIVE',
    avatar: newTeacher.avatar,
  });
  passwordHashes.set(userId, hashPassword(password));
  persistAuthState();
  logActivity(currentSessionUser.id, currentSessionUser.full_name, currentSessionUser.role, 'TEACHER_CREATED', `Added teacher ${full_name}`);
  res.json(newTeacher);
});

app.put('/api/teachers/:id', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required.' });
  const id = Number(req.params.id);
  const idx = dbTeachers.findIndex(t => t.id === id);
  if (idx !== -1) {
    const updatedName = req.body.full_name || dbTeachers[idx].full_name;
    const updatedEmail = req.body.email || dbTeachers[idx].email;
    const updatedGender = req.body.gender;
    const avatar = req.body.avatar || getGenderSpecificAvatar(updatedName, updatedGender);
    const oldEmail = dbTeachers[idx].email;
    
    dbTeachers[idx] = { ...dbTeachers[idx], ...req.body, avatar };

    // Sync with dbUsers
    const uIdx = dbUsers.findIndex(u => u.id === dbTeachers[idx].user_id || u.email.toLowerCase() === oldEmail.toLowerCase());
    if (uIdx !== -1) {
      dbUsers[uIdx].email = updatedEmail.toLowerCase();
      dbUsers[uIdx].full_name = updatedName;
      dbUsers[uIdx].username = updatedEmail.split('@')[0];
      dbUsers[uIdx].avatar = avatar;
    }

    logActivity(currentSessionUser.id, currentSessionUser.full_name, currentSessionUser.role, 'TEACHER_UPDATED', `Updated teacher ${dbTeachers[idx].full_name}`);
    return res.json(dbTeachers[idx]);
  }
  res.status(404).json({ error: 'Teacher not found' });
});

// 7. STUDENTS
app.get('/api/students', (req: Request, res: Response) => {
  const actor = actorFor(req);
  const { department_id, program_id, class_id, semester, search } = req.query;

  let filtered = [...dbStudents];
  if (actor.role === 'STUDENT') {
    const self = getCurrentStudentRecord(actor);
    filtered = self ? filtered.filter(s => s.id === self.id) : [];
  } else if (actor.role === 'PARENT') {
    const parent = getParentRecord(actor);
    const linkedIds = new Set(dbParentStudents.filter(link => link.parent_id === parent?.id).map(link => link.student_id));
    filtered = filtered.filter(s => linkedIds.has(s.id));
  } else if (actor.role === 'TEACHER') {
    const allowedClasses = new Set(teacherClassIds(actor));
    filtered = filtered.filter(s => allowedClasses.has(s.class_id));
  } else if (actor.role !== 'ADMIN') {
    filtered = [];
  }

  if (department_id) filtered = filtered.filter(s => s.department_id === Number(department_id));
  if (program_id) filtered = filtered.filter(s => s.program_id === Number(program_id));
  if (class_id) filtered = filtered.filter(s => s.class_id === Number(class_id));
  if (semester) filtered = filtered.filter(s => s.semester === Number(semester));
  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(s => s.full_name.toLowerCase().includes(q) || s.roll_number.toLowerCase().includes(q) || s.student_code.toLowerCase().includes(q));
  }

  const result = filtered.map(s => {
    const dept = dbDepartments.find(d => d.id === s.department_id);
    const prog = dbPrograms.find(p => p.id === s.program_id);
    const cls = dbClasses.find(c => c.id === s.class_id);

    // Calculate student overall attendance
    const studentRecords = dbAttendance.filter(a => a.student_id === s.id);
    const total = studentRecords.length;
    const present = studentRecords.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const pct = total > 0 ? Math.round((present / total) * 100) : 100;

    const faceData = dbFaceEmbeddings.find(f => f.student_id === s.id);

    return {
      ...s,
      guardian_phone: actor.role === 'ADMIN' ? s.guardian_phone : undefined,
      department_name: dept?.name,
      program_name: prog?.name,
      class_name: cls?.name,
      overall_attendance_pct: pct,
      is_face_enrolled: !!faceData,
      face_sample_count: faceData?.sample_count || 0,
    };
  });

  res.json(result);
});

app.post('/api/students', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required to create student records.' });
  const { full_name, email, password, roll_number, student_code, phone, guardian_phone, gender, dob, department_id, program_id, class_id, semester, batch } = req.body;

  if (!full_name || !email || !roll_number || !student_code) {
    return res.status(400).json({ error: 'Full name, email, roll number, and student code are required.' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'A student account password of at least 8 characters is required.' });
  }

  const normalizedEmail = normalizeUniqueValue(email);
  const normalizedRoll = normalizeUniqueValue(roll_number);
  const normalizedStudentCode = normalizeUniqueValue(student_code);

  if (dbStudents.some(s =>
    normalizeUniqueValue(s.email) === normalizedEmail ||
    normalizeUniqueValue(s.roll_number) === normalizedRoll ||
    normalizeUniqueValue(s.student_code) === normalizedStudentCode
  )) {
    return res.status(400).json({ error: 'Duplicate Student ID, Roll Number, or Email address!' });
  }

  const userId = nextRecordId(dbUsers.map(user => user.id));
  const studentGender = gender || 'MALE';
  const avatar = req.body.avatar || getGenderSpecificAvatar(full_name, studentGender);
  const newStudent = {
    id: nextRecordId(dbStudents.map(student => student.id)),
    user_id: userId,
    student_code: student_code || `STU-2025-${Math.floor(100 + Math.random() * 900)}`,
    roll_number: String(roll_number).trim(),
    full_name: String(full_name).trim(),
    email: String(email).trim(),
    phone,
    guardian_phone: normalizePhoneNumber(guardian_phone),
    gender: studentGender,
    dob: dob || '2003-01-01',
    department_id: Number(department_id),
    program_id: Number(program_id),
    class_id: Number(class_id),
    semester: Number(semester) || 1,
    batch: batch || '2025-2029',
    status: 'ACTIVE' as const,
    avatar,
  };

  dbStudents.push(newStudent);
  dbUsers.push({
    id: userId,
    username: email.split('@')[0],
    email,
    role: 'STUDENT',
    full_name,
    status: 'ACTIVE',
    avatar: newStudent.avatar,
  });
  passwordHashes.set(userId, hashPassword(password));

  persistAuthState();
  logActivity(currentSessionUser.id, currentSessionUser.full_name, currentSessionUser.role, 'STUDENT_CREATED', `Enrolled student ${full_name} (${roll_number})`);
  res.json({ ...newStudent, is_face_enrolled: dbFaceEmbeddings.some(f => f.student_id === newStudent.id) });
});

app.put('/api/students/:id', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required to update student records.' });
  const id = Number(req.params.id);
  const idx = dbStudents.findIndex(s => s.id === id);
  if (idx !== -1) {
    if (req.body.password !== undefined &&
        (typeof req.body.password !== 'string' || req.body.password.length < 8)) {
      return res.status(400).json({ error: 'Portal password must be at least 8 characters long.' });
    }
    const updatedGender = req.body.gender || dbStudents[idx].gender;
    const updatedName = req.body.full_name || dbStudents[idx].full_name;
    const updatedEmail = req.body.email || dbStudents[idx].email;
    const updatedRollNumber = req.body.roll_number || dbStudents[idx].roll_number;
    const updatedStudentCode = req.body.student_code || dbStudents[idx].student_code;
    const avatar = req.body.avatar || getGenderSpecificAvatar(updatedName, updatedGender);
    const oldEmail = dbStudents[idx].email;

    const duplicate = dbStudents.some(s => s.id !== id && (
      normalizeUniqueValue(s.email) === normalizeUniqueValue(updatedEmail) ||
      normalizeUniqueValue(s.roll_number) === normalizeUniqueValue(updatedRollNumber) ||
      normalizeUniqueValue(s.student_code) === normalizeUniqueValue(updatedStudentCode)
    ));

    if (duplicate) {
      return res.status(400).json({ error: 'A student with the same email, roll number, or student code already exists.' });
    }

    dbStudents[idx] = { ...dbStudents[idx], ...req.body, avatar, full_name: String(updatedName).trim(), email: String(updatedEmail).trim(), roll_number: String(updatedRollNumber).trim(), student_code: String(updatedStudentCode).trim() };

    // Sync with dbUsers
    const uIdx = dbUsers.findIndex(u =>
      u.role === 'STUDENT' &&
      (u.id === dbStudents[idx].user_id || normalizeUniqueValue(u.email) === normalizeUniqueValue(oldEmail))
    );
    if (uIdx !== -1) {
      dbUsers[uIdx].email = updatedEmail.toLowerCase();
      dbUsers[uIdx].full_name = updatedName;
      dbUsers[uIdx].username = updatedEmail.split('@')[0];
      dbUsers[uIdx].avatar = avatar;
    }

    const submittedPassword = req.body.password;
    if (submittedPassword !== undefined) {
      let studentUser = dbUsers.find(user =>
        user.role === 'STUDENT' &&
        (user.id === dbStudents[idx].user_id || normalizeUniqueValue(user.email) === normalizeUniqueValue(dbStudents[idx].email))
      );
      if (!studentUser) {
        const userId = nextRecordId(dbUsers.map(user => user.id));
        studentUser = {
          id: userId,
          username: dbStudents[idx].email.split('@')[0],
          email: dbStudents[idx].email.toLowerCase(),
          role: 'STUDENT',
          full_name: dbStudents[idx].full_name,
          status: 'ACTIVE',
          avatar: dbStudents[idx].avatar,
        };
        dbUsers.push(studentUser);
        dbStudents[idx].user_id = userId;
      }
      studentUser.status = 'ACTIVE';
      passwordHashes.set(studentUser.id, hashPassword(submittedPassword));
      persistAuthState();
      logActivity(
        currentSessionUser.id,
        currentSessionUser.full_name,
        currentSessionUser.role,
        'STUDENT_PORTAL_PASSWORD_RESET',
        `Reset portal login credentials for student ${dbStudents[idx].full_name} (${dbStudents[idx].roll_number}).`,
      );
    } else {
      persistAuthState();
      logActivity(currentSessionUser.id, currentSessionUser.full_name, currentSessionUser.role, 'STUDENT_UPDATED', `Updated student ${dbStudents[idx].full_name}`);
    }
    return res.json(dbStudents[idx]);
  }
  res.status(404).json({ error: 'Student not found' });
});

app.delete('/api/students/:id', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required to delete student records.' });
  const id = Number(req.params.id);
  const student = dbStudents.find(s => s.id === id);
  if (student) {
    dbStudents = dbStudents.filter(s => s.id !== id);
    logActivity(currentSessionUser.id, currentSessionUser.full_name, currentSessionUser.role, 'STUDENT_DELETED', `Deleted student ${student.full_name}`);
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Student not found' });
});

// 8. TIMETABLE
app.get('/api/timetable', (req: Request, res: Response) => {
  const actor = actorFor(req);
  const { class_id, teacher_id } = req.query;
  const classIds = new Set(visibleClassIds(actor));
  let filtered = dbTimetable.filter(slot =>
    classIds.has(slot.class_id) && (actor.role !== 'TEACHER' || slot.teacher_id === getTeacherRecord(actor)?.id)
  );
  if (class_id) filtered = filtered.filter(t => t.class_id === Number(class_id));
  if (teacher_id) filtered = filtered.filter(t => t.teacher_id === Number(teacher_id));

  const result = filtered.map(slot => {
    const cls = dbClasses.find(c => c.id === slot.class_id);
    const sub = dbSubjects.find(s => s.id === slot.subject_id);
    const tch = dbTeachers.find(t => t.id === slot.teacher_id);
    return {
      ...slot,
      class_name: cls?.name,
      subject_name: sub?.name,
      subject_code: sub?.code,
      teacher_name: tch?.full_name,
    };
  });
  res.json(result);
});

app.post('/api/timetable', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required.' });
  const { class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room_number } = req.body;

  // Conflict detection
  const conflict = dbTimetable.find(t => 
    t.day_of_week === day_of_week &&
    t.room_number.toLowerCase() === room_number.toLowerCase() &&
    t.start_time === start_time
  );

  if (conflict) {
    return res.status(400).json({ error: `Room ${room_number} is already booked on ${day_of_week} at ${start_time}!` });
  }

  const newSlot = {
    id: Date.now(),
    class_id: Number(class_id),
    subject_id: Number(subject_id),
    teacher_id: Number(teacher_id),
    day_of_week,
    start_time,
    end_time,
    room_number,
  };
  dbTimetable.push(newSlot);
  logActivity(currentSessionUser.id, currentSessionUser.full_name, currentSessionUser.role, 'TIMETABLE_CREATED', `Added timetable slot for class ${class_id}`);
  res.json(newSlot);
});

// 9. ATTENDANCE MODULE
app.get('/api/attendance', (req: Request, res: Response) => {
  const actor = actorFor(req);
  const { class_id, subject_id, date, student_id } = req.query;
  let filtered = [...dbAttendance];

  if (actor.role === 'STUDENT') {
    const self = getCurrentStudentRecord(actor);
    filtered = self ? filtered.filter(a => a.student_id === self.id) : [];
  } else if (actor.role === 'PARENT') {
    const parent = getParentRecord(actor);
    const linkedIds = new Set(dbParentStudents.filter(link => link.parent_id === parent?.id).map(link => link.student_id));
    filtered = filtered.filter(a => linkedIds.has(a.student_id));
  } else if (actor.role === 'TEACHER') {
    const teacher = getTeacherRecord(actor);
    const assignments = dbSubjects.filter(s => s.teacher_id === teacher?.id);
    const subjectIds = new Set(assignments.map(s => s.id));
    const classIds = new Set(assignments.map(s => s.class_id));
    filtered = filtered.filter(a => classIds.has(a.class_id) &&
      (a.subject_id !== null && subjectIds.has(a.subject_id) || a.method === 'CAMERA_CHECK_IN'));
  } else if (actor.role !== 'ADMIN') {
    filtered = [];
  }

  if (class_id) filtered = filtered.filter(a => a.class_id === Number(class_id));
  if (subject_id) filtered = filtered.filter(a => a.subject_id === Number(subject_id));
  if (date) filtered = filtered.filter(a => a.date === String(date));
  if (student_id) filtered = filtered.filter(a => a.student_id === Number(student_id));

  const result = filtered.map(a => {
    const stu = dbStudents.find(s => s.id === a.student_id);
    const sub = dbSubjects.find(s => s.id === a.subject_id);
    const cls = dbClasses.find(c => c.id === a.class_id);
    const tch = dbTeachers.find(t => t.id === a.teacher_id);
    return {
      ...a,
      student_name: stu?.full_name,
      roll_number: stu?.roll_number,
      subject_name: sub?.name || (a.method === 'CAMERA_CHECK_IN' ? 'College Attendance' : undefined),
      class_name: cls?.name,
      teacher_name: tch?.full_name || (a.method === 'CAMERA_CHECK_IN' ? 'Student self check-in' : undefined),
    };
  });

  res.json(result);
});

app.post('/api/attendance/mark', (req: Request, res: Response) => {
  const actor = actorFor(req);
  if (actor.role !== 'ADMIN' && actor.role !== 'TEACHER') {
    return res.status(403).json({ error: 'Only an administrator or assigned teacher may mark attendance.' });
  }
  const { class_id, subject_id, teacher_id, date, records } = req.body;

  if (!class_id || !subject_id || !records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Missing required parameters for attendance marking' });
  }
  const cls = dbClasses.find(c => c.id === Number(class_id));
  const sub = dbSubjects.find(s => s.id === Number(subject_id) && s.class_id === Number(class_id));
  const teacher = actor.role === 'TEACHER' ? getTeacherRecord(actor) : null;
  if (!cls || !sub || (teacher && sub.teacher_id !== teacher.id)) {
    return res.status(403).json({ error: 'You are not assigned to this class and subject.' });
  }
  if (records.some((record: { student_id: number }) =>
    !dbStudents.some(student => student.id === Number(record.student_id) && student.class_id === Number(class_id))
  )) {
    return res.status(400).json({ error: 'Attendance contains a student outside the selected class.' });
  }

  const attendanceDate = date || new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().slice(0, 5);

  let updatedCount = 0;
  let createdCount = 0;

  records.forEach((rec: { student_id: number; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'; remarks?: string }) => {
    const existingIndex = dbAttendance.findIndex(
      a => a.student_id === rec.student_id && a.subject_id === Number(subject_id) && a.class_id === Number(class_id) && a.date === attendanceDate
    );

    if (existingIndex !== -1) {
      dbAttendance[existingIndex] = {
        ...dbAttendance[existingIndex],
        status: rec.status,
        remarks: rec.remarks || '',
        time: currentTime,
      };
      updatedCount++;
    } else {
      dbAttendance.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        student_id: Number(rec.student_id),
        teacher_id: teacher?.id || Number(teacher_id) || 1,
        class_id: Number(class_id),
        subject_id: Number(subject_id),
        date: attendanceDate,
        time: currentTime,
        status: rec.status,
        remarks: rec.remarks || '',
      });
      createdCount++;
    }

    // Trigger notification and automated email alert if student is absent or below threshold
    const stu = dbStudents.find(s => s.id === Number(rec.student_id));
    const subjectName = dbSubjects.find(s => s.id === Number(subject_id))?.name || 'Class';
    if (stu) {
      if (rec.status === 'ABSENT') {
        // Notify the student
        dbNotifications.unshift({
          id: Date.now() + Math.floor(Math.random() * 1000),
          user_id: stu.user_id,
          title: 'Class Absence Recorded',
          message: `You were marked ABSENT for ${subjectName} on ${attendanceDate}.`,
          type: 'WARNING',
          is_read: false,
          created_at: new Date().toISOString(),
        });

        // Also notify linked parents about the absence
        const parentLinks = dbParentStudents.filter(ps => ps.student_id === stu.id);
        for (const pl of parentLinks) {
          const parentRecord = dbParents.find(p => p.id === pl.parent_id);
          if (parentRecord && parentRecord.user_id) {
            dbNotifications.unshift({
              id: Date.now() + Math.floor(Math.random() * 1000),
              user_id: parentRecord.user_id,
              title: `Attendance Alert: ${stu.full_name} Was Absent`,
              message: `Your child ${stu.full_name} (${stu.roll_number}) was marked ABSENT for ${subjectName} on ${attendanceDate}. Please ensure regular attendance.`,
              type: 'WARNING',
              is_read: false,
              created_at: new Date().toISOString(),
            });
          }
        }
      }

      // Check cumulative attendance after this record
      const stuRecs = dbAttendance.filter(a => a.student_id === Number(rec.student_id));
      const totalSess = stuRecs.length;
      const attendedSess = stuRecs.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
      const currentPct = totalSess > 0 ? Math.round((attendedSess / totalSess) * 100) : 100;
      if (currentPct < dbSettings.min_attendance_percentage && (rec.status === 'ABSENT' || rec.status === 'LATE')) {
        sendSimulatedEmailAlert(stu.id, 'ATTENDANCE_UPDATE');

        // Low-attendance parent alert
        const parentLinks = dbParentStudents.filter(ps => ps.student_id === stu.id);
        for (const pl of parentLinks) {
          const parentRecord = dbParents.find(p => p.id === pl.parent_id);
          if (parentRecord && parentRecord.user_id) {
            dbNotifications.unshift({
              id: Date.now() + Math.floor(Math.random() * 1000),
              user_id: parentRecord.user_id,
              title: `Low Attendance Warning: ${stu.full_name}`,
              message: `${stu.full_name} (${stu.roll_number}) attendance has dropped to ${currentPct}%, below the required ${dbSettings.min_attendance_percentage}%. Immediate attention required.`,
              type: 'WARNING',
              is_read: false,
              created_at: new Date().toISOString(),
            });
          }
        }
      }
    }
  });

  logActivity(
    currentSessionUser.id,
    currentSessionUser.full_name,
    currentSessionUser.role,
    'ATTENDANCE_MARKED',
    `Marked attendance for Class ${class_id}, Subject ${subject_id} on ${attendanceDate} (${records.length} students)`
  );

  res.json({ success: true, created: createdCount, updated: updatedCount, message: 'Attendance saved successfully' });
});

// 10. ATTENDANCE ANALYTICS & LOW ATTENDANCE
app.get('/api/attendance/analytics', (req: Request, res: Response) => {
  const actor = actorFor(req);
  if (!['ADMIN', 'TEACHER'].includes(actor.role)) return res.status(403).json({ error: 'Attendance analytics access denied.' });
  const allowedClasses = new Set(visibleClassIds(actor));
  const visibleStudents = dbStudents.filter(student => allowedClasses.has(student.class_id));
  const visibleSubjects = dbSubjects.filter(subject => allowedClasses.has(subject.class_id) && (actor.role !== 'TEACHER' || subject.teacher_id === getTeacherRecord(actor)?.id));
  const visibleStudentIds = new Set(visibleStudents.map(student => student.id));
  const visibleSubjectIds = new Set(visibleSubjects.map(subject => subject.id));
  const totalStudents = visibleStudents.length;
  const totalTeachers = actor.role === 'ADMIN' ? dbTeachers.length : 1;
  const totalClasses = allowedClasses.size;
  const totalSubjects = visibleSubjects.length;

  const today = new Date().toISOString().split('T')[0];
  const todayRecords = dbAttendance.filter(a =>
    visibleStudentIds.has(a.student_id) &&
    ((a.subject_id !== null && visibleSubjectIds.has(a.subject_id)) ||
      (a.method === 'CAMERA_CHECK_IN' && allowedClasses.has(a.class_id))) &&
    (a.date === today || a.date === '2026-08-05')
  );

  const presentToday = todayRecords.filter(a => a.status === 'PRESENT').length;
  const lateToday = todayRecords.filter(a => a.status === 'LATE').length;
  const absentToday = todayRecords.filter(a => a.status === 'ABSENT').length;
  const todayTotal = todayRecords.length;

  const todayAttendancePct = todayTotal > 0 ? Math.round(((presentToday + lateToday) / todayTotal) * 100) : 88;

  const pendingLeaves = dbLeaveRequests.filter(l => l.status === 'PENDING').length;

  // Calculate low attendance students (< threshold)
  const threshold = dbSettings.min_attendance_percentage;
  const lowAttendanceList: any[] = [];

  dbStudents.filter(student => actor.role === 'ADMIN' || teacherClassIds(actor).includes(student.class_id)).forEach(stu => {
    const stuRecords = dbAttendance.filter(a => a.student_id === stu.id);
    const total = stuRecords.length;
    if (total > 0) {
      const attended = stuRecords.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
      const pct = Math.round((attended / total) * 100);
      if (pct < threshold) {
        const cls = dbClasses.find(c => c.id === stu.class_id);
        const needed = Math.ceil((threshold * total - 100 * attended) / (100 - threshold));
        lowAttendanceList.push({
          student_id: stu.id,
          student_name: stu.full_name,
          roll_number: stu.roll_number,
          class_name: cls?.name,
          total_classes: total,
          attended_classes: attended,
          attendance_pct: pct,
          needed_to_reach_target: needed > 0 ? needed : 1,
        });
      }
    }
  });

  res.json({
    summary: {
      total_students: totalStudents,
      total_teachers: totalTeachers,
      total_classes: totalClasses,
      total_subjects: totalSubjects,
      today_attendance_pct: todayAttendancePct,
      present_today: presentToday || 2,
      absent_today: absentToday || 1,
      late_today: lateToday || 1,
      pending_leave_requests: pendingLeaves,
      low_attendance_students_count: lowAttendanceList.length,
    },
    low_attendance_list: lowAttendanceList,
    weekly_trend: [
      { day: 'Mon', attendance_pct: 92 },
      { day: 'Tue', attendance_pct: 88 },
      { day: 'Wed', attendance_pct: 79 },
      { day: 'Thu', attendance_pct: 94 },
      { day: 'Fri', attendance_pct: 85 },
    ],
    subject_breakdown: visibleSubjects.map(sub => {
      const recs = dbAttendance.filter(a => a.subject_id === sub.id);
      const tot = recs.length;
      const att = recs.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
      return {
        subject_name: sub.name,
        code: sub.code,
        attendance_pct: tot > 0 ? Math.round((att / tot) * 100) : 85,
        total_sessions: tot || 10,
      };
    }),
  });
});

// 11. ATTENDANCE CALCULATOR / PREDICTION
app.post('/api/attendance/calculator', (req: Request, res: Response) => {
  const { current_attended, total_classes, target_percentage = dbSettings.min_attendance_percentage } = req.body;

  const attended = Number(current_attended) || 0;
  const total = Number(total_classes) || 1;
  const target = Number(target_percentage) || 75;

  const currentPct = Math.round((attended / total) * 100);

  let neededClasses = 0;
  let missableClasses = 0;

  if (currentPct < target) {
    // Formula: (attended + x) / (total + x) >= target/100  =>  x >= (target*total - 100*attended)/(100 - target)
    neededClasses = Math.ceil((target * total - 100 * attended) / (100 - target));
    if (neededClasses < 0) neededClasses = 0;
  } else {
    // Formula: attended / (total + y) >= target/100  =>  y <= (100*attended - target*total)/target
    missableClasses = Math.floor((100 * attended - target * total) / target);
    if (missableClasses < 0) missableClasses = 0;
  }

  res.json({
    current_attended: attended,
    total_classes: total,
    current_percentage: currentPct,
    target_percentage: target,
    needed_classes_to_reach_target: neededClasses,
    missable_classes_without_dropping: missableClasses,
    status: currentPct >= target ? 'ON_TRACK' : 'AT_RISK',
  });
});

// 12. LEAVE REQUESTS
app.get('/api/leave-requests', (req: Request, res: Response) => {
  const actor = actorFor(req);
  const { student_id, status } = req.query;
  let filtered = [...dbLeaveRequests];
  if (actor.role === 'STUDENT') {
    const self = getCurrentStudentRecord(actor);
    filtered = self ? filtered.filter(leave => leave.student_id === self.id) : [];
  } else if (actor.role === 'PARENT') {
    const parent = getParentRecord(actor);
    const ids = new Set(dbParentStudents.filter(link => link.parent_id === parent?.id).map(link => link.student_id));
    filtered = filtered.filter(leave => ids.has(leave.student_id));
  } else if (actor.role === 'TEACHER') {
    const ids = new Set(dbStudents.filter(student => teacherClassIds(actor).includes(student.class_id)).map(student => student.id));
    filtered = filtered.filter(leave => ids.has(leave.student_id));
  } else if (actor.role !== 'ADMIN') {
    filtered = [];
  }
  if (student_id) filtered = filtered.filter(l => l.student_id === Number(student_id));
  if (status) filtered = filtered.filter(l => l.status === String(status));

  const result = filtered.map(l => {
    const stu = dbStudents.find(s => s.id === l.student_id);
    const cls = dbClasses.find(c => c.id === stu?.class_id);
    return {
      ...l,
      student_name: stu?.full_name,
      roll_number: stu?.roll_number,
      class_name: cls?.name,
    };
  });
  res.json(result);
});

app.post('/api/leave-requests', (req: Request, res: Response) => {
  const actor = actorFor(req);
  const { student_id, from_date, to_date, reason, attachment_url, attachment_name, attachment_size } = req.body;
  const studentId = actor.role === 'STUDENT' ? getCurrentStudentRecord(actor)?.id : Number(student_id);
  if (actor.role !== 'STUDENT' || !studentId || Number(student_id) !== studentId) {
    return res.status(403).json({ error: 'Only students may submit a leave request for their own account.' });
  }
  const newLeave = {
    id: Date.now(),
    student_id: Number(student_id) || 3,
    from_date,
    to_date,
    reason,
    attachment_url: attachment_url || 'submitted_document.pdf',
    attachment_name: attachment_name || 'medical_leave_document.pdf',
    attachment_size: attachment_size || '180 KB',
    status: 'PENDING' as const,
    teacher_remarks: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: new Date().toISOString(),
  };
  dbLeaveRequests.unshift(newLeave);
  logActivity(currentSessionUser.id, currentSessionUser.full_name, currentSessionUser.role, 'LEAVE_SUBMITTED', `Leave request submitted by student ${student_id}`);
  res.json(newLeave);
});

app.put('/api/leave-requests/:id', (req: Request, res: Response) => {
  const actor = actorFor(req);
  const id = Number(req.params.id);
  const { status, teacher_remarks } = req.body;
  const idx = dbLeaveRequests.findIndex(l => l.id === id);

  if (idx !== -1) {
    const leaveStudent = dbStudents.find(student => student.id === dbLeaveRequests[idx].student_id);
    if (actor.role !== 'ADMIN' && !(actor.role === 'TEACHER' && leaveStudent && teacherClassIds(actor).includes(leaveStudent.class_id))) {
      return res.status(403).json({ error: 'You are not authorized to review this leave request.' });
    }
    dbLeaveRequests[idx].status = status;
    dbLeaveRequests[idx].teacher_remarks = teacher_remarks || '';
    dbLeaveRequests[idx].reviewed_by = currentSessionUser.id;
    dbLeaveRequests[idx].reviewed_at = new Date().toISOString();

    // Create student notification
    const stu = dbStudents.find(s => s.id === dbLeaveRequests[idx].student_id);
    if (stu) {
      dbNotifications.unshift({
        id: Date.now(),
        user_id: stu.user_id,
        title: `Leave Request ${status}`,
        message: `Your leave request for ${dbLeaveRequests[idx].from_date} to ${dbLeaveRequests[idx].to_date} was ${status.toLowerCase()}.`,
        type: 'LEAVE',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    logActivity(currentSessionUser.id, currentSessionUser.full_name, currentSessionUser.role, 'LEAVE_REVIEWED', `Leave request #${id} marked as ${status}`);
    return res.json(dbLeaveRequests[idx]);
  }
  res.status(404).json({ error: 'Leave request not found' });
});

// 13. NOTIFICATIONS & ANNOUNCEMENTS
app.get('/api/notifications', (req: Request, res: Response) => {
  const actor = actorFor(req);
  const userNotifications = dbNotifications.filter(
    n => n.user_id === actor.id || (n.user_id === 0 && actor.role === 'ADMIN') || actor.role === 'ADMIN'
  );
  const unreadCount = userNotifications.filter(n => !n.is_read).length;
  res.json({ notifications: userNotifications, unread_count: unreadCount });
});

app.put('/api/notifications/:id/read', (req: Request, res: Response) => {
  const actor = actorFor(req);
  const notifId = Number(req.params.id);
  const target = dbNotifications.find(n => n.id === notifId);
  if (target && target.user_id !== actor.id && actor.role !== 'ADMIN') {
    return res.status(403).json({ error: 'You are not authorized to modify this notification.' });
  }
  if (target) {
    target.is_read = true;
    return res.json({ success: true, notification: target });
  }
  res.status(404).json({ error: 'Notification not found' });
});

app.put('/api/notifications/read-all', (req: Request, res: Response) => {
  const actor = actorFor(req);
  dbNotifications.forEach(n => {
    if (n.user_id === actor.id || (n.user_id === 0 && actor.role === 'ADMIN') || actor.role === 'ADMIN') {
      n.is_read = true;
    }
  });
  res.json({ success: true });
});

app.delete('/api/notifications/:id', (req: Request, res: Response) => {
  const actor = actorFor(req);
  const notifId = Number(req.params.id);
  const idx = dbNotifications.findIndex(n => n.id === notifId);
  if (idx !== -1 && dbNotifications[idx].user_id !== actor.id && actor.role !== 'ADMIN') {
    return res.status(403).json({ error: 'You are not authorized to delete this notification.' });
  }
  if (idx !== -1) {
    dbNotifications.splice(idx, 1);
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Notification not found' });
});

app.delete('/api/notifications/clear-read', (req: Request, res: Response) => {
  const actor = actorFor(req);
  dbNotifications = dbNotifications.filter(n =>
    !n.is_read || (n.user_id !== actor.id && !(actor.role === 'ADMIN' || n.user_id === 0))
  );
  res.json({ success: true });
});

app.get('/api/announcements', (req: Request, res: Response) => {
  res.json(dbAnnouncements);
});

app.post('/api/announcements', (req: Request, res: Response) => {
  if (!['ADMIN', 'TEACHER'].includes(actorFor(req).role)) return res.status(403).json({ error: 'Announcement publishing access denied.' });
  const newAnn = { id: Date.now(), ...req.body, created_at: new Date().toISOString() };
  dbAnnouncements.unshift(newAnn);
  logActivity(currentSessionUser.id, currentSessionUser.full_name, currentSessionUser.role, 'ANNOUNCEMENT_CREATED', `Published announcement: ${newAnn.title}`);
  res.json(newAnn);
});

// 14. ACTIVITY LOGS
app.get('/api/activity-logs', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required.' });
  res.json(dbActivityLogs);
});

// 14.5 AUTOMATED SIMULATED EMAIL ALERTS API
app.get('/api/alerts/email-logs', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required.' });
  res.json(dbEmailLogs);
});

app.post('/api/alerts/trigger-automated-emails', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required.' });
  const minThreshold = dbSettings.min_attendance_percentage;
  const dispatched: any[] = [];

  dbStudents.forEach(stu => {
    const stuRecords = dbAttendance.filter(a => a.student_id === stu.id);
    const total = stuRecords.length;
    if (total > 0) {
      const attended = stuRecords.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
      const pct = Math.round((attended / total) * 100);
      if (pct < minThreshold) {
        const sent = sendSimulatedEmailAlert(stu.id, 'AUTOMATED_THRESHOLD');
        if (sent) dispatched.push(sent);
      }
    }
  });

  res.json({
    success: true,
    count: dispatched.length,
    min_threshold: minThreshold,
    dispatchedEmails: dispatched,
    message: `Automated email alert scan complete. ${dispatched.length} warning emails dispatched to students below ${minThreshold}% threshold.`
  });
});

app.post('/api/alerts/send-individual-email', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required.' });
  const { student_id, custom_note } = req.body;
  if (!student_id) {
    return res.status(400).json({ error: 'Student ID is required' });
  }

  const sentEmail = sendSimulatedEmailAlert(Number(student_id), 'MANUAL_ALERT', custom_note);
  if (!sentEmail) {
    return res.status(404).json({ error: 'Student record not found' });
  }

  res.json({
    success: true,
    email: sentEmail,
    message: `Warning email successfully dispatched to ${sentEmail.recipient_email}`
  });
});

// 15. AI ATTENDANCE ASSISTANT (Powered by Gemini API with Institutional Analysis Engine)
app.post('/api/ai/assistant', async (req: Request, res: Response) => {
  const actor = actorFor(req);
  const { message } = req.body;
  const role = actor.role;
  const visibleStudents = dbStudents.filter(student => canAccessStudent(actor, student.id));
  const visibleStudentIds = new Set(visibleStudents.map(student => student.id));
  const visibleClasses = new Set(visibleClassIds(actor));
  const visibleSubjects = dbSubjects.filter(subject =>
    visibleClasses.has(subject.class_id) && (role !== 'TEACHER' || subject.teacher_id === getTeacherRecord(actor)?.id)
  );

  if (!message) {
    return res.status(400).json({ error: 'Message prompt is required' });
  }

  // Build dynamic database context from live records
  const databaseContext = {
    institution: dbSettings.institution_name,
    min_threshold: dbSettings.min_attendance_percentage,
    students: visibleStudents.map(s => {
      const records = dbAttendance.filter(a => a.student_id === s.id);
      const total = records.length;
      const attended = records.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
      return {
        id: s.id,
        name: s.full_name,
        roll_number: s.roll_number,
        class: dbClasses.find(c => c.id === s.class_id)?.name,
        total_sessions: total,
        attended_sessions: attended,
        attendance_pct: total > 0 ? Math.round((attended / total) * 100) : 100,
      };
    }),
    subjects: visibleSubjects.map(sub => ({
      code: sub.code,
      name: sub.name,
      teacher: dbTeachers.find(t => t.id === sub.teacher_id)?.full_name,
    })),
    recent_attendance: dbAttendance.filter(record => visibleStudentIds.has(record.student_id)).slice(-10),
  };

  const geminiClient = getGeminiClient();

  if (geminiClient) {
    try {
      const systemPrompt = `You are the official Smart Attendance AI Assistant for ${dbSettings.institution_name}.
You have direct read access to the live institutional database state:
${JSON.stringify(databaseContext, null, 2)}

User Role Asking: ${role}
User Question: "${message}"

Rules:
1. Provide accurate, clear answers based strictly on the provided real attendance database values above.
2. If asked about calculations (e.g., how many classes to reach target attendance %), compute accurately using:
   - Target = ${dbSettings.min_attendance_percentage}%
   - Formula: ceil((Target% * Total - 100 * Attended) / (100 - Target%))
3. Be professional, friendly, and helpful. Use formatting with bold text and bullet points.`;

      const response = await geminiClient.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: systemPrompt,
      });

      if (response && response.text) {
        return res.json({ reply: response.text });
      }
    } catch (err: any) {
      console.warn('Gemini API call failed, transitioning to institutional query engine:', err?.message || err);
    }
  }

  // Institutional Intelligence Engine Fallback (Real-Time Database Calculation)
  const q = message.toLowerCase();
  let fallbackText = '';
  const minThreshold = dbSettings.min_attendance_percentage;

  // 1. Calculations: How many classes to reach target % (75% or custom)
  if (q.includes('how many') || q.includes('need') || q.includes('reach') || q.includes('target') || q.includes('calculate')) {
    const targetMatch = q.match(/(\d+)\s*%/);
    const targetPct = targetMatch ? Number(targetMatch[1]) : minThreshold;

    // Check if Hamza (student3 / id 3) or specific student requested
    let targetStudent = visibleStudents.find(s => q.includes(s.full_name.toLowerCase()) || q.includes(s.roll_number.toLowerCase()));
    if (!targetStudent) {
      targetStudent = visibleStudents[0];
    }

    if (targetStudent) {
      const recs = dbAttendance.filter(a => a.student_id === targetStudent.id);
      const total = recs.length || 3;
      const attended = recs.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
      const currentPct = total > 0 ? Math.round((attended / total) * 100) : 0;

      if (currentPct >= targetPct) {
        fallbackText = `**Attendance Target Analysis for ${targetStudent.full_name} (${targetStudent.roll_number}):**\n` +
          `- **Current Standing:** ${attended}/${total} classes attended (**${currentPct}%**).\n` +
          `- **Status:** You are already above the **${targetPct}%** threshold! Keep maintaining regular attendance.`;
      } else {
        // Formula: ceil((target * total - 100 * attended) / (100 - target))
        const needed = Math.ceil((targetPct * total - 100 * attended) / (100 - targetPct));
        fallbackText = `**Attendance Recovery Calculation for ${targetStudent.full_name} (${targetStudent.roll_number}):**\n` +
          `- **Current Standing:** ${attended}/${total} classes attended (**${currentPct}%**).\n` +
          `- **Target Threshold:** ${targetPct}%\n` +
          `- **Required Action:** You must attend the next **${Math.max(1, needed)} consecutive lecture(s)** without absence to reach **${targetPct}%**.\n\n` +
          `*Formula applied: ceil((${targetPct}% × ${total} - 100 × ${attended}) ÷ (100 - ${targetPct}%)) = ${needed} classes.*`;
      }
    }
  }

  // 2. Specific student query or "my attendance"
  else if (q.includes('my attendance') || q.includes('my database') || q.includes('hamza') || q.includes('ali') || q.includes('fatima')) {
    let stu = visibleStudents.find(s => q.includes(s.full_name.toLowerCase()) || q.includes(s.roll_number.toLowerCase()));
    if (!stu) {
      stu = visibleStudents[0];
    }
    if (!stu) return res.json({ reply: 'No student records are available to your account.' });

    const recs = dbAttendance.filter(a => a.student_id === stu.id);
    const total = recs.length;
    const attended = recs.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const presents = recs.filter(a => a.status === 'PRESENT').length;
    const lates = recs.filter(a => a.status === 'LATE').length;
    const absents = recs.filter(a => a.status === 'ABSENT').length;
    const pct = total > 0 ? Math.round((attended / total) * 100) : 100;

    fallbackText = `**Attendance Profile: ${stu.full_name} (${stu.roll_number})**\n` +
      `- **Program / Class:** ${dbPrograms.find(program => program.id === stu.program_id)?.name || 'Academic Program'} (${dbClasses.find(cls => cls.id === stu.class_id)?.name || 'Class'})\n` +
      `- **Overall Attendance:** **${pct}%** (${attended} of ${total} sessions attended)\n` +
      `- **Breakdown:** ${presents} Present, ${lates} Late, ${absents} Absent\n` +
      `- **Threshold Status:** ${pct >= minThreshold ? `✅ Satisfies minimum institution requirement (≥ ${minThreshold}%)` : `⚠️ **Below Required Minimum** (< ${minThreshold}% threshold). Needs urgent attendance recovery.`}`;
  }

  // 3. Subject-specific queries
  else if (q.includes('database systems') || q.includes('cs-301') || q.includes('software engineering') || q.includes('web tech') || q.includes('subject')) {
    const sub = visibleSubjects.find(s => q.includes(s.name.toLowerCase()) || q.includes(s.code.toLowerCase())) || visibleSubjects[0];
    if (!sub) return res.json({ reply: 'No subject records are available to your account.' });
    const teacher = dbTeachers.find(t => t.id === sub.teacher_id);
    const subRecs = dbAttendance.filter(a => a.subject_id === sub.id && visibleStudentIds.has(a.student_id));
    const totalSub = subRecs.length;
    const attendedSub = subRecs.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const avgPct = totalSub > 0 ? Math.round((attendedSub / totalSub) * 100) : 100;

    fallbackText = `**Subject Attendance Summary: ${sub.code} - ${sub.name}**\n` +
      `- **Instructor:** ${teacher ? teacher.full_name : 'Faculty Member'}\n` +
      `- **Credit Hours:** ${sub.credit_hours} Cr.\n` +
      `- **${role === 'PARENT' ? 'Linked Children' : role === 'STUDENT' ? 'Your' : 'Class'} Attendance:** **${avgPct}%**\n` +
      `- **Total Marked Sessions:** ${Math.max(3, new Set(subRecs.map(r => r.date)).size)} lectures`;
  }

  // 4. Low attendance warnings list
  else if (q.includes('below') || q.includes('low') || q.includes('risk') || q.includes('defaulter') || q.includes('warning') || q.includes('75%')) {
    const lowStus = visibleStudents.map(s => {
      const recs = dbAttendance.filter(a => a.student_id === s.id);
      const total = recs.length;
      const attended = recs.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
      const pct = total > 0 ? Math.round((attended / total) * 100) : 100;
      return { ...s, total, attended, pct };
    }).filter(s => s.total > 0 && s.pct < minThreshold);

    if (lowStus.length > 0) {
      fallbackText = `**Students Below Minimum Institutional Threshold (< ${minThreshold}%):**\n\n` +
        lowStus.map(s => {
          const needed = Math.ceil((minThreshold * s.total - 100 * s.attended) / (100 - minThreshold));
          return `- **${s.full_name}** (${s.roll_number} - ${dbClasses.find(cls => cls.id === s.class_id)?.name || 'Class'}): **${s.pct}%** (${s.attended}/${s.total} attended). Requires **${needed} consecutive classes** to reach ${minThreshold}%.`;
        }).join('\n') +
        (role === 'ADMIN' || role === 'TEACHER'
          ? `\n\n*Automated email warning dispatches can be triggered via the **Email Alerts** panel.*`
          : '');
    } else {
      fallbackText = role === 'STUDENT'
        ? `Your attendance satisfies the minimum **${minThreshold}%** threshold.`
        : role === 'PARENT'
          ? `All of your linked children currently satisfy the minimum **${minThreshold}%** threshold.`
          : `All enrolled students currently satisfy the minimum **${minThreshold}%** attendance threshold!`;
    }
  }

  // 5. Leave requests
  else if (q.includes('leave') || q.includes('application') || q.includes('permission')) {
    const visibleLeaveIds = new Set(dbLeaveRequests.filter(leave => visibleStudentIds.has(leave.student_id)).map(leave => leave.id));
    const pending = dbLeaveRequests.filter(l => visibleLeaveIds.has(l.id) && l.status === 'PENDING').length;
    const approved = dbLeaveRequests.filter(l => visibleLeaveIds.has(l.id) && l.status === 'APPROVED').length;
    fallbackText = `**Leave Requests Overview (${dbSettings.institution_name}):**\n` +
      `- **Pending Review:** ${pending} request(s)\n` +
      `- **Approved Requests:** ${approved} request(s)\n` +
      (role === 'ADMIN' || role === 'TEACHER'
        ? `- **Recent Activity:** Authorized staff can review requests in the **Leave Requests** portal.`
        : '');
  }

  // 6. General / Today's stats
  else {
    const visibleAttendance = dbAttendance.filter(record => visibleStudentIds.has(record.student_id));
    const totalToday = visibleAttendance.length;
    const attendedToday = visibleAttendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const overallRate = totalToday > 0 ? Math.round((attendedToday / totalToday) * 100) : 88;

    if (role === 'STUDENT' || role === 'PARENT') {
      fallbackText = role === 'STUDENT'
        ? `Hello! Your attendance across your recorded sessions is **${overallRate}%**. The minimum required attendance is ${minThreshold}%. You can ask about your attendance, subjects, or leave requests.`
        : `Hello! The attendance rate across your linked children's recorded sessions is **${overallRate}%**. The minimum required attendance is ${minThreshold}%. You can ask about their attendance, subjects, or leave requests.`;
    } else {
      fallbackText = `Hello! I am your AI Attendance Assistant for **${dbSettings.institution_name}**.\n\n` +
        `**Institutional Summary Highlights:**\n` +
        `- **Academic Session:** ${dbSettings.academic_session}\n` +
        `- **Minimum Threshold:** ${minThreshold}%\n` +
        `- **Overall Active Attendance Rate:** **${overallRate}%**\n` +
        `- **Enrolled Students:** ${visibleStudents.length} across ${visibleClasses.size} class sections\n\n` +
        `Feel free to ask me any attendance calculation, student record lookup, or departmental report query!`;
    }
  }

  res.json({ reply: fallbackText });
});

// ==========================================
// 15. AI-BASED FACE RECOGNITION ATTENDANCE MODULE
// ==========================================

// Live camera check-in is bound to the authenticated student's account and enrolled face template.
app.post('/api/attendance/live-camera-check-in', async (req: Request, res: Response) => {
  const actor = actorFor(req);
  if (actor.role !== 'STUDENT') {
    return res.status(403).json({ error: 'Live camera check-in is only available to authenticated student accounts.' });
  }

  const student = getCurrentStudentRecord(actor);
  if (!student) {
    return res.status(403).json({ error: 'Your student profile could not be verified. Contact your administrator.' });
  }
  if (student.status !== 'ACTIVE') {
    return res.status(403).json({ error: 'Your student account is inactive. Contact your administrator.' });
  }

  const descriptorInput = req.body.descriptor;
  let probe: number[] | null = null;
  if (Array.isArray(descriptorInput)) {
    try {
      probe = normalizeEmbedding(descriptorInput, 'camera descriptor');
    } catch (error) {
      return res.status(422).json({
        error: error instanceof Error ? error.message : 'The captured face descriptor is invalid.',
        code: 'INVALID_CAMERA_FRAME',
      });
    }
  }

  if (!probe) {
    return res.status(400).json({ error: 'Capture a face descriptor from the live camera before checking in.' });
  }

  const faceTemplate = dbFaceEmbeddings.find(record => record.student_id === student.id);
  if (!faceTemplate || !faceTemplate.consent_obtained) {
    return res.status(403).json({
      error: 'Face enrollment is required before biometric attendance can be marked. Contact your administrator.',
      code: 'FACE_NOT_ENROLLED',
    });
  }

  const similarity = cosineSimilarity(probe, faceTemplate.embedding);
  if (similarity < FACE_MATCH_THRESHOLD) {
    return res.status(403).json({
      error: 'The captured face did not match your enrolled student profile. Attendance was not marked.',
      code: 'FACE_MISMATCH',
    });
  }

  const checkInDate = new Date().toISOString().split('T')[0];
  const checkInTime = new Date().toTimeString().slice(0, 5);
  const existing = dbAttendance.find(record =>
    record.student_id === student.id &&
    record.class_id === student.class_id &&
    record.date === checkInDate &&
    record.method === 'CAMERA_CHECK_IN'
  );
  const cls = dbClasses.find(item => item.id === student.class_id);
  if (existing) {
    return res.json({
      success: true,
      already_marked: true,
      student_id: student.id,
      student_name: student.full_name,
      roll_number: student.roll_number,
      class_name: cls?.name || 'Class',
      existing_time: existing.time,
      message: `College attendance is already recorded for ${student.full_name} today at ${existing.time}.`,
    });
  }

  dbAttendance.push({
    id: nextRecordId(dbAttendance.map(record => record.id)),
    student_id: student.id,
    teacher_id: null,
    class_id: student.class_id,
    subject_id: null,
    date: checkInDate,
    time: checkInTime,
    status: 'PRESENT',
    remarks: 'Student identity matched against the locally enrolled SFace template. Liveness is not verified.',
    method: 'CAMERA_CHECK_IN',
  });
  try {
    persistAuthState();
  } catch (error) {
    dbAttendance.pop();
    console.error('Failed to persist live camera attendance:', error);
    return res.status(500).json({ error: 'Attendance could not be saved. Please retry or contact an administrator.' });
  }

  logActivity(
    actor.id,
    actor.full_name,
    actor.role,
    'LIVE_CAMERA_ATTENDANCE_MARKED',
    `General college attendance recorded for ${student.full_name} (${student.roll_number}) in ${cls?.name || 'class'}.`,
  );

  const parentLinks = dbParentStudents.filter(link => link.student_id === student.id);
  for (const link of parentLinks) {
    const parent = dbParents.find(item => item.id === link.parent_id);
    if (parent?.user_id) {
      dbNotifications.unshift({
        id: nextRecordId(dbNotifications.map(notification => notification.id)),
        user_id: parent.user_id,
        title: `Attendance Confirmed: ${student.full_name}`,
        message: `${student.full_name} checked in at ${checkInTime} using the live camera check-in.`,
        type: 'INFO',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  res.json({
    success: true,
    already_marked: false,
    student_id: student.id,
    student_name: student.full_name,
    roll_number: student.roll_number,
    class_name: cls?.name || 'Class',
    status: 'PRESENT',
    time: checkInTime,
    date: checkInDate,
    similarity,
    message: `Your face matched the enrolled profile and attendance was marked PRESENT for ${student.full_name}.`,
  });
});

// List students with facial biometric enrollment status
app.get('/api/face-recognition/students', (req: Request, res: Response) => {
  const actor = actorFor(req);
  const { class_id } = req.query;
  let students = [...dbStudents];
  if (actor.role === 'STUDENT') {
    const self = getCurrentStudentRecord(actor);
    students = self ? students.filter(student => student.id === self.id) : [];
  } else if (actor.role === 'TEACHER') {
    const allowedClasses = new Set(teacherClassIds(actor));
    students = students.filter(student => allowedClasses.has(student.class_id));
  } else if (actor.role !== 'ADMIN') {
    students = [];
  }
  if (class_id) {
    students = students.filter(s => s.class_id === Number(class_id));
  }

  const result = students.map(s => {
    const enrollment = dbFaceEmbeddings.find(f => f.student_id === s.id);
    const cls = dbClasses.find(c => c.id === s.class_id);
    const enrolledByUser = enrollment ? dbUsers.find(u => u.id === enrollment.enrolled_by_user_id) : null;
    return {
      id: s.id,
      student_code: s.student_code,
      roll_number: s.roll_number,
      full_name: s.full_name,
      email: s.email,
      avatar: s.avatar,
      class_id: s.class_id,
      class_name: cls?.name || 'BSCS',
      is_enrolled: !!enrollment,
      sample_count: enrollment?.sample_count || 0,
      consent_obtained: enrollment?.consent_obtained || false,
      liveness_score_enrolled: enrollment?.liveness_score_enrolled || null,
      enrolled_at: enrollment?.created_at || null,
      enrolled_by_name: enrolledByUser ? enrolledByUser.full_name : (enrollment ? 'Faculty / Admin' : null),
    };
  });

  res.json(result);
});

// Enroll / Register facial biometric template with consent
app.post('/api/face-recognition/enroll', async (req: Request, res: Response) => {
  const actor = actorFor(req);
  if (!['ADMIN', 'TEACHER'].includes(actor.role)) {
    return res.status(403).json({ error: 'Administrator or assigned teacher access required.' });
  }
  const studentId = Number(req.body.student_id);
  const student = dbStudents.find(record => record.id === studentId);
  if (!student) return res.status(404).json({ error: 'Student record not found.' });
  if (!canManageStudentBiometrics(studentId, actor)) {
    return res.status(403).json({ error: 'You are not authorized to enroll this student.' });
  }
  if (req.body.consent_obtained !== true) {
    return res.status(400).json({ error: 'Explicit biometric consent is required before enrollment.' });
  }
  const samples = req.body.samples;
  if (!Array.isArray(samples) || samples.length < 3 || samples.length > 5 ||
      samples.some((sample: unknown) => !Array.isArray(sample) || sample.length !== 128 ||
        sample.some((value: unknown) => typeof value !== 'number' || !Number.isFinite(value)))) {
    return res.status(400).json({ error: 'Capture three valid live face descriptors of this student before enrollment.' });
  }

  try {
    const embeddings: number[][] = samples.map((sample: unknown, index: number) => normalizeEmbedding(sample as number[], `sample ${index + 1}`));
    const averaged = new Array<number>(128).fill(0);
    embeddings.forEach(embedding => embedding.forEach((value, index) => {
      averaged[index] += value / embeddings.length;
    }));
    const norm = Math.sqrt(averaged.reduce((sum, value) => sum + value * value, 0));
    if (!Number.isFinite(norm) || norm === 0) {
      return res.status(422).json({ error: 'The live camera samples did not produce a usable face template.' });
    }
    const now = new Date().toISOString();
    const existingIndex = dbFaceEmbeddings.findIndex(record => record.student_id === student.id);
    const record: FaceEmbeddingRecord = {
      id: existingIndex >= 0 ? dbFaceEmbeddings[existingIndex].id : nextRecordId(dbFaceEmbeddings.map(item => item.id)),
      student_id: student.id,
      embedding: averaged.map(value => value / norm),
      sample_count: embeddings.length,
      enrolled_by_user_id: actor.id,
      consent_obtained: true,
      liveness_score_enrolled: 0,
      created_at: existingIndex >= 0 ? dbFaceEmbeddings[existingIndex].created_at : now,
      updated_at: now,
    };
    const updatedRecords = [...dbFaceEmbeddings];
    if (existingIndex >= 0) updatedRecords[existingIndex] = record;
    else updatedRecords.push(record);
    persistFaceEmbeddings(updatedRecords);
    dbFaceEmbeddings = updatedRecords;
    logActivity(actor.id, actor.full_name, actor.role, 'FACE_BIOMETRIC_ENROLLED',
      `Enrolled a browser-side face template for ${student.full_name} (${student.roll_number}) after explicit consent.`);
    return res.json({
      success: true,
      message: `Face template enrolled for ${student.full_name}. Camera frames are processed locally and not stored as images.`,
      sample_count: record.sample_count,
      enrolled_at: record.created_at,
    });
  } catch (error) {
    console.error('Live face enrollment failed:', error);
    return res.status(422).json({
      error: error instanceof Error ? error.message : 'The live camera samples could not be used to create a face template.',
      code: 'INVALID_CAMERA_FRAME',
    });
  }
});

// Revoke / Delete facial biometric template (GDPR / Privacy Compliance)
app.delete('/api/face-recognition/enroll/:student_id', (req: Request, res: Response) => {
  const actor = actorFor(req);
  const studentId = Number(req.params.student_id);
  const stu = dbStudents.find(s => s.id === studentId);
  const idx = dbFaceEmbeddings.findIndex(f => f.student_id === studentId);

  if (!stu) {
    return res.status(404).json({ error: 'Student record not found.' });
  }

  if (!canManageStudentBiometrics(studentId, actor)) {
    return res.status(403).json({
      error: 'You are not authorized to remove this student biometric profile.',
      code: 'BIOMETRIC_ACCESS_DENIED'
    });
  }

  if (idx === -1) {
    return res.status(404).json({ error: 'No biometric template found for this student.' });
  }

  const updatedRecords = dbFaceEmbeddings.filter(record => record.student_id !== studentId);
  try {
    persistFaceEmbeddings(updatedRecords);
    dbFaceEmbeddings = updatedRecords;
  } catch (error) {
    console.error('Failed to persist face-template deletion:', error);
    return res.status(500).json({ error: 'The face template could not be removed from local storage.' });
  }

  logActivity(
    actor.id,
    actor.full_name,
    actor.role,
    'FACE_BIOMETRIC_DELETED',
    `Permanently erased facial biometric template for student ${stu?.full_name || studentId} upon request.`
  );

  res.json({
    success: true,
    message: `Biometric template for ${stu?.full_name || 'student'} has been permanently erased from the biometric registry.`
  });
});

// Real-Time Face Recognition Verification and Attendance Recording
app.post('/api/face-recognition/verify-and-mark', async (req: Request, res: Response) => {
  const actor = actorFor(req);
  if (actor.role !== 'STUDENT') {
    return res.status(403).json({ error: 'Use the authorized classroom register for staff-marked attendance.' });
  }
  return res.status(410).json({
    error: 'Use the live camera check-in endpoint, which verifies the captured face against your enrolled profile.',
    code: 'USE_LIVE_CAMERA_CHECK_IN',
  });
});

// ==========================================
// 16. PARENT PORTAL MODULE & AUTHORIZATION
// ==========================================

// Get all parents with linked children (Admin view)
app.get('/api/parents', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required.' });
  const result = dbParents.map(p => {
    const relations = dbParentStudents.filter(ps => ps.parent_id === p.id);
    const linkedChildren = relations.map(r => {
      const stu = dbStudents.find(s => s.id === r.student_id);
      const cls = stu ? dbClasses.find(c => c.id === stu.class_id) : null;
      return {
        relationship_id: r.id,
        student_id: r.student_id,
        relationship: r.relationship,
        is_primary: r.is_primary,
        full_name: stu?.full_name || 'Unknown Student',
        roll_number: stu?.roll_number || 'N/A',
        class_name: cls?.name || 'BSCS',
        avatar: stu?.avatar,
      };
    });
    return {
      ...p,
      children: linkedChildren,
      children_count: linkedChildren.length,
    };
  });

  res.json(result);
});

// Create new parent account
app.post('/api/parents', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Only administrators may create and verify parent accounts.' });
  const { full_name, email, password, phone, whatsapp_number, cnic, occupation, address, student_id, relationship = 'Father' } = req.body;

  if (!full_name || !email || !phone || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Full name, email, phone number, and a password of at least 8 characters are required.' });
  }

  // Validate and normalize WhatsApp number (Pakistan +92 format)
  let normalizedWhatsapp = '';
  if (whatsapp_number) {
    const cleaned = whatsapp_number.replace(/[\s\-()]/g, '');
    // Support 03xxxxxxxx → +923xxxxxxxxx and +92xxxxxxxxxx formats
    if (/^03[0-9]{9}$/.test(cleaned)) {
      normalizedWhatsapp = '+92' + cleaned.slice(1);
    } else if (/^\+92[0-9]{10}$/.test(cleaned)) {
      normalizedWhatsapp = cleaned;
    } else if (/^92[0-9]{10}$/.test(cleaned)) {
      normalizedWhatsapp = '+' + cleaned;
    } else if (cleaned.length > 0) {
      normalizedWhatsapp = cleaned; // store as-is for other formats
    }
  }

  const existing = dbParents.find(p => p.email.toLowerCase() === email.toLowerCase()) ||
    dbUsers.find(user => normalizeUniqueValue(user.email) === normalizeUniqueValue(email));
  if (existing) {
    return res.status(400).json({ error: 'A parent record with this email address already exists.' });
  }
  if (student_id && !dbStudents.some(student => student.id === Number(student_id))) {
    return res.status(404).json({ error: 'Student record not found.' });
  }

  const newUserId = nextRecordId(dbUsers.map(user => user.id));
  const parentId = nextRecordId(dbParents.map(parent => parent.id));
  const avatar = getGenderSpecificAvatar(full_name);

  const newUser = {
    id: newUserId,
    username: email.split('@')[0],
    email: email.toLowerCase(),
    full_name,
    role: 'PARENT' as const,
    status: 'ACTIVE' as const,
    avatar,
  };
  dbUsers.push(newUser);
  passwordHashes.set(newUserId, hashPassword(password));

  const newParent = {
    id: parentId,
    user_id: newUserId,
    full_name,
    email: email.toLowerCase(),
    phone,
    whatsapp_number: normalizedWhatsapp,
    cnic: cnic || '',
    occupation: occupation || '',
    address: address || '',
    status: 'ACTIVE' as const,
    created_at: new Date().toISOString(),
    avatar,
  };
  dbParents.push(newParent);

  if (student_id) {
    if (!dbStudents.some(student => student.id === Number(student_id))) {
      dbUsers.splice(dbUsers.findIndex(user => user.id === newUserId), 1);
      dbParents.splice(dbParents.findIndex(parent => parent.id === parentId), 1);
      return res.status(404).json({ error: 'Student record not found.' });
    }
    dbParentStudents.push({
      id: nextRecordId(dbParentStudents.map(link => link.id)),
      parent_id: parentId,
      student_id: Number(student_id),
      relationship,
      is_primary: true,
      created_at: new Date().toISOString(),
    });
  }

  persistAuthState();
  logActivity(
    currentSessionUser.id,
    currentSessionUser.full_name,
    currentSessionUser.role,
    'PARENT_CREATED',
    `Registered parent account for ${full_name} (${email}).`
  );

  res.json({ success: true, parent: newParent });
});

// Link a student to a parent
app.post('/api/parents/link-student', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Only administrators may verify parent-child relationships.' });
  const { parent_id, student_id, relationship = 'Guardian', is_primary = true } = req.body;

  if (!parent_id || !student_id) {
    return res.status(400).json({ error: 'Parent ID and Student ID are required.' });
  }

  const parent = dbParents.find(p => p.id === Number(parent_id));
  const student = dbStudents.find(s => s.id === Number(student_id));

  if (!parent || !student) {
    return res.status(404).json({ error: 'Parent or Student record not found.' });
  }

  const existing = dbParentStudents.find(ps => ps.parent_id === Number(parent_id) && ps.student_id === Number(student_id));
  if (existing) {
    return res.status(400).json({ error: 'This student is already linked to this parent account.' });
  }

  const newRel = {
    id: nextRecordId(dbParentStudents.map(link => link.id)),
    parent_id: Number(parent_id),
    student_id: Number(student_id),
    relationship,
    is_primary: Boolean(is_primary),
    created_at: new Date().toISOString(),
  };

  dbParentStudents.push(newRel);
  persistAuthState();

  logActivity(
    currentSessionUser.id,
    currentSessionUser.full_name,
    currentSessionUser.role,
    'PARENT_STUDENT_LINKED',
    `Linked student ${student.full_name} to parent ${parent.full_name} as ${relationship}.`
  );

  res.json({ success: true, link: newRel, message: `Successfully linked ${student.full_name} to parent account.` });
});

// Unlink a student from a parent
app.delete('/api/parents/unlink-student', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required.' });
  const { parent_id, student_id } = req.body;
  const idx = dbParentStudents.findIndex(ps => ps.parent_id === Number(parent_id) && ps.student_id === Number(student_id));

  if (idx === -1) {
    return res.status(404).json({ error: 'Parent-Student link not found.' });
  }

  dbParentStudents.splice(idx, 1);

  logActivity(
    currentSessionUser.id,
    currentSessionUser.full_name,
    currentSessionUser.role,
    'PARENT_STUDENT_UNLINKED',
    `Unlinked student ID ${student_id} from parent ID ${parent_id}.`
  );

  res.json({ success: true, message: 'Student successfully unlinked from parent account.' });
});

// Update Parent WhatsApp Number (Admin or the parent themselves)
app.put('/api/parents/:id/whatsapp', (req: Request, res: Response) => {
  const parentId = Number(req.params.id);
  const { whatsapp_number } = req.body;

  const normalized = normalizePhoneNumber(whatsapp_number);
  if (!normalized) return res.status(400).json({ error: 'Enter a valid WhatsApp number with an international country code.' });

  const parent = dbParents.find(p => p.id === parentId);
  if (!parent) {
    return res.status(404).json({ error: 'Parent record not found.' });
  }

  // Authorization: only admin or the logged-in parent themselves
  const actor = actorFor(req);
  const isOwner = actor.id === parent.user_id && actor.role === 'PARENT';
  const isAdmin = actor.role === 'ADMIN';
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'You are not authorized to update this parent profile.' });
  }
  if (isOwner) {
    const linkedChildIds = new Set(dbParentStudents.filter(link => link.parent_id === parent.id).map(link => link.student_id));
    const verifiedForLinkedChild = dbStudents.some(student =>
      linkedChildIds.has(student.id) &&
      normalizePhoneNumber(student.guardian_phone) === normalized
    );
    if (!verifiedForLinkedChild) {
      return res.status(403).json({ error: 'The new WhatsApp number must match guardian contact details verified for one of your linked children. Contact an administrator if the registered number needs correction.' });
    }
  }

  parent.whatsapp_number = normalized;

  logActivity(
    actor.id,
    actor.full_name,
    actor.role,
    'PARENT_WHATSAPP_UPDATED',
    `Updated WhatsApp number for parent ${parent.full_name} to ${normalized}.`
  );

  res.json({ success: true, whatsapp_number: normalized, message: 'WhatsApp number updated successfully.' });
});

// Get Parent's own profile (including WhatsApp)
app.get('/api/parent/profile', (req: Request, res: Response) => {
  const actor = actorFor(req);
  if (actor.role !== 'PARENT') return res.status(403).json({ error: 'Parent account required.' });
  const parentRecord = getParentRecord(actor);

  if (!parentRecord) {
    return res.status(404).json({ error: 'Parent profile not found.' });
  }

  res.json({
    id: parentRecord.id,
    user_id: parentRecord.user_id,
    full_name: parentRecord.full_name,
    email: parentRecord.email,
    phone: parentRecord.phone,
    whatsapp_number: (parentRecord as any).whatsapp_number || '',
    cnic: parentRecord.cnic,
    occupation: parentRecord.occupation,
    address: parentRecord.address,
    status: parentRecord.status,
    avatar: parentRecord.avatar,
  });
});

// Build WhatsApp Click-to-Chat URL for a fee invoice
app.get('/api/fees/invoices/:id/whatsapp-share', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required to share fee vouchers.' });
  const inv = dbFeeInvoices.find(i => i.id === Number(req.params.id));
  if (!inv) return res.status(404).json({ error: 'Invoice not found.' });

  const stu = dbStudents.find(s => s.id === inv.student_id);
  if (!stu) return res.status(404).json({ error: 'Student not found.' });

  // Find linked parents
  const parentLinks = dbParentStudents.filter(ps => ps.student_id === stu.id);
  if (parentLinks.length === 0) {
    return res.status(404).json({ error: 'No parent linked to this student. Please link a parent account first.' });
  }

  const availableParents = parentLinks
    .map(link => dbParents.find(parent => parent.id === link.parent_id))
    .filter((parent): parent is NonNullable<typeof parent> => Boolean(parent));
  const validContact = availableParents
    .map(parent => ({
      parent,
      whatsapp: normalizePhoneNumber(parent.whatsapp_number) || normalizePhoneNumber(parent.phone),
    }))
    .find(contact => contact.whatsapp);
  if (!validContact) {
    return res.status(400).json({
      error: 'No linked parent has a valid WhatsApp number registered. Update a linked parent profile before sharing this voucher.',
    });
  }

  const { parent: parentRecord } = validContact;
  const whatsappNum = validContact.whatsapp;
  if (!whatsappNum) {
    return res.status(400).json({
      error: 'No linked parent has a valid WhatsApp number registered. Update a linked parent profile before sharing this voucher.',
    });
  }
  const phoneForUrl = whatsappNum.replace(/^\+/, '');

  const cls = dbClasses.find(c => c.id === inv.class_id);
  const institutionName = dbSettings.institution_name || 'Alpine Degree College Khanpur';

  const message = `Assalam-o-Alaikum,

A new fee voucher has been generated for your child.

Student Name: ${stu.full_name}
Roll Number: ${stu.roll_number}
Class: ${cls?.name || 'N/A'}
Fee Voucher Number: ${inv.challan_number}
Fee Title: ${inv.title}
Fee Amount: PKR ${inv.total_amount.toLocaleString()}
Amount Paid: PKR ${inv.paid_amount.toLocaleString()}
Balance Due: PKR ${inv.balance_due.toLocaleString()}
Issue Date: ${inv.issue_date}
Due Date: ${inv.due_date}
Status: ${inv.status}

Please log in to the Parent Portal to view the complete fee voucher. Download the challan PDF from the admin portal and attach it to this WhatsApp message manually.

Thank you.
${institutionName}`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneForUrl.replace(/^\+/, '')}?text=${encodedMessage}`;

  res.json({
    success: true,
    parent_name: parentRecord.full_name,
    parent_phone: parentRecord.phone,
    whatsapp_number: whatsappNum,
    whatsapp_url: whatsappUrl,
    message_preview: message,
    invoice: {
      id: inv.id,
      challan_number: inv.challan_number,
      title: inv.title,
      total_amount: inv.total_amount,
      balance_due: inv.balance_due,
      due_date: inv.due_date,
      status: inv.status,
    },
    student: {
      id: stu.id,
      full_name: stu.full_name,
      roll_number: stu.roll_number,
    },
  });
});

// Get authorized children for currently logged-in parent
app.get('/api/parent/children', (req: Request, res: Response) => {
  const actor = actorFor(req);
  if (actor.role !== 'PARENT') return res.status(403).json({ error: 'Parent account required.' });
  const parentRecord = getParentRecord(actor);

  if (!parentRecord) {
    return res.json([]);
  }

  const links = dbParentStudents.filter(ps => ps.parent_id === parentRecord.id);
  const children = links.map(link => {
    const student = dbStudents.find(s => s.id === link.student_id);
    if (!student) return null;

    const cls = dbClasses.find(c => c.id === student.class_id);
    const prog = dbPrograms.find(p => p.id === student.program_id);
    const dept = dbDepartments.find(d => d.id === student.department_id);

    // Compute live attendance statistics for summary card
    const stuRecords = dbAttendance.filter(a => a.student_id === student.id);
    const totalSessions = stuRecords.length;
    const presentSessions = stuRecords.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const absentSessions = stuRecords.filter(a => a.status === 'ABSENT').length;
    const lateSessions = stuRecords.filter(a => a.status === 'LATE').length;
    const percentage = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 100;

    // Check today's status
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = dbAttendance.find(a => a.student_id === student.id && (a.date === today || a.date === '2026-08-05'));

    return {
      student_id: student.id,
      full_name: student.full_name,
      roll_number: student.roll_number,
      student_code: student.student_code,
      email: student.email,
      phone: student.phone,
      avatar: student.avatar,
      class_id: student.class_id,
      class_name: cls?.name || 'BSCS',
      program_name: prog?.name || 'Computer Science',
      department_name: dept?.name || 'CS Department',
      semester: student.semester,
      batch: student.batch,
      relationship: link.relationship,
      is_primary: link.is_primary,
      total_sessions: totalSessions,
      present_sessions: presentSessions,
      absent_sessions: absentSessions,
      late_sessions: lateSessions,
      attendance_percentage: percentage,
      status_today: todayRecord ? todayRecord.status : 'NO_CLASS',
      today_time: todayRecord ? todayRecord.time : null,
    };
  }).filter(Boolean);

  res.json(children);
});

app.post('/api/parent/link-student', (req: Request, res: Response) => {
  const actor = actorFor(req);
  if (actor.role !== 'PARENT') return res.status(403).json({ error: 'Parent account required.' });

  const parent = getParentRecord(actor);
  if (!parent) return res.status(404).json({ error: 'Parent profile not found.' });
  const { student_identifier, relationship } = req.body;
  if (typeof student_identifier !== 'string' || !student_identifier.trim() || !['Father', 'Mother', 'Guardian'].includes(relationship)) {
    return res.status(400).json({ error: 'A Student ID / Registration Number and valid relationship are required.' });
  }

  const identifier = normalizeUniqueValue(student_identifier);
  const student = dbStudents.find(candidate =>
    normalizeUniqueValue(candidate.student_code) === identifier ||
    normalizeUniqueValue(candidate.roll_number) === identifier
  );
  const parentWhatsapp = normalizePhoneNumber(parent.whatsapp_number || parent.phone);
  if (!student || !parentWhatsapp || normalizePhoneNumber(student.guardian_phone) !== parentWhatsapp) {
    return res.status(403).json({ error: 'The student identifier and your registered WhatsApp number could not be verified against the institution’s guardian details.' });
  }
  if (dbParentStudents.some(link => link.parent_id === parent.id && link.student_id === student.id)) {
    return res.status(409).json({ error: 'This student is already linked to your parent account.' });
  }

  const relationshipRecord = {
    id: Date.now(),
    parent_id: parent.id,
    student_id: student.id,
    relationship,
    is_primary: !dbParentStudents.some(link => link.parent_id === parent.id),
    created_at: new Date().toISOString(),
  };
  dbParentStudents.push(relationshipRecord);
  logActivity(actor.id, actor.full_name, actor.role, 'PARENT_STUDENT_LINKED', `Parent linked verified student ${student.student_code}`);
  res.status(201).json({ success: true, student_id: student.id, message: `${student.full_name} was verified and linked to your account.` });
});

// Get comprehensive attendance details for an authorized linked child
app.get('/api/parent/child/:student_id/attendance', (req: Request, res: Response) => {
  const actor = actorFor(req);
  const studentId = Number(req.params.student_id);
  const { start_date, end_date, subject_id } = req.query;

  if (!canAccessStudent(actor, studentId)) {
    return res.status(403).json({ error: 'You are not authorized to view this student attendance record.' });
  }

  const student = dbStudents.find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student record not found.' });
  }

  const cls = dbClasses.find(c => c.id === student.class_id);
  const prog = dbPrograms.find(p => p.id === student.program_id);
  const dept = dbDepartments.find(d => d.id === student.department_id);

  // Filter attendance records
  let allRecords = dbAttendance.filter(a => a.student_id === studentId);

  // Overall Statistics from actual database records:
  // Formula: (Present + Late) / Total Eligible Sessions * 100%
  const totalSessions = allRecords.length;
  const presentDays = allRecords.filter(a => a.status === 'PRESENT').length;
  const lateDays = allRecords.filter(a => a.status === 'LATE').length;
  const absentDays = allRecords.filter(a => a.status === 'ABSENT').length;
  const leaveDays = allRecords.filter(a => a.status === 'LEAVE').length;
  const attendedDays = presentDays + lateDays;
  const attendancePercentage = totalSessions > 0 ? Math.round((attendedDays / totalSessions) * 100) : 100;

  // Today's Status
  const today = new Date().toISOString().split('T')[0];
  const todayRecord = allRecords.find(a => a.date === today || a.date === '2026-08-05');

  // Subject-wise Breakdown
  const classSubjects = dbSubjects.filter(s => s.class_id === student.class_id);
  const subjectWise = classSubjects.map(sub => {
    const teacher = dbTeachers.find(t => t.id === sub.teacher_id);
    const subRecords = allRecords.filter(a => a.subject_id === sub.id);
    const totalSub = subRecords.length;
    const presentSub = subRecords.filter(a => a.status === 'PRESENT').length;
    const lateSub = subRecords.filter(a => a.status === 'LATE').length;
    const absentSub = subRecords.filter(a => a.status === 'ABSENT').length;
    const attendedSub = presentSub + lateSub;
    const pct = totalSub > 0 ? Math.round((attendedSub / totalSub) * 100) : 100;

    return {
      subject_id: sub.id,
      subject_name: sub.name,
      subject_code: sub.code,
      credit_hours: sub.credit_hours,
      teacher_name: teacher ? teacher.full_name : 'Faculty Member',
      total_classes: totalSub,
      attended_classes: attendedSub,
      present_classes: presentSub,
      absent_classes: absentSub,
      late_classes: lateSub,
      percentage: pct,
      is_low: pct < dbSettings.min_attendance_percentage,
    };
  });

  // Filter recent records if query params provided
  let filteredRecent = [...allRecords];
  if (start_date) {
    filteredRecent = filteredRecent.filter(a => a.date >= String(start_date));
  }
  if (end_date) {
    filteredRecent = filteredRecent.filter(a => a.date <= String(end_date));
  }
  if (subject_id) {
    filteredRecent = filteredRecent.filter(a => a.subject_id === Number(subject_id));
  }

  // Enrich recent records with subject, class, teacher names
  const enrichedRecords = filteredRecent.sort((a, b) => b.date.localeCompare(a.date)).map(a => {
    const sub = dbSubjects.find(s => s.id === a.subject_id);
    const tch = dbTeachers.find(t => t.id === a.teacher_id);
    return {
      ...a,
      subject_name: sub?.name || (a.method === 'CAMERA_CHECK_IN' ? 'College Attendance' : 'Subject'),
      subject_code: sub?.code || (a.method === 'CAMERA_CHECK_IN' ? 'COLLEGE' : 'CS'),
      teacher_name: tch?.full_name || (a.method === 'CAMERA_CHECK_IN' ? 'Student self check-in' : 'Faculty'),
    };
  });

  // Find parent relationship
  let relString = 'Parent';
  if (actor.role === 'PARENT') {
    const parent = getParentRecord(actor);
    if (parent) {
      const rel = dbParentStudents.find(ps => ps.parent_id === parent.id && ps.student_id === studentId);
      if (rel) relString = rel.relationship;
    }
  }

  res.json({
    student: {
      ...student,
      class_name: cls?.name,
      program_name: prog?.name,
      department_name: dept?.name,
    },
    relationship: relString,
    min_threshold: dbSettings.min_attendance_percentage,
    total_sessions: totalSessions,
    present_days: presentDays,
    absent_days: absentDays,
    late_days: lateDays,
    leave_days: leaveDays,
    attended_days: attendedDays,
    attendance_percentage: attendancePercentage,
    status_today: todayRecord ? todayRecord.status : 'NO_CLASS',
    today_time: todayRecord ? todayRecord.time : null,
    today_subject: todayRecord
      ? dbSubjects.find(s => s.id === todayRecord.subject_id)?.name || (todayRecord.method === 'CAMERA_CHECK_IN' ? 'College Attendance' : null)
      : null,
    subject_wise: subjectWise,
    recent_records: enrichedRecords,
  });
});

// Get parent-specific notifications for linked children
app.get('/api/parent/notifications', (req: Request, res: Response) => {
  const actor = actorFor(req);
  if (actor.role !== 'PARENT') return res.status(403).json({ error: 'Parent account required.' });
  const parentRecord = getParentRecord(actor);

  if (!parentRecord) {
    return res.json([]);
  }

  const linkedStudentIds = dbParentStudents
    .filter(ps => ps.parent_id === parentRecord.id)
    .map(ps => ps.student_id);

  const notificationsList: any[] = [];

  // Generate automated alerts for linked children
  linkedStudentIds.forEach(stuId => {
    const student = dbStudents.find(s => s.id === stuId);
    if (!student) return;

    const stuRecords = dbAttendance.filter(a => a.student_id === stuId);
    const absents = stuRecords.filter(a => a.status === 'ABSENT');
    const total = stuRecords.length;
    const attended = stuRecords.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const pct = total > 0 ? Math.round((attended / total) * 100) : 100;

    // Absence alerts
    absents.forEach(abs => {
      const sub = dbSubjects.find(s => s.id === abs.subject_id);
      notificationsList.push({
        id: `notif-abs-${abs.id}`,
        student_id: student.id,
        student_name: student.full_name,
        title: `Absence Notice: ${student.full_name}`,
        message: `${student.full_name} was marked ABSENT for ${sub?.name || 'Class'} on ${abs.date}.`,
        type: 'WARNING',
        date: abs.date,
        is_read: false,
        created_at: `${abs.date}T10:00:00Z`
      });
    });

    // Low attendance warning
    if (pct < dbSettings.min_attendance_percentage && total > 0) {
      notificationsList.push({
        id: `notif-low-${student.id}`,
        student_id: student.id,
        student_name: student.full_name,
        title: `Low Attendance Warning (${pct}% < ${dbSettings.min_attendance_percentage}%)`,
        message: `${student.full_name}'s cumulative attendance is currently ${pct}%, which is below the mandatory institutional threshold of ${dbSettings.min_attendance_percentage}%.`,
        type: 'WARNING',
        date: new Date().toISOString().split('T')[0],
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    // Monthly Report Available Notice
    notificationsList.push({
      id: `notif-rep-${student.id}`,
      student_id: student.id,
      student_name: student.full_name,
      title: `Monthly Attendance Report Ready`,
      message: `The official attendance report for ${student.full_name} (${dbSettings.academic_session}) is ready for online inspection or download.`,
      type: 'INFO',
      date: '2026-08-01',
      is_read: true,
      created_at: '2026-08-01T08:00:00Z'
    });
  });

  res.json(notificationsList);
});

// Parent submits a leave note for their linked child
app.post('/api/parent/request-leave', (req: Request, res: Response) => {
  const actor = actorFor(req);
  if (actor.role !== 'PARENT' || !parentCanAccessStudent(actor, Number(req.body.student_id))) {
    return res.status(403).json({ error: 'You may request leave only for a student linked to your parent account.' });
  }
  const { student_id, from_date, to_date, reason } = req.body;

  if (!student_id || !from_date || !to_date || !reason) {
    return res.status(400).json({ error: 'All fields (Student, From Date, To Date, Reason) are required.' });
  }

  const stu = dbStudents.find(s => s.id === Number(student_id));
  if (!stu) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const newLeave = {
    id: Date.now(),
    student_id: Number(student_id),
    from_date,
    to_date,
    reason: `[Submitted by Parent: ${actor.full_name}] - ${reason}`,
    attachment_url: '',
    attachment_name: 'Parent_Guardian_Note.pdf',
    attachment_size: '120 KB',
    status: 'PENDING' as const,
    teacher_remarks: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: new Date().toISOString(),
  };

  dbLeaveRequests.unshift(newLeave);

  logActivity(
    actor.id,
    actor.full_name,
    actor.role,
    'PARENT_LEAVE_SUBMITTED',
    `Parent ${actor.full_name} submitted leave request for ${stu.full_name} (${from_date} to ${to_date}).`
  );

  res.json({ success: true, leave: newLeave, message: 'Leave application submitted successfully for faculty verification.' });
});

// ==========================================
// 18. FEE MANAGEMENT & ONLINE PAYMENT ENGINE
// ==========================================

let dbFeeCategories = [
  { id: 1, code: 'TUI', name: 'Tuition Fee', description: 'Regular semester academic tuition and lecture instruction charges', is_recurring: true },
  { id: 2, code: 'ADM', name: 'Admission & Enrollment Fee', description: 'One-time registration and departmental admission processing', is_recurring: false },
  { id: 3, code: 'EXM', name: 'Semester Examination Fee', description: 'Internal assessments, mid-terms, and final semester evaluation', is_recurring: true },
  { id: 4, code: 'LAB', name: 'Computer Systems & AI Lab Fee', description: 'High-performance computing lab access, cloud tools, and practical experiments', is_recurring: true },
  { id: 5, code: 'LIB', name: 'Central Library & Digital Resources', description: 'Textbook lending, IEEE digital subscriptions, and research database access', is_recurring: true },
  { id: 6, code: 'SPT', name: 'Sports & Student Co-Curricular', description: 'Sports facilities, gymnasiums, and inter-college tournaments', is_recurring: true },
  { id: 7, code: 'TRN', name: 'Campus Transport Facility', description: 'Daily college bus shuttle routes across Khanpur and surrounding regions', is_recurring: true },
  { id: 8, code: 'DEV', name: 'Campus Infrastructure & Development', description: 'Smart classroom amenities, generators, and institutional development fund', is_recurring: false },
];

type FeeStructureRecord = {
  id: number;
  name: string;
  class_id?: number;
  program_id?: number;
  semester: number;
  academic_session: string;
  items: { category_id: number; category_name: string; amount: number }[];
  total_amount: number;
  due_days_limit: number;
  late_fine_amount: number;
  status: 'ACTIVE';
  created_at: string;
};

let dbFeeStructures: FeeStructureRecord[] = [
  {
    id: 1,
    name: 'BSCS - 6th Semester Standard Fee (2025-2026)',
    class_id: 1,
    program_id: 1,
    semester: 6,
    academic_session: '2025-2026',
    items: [
      { category_id: 1, category_name: 'Tuition Fee', amount: 38000 },
      { category_id: 4, category_name: 'Computer Systems & AI Lab Fee', amount: 6000 },
      { category_id: 3, category_name: 'Semester Examination Fee', amount: 4500 },
      { category_id: 5, category_name: 'Central Library & Digital Resources', amount: 2500 },
      { category_id: 6, category_name: 'Sports & Student Co-Curricular', amount: 3000 },
    ],
    total_amount: 54000,
    due_days_limit: 15,
    late_fine_amount: 1000,
    status: 'ACTIVE' as const,
    created_at: '2026-07-20T09:00:00Z',
  },
  {
    id: 2,
    name: 'BSIT - 4th Semester Standard Fee (2025-2026)',
    class_id: 3,
    program_id: 2,
    semester: 4,
    academic_session: '2025-2026',
    items: [
      { category_id: 1, category_name: 'Tuition Fee', amount: 35000 },
      { category_id: 4, category_name: 'Computer Systems & AI Lab Fee', amount: 5000 },
      { category_id: 3, category_name: 'Semester Examination Fee', amount: 4000 },
      { category_id: 5, category_name: 'Central Library & Digital Resources', amount: 2000 },
      { category_id: 6, category_name: 'Sports & Student Co-Curricular', amount: 2000 },
    ],
    total_amount: 48000,
    due_days_limit: 15,
    late_fine_amount: 1000,
    status: 'ACTIVE' as const,
    created_at: '2026-07-20T09:00:00Z',
  },
  {
    id: 3,
    name: 'BSAI - 2nd Semester Standard Fee (2025-2026)',
    class_id: 4,
    program_id: 3,
    semester: 2,
    academic_session: '2025-2026',
    items: [
      { category_id: 1, category_name: 'Tuition Fee', amount: 42000 },
      { category_id: 4, category_name: 'Computer Systems & AI Lab Fee', amount: 8000 },
      { category_id: 3, category_name: 'Semester Examination Fee', amount: 4500 },
      { category_id: 5, category_name: 'Central Library & Digital Resources', amount: 2500 },
    ],
    total_amount: 57000,
    due_days_limit: 15,
    late_fine_amount: 1200,
    status: 'ACTIVE' as const,
    created_at: '2026-07-20T09:00:00Z',
  },
];

let dbFeeDiscounts = [
  { id: 1, name: 'Principal Academic Merit Scholarship', type: 'PERCENTAGE' as const, value: 25, category: 'MERIT' as const, description: '25% concession on tuition fee for students maintaining SGPA >= 3.80', is_active: true },
  { id: 2, name: 'Kinship Sibling Concession', type: 'PERCENTAGE' as const, value: 15, category: 'KINSHIP' as const, description: '15% concession for secondary child enrolled concurrently at Alpine College', is_active: true },
  { id: 3, name: 'Need-Based Financial Assistance', type: 'FIXED' as const, value: 10000, category: 'NEED_BASED' as const, description: 'Approved flat Rs. 10,000 welfare grant by College Financial Aid Board', is_active: true },
  { id: 4, name: 'Alpine Faculty & Staff Ward Concession', type: 'PERCENTAGE' as const, value: 50, category: 'STAFF' as const, description: '50% tuition waiver for biological children of full-time faculty members', is_active: true },
];

let dbFeeInvoices = [
  {
    id: 1,
    challan_number: 'CH-2026-6A-001',
    student_id: 1,
    class_id: 1,
    semester: 6,
    fee_structure_id: 1,
    title: 'Fall 2026 Semester Regular Fee Challan',
    academic_session: '2025-2026',
    issue_date: '2026-07-25',
    due_date: '2026-08-15',
    items: [
      { name: 'Tuition Fee', amount: 38000, category: 'Tuition' },
      { name: 'Computer Systems & AI Lab Fee', amount: 6000, category: 'Lab' },
      { name: 'Semester Examination Fee', amount: 4500, category: 'Examination' },
      { name: 'Central Library & Digital Resources', amount: 2500, category: 'Library' },
      { name: 'Sports & Student Co-Curricular', amount: 3000, category: 'Sports' },
    ],
    subtotal: 54000,
    discount_amount: 0,
    discount_reason: '',
    late_fine: 0,
    total_amount: 54000,
    paid_amount: 54000,
    balance_due: 0,
    status: 'PAID' as const,
    payment_date: '2026-08-03T10:15:00Z',
    notes: 'Paid in full via Visa Platinum Online Gateway. Verified by Accounts Officer.',
    created_at: '2026-07-25T08:00:00Z',
  },
  {
    id: 2,
    challan_number: 'CH-2026-6A-002',
    student_id: 2,
    class_id: 1,
    semester: 6,
    fee_structure_id: 1,
    title: 'Fall 2026 Semester Regular Fee Challan',
    academic_session: '2025-2026',
    issue_date: '2026-07-25',
    due_date: '2026-08-15',
    items: [
      { name: 'Tuition Fee', amount: 38000, category: 'Tuition' },
      { name: 'Computer Systems & AI Lab Fee', amount: 6000, category: 'Lab' },
      { name: 'Semester Examination Fee', amount: 4500, category: 'Examination' },
      { name: 'Central Library & Digital Resources', amount: 2500, category: 'Library' },
      { name: 'Sports & Student Co-Curricular', amount: 3000, category: 'Sports' },
    ],
    subtotal: 54000,
    discount_amount: 9500,
    discount_reason: '25% Principal Academic Merit Scholarship (SGPA 3.92)',
    late_fine: 0,
    total_amount: 44500,
    paid_amount: 44500,
    balance_due: 0,
    status: 'PAID' as const,
    payment_date: '2026-08-04T14:30:00Z',
    notes: 'Paid in full via 1Link Bank Transfer (Meezan Bank Ltd). Verified.',
    created_at: '2026-07-25T08:00:00Z',
  },
  {
    id: 3,
    challan_number: 'CH-2026-6A-003',
    student_id: 3,
    class_id: 1,
    semester: 6,
    fee_structure_id: 1,
    title: 'Fall 2026 Semester Regular Fee Challan',
    academic_session: '2025-2026',
    issue_date: '2026-07-20',
    due_date: '2026-08-05',
    items: [
      { name: 'Tuition Fee', amount: 38000, category: 'Tuition' },
      { name: 'Computer Systems & AI Lab Fee', amount: 6000, category: 'Lab' },
      { name: 'Semester Examination Fee', amount: 4500, category: 'Examination' },
      { name: 'Central Library & Digital Resources', amount: 2500, category: 'Library' },
      { name: 'Sports & Student Co-Curricular', amount: 3000, category: 'Sports' },
    ],
    subtotal: 54000,
    discount_amount: 5700,
    discount_reason: '15% Kinship Concession (Sibling: Fatima Zahra Roll # CS-2022-043)',
    late_fine: 1000,
    total_amount: 49300,
    paid_amount: 25000,
    balance_due: 24300,
    status: 'OVERDUE' as const,
    payment_date: '2026-08-02T16:00:00Z',
    notes: 'Partial payment of Rs. 25,000 made via JazzCash on 2026-08-02. Due date passed (2026-08-05); late fine Rs. 1,000 added.',
    created_at: '2026-07-20T08:00:00Z',
  },
  {
    id: 4,
    challan_number: 'CH-2026-6A-004',
    student_id: 4,
    class_id: 1,
    semester: 6,
    fee_structure_id: 1,
    title: 'Fall 2026 Semester Regular Fee Challan',
    academic_session: '2025-2026',
    issue_date: '2026-08-01',
    due_date: '2026-08-25',
    items: [
      { name: 'Tuition Fee', amount: 38000, category: 'Tuition' },
      { name: 'Computer Systems & AI Lab Fee', amount: 6000, category: 'Lab' },
      { name: 'Semester Examination Fee', amount: 4500, category: 'Examination' },
      { name: 'Central Library & Digital Resources', amount: 2500, category: 'Library' },
      { name: 'Sports & Student Co-Curricular', amount: 3000, category: 'Sports' },
    ],
    subtotal: 54000,
    discount_amount: 0,
    discount_reason: '',
    late_fine: 0,
    total_amount: 54000,
    paid_amount: 0,
    balance_due: 54000,
    status: 'UNPAID' as const,
    payment_date: null as string | null,
    notes: 'Awaiting student/parent fee deposit before due date.',
    created_at: '2026-08-01T08:00:00Z',
  },
  {
    id: 5,
    challan_number: 'CH-2026-6A-005',
    student_id: 5,
    class_id: 1,
    semester: 6,
    fee_structure_id: 1,
    title: 'Fall 2026 Semester Regular Fee Challan',
    academic_session: '2025-2026',
    issue_date: '2026-08-01',
    due_date: '2026-08-25',
    items: [
      { name: 'Tuition Fee', amount: 38000, category: 'Tuition' },
      { name: 'Computer Systems & AI Lab Fee', amount: 6000, category: 'Lab' },
      { name: 'Semester Examination Fee', amount: 4500, category: 'Examination' },
      { name: 'Central Library & Digital Resources', amount: 2500, category: 'Library' },
      { name: 'Sports & Student Co-Curricular', amount: 3000, category: 'Sports' },
    ],
    subtotal: 54000,
    discount_amount: 0,
    discount_reason: '',
    late_fine: 0,
    total_amount: 54000,
    paid_amount: 27000,
    balance_due: 27000,
    status: 'PARTIALLY_PAID' as const,
    payment_date: '2026-08-05T11:20:00Z',
    notes: '1st Installment (50%) paid via Allied Bank Counter Deposit. 2nd Installment due Aug 25.',
    created_at: '2026-08-01T08:00:00Z',
  },
  {
    id: 6,
    challan_number: 'CH-2026-EX-001',
    student_id: 1,
    class_id: 1,
    semester: 6,
    fee_structure_id: 1,
    title: 'Mid-Term Examination & Practical Lab Evaluation Fee',
    academic_session: '2025-2026',
    issue_date: '2026-08-05',
    due_date: '2026-08-28',
    items: [
      { name: 'Mid-Term Examination Papers Fee', amount: 4000, category: 'Examination' },
      { name: 'External Lab Evaluation & VIVA Voce', amount: 2500, category: 'Lab' },
      { name: 'Online Practice Testing Portal License', amount: 1500, category: 'Library' },
    ],
    subtotal: 8000,
    discount_amount: 0,
    discount_reason: '',
    late_fine: 0,
    total_amount: 8000,
    paid_amount: 0,
    balance_due: 8000,
    status: 'UNPAID' as const,
    payment_date: null as string | null,
    notes: 'Mid-term departmental fee voucher.',
    created_at: '2026-08-05T12:00:00Z',
  },
];

let dbFeePayments = [
  {
    id: 1,
    transaction_id: 'TXN-ALP-20260803-0192',
    invoice_id: 1,
    challan_number: 'CH-2026-6A-001',
    student_id: 1,
    student_name: 'Muhammad Ali Khan',
    roll_number: 'CS-2022-042',
    class_name: 'BSCS - 6A',
    amount_paid: 54000,
    payment_method: 'CARD' as const,
    payment_channel: 'Visa Platinum Online Gateway',
    transaction_reference: 'AUTH-VISA-982341',
    card_last4: '4242',
    receipt_number: 'REC-2026-0041',
    paid_by_user_id: 7,
    paid_by_name: 'Mr. Tariq Khan',
    paid_by_role: 'PARENT',
    payment_date: '2026-08-03T10:15:00Z',
    payment_status: 'SUCCESS' as const,
    slip_url: '',
    notes: 'Official online automated payment cleared via 3D Secure verification.',
  },
  {
    id: 2,
    transaction_id: 'TXN-ALP-20260804-0381',
    invoice_id: 2,
    challan_number: 'CH-2026-6A-002',
    student_id: 2,
    student_name: 'Fatima Zahra',
    roll_number: 'CS-2022-043',
    class_name: 'BSCS - 6A',
    amount_paid: 44500,
    payment_method: 'BANK_TRANSFER' as const,
    payment_channel: '1Link IBFT (Meezan Bank Ltd)',
    transaction_reference: '1LNK-MEEZ-7712394',
    card_last4: '',
    receipt_number: 'REC-2026-0042',
    paid_by_user_id: 8,
    paid_by_name: 'Dr. Zahra Parveen',
    paid_by_role: 'PARENT',
    payment_date: '2026-08-04T14:30:00Z',
    payment_status: 'SUCCESS' as const,
    slip_url: '',
    notes: 'Interbank funds transfer confirmed by college accounts clearing desk.',
  },
  {
    id: 3,
    transaction_id: 'TXN-ALP-20260802-0115',
    invoice_id: 3,
    challan_number: 'CH-2026-6A-003',
    student_id: 3,
    student_name: 'Hamza Ahmed',
    roll_number: 'CS-2022-044',
    class_name: 'BSCS - 6A',
    amount_paid: 25000,
    payment_method: 'WALLET' as const,
    payment_channel: 'JazzCash Mobile Wallet',
    transaction_reference: 'JC-8839201948',
    card_last4: '',
    receipt_number: 'REC-2026-0043',
    paid_by_user_id: 8,
    paid_by_name: 'Dr. Zahra Parveen',
    paid_by_role: 'PARENT',
    payment_date: '2026-08-02T16:00:00Z',
    payment_status: 'SUCCESS' as const,
    slip_url: '',
    notes: 'Partial payment installment 1 of 2. Remaining balance Rs. 24,300 overdue.',
  },
  {
    id: 4,
    transaction_id: 'TXN-ALP-20260805-0819',
    invoice_id: 5,
    challan_number: 'CH-2026-6A-005',
    student_id: 5,
    student_name: 'Ayesha Malik',
    roll_number: 'CS-2022-046',
    class_name: 'BSCS - 6A',
    amount_paid: 27000,
    payment_method: 'CASH_CHALLAN' as const,
    payment_channel: 'Allied Bank Limited Counter Deposit',
    transaction_reference: 'ABL-KHP-889412',
    card_last4: '',
    receipt_number: 'REC-2026-0044',
    paid_by_user_id: 1,
    paid_by_name: 'Accounts Department (Officer Malik)',
    paid_by_role: 'ADMIN',
    payment_date: '2026-08-05T11:20:00Z',
    payment_status: 'SUCCESS' as const,
    slip_url: '',
    notes: 'Walk-in bank scroll verified and entered by college bursar.',
  },
];

// Helper to hydrate fee invoice with student and class details
function enrichInvoice(inv: typeof dbFeeInvoices[0]) {
  const stu = dbStudents.find(s => s.id === inv.student_id);
  const cls = dbClasses.find(c => c.id === (inv.class_id || stu?.class_id));
  const prog = dbPrograms.find(p => p.id === (cls?.program_id || stu?.program_id));

  // Auto-check late fine if due date has passed and balance remains
  const today = new Date().toISOString().split('T')[0];
  let calculatedStatus = inv.status;
  if (inv.paid_amount >= inv.total_amount && inv.total_amount > 0) {
    calculatedStatus = 'PAID';
  } else if (inv.due_date < today && inv.paid_amount < inv.total_amount) {
    calculatedStatus = 'OVERDUE';
  } else if (inv.paid_amount > 0 && inv.paid_amount < inv.total_amount) {
    calculatedStatus = 'PARTIALLY_PAID';
  } else if (inv.paid_amount === 0) {
    calculatedStatus = 'UNPAID';
  }

  return {
    ...inv,
    status: calculatedStatus,
    balance_due: Math.max(0, inv.total_amount - inv.paid_amount),
    student_name: stu?.full_name || 'Student',
    roll_number: stu?.roll_number || 'N/A',
    student_email: stu?.email || '',
    student_phone: stu?.phone || '',
    father_name: stu ? `Guardian of ${stu.full_name}` : 'Parent/Guardian',
    class_name: cls?.name || 'Class',
    program_name: prog?.name || 'Academic Program',
  };
}

// 1. Fee Executive Summary Statistics
app.get('/api/fees/summary', (req: Request, res: Response) => {
  const actor = actorFor(req);
  const allowedIds = actor.role === 'ADMIN'
    ? null
    : actor.role === 'STUDENT'
      ? new Set([getCurrentStudentRecord(actor)?.id].filter((id): id is number => typeof id === 'number'))
      : actor.role === 'PARENT'
        ? new Set(dbParentStudents.filter(link => link.parent_id === getParentRecord(actor)?.id).map(link => link.student_id))
        : new Set<number>();
  const enriched = dbFeeInvoices.filter(invoice => !allowedIds || allowedIds.has(invoice.student_id)).map(enrichInvoice);
  const total_billed = enriched.reduce((sum, inv) => sum + inv.total_amount, 0);
  const total_collected = enriched.reduce((sum, inv) => sum + inv.paid_amount, 0);
  const total_outstanding = enriched.reduce((sum, inv) => sum + inv.balance_due, 0);
  const total_overdue = enriched.filter(inv => inv.status === 'OVERDUE').reduce((sum, inv) => sum + inv.balance_due, 0);
  const collection_rate_pct = total_billed > 0 ? Math.round((total_collected / total_billed) * 100) : 0;

  // Class-wise breakdown
  const classBreakdown = (actor.role === 'ADMIN' ? dbClasses : []).map(cls => {
    const classInvoices = enriched.filter(inv => inv.class_id === cls.id);
    const billed = classInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const collected = classInvoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
    const outstanding = classInvoices.reduce((sum, inv) => sum + inv.balance_due, 0);
    const rate = billed > 0 ? Math.round((collected / billed) * 100) : 0;
    return {
      class_id: cls.id,
      class_name: cls.name,
      total_billed: billed,
      total_collected: collected,
      total_outstanding: outstanding,
      collection_rate_pct: rate,
    };
  });

  res.json({
    total_billed,
    total_collected,
    total_outstanding,
    total_overdue,
    collection_rate_pct,
    total_invoices_count: enriched.length,
    paid_invoices_count: enriched.filter(i => i.status === 'PAID').length,
    unpaid_invoices_count: enriched.filter(i => i.status === 'UNPAID').length,
    overdue_invoices_count: enriched.filter(i => i.status === 'OVERDUE').length,
    class_breakdown: classBreakdown,
  });
});

// 2. Fee Categories
app.get('/api/fees/categories', (req: Request, res: Response) => {
  if (!['ADMIN', 'STUDENT', 'PARENT'].includes(actorFor(req).role)) return res.status(403).json({ error: 'Fee account access denied.' });
  res.json(dbFeeCategories);
});

// 3. Fee Structures List & Management
app.get('/api/fees/structures', (req: Request, res: Response) => {
  const actor = actorFor(req);
  if (!['ADMIN', 'STUDENT', 'PARENT'].includes(actor.role)) return res.status(403).json({ error: 'Fee account access denied.' });
  const students = accessibleStudents(actor);
  const visibleStructures = actor.role === 'ADMIN'
    ? dbFeeStructures
    : dbFeeStructures.filter(structure => students.some(student =>
      (!structure.class_id || structure.class_id === student.class_id) &&
      (!structure.program_id || structure.program_id === student.program_id) &&
      (!structure.semester || structure.semester === student.semester)
    ));
  const result = visibleStructures.map(fs => {
    const cls = dbClasses.find(c => c.id === fs.class_id);
    const prog = dbPrograms.find(p => p.id === fs.program_id);
    return {
      ...fs,
      class_name: cls?.name || 'All Classes',
      program_name: prog?.name || 'All Programs',
    };
  });
  res.json(result);
});

app.post('/api/fees/structures', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required.' });
  const { name, class_id, program_id, semester, academic_session, items, due_days_limit = 15, late_fine_amount = 1000 } = req.body;
  if (!name || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Structure name and itemized fee heads are required.' });
  }

  const total = items.reduce((sum: number, it: any) => sum + Number(it.amount || 0), 0);
  const newStructure: FeeStructureRecord = {
    id: dbFeeStructures.length > 0 ? Math.max(...dbFeeStructures.map(s => s.id)) + 1 : 1,
    name,
    class_id: class_id ? Number(class_id) : undefined,
    program_id: program_id ? Number(program_id) : undefined,
    semester: Number(semester || 1),
    academic_session: academic_session || dbSettings.academic_session,
    items: items.map((it: any) => ({
      category_id: Number(it.category_id || 1),
      category_name: it.category_name || 'Academic Fee',
      amount: Number(it.amount || 0),
    })),
    total_amount: total,
    due_days_limit: Number(due_days_limit || 15),
    late_fine_amount: Number(late_fine_amount || 1000),
    status: 'ACTIVE' as const,
    created_at: new Date().toISOString(),
  };

  dbFeeStructures.push(newStructure);
  logActivity(currentSessionUser.id, currentSessionUser.full_name, currentSessionUser.role, 'CREATE_FEE_STRUCTURE', `Created new fee structure: ${name} (Total: Rs. ${total.toLocaleString()})`);
  res.status(201).json(newStructure);
});

app.delete('/api/fees/structures/:id', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required.' });
  const id = Number(req.params.id);
  const idx = dbFeeStructures.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Fee structure not found' });
  const removed = dbFeeStructures.splice(idx, 1)[0];
  logActivity(currentSessionUser.id, currentSessionUser.full_name, currentSessionUser.role, 'DELETE_FEE_STRUCTURE', `Deleted fee structure: ${removed.name}`);
  res.json({ success: true, message: 'Fee structure removed successfully' });
});

// 4. Discounts and Scholarships
app.get('/api/fees/discounts', (req: Request, res: Response) => {
  if (!['ADMIN', 'STUDENT', 'PARENT'].includes(actorFor(req).role)) return res.status(403).json({ error: 'Fee account access denied.' });
  res.json(dbFeeDiscounts);
});

// 5. Invoices & Challans List with Search and Filtering
app.get('/api/fees/invoices', (req: Request, res: Response) => {
  const actor = actorFor(req);
  let list = dbFeeInvoices
    .filter(invoice => canAccessInvoice(actor, invoice))
    .map(enrichInvoice);
  if (actor.role === 'TEACHER') return res.status(403).json({ error: 'Teachers do not have access to student financial records.' });
  const { class_id, status, student_id, search } = req.query;

  if (class_id && class_id !== 'ALL') {
    list = list.filter(i => i.class_id === Number(class_id));
  }
  if (status && status !== 'ALL') {
    list = list.filter(i => i.status === status);
  }
  if (student_id) {
    list = list.filter(i => i.student_id === Number(student_id));
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    list = list.filter(i =>
      i.challan_number.toLowerCase().includes(q) ||
      i.student_name.toLowerCase().includes(q) ||
      i.roll_number.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q)
    );
  }

  // Sort: Overdue & Unpaid first, then newest
  list.sort((a, b) => {
    if (a.status === 'OVERDUE' && b.status !== 'OVERDUE') return -1;
    if (b.status === 'OVERDUE' && a.status !== 'OVERDUE') return 1;
    return b.id - a.id;
  });

  res.json(list);
});

// Single Invoice
app.get('/api/fees/invoices/:id', (req: Request, res: Response) => {
  const inv = dbFeeInvoices.find(i => i.id === Number(req.params.id));
  if (!inv) return res.status(404).json({ error: 'Fee invoice / challan not found' });
  if (!canAccessInvoice(actorFor(req), inv)) return res.status(403).json({ error: 'You are not authorized to view this fee voucher.' });
  res.json(enrichInvoice(inv));
});

// Generate Fee Invoices (Single or Bulk Class)
app.post('/api/fees/invoices/generate', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required to generate fee vouchers.' });
  const { mode, class_id, student_id, fee_structure_id, title, due_date, custom_items, discount_rule_id } = req.body;

  let structure: any = null;
  if (fee_structure_id) {
    structure = dbFeeStructures.find(s => s.id === Number(fee_structure_id));
  }

  let itemsToUse: { name: string; amount: number; category: string }[] = [];
  if (Array.isArray(custom_items) && custom_items.length > 0) {
    itemsToUse = custom_items.map((ci: any) => ({
      name: ci.name,
      amount: Number(ci.amount || 0),
      category: ci.category || 'Fee',
    }));
  } else if (structure) {
    itemsToUse = structure.items.map((it: any) => ({
      name: it.category_name,
      amount: it.amount,
      category: it.category_name,
    }));
  } else {
    itemsToUse = [
      { name: 'Semester Tuition Fee', amount: 38000, category: 'Tuition' },
      { name: 'Laboratory & Systems Access', amount: 6000, category: 'Lab' },
      { name: 'Examination & Assessment', amount: 4500, category: 'Examination' },
      { name: 'Digital Library Access', amount: 2500, category: 'Library' },
    ];
  }

  const subtotal = itemsToUse.reduce((s, it) => s + it.amount, 0);

  // Target Students
  let targetStudents: typeof dbStudents = [];
  if (mode === 'SINGLE' && student_id) {
    const singleStu = dbStudents.find(s => s.id === Number(student_id));
    if (singleStu) targetStudents.push(singleStu);
  } else if (class_id) {
    targetStudents = dbStudents.filter(s => s.class_id === Number(class_id));
  } else {
    targetStudents = dbStudents.slice(0, 5);
  }

  if (targetStudents.length === 0) {
    return res.status(400).json({ error: 'No matching students found for fee generation.' });
  }

  const today = new Date().toISOString().split('T')[0];
  const finalDueDate = due_date || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
  const generated: any[] = [];

  let discountRule: any = null;
  if (discount_rule_id) {
    discountRule = dbFeeDiscounts.find(d => d.id === Number(discount_rule_id));
  }

  for (const stu of targetStudents) {
    let discountAmount = 0;
    let discountReason = '';

    if (discountRule) {
      if (discountRule.type === 'PERCENTAGE') {
        discountAmount = Math.round((subtotal * discountRule.value) / 100);
      } else {
        discountAmount = discountRule.value;
      }
      discountReason = `${discountRule.name} (${discountRule.value}${discountRule.type === 'PERCENTAGE' ? '%' : ' PKR'})`;
    }

    const total = Math.max(0, subtotal - discountAmount);
    const newId = dbFeeInvoices.length > 0 ? Math.max(...dbFeeInvoices.map(i => i.id)) + 1 : 1;
    const challanNum = `CH-${new Date().getFullYear()}-${stu.student_code.slice(-3)}-${String(newId).padStart(3, '0')}`;

    const newInvoice: any = {
      id: newId,
      challan_number: challanNum,
      student_id: stu.id,
      class_id: stu.class_id,
      semester: stu.semester || 1,
      fee_structure_id: structure?.id || 1,
      title: title || `${structure?.name || 'Academic Fee'} - Challan`,
      academic_session: structure?.academic_session || dbSettings.academic_session,
      issue_date: today,
      due_date: finalDueDate,
      items: [...itemsToUse],
      subtotal: subtotal,
      discount_amount: discountAmount,
      discount_reason: discountReason,
      late_fine: 0,
      total_amount: total,
      paid_amount: 0,
      balance_due: total,
      status: 'UNPAID' as const,
      payment_date: null,
      notes: 'Generated via Fee Management Module',
      created_at: new Date().toISOString(),
    };

    dbFeeInvoices.push(newInvoice);
    generated.push(enrichInvoice(newInvoice));

    // Send in-app notification to student
    if (stu.user_id) {
      dbNotifications.unshift({
        id: dbNotifications.length > 0 ? Math.max(...dbNotifications.map(n => n.id)) + 1 : 1,
        user_id: stu.user_id,
        title: 'New College Fee Challan Issued',
        message: `A new fee challan (${challanNum}) for Rs. ${total.toLocaleString()} has been issued. Due date: ${finalDueDate}.`,
        type: 'INFO',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    // Also notify parents linked to this student
    const parentLinks = dbParentStudents.filter(ps => ps.student_id === stu.id);
    for (const pl of parentLinks) {
      const parentUser = dbParents.find(p => p.id === pl.parent_id);
      if (parentUser && parentUser.user_id) {
        dbNotifications.unshift({
          id: dbNotifications.length > 0 ? Math.max(...dbNotifications.map(n => n.id)) + 1 : 1,
          user_id: parentUser.user_id,
          title: `Fee Challan Issued for ${stu.full_name}`,
          message: `Official Challan ${challanNum} (Rs. ${total.toLocaleString()}) issued for ${stu.full_name} (${stu.roll_number}). Due date: ${finalDueDate}.`,
          type: 'INFO',
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  logActivity(
    currentSessionUser.id,
    currentSessionUser.full_name,
    currentSessionUser.role,
    'FEE_INVOICES_GENERATED',
    `Generated ${generated.length} fee challans (Total volume: Rs. ${generated.reduce((s, i) => s + i.total_amount, 0).toLocaleString()}).`
  );

  res.status(201).json({
    success: true,
    count: generated.length,
    invoices: generated,
    message: `Successfully issued ${generated.length} fee challans.`,
  });
});

// Adjust Fee Invoice (Scholarship, Waiver, or Late Fine Adjustment)
app.post('/api/fees/invoices/:id/adjust', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required.' });
  const inv = dbFeeInvoices.find(i => i.id === Number(req.params.id));
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });

  const { discount_amount, discount_reason, late_fine, notes } = req.body;

  if (discount_amount !== undefined) {
    inv.discount_amount = Number(discount_amount);
  }
  if (discount_reason !== undefined) {
    inv.discount_reason = String(discount_reason);
  }
  if (late_fine !== undefined) {
    inv.late_fine = Number(late_fine);
  }
  if (notes !== undefined) {
    inv.notes = String(notes);
  }

  // Recalculate total and balance
  inv.total_amount = Math.max(0, inv.subtotal - inv.discount_amount + inv.late_fine);
  inv.balance_due = Math.max(0, inv.total_amount - inv.paid_amount);

  if (inv.paid_amount >= inv.total_amount && inv.total_amount > 0) {
    inv.status = 'PAID';
  } else if (inv.paid_amount > 0) {
    inv.status = 'PARTIALLY_PAID';
  }

  logActivity(
    currentSessionUser.id,
    currentSessionUser.full_name,
    currentSessionUser.role,
    'ADJUST_FEE_INVOICE',
    `Adjusted Challan ${inv.challan_number}: Total revised to Rs. ${inv.total_amount.toLocaleString()}`
  );

  res.json({ success: true, invoice: enrichInvoice(inv), message: 'Fee invoice updated successfully.' });
});

// Process Online or Manual Fee Payment
app.post('/api/fees/pay', (req: Request, res: Response) => {
  const actor = actorFor(req);
  const {
    invoice_id,
    amount_paid,
    payment_method, // 'CARD' | 'BANK_TRANSFER' | 'WALLET' | 'CASH_CHALLAN'
    payment_channel, // e.g. 'Visa / MasterCard', '1Link Meezan', 'JazzCash', 'Bank Counter'
    card_number,
    card_expiry,
    wallet_number,
    bank_account_reference,
    deposit_slip_reference,
    notes,
  } = req.body;

  const inv = dbFeeInvoices.find(i => i.id === Number(invoice_id));
  if (!inv) return res.status(404).json({ error: 'Fee invoice not found.' });
  if (!['ADMIN', 'STUDENT', 'PARENT'].includes(actor.role) || !canAccessInvoice(actor, inv)) {
    return res.status(403).json({ error: 'You are not authorized to pay this invoice.' });
  }

  const payAmount = Number(amount_paid);
  if (isNaN(payAmount) || payAmount <= 0) {
    return res.status(400).json({ error: 'Payment amount must be greater than zero.' });
  }

  const remaining = Math.max(0, inv.total_amount - inv.paid_amount);
  if (payAmount > remaining) {
    return res.status(400).json({
      error: `Payment amount (Rs. ${payAmount.toLocaleString()}) cannot exceed outstanding balance (Rs. ${remaining.toLocaleString()}).`
    });
  }

  // Generate Authoritative Identifiers
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const transactionId = `TXN-ALP-${todayStr}-${randNum}`;
  const receiptNumber = `REC-${new Date().getFullYear()}-${String(dbFeePayments.length + 1).padStart(4, '0')}`;

  let refNum = bank_account_reference || deposit_slip_reference || `AUTH-${payment_method}-${randNum}`;
  let cardLast4 = '';
  if (card_number && typeof card_number === 'string') {
    cardLast4 = card_number.replace(/\s+/g, '').slice(-4);
  } else if (wallet_number) {
    refNum = `WAL-${wallet_number.slice(-4)}-${randNum}`;
  }

  const stu = dbStudents.find(s => s.id === inv.student_id);
  const cls = dbClasses.find(c => c.id === inv.class_id);

  const paymentRecord = {
    id: dbFeePayments.length > 0 ? Math.max(...dbFeePayments.map(p => p.id)) + 1 : 1,
    transaction_id: transactionId,
    invoice_id: inv.id,
    challan_number: inv.challan_number,
    student_id: inv.student_id,
    student_name: stu?.full_name || 'Student',
    roll_number: stu?.roll_number || 'N/A',
    class_name: cls?.name || 'Class',
    amount_paid: payAmount,
    payment_method: (payment_method || 'CARD') as any,
    payment_channel: payment_channel || (payment_method === 'CARD' ? 'Visa / MasterCard' : payment_method === 'WALLET' ? 'JazzCash' : '1Link Bank Transfer'),
    transaction_reference: refNum,
    card_last4: cardLast4,
    receipt_number: receiptNumber,
    paid_by_user_id: actor.id,
    paid_by_name: actor.full_name,
    paid_by_role: actor.role,
    payment_date: new Date().toISOString(),
    payment_status: 'SUCCESS' as const,
    slip_url: '',
    notes: notes || 'Processed through Alpine College Online Payment Gateway.',
  };

  dbFeePayments.unshift(paymentRecord);

  // Update Invoice
  inv.paid_amount += payAmount;
  inv.balance_due = Math.max(0, inv.total_amount - inv.paid_amount);
  inv.payment_date = new Date().toISOString();

  if (inv.paid_amount >= inv.total_amount) {
    inv.status = 'PAID';
  } else {
    inv.status = 'PARTIALLY_PAID';
  }

  // Activity Log
  logActivity(
    actor.id,
    actor.full_name,
    actor.role,
    'FEE_PAYMENT_PROCESSED',
    `Payment of Rs. ${payAmount.toLocaleString()} received for Challan ${inv.challan_number} (${stu?.full_name}, ${stu?.roll_number}) via ${paymentRecord.payment_channel}. Receipt: ${receiptNumber}`
  );

  // In-App Notification
  if (stu?.user_id) {
    dbNotifications.unshift({
      id: dbNotifications.length > 0 ? Math.max(...dbNotifications.map(n => n.id)) + 1 : 1,
      user_id: stu.user_id,
      title: 'Fee Payment Received',
      message: `Your payment of Rs. ${payAmount.toLocaleString()} for Challan ${inv.challan_number} was successfully confirmed. Receipt: ${receiptNumber}.`,
      type: 'INFO',
      is_read: false,
      created_at: new Date().toISOString(),
    });
  }

  res.status(200).json({
    success: true,
    message: `Payment of Rs. ${payAmount.toLocaleString()} confirmed successfully. Official receipt generated.`,
    transaction_id: transactionId,
    receipt_number: receiptNumber,
    payment: paymentRecord,
    invoice: enrichInvoice(inv),
  });
});

// Payments / Transactions History
app.get('/api/fees/payments', (req: Request, res: Response) => {
  const actor = actorFor(req);
  if (actor.role === 'TEACHER') return res.status(403).json({ error: 'Teachers do not have access to student financial records.' });
  const { student_id, method, search } = req.query;
  let list = dbFeePayments.filter(payment => canAccessPayment(actor, payment));

  if (student_id) {
    list = list.filter(p => p.student_id === Number(student_id));
  }
  if (method && method !== 'ALL') {
    list = list.filter(p => p.payment_method === method);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(p =>
      p.transaction_id.toLowerCase().includes(q) ||
      p.receipt_number.toLowerCase().includes(q) ||
      (p.challan_number && p.challan_number.toLowerCase().includes(q)) ||
      (p.student_name && p.student_name.toLowerCase().includes(q)) ||
      (p.roll_number && p.roll_number.toLowerCase().includes(q))
    );
  }

  res.json(list);
});

// Parent Fee Portal: Children Fee Invoices & Balance Summary
app.get('/api/parent/fees', (req: Request, res: Response) => {
  const actor = actorFor(req);
  if (actor.role !== 'PARENT') return res.status(403).json({ error: 'Parent account required.' });
  const parentRecord = getParentRecord(actor);

  if (!parentRecord) {
    return res.json({ children_fees: [], summary: { total_outstanding: 0, total_paid: 0, count_overdue: 0 } });
  }

  const links = dbParentStudents.filter(ps => ps.parent_id === parentRecord.id);
  const authorizedStudentIds = links.map(l => l.student_id);

  // Get invoices for linked children
  const invoices = dbFeeInvoices
    .filter(inv => authorizedStudentIds.includes(inv.student_id))
    .map(enrichInvoice);

  // Group by child
  const childrenFees = links.map(link => {
    const stu = dbStudents.find(s => s.id === link.student_id);
    if (!stu) return null;
    const cls = dbClasses.find(c => c.id === stu.class_id);
    const childInvoices = invoices.filter(inv => inv.student_id === stu.id);
    const childPayments = dbFeePayments.filter(payment => payment.student_id === stu.id);
    const total_billed = childInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const total_paid = childInvoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
    const total_outstanding = childInvoices.reduce((sum, inv) => sum + inv.balance_due, 0);
    const overdueCount = childInvoices.filter(inv => inv.status === 'OVERDUE').length;

    return {
      student_id: stu.id,
      student_name: stu.full_name,
      roll_number: stu.roll_number,
      class_name: cls?.name || 'BSCS',
      avatar: stu.avatar,
      relationship: link.relationship,
      total_billed,
      total_paid,
      total_outstanding,
      overdue_count: overdueCount,
      invoices: childInvoices,
      payments: childPayments,
    };
  }).filter(Boolean);

  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balance_due, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
  const countOverdue = invoices.filter(inv => inv.status === 'OVERDUE').length;

  res.json({
    parent_name: parentRecord.full_name,
    children_fees: childrenFees,
    all_invoices: invoices,
    all_payments: dbFeePayments.filter(payment => authorizedStudentIds.includes(payment.student_id)),
    summary: {
      total_outstanding: totalOutstanding,
      total_paid: totalPaid,
      count_overdue: countOverdue,
    },
  });
});

// Send Fee Payment Reminder (In-App & Email Alert Log)
app.post('/api/fees/remind', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required.' });
  const { invoice_id } = req.body;
  const inv = dbFeeInvoices.find(i => i.id === Number(invoice_id));
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });

  const stu = dbStudents.find(s => s.id === inv.student_id);
  const cls = dbClasses.find(c => c.id === inv.class_id);

  if (stu?.user_id) {
    dbNotifications.unshift({
      id: dbNotifications.length > 0 ? Math.max(...dbNotifications.map(n => n.id)) + 1 : 1,
      user_id: stu.user_id,
      title: 'Fee Payment Reminder: ' + inv.challan_number,
      message: `Gentle reminder: Outstanding balance for ${inv.title} is Rs. ${inv.balance_due.toLocaleString()}. Due Date: ${inv.due_date}.`,
      type: 'WARNING',
      is_read: false,
      created_at: new Date().toISOString(),
    });
  }

  // Also log official email alert
  dbEmailLogs.unshift({
    id: dbEmailLogs.length > 0 ? Math.max(...dbEmailLogs.map(e => e.id)) + 1 : 1,
    student_id: inv.student_id,
    recipient_email: stu?.email || 'student@alpine.edu.pk',
    recipient_name: stu?.full_name || 'Student',
    roll_number: stu?.roll_number || 'N/A',
    subject: `Alpine College Fee Payment Notice: ${inv.challan_number}`,
    body_html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #312e81;">Alpine Degree College Khanpur</h2>
      <p>Dear ${stu?.full_name} (${stu?.roll_number}),</p>
      <p>This is an official notice regarding outstanding dues for <strong>${inv.title}</strong>.</p>
      <p>• Challan Number: <code>${inv.challan_number}</code><br/>
      • Amount Payable: <strong>Rs. ${inv.balance_due.toLocaleString()}</strong><br/>
      • Due Date: <strong>${inv.due_date}</strong></p>
      <p>Please pay via the Alpine Online Fee Portal or at any authorized bank branch.</p>
    </div>`,
    attendance_pct: 0,
    trigger_type: 'MANUAL_ALERT',
    sent_at: new Date().toISOString(),
    status: 'DELIVERED',
  });

  logActivity(
    currentSessionUser.id,
    currentSessionUser.full_name,
    currentSessionUser.role,
    'SEND_FEE_REMINDER',
    `Dispatched fee payment reminder for Challan ${inv.challan_number} to ${stu?.full_name}`
  );

  res.json({ success: true, message: `Fee reminder dispatched to ${stu?.full_name} and linked guardian.` });
});

// 17. SQL EXPORT FILE DOWNLOAD
app.get('/api/export/database.sql', (req: Request, res: Response) => {
  if (actorFor(req).role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access required.' });
  const sqlFilePath = path.join(process.cwd(), 'database', 'database.sql');
  if (fs.existsSync(sqlFilePath)) {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="database.sql"');
    return res.sendFile(sqlFilePath);
  }
  res.status(404).send('-- Database SQL file not found');
});

app.use('/api', (error: unknown, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(error);

  let status = 500;
  let message = 'Unexpected API error.';
  if (error instanceof Error) message = error.message;
  if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') {
    status = error.status;
  }

  console.error(`API request failed (${req.method} ${req.path}, ${status}):`, error);
  if (status === 413) {
    return res.status(413).json({ error: 'Request payload is too large. Reduce the image size and try again.' });
  }
  if (status >= 400 && status < 500) {
    return res.status(status).json({ error: message });
  }
  return res.status(500).json({ error: 'The server could not complete this request. Check the server log for details.' });
});

// ==========================================
// VITE MIDDLEWARE & SERVER INITIALIZATION
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  if (PORT !== 3000) {
    try {
      const secondaryServer = app.listen(3000, '0.0.0.0', () => {
        console.log(`Secondary listener active on http://0.0.0.0:3000`);
      });
      secondaryServer.on('error', (err: any) => {
        console.log('Port 3000 secondary bind note:', err.message);
      });
    } catch {
      // ignore
    }
  }
}

startServer();
