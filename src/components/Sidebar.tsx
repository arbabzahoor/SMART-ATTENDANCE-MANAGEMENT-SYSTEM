import React from 'react';
import { Role } from '../types';
import {
  Home,
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Bell,
  Megaphone,
  History,
  Settings,
  User,
  Calculator,
  Bot,
  LogIn,
  ScanFace,
  UserCheck,
  CreditCard
} from 'lucide-react';

interface SidebarProps {
  userRole?: Role | null;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuthModal?: () => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userRole,
  activeTab,
  onSelectTab,
  onOpenAuthModal,
  unreadCount = 0
}) => {
  // Navigation menu definitions for each role
  const adminMenuItems = [
    { id: 'landing', label: 'Home Overview', icon: Home },
    { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'face-attendance', label: 'Face Recognition Attendance', icon: ScanFace, badge: 'AI' },
    { id: 'attendance', label: 'Manual Attendance', icon: CheckCircle2 },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'parents-management', label: 'Parents & Guardians', icon: Users },
    { id: 'fees', label: 'Fee Management & Accounts', icon: CreditCard, badge: 'Accounts' },
    { id: 'parent-portal', label: 'Parent Portal View', icon: LayoutDashboard },
    { id: 'teachers', label: 'Teachers', icon: Users },
    { id: 'departments', label: 'Departments & Programs', icon: Building2 },
    { id: 'classes', label: 'Classes & Subjects', icon: BookOpen },
    { id: 'timetable', label: 'Timetable', icon: Calendar },
    { id: 'analytics', label: 'Attendance Analytics', icon: Clock },
    { id: 'calculator', label: 'Attendance Calculator', icon: Calculator },
    { id: 'leave', label: 'Leave Requests', icon: FileText },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'ai-assistant', label: 'AI Attendance Assistant', icon: Bot, badge: 'AI' },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: unreadCount },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'activity-logs', label: 'Activity Audit Logs', icon: History },
    { id: 'profile', label: 'My Admin Profile', icon: User },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  const teacherMenuItems = [
    { id: 'landing', label: 'Home Overview', icon: Home },
    { id: 'dashboard', label: 'Teacher Dashboard', icon: LayoutDashboard },
    { id: 'face-attendance', label: 'Face Recognition Attendance', icon: ScanFace, badge: 'AI' },
    { id: 'attendance', label: 'Manual Attendance', icon: CheckCircle2 },
    { id: 'my-classes', label: 'My Classes & Subjects', icon: BookOpen },
    { id: 'parent-portal', label: 'Parent Portal View', icon: LayoutDashboard },
    { id: 'timetable', label: 'My Timetable', icon: Calendar },
    { id: 'analytics', label: 'Class Analytics', icon: Clock },
    { id: 'calculator', label: 'Attendance Calculator', icon: Calculator },
    { id: 'leave', label: 'Leave Requests', icon: FileText },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, badge: 'AI' },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: unreadCount },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'profile', label: 'My Faculty Profile', icon: User },
  ];

  const parentMenuItems = [
    { id: 'landing', label: 'Home Overview', icon: Home },
    { id: 'parent-portal', label: 'Parent Dashboard', icon: LayoutDashboard },
    { id: 'child-attendance', label: 'Child Attendance & Reports', icon: CheckCircle2 },
    { id: 'parent-fees', label: 'Fee Portal & Online Pay', icon: CreditCard, badge: 'Pay Dues' },
    { id: 'notifications', label: 'Absence Alerts', icon: Bell, count: unreadCount },
    { id: 'announcements', label: 'College Notice Board', icon: Megaphone },
    { id: 'profile', label: 'My Guardian Profile', icon: User },
  ];

  const studentMenuItems = [
    { id: 'landing', label: 'Home Overview', icon: Home },
    { id: 'dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
    { id: 'face-attendance', label: 'Live Camera Attendance', icon: ScanFace, badge: 'Face AI' },
    { id: 'my-attendance', label: 'My Attendance Records', icon: CheckCircle2 },
    { id: 'my-fees', label: 'My Fee Challans', icon: CreditCard },
    { id: 'my-timetable', label: 'My Class Timetable', icon: Calendar },
    { id: 'calculator', label: 'Attendance Calculator', icon: Calculator },
    { id: 'leave', label: 'Submit Leave Request', icon: FileText },
    { id: 'ai-assistant', label: 'AI Attendance Assistant', icon: Bot, badge: 'AI' },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: unreadCount },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'profile', label: 'My Student Profile', icon: User },
  ];

  const guestMenuItems = [
    { id: 'landing', label: 'Home Overview', icon: Home },
    { id: 'login', label: 'Sign In / Account Login', icon: LogIn, action: 'open_auth' },
  ];

  const menu =
    userRole === 'ADMIN'
      ? adminMenuItems
      : userRole === 'TEACHER'
      ? teacherMenuItems
      : userRole === 'PARENT'
      ? parentMenuItems
      : userRole === 'STUDENT'
      ? studentMenuItems
      : guestMenuItems;

  return (
    <aside className="app-sidebar w-64 bg-white text-[#292524] border-r border-[#E7E5E4] flex flex-col justify-between p-3 min-h-[calc(100vh-60px)] shrink-0 select-none">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-[#A8A29E] uppercase tracking-wider">
          {userRole ? `${userRole} Portal Menu` : 'Public Portal Menu'}
        </div>

        <nav className="app-sidebar-nav space-y-1">
          {menu.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={`nav-${item.id}-${index}`}
                onClick={() => {
                  if ((item as any).action === 'open_auth') {
                    if (onOpenAuthModal) onOpenAuthModal();
                  } else {
                    onSelectTab(item.id);
                  }
                }}
                className={`app-sidebar-link w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#EAF5F0] text-[#3F8F72] font-bold border-l-3 border-[#3F8F72]'
                    : 'text-[#57534E] hover:text-[#292524] hover:bg-[#F5F5F4]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#3F8F72]' : 'text-[#78716C]'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    isActive 
                      ? 'bg-[#3F8F72] text-white border-[#3F8F72]' 
                      : 'bg-[#F5F5F4] text-[#78716C] border-[#E7E5E4]'
                  }`}>
                    {item.badge}
                  </span>
                )}

                {item.count && item.count > 0 ? (
                  <span className="bg-[#D95C5C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {item.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
