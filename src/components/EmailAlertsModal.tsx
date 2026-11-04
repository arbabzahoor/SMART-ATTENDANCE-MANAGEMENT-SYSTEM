import React, { useState, useEffect } from 'react';
import { Mail, Send, CheckCircle2, AlertTriangle, RefreshCw, Clock, X, Eye, Inbox, ShieldAlert, Sparkles } from 'lucide-react';
import { EmailLog, Student } from '../types';

interface EmailAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
}

export const EmailAlertsModal: React.FC<EmailAlertsModalProps> = ({ isOpen, onClose, students }) => {
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [scanning, setScanning] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual Send State
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [customNote, setCustomNote] = useState<string>('');
  const [sendingManual, setSendingManual] = useState<boolean>(false);

  const fetchEmailLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/alerts/email-logs');
      if (res.ok) {
        const data = await res.json();
        setEmailLogs(data);
        if (data.length > 0 && !selectedEmail) {
          setSelectedEmail(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch email logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmailLogs();
    }
  }, [isOpen]);

  const handleTriggerAutomatedScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/alerts/trigger-automated-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        setToastMessage(data.message || `Automated scan dispatched ${data.count} warning emails.`);
        await fetchEmailLogs();
      }
    } catch (err) {
      setToastMessage('Error triggering automated email scan');
    } finally {
      setScanning(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleSendManualEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    setSendingManual(true);
    try {
      const res = await fetch('/api/alerts/send-individual-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: Number(selectedStudentId),
          custom_note: customNote,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMessage(`Warning email dispatched to ${data.email.recipient_email}`);
        setCustomNote('');
        setSelectedStudentId('');
        await fetchEmailLogs();
      }
    } catch (err) {
      setToastMessage('Failed to dispatch individual email alert.');
    } finally {
      setSendingManual(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Automated Low Attendance Email Service
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Simulated SMTP Active
                </span>
              </h3>
              <p className="text-xs text-slate-400">Alpine Degree College Khanpur • Student Threshold Alert System (&lt;75%)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerAutomatedScan}
              disabled={scanning}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scanning Students...' : 'Run Automated Email Scan Now'}
            </button>

            <button
              onClick={fetchEmailLogs}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl font-medium flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              Refresh Outbox
            </button>
          </div>

          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Automatic Trigger: On Attendance Drop below 75%</span>
          </div>
        </div>

        {/* Toast Notification Alert */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {toastMessage}
            </span>
            <button onClick={() => setToastMessage(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Split Body: Left Logs & Dispatch Form, Right Email HTML Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          
          {/* Left Column (5 Cols): Outbox Logs & Send Alert Form */}
          <div className="lg:col-span-5 border-r border-slate-200 bg-slate-50/50 p-4 flex flex-col gap-4 overflow-y-auto">
            
            {/* Quick Dispatch Section */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Send className="w-4 h-4 text-indigo-600" />
                Dispatch Manual Warning Alert
              </h4>
              <form onSubmit={handleSendManualEmail} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Select Student</label>
                  <select
                    value={selectedStudentId}
                    onChange={e => setSelectedStudentId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.roll_number}) - {s.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Optional Admin Note</label>
                  <input
                    type="text"
                    value={customNote}
                    onChange={e => setCustomNote(e.target.value)}
                    placeholder="e.g., Report to HoD office by Friday 10 AM"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingManual || !selectedStudentId}
                  className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sendingManual ? 'Dispatching...' : 'Send Warning Email Now'}
                </button>
              </form>
            </div>

            {/* Outbox Email Logs List */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                <span className="flex items-center gap-1.5">
                  <Inbox className="w-4 h-4 text-slate-500" />
                  Dispatched Email Logs ({emailLogs.length})
                </span>
                <span className="text-[10px] text-slate-400">Live Delivery Status</span>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                  Loading email outbox logs...
                </div>
              ) : emailLogs.length === 0 ? (
                <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                  No email alerts logged yet. Run an automated scan above!
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {emailLogs.map(log => {
                    const isSelected = selectedEmail?.id === log.id;
                    return (
                      <div
                        key={log.id}
                        onClick={() => setSelectedEmail(log)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-400 shadow-sm'
                            : 'bg-white border-slate-200 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900 truncate max-w-[180px]">
                            {log.recipient_name}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            {log.attendance_pct}% Att.
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 font-medium truncate mb-1">
                          {log.subject}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>{log.recipient_email}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right Column (7 Cols): Real-time Email Preview Window */}
          <div className="lg:col-span-7 bg-white p-6 flex flex-col overflow-y-auto">
            {selectedEmail ? (
              <div className="space-y-4">
                
                {/* Email Header Metadata Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900 text-sm">{selectedEmail.subject}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {selectedEmail.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                    <div><span className="font-semibold text-slate-800">From:</span> notifications@alpine.edu.pk</div>
                    <div><span className="font-semibold text-slate-800">To:</span> {selectedEmail.recipient_name} ({selectedEmail.recipient_email})</div>
                    <div><span className="font-semibold text-slate-800">Trigger Mode:</span> {selectedEmail.trigger_type}</div>
                    <div><span className="font-semibold text-slate-800">Sent At:</span> {new Date(selectedEmail.sent_at).toLocaleString()}</div>
                  </div>
                </div>

                {/* Simulated HTML Email Body Canvas */}
                <div className="border border-slate-200 rounded-xl p-4 shadow-sm bg-slate-100">
                  <div className="text-xs text-slate-400 mb-2 font-mono flex items-center justify-between">
                    <span>-- Rendered Email Document Preview --</span>
                    <span className="text-indigo-600 font-bold">Simulated Delivery</span>
                  </div>

                  <div 
                    className="bg-white rounded-lg p-4 border border-slate-200 shadow-inner"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                  />
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-400">
                <Mail className="w-12 h-12 stroke-[1.5] text-slate-300 mb-3" />
                <p className="font-bold text-slate-700">No Email Selected</p>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Select a dispatched email log from the left panel to inspect the delivered warning notice document.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
