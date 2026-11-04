import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Bell, Calendar, User, Search, X, Check, Pin, Tag } from 'lucide-react';
import { Announcement, Role } from '../types';

interface AnnouncementsModuleProps {
  userRole: Role;
}

export const AnnouncementsModule: React.FC<AnnouncementsModuleProps> = ({ userRole }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterAudience, setFilterAudience] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Announcement Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'STUDENTS' | 'TEACHERS'>('ALL');
  const [publishDate, setPublishDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('2026-08-30');

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          target_audience: targetAudience,
          publish_date: publishDate,
          expiry_date: expiryDate,
          status: 'ACTIVE',
        }),
      });

      if (res.ok) {
        setToastMessage('Announcement published successfully to campus noticeboard!');
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
        await fetchAnnouncements();
      }
    } catch (err) {
      console.error(err);
      setToastMessage('Failed to publish announcement');
    } finally {
      setSubmitting(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const filtered = announcements.filter(
    a => filterAudience === 'ALL' || a.target_audience === 'ALL' || a.target_audience === filterAudience
  );

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-indigo-600" />
            Campus Noticeboard & Official Announcements
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official communications, academic schedules, examination dates, and college event broadcasts for Alpine Degree College Khanpur.
          </p>
        </div>

        {userRole === 'ADMIN' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Post New Notice
          </button>
        )}
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

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-2">
        <span className="text-xs font-bold text-slate-500 mr-2">Target Audience:</span>
        {['ALL', 'STUDENTS', 'TEACHERS'].map(aud => (
          <button
            key={aud}
            onClick={() => setFilterAudience(aud)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterAudience === aud
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {aud === 'ALL' ? 'All Broadcasts' : aud === 'STUDENTS' ? 'Student Notices' : 'Faculty Notices'}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center text-xs text-slate-400">
            Loading official announcements...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center text-xs text-slate-400 italic">
            No active campus notices found.
          </div>
        ) : (
          filtered.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-3 hover:border-indigo-200 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Pin className="w-4 h-4" />
                  </span>
                  <span className="font-bold text-slate-900 text-base">{item.title}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Audience: {item.target_audience}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Published: {item.publish_date}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{item.description}</p>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>Issuer: Principal Office / IT Department</span>
                <span>Valid Until: {item.expiry_date}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Announcement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Post Official Announcement</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notice Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Exam Schedule Released"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Audience</label>
                <select
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Campus (Students & Faculty)</option>
                  <option value="STUDENTS">Students Only</option>
                  <option value="TEACHERS">Faculty Members Only</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notice Details *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide complete notice details, exam instructions, dates, or guidelines..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Publish Date</label>
                  <input
                    type="date"
                    value={publishDate}
                    onChange={e => setPublishDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
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
                  {submitting ? 'Publishing...' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
