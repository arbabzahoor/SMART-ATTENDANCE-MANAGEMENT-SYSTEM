import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Filter, MapPin, User, BookOpen, AlertCircle, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import { TimetableSlot, ClassSection, Subject, Teacher } from '../types';

interface TimetableManagementProps {
  classes: ClassSection[];
  subjects: Subject[];
  teachers: Teacher[];
}

export const TimetableManagement: React.FC<TimetableManagementProps> = ({
  classes,
  subjects,
  teachers,
}) => {
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>('1');
  const [selectedDay, setSelectedDay] = useState<string>('ALL');

  // Add Slot Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form fields
  const [formClassId, setFormClassId] = useState<string>('1');
  const [formSubjectId, setFormSubjectId] = useState<string>('');
  const [formTeacherId, setFormTeacherId] = useState<string>('');
  const [formDay, setFormDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'>('Monday');
  const [formStartTime, setFormStartTime] = useState<string>('09:00');
  const [formEndTime, setFormEndTime] = useState<string>('10:30');
  const [formRoom, setFormRoom] = useState<string>('Lab-A');

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      let url = '/api/timetable';
      if (selectedClassId) url += `?class_id=${selectedClassId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTimetable(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [selectedClassId]);

  const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday')[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClassId || !formSubjectId || !formTeacherId) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: Number(formClassId),
          subject_id: Number(formSubjectId),
          teacher_id: Number(formTeacherId),
          day_of_week: formDay,
          start_time: formStartTime,
          end_time: formEndTime,
          room_number: formRoom,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to add timetable slot.');
      } else {
        setSuccessMessage('Timetable slot added successfully!');
        setIsModalOpen(false);
        await fetchTimetable();
      }
    } catch (err) {
      setErrorMessage('Network error creating slot.');
    } finally {
      setSubmitting(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const filteredSlots = timetable.filter(t => selectedDay === 'ALL' || t.day_of_week === selectedDay);

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Class Schedule & Timetable Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Weekly lecture allocations, room booking management, and instructor time slots at Alpine Degree College Khanpur.
          </p>
        </div>

        <button
          onClick={() => {
            setFormClassId(selectedClassId || '1');
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Lecture Slot
        </button>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {successMessage}
          </span>
          <button onClick={() => setSuccessMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Filter Class:</span>
          </div>
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.academic_session})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedDay('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedDay === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Days
          </button>
          {days.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDay === d
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {d.substring(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Timetable Grid View */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
          Loading class schedule...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {days
            .filter(d => selectedDay === 'ALL' || selectedDay === d)
            .map(day => {
              const daySlots = filteredSlots.filter(s => s.day_of_week === day);
              return (
                <div key={day} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
                  <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
                    <span className="font-bold text-sm tracking-wide">{day}</span>
                    <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-bold uppercase border border-indigo-400/30">
                      {daySlots.length} Lectures
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    {daySlots.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 italic">
                        No lectures scheduled for {day}
                      </div>
                    ) : (
                      daySlots.map(slot => (
                        <div key={slot.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 hover:bg-indigo-50/50 hover:border-indigo-200 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-indigo-600 flex items-center gap-1 text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-indigo-500" />
                              {slot.start_time} - {slot.end_time}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-600" />
                              {slot.room_number}
                            </span>
                          </div>

                          <p className="font-bold text-slate-900 text-xs">
                            {slot.subject_code ? `${slot.subject_code}: ` : ''}{slot.subject_name || 'Database Systems'}
                          </p>

                          <div className="flex items-center gap-1.5 text-slate-600 text-[11px] font-medium pt-1 border-t border-slate-200/60">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{slot.teacher_name || 'Prof. Hafiz Muhammad Yasir'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Add Slot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add Lecture Slot</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleAddSlot} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Class *</label>
                <select
                  required
                  value={formClassId}
                  onChange={e => setFormClassId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course / Subject *</label>
                <select
                  required
                  value={formSubjectId}
                  onChange={e => setFormSubjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code}: {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Instructor *</label>
                <select
                  required
                  value={formTeacherId}
                  onChange={e => setFormTeacherId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Teacher --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Day of Week</label>
                  <select
                    value={formDay}
                    onChange={e => setFormDay(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    {days.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room / Lab</label>
                  <input
                    type="text"
                    required
                    value={formRoom}
                    onChange={e => setFormRoom(e.target.value)}
                    placeholder="e.g. Lab-A, Room-302"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={e => setFormStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={e => setFormEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
