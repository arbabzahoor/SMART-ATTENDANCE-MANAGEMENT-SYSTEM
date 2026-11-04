import React, { useState } from 'react';
import { History, Search, ShieldCheck, User, Calendar, Terminal, Filter } from 'lucide-react';
import { ActivityLog } from '../types';
import { usePagination } from '../hooks/usePagination';
import { PaginationControls } from './PaginationControls';

interface ActivityLogsModuleProps {
  activityLogs: ActivityLog[];
}

export const ActivityLogsModule: React.FC<ActivityLogsModuleProps> = ({ activityLogs }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');

  const filtered = activityLogs.filter(log => {
    const matchesSearch =
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === 'ALL' || log.user_role === selectedRole;

    return matchesSearch && matchesRole;
  });
  const pagination = usePagination<ActivityLog>(filtered, JSON.stringify([searchTerm, selectedRole]));

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-600" />
            System Audit & Security Activity Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable audit log tracking all administrative actions, faculty attendance submissions, and student portal events.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          Audit Security Verified
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">Filter Role:</span>
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All System Roles</option>
            <option value="ADMIN">Admin / Principal</option>
            <option value="TEACHER">Faculty Teachers</option>
            <option value="STUDENT">Students</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action or user description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Action Event</th>
                <th className="px-6 py-4">Description Details</th>
                <th className="px-6 py-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    No activity audit logs matching criteria.
                  </td>
                </tr>
              ) : (
                pagination.items.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{log.user_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        log.user_role === 'ADMIN'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : log.user_role === 'TEACHER'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {log.user_role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600 text-[11px]">{log.action}</td>
                    <td className="px-6 py-4 text-slate-700 max-w-xs">{log.description}</td>
                    <td className="px-6 py-4 text-right font-mono text-[11px] text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls pagination={pagination} label="activity logs" />
      </div>

    </div>
  );
};
