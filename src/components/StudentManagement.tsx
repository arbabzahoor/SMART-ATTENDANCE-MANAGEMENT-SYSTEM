import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Camera,
  ScanFace,
  ShieldCheck,
  Check,
  Sparkles,
  RefreshCw,
  Info,
  Lock
} from 'lucide-react';
import { Student, Department, Program, ClassSection } from '../types';
import { usePagination } from '../hooks/usePagination';
import { PaginationControls } from './PaginationControls';

const createNextStudentIdentifier = (prefix: string, existingValues: string[]) => {
  const existing = new Set(existingValues.map(value => value.trim().toLowerCase()));
  let sequence = 1;
  let identifier = `${prefix}${String(sequence).padStart(3, '0')}`;

  while (existing.has(identifier.toLowerCase())) {
    sequence += 1;
    identifier = `${prefix}${String(sequence).padStart(3, '0')}`;
  }

  return identifier;
};

interface StudentManagementProps {
  students: Student[];
  departments: Department[];
  programs: Program[];
  classes: ClassSection[];
  onRefresh: () => void;
  onNavigateToFaceAttendance?: (student: Student) => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  students,
  departments,
  programs,
  classes,
  onRefresh,
  onNavigateToFaceAttendance,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedProg, setSelectedProg] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');

  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    roll_number: '',
    student_code: '',
    email: '',
    phone: '',
    guardian_phone: '',
    gender: 'MALE' as const,
    dob: '2003-01-01',
    department_id: departments[0]?.id || 1,
    program_id: programs[0]?.id || 1,
    class_id: classes[0]?.id || 1,
    semester: 6,
    batch: '2022-2026',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(search.toLowerCase()) ||
      s.student_code.toLowerCase().includes(search.toLowerCase());

    const matchesDept = !selectedDept || s.department_id === Number(selectedDept);
    const matchesProg = !selectedProg || s.program_id === Number(selectedProg);
    const matchesClass = !selectedClass || s.class_id === Number(selectedClass);

    return matchesSearch && matchesDept && matchesProg && matchesClass;
  });
  const pagination = usePagination<Student>(
    filteredStudents,
    JSON.stringify([search, selectedDept, selectedProg, selectedClass])
  );

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setAccountPassword('');
    const year = new Date().getFullYear();
    const departmentCode = departments[0]?.code || 'CS';
    setFormData({
      full_name: '',
      roll_number: createNextStudentIdentifier(
        `${departmentCode}-${year}-`,
        students.map(student => student.roll_number),
      ),
      student_code: createNextStudentIdentifier(
        `STU-${year}-`,
        students.map(student => student.student_code),
      ),
      email: '',
      phone: '+92 (300) 123-4567',
      guardian_phone: '',
      gender: 'MALE',
      dob: '2003-05-15',
      department_id: departments[0]?.id || 1,
      program_id: programs[0]?.id || 1,
      class_id: classes[0]?.id || 1,
      semester: 6,
      batch: '2022-2026',
    });
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setAccountPassword('');
    setFormData({
      full_name: student.full_name,
      roll_number: student.roll_number,
      student_code: student.student_code,
      email: student.email,
      phone: student.phone,
      guardian_phone: student.guardian_phone || '',
      gender: student.gender,
      dob: student.dob,
      department_id: student.department_id,
      program_id: student.program_id,
      class_id: student.class_id,
      semester: student.semester,
      batch: student.batch,
    });
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (
      !formData.full_name.trim() ||
      !formData.email.trim() ||
      !formData.roll_number.trim() ||
      !formData.student_code.trim()
    ) {
      setErrorMsg('Complete the required student fields: name, email, roll number, and student code.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setErrorMsg('Enter a valid email address.');
      return;
    }
    if (!editingStudent && accountPassword.length < 8) {
      setErrorMsg('Enter an initial portal password with at least 8 characters.');
      return;
    }
    if (editingStudent && accountPassword.length > 0 && accountPassword.length < 8) {
      setErrorMsg('A portal password must be at least 8 characters long.');
      return;
    }

    setSaving(true);
    const url = editingStudent ? `/api/students/${editingStudent.id}` : '/api/students';
    const method = editingStudent ? 'PUT' : 'POST';

    const payload = {
      ...formData,
      password: editingStudent ? (accountPassword || undefined) : accountPassword,
      ...(editingStudent ? { avatar: editingStudent.avatar } : {}),
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setShowModal(false);
        onRefresh();
        if (!editingStudent) {
          setSuccessToast(`Student "${formData.full_name}" registered. Use Face Enrollment in the directory to capture consented samples.`);
          setTimeout(() => setSuccessToast(null), 7000);
        } else {
          setSuccessToast(accountPassword
            ? `Portal password reset for "${formData.full_name}". They can sign in with their email or roll number.`
            : `Student "${formData.full_name}" details updated.`);
          setTimeout(() => setSuccessToast(null), 5000);
        }
      } else {
        setErrorMsg(data.error || 'Validation error saving student');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to server');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (student: Student) => {
    const newStatus = student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this student record?')) return;
    try {
      await fetch(`/api/students/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-slate-100">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-400" />
            Student Directory Management
          </h2>
          <p className="text-xs text-slate-400">Enroll, filter, update, and manage student accounts across departments.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Enroll New Student
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-700">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, roll no, student ID..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>

        {/* Dept Filter */}
        <select
          value={selectedDept}
          onChange={e => setSelectedDept(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.code})
            </option>
          ))}
        </select>

        {/* Program Filter */}
        <select
          value={selectedProg}
          onChange={e => setSelectedProg(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
        >
          <option value="">All Programs</option>
          {programs.map(p => (
            <option key={p.id} value={p.id}>
              {p.code} - {p.name}
            </option>
          ))}
        </select>

        {/* Class Filter */}
        <select
          value={selectedClass}
          onChange={e => setSelectedClass(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
        >
          <option value="">All Classes / Sections</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

      </div>

      {/* Success Notification Toast */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl flex items-center justify-between gap-3 shadow-md animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Roll No / Code</th>
                <th className="px-6 py-3.5">Department & Program</th>
                <th className="px-6 py-3.5">Class / Semester</th>
                <th className="px-6 py-3.5 text-center">Face Attendance</th>
                <th className="px-6 py-3.5">Attendance</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No matching student records found.
                  </td>
                </tr>
              ) : (
                pagination.items.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Student Info */}
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <img
                          src={student.avatar}
                          alt={student.full_name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{student.full_name}</p>
                          <p className="text-slate-500 text-[11px]">{student.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Roll No */}
                    <td className="px-6 py-4 font-mono font-semibold text-slate-800">
                      <div>{student.roll_number}</div>
                      <div className="text-[10px] text-slate-400">{student.student_code}</div>
                    </td>

                    {/* Department */}
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{student.department_name}</p>
                      <p className="text-slate-500 text-[11px]">{student.program_name}</p>
                    </td>

                    {/* Class */}
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-indigo-700 border border-slate-200 px-2 py-0.5 rounded font-medium">
                        {student.class_name}
                      </span>
                      <p className="text-slate-500 text-[10px] mt-1">Semester {student.semester}</p>
                    </td>

                    {/* Face enrollment status */}
                    <td className="px-6 py-4 text-center">
                      {student.is_face_enrolled ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Face Enrolled
                          </span>
                          <button
                            onClick={() => onNavigateToFaceAttendance?.(student)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs cursor-pointer"
                            title="Launch live camera attendance for this student"
                          >
                            <Camera className="w-3 h-3" />
                            Live Attend
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onNavigateToFaceAttendance?.(student)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all cursor-pointer shadow-2xs"
                          title="Capture live face sample and register for camera attendance"
                        >
                          <Camera className="w-3.5 h-3.5 text-amber-600" />
                          Face Enrollment
                        </button>
                      )}
                    </td>

                    {/* Attendance % */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full ${
                              (student.overall_attendance_pct || 100) >= 75
                                ? 'bg-emerald-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${student.overall_attendance_pct || 100}%` }}
                          />
                        </div>
                        <span className={`font-bold ${
                          (student.overall_attendance_pct || 100) >= 75
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}>
                          {student.overall_attendance_pct || 100}%
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(student)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider transition-colors ${
                          student.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {student.status}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onNavigateToFaceAttendance?.(student)}
                          className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                          title="Open Camera Attendance for this student"
                        >
                          <ScanFace className="w-3.5 h-3.5 text-emerald-600" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(student)}
                          className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                          title="Edit Student"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                          title="Delete Student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls pagination={pagination} label="students" />
      </div>

      {/* Modal for Add / Edit Student */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl p-6 shadow-2xl text-slate-800 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  {editingStudent ? 'Edit Student Details' : 'Enroll New Student'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete the student's academic and portal account details. Face enrollment is separate after registration.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form noValidate onSubmit={handleSubmit} className="space-y-6 text-xs">
              
              {/* SECTION 1: Personal & Academic Credentials */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-100">
                  1. Academic & Student Credentials
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      placeholder="e.g. Muhammad Bilal"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      placeholder="bilal@student.alpine.edu.pk"
                    />
                    <p className="text-[10px] text-indigo-600 font-medium mt-1">
                      🔑 Used by student for web login.
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Roll Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.roll_number}
                      onChange={e => setFormData({ ...formData, roll_number: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  {!editingStudent ? (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Initial Account Password * (8+ characters)</label>
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={accountPassword}
                        onChange={e => setAccountPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Required to create the student's portal account.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Reset Student Portal Password (optional)</label>
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={accountPassword}
                        onChange={e => setAccountPassword(e.target.value)}
                        placeholder="Leave blank to keep the current password"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Saving a new password activates a student portal account if one is not linked yet.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Student Code / ID *</label>
                    <input
                      type="text"
                      required
                      value={formData.student_code}
                      onChange={e => setFormData({ ...formData, student_code: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Class Section *</label>
                    <select
                      value={formData.class_id}
                      onChange={e => setFormData({ ...formData, class_id: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white font-medium"
                    >
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.academic_session})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Department</label>
                    <select
                      value={formData.department_id}
                      onChange={e => setFormData({ ...formData, department_id: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                    <select
                      value={formData.gender}
                      onChange={e => setFormData({ ...formData, gender: e.target.value as 'MALE' | 'FEMALE' })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                    <label className="block font-semibold text-slate-700 mb-1">Student Phone Number</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                    </div>
                    <div>
                    <label className="block font-semibold text-slate-700 mb-1">Registered Guardian WhatsApp</label>
                    <input
                      type="tel"
                      value={formData.guardian_phone}
                      onChange={e => setFormData({ ...formData, guardian_phone: e.target.value })}
                      placeholder="+92 300 1234567"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Used to verify parent registration and child links.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500">
                  Enroll the student's face separately from the student directory after registration.
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{saving ? 'Registering...' : editingStudent ? 'Update Student' : 'Register Student'}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
