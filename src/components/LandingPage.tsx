import React, { useState } from 'react';
import { CollegeLogo } from './CollegeLogo';
import {
  GraduationCap,
  Users,
  Shield,
  BookOpen,
  CheckCircle2,
  FileText,
  Clock,
  Building2,
  Calculator,
  Bot,
  ArrowRight,
  School,
  Award,
  LogIn,
  Check,
  Calendar,
  Lock,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Menu,
  X,
  BellRing,
  BarChart3,
  UserCheck,
  ShieldCheck,
  FileSpreadsheet,
  ScanFace
} from 'lucide-react';
import { User } from '../types';

interface LandingPageProps {
  currentUser?: User | null;
  onOpenAuthModal: () => void;
  onNavigateTo: (tab: string) => void;
  studentCount?: number;
  teacherCount?: number;
  departmentCount?: number;
  classCount?: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  onOpenAuthModal,
  onNavigateTo,
  studentCount = 1250,
  teacherCount = 48,
  departmentCount = 6,
  classCount = 24
}) => {
  const isLoggedIn = Boolean(currentUser && currentUser.username);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-12 pb-12 animate-fadeIn max-w-7xl mx-auto px-2 sm:px-4 text-slate-800 dark:text-slate-100">
      
      {/* 1. STICKY LANDING NAVBAR */}
      <nav className="sticky top-2 z-20 bg-white/95 dark:bg-[#111113]/95 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-[#27272a] shadow-xs px-4 py-3 flex items-center justify-between gap-4 transition-all">
        {/* Logo & System Name */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection('home')}>
          <CollegeLogo size="md" />
          <div>
            <span className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white tracking-tight block leading-tight">
              Smart Attendance Portal
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider block">
              Alpine Degree College Khanpur
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          <button
            onClick={() => scrollToSection('home')}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            Home
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('about')}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            About
          </button>
          <button
            onClick={() => scrollToSection('contact')}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            Contact
          </button>
        </div>

        {/* Right CTA Button & Mobile Toggle */}
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <button
              onClick={() => onNavigateTo('dashboard')}
              className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700" />
              <span>Login</span>
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#202023] rounded-xl cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263449] rounded-2xl shadow-xl p-4 flex flex-col gap-3 text-xs font-bold md:hidden animate-fadeIn z-30">
            <button
              onClick={() => scrollToSection('home')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-[#172033] text-slate-800 dark:text-slate-200"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-[#172033] text-slate-800 dark:text-slate-200"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-[#172033] text-slate-800 dark:text-slate-200"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-[#172033] text-slate-800 dark:text-slate-200"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-[#172033] text-slate-800 dark:text-slate-200"
            >
              Contact
            </button>
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <section id="home" className="relative overflow-hidden rounded-3xl bg-white text-[#292524] p-6 sm:p-10 lg:p-12 border border-[#E7E5E4] shadow-xs">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF5F0] border border-[#A3D9C9] text-[#3F8F72] text-xs font-bold tracking-wide">
              <School className="w-4 h-4 text-[#3F8F72] shrink-0" />
              <span>Alpine Degree College Khanpur • IUB Affiliated</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-[#292524]">
              Smart Attendance Management System
            </h1>

            {/* Subtitle */}
            <p className="text-[#57534E] text-xs sm:text-sm lg:text-base leading-relaxed font-normal max-w-xl">
              An all-in-one digital governance platform empowering educational institutions to seamlessly manage daily attendance, student records, faculty schedules, timetables, academic analytics, and leave requests.
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => scrollToSection('features')}
                className="bg-[#3F8F72] hover:bg-[#347A61] text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer group"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              {isLoggedIn ? (
                <button
                  onClick={() => onNavigateTo('dashboard')}
                  className="bg-white hover:bg-[#F5F5F4] text-[#292524] border border-[#E7E5E4] px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-[#3F8F72]" />
                  <span>Go to Dashboard</span>
                </button>
              ) : (
                <button
                  onClick={onOpenAuthModal}
                  className="bg-white hover:bg-[#F5F5F4] text-[#292524] border border-[#E7E5E4] px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-[#3F8F72]" />
                  <span>Login to Portal</span>
                </button>
              )}
            </div>

            {/* Verification Features List */}
            <div className="pt-4 border-t border-[#E7E5E4] flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-[#57534E] font-medium">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#3F8F72]" />
                <span>Role-Based Single Sign-On</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#3F8F72]" />
                <span>IUB 75% Criteria Compliant</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#3F8F72]" />
                <span>Real-Time Analytics Sync</span>
              </div>
            </div>

          </div>

          {/* Right Professional Attendance Visual Column */}
          <div className="lg:col-span-5 relative">
            
            {/* Visual Card Mockup */}
            <div className="bg-[#FAFAF9] rounded-2xl p-5 border border-[#E7E5E4] shadow-xs space-y-4 relative">
              
              {/* Visual Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E4]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EAF5F0] border border-[#A3D9C9] flex items-center justify-center text-[#3F8F72]">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-[#292524]">Live Subject Attendance</h3>
                    <p className="text-[10px] text-[#78716C]">BS Computer Science • Semester 4</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#EAF5F0] text-[#3F8F72] border border-[#A3D9C9] text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3F8F72] animate-pulse" />
                  Live Sync
                </span>
              </div>

              {/* Attendance Progress Ring & Stats */}
              <div className="grid grid-cols-2 gap-3 items-center bg-white p-3 rounded-xl border border-[#E7E5E4]">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#78716C] font-bold">Overall Attendance</p>
                  <p className="text-2xl font-bold text-[#292524] mt-0.5">92.4%</p>
                  <span className="text-[10px] font-semibold text-[#3F8F72] flex items-center gap-1 mt-0.5">
                    <TrendingUp className="w-3 h-3" />
                    +2.1% above target
                  </span>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between text-[#57534E]">
                    <span className="text-[#78716C]">Present:</span>
                    <span className="font-bold text-[#3F8F72]">38 Students</span>
                  </div>
                  <div className="flex justify-between text-[#57534E]">
                    <span className="text-[#78716C]">Absent:</span>
                    <span className="font-bold text-[#D95C5C]">3 Students</span>
                  </div>
                  <div className="flex justify-between text-[#57534E]">
                    <span className="text-[#78716C]">Medical Leave:</span>
                    <span className="font-bold text-[#D99A3D]">1 Approved</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-[#78716C] font-bold">
                  <span>IUB Minimum Threshold (75%)</span>
                  <span className="text-[#3F8F72]">92.4% Achieved</span>
                </div>
                <div className="w-full h-2 bg-white rounded-full overflow-hidden p-0.5 border border-[#E7E5E4]">
                  <div className="h-full bg-[#3F8F72] rounded-full w-[92.4%]" />
                </div>
              </div>

              {/* Live Activity Ticker */}
              <div className="p-2.5 rounded-xl bg-white border border-[#E7E5E4] text-[11px] space-y-1.5">
                <div className="flex items-center justify-between text-[#3F8F72] font-bold">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#3F8F72]" />
                    Recent Activity Log
                  </span>
                  <span className="text-[9px] text-[#A8A29E]">11:15 AM</span>
                </div>
                <p className="text-[#57534E] text-[10px] leading-tight">
                  Prof. Yasir marked Attendance Register for Operating Systems (Class: CS-2022-A).
                </p>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section id="features" className="space-y-6 pt-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="px-3 py-1 rounded-full bg-[#EAF5F0] text-[#3F8F72] text-xs font-bold uppercase tracking-wider border border-[#A3D9C9]">
            System Modules & Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292524]">
            Comprehensive Features for Modern Academic Governance
          </h2>
          <p className="text-xs sm:text-sm text-[#57534E]">
            Engineered specifically for students, teachers, and administrators to automate attendance workflows and ensure compliance with academic rules.
          </p>
        </div>

        {/* 8 Required Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Smart Attendance */}
          <div className="saas-card p-5 space-y-3 hover:border-[#3F8F72] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#EAF5F0] text-[#3F8F72] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#292524] text-sm sm:text-base">
              Smart Attendance
            </h3>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Digital subject registers with one-tap marking, instant status updates, present/absent badges, and real-time student notification alerts.
            </p>
          </div>

          {/* 2. Student Management */}
          <div className="saas-card p-5 space-y-3 hover:border-[#3F8F72] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#EAF5F0] text-[#3F8F72] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#292524] text-sm sm:text-base">
              Student Management
            </h3>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Comprehensive student profiles, roll number directories, class section assignments, guardian contacts, and individual attendance records.
            </p>
          </div>

          {/* 3. Teacher Management */}
          <div className="saas-card p-5 space-y-3 hover:border-[#3F8F72] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#EAF5F0] text-[#3F8F72] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#292524] text-sm sm:text-base">
              Teacher Management
            </h3>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Faculty workspace for subject allocations, class registers, lecture duration tracking, substitute teaching logs, and faculty activity records.
            </p>
          </div>

          {/* 4. Timetable */}
          <div className="saas-card p-5 space-y-3 hover:border-[#3F8F72] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#EAF5F0] text-[#3F8F72] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#292524] text-sm sm:text-base">
              Timetable Schedule
            </h3>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Interactive weekly class timetables, room assignments, period timings, and batch schedules for both students and faculty members.
            </p>
          </div>

          {/* 5. Reports & Analytics */}
          <div className="saas-card p-5 space-y-3 hover:border-[#3F8F72] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#EAF5F0] text-[#3F8F72] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#292524] text-sm sm:text-base">
              Reports & Analytics
            </h3>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Graphical class percentage charts, IUB 75% exam eligibility reports, and printable A4 monthly registers formatted for official records.
            </p>
          </div>

          {/* 6. Leave Management */}
          <div className="saas-card p-5 space-y-3 hover:border-[#3F8F72] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#EAF5F0] text-[#3F8F72] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#292524] text-sm sm:text-base">
              Leave Management
            </h3>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Digital medical and official leave submission portal with doctor certificate document uploads and Principal approval workflow.
            </p>
          </div>

          {/* 7. Notifications */}
          <div className="saas-card p-5 space-y-3 hover:border-[#3F8F72] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#EAF5F0] text-[#3F8F72] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <BellRing className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#292524] text-sm sm:text-base">
              Instant Notifications
            </h3>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Automated low attendance warning alerts, campus news notices, exam schedule announcements, and leave status updates.
            </p>
          </div>

          {/* 8. AI Academic Assistant */}
          <div className="saas-card p-5 space-y-3 hover:border-[#3F8F72] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#EAF5F0] text-[#3F8F72] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#292524] text-sm sm:text-base">
              AI Academic Assistant
            </h3>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Gemini AI-powered assistant providing instant answers regarding college regulations, IUB criteria, timetables, and medical policies.
            </p>
          </div>

          {/* 9. AI Face Recognition Attendance */}
          <div className="saas-card p-5 space-y-3 hover:border-[#3F8F72] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#EAF5F0] text-[#3F8F72] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <ScanFace className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#292524] text-sm sm:text-base">
              AI Face Recognition Attendance
            </h3>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Automated camera-based student biometric identification with dynamic anti-spoofing liveness checks and duplicate prevention.
            </p>
          </div>

          {/* 10. Parent & Guardian Portal */}
          <div className="saas-card p-5 space-y-3 hover:border-[#3F8F72] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#EAF5F0] text-[#3F8F72] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#292524] text-sm sm:text-base">
              Parent & Guardian Portal
            </h3>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Transparent multi-child attendance tracking, real-time absence alerts, subject-wise statistics, and online guardian leave notes.
            </p>
          </div>

        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="saas-card p-6 sm:p-10 space-y-8">
        
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="px-3 py-1 rounded-full bg-[#EAF5F0] text-[#3F8F72] text-xs font-bold uppercase tracking-wider border border-[#A3D9C9]">
            Simple 3-Step Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292524]">
            How the Smart Attendance Portal Works
          </h2>
          <p className="text-xs sm:text-sm text-[#57534E]">
            Streamlined workflow designed for speed, accuracy, and ease of use.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          
          {/* Step 1 */}
          <div className="p-6 rounded-2xl bg-[#F5F5F4] border border-[#E7E5E4] space-y-3 relative group">
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-xl bg-[#3F8F72] text-white font-bold text-sm flex items-center justify-center shadow-2xs">
                01
              </span>
              <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-widest">Authentication</span>
            </div>
            <h3 className="font-bold text-[#292524] text-base">
              1. Login to Your Portal
            </h3>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Students, teachers, and administrators sign in securely using their Student ID (e.g. STU-2022-001), Teacher ID, or official email address.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl bg-[#F5F5F4] border border-[#E7E5E4] space-y-3 relative group">
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-xl bg-[#3F8F72] text-white font-bold text-sm flex items-center justify-center shadow-2xs">
                02
              </span>
              <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-widest">Daily Operations</span>
            </div>
            <h3 className="font-bold text-[#292524] text-base">
              2. Manage / Mark Attendance
            </h3>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Faculty members select their subject and mark class registers with one tap. Students track live lecture status and percentage metrics.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl bg-[#F5F5F4] border border-[#E7E5E4] space-y-3 relative group">
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-xl bg-[#3F8F72] text-white font-bold text-sm flex items-center justify-center shadow-2xs">
                03
              </span>
              <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-widest">Governance & Reports</span>
            </div>
            <h3 className="font-bold text-[#292524] text-base">
              3. Analyze & Export Reports
            </h3>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Review real-time class analytics, monitor 75% IUB exam eligibility status, process medical leave submissions, and print official A4 transcripts.
            </p>
          </div>

        </div>

        {/* Action Button inside How It Works */}
        <div className="text-center pt-2">
          {!isLoggedIn ? (
            <button
              onClick={onOpenAuthModal}
              className="btn-primary inline-flex items-center gap-2 cursor-pointer text-xs py-3 px-6"
            >
              <LogIn className="w-4 h-4 text-white" />
              <span>Login Now to Get Started</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigateTo('dashboard')}
              className="btn-primary inline-flex items-center gap-2 cursor-pointer text-xs py-3 px-6"
            >
              <span>Go to Your Active Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </section>

      {/* 5. STATISTICS & SYSTEM BENEFITS SECTION */}
      <section id="about" className="space-y-6">
        
        {/* Institutional Overview Header */}
        <div className="saas-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E7E5E4]">
            <div>
              <span className="px-3 py-1 rounded-full bg-[#EAF5F0] text-[#3F8F72] text-[11px] font-bold uppercase tracking-wider border border-[#A3D9C9]">
                System Operational Benefits
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#292524] mt-1 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-[#3F8F72]" />
                Designed for Institutional Excellence
              </h2>
              <p className="text-xs text-[#57534E] mt-0.5">
                Alpine Degree College Khanpur • Affiliated with Islamia University Bahawalpur (IUB)
              </p>
            </div>
          </div>

          {/* Meaningful System Benefits Grid (NO FAKE STATS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-2xl bg-[#EAF5F0] border border-[#A3D9C9] space-y-2">
              <div className="w-8 h-8 rounded-xl bg-[#3F8F72] text-white flex items-center justify-center font-bold text-xs">
                100%
              </div>
              <h3 className="font-bold text-[#292524] text-sm">Digital Workflow</h3>
              <p className="text-[#57534E] text-[11px] leading-relaxed">
                Complete elimination of physical register books, paper errors, and manual tallying delays.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#EAF5F0] border border-[#A3D9C9] space-y-2">
              <div className="w-8 h-8 rounded-xl bg-[#3F8F72] text-white flex items-center justify-center font-bold text-xs">
                Real-Time
              </div>
              <h3 className="font-bold text-[#292524] text-sm">Instant Synchronisation</h3>
              <p className="text-[#57534E] text-[11px] leading-relaxed">
                Instant live updates across student, faculty, and administrative dashboards on every lecture.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FEF8EC] border border-[#D99A3D]/30 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-[#D99A3D] text-white flex items-center justify-center font-bold text-xs">
                75%
              </div>
              <h3 className="font-bold text-[#292524] text-sm">Exam Eligibility Rules</h3>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Automated monitoring of IUB university exam eligibility with proactive early warning alerts.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F5F5F4] border border-[#E7E5E4] space-y-2">
              <div className="w-8 h-8 rounded-xl bg-[#3F8F72] text-white flex items-center justify-center font-bold text-xs">
                Digital
              </div>
              <h3 className="font-bold text-[#292524] text-sm">Automated Leave Approvals</h3>
              <p className="text-[#57534E] text-[11px] leading-relaxed">
                Seamless upload and digital verification of doctor medical certificates and official leave applications.
              </p>
            </div>

          </div>

          {/* Academic Departments Overview */}
          <div className="pt-4 border-t border-[#E7E5E4] space-y-3">
            <h3 className="font-bold text-[#292524] text-sm">
              Offered Academic Programs & Departments
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              
              <div className="p-3.5 rounded-xl bg-[#F5F5F4] border border-[#E7E5E4]">
                <p className="font-bold text-[#292524]">Computer Science & IT</p>
                <p className="text-[#57534E] text-[11px] mt-0.5">BS CS, BS IT, ICS Computer Science</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F5F5F4] border border-[#E7E5E4]">
                <p className="font-bold text-[#292524]">Pre-Medical & Sciences</p>
                <p className="text-[#57534E] text-[11px] mt-0.5">FSc Pre-Medical, BS Zoology, BS Chemistry</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F5F5F4] border border-[#E7E5E4]">
                <p className="font-bold text-[#292524]">English & Humanities</p>
                <p className="text-[#57534E] text-[11px] mt-0.5">BS English Literature, ADP Arts</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F5F5F4] border border-[#E7E5E4]">
                <p className="font-bold text-[#292524]">Commerce & Business</p>
                <p className="text-[#57534E] text-[11px] mt-0.5">BS Commerce, I.Com, B.Com ADP</p>
              </div>

            </div>
          </div>

        </div>

      </section>

      {/* 6. CONTACT SECTION */}
      <section id="contact" className="saas-card p-6 sm:p-8 space-y-6">
        <div>
          <span className="px-3 py-1 rounded-full bg-[#EAF5F0] text-[#3F8F72] text-[11px] font-bold uppercase tracking-wider border border-[#A3D9C9]">
            Campus Information
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#292524] mt-1">
            Contact & Campus Location
          </h2>
          <p className="text-xs text-[#57534E] mt-0.5">
            Reach out to the Principal's Office or IT Helpdesk for assistance regarding portal accounts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          
          <div className="p-5 rounded-2xl bg-[#F5F5F4] border border-[#E7E5E4] space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#EAF5F0] text-[#3F8F72] flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-[#292524] text-sm">Campus Address</h3>
            <p className="text-[#57534E] text-[11px] leading-relaxed">
              College Road, Model Town, Khanpur, District Rahim Yar Khan, Punjab, Pakistan.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F5F5F4] border border-[#E7E5E4] space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#EAF5F0] text-[#3F8F72] flex items-center justify-center font-bold">
              <Phone className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-[#292524] text-sm">Phone Numbers</h3>
            <p className="text-[#57534E] text-[11px] leading-relaxed">
              Main Office: +92 (68) 555-0192<br />
              IT Helpline: +92 300 1234567
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F5F5F4] border border-[#E7E5E4] space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#FEF8EC] text-[#D99A3D] flex items-center justify-center font-bold">
              <Mail className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-[#292524] text-sm">Official Email & Hours</h3>
            <p className="text-[#57534E] text-[11px] leading-relaxed">
              Email: info@alpine.edu.pk / admin@alpine.edu.pk<br />
              Hours: Mon - Sat (8:00 AM - 3:00 PM)
            </p>
          </div>

        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-white text-[#57534E] rounded-3xl p-6 sm:p-8 border border-[#E7E5E4] text-xs space-y-6 shadow-xs">
        
        {/* Top Footer Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#E7E5E4]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#3F8F72] flex items-center justify-center text-white font-bold shadow-2xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#292524] text-base">Smart Attendance Management System</h3>
              <p className="text-[#78716C] text-xs">Alpine Degree College Khanpur • Affiliated with Islamia University Bahawalpur</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <button
                onClick={() => onNavigateTo('dashboard')}
                className="btn-primary py-2.5 px-5 text-xs font-bold cursor-pointer"
              >
                Go to Dashboard
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="btn-primary py-2.5 px-5 text-xs font-bold cursor-pointer flex items-center gap-2"
              >
                <LogIn className="w-4 h-4 text-white" />
                <span>Portal Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Links Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-[#57534E] text-xs">
          
          <div className="space-y-2">
            <p className="font-bold text-[#292524] uppercase tracking-wider text-[11px]">System Purpose</p>
            <p className="text-[#57534E] leading-relaxed text-[11px]">
              Next-generation digital governance system for tracking daily class attendance, timetable schedules, exam eligibility, and medical leaves.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-[#292524] uppercase tracking-wider text-[11px]">Quick Navigation</p>
            <ul className="space-y-1 text-[11px]">
              <li>
                <button onClick={() => scrollToSection('home')} className="hover:text-[#292524] transition-colors cursor-pointer">
                  Home Overview
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('features')} className="hover:text-[#292524] transition-colors cursor-pointer">
                  System Features
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('how-it-works')} className="hover:text-[#292524] transition-colors cursor-pointer">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('about')} className="hover:text-[#292524] transition-colors cursor-pointer">
                  About Alpine College
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('contact')} className="hover:text-[#292524] transition-colors cursor-pointer">
                  Campus Contact
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-[#292524] uppercase tracking-wider text-[11px]">Key Features</p>
            <ul className="space-y-1 text-[11px]">
              <li>Digital Subject Registers</li>
              <li>IUB 75% Exam Calculator</li>
              <li>Medical Leave Portal</li>
              <li>Printable A4 Reports</li>
              <li>Gemini AI Assistant</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-[#292524] uppercase tracking-wider text-[11px]">Security & Compliance</p>
            <p className="text-[#57534E] leading-relaxed text-[11px]">
              Secured with Role-Based Access Control (RBAC), automatic inactivity timeout, and activity audit logs for complete administrative accountability.
            </p>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-4 border-t border-[#E7E5E4] text-center text-[#78716C] text-[11px]">
          © 2026 Alpine Degree College Khanpur. All Rights Reserved. Apex Smart Attendance Management System v2.5.
        </div>

      </footer>

    </div>
  );
};
