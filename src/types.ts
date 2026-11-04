export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  full_name: string;
  status: 'ACTIVE' | 'INACTIVE';
  avatar: string;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  description: string;
  student_count?: number;
  teacher_count?: number;
}

export interface Program {
  id: number;
  department_id: number;
  department_name?: string;
  code: string;
  name: string;
  duration_years: number;
}

export interface ClassSection {
  id: number;
  program_id: number;
  program_name?: string;
  name: string; // e.g. "BSCS - 6A"
  semester: number;
  section: string;
  academic_session: string;
  batch: string;
  student_count?: number;
}

export interface Teacher {
  id: number;
  user_id: number;
  teacher_code: string;
  full_name: string;
  email: string;
  phone: string;
  department_id: number;
  department_name?: string;
  designation: string;
  status: 'ACTIVE' | 'INACTIVE';
  avatar: string;
  assigned_subjects_count?: number;
}

export interface Student {
  id: number;
  user_id: number;
  student_code: string;
  roll_number: string;
  full_name: string;
  email: string;
  phone: string;
  guardian_phone?: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
  department_id: number;
  department_name?: string;
  program_id: number;
  program_name?: string;
  class_id: number;
  class_name?: string;
  semester: number;
  batch: string;
  status: 'ACTIVE' | 'INACTIVE';
  avatar: string;
  overall_attendance_pct?: number;
  is_face_enrolled?: boolean;
  face_sample_count?: number;
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  credit_hours: number;
  department_id: number;
  department_name?: string;
  class_id: number;
  class_name?: string;
  teacher_id: number;
  teacher_name?: string;
  semester: number;
}

export interface TimetableSlot {
  id: number;
  class_id: number;
  class_name?: string;
  subject_id: number;
  subject_name?: string;
  subject_code?: string;
  teacher_id: number;
  teacher_name?: string;
  day_of_week: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  start_time: string;
  end_time: string;
  room_number: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';

export interface AttendanceRecord {
  id: number;
  student_id: number;
  student_name?: string;
  roll_number?: string;
  teacher_id: number | null;
  teacher_name?: string;
  class_id: number;
  class_name?: string;
  subject_id: number | null;
  subject_name?: string;
  date: string;
  time: string;
  status: AttendanceStatus;
  remarks: string;
  method?: 'MANUAL' | 'FACE_RECOGNITION' | 'CAMERA_CHECK_IN';
  confidence_score?: number;
}

export interface LeaveRequest {
  id: number;
  student_id: number;
  student_name?: string;
  roll_number?: string;
  class_name?: string;
  from_date: string;
  to_date: string;
  reason: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  teacher_remarks?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'WARNING' | 'INFO' | 'LEAVE' | 'ANNOUNCEMENT';
  is_read: boolean;
  created_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  description: string;
  target_audience: 'ALL' | 'STUDENTS' | 'TEACHERS' | 'CLASS' | 'DEPARTMENT';
  target_id?: number;
  publish_date: string;
  expiry_date: string;
  status: 'ACTIVE' | 'EXPIRED';
  created_at: string;
}

export interface ActivityLog {
  id: number;
  user_id?: number;
  user_name: string;
  user_role: string;
  action: string;
  description: string;
  ip_address: string;
  created_at: string;
}

export interface InstitutionSetting {
  id?: number;
  setting_key: string;
  setting_value: string;
  description?: string;
}

export interface SystemSettings {
  institution_name: string;
  min_attendance_percentage: number;
  attendance_edit_days: number;
  academic_session: string;
}

export interface AttendanceSummaryStats {
  total_students: number;
  total_teachers: number;
  total_classes: number;
  total_subjects: number;
  today_attendance_pct: number;
  present_today: number;
  absent_today: number;
  late_today: number;
  pending_leave_requests: number;
  low_attendance_students_count: number;
}

export interface LowAttendanceStudent {
  student_id: number;
  student_name: string;
  roll_number: string;
  class_name: string;
  subject_id?: number;
  subject_name?: string;
  total_classes: number;
  attended_classes: number;
  attendance_pct: number;
  needed_to_reach_target: number;
}

export interface EmailLog {
  id: number;
  student_id: number;
  recipient_email: string;
  recipient_name: string;
  roll_number: string;
  subject: string;
  body_html: string;
  attendance_pct: number;
  trigger_type: 'AUTOMATED_THRESHOLD' | 'MANUAL_ALERT' | 'ATTENDANCE_UPDATE';
  sent_at: string;
  status: 'DELIVERED' | 'FAILED' | 'PENDING';
}

export interface FaceEmbedding {
  id: number;
  student_id: number;
  student_name?: string;
  roll_number?: string;
  class_name?: string;
  sample_count: number;
  enrolled_by_user_id: number;
  enrolled_by_name?: string;
  consent_obtained: boolean;
  liveness_score_enrolled: number;
  created_at: string;
  updated_at: string;
  avatar?: string;
}

export interface Parent {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  whatsapp_number?: string;
  cnic?: string;
  occupation?: string;
  address?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  avatar?: string;
}

export interface ParentStudentRelation {
  id: number;
  parent_id: number;
  student_id: number;
  relationship: string;
  is_primary: boolean;
  student_name?: string;
  roll_number?: string;
  class_name?: string;
  avatar?: string;
  created_at: string;
}

export interface SubjectAttendanceStat {
  subject_id: number;
  subject_name: string;
  subject_code: string;
  teacher_name: string;
  total_classes: number;
  attended_classes: number;
  absent_classes: number;
  late_classes: number;
  percentage: number;
}

export interface ParentChildAttendanceStats {
  student: Student;
  relationship: string;
  total_sessions: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  leave_days: number;
  attendance_percentage: number;
  status_today?: AttendanceStatus | 'NO_CLASS';
  today_time?: string;
  subject_wise: SubjectAttendanceStat[];
  recent_records: AttendanceRecord[];
}

export type FeeInvoiceStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'REFUNDED';
export type PaymentMethod = 'CARD' | 'BANK_TRANSFER' | 'WALLET' | 'CASH_CHALLAN';

export interface FeeCategory {
  id: number;
  code: string;
  name: string;
  description: string;
  is_recurring: boolean;
}

export interface FeeStructureItem {
  category_id: number;
  category_name: string;
  amount: number;
}

export interface FeeStructure {
  id: number;
  name: string;
  class_id?: number;
  class_name?: string;
  program_id?: number;
  program_name?: string;
  semester: number;
  academic_session: string;
  items: FeeStructureItem[];
  total_amount: number;
  due_days_limit: number;
  late_fine_amount: number;
  status: 'ACTIVE' | 'ARCHIVED';
  created_at: string;
}

export interface FeeInvoiceItem {
  name: string;
  amount: number;
  category?: string;
}

export interface FeeInvoice {
  id: number;
  challan_number: string;
  student_id: number;
  student_name?: string;
  roll_number?: string;
  student_email?: string;
  student_phone?: string;
  father_name?: string;
  class_id: number;
  class_name?: string;
  program_name?: string;
  semester: number;
  fee_structure_id?: number;
  title: string;
  academic_session: string;
  issue_date: string;
  due_date: string;
  items: FeeInvoiceItem[];
  subtotal: number;
  discount_amount: number;
  discount_reason?: string;
  late_fine: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: FeeInvoiceStatus;
  payment_date?: string;
  notes?: string;
  created_at: string;
}

export interface FeePayment {
  id: number;
  transaction_id: string;
  invoice_id: number;
  challan_number?: string;
  student_id: number;
  student_name?: string;
  roll_number?: string;
  class_name?: string;
  amount_paid: number;
  payment_method: PaymentMethod;
  payment_channel: string; // e.g. "Visa / Mastercard", "1Link HBL", "JazzCash", "Bank Counter Deposit"
  transaction_reference: string;
  card_last4?: string;
  receipt_number: string;
  paid_by_user_id?: number;
  paid_by_name: string;
  paid_by_role: string;
  payment_date: string;
  payment_status: 'SUCCESS' | 'PENDING_VERIFICATION' | 'FAILED';
  slip_url?: string;
  notes?: string;
}

export interface FeeDiscountRule {
  id: number;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  category: 'MERIT' | 'NEED_BASED' | 'KINSHIP' | 'STAFF' | 'SPORTS';
  description: string;
  is_active: boolean;
}

export interface FeeSummaryStats {
  total_billed: number;
  total_collected: number;
  total_outstanding: number;
  total_overdue: number;
  collection_rate_pct: number;
  total_invoices_count: number;
  paid_invoices_count: number;
  unpaid_invoices_count: number;
  overdue_invoices_count: number;
  class_breakdown: {
    class_id: number;
    class_name: string;
    total_billed: number;
    total_collected: number;
    total_outstanding: number;
    collection_rate_pct: number;
  }[];
}
