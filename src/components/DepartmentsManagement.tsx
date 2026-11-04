import React, { useState } from 'react';
import { Building2, GraduationCap, Plus, Users, BookOpen, Search, X, Check, Award, Layers } from 'lucide-react';
import { Department, Program, Student, Teacher } from '../types';

interface DepartmentsManagementProps {
  departments: Department[];
  programs: Program[];
  students: Student[];
  teachers: Teacher[];
  onRefresh: () => void;
}

export const DepartmentsManagement: React.FC<DepartmentsManagementProps> = ({
  departments,
  programs,
  students,
  teachers,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'departments' | 'programs'>('departments');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modals state
  const [isDeptModalOpen, setIsDeptModalOpen] = useState<boolean>(false);
  const [isProgModalOpen, setIsProgModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Department Form
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  // New Program Form
  const [progCode, setProgCode] = useState('');
  const [progName, setProgName] = useState('');
  const [progDeptId, setProgDeptId] = useState('');
  const [progDuration, setProgDuration] = useState('4');

  const filteredDepts = departments.filter(
    d =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProgs = programs.filter(
    p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.department_name && p.department_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptCode || !deptName) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: deptCode.toUpperCase(),
          name: deptName,
          description: deptDesc,
        }),
      });

      if (res.ok) {
        setToastMessage(`Department "${deptName}" created successfully!`);
        setIsDeptModalOpen(false);
        setDeptCode('');
        setDeptName('');
        setDeptDesc('');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      setToastMessage('Failed to create department');
    } finally {
      setSubmitting(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progCode || !progName || !progDeptId) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: progCode.toUpperCase(),
          name: progName,
          department_id: Number(progDeptId),
          duration_years: Number(progDuration),
        }),
      });

      if (res.ok) {
        setToastMessage(`Degree Program "${progName}" created successfully!`);
        setIsProgModalOpen(false);
        setProgCode('');
        setProgName('');
        setProgDeptId('');
        setProgDuration('4');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      setToastMessage('Failed to create program');
    } finally {
      setSubmitting(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            Departments & Degree Programs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Academic structure, faculty affiliation, and accredited degree degree pathways at Alpine Degree College Khanpur.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDeptModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Department
          </button>
          
          <button
            onClick={() => setIsProgModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> Add Degree Program
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Academic Departments</p>
            <p className="text-2xl font-bold text-slate-900">{departments.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Degree Programs</p>
            <p className="text-2xl font-bold text-slate-900">{programs.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Faculty Members</p>
            <p className="text-2xl font-bold text-slate-900">{teachers.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Enrolled Students</p>
            <p className="text-2xl font-bold text-slate-900">{students.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('departments')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'departments'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Departments ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab('programs')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'programs'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Degree Programs ({programs.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search departments or programs..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Content Grid */}
      {activeTab === 'departments' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDepts.map(dept => {
            const deptStudents = students.filter(s => s.department_id === dept.id).length;
            const deptTeachers = teachers.filter(t => t.department_id === dept.id).length;
            const deptProgs = programs.filter(p => p.department_id === dept.id);

            return (
              <div key={dept.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-200 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs">
                      Code: {dept.code}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">{deptProgs.length} Accredited Degree Programs</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{dept.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{dept.description || 'Department of academic excellence at Alpine Degree College.'}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span>{deptTeachers} Faculty Members</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-500" />
                    <span>{deptStudents} Enrolled Students</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Program Code</th>
                  <th className="px-6 py-4">Degree Title</th>
                  <th className="px-6 py-4">Parent Department</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4 text-right">Students Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProgs.map(prog => {
                  const progStudentsCount = students.filter(s => s.program_id === prog.id).length;
                  return (
                    <tr key={prog.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-indigo-600">{prog.code}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{prog.name}</td>
                      <td className="px-6 py-4 text-slate-600">{prog.department_name || 'Computer Science'}</td>
                      <td className="px-6 py-4 font-medium">{prog.duration_years} Years ({prog.duration_years * 2} Semesters)</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">{progStudentsCount} Students</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add Academic Department</h3>
              <button onClick={() => setIsDeptModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS, IT, AI"
                  value={deptCode}
                  onChange={e => setDeptCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science & IT"
                  value={deptName}
                  onChange={e => setDeptName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Department details, faculty specialization..."
                  value={deptDesc}
                  onChange={e => setDeptDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Program Modal */}
      {isProgModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add Degree Program</h3>
              <button onClick={() => setIsProgModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Parent Department *</label>
                <select
                  required
                  value={progDeptId}
                  onChange={e => setProgDeptId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Department --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Program Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BSCS, BSIT, BSAI"
                  value={progCode}
                  onChange={e => setProgCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Degree Program Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bachelor of Science in Computer Science"
                  value={progName}
                  onChange={e => setProgName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Duration (Years)</label>
                <select
                  value={progDuration}
                  onChange={e => setProgDuration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="2">2 Years (Associate Degree)</option>
                  <option value="4">4 Years (Bachelor Honors)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProgModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Degree Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
