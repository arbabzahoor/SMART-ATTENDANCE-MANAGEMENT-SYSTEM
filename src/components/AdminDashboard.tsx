import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  Bot,
  Calendar,
  Mail,
  Send,
  RefreshCw,
  ChevronDown,
  UserCheck,
  UserPlus,
  Eye,
  Paperclip,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Student, Teacher, ClassSection, Subject, LeaveRequest, ActivityLog } from '../types';
import { EmailAlertsModal } from './EmailAlertsModal';

interface AdminDashboardProps {
  students: Student[];
  teachers: Teacher[];
  classes: ClassSection[];
  subjects: Subject[];
  leaveRequests: LeaveRequest[];
  activityLogs: ActivityLog[];
  onNavigateTo: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  students,
  teachers,
  classes,
  subjects,
  leaveRequests,
  activityLogs,
  onNavigateTo,
}) => {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [toastAlert, setToastAlert] = useState<string | null>(null);
  const [scanningAuto, setScanningAuto] = useState<boolean>(false);
  const [overviewTimeframe, setOverviewTimeframe] = useState<'This Week' | 'This Month' | 'This Semester'>('This Week');

  const lowAttendanceStudents = students.filter(s => (s.overall_attendance_pct || 100) < 75);
  const [submittingLeaveId, setSubmittingLeaveId] = useState<number | null>(null);

  const handleAdminLeaveDecision = async (leaveId: number, status: 'APPROVED' | 'REJECTED') => {
    setSubmittingLeaveId(leaveId);
    try {
      const res = await fetch(`/api/leave-requests/${leaveId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          teacher_remarks: status === 'APPROVED' ? 'Approved by Administrator from Dashboard' : 'Rejected by Administrator from Dashboard',
        }),
      });
      if (res.ok) {
        setToastAlert(`Leave request #${leaveId} marked as ${status}!`);
        onNavigateTo('leave');
      } else {
        setToastAlert('Failed to update leave request status.');
      }
    } catch (err) {
      setToastAlert('Error connecting to server.');
    } finally {
      setSubmittingLeaveId(null);
      setTimeout(() => setToastAlert(null), 4000);
    }
  };

  const handleSendSingleAlert = async (student: Student) => {
    setSendingId(student.id);
    try {
      const res = await fetch('/api/alerts/send-individual-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          custom_note: 'Immediate academic intervention notice from Principal Office.',
        }),
      });
      if (res.ok) {
        setToastAlert(`Warning email sent to ${student.full_name} (${student.email})!`);
      }
    } catch (err) {
      setToastAlert(`Failed to send email to ${student.full_name}`);
    } finally {
      setSendingId(null);
      setTimeout(() => setToastAlert(null), 4000);
    }
  };

  const handleRunAutoScan = async () => {
    setScanningAuto(true);
    try {
      const res = await fetch('/api/alerts/trigger-automated-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        setToastAlert(data.message || `Automated scan dispatched ${data.count || lowAttendanceStudents.length} warning emails.`);
      }
    } catch (err) {
      setToastAlert('Error running automated email scan');
    } finally {
      setScanningAuto(false);
      setTimeout(() => setToastAlert(null), 4000);
    }
  };

  // Recharts Chart Data
  const weeklyAttendanceData = [
    { day: 'Mon', rate: 62 },
    { day: 'Tue', rate: 71 },
    { day: 'Wed', rate: 88 },
    { day: 'Thu', rate: 75 },
    { day: 'Fri', rate: 87 },
    { day: 'Sat', rate: 82 },
    { day: 'Sun', rate: 79 },
  ];

  const donutData = [
    { name: 'Excellent (90%+)', value: 320, pct: '40%', color: '#3F8F72' },
    { name: 'Good (75% - 89%)', value: 280, pct: '35%', color: '#52A588' },
    { name: 'Average (60% - 74%)', value: 160, pct: '20%', color: '#D99A3D' },
    { name: 'Poor (<60%)', value: 40, pct: '5%', color: '#D95C5C' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Header Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#292524]">
            Dashboard
          </h1>
          <p className="text-sm text-[#57534E] mt-0.5">
            Welcome back, Admin! Here's what's happening today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigateTo('attendance')}
            className="btn-primary text-xs flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark Attendance
          </button>
          <button
            onClick={() => onNavigateTo('ai-assistant')}
            className="btn-secondary text-xs flex items-center gap-2 cursor-pointer"
          >
            <Bot className="w-4 h-4 text-[#3F8F72]" />
            AI Query Assistant
          </button>
        </div>
      </div>

      {/* Toast Alert Notification */}
      {toastAlert && (
        <div className="bg-white text-[#292524] px-4 py-3 rounded-xl shadow-xs border border-[#E7E5E4] text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#3F8F72]" />
            {toastAlert}
          </span>
          <button onClick={() => setToastAlert(null)} className="text-[#78716C] hover:text-[#292524] cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* 5 Compact Statistic Cards */}
      <div className="dashboard-stat-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Total Students */}
        <div className="saas-card p-4 flex items-center gap-3.5">
          <div className="p-3 bg-[#EAF5F0] text-[#3F8F72] rounded-xl shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[#57534E] text-xs font-medium">Total Students</div>
            <div className="text-xl sm:text-2xl font-bold text-[#292524] leading-tight">
              {students.length > 0 ? students.length.toLocaleString() : '1,240'}
            </div>
            <div className="text-[#3F8F72] text-[11px] font-semibold flex items-center gap-0.5 mt-0.5">
              <TrendingUp className="w-3 h-3" /> ↑ 12 this month
            </div>
          </div>
        </div>

        {/* Card 2: Total Teachers */}
        <div className="saas-card p-4 flex items-center gap-3.5">
          <div className="p-3 bg-[#EAF5F0] text-[#3F8F72] rounded-xl shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[#57534E] text-xs font-medium">Total Teachers</div>
            <div className="text-xl sm:text-2xl font-bold text-[#292524] leading-tight">
              {teachers.length > 0 ? teachers.length : '86'}
            </div>
            <div className="text-[#3F8F72] text-[11px] font-semibold flex items-center gap-0.5 mt-0.5">
              <TrendingUp className="w-3 h-3" /> ↑ 5 this month
            </div>
          </div>
        </div>

        {/* Card 3: Today's Attendance */}
        <div className="saas-card p-4 flex items-center gap-3.5">
          <div className="p-3 bg-[#EAF5F0] text-[#3F8F72] rounded-xl shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[#57534E] text-xs font-medium">Today's Attendance</div>
            <div className="text-xl sm:text-2xl font-bold text-[#292524] leading-tight">
              87.6%
            </div>
            <div className="text-[#3F8F72] text-[11px] font-semibold flex items-center gap-0.5 mt-0.5">
              <TrendingUp className="w-3 h-3" /> ↑ 4.3% from yesterday
            </div>
          </div>
        </div>

        {/* Card 4: Pending Leaves */}
        <div
          onClick={() => onNavigateTo('leave')}
          className="saas-card p-4 flex items-center gap-3.5 cursor-pointer hover:border-[#3F8F72] transition-all group"
        >
          <div className="p-3 bg-[#FEF8EC] text-[#D99A3D] rounded-xl shrink-0 group-hover:bg-[#EAF5F0] group-hover:text-[#3F8F72] transition-colors">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[#57534E] text-xs font-medium">Pending Leaves</div>
            <div className="text-xl sm:text-2xl font-bold text-[#292524] leading-tight">
              {leaveRequests.filter(l => l.status === 'PENDING').length}
            </div>
            <div className="text-[#3F8F72] text-[11px] font-semibold flex items-center gap-0.5 mt-0.5 group-hover:underline">
              Review & Approve →
            </div>
          </div>
        </div>

        {/* Card 5: Low Attendance */}
        <div className="saas-card p-4 flex items-center gap-3.5">
          <div className="p-3 bg-[#FDF2F2] text-[#D95C5C] rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[#57534E] text-xs font-medium">Low Attendance</div>
            <div className="text-xl sm:text-2xl font-bold text-[#292524] leading-tight">
              {lowAttendanceStudents.length > 0 ? lowAttendanceStudents.length : '32'}
            </div>
            <div className="text-[#D95C5C] text-[11px] font-semibold flex items-center gap-0.5 mt-0.5">
              <TrendingDown className="w-3 h-3" /> ↓ 8 students
            </div>
          </div>
        </div>

      </div>

      {/* Middle Dashboard Grid: Overview Line Chart + Attendance Donut + Recent Activity */}
      <div className="dashboard-overview-grid grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Large Attendance Overview Area Chart (Col span 6) */}
        <div className="dashboard-card dashboard-overview-chart lg:col-span-6 saas-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E4] mb-4">
              <h2 className="font-semibold text-base text-[#292524]">
                Attendance Overview
              </h2>
              <div className="relative">
                <select
                  value={overviewTimeframe}
                  onChange={(e) => setOverviewTimeframe(e.target.value as any)}
                  className="btn-secondary text-xs py-1 px-3 pr-7 cursor-pointer appearance-none text-[#57534E]"
                >
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                  <option value="This Semester">This Semester</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#57534E] absolute right-2 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3F8F72" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3F8F72" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#78716C' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(val) => `${val}%`} tick={{ fontSize: 11, fill: '#78716C' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#292524] text-white p-2.5 rounded-lg text-xs shadow-md">
                            <p className="font-semibold text-stone-300">{label}</p>
                            <p className="font-bold text-[#A3D9C9] mt-0.5">• {payload[0].value}% Attendance</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#3F8F72"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRate)"
                    dot={{ r: 4, fill: '#3F8F72', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#3F8F72' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Attendance by Class Donut Chart (Col span 3) */}
        <div className="dashboard-card dashboard-overview-donut lg:col-span-3 saas-card p-5 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-[#E7E5E4] mb-3">
              <h2 className="font-semibold text-base text-[#292524]">
                Attendance by Class
              </h2>
            </div>

            <div className="relative h-44 flex items-center justify-center my-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-[#292524]">87.6%</span>
                <span className="text-[11px] text-[#57534E]">Average</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="space-y-1.5 mt-2">
              {donutData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[#57534E] text-[12px]">{item.name}</span>
                  </div>
                  <span className="font-semibold text-[#292524] text-[12px]">
                    {item.value} ({item.pct})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity List (Col span 3) */}
        <div className="dashboard-card dashboard-overview-activity lg:col-span-3 saas-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E4] mb-3">
              <h2 className="font-semibold text-base text-[#292524]">
                Recent Activity
              </h2>
              <button
                onClick={() => onNavigateTo('activity-logs')}
                className="text-xs text-[#3F8F72] font-semibold hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {/* Activity Item 1 */}
              <div className="flex items-start gap-2.5 text-xs">
                <div className="p-2 bg-[#EAF5F0] text-[#3F8F72] rounded-lg shrink-0 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#292524] truncate">John Doe marked present</p>
                  <p className="text-[11px] text-[#57534E]">Class: CS-201</p>
                </div>
                <span className="text-[10px] text-[#A8A29E] shrink-0">9:15 AM</span>
              </div>

              {/* Activity Item 2 */}
              <div className="flex items-start gap-2.5 text-xs">
                <div className="p-2 bg-[#FEF8EC] text-[#D99A3D] rounded-lg shrink-0 mt-0.5">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#292524] truncate">Leave request submitted</p>
                  <p className="text-[11px] text-[#57534E]">By Sarah Wilson</p>
                </div>
                <span className="text-[10px] text-[#A8A29E] shrink-0">8:45 AM</span>
              </div>

              {/* Activity Item 3 */}
              <div className="flex items-start gap-2.5 text-xs">
                <div className="p-2 bg-[#EAF5F0] text-[#3F8F72] rounded-lg shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#292524] truncate">Attendance report generated</p>
                  <p className="text-[11px] text-[#57534E]">Class: CS-301</p>
                </div>
                <span className="text-[10px] text-[#A8A29E] shrink-0">Yesterday</span>
              </div>

              {/* Activity Item 4 */}
              <div className="flex items-start gap-2.5 text-xs">
                <div className="p-2 bg-[#EAF5F0] text-[#3F8F72] rounded-lg shrink-0 mt-0.5">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#292524] truncate">New student enrolled</p>
                  <p className="text-[11px] text-[#57534E]">Michael Brown</p>
                </div>
                <span className="text-[10px] text-[#A8A29E] shrink-0">Yesterday</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Middle Section: Pending Student Leave Requests Approval Hub */}
      <div className="saas-card p-5 text-[#292524]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-[#E7E5E4] gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base text-[#292524] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#3F8F72]" />
                Pending Student Leave Applications
              </h2>
              <span className="badge-warning text-[10px] px-2 py-0.5 rounded-full font-bold">
                {leaveRequests.filter(l => l.status === 'PENDING').length} Pending
              </span>
            </div>
            <p className="text-xs text-[#57534E] mt-0.5">
              Review medical certificates and official leave applications awaiting administrative or faculty approval.
            </p>
          </div>

          <button
            onClick={() => onNavigateTo('leave')}
            className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 cursor-pointer self-start sm:self-auto"
          >
            View All Leave Records →
          </button>
        </div>

        {leaveRequests.filter(l => l.status === 'PENDING').length === 0 ? (
          <div className="p-8 text-center text-xs text-[#78716C] bg-[#F5F5F4] rounded-xl border border-[#E7E5E4]">
            <CheckCircle2 className="w-8 h-8 text-[#3F8F72] mx-auto mb-2 opacity-80" />
            <p className="font-bold text-[#292524]">All leave requests have been reviewed!</p>
            <p className="text-[#57534E] text-[11px] mt-0.5">No pending student applications at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaveRequests.filter(l => l.status === 'PENDING').slice(0, 6).map(leave => {
              const student = students.find(s => s.id === leave.student_id);
              return (
                <div key={leave.id} className="p-4 bg-white rounded-xl border border-[#E7E5E4] shadow-2xs hover:border-[#3F8F72] transition-colors flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={student?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                          alt={leave.student_name || 'Student'}
                          className="w-7 h-7 rounded-full object-cover border border-[#E7E5E4]"
                        />
                        <div>
                          <p className="font-bold text-xs text-[#292524]">{leave.student_name || student?.full_name}</p>
                          <p className="text-[10px] text-[#57534E]">Roll: {leave.roll_number || student?.roll_number || 'N/A'}</p>
                        </div>
                      </div>
                      <span className="badge-warning text-[10px] px-2 py-0.5 rounded font-mono">PENDING</span>
                    </div>

                    <div className="text-xs text-[#57534E] space-y-1 bg-[#F5F5F4] p-2.5 rounded-lg border border-[#E7E5E4] my-2">
                      <div className="flex items-center justify-between text-[11px] text-[#292524] font-semibold">
                        <span>Dates: {leave.from_date} → {leave.to_date}</span>
                        {leave.attachment_name && (
                          <span className="text-[10px] text-[#3F8F72] flex items-center gap-0.5">
                            <Paperclip className="w-3 h-3" /> PDF
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#57534E] line-clamp-2 italic">"{leave.reason}"</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E7E5E4]">
                    <button
                      onClick={() => onNavigateTo('leave')}
                      className="text-[11px] text-[#57534E] hover:text-[#292524] font-semibold underline cursor-pointer"
                    >
                      View Details
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAdminLeaveDecision(leave.id, 'APPROVED')}
                        disabled={submittingLeaveId === leave.id}
                        className="btn-primary text-[11px] py-1 px-2.5 flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>

                      <button
                        onClick={() => handleAdminLeaveDecision(leave.id, 'REJECTED')}
                        disabled={submittingLeaveId === leave.id}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] py-1 px-2.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lower Section: Low Attendance Students Table */}
      <div className="saas-card p-5 text-[#292524]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-[#E7E5E4] gap-3">
          <div>
            <h2 className="font-semibold text-base text-[#292524] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D95C5C]" />
              Students Below Required Attendance (&lt;75%)
            </h2>
            <p className="text-xs text-[#57534E] mt-0.5">
              Automated warning emails trigger when student attendance drops below 75%.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAutoScan}
              disabled={scanningAuto}
              className="bg-[#D95C5C] hover:bg-[#c44e4e] disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanningAuto ? 'animate-spin' : ''}`} />
              {scanningAuto ? 'Scanning...' : 'Trigger Auto Emails'}
            </button>

            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              Email Outbox
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#57534E]">
            <thead className="bg-[#F5F5F4] text-[#57534E] uppercase font-bold text-[10px] border-b border-[#E7E5E4]">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">ID / Roll</th>
                <th className="px-4 py-3">Class / Sec</th>
                <th className="px-4 py-3 text-center">Current %</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E4]">
              {lowAttendanceStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-[#A8A29E]">
                    All students are maintaining safe attendance thresholds!
                  </td>
                </tr>
              ) : (
                lowAttendanceStudents.map(s => (
                  <tr key={s.id} className="hover:bg-[#F5F5F4] transition-colors">
                    <td className="px-4 py-3 font-medium text-[#292524]">
                      <div className="flex items-center gap-2.5">
                        <img src={s.avatar} alt={s.full_name} className="w-7 h-7 rounded-full object-cover border border-[#E7E5E4]" />
                        <span>{s.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#57534E]">{s.roll_number}</td>
                    <td className="px-4 py-3 text-[#57534E]">{s.class_name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="badge-danger px-2.5 py-1 rounded-md text-[11px]">
                        {s.overall_attendance_pct}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleSendSingleAlert(s)}
                        disabled={sendingId === s.id}
                        className="btn-secondary text-[11px] py-1 px-2.5 ml-auto cursor-pointer flex items-center gap-1"
                      >
                        <Send className="w-3 h-3 text-[#3F8F72]" />
                        {sendingId === s.id ? 'Sending...' : 'Send Alert Email'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EmailAlertsModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        students={students}
      />

    </div>
  );
};
