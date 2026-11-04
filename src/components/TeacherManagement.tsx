import React, { useState } from 'react';
import { Users, Plus, Search, Edit2, CheckCircle, AlertCircle, X, BookOpen } from 'lucide-react';
import { Teacher, Department, Subject } from '../types';
import { usePagination } from '../hooks/usePagination';
import { PaginationControls } from './PaginationControls';

interface TeacherManagementProps {
  teachers: Teacher[];
  departments: Department[];
  subjects: Subject[];
  onRefresh: () => void;
}

export const TeacherManagement: React.FC<TeacherManagementProps> = ({
  teachers,
  departments,
  subjects,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [accountPassword, setAccountPassword] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '+1 (555) 234-5678',
    gender: 'MALE' as 'MALE' | 'FEMALE',
    department_id: departments[0]?.id || 1,
    designation: 'Associate Professor',
    teacher_code: '',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredTeachers = teachers.filter(t =>
    t.full_name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    t.teacher_code.toLowerCase().includes(search.toLowerCase())
  );
  const pagination = usePagination<Teacher>(filteredTeachers, search);

  const handleOpenAddModal = () => {
    setEditingTeacher(null);
    setAccountPassword('');
    setFormData({
      full_name: '',
      email: '',
      phone: '+1 (555) 234-5678',
      department_id: departments[0]?.id || 1,
      designation: 'Assistant Professor',
      teacher_code: `TCH-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    const url = editingTeacher ? `/api/teachers/${editingTeacher.id}` : '/api/teachers';
    const method = editingTeacher ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, ...(!editingTeacher ? { password: accountPassword } : {}) }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowModal(false);
        onRefresh();
      } else {
        setErrorMsg(data.error || 'Failed to save teacher record');
      }
    } catch (err) {
      setErrorMsg('Network error saving teacher');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-slate-100">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            Faculty & Teacher Directory
          </h2>
          <p className="text-xs text-slate-400">Manage teaching staff, departmental assignments, and subject mappings.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add New Faculty Member
        </button>
      </div>

      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search faculty name, email, code..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pagination.items.length === 0 ? (
          <div className="md:col-span-2 rounded-2xl border border-slate-100 bg-white p-8 text-center text-sm text-slate-500">
            No matching faculty records found.
          </div>
        ) : pagination.items.map(teacher => {
          const assigned = subjects.filter(s => s.teacher_id === teacher.id);
          return (
            <div key={teacher.id} className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 text-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={teacher.avatar}
                      alt={teacher.full_name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{teacher.full_name}</h3>
                      <p className="text-indigo-600 text-xs font-semibold">{teacher.designation}</p>
                      <p className="text-slate-500 text-[11px]">{teacher.department_name}</p>
                    </div>
                  </div>

                  <span className="bg-slate-100 text-slate-700 font-mono text-[10px] font-bold px-2 py-1 rounded border border-slate-200">
                    {teacher.teacher_code}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <p><span className="text-slate-400">Email:</span> {teacher.email}</p>
                  <p><span className="text-slate-400">Phone:</span> {teacher.phone}</p>
                </div>

                {/* Assigned subjects pill */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Assigned Course Modules ({assigned.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {assigned.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">No courses currently assigned</span>
                    ) : (
                      assigned.map(sub => (
                        <span key={sub.id} className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                          {sub.code} - {sub.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                  <CheckCircle className="w-3.5 h-3.5" /> Active Status
                </span>
                <button
                  onClick={() => {
                    setEditingTeacher(teacher);
                    setFormData({
                      full_name: teacher.full_name,
                      email: teacher.email,
                      phone: teacher.phone,
                      department_id: teacher.department_id,
                      designation: teacher.designation,
                      teacher_code: teacher.teacher_code,
                    });
                    setShowModal(true);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                >
                  Edit Profile
                </button>
              </div>

            </div>
          );
        })}
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <PaginationControls pagination={pagination} label="teachers" />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="font-bold text-base text-slate-900">
                {editingTeacher ? 'Edit Faculty Record' : 'Add New Faculty Member'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
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
                />
                <p className="text-[10px] text-indigo-600 font-medium mt-1">
                  🔑 Faculty member uses this email to log into the teacher portal.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teacher Code *</label>
                <input
                  type="text"
                  required
                  value={formData.teacher_code}
                  onChange={e => setFormData({ ...formData, teacher_code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {!editingTeacher && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Account Password *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={accountPassword}
                    onChange={e => setAccountPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              )}

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
                <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
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

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Faculty Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
