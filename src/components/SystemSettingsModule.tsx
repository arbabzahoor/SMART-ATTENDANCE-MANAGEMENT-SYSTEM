import React, { useState } from 'react';
import { Settings, Save, Download, Database, CheckCircle2, Shield } from 'lucide-react';
import { InstitutionSetting } from '../types';

interface SystemSettingsModuleProps {
  settings: InstitutionSetting[];
  onRefresh: () => void;
}

export const SystemSettingsModule: React.FC<SystemSettingsModuleProps> = ({
  settings,
  onRefresh,
}) => {
  const [minThreshold, setMinThreshold] = useState<number>(75);
  const [editWindow, setEditWindow] = useState<number>(7);
  const [instName, setInstName] = useState<string>('Alpine Degree College Khanpur, Pakistan');
  const [academicYear, setAcademicYear] = useState<string>('2025-2026');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(false);

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'min_attendance_threshold',
          value: minThreshold.toString(),
        }),
      });

      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'attendance_edit_window_days',
          value: editWindow.toString(),
        }),
      });

      setSavedMsg(true);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-slate-800">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">System Global Configuration</h2>
            <p className="text-xs text-slate-500">Configure attendance policies, thresholds, and export XAMPP database files.</p>
          </div>
        </div>

        {savedMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Settings updated successfully! Global policy applied.</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
              <h3 className="font-bold text-sm text-indigo-700 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Attendance Policies
              </h3>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Minimum Required Attendance Threshold (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={minThreshold}
                  onChange={e => setMinThreshold(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Students falling below this limit trigger low attendance warnings.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Faculty Attendance Edit Window (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={editWindow}
                  onChange={e => setEditWindow(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Number of past days teachers are allowed to update saved attendance sheets.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
              <h3 className="font-bold text-sm text-indigo-700 flex items-center gap-2">
                <Database className="w-4 h-4" /> Institution Metadata & Database
              </h3>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Institution Name</label>
                <input
                  type="text"
                  value={instName}
                  onChange={e => setInstName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Academic Year</label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Settings...' : 'Save Configuration'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};
