import React, { useState, useRef, useEffect } from 'react';
import { User, NotificationItem, Student, Teacher, ClassSection } from '../types';
import { CollegeLogo } from './CollegeLogo';
import { 
  Bell, 
  Search, 
  User as UserIcon, 
  GraduationCap, 
  UserCheck, 
  LogOut, 
  Settings as SettingsIcon,
  CheckCircle,
  AlertTriangle,
  Info,
  Calendar,
  X,
  BookOpen,
  Building2,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  LogIn
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenAuthModal?: () => void;
  onLogout: () => void;
  onNavigateTo: (page: string) => void;
  students?: Student[];
  teachers?: Teacher[];
  classes?: ClassSection[];
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  notifications,
  unreadCount,
  onMarkAllRead,
  onOpenSettings,
  onOpenProfile,
  onOpenAuthModal,
  onLogout,
  onNavigateTo,
  students = [],
  teachers = [],
  classes = [],
  theme = 'light',
  onToggleTheme
}) => {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<'ALL' | 'STUDENTS' | 'TEACHERS' | 'CLASSES'>('ALL');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter logic
  const query = searchQuery.trim().toLowerCase();

  const filteredStudents = query
    ? students.filter(s =>
        s.full_name?.toLowerCase().includes(query) ||
        s.roll_number?.toLowerCase().includes(query) ||
        s.student_code?.toLowerCase().includes(query) ||
        s.class_name?.toLowerCase().includes(query) ||
        s.department_name?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query)
      )
    : [];

  const filteredTeachers = query
    ? teachers.filter(t =>
        t.full_name?.toLowerCase().includes(query) ||
        t.teacher_code?.toLowerCase().includes(query) ||
        t.department_name?.toLowerCase().includes(query) ||
        t.designation?.toLowerCase().includes(query) ||
        t.email?.toLowerCase().includes(query)
      )
    : [];

  const filteredClasses = query
    ? classes.filter(c =>
        c.name?.toLowerCase().includes(query) ||
        c.program_name?.toLowerCase().includes(query) ||
        c.academic_session?.toLowerCase().includes(query) ||
        c.batch?.toLowerCase().includes(query)
      )
    : [];

  const totalResultsCount =
    (searchCategory === 'ALL' || searchCategory === 'STUDENTS' ? filteredStudents.length : 0) +
    (searchCategory === 'ALL' || searchCategory === 'TEACHERS' ? filteredTeachers.length : 0) +
    (searchCategory === 'ALL' || searchCategory === 'CLASSES' ? filteredClasses.length : 0);

  const handleItemClick = (targetTab: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    onNavigateTo(targetTab);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E7E5E4] text-[#292524] shadow-xs">
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Left: Official College Branding & Role Badge */}
        <div 
          onClick={() => onNavigateTo('landing')}
          className="flex items-center gap-3 shrink-0 cursor-pointer group"
          title="Alpine Degree College Khanpur - Go to Home Landing Page"
        >
          <CollegeLogo size="md" />
          <div className="hidden min-[480px]:block">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm sm:text-base tracking-tight text-[#292524] leading-none group-hover:text-[#3F8F72] transition-colors">
                Alpine Degree College
              </h1>
              {currentUser ? (
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                  currentUser.role === 'ADMIN' 
                    ? 'bg-[#EAF5F0] text-[#3F8F72] border border-[#A3D9C9]' 
                    : currentUser.role === 'TEACHER' 
                    ? 'bg-[#FEF8EC] text-[#D99A3D] border border-[#FDE68A]' 
                    : 'bg-[#F5F5F4] text-[#57534E] border border-[#E7E5E4]'
                }`}>
                  {currentUser.role}
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider bg-[#F5F5F4] text-[#57534E] border border-[#E7E5E4]">
                  Public Portal
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium text-[#78716C] mt-0.5">Khanpur • Affiliated with IUB</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-md mx-2 sm:mx-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search students, teachers, or classes..."
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={e => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              className="w-full bg-[#F5F5F4] hover:bg-[#E7E5E4]/50 focus:bg-white border border-[#E7E5E4] focus:border-[#3F8F72] rounded-xl pl-9 pr-16 py-2 text-xs text-[#292524] placeholder-[#78716C] focus:outline-none focus:ring-2 focus:ring-[#3F8F72]/20 transition-all"
            />

            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-[#78716C] hover:text-[#292524] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block absolute right-3 top-2.5 px-1.5 py-0.5 text-[10px] font-mono text-[#78716C] bg-[#E7E5E4]/70 border border-[#D6D3D1] rounded">
                ⌘K
              </kbd>
            )}
          </div>

          {/* Interactive Live Search Dropdown */}
          {isSearchOpen && (
            <div className="absolute left-0 right-0 mt-2 bg-white border border-[#E7E5E4] rounded-2xl shadow-xl py-3 z-50 text-[#292524] divide-y divide-[#E7E5E4] max-h-[82vh] overflow-y-auto animate-in fade-in duration-150">
              
              {/* Category Filter Pills */}
              <div className="px-3 pb-2.5 flex items-center gap-1.5 overflow-x-auto">
                {[
                  { id: 'ALL', label: 'All Results' },
                  { id: 'STUDENTS', label: `Students (${filteredStudents.length})` },
                  { id: 'TEACHERS', label: `Teachers (${filteredTeachers.length})` },
                  { id: 'CLASSES', label: `Classes (${filteredClasses.length})` },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSearchCategory(cat.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                      searchCategory === cat.id
                        ? 'bg-[#3F8F72] text-white shadow-2xs'
                        : 'bg-[#F5F5F4] text-[#57534E] hover:bg-[#E7E5E4]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {!query ? (
                <div className="px-4 py-6 text-center text-xs text-[#78716C] space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-[#EAF5F0] text-[#3F8F72] mx-auto flex items-center justify-center">
                    <Search className="w-4 h-4" />
                  </div>
                  <p className="font-semibold text-[#292524]">Quick Global Search</p>
                  <p className="text-[11px] text-[#78716C] max-w-xs mx-auto">
                    Type a student name, roll number, teacher name, or class title to instantly find records.
                  </p>
                </div>
              ) : totalResultsCount === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-[#78716C] space-y-1">
                  <p className="font-bold text-[#292524]">No matching records found</p>
                  <p className="text-[11px] text-[#78716C]">Try searching with a different name or ID code.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#E7E5E4] text-xs">
                  
                  {/* STUDENTS SECTION */}
                  {(searchCategory === 'ALL' || searchCategory === 'STUDENTS') && filteredStudents.length > 0 && (
                    <div className="py-2">
                      <div className="px-4 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#78716C] flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[#3F8F72]">
                          <GraduationCap className="w-3.5 h-3.5" /> Students ({filteredStudents.length})
                        </span>
                        <button
                          onClick={() => handleItemClick('students')}
                          className="text-[#3F8F72] hover:underline text-[10px] lowercase cursor-pointer"
                        >
                          view all in directory →
                        </button>
                      </div>

                      <div className="mt-1 space-y-0.5">
                        {filteredStudents.slice(0, 5).map(student => (
                          <div
                            key={student.id}
                            onClick={() => handleItemClick('students')}
                            className="px-4 py-2 hover:bg-[#F5F5F4] transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.full_name}`}
                                alt={student.full_name}
                                className="w-7 h-7 rounded-full object-cover border border-[#E7E5E4]"
                              />
                              <div>
                                <p className="font-bold text-[#292524] group-hover:text-[#3F8F72] transition-colors">
                                  {student.full_name}
                                </p>
                                <p className="text-[11px] text-[#78716C] font-mono">
                                  {student.roll_number} • {student.class_name || 'BSCS'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {student.overall_attendance_pct !== undefined && (
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  student.overall_attendance_pct >= 75
                                    ? 'bg-[#EAF5F0] text-[#3F8F72] border border-[#A3D9C9]'
                                    : 'bg-[#FDF2F2] text-[#D95C5C] border border-[#F87171]'
                                }`}>
                                  {student.overall_attendance_pct}% Att.
                                </span>
                              )}
                              <ChevronRight className="w-4 h-4 text-[#A8A29E] group-hover:text-[#3F8F72] transition-colors" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TEACHERS SECTION */}
                  {(searchCategory === 'ALL' || searchCategory === 'TEACHERS') && filteredTeachers.length > 0 && (
                    <div className="py-2">
                      <div className="px-4 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#78716C] flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[#D99A3D]">
                          <UserCheck className="w-3.5 h-3.5" /> Faculty & Teachers ({filteredTeachers.length})
                        </span>
                        <button
                          onClick={() => handleItemClick('teachers')}
                          className="text-[#D99A3D] hover:underline text-[10px] lowercase cursor-pointer"
                        >
                          view all faculty →
                        </button>
                      </div>

                      <div className="mt-1 space-y-0.5">
                        {filteredTeachers.slice(0, 5).map(teacher => (
                          <div
                            key={teacher.id}
                            onClick={() => handleItemClick('teachers')}
                            className="px-4 py-2 hover:bg-[#F5F5F4] transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={teacher.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.full_name}`}
                                alt={teacher.full_name}
                                className="w-7 h-7 rounded-full object-cover border border-[#E7E5E4]"
                              />
                              <div>
                                <p className="font-bold text-[#292524] group-hover:text-[#D99A3D] transition-colors">
                                  {teacher.full_name}
                                </p>
                                <p className="text-[11px] text-[#78716C]">
                                  {teacher.designation || 'Lecturer'} • {teacher.department_name || 'Computer Science'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md font-mono text-[10px] bg-[#F5F5F4] text-[#57534E] border border-[#E7E5E4]">
                                {teacher.teacher_code}
                              </span>
                              <ChevronRight className="w-4 h-4 text-[#A8A29E] group-hover:text-[#D99A3D] transition-colors" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CLASSES SECTION */}
                  {(searchCategory === 'ALL' || searchCategory === 'CLASSES') && filteredClasses.length > 0 && (
                    <div className="py-2">
                      <div className="px-4 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#78716C] flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[#3F8F72]">
                          <BookOpen className="w-3.5 h-3.5" /> Classes & Sections ({filteredClasses.length})
                        </span>
                        <button
                          onClick={() => handleItemClick('classes')}
                          className="text-[#3F8F72] hover:underline text-[10px] lowercase cursor-pointer"
                        >
                          view all classes →
                        </button>
                      </div>

                      <div className="mt-1 space-y-0.5">
                        {filteredClasses.slice(0, 5).map(cls => (
                          <div
                            key={cls.id}
                            onClick={() => handleItemClick('classes')}
                            className="px-4 py-2 hover:bg-[#F5F5F4] transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-[#EAF5F0] text-[#3F8F72] flex items-center justify-center font-bold text-xs shrink-0">
                                <BookOpen className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-bold text-[#292524] group-hover:text-[#3F8F72] transition-colors">
                                  {cls.name}
                                </p>
                                <p className="text-[11px] text-[#78716C]">
                                  {cls.program_name || 'BS Computer Science'} • {cls.academic_session}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {cls.student_count !== undefined && (
                                <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-[#EAF5F0] text-[#3F8F72] border border-[#A3D9C9]">
                                  {cls.student_count} Students
                                </span>
                              )}
                              <ChevronRight className="w-4 h-4 text-[#A8A29E] group-hover:text-[#3F8F72] transition-colors" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-2 rounded-xl text-[#57534E] hover:text-[#292524] hover:bg-[#F5F5F4] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3F8F72]"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications & Profile (Only when logged in) or Login Button */}
          {currentUser ? (
            <>
              {/* Notifications Center Bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifDropdown(!showNotifDropdown);
                    setShowProfileDropdown(false);
                  }}
                  className="p-2 rounded-xl text-[#57534E] hover:text-[#292524] hover:bg-[#F5F5F4] transition-colors relative cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-[#D95C5C] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifDropdown && (
                  <div className="navbar-popover absolute right-0 mt-2 w-80 md:w-96 bg-white border border-[#E7E5E4] rounded-2xl shadow-xl py-2 z-50 text-[#292524] divide-y divide-[#E7E5E4]">
                    <div className="px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#3F8F72]" />
                        <span className="font-semibold text-sm text-[#292524]">Notifications</span>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => {
                            onMarkAllRead();
                          }}
                          className="text-xs text-[#3F8F72] hover:underline font-medium cursor-pointer"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-[#E7E5E4]">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-[#78716C]">
                          No recent notifications
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => {
                              setShowNotifDropdown(false);
                              onNavigateTo('notifications');
                            }}
                            className={`p-3 hover:bg-[#F5F5F4] transition-colors cursor-pointer flex gap-3 ${!n.is_read ? 'bg-[#EAF5F0]/50' : ''}`}
                          >
                            <div className="mt-0.5">
                              {n.type === 'WARNING' ? (
                                <AlertTriangle className="w-4 h-4 text-[#D95C5C]" />
                              ) : n.type === 'LEAVE' ? (
                                <Calendar className="w-4 h-4 text-[#D99A3D]" />
                              ) : (
                                <Info className="w-4 h-4 text-[#57534E]" />
                              )}
                            </div>
                            <div className="flex-1 text-xs">
                              <p className="font-semibold text-[#292524]">{n.title}</p>
                              <p className="text-[#57534E] mt-0.5 line-clamp-2">{n.message}</p>
                              <span className="text-[10px] text-[#A8A29E] mt-1 block">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="px-4 py-2 text-center bg-[#F5F5F4]">
                      <button
                        onClick={() => {
                          setShowNotifDropdown(false);
                          onNavigateTo('notifications');
                        }}
                        className="text-xs font-semibold text-[#3F8F72] hover:underline cursor-pointer"
                      >
                        View Notification Center →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowProfileDropdown(!showProfileDropdown);
                    setShowNotifDropdown(false);
                  }}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#F5F5F4] transition-colors text-left cursor-pointer"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.full_name}
                    className="w-8 h-8 rounded-full object-cover border border-[#E7E5E4]"
                  />
                  <div className="navbar-profile-copy hidden sm:block text-xs">
                    <p className="font-semibold text-[#292524] leading-tight">{currentUser.full_name}</p>
                    <p className="text-[#78716C] text-[11px]">{currentUser.email}</p>
                  </div>
                </button>

                {showProfileDropdown && (
                  <div className="navbar-popover navbar-popover-profile absolute right-0 mt-2 w-56 bg-white border border-[#E7E5E4] rounded-2xl shadow-xl py-2 z-50 text-[#292524] divide-y divide-[#E7E5E4]">
                    <div className="px-4 py-2.5">
                      <p className="text-xs font-bold text-[#292524]">{currentUser.full_name}</p>
                      <p className="text-[11px] text-[#78716C]">{currentUser.email}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          onOpenProfile();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-[#57534E] hover:bg-[#F5F5F4] flex items-center gap-2.5 cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 text-[#3F8F72]" />
                        My Account Profile
                      </button>
                      {currentUser.role === 'ADMIN' && (
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            onOpenSettings();
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-[#57534E] hover:bg-[#F5F5F4] flex items-center gap-2.5 cursor-pointer"
                        >
                          <SettingsIcon className="w-4 h-4 text-[#3F8F72]" />
                          System Settings
                        </button>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-[#D95C5C] hover:bg-[#FDF2F2] flex items-center gap-2.5 font-semibold cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-[#D95C5C]" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="bg-[#3F8F72] hover:bg-[#347A61] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Portal Login</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
