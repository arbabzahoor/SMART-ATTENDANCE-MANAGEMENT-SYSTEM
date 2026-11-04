import React, { useState, useEffect } from 'react';
import { User, Student, Teacher, Department, Program, ClassSection, Subject, LeaveRequest, NotificationItem, ActivityLog, InstitutionSetting, AttendanceRecord } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AdminDashboard } from './components/AdminDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { StudentManagement } from './components/StudentManagement';
import { TeacherManagement } from './components/TeacherManagement';
import { AttendanceMarking } from './components/AttendanceMarking';
import { AttendanceCalculator } from './components/AttendanceCalculator';
import { AIAssistantModal } from './components/AIAssistantModal';
import { LeaveManagement } from './components/LeaveManagement';
import { ReportsModule } from './components/ReportsModule';
import { SystemSettingsModule } from './components/SystemSettingsModule';
import { DepartmentsManagement } from './components/DepartmentsManagement';
import { ClassesManagement } from './components/ClassesManagement';
import { TimetableManagement } from './components/TimetableManagement';
import { AnalyticsModule } from './components/AnalyticsModule';
import { AnnouncementsModule } from './components/AnnouncementsModule';
import { ActivityLogsModule } from './components/ActivityLogsModule';
import { NotificationCenterModule } from './components/NotificationCenterModule';
import { UserProfileModule } from './components/UserProfileModule';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { IdleTimeoutModal } from './components/IdleTimeoutModal';
import { DashboardSkeletonLoader } from './components/DashboardSkeletonLoader';
import { FaceRecognitionAttendance } from './components/FaceRecognitionAttendance';
import { ParentPortal } from './components/ParentPortal';
import { ParentManagement } from './components/ParentManagement';
import { FeeManagement } from './components/FeeManagement';
import { NeuralNetworkBackground } from './components/NeuralNetworkBackground';

export default function App() {
  // Current logged in user state (Starts unauthenticated on Landing Page)
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [activeTab, setActiveTab] = useState<string>('landing');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [targetStudentForAttendance, setTargetStudentForAttendance] = useState<Student | null>(null);

  const allowedTabsByRole: Record<User['role'], Set<string>> = {
    ADMIN: new Set([
      'landing', 'dashboard', 'face-attendance', 'attendance', 'students', 'parents-management',
      'fees', 'parent-portal', 'teachers', 'departments', 'classes', 'timetable', 'analytics',
      'calculator', 'leave', 'reports', 'ai-assistant', 'notifications', 'announcements',
      'activity-logs', 'profile', 'settings',
    ]),
    TEACHER: new Set([
      'landing', 'dashboard', 'face-attendance', 'attendance', 'my-classes', 'parent-portal',
      'timetable', 'analytics', 'calculator', 'leave', 'reports', 'ai-assistant',
      'notifications', 'announcements', 'profile',
    ]),
    STUDENT: new Set([
      'landing', 'dashboard', 'face-attendance', 'my-attendance', 'my-fees', 'my-timetable',
      'calculator', 'leave', 'ai-assistant', 'notifications', 'announcements', 'profile',
    ]),
    PARENT: new Set([
      'landing', 'dashboard', 'parent-portal', 'child-attendance', 'parent-fees',
      'notifications', 'announcements', 'profile',
    ]),
  };

  // Navigation Guard: Open auth modal if unauthenticated user tries to access internal features
  const handleNavigate = (tab: string) => {
    if (!currentUser && tab !== 'landing') {
      setIsAuthModalOpen(true);
    } else if (currentUser && !allowedTabsByRole[currentUser.role].has(tab)) {
      setActiveTab(currentUser.role === 'PARENT' ? 'parent-portal' : 'dashboard');
    } else {
      setActiveTab(tab);
    }
  };

  const handleNavigateToFaceAttendance = (student?: Student) => {
    if (!currentUser || !allowedTabsByRole[currentUser.role].has('face-attendance')) {
      handleNavigate('face-attendance');
      return;
    }
    if (student) {
      setTargetStudentForAttendance(student);
    }
    setActiveTab('face-attendance');
  };

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.error('Could not persist the selected theme:', error);
    }
  }, [theme]);

  // Master Entity States
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<InstitutionSetting[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  const [loading, setLoading] = useState(true);

  // Fetch all database state
  const fetchAllData = async () => {
    try {
      const [
        stuRes,
        tchRes,
        deptRes,
        progRes,
        clsRes,
        subRes,
        leaveRes,
        notifRes,
        logsRes,
        settRes,
        attRes
      ] = await Promise.all([
        fetch('/api/students').then(r => r.json()),
        fetch('/api/teachers').then(r => r.json()),
        fetch('/api/departments').then(r => r.json()),
        fetch('/api/programs').then(r => r.json()),
        fetch('/api/classes').then(r => r.json()),
        fetch('/api/subjects').then(r => r.json()),
        fetch('/api/leave-requests').then(r => r.json()),
        fetch('/api/notifications').then(r => r.json()),
        fetch('/api/activity-logs').then(r => r.json()),
        fetch('/api/settings').then(r => r.json()),
        fetch('/api/attendance?limit=100').then(r => r.json()),
      ]);

      setStudents(Array.isArray(stuRes) ? stuRes : []);
      setTeachers(Array.isArray(tchRes) ? tchRes : []);
      setDepartments(Array.isArray(deptRes) ? deptRes : []);
      setPrograms(Array.isArray(progRes) ? progRes : []);
      setClasses(Array.isArray(clsRes) ? clsRes : []);
      setSubjects(Array.isArray(subRes) ? subRes : []);
      setLeaveRequests(Array.isArray(leaveRes) ? leaveRes : []);
      setNotifications(Array.isArray(notifRes) ? notifRes : (notifRes?.notifications || []));
      setActivityLogs(Array.isArray(logsRes) ? logsRes : []);
      setSettings(Array.isArray(settRes) ? settRes : []);
      setAttendanceRecords(Array.isArray(attRes) ? attRes : []);
    } catch (err) {
      console.error('Error loading backend dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app-root min-h-screen bg-[#FAFAF9] text-[#292524] font-sans flex flex-col selection:bg-[#3F8F72] selection:text-white">
      <NeuralNetworkBackground />

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllRead}
        onOpenSettings={() => handleNavigate('settings')}
        onOpenProfile={() => handleNavigate('profile')}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={() => {
          setCurrentUser(null);
          setActiveTab('landing');
        }}
        onNavigateTo={handleNavigate}
        students={students}
        teachers={teachers}
        classes={classes}
        theme={theme}
        onToggleTheme={() => setTheme(current => current === 'light' ? 'dark' : 'light')}
      />

      <div className="app-shell-layout flex-1 flex overflow-hidden">
        
        {/* Navigation Sidebar */}
        <Sidebar
          userRole={currentUser?.role || null}
          activeTab={activeTab}
          onSelectTab={handleNavigate}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          unreadCount={unreadCount}
        />

        {/* Main Content Viewport */}
        <main className="app-main flex-1 overflow-y-auto p-6 sm:p-8 bg-[#FAFAF9] text-[#292524]">
          
          {loading ? (
            <DashboardSkeletonLoader />
          ) : !currentUser || activeTab === 'landing' ? (
            /* Home Landing Page (Public Institutional Overview for Guests & Logged In Users) */
            <LandingPage
              currentUser={currentUser}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onNavigateTo={handleNavigate}
              studentCount={students.length || 1250}
              teacherCount={teachers.length || 48}
              departmentCount={departments.length || 6}
              classCount={classes.length || 24}
            />
          ) : (
            <>
              {/* Dashboards (Only accessible when logged in) */}
              {activeTab === 'dashboard' && currentUser?.role === 'ADMIN' && (
                <AdminDashboard
                  students={students}
                  teachers={teachers}
                  classes={classes}
                  subjects={subjects}
                  leaveRequests={leaveRequests}
                  activityLogs={activityLogs}
                  onNavigateTo={handleNavigate}
                />
              )}

              {activeTab === 'dashboard' && currentUser?.role === 'TEACHER' && currentUser && (
                <TeacherDashboard
                  currentUser={currentUser}
                  subjects={subjects}
                  classes={classes}
                  leaveRequests={leaveRequests}
                  onNavigateTo={handleNavigate}
                />
              )}

              {activeTab === 'dashboard' && currentUser?.role === 'STUDENT' && currentUser && (
                <StudentDashboard
                  currentUser={currentUser}
                  students={students}
                  subjects={subjects}
                  attendanceRecords={attendanceRecords}
                  onNavigateTo={handleNavigate}
                />
              )}

              {/* Parent Portal Dashboard */}
              {((activeTab === 'dashboard' && currentUser?.role === 'PARENT') || activeTab === 'parent-portal' || activeTab === 'child-attendance' || activeTab === 'parent-fees') && (
                <ParentPortal
                  currentUser={currentUser}
                  onNavigateTo={handleNavigate}
                  initialTab={activeTab === 'parent-fees' ? 'FEES' : activeTab === 'child-attendance' ? 'HISTORY' : 'OVERVIEW'}
                />
              )}

              {/* Student Management */}
              {(activeTab === 'students' || activeTab === 'my-attendance') && (
                <StudentManagement
                  students={students}
                  departments={departments}
                  programs={programs}
                  classes={classes}
                  onRefresh={fetchAllData}
                  onNavigateToFaceAttendance={handleNavigateToFaceAttendance}
                />
              )}

              {/* Teacher Management */}
              {activeTab === 'teachers' && (
                <TeacherManagement
                  teachers={teachers}
                  departments={departments}
                  subjects={subjects}
                  onRefresh={fetchAllData}
                />
              )}

              {/* Departments & Programs */}
              {activeTab === 'departments' && (
                <DepartmentsManagement
                  departments={departments}
                  programs={programs}
                  students={students}
                  teachers={teachers}
                  onRefresh={fetchAllData}
                />
              )}

              {/* Classes & Subjects */}
              {(activeTab === 'classes' || activeTab === 'my-classes') && (
                <ClassesManagement
                  classes={classes}
                  subjects={subjects}
                  programs={programs}
                  departments={departments}
                  teachers={teachers}
                  onRefresh={fetchAllData}
                />
              )}

              {/* Timetable */}
              {(activeTab === 'timetable' || activeTab === 'my-timetable') && (
                <TimetableManagement
                  classes={classes}
                  subjects={subjects}
                  teachers={teachers}
                />
              )}

              {/* Attendance Analytics */}
              {activeTab === 'analytics' && (
                <AnalyticsModule
                  students={students}
                  attendanceRecords={attendanceRecords}
                  departments={departments}
                  subjects={subjects}
                  classes={classes}
                  onRefresh={fetchAllData}
                />
              )}

              {/* Announcements */}
              {activeTab === 'announcements' && (
                <AnnouncementsModule userRole={currentUser?.role || 'STUDENT'} />
              )}

              {/* Activity Audit Logs */}
              {activeTab === 'activity-logs' && (
                <ActivityLogsModule activityLogs={activityLogs} />
              )}

              {/* AI Face Recognition Attendance */}
              {(activeTab === 'face-attendance' || activeTab === 'face-enrollment') && (
                <FaceRecognitionAttendance
                  currentUser={currentUser}
                  classes={classes}
                  subjects={subjects}
                  students={students}
                  initialTargetStudent={targetStudentForAttendance}
                  onAttendanceMarked={fetchAllData}
                />
              )}

              {/* Attendance Marking (Manual) */}
              {activeTab === 'attendance' && (
                <AttendanceMarking
                  currentUser={currentUser}
                  classes={classes}
                  subjects={subjects}
                  onSaveSuccess={fetchAllData}
                  onNavigateToFaceAttendance={() => setActiveTab('face-attendance')}
                />
              )}

              {/* Parents & Guardians Management */}
              {activeTab === 'parents-management' && (
                <ParentManagement students={students} />
              )}

              {/* Fee Management & Accounts (Admin & Students) */}
              {(activeTab === 'fees' || activeTab === 'my-fees') && (
                <FeeManagement
                  currentUser={currentUser}
                  onNavigateTo={handleNavigate}
                />
              )}

              {/* Attendance Calculator */}
              {activeTab === 'calculator' && (
                <AttendanceCalculator defaultAttended={18} defaultTotal={24} minThreshold={75} />
              )}

              {/* AI Assistant */}
              {activeTab === 'ai-assistant' && (
                <AIAssistantModal userRole={currentUser?.role || 'STUDENT'} />
              )}

              {/* Leave Requests */}
              {activeTab === 'leave' && (
                <LeaveManagement
                  currentUser={currentUser}
                  leaveRequests={leaveRequests}
                  onRefresh={fetchAllData}
                  studentId={students.find(s => s.user_id === currentUser?.id || (currentUser?.email && s.email.toLowerCase() === currentUser.email.toLowerCase()))?.id || 1}
                  students={students}
                />
              )}

              {/* Reports */}
              {activeTab === 'reports' && (
                <ReportsModule
                  departments={departments}
                  programs={programs}
                  classes={classes}
                  subjects={subjects}
                  students={students}
                  attendanceRecords={attendanceRecords}
                />
              )}

              {/* Settings */}
              {activeTab === 'settings' && (
                <SystemSettingsModule settings={settings} onRefresh={fetchAllData} />
              )}

              {/* Notifications Center View */}
              {activeTab === 'notifications' && (
                <NotificationCenterModule
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onRefresh={fetchAllData}
                />
              )}

              {/* Account / User Profile View (Available for All Authenticated Roles) */}
              {activeTab === 'profile' && (
                <UserProfileModule
                  currentUser={currentUser}
                  students={students}
                  teachers={teachers}
                  subjects={subjects}
                  onRefresh={fetchAllData}
                  onUpdateUser={(usr) => setCurrentUser(usr)}
                />
              )}
            </>
          )}

        </main>
      </div>

      {/* Auth Modal (Sign In / Registration Portal) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setActiveTab(user.role === 'PARENT' ? 'parent-portal' : 'dashboard');
          fetchAllData();
        }}
        classes={classes}
      />

      {/* Security Idle Timeout Protection (15-Minute Inactivity Monitoring) */}
      <IdleTimeoutModal
        isLoggedIn={Boolean(currentUser && !isAuthModalOpen)}
        onLogout={() => {
          setActiveTab('landing');
          setIsAuthModalOpen(true);
        }}
        idleThresholdMs={15 * 60 * 1000} // 15 minutes of inactivity
        warningCountdownSec={60} // 60 seconds warning countdown before automatic logout
      />

    </div>
  );
}
