import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  Calendar,
  Clock,
  FileText,
  Users,
  Bot,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Subject, ClassSection, LeaveRequest, User } from '../types';

interface TeacherDashboardProps {
  currentUser: User;
  subjects: Subject[];
  classes: ClassSection[];
  leaveRequests: LeaveRequest[];
  onNavigateTo: (tab: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser,
  subjects,
  classes,
  leaveRequests,
  onNavigateTo,
}) => {
  const teacherSubjects = subjects.filter(s => s.teacher_id === currentUser?.id);
  const pendingLeaves = leaveRequests.filter(l => l.status === 'PENDING');

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6 text-[#292524] animate-fadeIn">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-[#EAF5F0] text-[#3F8F72] border border-[#A3D9C9] text-[10px] font-bold uppercase tracking-wider">
              Faculty Workspace
            </span>
            <span className="text-xs text-[#57534E]">Welcome, {currentUser?.full_name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#292524]">
            Teacher Dashboard
          </h1>
          <p className="text-sm text-[#57534E] mt-1">
            Manage course attendance, mark lecture registers, and review student leave requests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigateTo('attendance')}
            className="btn-primary flex items-center gap-2 cursor-pointer text-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark Attendance Sheet
          </button>
        </div>
      </div>

      {/* Grid: Assigned Classes & Pending Leaves */}
      <div className="teacher-dashboard-grid grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left (2 Cols): Assigned Courses */}
        <div className="teacher-courses-section lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[#292524] flex items-center gap-2 text-base">
              <BookOpen className="w-5 h-5 text-[#3F8F72]" />
              My Assigned Course Modules ({teacherSubjects.length})
            </h2>
          </div>

          <div className="teacher-course-grid grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teacherSubjects.map(subject => (
              <div key={subject.id} className="dashboard-card saas-card p-5 text-[#292524] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="bg-[#EAF5F0] text-[#3F8F72] font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-[#A3D9C9]">
                      {subject.code}
                    </span>
                    <span className="text-[11px] text-[#57534E] font-medium">Credits: {subject.credit_hours}</span>
                  </div>

                  <h3 className="font-bold text-base text-[#292524]">{subject.name}</h3>
                  <p className="text-xs text-[#57534E] mt-1">{subject.class_name} • Semester {subject.semester}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#E7E5E4] flex items-center justify-between">
                  <button
                    onClick={() => onNavigateTo('attendance')}
                    className="btn-primary w-full text-xs py-2 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Take Attendance Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right (1 Col): Pending Leaves Review */}
        <div className="dashboard-card teacher-leaves-card saas-card p-6 text-[#292524] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E7E5E4]">
              <h2 className="font-bold text-[#292524] flex items-center gap-2 text-base">
                <FileText className="w-5 h-5 text-[#D99A3D]" />
                Pending Leave Requests
              </h2>
              <span className="badge-warning text-[10px] px-2 py-0.5 rounded-full">
                {pendingLeaves.length}
              </span>
            </div>

            <div className="space-y-3">
              {pendingLeaves.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#78716C]">
                  No pending student leave applications.
                </div>
              ) : (
                pendingLeaves.slice(0, 4).map(leave => (
                  <div key={leave.id} className="p-3 bg-[#F5F5F4] rounded-xl border border-[#E7E5E4] text-xs space-y-1.5">
                    <div className="flex justify-between font-bold text-[#292524]">
                      <span>{leave.student_name}</span>
                      <span className="text-[10px] text-[#D99A3D] font-mono">{leave.from_date}</span>
                    </div>
                    <p className="text-[11px] text-[#57534E] line-clamp-2">{leave.reason}</p>
                    <button
                      onClick={() => onNavigateTo('leave')}
                      className="text-[11px] font-semibold text-[#3F8F72] hover:underline block mt-1 cursor-pointer"
                    >
                      Review & Decision →
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E7E5E4] text-center">
            <button
              onClick={() => onNavigateTo('ai-assistant')}
              className="btn-secondary w-full text-xs py-2.5 cursor-pointer flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4 text-[#3F8F72]" /> Ask Gemini Faculty Assistant
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
