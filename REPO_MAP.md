<!-- Aider Studio repo map — auto-generated. Do not edit by hand. -->
# Repository Map

_62 files indexed · 0 summarized. Summaries, outlines (with line numbers) and metadata only — NOT file contents. To work on a file's actual code, `/read` or `/add` it by the path shown._

## .env.example
- # GEMINI_API_KEY: Required for Gemini AI API calls.

## .gitignore
- node_modules/

## bun.lock
- {

## data/auth-store.json
- {

## data/face-embeddings.json
- {"version":1,"iv":"sqqY+LBfN9llBEyb","tag":"8q/RXGGmFzUdvlLWcE2crg==","data":"s0UpF2/PoPCJIUtUZTh…

## data/face-embeddings.key
- (binary or non-text file — not indexed)

## database.sql
- -- ====================================================================

## database/database.sql
- -- ====================================================================

## index.html
- <!doctype html>

## metadata.json
- {

## package-lock.json
- {

## package.json
- {

## public/models/face_landmark_68_model-shard1
- (binary or non-text file — not indexed)

## public/models/face_landmark_68_model-weights_manifest.json
- [{"weights":[{"name":"dense0/conv0/filters","shape":[3,3,3,32],"dtype":"float32","quantization":{…

## public/models/face_recognition_model-shard1
- (large file, 6293 KB — not indexed)

## public/models/face_recognition_model-weights_manifest.json
- [{"weights":[{"name":"conv32_down/conv/filters","shape":[7,7,3,32],"dtype":"float32","quantizatio…

## public/models/tiny_face_detector_model-shard1
- (binary or non-text file — not indexed)

## public/models/tiny_face_detector_model-weights_manifest.json
- [{"weights":[{"name":"conv0/filters","shape":[3,3,3,16],"dtype":"float32","quantization":{"dtype"…

## README.md
- # 🎓 Smart Attendance Management & Institutional Analytics Platform  ·L1
- ## 🌟 Key System Modules  ·L8
- ### 1. 👁️ Live Camera Attendance Check-In  ·L10
- ### 2. 👪 Parent Portal with Multi-Child Monitoring & Alerts  ·L17
- ### 3. 📋 Classroom Registers & Institutional Operations  ·L42
- ## 🔑 Demo Access Credentials  ·L51
- ## 📸 Live Camera Attendance  ·L70
- ## 👪 How to Use the Parent Portal  ·L78
- ## 🗄️ Database Changes & MySQL Setup  ·L95
- ### New Tables Added in this Update:  ·L103

## server.ts
- const app = express();  ·L9
- const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;  ·L10
- function getGeminiClient(): GoogleGenAI | null {  ·L16
- const key = process.env.GEMINI_API_KEY;  ·L17
- type AppUser = (typeof dbUsers)[number];  ·L53
- const passwordHashes = new Map<number, string>();  ·L54
- const authSessions = new Map<string, { userId: number; expiresAt: number }>();  ·L55
- const hashPassword = (password: string, salt = randomBytes(16).toString('hex')) =>  ·L56
- const verifyPassword = (password: string, stored: string | undefined) => {  ·L58
- const actual = scryptSync(password, salt, 64);  ·L62

## src/App.tsx
- export default function App() {  ·L34
- const allowedTabsByRole: Record<User['role'], Set<string>> = {  ·L42
- const handleNavigate = (tab: string) => {  ·L65
- const handleNavigateToFaceAttendance = (student?: Student) => {  ·L75
- const root = document.documentElement;  ·L95
- const fetchAllData = async () => {  ·L122
- const unreadCount = notifications.filter(n => !n.is_read).length;  ·L172
- const handleMarkAllRead = async () => {  ·L174

## src/components/ActivityLogsModule.tsx
- interface ActivityLogsModuleProps {  ·L7
- export const ActivityLogsModule: React.FC<ActivityLogsModuleProps> = ({ activityLogs }) => {  ·L11
- const filtered = activityLogs.filter(log => {  ·L15
- const matchesSearch =  ·L16
- const matchesRole = selectedRole === 'ALL' || log.user_role === selectedRole;  ·L21
- const pagination = usePagination<ActivityLog>(filtered, JSON.stringify([searchTerm, selectedRole]));  ·L25

## src/components/AdminDashboard.tsx
- interface AdminDashboardProps {  ·L40
- export const AdminDashboard: React.FC<AdminDashboardProps> = ({  ·L50
- const lowAttendanceStudents = students.filter(s => (s.overall_attendance_pct || 100) < 75);  ·L65
- const handleAdminLeaveDecision = async (leaveId: number, status: 'APPROVED' | 'REJECTED') => {  ·L68
- const res = await fetch(`/api/leave-requests/${leaveId}`, {  ·L71
- const handleSendSingleAlert = async (student: Student) => {  ·L93
- const res = await fetch('/api/alerts/send-individual-email', {  ·L96
- const handleRunAutoScan = async () => {  ·L115
- const res = await fetch('/api/alerts/trigger-automated-emails', {  ·L118
- const data = await res.json();  ·L122

## src/components/AIAssistantModal.tsx
- interface AIAssistantProps {  ·L4
- interface Message {  ·L8
- export const AIAssistantModal: React.FC<AIAssistantProps> = ({ userRole }) => {  ·L14
- const quickPrompts =  ·L25
- const handleSend = async (textToSend?: string) => {  ·L44
- const query = textToSend || input;  ·L45
- const userMsg: Message = {  ·L48
- const res = await fetch('/api/ai/assistant', {  ·L59
- const data = await res.json();  ·L64
- const assistantMsg: Message = {  ·L66

## src/components/AnalyticsModule.tsx
- interface AnalyticsModuleProps {  ·L6
- export const AnalyticsModule: React.FC<AnalyticsModuleProps> = ({  ·L15
- const totalStudents = students.length || 1;  ·L28
- const totalRecords = attendanceRecords.length;  ·L29
- const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT').length;  ·L30
- const lateCount = attendanceRecords.filter(r => r.status === 'LATE').length;  ·L31
- const absentCount = attendanceRecords.filter(r => r.status === 'ABSENT').length;  ·L32
- const leaveCount = attendanceRecords.filter(r => r.status === 'LEAVE').length;  ·L33
- const attendanceRate = totalRecords > 0 ? Math.round(((presentCount + lateCount) / totalRecords) * 100) : 88;  ·L35
- const lowAttendanceStudents = students.map(stu => {  ·L38

## src/components/AnnouncementsModule.tsx
- interface AnnouncementsModuleProps {  ·L5
- export const AnnouncementsModule: React.FC<AnnouncementsModuleProps> = ({ userRole }) => {  ·L9
- const fetchAnnouncements = async () => {  ·L26
- const res = await fetch('/api/announcements');  ·L29
- const data = await res.json();  ·L31
- const handleCreateAnnouncement = async (e: React.FormEvent) => {  ·L45
- const res = await fetch('/api/announcements', {  ·L51
- const filtered = announcements.filter(  ·L80

## src/components/AttendanceCalculator.tsx
- interface AttendanceCalculatorProps {  ·L4
- export const AttendanceCalculator: React.FC<AttendanceCalculatorProps> = ({  ·L10
- const safeTotal = total > 0 ? total : 1;  ·L19
- const safeAttended = Math.min(attended, safeTotal);  ·L20
- const currentPct = Math.round((safeAttended / safeTotal) * 100);  ·L21

## src/components/AttendanceMarking.tsx
- interface AttendanceMarkingProps {  ·L24
- interface StudentRow {  ·L32
- export const AttendanceMarking: React.FC<AttendanceMarkingProps> = ({  ·L40
- const classSubjects = subjects.filter(s => s.class_id === selectedClass);  ·L59
- const changeDateByDays = (days: number) => {  ·L62
- const parts = attendanceDate.split('-').map(Number);  ·L63
- const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);  ·L64
- const y = dateObj.getFullYear();  ·L66
- const m = String(dateObj.getMonth() + 1).padStart(2, '0');  ·L67
- const d = String(dateObj.getDate()).padStart(2, '0');  ·L68

## src/components/AuthModal.tsx
- interface AuthModalProps {  ·L25
- export const AuthModal: React.FC<AuthModalProps> = ({  ·L32
- const handleLoginSubmit = async (e: React.FormEvent) => {  ·L66
- const res = await fetch('/api/auth/login', {  ·L73
- const data = await res.json();  ·L79
- const handleRegisterSubmit = async (e: React.FormEvent) => {  ·L93
- const res = await fetch('/api/auth/register', {  ·L104
- const data = await res.json();  ·L126
- const fillDemoAccount = (role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT') => {  ·L145

## src/components/ClassesManagement.tsx
- interface ClassesManagementProps {  ·L5
- export const ClassesManagement: React.FC<ClassesManagementProps> = ({  ·L14
- const filteredClasses = classes.filter(  ·L46
- const filteredSubjects = subjects.filter(  ·L52
- const handleCreateClass = async (e: React.FormEvent) => {  ·L59
- const res = await fetch('/api/classes', {  ·L65
- const handleCreateSubject = async (e: React.FormEvent) => {  ·L94
- const res = await fetch('/api/subjects', {  ·L100
- const classSubs = subjects.filter(s => s.class_id === cls.id);  ·L248

## src/components/CollegeLogo.tsx
- interface CollegeLogoProps {  ·L3
- export const CollegeLogo: React.FC<CollegeLogoProps> = ({  ·L9
- const sizeMap = {  ·L14
- const dimMap = {  ·L22
- const dim = dimMap[size] || 40;  ·L30

## src/components/DashboardSkeletonLoader.tsx
- export function DashboardSkeletonLoader() {  ·L3

## src/components/DepartmentsManagement.tsx
- interface DepartmentsManagementProps {  ·L5
- export const DepartmentsManagement: React.FC<DepartmentsManagementProps> = ({  ·L13
- const filteredDepts = departments.filter(  ·L40
- const filteredProgs = programs.filter(  ·L46
- const handleCreateDepartment = async (e: React.FormEvent) => {  ·L53
- const res = await fetch('/api/departments', {  ·L59
- const handleCreateProgram = async (e: React.FormEvent) => {  ·L86
- const res = await fetch('/api/programs', {  ·L92
- const deptStudents = students.filter(s => s.department_id === dept.id).length;  ·L247
- const deptTeachers = teachers.filter(t => t.department_id === dept.id).length;  ·L248

## src/components/EmailAlertsModal.tsx
- interface EmailAlertsModalProps {  ·L5
- export const EmailAlertsModal: React.FC<EmailAlertsModalProps> = ({ isOpen, onClose, students }) => {  ·L11
- const fetchEmailLogs = async () => {  ·L23
- const res = await fetch('/api/alerts/email-logs');  ·L26
- const data = await res.json();  ·L28
- const handleTriggerAutomatedScan = async () => {  ·L47
- const res = await fetch('/api/alerts/trigger-automated-emails', {  ·L50
- const data = await res.json();  ·L54
- const handleSendManualEmail = async (e: React.FormEvent) => {  ·L67
- const res = await fetch('/api/alerts/send-individual-email', {  ·L73

## src/components/FaceRecognitionAttendance.tsx
- const BIOMETRIC_ENROLLMENT_AVAILABLE = true;  ·L22
- interface FaceRecognitionAttendanceProps {  ·L24
- interface EnrolledStudent {  ·L33
- interface RecognitionResult {  ·L50
- export const FaceRecognitionAttendance: React.FC<FaceRecognitionAttendanceProps> = ({  ·L61
- const videoRef = useRef<HTMLVideoElement | null>(null);  ·L80
- const canvasRef = useRef<HTMLCanvasElement | null>(null);  ·L81
- const streamRef = useRef<MediaStream | null>(null);  ·L82
- const faceModelsLoadedRef = useRef(false);  ·L96
- const ensureFaceModelsReady = async () => {  ·L98

## src/components/FeeManagement.tsx
- interface FeeManagementProps {  ·L46
- export const FeeManagement: React.FC<FeeManagementProps> = ({ currentUser, onNavigateTo }) => {  ·L51
- const fetchAllFeeData = async () => {  ·L107
- const filteredInvoices = invoices.filter(inv => {  ·L141
- const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;  ·L142
- const matchClass = classFilter === 'ALL' || inv.class_id === Number(classFilter);  ·L143
- const q = searchQuery.toLowerCase().trim();  ·L144
- const matchSearch =  ·L145
- const invoicePagination = usePagination<FeeInvoice>(  ·L153
- const paymentPagination = usePagination<FeePayment>(payments, 'payments');  ·L157

## src/components/IdleTimeoutModal.tsx
- interface IdleTimeoutModalProps {  ·L4
- export const IdleTimeoutModal: React.FC<IdleTimeoutModalProps> = ({  ·L13
- const lastActivityRef = useRef<number>(Date.now());  ·L23
- const timerCheckRef = useRef<NodeJS.Timeout | null>(null);  ·L24
- const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);  ·L25
- const effectiveThresholdMs = demoMode ? 10 * 1000 : idleThresholdMs;  ·L27
- const resetActivity = useCallback(() => {  ·L29
- const handleStayLoggedIn = () => {  ·L38
- const handleForceLogout = () => {  ·L45
- const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];  ·L57

## src/components/LandingPage.tsx
- interface LandingPageProps {  ·L39
- export const LandingPage: React.FC<LandingPageProps> = ({  ·L49
- const isLoggedIn = Boolean(currentUser && currentUser.username);  ·L58
- const scrollToSection = (id: string) => {  ·L61
- const element = document.getElementById(id);  ·L63

## src/components/LeaveManagement.tsx
- interface LeaveManagementProps {  ·L27
- export const LeaveManagement: React.FC<LeaveManagementProps> = ({  ·L35
- const isStudent = currentUser?.role === 'STUDENT';  ·L42
- const currentStudent = currentUser ? students.find(s => s.user_id === currentUser.id || s.email.toLowerCase() === currentUser.email.toLowerCase()) : null;  ·L45
- const effectiveStudentId = currentStudent?.id || studentId || 1;  ·L46
- const fileInputRef = useRef<HTMLInputElement>(null);  ·L62
- const calculateDays = (fromDate: string, toDate: string) => {  ·L86
- const start = new Date(fromDate);  ·L88
- const end = new Date(toDate);  ·L89
- const diffTime = Math.abs(end.getTime() - start.getTime());  ·L90

## src/components/Navbar.tsx
- interface NavbarProps {  ·L27
- export const Navbar: React.FC<NavbarProps> = ({  ·L44
- const searchContainerRef = useRef<HTMLDivElement>(null);  ·L67
- const handleClickOutside = (e: MouseEvent) => {  ·L71
- const handleKeyDown = (e: KeyboardEvent) => {  ·L82
- const query = searchQuery.trim().toLowerCase();  ·L96
- const filteredStudents = query  ·L98
- const filteredTeachers = query  ·L109
- const filteredClasses = query  ·L119
- const totalResultsCount =  ·L128

## src/components/NeuralNetworkBackground.tsx
- interface NetworkNode {  ·L3
- interface Pulse {  ·L11
- export const NeuralNetworkBackground = () => {  ·L18
- const canvasRef = useRef<HTMLCanvasElement>(null);  ·L19
- const canvas = canvasRef.current;  ·L22
- const context = canvas?.getContext('2d');  ·L23
- const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');  ·L26
- const colors = () => isDark  ·L35
- const resize = () => {  ·L39
- const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);  ·L40

## src/components/NotificationCenterModule.tsx
- interface NotificationCenterModuleProps {  ·L7
- export const NotificationCenterModule: React.FC<NotificationCenterModuleProps> = ({  ·L13
- const showToast = (msg: string) => {  ·L23
- const handleMarkRead = async (id: number) => {  ·L28
- const res = await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });  ·L30
- const handleMarkAllRead = async () => {  ·L40
- const res = await fetch('/api/notifications/read-all', { method: 'PUT' });  ·L43
- const handleDelete = async (id: number) => {  ·L55
- const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });  ·L57
- const handleClearRead = async () => {  ·L67

## src/components/PaginationControls.tsx
- interface PaginationControlsProps {  ·L5
- export const PaginationControls: React.FC<PaginationControlsProps> = ({  ·L13
- const firstPage = Math.max(1, Math.min(page - 2, totalPages - 4));  ·L27
- const visiblePages = Array.from(  ·L28

## src/components/ParentManagement.tsx
- interface ParentRecord {  ·L25
- interface ParentManagementProps {  ·L49
- export const ParentManagement: React.FC<ParentManagementProps> = ({ students }) => {  ·L53
- const fetchParents = async () => {  ·L83
- const res = await fetch('/api/parents');  ·L86
- const data = await res.json();  ·L88
- const handleAddParent = async (e: React.FormEvent) => {  ·L102
- const whatsappToSend = sameAsPhone ? newPhone : newWhatsapp;  ·L107
- const res = await fetch('/api/parents', {  ·L108
- const data = await res.json();  ·L125

## src/components/ParentPortal.tsx
- interface ParentPortalProps {  ·L39
- interface LinkedChild {  ·L45
- interface ChildDetailedStats {  ·L70
- export const ParentPortal: React.FC<ParentPortalProps> = ({ currentUser, onNavigateTo, initialTab }) => {  ·L101
- const fetchParentFees = async () => {  ·L154
- const res = await fetch('/api/parent/fees');  ·L157
- const data = await res.json();  ·L159
- const fetchParentProfile = async () => {  ·L170
- const res = await fetch('/api/parent/profile');  ·L172
- const data = await res.json();  ·L174

## src/components/ReportsModule.tsx
- interface ReportsModuleProps {  ·L10
- export const ReportsModule: React.FC<ReportsModuleProps> = ({  ·L19
- const pagination = usePagination<AttendanceRecord>(  ·L46
- const totalRecords = filteredLogs.length;  ·L52
- const presentCount = filteredLogs.filter(a => a.status === 'PRESENT').length;  ·L53
- const lateCount = filteredLogs.filter(a => a.status === 'LATE').length;  ·L54
- const absentCount = filteredLogs.filter(a => a.status === 'ABSENT').length;  ·L55
- const attendanceRate = totalRecords > 0 ? Math.round(((presentCount + lateCount) / totalRecords) * 100) : 100;  ·L56
- const classObj = classes.find(c => c.id === Number(selectedClass));  ·L59
- const subjectObj = subjects.find(s => s.id === Number(selectedSubject));  ·L60

## src/components/Sidebar.tsx
- interface SidebarProps {  ·L27
- export const Sidebar: React.FC<SidebarProps> = ({  ·L35
- const adminMenuItems = [  ·L43
- const teacherMenuItems = [  ·L68
- const parentMenuItems = [  ·L86
- const studentMenuItems = [  ·L96
- const guestMenuItems = [  ·L111
- const menu =  ·L116
- const Icon = item.icon;  ·L136
- const isActive = activeTab === item.id;  ·L137

## src/components/StudentDashboard.tsx
- interface StudentDashboardProps {  ·L33
- export const StudentDashboard: React.FC<StudentDashboardProps> = ({  ·L41
- const currentStudent = currentUser  ·L51
- const overallPct = currentStudent?.overall_attendance_pct || 82;  ·L54
- const studentRecords = attendanceRecords.filter(r => r.student_id === currentStudent?.id);  ·L57
- const studentSubjectStats = subjects.map(s => {  ·L60
- const records = studentRecords.filter(r => r.subject_id === s.id);  ·L61
- const attended = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;  ·L62
- const total = Math.max(records.length, 12); // fallback  ·L63
- const pct = Math.round(((attended || 10) / total) * 100);  ·L64

## src/components/StudentManagement.tsx
- const createNextStudentIdentifier = (prefix: string, existingValues: string[]) => {  ·L27
- const existing = new Set(existingValues.map(value => value.trim().toLowerCase()));  ·L28
- interface StudentManagementProps {  ·L40
- export const StudentManagement: React.FC<StudentManagementProps> = ({  ·L49
- const filteredStudents = students.filter(s => {  ·L86
- const matchesSearch =  ·L87
- const matchesDept = !selectedDept || s.department_id === Number(selectedDept);  ·L92
- const matchesProg = !selectedProg || s.program_id === Number(selectedProg);  ·L93
- const matchesClass = !selectedClass || s.class_id === Number(selectedClass);  ·L94
- const pagination = usePagination<Student>(  ·L98

## src/components/SystemSettingsModule.tsx
- interface SystemSettingsModuleProps {  ·L5
- export const SystemSettingsModule: React.FC<SystemSettingsModuleProps> = ({  ·L10
- const handleSaveSettings = async (e: React.FormEvent) => {  ·L21

## src/components/TeacherDashboard.tsx
- interface TeacherDashboardProps {  ·L15
- export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({  ·L23
- const teacherSubjects = subjects.filter(s => s.teacher_id === currentUser?.id);  ·L30
- const pendingLeaves = leaveRequests.filter(l => l.status === 'PENDING');  ·L31

## src/components/TeacherManagement.tsx
- interface TeacherManagementProps {  ·L7
- export const TeacherManagement: React.FC<TeacherManagementProps> = ({  ·L14
- const filteredTeachers = teachers.filter(t =>  ·L38
- const pagination = usePagination<Teacher>(filteredTeachers, search);  ·L43
- const handleOpenAddModal = () => {  ·L45
- const handleSubmit = async (e: React.FormEvent) => {  ·L60
- const url = editingTeacher ? `/api/teachers/${editingTeacher.id}` : '/api/teachers';  ·L65
- const method = editingTeacher ? 'PUT' : 'POST';  ·L66
- const res = await fetch(url, {  ·L69
- const data = await res.json();  ·L75

## src/components/TimetableManagement.tsx
- interface TimetableManagementProps {  ·L5
- export const TimetableManagement: React.FC<TimetableManagementProps> = ({  ·L11
- const fetchTimetable = async () => {  ·L38
- const res = await fetch(url);  ·L43
- const data = await res.json();  ·L45
- const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday')[] = [  ·L59
- const handleAddSlot = async (e: React.FormEvent) => {  ·L68
- const res = await fetch('/api/timetable', {  ·L78
- const data = await res.json();  ·L92
- const filteredSlots = timetable.filter(t => selectedDay === 'ALL' || t.day_of_week === selectedDay);  ·L108

## src/components/UserProfileModule.tsx
- interface UserProfileModuleProps {  ·L26
- const PRESET_AVATARS = [  ·L35
- export const UserProfileModule: React.FC<UserProfileModuleProps> = ({  ·L44
- const isStudent = currentUser?.role === 'STUDENT';  ·L52
- const isTeacher = currentUser?.role === 'TEACHER';  ·L53
- const studentData = currentUser ? (students.find(s => s.email.toLowerCase() === currentUser.email.toLowerCase()) || (isStudent ? students[0] : null)) : null;  ·L54
- const teacherData = currentUser ? (teachers.find(t => t.email.toLowerCase() === currentUser.email.toLowerCase()) || (isTeacher ? teachers[0] : null)) : null;  ·L55
- const fileInputRef = useRef<HTMLInputElement>(null);  ·L57
- const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {  ·L89
- const file = e.target.files?.[0];  ·L90

## src/hooks/index.ts
- export { useResponsive } from './useResponsive';

## src/hooks/usePagination.ts
- export interface PaginationState<T> {  ·L3
- export function usePagination<T>(  ·L15
- const totalRecords = items.length;  ·L22
- const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));  ·L23
- const currentPage = Math.min(page, totalPages);  ·L24
- const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;  ·L25
- const endRecord = Math.min(currentPage * pageSize, totalRecords);  ·L26

## src/hooks/useResponsive.ts
- export interface Breakpoints {  ·L3
- export interface ResponsiveUtils extends Breakpoints {  ·L12
- const BREAKPOINT_SM = 640;  ·L36
- const BREAKPOINT_LG = 1024;  ·L37
- const BREAKPOINT_XL = 1280;  ·L38
- export function useResponsive(): ResponsiveUtils {  ·L40
- const handleResize = () => {  ·L51
- const isMobile = windowSize.width < BREAKPOINT_SM;  ·L74
- const isTablet = windowSize.width >= BREAKPOINT_SM && windowSize.width < BREAKPOINT_LG;  ·L75
- const isDesktop = windowSize.width >= BREAKPOINT_LG;  ·L76

## src/index.css
- @import "tailwindcss";

## src/main.tsx
- const rootElement = document.getElementById('root');  ·L6

## src/types.ts
- export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';  ·L1
- export interface User {  ·L3
- export interface Department {  ·L13
- export interface Program {  ·L22
- export interface ClassSection {  ·L31
- export interface Teacher {  ·L43
- export interface Student {  ·L58
- export interface Subject {  ·L84
- export interface TimetableSlot {  ·L98
- export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';  ·L113

## tsconfig.json
- {

## vite.config.ts
- import tailwindcss from '@tailwindcss/vite';
