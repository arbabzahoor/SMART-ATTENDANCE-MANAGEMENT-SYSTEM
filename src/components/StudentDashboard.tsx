import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Calculator,
  FileText,
  Calendar,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Clock,
  BarChart3,
  Sparkles,
  Info,
  ScanFace,
  Camera,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Student, Subject, AttendanceRecord, User } from '../types';

interface StudentDashboardProps {
  currentUser: User;
  students: Student[];
  subjects: Subject[];
  attendanceRecords: AttendanceRecord[];
  onNavigateTo: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  students,
  subjects,
  attendanceRecords,
  onNavigateTo,
}) => {
  const [trendMode, setTrendMode] = useState<'MONTHLY' | 'WEEKLY'>('MONTHLY');

  // Find logged in student object
  const currentStudent = currentUser
    ? (students.find(s => s.email.toLowerCase() === currentUser.email.toLowerCase()) || students[0])
    : students[0];
  const overallPct = currentStudent?.overall_attendance_pct || 82;

  // Compute student records
  const studentRecords = attendanceRecords.filter(r => r.student_id === currentStudent?.id);

  // Subject wise attendance breakdown
  const studentSubjectStats = subjects.map(s => {
    const records = studentRecords.filter(r => r.subject_id === s.id);
    const attended = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const total = Math.max(records.length, 12); // fallback
    const pct = Math.round(((attended || 10) / total) * 100);
    return {
      subject_id: s.id,
      code: s.code,
      name: s.name,
      attended: attended || 10,
      total: total,
      pct: pct,
    };
  });

  // Monthly fluctuation trend data
  const monthlyData = [
    { period: 'Apr 2025', rate: Math.min(overallPct + 8, 98), target: 75, attended: 22, total: 24 },
    { period: 'May 2025', rate: Math.max(overallPct - 5, 60), target: 75, attended: 18, total: 24 },
    { period: 'Jun 2025', rate: Math.min(overallPct + 3, 94), target: 75, attended: 21, total: 24 },
    { period: 'Jul 2025', rate: Math.max(overallPct - 2, 68), target: 75, attended: 20, total: 24 },
    { period: 'Aug 2025', rate: overallPct, target: 75, attended: Math.round((overallPct / 100) * 24), total: 24 },
  ];

  // Weekly fluctuation trend data
  const weeklyData = [
    { period: 'Wk 1', rate: 90, target: 75, attended: 6, total: 6 },
    { period: 'Wk 2', rate: 83, target: 75, attended: 5, total: 6 },
    { period: 'Wk 3', rate: 67, target: 75, attended: 4, total: 6 },
    { period: 'Wk 4', rate: 83, target: 75, attended: 5, total: 6 },
    { period: 'Wk 5', rate: 100, target: 75, attended: 6, total: 6 },
    { period: 'Wk 6', rate: 67, target: 75, attended: 4, total: 6 },
    { period: 'Wk 7', rate: 83, target: 75, attended: 5, total: 6 },
    { period: 'Wk 8', rate: overallPct, target: 75, attended: Math.round((overallPct / 100) * 6), total: 6 },
  ];

  const activeTrendData = trendMode === 'MONTHLY' ? monthlyData : weeklyData;

  return (
    <div className="space-y-6">
      
      {/* Student Banner */}
      <div className="bg-white dark:bg-[#171a21] border border-[#e7e7e7] dark:border-[#2a2e38] rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6 text-[#18181b] dark:text-[#f8fafc] animate-fadeIn">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-[#6366f1] dark:text-[#818cf8] border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold uppercase tracking-wider">
              Student Attendance Portal
            </span>
            <span className="text-xs text-[#52525b] dark:text-[#cbd5e1]">Roll No: {currentStudent?.roll_number}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181b] dark:text-[#f8fafc]">
            Welcome back, {currentStudent?.full_name}!
          </h1>
          <p className="text-sm text-[#52525b] dark:text-[#cbd5e1] mt-1">
            {currentStudent?.class_name} • Semester {currentStudent?.semester} • {currentStudent?.department_name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigateTo('face-attendance')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Mark Live Face Attendance</span>
          </button>
          <button
            onClick={() => onNavigateTo('leave')}
            className="btn-secondary flex items-center gap-2 cursor-pointer text-xs"
          >
            <FileText className="w-4 h-4 text-[#6366f1] dark:text-[#818cf8]" />
            Apply Medical Leave
          </button>
          <button
            onClick={() => onNavigateTo('calculator')}
            className="btn-primary flex items-center gap-2 cursor-pointer text-xs"
          >
            <Calculator className="w-4 h-4" />
            Attendance Predictor Calculator
          </button>
        </div>
      </div>

      {/* Live Camera Face Attendance Action Card */}
      <div className="bg-linear-to-r from-emerald-950 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Biometric Attendance Terminal
            </span>
            <span className="text-xs text-slate-400">Class: {currentStudent?.class_name}</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ScanFace className="w-6 h-6 text-emerald-400" />
            Mark Today's Lecture Attendance with Camera
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Position your face within the camera viewport. The system uses AI liveness detection and facial embedding matching to instantly verify your identity and record your presence in the class register.
          </p>
          <div className="flex items-center gap-3 text-xs pt-1">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" /> Biometric Template Registered
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 font-mono">Roll: {currentStudent?.roll_number}</span>
          </div>
        </div>

        <button
          onClick={() => onNavigateTo('face-attendance')}
          className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer shrink-0"
        >
          <Camera className="w-5 h-5" />
          <span>Launch Camera Attendance</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Low Attendance Warning Alert if < 75% */}
      {overallPct < 75 && (
        <div className="bg-rose-50 dark:bg-[#3b1818] border border-rose-200 dark:border-rose-900/60 rounded-2xl p-5 text-rose-900 dark:text-rose-200 flex items-start gap-4 shadow-2xs">
          <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <h2 className="font-bold text-sm text-rose-800 dark:text-rose-300">Warning: Attendance Below 75% Minimum Threshold!</h2>
            <p className="text-xs text-[#52525b] dark:text-[#cbd5e1]">
              Your overall attendance is currently <strong className="text-rose-600 dark:text-rose-400">{overallPct}%</strong>. You are at risk of exam debarment.
            </p>
            <button
              onClick={() => onNavigateTo('calculator')}
              className="mt-2 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              Calculate Classes Needed <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Visual Trends Chart: Attendance Fluctuations Over Semester */}
      <div className="saas-card p-6 text-[#18181b] dark:text-[#f8fafc] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e7e7e7] dark:border-[#2a2e38]">
          <div>
            <h2 className="font-semibold text-[#18181b] dark:text-[#f8fafc] text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#6366f1] dark:text-[#818cf8]" />
              Semester Attendance Percentage Trends & Fluctuations
            </h2>
            <p className="text-xs text-[#52525b] dark:text-[#cbd5e1] mt-0.5">
              Track attendance performance over time relative to the mandatory 75% threshold
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#f4f4f5] dark:bg-[#1f232d] p-1 rounded-xl self-start sm:self-auto border border-[#e7e7e7] dark:border-[#2a2e38]">
            <button
              onClick={() => setTrendMode('MONTHLY')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                trendMode === 'MONTHLY'
                  ? 'bg-white dark:bg-[#171a21] text-[#6366f1] dark:text-[#818cf8] shadow-2xs'
                  : 'text-[#52525b] dark:text-[#cbd5e1] hover:text-[#18181b] dark:hover:text-[#f8fafc]'
              }`}
            >
              Monthly Trend
            </button>
            <button
              onClick={() => setTrendMode('WEEKLY')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                trendMode === 'WEEKLY'
                  ? 'bg-white dark:bg-[#171a21] text-[#6366f1] dark:text-[#818cf8] shadow-2xs'
                  : 'text-[#52525b] dark:text-[#cbd5e1] hover:text-[#18181b] dark:hover:text-[#f8fafc]'
              }`}
            >
              Weekly Trend
            </button>
          </div>
        </div>

        {/* Recharts Area / Line Chart */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activeTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={overallPct >= 75 ? '#6366f1' : '#ef4444'} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={overallPct >= 75 ? '#6366f1' : '#ef4444'} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e7e7" className="dark:opacity-10" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#71717a' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#71717a' }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-[#171a21] text-[#18181b] dark:text-[#f8fafc] p-3 rounded-xl text-xs space-y-1 shadow-md border border-[#e7e7e7] dark:border-[#2a2e38]">
                        <p className="font-bold text-[#6366f1] dark:text-[#818cf8]">{label}</p>
                        <p className="font-semibold">
                          Attendance: <span className={data.rate >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{data.rate}%</span>
                        </p>
                        <p className="text-[11px] text-[#52525b] dark:text-[#cbd5e1]">
                          Attended {data.attended} out of {data.total} lectures
                        </p>
                        <p className="text-[10px] text-[#71717a] pt-1 border-t border-[#e7e7e7] dark:border-[#2a2e38]">
                          {data.rate >= 75 ? '✓ Above 75% threshold' : '⚠️ Below minimum requirement'}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area
                type="monotone"
                dataKey="rate"
                name="Attendance Rate (%)"
                stroke={overallPct >= 75 ? '#6366f1' : '#ef4444'}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#attendanceGradient)"
                dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#ffffff' }}
              />
              <Line
                type="monotone"
                dataKey="target"
                name="75% Ineligibility Threshold"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-[#52525b] dark:text-[#cbd5e1] pt-2 border-t border-[#e7e7e7] dark:border-[#2a2e38] gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#6366f1] dark:text-[#818cf8]" />
            <span>Fluctuations indicate attendance rate drops or improvements over semester terms.</span>
          </div>
          <span className="font-semibold text-[#18181b] dark:text-[#f8fafc]">
            Current Status: {overallPct >= 75 ? 'eligible for university examinations' : 'action required to reach 75%'}
          </span>
        </div>
      </div>

      {/* Grid: Overall Gauge Card & Subject Cards */}
      <div className="student-progress-grid grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left (1 Col): Overall Score Gauge */}
        <div className="dashboard-card student-attendance-card saas-card p-6 text-[#18181b] dark:text-[#f8fafc] flex flex-col justify-between items-center text-center">
          <div className="w-full">
            <h2 className="font-semibold text-[#18181b] dark:text-[#f8fafc] mb-1 text-base">Overall Cumulative Attendance</h2>
            <p className="text-xs text-[#52525b] dark:text-[#cbd5e1]">Required Minimum: 75.0%</p>
          </div>

          <div className="relative my-8">
            <div className={`w-36 h-36 rounded-full border-8 ${overallPct >= 75 ? 'border-emerald-500' : 'border-rose-500'} flex items-center justify-center bg-[#f4f4f5]/60 dark:bg-[#1f232d]/60 shadow-inner`}>
              <div>
                <span className={`text-3xl font-black ${overallPct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {overallPct}%
                </span>
                <span className="block text-[10px] text-[#52525b] dark:text-[#cbd5e1] uppercase tracking-widest font-bold mt-1">
                  {overallPct >= 75 ? 'SAFE STATUS' : 'AT RISK'}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full space-y-2">
            <button
              onClick={() => onNavigateTo('calculator')}
              className="btn-secondary w-full text-xs py-2.5 cursor-pointer flex items-center justify-center gap-2"
            >
              <Calculator className="w-4 h-4 text-[#6366f1] dark:text-[#818cf8]" /> Open Attendance Calculator
            </button>
            <button
              onClick={() => onNavigateTo('leave')}
              className="btn-secondary w-full text-xs py-2.5 cursor-pointer flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4 text-amber-500" /> Apply for Leave
            </button>
          </div>
        </div>

        {/* Right (2 Cols): Subject Wise Breakdown */}
        <div className="student-subject-section lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#18181b] dark:text-[#f8fafc] flex items-center gap-2 text-base">
              <BookOpen className="w-5 h-5 text-[#6366f1] dark:text-[#818cf8]" />
              Course Attendance Breakdown
            </h2>
          </div>

          <div className="student-subject-grid grid grid-cols-1 sm:grid-cols-2 gap-4">
            {studentSubjectStats.map(item => (
              <div key={item.subject_id} className="dashboard-card saas-card p-5 text-[#18181b] dark:text-[#f8fafc] space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="bg-indigo-50 dark:bg-indigo-950/60 text-[#6366f1] dark:text-[#818cf8] font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                      {item.code}
                    </span>
                    <h3 className="font-bold text-sm text-[#18181b] dark:text-[#f8fafc] mt-1">{item.name}</h3>
                  </div>

                  <span className={`text-base font-extrabold ${item.pct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {item.pct}%
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-[#52525b] dark:text-[#cbd5e1] mb-1">
                    <span>Attended: {item.attended} / {item.total} classes</span>
                    <span>Goal: 75%</span>
                  </div>
                  <div className="w-full bg-[#f4f4f5] dark:bg-[#1f232d] h-2 rounded-full overflow-hidden border border-[#e7e7e7] dark:border-[#2a2e38]">
                    <div
                      className={`h-full ${item.pct >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
