import React, { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, AlertTriangle, Calendar, Info, Search, Filter, RefreshCw, Sparkles } from 'lucide-react';
import { NotificationItem } from '../types';
import { usePagination } from '../hooks/usePagination';
import { PaginationControls } from './PaginationControls';

interface NotificationCenterModuleProps {
  notifications: NotificationItem[];
  unreadCount: number;
  onRefresh: () => void;
}

export const NotificationCenterModule: React.FC<NotificationCenterModuleProps> = ({
  notifications,
  unreadCount,
  onRefresh,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleMarkRead = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      if (res.ok) {
        showToast('Notification marked as read');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'PUT' });
      if (res.ok) {
        showToast('All notifications marked as read');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Notification removed');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearRead = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications/clear-read', { method: 'DELETE' });
      if (res.ok) {
        showToast('Cleared read notifications');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = notifications.filter(n => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'UNREAD') return !n.is_read;
    if (filterType === 'WARNING') return n.type === 'WARNING';
    if (filterType === 'LEAVE') return n.type === 'LEAVE';
    if (filterType === 'INFO') return n.type === 'INFO';

    return true;
  });
  const pagination = usePagination<NotificationItem>(filtered, JSON.stringify([filterType, searchTerm]));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold relative">
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Notification & Alert Center
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time attendance warnings, leave approvals, and campus communications for Alpine Degree College Khanpur.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" /> Mark All Read
            </button>
          )}

          <button
            onClick={handleClearRead}
            disabled={loading}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4 text-slate-500" /> Clear Read
          </button>

          <button
            onClick={onRefresh}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
            title="Refresh notifications"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-slate-900 text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" /> {toastMessage}
          </span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: `All (${notifications.length})` },
            { id: 'UNREAD', label: `Unread (${unreadCount})` },
            { id: 'WARNING', label: 'Academic Warnings' },
            { id: 'LEAVE', label: 'Leave Alerts' },
            { id: 'INFO', label: 'System & Info' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No notifications found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are currently no alerts or notifications matching your filter criteria.
            </p>
          </div>
        ) : (
          pagination.items.map(item => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 shadow-xs ${
                !item.is_read
                  ? 'bg-indigo-50/40 border-indigo-200/80 shadow-indigo-100/20'
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3.5">
                {/* Type Icon */}
                <div className={`mt-0.5 p-2.5 rounded-xl flex items-center justify-center ${
                  item.type === 'WARNING'
                    ? 'bg-rose-100 text-rose-600'
                    : item.type === 'LEAVE'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-indigo-100 text-indigo-600'
                }`}>
                  {item.type === 'WARNING' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : item.type === 'LEAVE' ? (
                    <Calendar className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 text-sm">{item.title}</p>
                    {!item.is_read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{item.message}</p>
                  <p className="text-[11px] text-slate-400 font-medium pt-1">
                    {new Date(item.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 self-center">
                {!item.is_read && (
                  <button
                    onClick={() => handleMarkRead(item.id)}
                    className="p-2 text-indigo-600 hover:bg-indigo-100/60 rounded-xl transition-colors text-xs font-bold flex items-center gap-1"
                    title="Mark as Read"
                  >
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">Mark Read</span>
                  </button>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Delete Notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white shadow-xs">
        <PaginationControls pagination={pagination} label="notifications" />
      </div>

    </div>
  );
};
