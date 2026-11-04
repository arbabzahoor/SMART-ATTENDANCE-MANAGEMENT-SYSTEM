import React, { useState } from 'react';
import { BookOpen, Layers, Plus, Users, Search, X, Check, Award, GraduationCap } from 'lucide-react';
import { ClassSection, Subject, Program, Department, Teacher } from '../types';

interface ClassesManagementProps {
  classes: ClassSection[];
  subjects: Subject[];
  programs: Program[];
  departments: Department[];
  teachers: Teacher[];
  onRefresh: () => void;
}

export const ClassesManagement: React.FC<ClassesManagementProps> = ({
  classes,
  subjects,
  programs,
  departments,
  teachers,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects'>('classes');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals state
  const [isClassModalOpen, setIsClassModalOpen] = useState<boolean>(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Class Section Form
  const [progId, setProgId] = useState('');
  const [className, setClassName] = useState('');
  const [semester, setSemester] = useState('6');
  const [section, setSection] = useState('A');
  const [batch, setBatch] = useState('2022-2026');

  // New Subject Form
  const [subCode, setSubCode] = useState('');
  const [subName, setSubName] = useState('');
  const [subCreditHours, setSubCreditHours] = useState('3');
  const [subDeptId, setSubDeptId] = useState('');
  const [subClassId, setSubClassId] = useState('');
  const [subTeacherId, setSubTeacherId] = useState('');

  const filteredClasses = classes.filter(
    c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.batch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubjects = subjects.filter(
    s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.teacher_name && s.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progId || !className) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: Number(progId),
          name: className,
          semester: Number(semester),
          section: section.toUpperCase(),
          academic_session: '2025-2026',
          batch,
        }),
      });

      if (res.ok) {
        setToastMessage(`Class section "${className}" created successfully!`);
        setIsClassModalOpen(false);
        setProgId('');
        setClassName('');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      setToastMessage('Failed to create class section');
    } finally {
      setSubmitting(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCode || !subName || !subClassId || !subTeacherId) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: subCode.toUpperCase(),
          name: subName,
          credit_hours: Number(subCreditHours),
          department_id: Number(subDeptId) || 1,
          class_id: Number(subClassId),
          teacher_id: Number(subTeacherId),
          semester: 6,
        }),
      });

      if (res.ok) {
        setToastMessage(`Subject "${subName} (${subCode})" added to catalog!`);
        setIsSubjectModalOpen(false);
        setSubCode('');
        setSubName('');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      setToastMessage('Failed to create subject');
    } finally {
      setSubmitting(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            Class Sections & Subject Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage academic batches, active class sections, credit hour allocations, and assigned subject faculty.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsClassModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Class Section
          </button>

          <button
            onClick={() => setIsSubjectModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> Add Course / Subject
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Class Sections</p>
            <p className="text-2xl font-bold text-slate-900">{classes.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Registered Subjects</p>
            <p className="text-2xl font-bold text-slate-900">{subjects.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Credit Hours</p>
            <p className="text-2xl font-bold text-slate-900">
              {subjects.reduce((sum, s) => sum + s.credit_hours, 0)} Cr.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('classes')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'classes'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Class Sections ({classes.length})
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'subjects'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Subjects Catalog ({subjects.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search classes or subjects..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Content */}
      {activeTab === 'classes' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map(cls => {
            const classSubs = subjects.filter(s => s.class_id === cls.id);
            return (
              <div key={cls.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4 hover:border-indigo-200 transition-colors">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="font-bold text-slate-900 text-lg">{cls.name}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Semester {cls.semester} - Sec {cls.section}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Academic Session:</span>
                    <span className="font-semibold text-slate-800">{cls.academic_session}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Batch Cohort:</span>
                    <span className="font-semibold text-slate-800">{cls.batch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Enrolled Students:</span>
                    <span className="font-bold text-indigo-600">{cls.student_count || 5} Students</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase mb-2">Assigned Subjects ({classSubs.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {classSubs.map(s => (
                      <span key={s.id} className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-1 rounded-md border border-slate-200">
                        {s.code}: {s.name}
                      </span>
                    ))}
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
                  <th className="px-6 py-4">Course Code</th>
                  <th className="px-6 py-4">Subject Title</th>
                  <th className="px-6 py-4">Credit Hours</th>
                  <th className="px-6 py-4">Target Class</th>
                  <th className="px-6 py-4">Assigned Faculty Instructor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubjects.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600">{sub.code}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{sub.name}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{sub.credit_hours} Cr. Hrs</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{sub.class_name || 'BSCS - 6A'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{sub.teacher_name || 'Unassigned'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add Class Section</h3>
              <button onClick={() => setIsClassModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Degree Program *</label>
                <select
                  required
                  value={progId}
                  onChange={e => setProgId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Degree Program --</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Class Section Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BSCS - 6A"
                  value={className}
                  onChange={e => setClassName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Semester</label>
                  <select
                    value={semester}
                    onChange={e => setSemester(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    required
                    value={section}
                    onChange={e => setSection(e.target.value)}
                    placeholder="e.g. A, B, C"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Batch Cohort</label>
                <input
                  type="text"
                  value={batch}
                  onChange={e => setBatch(e.target.value)}
                  placeholder="e.g. 2022-2026"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Class Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add Course / Subject</h3>
              <button onClick={() => setIsSubjectModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Course Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-301"
                    value={subCode}
                    onChange={e => setSubCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credit Hours</label>
                  <select
                    value={subCreditHours}
                    onChange={e => setSubCreditHours(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="1">1 Cr. Hr (Lab)</option>
                    <option value="2">2 Cr. Hrs</option>
                    <option value="3">3 Cr. Hrs (Theory)</option>
                    <option value="4">4 Cr. Hrs (Theory + Lab)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Database Systems"
                  value={subName}
                  onChange={e => setSubName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Class Section *</label>
                <select
                  required
                  value={subClassId}
                  onChange={e => setSubClassId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Target Class --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Faculty Instructor *</label>
                <select
                  required
                  value={subTeacherId}
                  onChange={e => setSubTeacherId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Instructor --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
