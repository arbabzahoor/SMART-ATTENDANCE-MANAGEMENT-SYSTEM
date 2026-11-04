import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileSpreadsheet,
  Search,
  CheckCheck,
  RotateCcw,
  Save,
  AlertCircle,
  Calendar,
  BookOpen,
  Users,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ScanFace
} from 'lucide-react';
import { ClassSection, Subject, Student, AttendanceStatus, User } from '../types';

interface AttendanceMarkingProps {
  currentUser: User | null;
  classes: ClassSection[];
  subjects: Subject[];
  onSaveSuccess: () => void;
  onNavigateToFaceAttendance?: () => void;
}

interface StudentRow {
  student_id: number;
  roll_number: string;
  full_name: string;
  status: AttendanceStatus;
  remarks: string;
}

export const AttendanceMarking: React.FC<AttendanceMarkingProps> = ({
  currentUser,
  classes,
  subjects,
  onSaveSuccess,
  onNavigateToFaceAttendance,
}) => {
  const [selectedClass, setSelectedClass] = useState<number>(classes[0]?.id || 1);
  const [selectedSubject, setSelectedSubject] = useState<number>(subjects[0]?.id || 1);
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [studentRows, setStudentRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter subjects by selected class
  const classSubjects = subjects.filter(s => s.class_id === selectedClass);

  // Helper date navigation functions
  const changeDateByDays = (days: number) => {
    const parts = attendanceDate.split('-').map(Number);
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    dateObj.setDate(dateObj.getDate() + days);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    setAttendanceDate(`${y}-${m}-${d}`);
  };

  const goToToday = () => {
    setAttendanceDate(new Date().toISOString().split('T')[0]);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = attendanceDate === todayStr;

  const formattedDateLong = (() => {
    try {
      const parts = attendanceDate.split('-').map(Number);
      const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return attendanceDate;
    }
  })();

  // Fetch enrolled students and existing attendance for selected Class, Subject, and Date
  const loadData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      // 1. Fetch students in this class
      const stuRes = await fetch(`/api/students?class_id=${selectedClass}`);
      const students: Student[] = await stuRes.json();

      // 2. Fetch existing attendance records
      const attRes = await fetch(
        `/api/attendance?class_id=${selectedClass}&subject_id=${selectedSubject}&date=${attendanceDate}`
      );
      const existingAtt = await attRes.json();

      const rows: StudentRow[] = students.map(s => {
        const found = existingAtt.find((a: any) => a.student_id === s.id);
        return {
          student_id: s.id,
          roll_number: s.roll_number,
          full_name: s.full_name,
          status: found ? found.status : 'PRESENT',
          remarks: found ? found.remarks : '',
        };
      });

      setStudentRows(rows);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error loading enrolled students or attendance logs' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass && selectedSubject && attendanceDate) {
      loadData();
    }
  }, [selectedClass, selectedSubject, attendanceDate]);

  // Bulk status helpers for currently visible students
  const markVisibleStatus = (status: AttendanceStatus) => {
    if (filteredRows.length === 0) return;
    const visibleIds = new Set(filteredRows.map(r => r.student_id));
    setStudentRows(prev =>
      prev.map(r => (visibleIds.has(r.student_id) ? { ...r, status } : r))
    );
    const statusText = status === 'PRESENT' ? 'Present' : status === 'ABSENT' ? 'Absent' : status === 'LATE' ? 'Late' : 'Leave';
    setMessage({
      type: 'success',
      text: `Set all ${filteredRows.length} visible student(s) to ${statusText}.`
    });
  };

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    setStudentRows(prev =>
      prev.map(r => (r.student_id === studentId ? { ...r, status } : r))
    );
  };

  const handleRemarkChange = (studentId: number, remarks: string) => {
    setStudentRows(prev =>
      prev.map(r => (r.student_id === studentId ? { ...r, remarks } : r))
    );
  };

  const handleSaveAttendance = async () => {
    if (studentRows.length === 0) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: selectedClass,
          subject_id: selectedSubject,
          teacher_id: currentUser?.id || 1,
          date: attendanceDate,
          records: studentRows.map(r => ({
            student_id: r.student_id,
            status: r.status,
            remarks: r.remarks,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Attendance saved successfully for ${studentRows.length} students!` });
        onSaveSuccess();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save attendance' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network communication failure' });
    } finally {
      setSaving(false);
    }
  };

  const filteredRows = studentRows.filter(
    r =>
      r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    present: studentRows.filter(r => r.status === 'PRESENT').length,
    absent: studentRows.filter(r => r.status === 'ABSENT').length,
    late: studentRows.filter(r => r.status === 'LATE').length,
    leave: studentRows.filter(r => r.status === 'LEAVE').length,
  };

  const currentClassObj = classes.find(c => c.id === selectedClass);
  const currentSubjectObj = subjects.find(s => s.id === selectedSubject);
  const className = currentClassObj ? currentClassObj.name : `Class-${selectedClass}`;
  const subjectName = currentSubjectObj ? currentSubjectObj.name : `Subject-${selectedSubject}`;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (filteredRows.length === 0) return;

    const headers = ['Roll Number', 'Student Name', 'Class', 'Subject', 'Date', 'Attendance Status', 'Remarks'];
    const csvRows = [
      headers.join(','),
      ...filteredRows.map(row => [
        `"${row.roll_number.replace(/"/g, '""')}"`,
        `"${row.full_name.replace(/"/g, '""')}"`,
        `"${className.replace(/"/g, '""')}"`,
        `"${subjectName.replace(/"/g, '""')}"`,
        `"${attendanceDate}"`,
        `"${row.status}"`,
        `"${(row.remarks || '').replace(/"/g, '""')}"`
      ].join(','))
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `Attendance_${className.replace(/\s+/g, '_')}_${attendanceDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Filter Header */}
      <div className="saas-card p-6 text-[#292524]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E7E5E4]">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#292524] flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-[#3F8F72]" />
              Mark Classroom Attendance
            </h2>
            <p className="text-xs text-[#57534E] mt-0.5">Select class, subject, and date to manage attendance records.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => markVisibleStatus('PRESENT')}
              disabled={filteredRows.length === 0}
              className="bg-[#EAF5F0] hover:bg-[#d8efe5] text-[#3F8F72] border border-[#A3D9C9] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
              title="Set all currently visible students to Present"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => markVisibleStatus('ABSENT')}
              disabled={filteredRows.length === 0}
              className="bg-[#FDF2F2] hover:bg-[#fae1e1] text-[#D95C5C] border border-[#FCA5A5] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
              title="Set all currently visible students to Absent"
            >
              <XCircle className="w-4 h-4" />
              Mark All Absent
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredRows.length === 0}
              className="btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
              title="Export filtered records as CSV"
            >
              <Download className="w-4 h-4 text-[#57534E]" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={filteredRows.length === 0}
              className="btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
              title="Print attendance list"
            >
              <Printer className="w-4 h-4 text-[#57534E]" />
              Print
            </button>
            {onNavigateToFaceAttendance && (
              <button
                type="button"
                onClick={onNavigateToFaceAttendance}
                className="bg-[#EAF5F0] hover:bg-[#d8efe5] text-[#3F8F72] border border-[#3F8F72]/30 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Launch AI Face Recognition Attendance Camera"
              >
                <ScanFace className="w-4 h-4 text-[#3F8F72]" />
                <span>AI Face Camera</span>
              </button>
            )}
            <button
              type="button"
              onClick={loadData}
              className="btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#57534E] mb-1.5 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#3F8F72]" /> Class / Section
            </label>
            <select
              value={selectedClass}
              onChange={e => {
                const cid = Number(e.target.value);
                setSelectedClass(cid);
                const matchSub = subjects.find(s => s.class_id === cid);
                if (matchSub) setSelectedSubject(matchSub.id);
              }}
              className="w-full bg-white border border-[#D6D3D1] rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#292524] focus:outline-none focus:border-[#3F8F72]"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.academic_session})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57534E] mb-1.5 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-[#3F8F72]" /> Subject
            </label>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(Number(e.target.value))}
              className="w-full bg-white border border-[#D6D3D1] rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#292524] focus:outline-none focus:border-[#3F8F72]"
            >
              {(classSubjects.length > 0 ? classSubjects : subjects).map(s => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57534E] mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#3F8F72]" /> Attendance Date
            </label>
            <input
              type="date"
              value={attendanceDate}
              onChange={e => setAttendanceDate(e.target.value)}
              className="w-full bg-white border border-[#D6D3D1] rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#292524] focus:outline-none focus:border-[#3F8F72]"
            />
          </div>
        </div>
      </div>

      {/* Message feedback */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-medium flex items-center justify-between shadow-2xs ${
            message.type === 'success'
              ? 'bg-[#EAF5F0] border border-[#A3D9C9] text-[#3F8F72]'
              : 'bg-[#FDF2F2] border border-[#FCA5A5] text-[#D95C5C]'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-[#3F8F72] shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#D95C5C] shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-[#78716C] hover:text-[#292524] cursor-pointer">✕</button>
        </div>
      )}

      {/* Student List & Attendance Table */}
      <div className="saas-card overflow-hidden">
        
        {/* Date Navigation & Status Breakdown Header */}
        <div className="p-4 bg-[#F5F5F4] border-b border-[#E7E5E4] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Interactive Date Picker & Day Navigator */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center bg-white border border-[#E7E5E4] rounded-xl shadow-2xs p-1">
              <button
                type="button"
                onClick={() => changeDateByDays(-1)}
                className="p-1.5 rounded-lg text-[#57534E] hover:text-[#292524] hover:bg-[#F5F5F4] transition-colors cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Date Input with Formatted Visual Trigger */}
              <label className="relative flex items-center gap-2 px-2.5 py-1 text-xs font-bold text-[#292524] hover:bg-[#F5F5F4] rounded-lg cursor-pointer transition-colors select-none">
                <CalendarDays className="w-4 h-4 text-[#3F8F72]" />
                <span>{formattedDateLong}</span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={e => setAttendanceDate(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  title="Click to pick a specific date"
                />
              </label>

              <button
                type="button"
                onClick={() => changeDateByDays(1)}
                className="p-1.5 rounded-lg text-[#57534E] hover:text-[#292524] hover:bg-[#F5F5F4] transition-colors cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={goToToday}
              disabled={isToday}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs border cursor-pointer ${
                isToday
                  ? 'bg-[#EAF5F0] border-[#A3D9C9] text-[#3F8F72] opacity-80 cursor-default'
                  : 'bg-white border-[#E7E5E4] text-[#57534E] hover:text-[#292524] hover:bg-[#F5F5F4]'
              }`}
            >
              Today
            </button>
          </div>

          {/* Quick Roster Status Counts for this Date */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EAF5F0] border border-[#A3D9C9] text-[#3F8F72] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#3F8F72]"></span>
              Present: {stats.present}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FDF2F2] border border-[#FCA5A5] text-[#D95C5C] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#D95C5C]"></span>
              Absent: {stats.absent}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FEF8EC] border border-[#FDE68A] text-[#D99A3D] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#D99A3D]"></span>
              Late: {stats.late}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F3F8] border border-[#D8D2E7] text-[#8B7FA8] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#8B7FA8]"></span>
              Leave: {stats.leave}
            </span>
          </div>

        </div>

        {/* Real-Time Search & Bulk Actions Toolbar */}
        <div className="p-4 border-b border-[#E7E5E4] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search student by name or roll number..."
              className="w-full bg-white border border-[#D6D3D1] rounded-xl pl-10 pr-4 py-2 text-xs text-[#292524] placeholder-[#A8A29E] focus:outline-none focus:border-[#3F8F72]"
            />
          </div>

          {/* Bulk Action Controls */}
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-[11px] text-[#78716C] font-bold uppercase tracking-wider mr-1 hidden sm:inline">
              Bulk Set ({filteredRows.length}):
            </span>
            <button
              type="button"
              onClick={() => markVisibleStatus('PRESENT')}
              disabled={filteredRows.length === 0}
              className="bg-[#EAF5F0] hover:bg-[#d8efe5] text-[#3F8F72] border border-[#A3D9C9] px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
              title="Set all visible students to Present"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>All Present</span>
            </button>
            <button
              type="button"
              onClick={() => markVisibleStatus('ABSENT')}
              disabled={filteredRows.length === 0}
              className="bg-[#FDF2F2] hover:bg-[#fae1e1] text-[#D95C5C] border border-[#FCA5A5] px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
              title="Set all visible students to Absent"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>All Absent</span>
            </button>
            <div className="h-4 w-px bg-[#E7E5E4] mx-1 hidden sm:block"></div>
            <div className="text-xs text-[#57534E] font-medium bg-[#F5F5F4] px-2.5 py-1 rounded-lg border border-[#E7E5E4]">
              Showing: <span className="text-[#292524] font-bold">{filteredRows.length}</span> / {studentRows.length}
            </div>
          </div>
        </div>

        {/* Printable Official Sheet Header (Print Media Only) */}
        <div className="hidden print:block p-6 border-b border-[#E7E5E4] bg-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-[#292524]">Attendance Sheet</h1>
              <p className="text-xs text-[#57534E] mt-1">
                <span className="font-semibold">Class / Section:</span> {className} &nbsp;|&nbsp; 
                <span className="font-semibold">Subject:</span> {subjectName}
              </p>
            </div>
            <div className="text-right text-xs text-[#57534E]">
              <p className="font-bold text-[#292524]">Date: {formattedDateLong} ({attendanceDate})</p>
              <p className="mt-1">
                Total: {filteredRows.length} &nbsp;|&nbsp;
                Present: {stats.present} &nbsp;|&nbsp;
                Absent: {stats.absent} &nbsp;|&nbsp;
                Late: {stats.late} &nbsp;|&nbsp;
                Leave: {stats.leave}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#57534E] printable-table">
            <thead className="bg-[#F5F5F4] text-[#78716C] font-bold uppercase tracking-wider text-[10px] border-b border-[#E7E5E4]">
              <tr>
                <th className="px-6 py-3.5">Roll No</th>
                <th className="px-6 py-3.5">Student Name</th>
                <th className="px-6 py-3.5 text-center">Attendance Status</th>
                <th className="px-6 py-3.5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E4]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-[#78716C]">
                    Loading student list...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-[#78716C]">
                    No enrolled students found for selected criteria.
                  </td>
                </tr>
              ) : (
                filteredRows.map(row => (
                  <tr key={row.student_id} className="hover:bg-[#F5F5F4]/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#292524]">
                      {row.roll_number}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-[#292524]">
                      {row.full_name}
                    </td>
                    <td className="px-6 py-4">
                      {/* Printable status indicator */}
                      <div className="hidden print:block text-center font-bold text-xs">
                        {row.status === 'PRESENT' && <span className="text-[#3F8F72]">PRESENT</span>}
                        {row.status === 'ABSENT' && <span className="text-[#D95C5C]">ABSENT</span>}
                        {row.status === 'LATE' && <span className="text-[#D99A3D]">LATE</span>}
                        {row.status === 'LEAVE' && <span className="text-[#8B7FA8]">LEAVE</span>}
                      </div>

                      {/* Screen Interactive Buttons */}
                      <div className="flex items-center justify-center gap-1.5 print:hidden">
                        
                        {/* Present */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(row.student_id, 'PRESENT')}
                          className={`group px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all duration-200 ease-out flex items-center gap-1.5 border cursor-pointer select-none active:scale-95 ${
                            row.status === 'PRESENT'
                              ? 'bg-[#EAF5F0] border-[#3F8F72] text-[#3F8F72] shadow-2xs scale-[1.02] ring-1 ring-[#3F8F72]/20'
                              : 'bg-white border-[#E7E5E4] text-[#57534E] hover:bg-[#F5F5F4] hover:border-[#D6D3D1] hover:text-[#292524]'
                          }`}
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 transition-transform duration-200 ${row.status === 'PRESENT' ? 'scale-110' : 'group-hover:scale-110 group-active:scale-90'}`} />
                          Present
                        </button>

                        {/* Absent */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(row.student_id, 'ABSENT')}
                          className={`group px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all duration-200 ease-out flex items-center gap-1.5 border cursor-pointer select-none active:scale-95 ${
                            row.status === 'ABSENT'
                              ? 'bg-[#FDF2F2] border-[#D95C5C] text-[#D95C5C] shadow-2xs scale-[1.02] ring-1 ring-[#D95C5C]/20'
                              : 'bg-white border-[#E7E5E4] text-[#57534E] hover:bg-[#F5F5F4] hover:border-[#D6D3D1] hover:text-[#292524]'
                          }`}
                        >
                          <XCircle className={`w-3.5 h-3.5 transition-transform duration-200 ${row.status === 'ABSENT' ? 'scale-110' : 'group-hover:scale-110 group-active:scale-90'}`} />
                          Absent
                        </button>

                        {/* Late */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(row.student_id, 'LATE')}
                          className={`group px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all duration-200 ease-out flex items-center gap-1.5 border cursor-pointer select-none active:scale-95 ${
                            row.status === 'LATE'
                              ? 'bg-[#FEF8EC] border-[#D99A3D] text-[#D99A3D] shadow-2xs scale-[1.02] ring-1 ring-[#D99A3D]/20'
                              : 'bg-white border-[#E7E5E4] text-[#57534E] hover:bg-[#F5F5F4] hover:border-[#D6D3D1] hover:text-[#292524]'
                          }`}
                        >
                          <Clock className={`w-3.5 h-3.5 transition-transform duration-200 ${row.status === 'LATE' ? 'scale-110' : 'group-hover:scale-110 group-active:scale-90'}`} />
                          Late
                        </button>

                        {/* Leave */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(row.student_id, 'LEAVE')}
                          className={`group px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all duration-200 ease-out flex items-center gap-1.5 border cursor-pointer select-none active:scale-95 ${
                            row.status === 'LEAVE'
                              ? 'bg-[#F5F3F8] border-[#8B7FA8] text-[#8B7FA8] shadow-2xs scale-[1.02] ring-1 ring-[#8B7FA8]/20'
                              : 'bg-white border-[#E7E5E4] text-[#57534E] hover:bg-[#F5F5F4] hover:border-[#D6D3D1] hover:text-[#292524]'
                          }`}
                        >
                          <FileSpreadsheet className={`w-3.5 h-3.5 transition-transform duration-200 ${row.status === 'LEAVE' ? 'scale-110' : 'group-hover:scale-110 group-active:scale-90'}`} />
                          Leave
                        </button>

                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {/* Printable remarks text */}
                      <span className="hidden print:inline-block text-xs text-[#57534E]">
                        {row.remarks || '—'}
                      </span>

                      {/* Screen Remarks Input */}
                      <input
                        type="text"
                        value={row.remarks}
                        onChange={e => handleRemarkChange(row.student_id, e.target.value)}
                        placeholder="Optional note..."
                        className="w-full bg-white border border-[#D6D3D1] rounded-lg px-2.5 py-1 text-xs text-[#292524] placeholder-[#A8A29E] focus:outline-none focus:border-[#3F8F72] print:hidden"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Printable Signature Block (Print Media Only) */}
        <div className="hidden print:flex justify-between items-end p-6 pt-12 border-t border-[#E7E5E4] text-xs text-[#57534E]">
          <div>
            <p className="font-semibold text-[#292524]">Institution Attendance Record</p>
            <p className="text-[11px] text-[#78716C] mt-0.5">Generated via Smart Attendance System on {new Date().toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <div className="w-48 border-b border-[#292524] mb-1.5"></div>
            <p className="font-bold text-[#292524]">Teacher's Signature</p>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="p-4 bg-[#F5F5F4] border-t border-[#E7E5E4] flex items-center justify-between">
          <div className="text-xs text-[#57534E]">
            Selected Date: <span className="text-[#292524] font-semibold">{formattedDateLong} ({attendanceDate})</span>
          </div>

          <button
            onClick={handleSaveAttendance}
            disabled={saving || studentRows.length === 0}
            className="btn-primary px-6 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-2xs disabled:opacity-50 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Records...' : 'Save Attendance Sheet'}
          </button>
        </div>

      </div>

    </div>
  );
};


